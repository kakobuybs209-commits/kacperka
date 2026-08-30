'use strict';

/*
 * Pomocnik testowy: wycięcie sekcji FXTRK:CORE ze `fxlsereps.pl/script.js`
 * i uruchomienie jej w piaskownicy `node:vm`.
 *
 * Cel (wymaganie 1.2): testy czytają dokładnie ten kod, który trafia do
 * przeglądarki — zero duplikacji logiki w plikach testowych, zero plików
 * dodanych do katalogu wdrożenia strony statycznej.
 */

const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

/** Ścieżka do pliku strony statycznej (katalog wdrożenia, tylko do czytania). */
const SCRIPT_PATH = path.join(__dirname, '..', '..', '..', 'fxlsereps.pl', 'script.js');

const CORE_START = '/* ==== FXTRK:CORE START ==== */';
const CORE_END = '/* ==== FXTRK:CORE END ==== */';

/** Klucze, które sekcja CORE musi wyeksportować przez `window.FXTRK_CORE`. */
const CORE_EXPORT_KEYS = [
    'STATUS_PL',
    'CHINESE_TO_EN',
    'COUNTRY_MAP',
    'CITY_RULES',
    'GENERIC_COUNTRY_LABELS',
    'MILESTONES',
    'COUNTRY_DELTA',
    'TRK_KEYS'
];

let srcCache = null;

/**
 * Odczyt `script.js` jako tekstu. Wynik jest zapamiętywany, bo w jednym
 * przebiegu testów plik się nie zmienia, a testy własnościowe czytają go
 * wielokrotnie.
 *
 * @param {{ fresh?: boolean }} [options]
 * @returns {string}
 */
function readScriptSource(options) {
    const opts = options || {};
    if (opts.fresh || srcCache === null) {
        srcCache = fs.readFileSync(SCRIPT_PATH, 'utf8');
    }
    return srcCache;
}

/**
 * Wycięcie fragmentu tekstu między znacznikami sekcji.
 * Brak któregokolwiek znacznika albo znacznik końca przed znacznikiem
 * początku = błąd (granica sekcji jest częścią kontraktu).
 *
 * @param {string} source pełna treść `script.js`
 * @param {string} startMarker
 * @param {string} endMarker
 * @param {string} sectionName nazwa sekcji do komunikatu błędu
 * @returns {string} treść sekcji wraz ze znacznikiem początku
 */
function extractSection(source, startMarker, endMarker, sectionName) {
    if (typeof source !== 'string') {
        throw new TypeError('extractSection: `source` musi być łańcuchem znaków');
    }
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker);
    if (start < 0 || end < 0) {
        throw new Error('Brak znaczników sekcji ' + sectionName + ' w script.js');
    }
    if (end < start) {
        throw new Error('Znacznik końca sekcji ' + sectionName + ' wypada przed znacznikiem początku w script.js');
    }
    return source.slice(start, end);
}

/**
 * @param {{ fresh?: boolean }} [options]
 * @returns {boolean} czy `script.js` zawiera oba znaczniki sekcji CORE
 */
function hasCoreSection(options) {
    const src = readScriptSource(options);
    return src.indexOf(CORE_START) >= 0 && src.indexOf(CORE_END) >= 0;
}

/**
 * @param {{ fresh?: boolean }} [options]
 * @returns {string} źródło sekcji FXTRK:CORE
 */
function extractCoreSource(options) {
    return extractSection(readScriptSource(options), CORE_START, CORE_END, 'FXTRK:CORE');
}

let coreCache = null;

/**
 * Uruchomienie sekcji FXTRK:CORE w piaskownicy `node:vm` i zwrot eksportu.
 * Sekcja jest czysta (zero `document`, `window.location`, `fetch`), więc
 * piaskownica dostaje wyłącznie puste `window` i `console`.
 *
 * @param {{ fresh?: boolean }} [options] `fresh: true` — nowa, niewspółdzielona instancja
 * @returns {object} `sandbox.window.FXTRK_CORE`
 */
function loadCore(options) {
    const opts = options || {};
    if (!opts.fresh && coreCache !== null) return coreCache;

    const source = extractCoreSource(opts);
    const sandbox = { window: {}, console };
    vm.createContext(sandbox);
    new vm.Script(source, { filename: 'script.js#FXTRK:CORE' }).runInContext(sandbox);

    const core = sandbox.window.FXTRK_CORE;
    if (!core || typeof core !== 'object') {
        throw new Error('Sekcja FXTRK:CORE nie wyeksportowała obiektu window.FXTRK_CORE');
    }
    if (!opts.fresh) coreCache = core;
    return core;
}

module.exports = {
    SCRIPT_PATH,
    CORE_START,
    CORE_END,
    CORE_EXPORT_KEYS,
    readScriptSource,
    extractSection,
    extractCoreSource,
    hasCoreSection,
    loadCore
};
