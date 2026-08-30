'use strict';

/*
 * Pomocnik testowy: wycięcie sekcji FXTRK:UI ze `fxlsereps.pl/script.js`
 * i uruchomienie jej w kontekście `jsdom` (document/window) razem z sekcją
 * FXTRK:CORE, z atrapami `fetch`, `localStorage`, `navigator.clipboard`
 * i sterowanym dostawcą czasu.
 *
 * Wymaganie 1.2: zero duplikacji logiki w plikach testowych, zero plików
 * dodanych do `fxlsereps.pl/`.
 */

const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const {
    readScriptSource,
    extractSection,
    extractCoreSource
} = require('./loadCore');

const UI_START = '/* ==== FXTRK:UI START ==== */';
const UI_END = '/* ==== FXTRK:UI END ==== */';

/** Szkielet Widoku_Śledzenia odpowiadający `index.html` po zadaniu 14.2. */
const DEFAULT_HTML = [
    '<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8"><title>test</title></head><body>',
    '<div id="tracking-view" class="main-view hidden tool-view">',
    '  <div class="tool-hero" data-fxtrk-nolocale>',
    '    <h1 class="tool-hero__title">Track Your Package</h1>',
    '    <div class="tool-input-row">',
    '      <div class="tool-input-wrap">',
    '        <input type="text" id="YQNum" class="tool-input" maxlength="60">',
    '      </div>',
    '      <button class="tool-btn" id="YQBtn">Track</button>',
    '    </div>',
    '  </div>',
    '  <div id="YQContainer" class="tool-results" data-fxtrk-nolocale></div>',
    '</div>',
    '</body></html>'
].join('\n');

const DEFAULT_URL = 'https://fxlsereps.pl/';

/* ─────────────────────────── Sterowany zegar ─────────────────────────── */

/**
 * Zegar sterowany testem: `now()` zwraca znacznik czasu w ms, `setTimeout`
 * rejestruje zadanie, `tick(ms)` przesuwa czas i uruchamia zadania należne.
 * Testy nigdy nie czekają na prawdziwy zegar.
 *
 * @param {number} [startMs]
 */
function createClock(startMs) {
    let nowMs = typeof startMs === 'number' ? startMs : Date.UTC(2024, 0, 1, 12, 0, 0);
    let nextId = 1;
    const timers = new Map();

    function setTimeoutMock(fn, delay) {
        const id = nextId++;
        const args = Array.prototype.slice.call(arguments, 2);
        timers.set(id, {
            id,
            fn,
            args,
            dueAt: nowMs + (Number(delay) > 0 ? Number(delay) : 0)
        });
        return id;
    }

    function clearTimeoutMock(id) {
        timers.delete(id);
    }

    return {
        now: function () { return nowMs; },
        date: function () { return new Date(nowMs); },
        setTimeout: setTimeoutMock,
        clearTimeout: clearTimeoutMock,
        /** Liczba zadań oczekujących — pozwala sprawdzić czyszczenie timerów. */
        pendingCount: function () { return timers.size; },
        pendingDelays: function () {
            return Array.from(timers.values()).map(function (t) { return t.dueAt - nowMs; });
        },
        /**
         * Przesunięcie czasu o `ms` i uruchomienie zadań należnych
         * w kolejności terminu, a przy równym terminie — kolejności zgłoszenia.
         * @param {number} ms
         */
        tick: function (ms) {
            const target = nowMs + (Number(ms) > 0 ? Number(ms) : 0);
            for (;;) {
                const due = Array.from(timers.values())
                    .filter(function (t) { return t.dueAt <= target; })
                    .sort(function (a, b) { return a.dueAt - b.dueAt || a.id - b.id; });
                if (due.length === 0) break;
                const timer = due[0];
                timers.delete(timer.id);
                nowMs = Math.max(nowMs, timer.dueAt);
                timer.fn.apply(null, timer.args);
            }
            nowMs = target;
        },
        /** Przesunięcie czasu bez uruchamiania zadań. */
        set: function (ms) { nowMs = Number(ms); }
    };
}

/* ───────────────────────────── Atrapa fetch ──────────────────────────── */

/**
 * Minimalna odpowiedź zgodna z tym, co czyta UI: `ok`, `status`,
 * `headers.get()`, `json()`, `text()`.
 *
 * @param {{ status?: number, body?: any, text?: string, headers?: object, jsonError?: Error }} [spec]
 */
function createResponse(spec) {
    const s = spec || {};
    const status = typeof s.status === 'number' ? s.status : 200;
    const headers = {};
    Object.keys(s.headers || {}).forEach(function (name) {
        headers[String(name).toLowerCase()] = String(s.headers[name]);
    });
    const bodyText = typeof s.text === 'string'
        ? s.text
        : (s.body === undefined ? '' : JSON.stringify(s.body));

    return {
        ok: status >= 200 && status < 300,
        status: status,
        headers: {
            get: function (name) {
                const key = String(name).toLowerCase();
                return Object.prototype.hasOwnProperty.call(headers, key) ? headers[key] : null;
            }
        },
        text: function () { return Promise.resolve(bodyText); },
        json: function () {
            if (s.jsonError) return Promise.reject(s.jsonError);
            try {
                return Promise.resolve(JSON.parse(bodyText));
            } catch (err) {
                return Promise.reject(err);
            }
        }
    };
}

/**
 * Atrapa `fetch` z zapisem wywołań i wymienialnym zachowaniem.
 * Domyślnie zwraca 200 z pustą, poprawną Odpowiedzią_Śledzenia.
 */
function createFetchMock() {
    let handler = function () {
        return Promise.resolve(createResponse({
            status: 200,
            body: { success: true, 'Informacje_główne': {}, 'Szczegóły_przesyłki': [] },
            headers: { 'content-type': 'application/json' }
        }));
    };

    function fetchMock(url, init) {
        fetchMock.calls.push({ url: String(url), init: init || {} });
        try {
            return Promise.resolve(handler(String(url), init || {}));
        } catch (err) {
            return Promise.reject(err);
        }
    }

    fetchMock.calls = [];
    /** @param {(url: string, init: object) => any} fn */
    fetchMock.setHandler = function (fn) { handler = fn; return fetchMock; };
    /** @param {object} spec przekazywany do `createResponse` */
    fetchMock.respondWith = function (spec) {
        handler = function () { return Promise.resolve(createResponse(spec)); };
        return fetchMock;
    };
    /** @param {Error} [err] odrzucenie obietnicy `fetch` (błąd połączenia) */
    fetchMock.rejectWith = function (err) {
        handler = function () { return Promise.reject(err || new Error('network error')); };
        return fetchMock;
    };
    /** Obietnica, która nigdy się nie rozstrzyga — do testów limitów czasu. */
    fetchMock.hang = function () {
        handler = function () { return new Promise(function () {}); };
        return fetchMock;
    };
    fetchMock.reset = function () { fetchMock.calls.length = 0; return fetchMock; };

    return fetchMock;
}

/* ─────────────────────── Atrapa localStorage ─────────────────────────── */

/**
 * `localStorage` traktowane jako wejście niezaufane: atrapa pozwala wstrzyknąć
 * dowolną wartość i wymusić wyjątek na wybranej metodzie.
 *
 * @param {Record<string,string>} [initial]
 */
function createLocalStorageMock(initial) {
    const store = new Map();
    Object.keys(initial || {}).forEach(function (k) { store.set(String(k), String(initial[k])); });

    const failures = new Map();
    function guard(method) {
        if (failures.has(method)) throw failures.get(method);
    }

    return {
        getItem: function (key) {
            guard('getItem');
            const k = String(key);
            return store.has(k) ? store.get(k) : null;
        },
        setItem: function (key, value) {
            guard('setItem');
            store.set(String(key), String(value));
        },
        removeItem: function (key) {
            guard('removeItem');
            store.delete(String(key));
        },
        clear: function () {
            guard('clear');
            store.clear();
        },
        get length() { return store.size; },
        key: function (index) {
            const keys = Array.from(store.keys());
            return index >= 0 && index < keys.length ? keys[index] : null;
        },
        /** @param {'getItem'|'setItem'|'removeItem'|'clear'} method @param {Error|null} error */
        setFailure: function (method, error) {
            if (error) failures.set(method, error);
            else failures.delete(method);
        },
        _store: store
    };
}

/* ─────────────────────── Atrapa navigator.clipboard ─────────────────── */

/**
 * Atrapa schowka z zapisem zapisanych wartości i trybem odrzucenia obietnicy.
 */
function createClipboardMock() {
    let mode = 'resolve';
    let error = null;

    const clipboard = {
        writes: [],
        writeText: function (value) {
            clipboard.writes.push(String(value));
            if (mode === 'reject') return Promise.reject(error || new Error('clipboard denied'));
            return Promise.resolve();
        },
        /** @param {Error} [err] kolejne wywołania odrzucają obietnicę */
        failWith: function (err) { mode = 'reject'; error = err || null; return clipboard; },
        succeed: function () { mode = 'resolve'; error = null; return clipboard; },
        reset: function () { clipboard.writes.length = 0; return clipboard; }
    };

    return clipboard;
}

/* ────────────────────────── Wycięcie sekcji UI ───────────────────────── */

/**
 * @param {{ fresh?: boolean }} [options]
 * @returns {boolean} czy `script.js` zawiera oba znaczniki sekcji UI
 */
function hasUiSection(options) {
    const src = readScriptSource(options);
    return src.indexOf(UI_START) >= 0 && src.indexOf(UI_END) >= 0;
}

/**
 * @param {{ fresh?: boolean }} [options]
 * @returns {string} źródło sekcji FXTRK:UI
 */
function extractUiSource(options) {
    return extractSection(readScriptSource(options), UI_START, UI_END, 'FXTRK:UI');
}

/**
 * Uruchomienie sekcji FXTRK:CORE i FXTRK:UI w jednym kontekście `jsdom`.
 *
 * @param {{
 *   html?: string,
 *   url?: string,
 *   startTime?: number,
 *   lastTrackingCode?: string,
 *   localStorage?: object|false,
 *   clipboard?: object|false,
 *   fetch?: Function|false,
 *   clock?: object,
 *   installClock?: boolean,
 *   fresh?: boolean
 * }} [options]
 * @returns {{ dom: object, window: object, document: object, core: object,
 *   ui: object|undefined, fetchMock: Function|undefined, localStorage: object|undefined,
 *   clipboard: object|undefined, clock: object, run: Function, destroy: Function }}
 */
function loadUi(options) {
    const opts = options || {};
    const uiSource = extractUiSource(opts); // brak znaczników = błąd

    const dom = new JSDOM(typeof opts.html === 'string' ? opts.html : DEFAULT_HTML, {
        url: opts.url || DEFAULT_URL,
        runScripts: 'outside-only',
        pretendToBeVisual: true
    });
    const win = dom.window;
    const context = dom.getInternalVMContext();

    /* Sterowany dostawca czasu */
    const clock = opts.clock || createClock(opts.startTime);
    if (opts.installClock !== false) {
        win.setTimeout = clock.setTimeout;
        win.clearTimeout = clock.clearTimeout;
        win.Date.now = clock.now;
        win.FXTRK_TEST_CLOCK = clock;
    }

    /* Atrapa fetch */
    let fetchMock;
    if (opts.fetch === false) {
        delete win.fetch;
    } else {
        fetchMock = typeof opts.fetch === 'function' ? opts.fetch : createFetchMock();
        win.fetch = fetchMock;
    }

    /* Atrapa localStorage */
    let localStorageMock;
    if (opts.localStorage === false) {
        Object.defineProperty(win, 'localStorage', {
            configurable: true,
            get: function () { throw new Error('localStorage niedostępny'); }
        });
    } else {
        const initial = {};
        if (typeof opts.lastTrackingCode === 'string') initial.last_tracking_code = opts.lastTrackingCode;
        localStorageMock = opts.localStorage && typeof opts.localStorage === 'object'
            ? opts.localStorage
            : createLocalStorageMock(initial);
        Object.defineProperty(win, 'localStorage', {
            configurable: true,
            writable: true,
            value: localStorageMock
        });
    }

    /* Atrapa navigator.clipboard */
    let clipboardMock;
    if (opts.clipboard === false) {
        Object.defineProperty(win.navigator, 'clipboard', {
            configurable: true,
            writable: true,
            value: undefined
        });
    } else {
        clipboardMock = opts.clipboard && typeof opts.clipboard === 'object'
            ? opts.clipboard
            : createClipboardMock();
        Object.defineProperty(win.navigator, 'clipboard', {
            configurable: true,
            writable: true,
            value: clipboardMock
        });
    }

    /** Uruchomienie dodatkowego fragmentu `script.js` w tym samym kontekście. */
    function run(source, filename) {
        return new vm.Script(source, { filename: filename || 'script.js#fragment' }).runInContext(context);
    }

    /* Kolejność ma znaczenie: UI korzysta z window.FXTRK_CORE */
    run(extractCoreSource(opts), 'script.js#FXTRK:CORE');
    run(uiSource, 'script.js#FXTRK:UI');

    return {
        dom: dom,
        window: win,
        document: win.document,
        core: win.FXTRK_CORE,
        ui: win.FXTRK_UI,
        fetchMock: fetchMock,
        localStorage: localStorageMock,
        clipboard: clipboardMock,
        clock: clock,
        run: run,
        destroy: function () { dom.window.close(); }
    };
}

module.exports = {
    UI_START,
    UI_END,
    DEFAULT_HTML,
    DEFAULT_URL,
    hasUiSection,
    extractUiSource,
    loadUi,
    createClock,
    createFetchMock,
    createResponse,
    createLocalStorageMock,
    createClipboardMock
};
