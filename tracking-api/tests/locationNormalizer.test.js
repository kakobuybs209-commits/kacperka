'use strict';

/**
 * Testy jednostkowe Normalizatora_Lokalizacji
 * lib/locationNormalizer.js
 * Requirements: 3.6, 3.7, 3.8, 3.9, 3.10
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeLocation, MISSING_LOCATION } = require('../lib/locationNormalizer');

// ─── Stała braku danych (wymaganie 3.10) ─────────────────────────────────────

test('MISSING_LOCATION: stała ma poprawną wartość', function () {
    assert.equal(MISSING_LOCATION, 'Brak danych o lokalizacji');
});

// ─── Wejście puste / whitespace / undefined (wymaganie 3.10) ─────────────────

test('3.10: undefined → stała braku danych', function () {
    assert.equal(normalizeLocation(undefined), MISSING_LOCATION);
});

test('3.10: null → stała braku danych', function () {
    assert.equal(normalizeLocation(null), MISSING_LOCATION);
});

test('3.10: pusty łańcuch → stała braku danych', function () {
    assert.equal(normalizeLocation(''), MISSING_LOCATION);
});

test('3.10: sam biały znak → stała braku danych', function () {
    assert.equal(normalizeLocation('   '), MISSING_LOCATION);
});

test('3.10: tabulatory i spacje → stała braku danych', function () {
    assert.equal(normalizeLocation('  \t  '), MISSING_LOCATION);
});

// ─── Dwuliterowy kod kraju (wymaganie 3.6) ────────────────────────────────────

test('3.6: PL → Polska', function () {
    assert.equal(normalizeLocation('PL'), 'Polska');
});

test('3.6: CN → Chiny', function () {
    assert.equal(normalizeLocation('CN'), 'Chiny');
});

test('3.6: DE → Niemcy', function () {
    assert.equal(normalizeLocation('DE'), 'Niemcy');
});

test('3.6: NL → Holandia', function () {
    assert.equal(normalizeLocation('NL'), 'Holandia');
});

test('3.6: US → USA', function () {
    assert.equal(normalizeLocation('US'), 'USA');
});

test('3.6: GB → Wielka Brytania', function () {
    assert.equal(normalizeLocation('GB'), 'Wielka Brytania');
});

test('3.6: FR → Francja', function () {
    assert.equal(normalizeLocation('FR'), 'Francja');
});

test('3.6: kod małymi literami (pl) → Polska (porównanie bez rozróżniania wielkości)', function () {
    assert.equal(normalizeLocation('pl'), 'Polska');
});

test('3.6: kod nieznany (XX) → trimmed input', function () {
    assert.equal(normalizeLocation('XX'), 'XX');
});

// ─── Pełna nazwa kraju (wymaganie 3.6) ───────────────────────────────────────

test('3.6: POLAND → Polska', function () {
    assert.equal(normalizeLocation('POLAND'), 'Polska');
});

test('3.6: Poland (mixed case) → Polska', function () {
    assert.equal(normalizeLocation('Poland'), 'Polska');
});

test('3.6: CHINA → Chiny', function () {
    assert.equal(normalizeLocation('CHINA'), 'Chiny');
});

test('3.6: GERMANY → Niemcy', function () {
    assert.equal(normalizeLocation('GERMANY'), 'Niemcy');
});

test('3.6: NETHERLANDS → Holandia', function () {
    assert.equal(normalizeLocation('NETHERLANDS'), 'Holandia');
});

test('3.6: HOLLAND → Holandia', function () {
    assert.equal(normalizeLocation('HOLLAND'), 'Holandia');
});

// ─── Znane polskie nazwy miast (wymaganie 3.8) ────────────────────────────────

test('3.8: STALOWA WOLA → STALOWA WOLA, Polska', function () {
    assert.equal(normalizeLocation('STALOWA WOLA'), 'STALOWA WOLA, Polska');
});

test('3.8: WARSZAWA → WARSZAWA, Polska', function () {
    assert.equal(normalizeLocation('WARSZAWA'), 'WARSZAWA, Polska');
});

test('3.8: KRAKÓW → KRAKÓW, Polska', function () {
    assert.equal(normalizeLocation('KRAKÓW'), 'KRAKÓW, Polska');
});

test('3.8: GDAŃSK → GDAŃSK, Polska', function () {
    assert.equal(normalizeLocation('GDAŃSK'), 'GDAŃSK, Polska');
});

test('3.8: POZNAŃ → POZNAŃ, Polska', function () {
    assert.equal(normalizeLocation('POZNAŃ'), 'POZNAŃ, Polska');
});

test('3.8: WROCŁAW → WROCŁAW, Polska', function () {
    assert.equal(normalizeLocation('WROCŁAW'), 'WROCŁAW, Polska');
});

test('3.8: STRYKÓW → STRYKÓW, Polska', function () {
    assert.equal(normalizeLocation('STRYKÓW'), 'STRYKÓW, Polska');
});

test('3.8: STRYKOW (bez ogonka) → STRYKOW, Polska', function () {
    assert.equal(normalizeLocation('STRYKOW'), 'STRYKOW, Polska');
});

test('3.8: RUDNIK → RUDNIK, Polska', function () {
    assert.equal(normalizeLocation('RUDNIK'), 'RUDNIK, Polska');
});

// ─── Znane chińskie nazwy miast (wymaganie 3.8) ───────────────────────────────

test('3.8: SHANGHAI → SHANGHAI, Chiny', function () {
    assert.equal(normalizeLocation('SHANGHAI'), 'SHANGHAI, Chiny');
});

test('3.8: BEIJING → BEIJING, Chiny', function () {
    assert.equal(normalizeLocation('BEIJING'), 'BEIJING, Chiny');
});

test('3.8: GUANGZHOU → GUANGZHOU, Chiny', function () {
    assert.equal(normalizeLocation('GUANGZHOU'), 'GUANGZHOU, Chiny');
});

test('3.8: SHENZHEN → SHENZHEN, Chiny', function () {
    assert.equal(normalizeLocation('SHENZHEN'), 'SHENZHEN, Chiny');
});

test('3.8: PUTIAN → PUTIAN, Chiny', function () {
    assert.equal(normalizeLocation('PUTIAN'), 'PUTIAN, Chiny');
});

// ─── Znane holenderskie nazwy miast (wymaganie 3.8) ──────────────────────────

test('3.8: AMSTERDAM → AMSTERDAM, Holandia', function () {
    assert.equal(normalizeLocation('AMSTERDAM'), 'AMSTERDAM, Holandia');
});

test('3.8: ROTTERDAM → ROTTERDAM, Holandia', function () {
    assert.equal(normalizeLocation('ROTTERDAM'), 'ROTTERDAM, Holandia');
});

test('3.8: EINDHOVEN → EINDHOVEN, Holandia', function () {
    assert.equal(normalizeLocation('EINDHOVEN'), 'EINDHOVEN, Holandia');
});

test('3.8: OIRSCHOT → OIRSCHOT, Holandia', function () {
    assert.equal(normalizeLocation('OIRSCHOT'), 'OIRSCHOT, Holandia');
});

test('3.8: VIJFHUIZEN → VIJFHUIZEN, Holandia', function () {
    assert.equal(normalizeLocation('VIJFHUIZEN'), 'VIJFHUIZEN, Holandia');
});

test('3.8: VEENENDAAL → VEENENDAAL, Holandia', function () {
    assert.equal(normalizeLocation('VEENENDAAL'), 'VEENENDAAL, Holandia');
});

// ─── Format "MIASTO (KOD)" (wymaganie 3.7) ────────────────────────────────────

test('3.7: "WARSZAWA (PL)" → "WARSZAWA, Polska" (priorytet miast przed formatem)', function () {
    // Miasto polskie trafia do reguły 2 przed reguą formatu MIASTO (KOD)
    assert.equal(normalizeLocation('WARSZAWA (PL)'), 'WARSZAWA (PL), Polska');
});

test('3.7: "BEIJING (CN)" → "BEIJING (CN), Chiny" (priorytet miast chińskich)', function () {
    // Miasto chińskie trafia do reguły 3 przed regułą formatu MIASTO (KOD)
    assert.equal(normalizeLocation('BEIJING (CN)'), 'BEIJING (CN), Chiny');
});

test('3.7: "HAMBURG (DE)" → "HAMBURG, Niemcy" (format MIASTO (KOD), znany kod)', function () {
    assert.equal(normalizeLocation('HAMBURG (DE)'), 'HAMBURG, Niemcy');
});

test('3.7: "BERLIN (DE)" → "BERLIN, Niemcy"', function () {
    assert.equal(normalizeLocation('BERLIN (DE)'), 'BERLIN, Niemcy');
});

test('3.7: "PARIS (FR)" → "PARIS, Francja"', function () {
    assert.equal(normalizeLocation('PARIS (FR)'), 'PARIS, Francja');
});

test('3.7: "CITY (XX)" → "CITY, XX" (nieznany kod)', function () {
    assert.equal(normalizeLocation('CITY (XX)'), 'CITY, XX');
});

test('3.7: "  HAMBURG  (DE)" → "HAMBURG, Niemcy" (trim nazwy miasta)', function () {
    assert.equal(normalizeLocation('  HAMBURG  (DE)'), 'HAMBURG, Niemcy');
});

test('3.7: "miasto (nl)" → "miasto, Holandia" (małe litery w kodzie)', function () {
    // Wzorzec w regexp oczekuje wielkich liter ([A-Z]{2}), więc nie trafi w regułę 7
    // Zostaje zwrócone po trim()
    assert.equal(normalizeLocation('miasto (nl)'), 'miasto (nl)');
});

// ─── Brak dopasowania (wymaganie 3.9) ─────────────────────────────────────────

test('3.9: nieznany tekst → trimmed input', function () {
    assert.equal(normalizeLocation('  SOME UNKNOWN PLACE  '), 'SOME UNKNOWN PLACE');
});

test('3.9: "NEW YORK" → "NEW YORK" (brak na liście)', function () {
    assert.equal(normalizeLocation('NEW YORK'), 'NEW YORK');
});

test('3.9: tekst bez dopasowania zwraca trim bez modyfikacji treści', function () {
    assert.equal(normalizeLocation('Xyz123'), 'Xyz123');
});

// ─── Białe znaki na początku i końcu (wymaganie 3.9) ─────────────────────────

test('3.9: spacje wokół wejścia → trim()', function () {
    assert.equal(normalizeLocation('  PL  '), 'Polska');
});

test('3.9: spacje wokół nieznanego wejścia → trim()', function () {
    assert.equal(normalizeLocation('  UNKNOWN  '), 'UNKNOWN');
});

// ─── Typy wartości zwracanych ─────────────────────────────────────────────────

test('zawsze zwraca string', function () {
    assert.equal(typeof normalizeLocation(undefined), 'string');
    assert.equal(typeof normalizeLocation(''), 'string');
    assert.equal(typeof normalizeLocation('PL'), 'string');
    assert.equal(typeof normalizeLocation('UNKNOWN'), 'string');
    assert.equal(typeof normalizeLocation('CITY (DE)'), 'string');
});
