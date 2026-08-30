'use strict';

/**
 * parseUpstream — parser HTML odpowiedzi Serwera_Upstream.
 *
 * Wymagania: 1.3, 2.8, 2.9, 3.5, 3.11, 3.12
 *
 * Funkcja przyjmuje surowy HTML z Serwera_Upstream i zwraca:
 *   { mainInfo: Informacje_Główne, events: Zdarzenie_Śledzenia[] }
 *
 * Zerem pól `Przewidywana dostawa`, `Data dostawy`, `Aktualna lokalizacja`
 * — funkcja calculateEstimatedDelivery NIE jest portowana na serwer.
 */

const cheerio = require('cheerio');
const { translateStatus } = require('./statusTranslator');
const { normalizeLocation } = require('./locationNormalizer');

/** Tekst zastępczy dla pustych pól nagłówkowych (wymaganie 2.8) */
const MISSING_FIELD = 'Brak danych';

/**
 * Zwraca true, gdy new Date(str) daje prawidłową datę.
 * @param {string} str
 * @returns {boolean}
 */
function isValidDate(str) {
    if (!str || typeof str !== 'string' || str.trim() === '') return false;
    const d = new Date(str);
    return !isNaN(d.getTime());
}

/**
 * Czyści pole Odbiorca zgodnie z wymaganiem 3.12:
 *   1. Usuń przedrostek `签收` z początku
 *   2. Usuń fragmenty "Poland, The shipment has been..." i podobne
 *   3. Usuń samodzielną nazwę kraju na końcu (np. "Poland" lub "/Poland")
 *   4. trim(); jeśli wynik pusty → MISSING_FIELD
 *
 * @param {string} text
 * @returns {string}
 */
function cleanRecipient(text) {
    if (!text || typeof text !== 'string') return MISSING_FIELD;

    let r = text;

    // Krok 1: Usuń przedrostek 签收
    r = r.replace(/^签收/, '').trim();

    // Krok 2: Usuń fragmenty statusu dostawy ("Poland, The shipment has been...")
    // Wzorzec: "Poland," lub "Poland ," (z opcjonalną spacją) po którym następuje tekst statusu
    r = r.replace(/Poland,?\s*The shipment has been[^/]*(\/\s*)?/gi, '').trim();
    // Ogólniejszy wzorzec: "Poland,\s*<tekst>" - po Poland i przecinku wszystko do końca lub "/"
    r = r.replace(/Poland,\s*[A-Z][^/]*(\/\s*)?/g, '').trim();

    // Krok 3: Usuń samodzielną nazwę kraju na końcu (/ Poland lub Poland)
    r = r.replace(/\s*\/\s*Poland\s*$/i, '').trim();
    r = r.replace(/,?\s*Poland\s*$/i, '').trim();

    // Finalne trim
    r = r.trim();

    // Wymaganie 2.8: pusty wynik → tekst zastępczy
    return r || MISSING_FIELD;
}

/**
 * Parsuje HTML z Serwera_Upstream i zwraca dane ustrukturyzowane.
 *
 * @param {string} html - surowy HTML z Serwera_Upstream
 * @returns {{ mainInfo: Object, events: Array }}
 */
function parseUpstream(html) {
    const $ = cheerio.load(html || '', { decodeEntities: false });

    // ─── Parsowanie Zdarzeń_Śledzenia z wierszy tabeli ───────────────────────
    // Wymaganie 3.11: OriginalDate/OriginalLocation/OriginalStatus znak w znak
    // Wymaganie 3.12: błąd w wierszu nie przerywa reszty
    const events = [];

    $('table tr').each((index, element) => {
        try {
            const date = $(element).find('td:nth-child(1)').text().trim();
            const location = $(element).find('td:nth-child(2)').text().trim();
            const record = $(element).find('td:nth-child(3)').text().trim();

            // Pomiń wiersze bez daty i statusu
            if (!date || !record) return;

            events.push({
                Data: date,
                Lokalizacja: normalizeLocation(location),
                Status: translateStatus(record),
                OriginalDate: date,        // znak w znak (wymaganie 3.11)
                OriginalLocation: location, // znak w znak
                OriginalStatus: record      // znak w znak
            });
        } catch (err) {
            // Wymaganie 3.12: błąd w pojedynczym wierszu nie przerywa przetwarzania
            // (kontynuuj z następnym wierszem)
        }
    });

    // ─── Sortowanie stabilne malejąco po OriginalDate (wymaganie 2.9) ────────
    // Daty nieparsowalne trafiają na koniec listy.
    // Stabilność: Node.js Array.prototype.sort jest stabilny (ES2019+).
    events.sort((a, b) => {
        const validA = isValidDate(a.OriginalDate);
        const validB = isValidDate(b.OriginalDate);

        if (!validA && !validB) return 0;   // obydwie nieparsowalne → zachowaj kolejność
        if (!validA) return 1;              // a nieparsowalna → a na koniec
        if (!validB) return -1;             // b nieparsowalna → b na koniec

        const dateA = new Date(a.OriginalDate);
        const dateB = new Date(b.OriginalDate);
        return dateB - dateA;               // malejąco (najnowsze pierwsze)
    });

    // ─── Parsowanie Informacje_Główne z `.menu_ ul:nth-child(2) li` ──────────
    // Wymaganie 2.8: dokładnie 6 pól; brak/pusty → "Brak danych"
    const mainInfo = {
        'Numer referencyjny': MISSING_FIELD,
        'Numer śledzenia':    MISSING_FIELD,
        'Kraj':               MISSING_FIELD,
        'Data':               MISSING_FIELD,
        'Ostatni status':     MISSING_FIELD,
        'Odbiorca':           MISSING_FIELD
    };

    $('.menu_ ul:nth-child(2) li').each((index, element) => {
        const text = $(element).text().trim();
        const value = text || MISSING_FIELD;

        if (index === 0) {
            mainInfo['Numer referencyjny'] = value;
        } else if (index === 1) {
            mainInfo['Numer śledzenia'] = value;
        } else if (index === 2) {
            mainInfo['Kraj'] = value;
        } else if (index === 3) {
            mainInfo['Data'] = value;
        } else if (index === 4) {
            // Wymaganie 2.8: Ostatni status = tekst przed pierwszym `/` przez Tłumacz_Statusów
            const beforeSlash = text.split('/')[0].trim();
            mainInfo['Ostatni status'] = translateStatus(beforeSlash) || MISSING_FIELD;
        } else if (index === 5) {
            // Wymaganie 3.12: oczyszczenie pola Odbiorca
            mainInfo['Odbiorca'] = cleanRecipient(text);
        }
    });

    return { mainInfo, events };
}

module.exports = { parseUpstream };
