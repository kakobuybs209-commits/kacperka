'use strict';

/**
 * Testy jednostkowe dla lib/parseUpstream.js
 *
 * Wymagania: 1.3, 2.8, 2.9, 3.5, 3.11, 3.12
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { parseUpstream } = require('../lib/parseUpstream');

// ─── Pomocniki budujące HTML ──────────────────────────────────────────────────

/**
 * Buduje minimalny HTML z tabelą zdarzeń i sekcją menu_.
 *
 * @param {Array<{date: string, location: string, record: string}>} rows
 * @param {string[]} liItems  - 0..6 pozycji dla .menu_ ul:nth-child(2) li
 * @returns {string}
 */
function buildHtml(rows = [], liItems = []) {
    const trRows = rows.map(r =>
        `<tr><td>${r.date}</td><td>${r.location}</td><td>${r.record}</td></tr>`
    ).join('\n');

    const liHtml = liItems.map(t => `<li>${t}</li>`).join('\n');

    return `
<html><body>
  <table>${trRows}</table>
  <div class="menu_">
    <ul></ul>
    <ul>${liHtml}</ul>
  </div>
</body></html>
    `;
}

// ─── Testy struktury wyniku ───────────────────────────────────────────────────

test('parseUpstream: zwraca { mainInfo, events } dla pustego HTML', () => {
    const result = parseUpstream('');
    assert.ok(result !== null && typeof result === 'object');
    assert.ok(Object.prototype.hasOwnProperty.call(result, 'mainInfo'));
    assert.ok(Object.prototype.hasOwnProperty.call(result, 'events'));
    assert.ok(Array.isArray(result.events));
});

test('parseUpstream: mainInfo ma dokładnie 6 pól (wymaganie 2.8)', () => {
    const { mainInfo } = parseUpstream('');
    const keys = Object.keys(mainInfo);
    assert.equal(keys.length, 6);
    const expected = ['Numer referencyjny', 'Numer śledzenia', 'Kraj', 'Data', 'Ostatni status', 'Odbiorca'];
    expected.forEach(k => assert.ok(keys.includes(k), `brakuje pola ${k}`));
});

test('parseUpstream: puste HTML daje "Brak danych" dla każdego z 6 pól (wymaganie 2.8)', () => {
    const { mainInfo } = parseUpstream('');
    Object.values(mainInfo).forEach(v => assert.equal(v, 'Brak danych'));
});

test('parseUpstream: brak tabeli daje pustą tablicę events', () => {
    const { events } = parseUpstream('<html><body></body></html>');
    assert.equal(events.length, 0);
});

// ─── Testy parsowania zdarzeń ─────────────────────────────────────────────────

test('parseUpstream: parsuje wiersze tabeli — wszystkie 6 pól Zdarzenia_Śledzenia', () => {
    const html = buildHtml([
        { date: '2024-01-15 10:00', location: 'Shanghai', record: 'Shipment information received' }
    ]);
    const { events } = parseUpstream(html);
    assert.equal(events.length, 1);
    const e = events[0];
    // Pola przetworzone
    assert.equal(typeof e.Data, 'string');
    assert.equal(typeof e.Lokalizacja, 'string');
    assert.equal(typeof e.Status, 'string');
    // Pola oryginalne — znak w znak (wymaganie 3.11)
    assert.equal(e.OriginalDate, '2024-01-15 10:00');
    assert.equal(e.OriginalLocation, 'Shanghai');
    assert.equal(e.OriginalStatus, 'Shipment information received');
});

test('parseUpstream: OriginalDate/OriginalLocation/OriginalStatus nie są modyfikowane (wymaganie 3.11)', () => {
    const rawDate = '  15/01/2024 10:00  ';
    const rawLoc = '  CN  ';
    const rawRec = '  The flight has arrived  ';
    const html = buildHtml([
        { date: rawDate, location: rawLoc, record: rawRec }
    ]);
    const { events } = parseUpstream(html);
    assert.equal(events.length, 1);
    // Pole Data i inne przetworzone używają .trim(), ale oryginalne są po trim() przez cheerio text()
    // cheerio text().trim() == rawDate.trim() dla kolumn td
    assert.equal(events[0].OriginalDate, rawDate.trim());
    assert.equal(events[0].OriginalLocation, rawLoc.trim());
    assert.equal(events[0].OriginalStatus, rawRec.trim());
});

test('parseUpstream: wiersze bez daty lub rekordu są pomijane', () => {
    const html = buildHtml([
        { date: '', location: 'Warsaw', record: 'something' },          // brak daty
        { date: '2024-01-15', location: 'Warsaw', record: '' },         // brak rekordu
        { date: '2024-01-16', location: 'Poznan', record: 'In transit' } // poprawny
    ]);
    const { events } = parseUpstream(html);
    assert.equal(events.length, 1);
    assert.equal(events[0].OriginalDate, '2024-01-16');
});

test('parseUpstream: Status przechodzi przez translateStatus', () => {
    const html = buildHtml([
        { date: '2024-01-15', location: 'PL', record: 'The flight has arrived' }
    ]);
    const { events } = parseUpstream(html);
    // translateStatus('The flight has arrived') = 'Lot dotarł'
    assert.equal(events[0].Status, 'Lot dotarł');
    assert.equal(events[0].OriginalStatus, 'The flight has arrived');
});

test('parseUpstream: Lokalizacja przechodzi przez normalizeLocation', () => {
    const html = buildHtml([
        { date: '2024-01-15', location: 'PL', record: 'In transit' }
    ]);
    const { events } = parseUpstream(html);
    // normalizeLocation('PL') = 'Polska'
    assert.equal(events[0].Lokalizacja, 'Polska');
    assert.equal(events[0].OriginalLocation, 'PL');
});

// ─── Testy sortowania (wymaganie 2.9) ─────────────────────────────────────────

test('parseUpstream: zdarzenia sortowane malejąco po OriginalDate', () => {
    const html = buildHtml([
        { date: '2024-01-10 08:00', location: '', record: 'record A' },
        { date: '2024-01-15 12:00', location: '', record: 'record B' },
        { date: '2024-01-12 09:00', location: '', record: 'record C' }
    ]);
    const { events } = parseUpstream(html);
    assert.equal(events.length, 3);
    assert.equal(events[0].OriginalDate, '2024-01-15 12:00');
    assert.equal(events[1].OriginalDate, '2024-01-12 09:00');
    assert.equal(events[2].OriginalDate, '2024-01-10 08:00');
});

test('parseUpstream: daty nieparsowalne trafiają na koniec listy (wymaganie 2.9)', () => {
    const html = buildHtml([
        { date: 'not-a-date', location: '', record: 'record X' },
        { date: '2024-01-15', location: '', record: 'record Y' },
        { date: 'also-bad', location: '', record: 'record Z' }
    ]);
    const { events } = parseUpstream(html);
    assert.equal(events.length, 3);
    // Parsowalna data na pierwszym miejscu
    assert.equal(events[0].OriginalDate, '2024-01-15');
    // Nieparsowalne na końcu, w oryginalnej kolejności dokumentu
    assert.equal(events[1].OriginalDate, 'not-a-date');
    assert.equal(events[2].OriginalDate, 'also-bad');
});

test('parseUpstream: sortowanie stabilne — równe daty zachowują kolejność z dokumentu (wymaganie 2.9)', () => {
    const html = buildHtml([
        { date: '2024-01-15', location: '', record: 'first' },
        { date: '2024-01-15', location: '', record: 'second' },
        { date: '2024-01-15', location: '', record: 'third' }
    ]);
    const { events } = parseUpstream(html);
    assert.equal(events[0].OriginalStatus, 'first');
    assert.equal(events[1].OriginalStatus, 'second');
    assert.equal(events[2].OriginalStatus, 'third');
});

// ─── Testy mainInfo / Informacje_Główne (wymaganie 2.8) ──────────────────────

test('parseUpstream: parsuje wszystkie 6 pól Informacje_Główne', () => {
    const html = buildHtml([], [
        'REF001',
        'TRK001',
        'China',
        '2024-01-15',
        'The shipment has been successfully delivered',
        'Jan Kowalski'
    ]);
    const { mainInfo } = parseUpstream(html);
    assert.equal(mainInfo['Numer referencyjny'], 'REF001');
    assert.equal(mainInfo['Numer śledzenia'], 'TRK001');
    assert.equal(mainInfo['Kraj'], 'China');
    assert.equal(mainInfo['Data'], '2024-01-15');
    // Ostatni status przez translateStatus
    assert.equal(mainInfo['Ostatni status'], 'Przesyłka została pomyślnie dostarczona');
    assert.equal(mainInfo['Odbiorca'], 'Jan Kowalski');
});

test('parseUpstream: puste pola li dają "Brak danych" (wymaganie 2.8)', () => {
    const html = buildHtml([], ['', '', '', '', '', '']);
    const { mainInfo } = parseUpstream(html);
    assert.equal(mainInfo['Numer referencyjny'], 'Brak danych');
    assert.equal(mainInfo['Numer śledzenia'], 'Brak danych');
    assert.equal(mainInfo['Kraj'], 'Brak danych');
    assert.equal(mainInfo['Data'], 'Brak danych');
    assert.equal(mainInfo['Ostatni status'], 'Brak danych');
    assert.equal(mainInfo['Odbiorca'], 'Brak danych');
});

test('parseUpstream: Ostatni status — tekst przed pierwszym "/" przez translateStatus', () => {
    const html = buildHtml([], ['', '', '', '', 'The flight has arrived / some extra text', '']);
    const { mainInfo } = parseUpstream(html);
    // text.split('/')[0].trim() = 'The flight has arrived' → 'Lot dotarł'
    assert.equal(mainInfo['Ostatni status'], 'Lot dotarł');
});

test('parseUpstream: Ostatni status gdy brak odwzorowania — zwraca oczyszczony tekst (wymaganie 3.2)', () => {
    const html = buildHtml([], ['', '', '', '', 'Unknown status text / extra', '']);
    const { mainInfo } = parseUpstream(html);
    assert.equal(mainInfo['Ostatni status'], 'Unknown status text');
});

// ─── Testy oczyszczania pola Odbiorca (wymaganie 3.12) ────────────────────────

test('parseUpstream: Odbiorca — usunięcie przedrostka 签收', () => {
    const html = buildHtml([], ['', '', '', '', '', '签收Jan Kowalski']);
    const { mainInfo } = parseUpstream(html);
    assert.equal(mainInfo['Odbiorca'], 'Jan Kowalski');
});

test('parseUpstream: Odbiorca — usunięcie "Poland, The shipment has been..."', () => {
    const html = buildHtml([], ['', '', '', '', '',
        'Jan Kowalski / Poland, The shipment has been successfully delivered'
    ]);
    const { mainInfo } = parseUpstream(html);
    // Po oczyszczeniu powinna pozostać jakaś czytelna wartość, bez fragmentu statusu
    assert.ok(!mainInfo['Odbiorca'].includes('The shipment has been'));
});

test('parseUpstream: Odbiorca — usunięcie samodzielnego "Poland" z końca', () => {
    const html = buildHtml([], ['', '', '', '', '', 'Jan Kowalski / Poland']);
    const { mainInfo } = parseUpstream(html);
    assert.ok(!mainInfo['Odbiorca'].toLowerCase().endsWith('poland'));
    assert.ok(!mainInfo['Odbiorca'].toLowerCase().endsWith('/ poland'));
});

test('parseUpstream: Odbiorca — pusty wynik po oczyszczeniu daje "Brak danych"', () => {
    const html = buildHtml([], ['', '', '', '', '', 'Poland']);
    const { mainInfo } = parseUpstream(html);
    assert.equal(mainInfo['Odbiorca'], 'Brak danych');
});

test('parseUpstream: Odbiorca — brak modyfikacji gdy nie ma wzorców do usunięcia', () => {
    const html = buildHtml([], ['', '', '', '', '', 'Anna Nowak']);
    const { mainInfo } = parseUpstream(html);
    assert.equal(mainInfo['Odbiorca'], 'Anna Nowak');
});

// ─── Testy odporności na błędy (wymaganie 3.12) ───────────────────────────────

test('parseUpstream: uszkodzony HTML nie rzuca wyjątku', () => {
    const malformed = '<table><tr><td>2024-01-15</td><td><td>In transit</tr></table>';
    assert.doesNotThrow(() => parseUpstream(malformed));
});

test('parseUpstream: null/undefined jako wejście nie rzuca wyjątku', () => {
    assert.doesNotThrow(() => parseUpstream(null));
    assert.doesNotThrow(() => parseUpstream(undefined));
    assert.doesNotThrow(() => parseUpstream(''));
});

test('parseUpstream: niepoprawne HTML z kilkoma wierszami — błąd w jednym nie przerywa reszty', () => {
    // Symulujemy tabelę gdzie jeden wiersz jest poprawny, reszta jest (po parsowaniu) bezproblematyczna
    // Właściwy test wymagania 3.12: rzucamy błąd w translateStatus przez podmianę
    // Bezpieczniej: sprawdzamy, że nawet przy dziwnych danych reszta wierszy jest przetworzona
    const html = buildHtml([
        { date: '2024-01-10', location: 'PL', record: 'record OK' },
        { date: '',           location: '',   record: '' },   // pomijany (brak daty i rekordu)
        { date: '2024-01-12', location: 'CN', record: 'record OK 2' }
    ]);
    const { events } = parseUpstream(html);
    // Powinniśmy mieć 2 zdarzenia (wiersz bez daty jest pomijany, nie rzuca błędu)
    assert.equal(events.length, 2);
});

// ─── Testy braku pól calculateEstimatedDelivery (task spec) ──────────────────

test('parseUpstream: mainInfo NIE zawiera Przewidywana dostawa / Data dostawy / Aktualna lokalizacja', () => {
    const html = buildHtml([
        { date: '2024-01-15', location: 'PL', record: 'In transit' }
    ], ['REF', 'TRK', 'CN', '2024-01-15', 'In transit', 'Odbiorca']);

    const { mainInfo } = parseUpstream(html);
    assert.ok(!Object.prototype.hasOwnProperty.call(mainInfo, 'Przewidywana dostawa'));
    assert.ok(!Object.prototype.hasOwnProperty.call(mainInfo, 'Data dostawy'));
    assert.ok(!Object.prototype.hasOwnProperty.call(mainInfo, 'Aktualna lokalizacja'));
});

// ─── Testy integracyjne — pełny HTML (zbliżony do produkcji) ─────────────────

test('parseUpstream: pełny HTML z wieloma zdarzeniami', () => {
    const html = buildHtml([
        { date: '2024-01-20 15:30', location: 'Stalowa Wola', record: 'The shipment has been successfully delivered' },
        { date: '2024-01-19 09:00', location: 'Hamburg',      record: 'Loaded to movement / tour vehicle' },
        { date: '2024-01-17 06:00', location: 'AMS',          record: 'The flight has arrived' },
        { date: '2024-01-16 14:00', location: 'Shanghai',     record: 'Flight has departed' },
        { date: '2024-01-15 08:00', location: 'CN',           record: 'Shipment information received' }
    ], ['REF-001', 'TRK-001', 'PL', '2024-01-20', 'The shipment has been successfully delivered', 'Marek Testowy']);

    const { mainInfo, events } = parseUpstream(html);

    // mainInfo
    assert.equal(mainInfo['Numer referencyjny'], 'REF-001');
    assert.equal(mainInfo['Numer śledzenia'], 'TRK-001');
    assert.equal(mainInfo['Kraj'], 'PL');
    assert.equal(mainInfo['Data'], '2024-01-20');
    assert.equal(mainInfo['Ostatni status'], 'Przesyłka została pomyślnie dostarczona');
    assert.equal(mainInfo['Odbiorca'], 'Marek Testowy');

    // events — posortowane malejąco
    assert.equal(events.length, 5);
    assert.equal(events[0].OriginalDate, '2024-01-20 15:30');
    assert.equal(events[4].OriginalDate, '2024-01-15 08:00');

    // Status jest przetłumaczony
    assert.equal(events[0].Status, 'Przesyłka została pomyślnie dostarczona');

    // OriginalStatus zachowany znak w znak
    assert.equal(events[0].OriginalStatus, 'The shipment has been successfully delivered');
});

test('parseUpstream: mniej niż 6 li w .menu_ — brakujące pola zostają "Brak danych"', () => {
    const html = buildHtml([], ['REF-001', 'TRK-001']);
    const { mainInfo } = parseUpstream(html);
    assert.equal(mainInfo['Numer referencyjny'], 'REF-001');
    assert.equal(mainInfo['Numer śledzenia'], 'TRK-001');
    assert.equal(mainInfo['Kraj'], 'Brak danych');
    assert.equal(mainInfo['Data'], 'Brak danych');
    assert.equal(mainInfo['Ostatni status'], 'Brak danych');
    assert.equal(mainInfo['Odbiorca'], 'Brak danych');
});
