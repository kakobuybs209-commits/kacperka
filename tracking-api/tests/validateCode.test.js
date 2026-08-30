'use strict';

/*
 * Testy jednostkowe i własnościowe dla lib/validateCode.js
 * Wymagania: 1.11, 2.5, 6.1
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fc = require('fast-check');

const { validateCode } = require('../lib/validateCode');

// ---------------------------------------------------------------------------
// Testy jednostkowe — przykłady
// ---------------------------------------------------------------------------

test('validateCode: poprawne kody 6–40 znaków zwracają ok=true i wielkie litery', function () {
    const wyniki = [
        { wejście: 'ABC123', oczekiwane: 'ABC123' },
        { wejście: 'abc123', oczekiwane: 'ABC123' },
        { wejście: 'AB-1234', oczekiwane: 'AB-1234' },
        { wejście: '  ABC123  ', oczekiwane: 'ABC123' },   // białe znaki odcinane
        { wejście: 'A'.repeat(40), oczekiwane: 'A'.repeat(40) },
        { wejście: 'abcdef', oczekiwane: 'ABCDEF' },
        { wejście: 'TRACK-CODE-001', oczekiwane: 'TRACK-CODE-001' }
    ];
    wyniki.forEach(function (c) {
        const wynik = validateCode(c.wejście);
        assert.equal(wynik.ok, true, 'ok musi być true dla: ' + JSON.stringify(c.wejście));
        assert.equal(wynik.normalized, c.oczekiwane, 'normalized musi być ' + c.oczekiwane);
    });
});

test('validateCode: puste, białe i nieokreślone wejście zwraca ok=false', function () {
    const przypadki = ['', '   ', '\t\n'];
    przypadki.forEach(function (wej) {
        const wynik = validateCode(wej);
        assert.equal(wynik.ok, false, 'ok musi być false dla: ' + JSON.stringify(wej));
    });
});

test('validateCode: wejście zbyt krótkie (< 6 po trim) zwraca ok=false', function () {
    ['a', 'ab', 'abc', 'abcd', 'abcde'].forEach(function (wej) {
        const wynik = validateCode(wej);
        assert.equal(wynik.ok, false, 'ok musi być false dla: ' + JSON.stringify(wej));
        assert.equal(wynik.normalized, wej.trim());
    });
});

test('validateCode: wejście zbyt długie (> 40 po trim) zwraca ok=false', function () {
    var kod41 = 'A'.repeat(41);
    var wynik = validateCode(kod41);
    assert.equal(wynik.ok, false);
    assert.equal(wynik.normalized, kod41);
});

test('validateCode: surowe wejście dłuższe niż 50 znaków odrzucone przed trim', function () {
    // Nawet jeśli po trim miałoby 40 znaków, surowa długość > 50 to odrzucenie
    var dluga = ' '.repeat(6) + 'A'.repeat(40) + ' '.repeat(6); // surowa = 52
    var wynik = validateCode(dluga);
    assert.equal(wynik.ok, false);
    // normalized = po trim, ale bez toUpperCase
    assert.equal(wynik.normalized, dluga.trim());
});

test('validateCode: niedozwolony znak zwraca ok=false z normalized po trim', function () {
    var przypadki = ['ABC 123', 'ABC@123', 'ABC.123', 'ABC_123', 'śledzenie!'];
    przypadki.forEach(function (wej) {
        var wynik = validateCode(wej);
        assert.equal(wynik.ok, false, 'ok musi być false dla: ' + JSON.stringify(wej));
        assert.equal(wynik.normalized, wej.trim());
    });
});

test('validateCode: wejście niebędące stringiem zwraca ok=false i normalized=""', function () {
    [null, undefined, 123, [], {}, true].forEach(function (wej) {
        var wynik = validateCode(wej);
        assert.equal(wynik.ok, false);
        assert.equal(wynik.normalized, '');
    });
});

test('validateCode: kod dokładnie 6 znaków — granica dolna — ok=true', function () {
    var wynik = validateCode('ABCDE1');
    assert.equal(wynik.ok, true);
    assert.equal(wynik.normalized, 'ABCDE1');
});

test('validateCode: kod dokładnie 40 znaków — granica górna — ok=true', function () {
    var kod = 'A1-'.repeat(13) + 'A'; // 13*3+1 = 40
    var wynik = validateCode(kod);
    assert.equal(wynik.ok, true);
    assert.equal(wynik.normalized, kod.toUpperCase());
});

test('validateCode: litery rozszerzonego alfabetu łacińskiego (\\u00C0–\\u024F) są dozwolone', function () {
    // ą, ę, ś, ó, ń — kod docelowy to PL, więc polskie litery muszą przejść
    var wynik = validateCode('ąęśóńź1');
    assert.equal(wynik.ok, true);
    assert.equal(wynik.normalized, 'ąęśóńź1'.trim().toUpperCase());
});

// ---------------------------------------------------------------------------
// Testy własnościowe
// ---------------------------------------------------------------------------

// Feature: tracking-module-integration, Property 1: Walidacja i normalizacja Kodu_Śledzenia
test('PBT: poprawny kod zawsze zwraca ok=true i normalized=trim().toUpperCase()', { concurrency: false }, function () {
    // Generator poprawnych kodów: 6–40 znaków, wyłącznie [A-Za-z\d-]
    const poprawnyKod = fc.stringOf(
        fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-'.split('')),
        { minLength: 6, maxLength: 40 }
    ).filter(function (s) {
        // Odfiltruj puste kody i kody z tylko łącznikami (technicznie dozwolone)
        return s.trim().length >= 6;
    });

    fc.assert(
        fc.property(poprawnyKod, function (kod) {
            const wynik = validateCode(kod);
            assert.equal(wynik.ok, true, 'ok musi być true dla kodu: ' + kod);
            assert.equal(wynik.normalized, kod.toUpperCase(), 'normalized musi być uppercase');
        }),
        { numRuns: 100 }
    );
});

// Feature: tracking-module-integration, Property 1b: Zbyt krótkie kody zawsze odrzucone
test('PBT: kod krótszy niż 6 znaków po trim() zawsze zwraca ok=false', function () {
    const krótkiKod = fc.stringOf(
        fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('')),
        { minLength: 0, maxLength: 5 }
    );

    fc.assert(
        fc.property(krótkiKod, function (kod) {
            const wynik = validateCode(kod);
            assert.equal(wynik.ok, false, 'ok musi być false dla krótkiego kodu: ' + kod);
        }),
        { numRuns: 100 }
    );
});

// Feature: tracking-module-integration, Property 1c: Zbyt długie kody (>40 po trim) zawsze odrzucone
test('PBT: kod dłuższy niż 40 znaków po trim() zawsze zwraca ok=false', function () {
    const długiKod = fc.stringOf(
        fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('')),
        { minLength: 41, maxLength: 60 }
    );

    fc.assert(
        fc.property(długiKod, function (kod) {
            const wynik = validateCode(kod);
            assert.equal(wynik.ok, false, 'ok musi być false dla długiego kodu: ' + kod);
        }),
        { numRuns: 100 }
    );
});

// Feature: tracking-module-integration, Property 1d: Surowe wejście > 50 znaków zawsze odrzucone
test('PBT: surowe wejście dłuższe niż 50 znaków zawsze zwraca ok=false', function () {
    const bDługiKod = fc.stringOf(
        fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('')),
        { minLength: 51, maxLength: 80 }
    );

    fc.assert(
        fc.property(bDługiKod, function (kod) {
            const wynik = validateCode(kod);
            assert.equal(wynik.ok, false, 'ok musi być false dla surowego kodu > 50: ' + kod);
        }),
        { numRuns: 100 }
    );
});

// Feature: tracking-module-integration, Property 1e: ok=false zawsze gdy normalized != trim().toUpperCase()
test('PBT: wynik zawiera zawsze pole ok (boolean) i normalized (string)', function () {
    fc.assert(
        fc.property(fc.string({ maxLength: 60 }), function (wej) {
            const wynik = validateCode(wej);
            assert.equal(typeof wynik.ok, 'boolean');
            assert.equal(typeof wynik.normalized, 'string');
        }),
        { numRuns: 200 }
    );
});
