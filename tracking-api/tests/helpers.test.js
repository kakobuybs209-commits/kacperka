'use strict';

/*
 * Testy pomocników testowych wycinających sekcje ze `fxlsereps.pl/script.js`.
 * Zadanie 8.2, wymaganie 1.2.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    CORE_START,
    CORE_END,
    CORE_EXPORT_KEYS,
    readScriptSource,
    extractSection,
    extractCoreSource,
    hasCoreSection,
    loadCore
} = require('./helpers/loadCore');

const {
    DEFAULT_HTML,
    hasUiSection,
    loadUi,
    createClock,
    createFetchMock,
    createResponse,
    createLocalStorageMock,
    createClipboardMock
} = require('./helpers/loadUi');

test('loadCore: sekcja CORE jest obecna w script.js', function () {
    assert.equal(hasCoreSection(), true);
    const source = extractCoreSource();
    assert.ok(source.startsWith(CORE_START));
    assert.equal(source.indexOf(CORE_END), -1);
});

test('loadCore: zwraca eksport window.FXTRK_CORE z ośmioma tabelami', function () {
    const core = loadCore();
    assert.equal(typeof core, 'object');
    CORE_EXPORT_KEYS.forEach(function (key) {
        assert.ok(Object.prototype.hasOwnProperty.call(core, key), 'brak klucza ' + key);
    });
    assert.ok(Array.isArray(core.MILESTONES));
    assert.ok(core.MILESTONES.length > 0);
});

test('loadCore: fresh daje niewspółdzieloną instancję, domyślnie ta sama', function () {
    assert.equal(loadCore(), loadCore());
    assert.notEqual(loadCore({ fresh: true }), loadCore());
});

test('extractSection: brak znaczników albo odwrócona kolejność = błąd', function () {
    assert.throws(function () {
        extractSection('nic tu nie ma', CORE_START, CORE_END, 'FXTRK:CORE');
    }, /Brak znaczników sekcji FXTRK:CORE/);

    assert.throws(function () {
        extractSection(CORE_END + '\n' + CORE_START, CORE_START, CORE_END, 'FXTRK:CORE');
    }, /wypada przed znacznikiem początku/);

    assert.throws(function () {
        extractSection(readScriptSource(), '/* ==== FXTRK:BRAK START ==== */', '/* ==== FXTRK:BRAK END ==== */', 'FXTRK:BRAK');
    }, /Brak znaczników sekcji FXTRK:BRAK/, 'sekcja bez znaczników w script.js musi dawać błąd');
});

test('createClock: kolejność zadań, czyszczenie i brak prawdziwego zegara', function () {
    const clock = createClock(1000);
    const order = [];

    clock.setTimeout(function () { order.push('drugi'); }, 200);
    clock.setTimeout(function () { order.push('pierwszy'); }, 100);
    const anulowany = clock.setTimeout(function () { order.push('anulowany'); }, 150);
    clock.clearTimeout(anulowany);

    assert.equal(clock.pendingCount(), 2);
    clock.tick(150);
    assert.deepEqual(order, ['pierwszy']);
    assert.equal(clock.now(), 1150);

    clock.tick(100);
    assert.deepEqual(order, ['pierwszy', 'drugi']);
    assert.equal(clock.pendingCount(), 0);
    assert.equal(clock.now(), 1250);
});

test('createFetchMock: zapis wywołań, odpowiedź i odrzucenie', async function () {
    const fetchMock = createFetchMock();

    const domyslna = await fetchMock('https://api.example/tracking/ABC123');
    assert.equal(domyslna.status, 200);
    assert.deepEqual(fetchMock.calls.map(function (c) { return c.url; }), ['https://api.example/tracking/ABC123']);

    fetchMock.respondWith({ status: 429, body: { success: false, message: 'limit' }, headers: { 'Retry-After': '30' } });
    const limit = await fetchMock('https://api.example/tracking/ABC123');
    assert.equal(limit.ok, false);
    assert.equal(limit.headers.get('retry-after'), '30');
    assert.deepEqual(await limit.json(), { success: false, message: 'limit' });

    fetchMock.rejectWith(new Error('offline'));
    await assert.rejects(fetchMock('https://api.example/tracking/ABC123'), /offline/);
});

test('createResponse: treść nieparsowalna jako JSON odrzuca obietnicę json()', async function () {
    const odpowiedz = createResponse({ status: 200, text: '<html>nie json</html>' });
    assert.equal(odpowiedz.ok, true);
    assert.equal(await odpowiedz.text(), '<html>nie json</html>');
    await assert.rejects(odpowiedz.json());
});

test('createLocalStorageMock: wartość niezaufana i wymuszony wyjątek', function () {
    const ls = createLocalStorageMock({ last_tracking_code: '<img src=x>' });
    assert.equal(ls.getItem('last_tracking_code'), '<img src=x>');
    assert.equal(ls.getItem('brak'), null);

    ls.setFailure('setItem', new Error('QuotaExceeded'));
    assert.throws(function () { ls.setItem('last_tracking_code', 'ABC123'); }, /QuotaExceeded/);
    ls.setFailure('setItem', null);
    ls.setItem('last_tracking_code', 'ABC123');
    assert.equal(ls.getItem('last_tracking_code'), 'ABC123');
});

test('createClipboardMock: zapis wartości i odrzucenie obietnicy', async function () {
    const clipboard = createClipboardMock();
    await clipboard.writeText('  ABC123  ');
    assert.deepEqual(clipboard.writes, ['  ABC123  ']);

    clipboard.failWith(new Error('denied'));
    await assert.rejects(clipboard.writeText('ABC123'), /denied/);
    assert.equal(clipboard.writes.length, 2);
});

test('loadUi: brak sekcji FXTRK:UI w script.js = błąd', { skip: hasUiSection() ? 'sekcja UI już istnieje' : false }, function () {
    assert.throws(function () { loadUi(); }, /Brak znaczników sekcji FXTRK:UI/);
});

test('loadUi: kontekst jsdom z atrapami i sekcją CORE', { skip: hasUiSection() ? false : 'sekcja UI jeszcze nie istnieje' }, function () {
    const env = loadUi();
    try {
        assert.ok(env.document.getElementById('YQContainer'));
        assert.ok(env.document.getElementById('YQNum'));
        assert.equal(env.window.fetch, env.fetchMock);
        assert.equal(env.window.localStorage, env.localStorage);
        assert.equal(env.window.navigator.clipboard, env.clipboard);
        assert.equal(env.window.Date.now(), env.clock.now());
        assert.equal(typeof env.core, 'object');
    } finally {
        env.destroy();
    }
});

test('DEFAULT_HTML: szkielet widoku nosi atrybut data-fxtrk-nolocale', function () {
    assert.ok(DEFAULT_HTML.indexOf('data-fxtrk-nolocale') >= 0);
    assert.ok(DEFAULT_HTML.indexOf('id="YQContainer"') >= 0);
});
