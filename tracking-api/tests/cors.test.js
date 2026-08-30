'use strict';

/**
 * Testy jednostkowe i własnościowe dla lib/cors.js
 * Zadanie 2.3, wymagania: 1.7, 9.7, 9.8
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fc = require('fast-check');

const { checkOrigin, parseOrigin, originsMatch } = require('../lib/cors');

// ---------------------------------------------------------------------------
// Testy jednostkowe — przykłady deterministyczne
// ---------------------------------------------------------------------------

test('cors: dopasowanie dokładne — allowed: true, allowOriginValue = Origin', function () {
    const result = checkOrigin('https://fxlsereps.pl', ['https://fxlsereps.pl']);
    assert.equal(result.allowed, true);
    assert.equal(result.allowOriginValue, 'https://fxlsereps.pl');
});

test('cors: host bez rozróżniania wielkości liter', function () {
    const result = checkOrigin('https://FxlseReps.PL', ['https://fxlsereps.pl']);
    assert.equal(result.allowed, true);
    assert.equal(result.allowOriginValue, 'https://FxlseReps.PL');
});

test('cors: schemat musi pasować — http vs https → odmowa', function () {
    const result = checkOrigin('http://fxlsereps.pl', ['https://fxlsereps.pl']);
    assert.equal(result.allowed, false);
    assert.equal(result.allowOriginValue, null);
});

test('cors: port musi pasować — z portem vs bez → odmowa', function () {
    const result = checkOrigin('https://fxlsereps.pl:8080', ['https://fxlsereps.pl']);
    assert.equal(result.allowed, false);
    assert.equal(result.allowOriginValue, null);
});

test('cors: port musi pasować — zgodny port → dopasowanie', function () {
    const result = checkOrigin('https://fxlsereps.pl:8080', ['https://fxlsereps.pl:8080']);
    assert.equal(result.allowed, true);
    assert.equal(result.allowOriginValue, 'https://fxlsereps.pl:8080');
});

test('cors: subdomena nie pasuje do domeny bez subdomeny', function () {
    assert.equal(checkOrigin('https://www.fxlsereps.pl', ['https://fxlsereps.pl']).allowed, false);
});

test('cors: subdomena pasuje gdy jest explicite na liście', function () {
    const result = checkOrigin('https://www.fxlsereps.pl', ['https://fxlsereps.pl', 'https://www.fxlsereps.pl']);
    assert.equal(result.allowed, true);
    assert.equal(result.allowOriginValue, 'https://www.fxlsereps.pl');
});

test('cors: brak nagłówka Origin → odmowa', function () {
    assert.deepEqual(checkOrigin(undefined, ['https://fxlsereps.pl']), { allowed: false, allowOriginValue: null });
    assert.deepEqual(checkOrigin(null, ['https://fxlsereps.pl']), { allowed: false, allowOriginValue: null });
    assert.deepEqual(checkOrigin('', ['https://fxlsereps.pl']), { allowed: false, allowOriginValue: null });
    assert.deepEqual(checkOrigin('   ', ['https://fxlsereps.pl']), { allowed: false, allowOriginValue: null });
});

test('cors: nieparseowalny Origin → odmowa', function () {
    assert.equal(checkOrigin('not-a-url', ['https://fxlsereps.pl']).allowed, false);
    assert.equal(checkOrigin('fxlsereps.pl', ['https://fxlsereps.pl']).allowed, false);
    assert.equal(checkOrigin('://fxlsereps.pl', ['https://fxlsereps.pl']).allowed, false);
});

test('cors: nieustawiona lista (undefined) → odmowa', function () {
    assert.deepEqual(checkOrigin('https://fxlsereps.pl', undefined), { allowed: false, allowOriginValue: null });
});

test('cors: pusta lista ([]) → odmowa', function () {
    assert.deepEqual(checkOrigin('https://fxlsereps.pl', []), { allowed: false, allowOriginValue: null });
});

test('cors: lista > 10 pozycji → odmowa', function () {
    const bigList = ['https://a.pl', 'https://b.pl', 'https://c.pl', 'https://d.pl',
                     'https://e.pl', 'https://f.pl', 'https://g.pl', 'https://h.pl',
                     'https://i.pl', 'https://j.pl', 'https://k.pl'];
    assert.equal(bigList.length, 11);
    const result = checkOrigin('https://a.pl', bigList);
    assert.equal(result.allowed, false);
    assert.equal(result.allowOriginValue, null);
});

test('cors: lista dokładnie 10 pozycji → dopasowanie działa', function () {
    const list10 = ['https://a.pl', 'https://b.pl', 'https://c.pl', 'https://d.pl',
                    'https://e.pl', 'https://f.pl', 'https://g.pl', 'https://h.pl',
                    'https://i.pl', 'https://fxlsereps.pl'];
    assert.equal(list10.length, 10);
    const result = checkOrigin('https://fxlsereps.pl', list10);
    assert.equal(result.allowed, true);
});

test('cors: wartość * nigdy nie jest zwracana jako allowOriginValue', function () {
    // * nie jest poprawnym URL — nie może być na liście ani w Origin
    const result = checkOrigin('https://fxlsereps.pl', ['*']);
    assert.equal(result.allowed, false);
    assert.notEqual(result.allowOriginValue, '*');
});

test('cors: allowOriginValue jest dokładną wartością Origin, nie pozycją z listy', function () {
    // Origin z wielką literą w schemacie hosta — allowOriginValue powinien zachować tę wartość
    const origin = 'https://FXLSEREPS.PL';
    const result = checkOrigin(origin, ['https://fxlsereps.pl']);
    assert.equal(result.allowed, true);
    assert.equal(result.allowOriginValue, origin);
});

test('cors: http i https to różne schematy', function () {
    assert.equal(checkOrigin('http://fxlsereps.pl', ['https://fxlsereps.pl']).allowed, false);
    assert.equal(checkOrigin('https://fxlsereps.pl', ['http://fxlsereps.pl']).allowed, false);
    assert.equal(checkOrigin('http://fxlsereps.pl', ['http://fxlsereps.pl']).allowed, true);
});

test('cors: domyślny port 443 dla https normalizuje się tak samo co brak portu', function () {
    // URL API normalizuje :443 dla https do braku portu
    const r1 = checkOrigin('https://fxlsereps.pl:443', ['https://fxlsereps.pl']);
    assert.equal(r1.allowed, true);
    const r2 = checkOrigin('https://fxlsereps.pl', ['https://fxlsereps.pl:443']);
    assert.equal(r2.allowed, true);
});

test('cors: domyślny port 80 dla http normalizuje się tak samo co brak portu', function () {
    const r1 = checkOrigin('http://fxlsereps.pl:80', ['http://fxlsereps.pl']);
    assert.equal(r1.allowed, true);
    const r2 = checkOrigin('http://fxlsereps.pl', ['http://fxlsereps.pl:80']);
    assert.equal(r2.allowed, true);
});

test('cors: parseOrigin zwraca null dla niepoprawnych wejść', function () {
    assert.equal(parseOrigin('not-a-url'), null);
    assert.equal(parseOrigin(''), null);
    assert.equal(parseOrigin('fxlsereps.pl'), null);
    assert.equal(parseOrigin('//fxlsereps.pl'), null);
});

test('cors: parseOrigin poprawnie rozkłada URL', function () {
    const r = parseOrigin('https://fxlsereps.pl');
    assert.equal(r.scheme, 'https');
    assert.equal(r.host, 'fxlsereps.pl');
    assert.equal(r.port, '');
});

test('cors: parseOrigin normalizuje host do małych liter', function () {
    const r = parseOrigin('https://FXLSEREPS.PL');
    assert.equal(r.host, 'fxlsereps.pl');
});

// ---------------------------------------------------------------------------
// Testy własnościowe
// ---------------------------------------------------------------------------

// Feature: tracking-module-integration, Property 36: Lista dopuszczonych domen źródłowych
test('cors: [Property 36] lista dopuszczonych domen źródłowych — Validates: Requirements 1.7, 9.7, 9.8', { timeout: 30000 }, function () {
    // Arbitrazy
    const validScheme = fc.constantFrom('https', 'http');
    const validHost = fc.stringMatching(/^[a-z][a-z0-9\-]{0,15}(\.[a-z]{2,6})+$/).filter(s => s.length <= 30);
    const validPort = fc.oneof(
        fc.constant(''),
        fc.integer({ min: 1024, max: 9999 }).map(n => ':' + n)
    );

    const validOriginArb = fc.tuple(validScheme, validHost, validPort)
        .map(([scheme, host, port]) => scheme + '://' + host + port);

    // Własność 1: dopasowanie zawsze daje allowed: true i allowOriginValue równy origin (nie *)
    fc.assert(fc.property(
        validOriginArb,
        fc.array(validOriginArb, { minLength: 0, maxLength: 9 }),
        function (origin, rest) {
            const allowlist = [origin].concat(rest).slice(0, 10);
            const result = checkOrigin(origin, allowlist);
            assert.equal(result.allowed, true);
            assert.notEqual(result.allowOriginValue, '*');
            assert.ok(result.allowOriginValue !== null);
        }
    ), { numRuns: 100 });

    // Własność 2: brak Origin zawsze daje odmowę
    fc.assert(fc.property(
        fc.oneof(fc.constant(undefined), fc.constant(null), fc.constant(''), fc.constant('   ')),
        fc.array(validOriginArb, { minLength: 1, maxLength: 10 }),
        function (noOrigin, allowlist) {
            const result = checkOrigin(noOrigin, allowlist);
            assert.equal(result.allowed, false);
            assert.equal(result.allowOriginValue, null);
        }
    ), { numRuns: 100 });

    // Własność 3: lista > 10 zawsze daje odmowę, nawet gdy Origin jest na liście
    fc.assert(fc.property(
        validOriginArb,
        fc.array(validOriginArb, { minLength: 11, maxLength: 20 }),
        function (origin, bigList) {
            const allowlist = [origin].concat(bigList).slice(0, 15);
            // musi mieć > 10
            if (allowlist.length <= 10) return;
            const result = checkOrigin(origin, allowlist);
            assert.equal(result.allowed, false);
            assert.equal(result.allowOriginValue, null);
        }
    ), { numRuns: 100 });

    // Własność 4: odmowa nigdy nie zwraca '*' ani wartości z allowlist
    fc.assert(fc.property(
        fc.oneof(fc.constant(undefined), fc.string()),
        fc.oneof(
            fc.constant(undefined),
            fc.constant([]),
            fc.array(validOriginArb, { minLength: 1, maxLength: 10 })
        ),
        function (origin, allowlist) {
            const result = checkOrigin(origin, allowlist);
            if (!result.allowed) {
                assert.equal(result.allowOriginValue, null);
                // wartość * nigdy nie jest zwracana
                assert.notEqual(result.allowOriginValue, '*');
            }
        }
    ), { numRuns: 100 });
});
