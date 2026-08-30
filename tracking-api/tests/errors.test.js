'use strict';

/**
 * Testy jednostkowe dla lib/errors.js i lib/log.js.
 * Wymagania: 6.3, 6.4, 6.10
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  TrackingError,
  ERR_CODE_INVALID,
  ERR_ORIGIN_DENIED,
  ERR_NOT_FOUND,
  ERR_UPSTREAM_TIMEOUT,
  ERR_RATE_LIMITED,
  ERR_CONFIG_MISSING,
  ERR_INTERNAL,
} = require('../lib/errors');

const { writeLog } = require('../lib/log');

/* ===== TrackingError — struktura klasy ===== */

test('TrackingError: jest instancją Error i TrackingError', function () {
  const err = new TrackingError('test_code', 400, 'Komunikat testowy.', 'powód testowy');
  assert.ok(err instanceof Error);
  assert.ok(err instanceof TrackingError);
  assert.equal(err.name, 'TrackingError');
});

test('TrackingError: pola code, httpStatus, messagePl, logReason są ustawione', function () {
  const err = new TrackingError('my_code', 500, 'Wiadomość.', 'Powód.');
  assert.equal(err.code, 'my_code');
  assert.equal(err.httpStatus, 500);
  assert.equal(err.messagePl, 'Wiadomość.');
  assert.equal(err.logReason, 'Powód.');
});

test('TrackingError: logReason domyślnie pusty łańcuch gdy pominięty', function () {
  const err = new TrackingError('c', 400, 'M');
  assert.equal(err.logReason, '');
});

test('TrackingError: message równa się messagePl (dla kompatybilności z Error)', function () {
  const err = new TrackingError('c', 400, 'Wiadomość.');
  assert.equal(err.message, 'Wiadomość.');
});

/* ===== Siedem stałych błędów ===== */

const EXPECTED = [
  [ERR_CODE_INVALID,      'code_invalid',      400],
  [ERR_ORIGIN_DENIED,     'origin_denied',     403],
  [ERR_NOT_FOUND,         'not_found',         404],
  [ERR_UPSTREAM_TIMEOUT,  'upstream_timeout',  404],
  [ERR_RATE_LIMITED,      'rate_limited',      429],
  [ERR_CONFIG_MISSING,    'config_missing',    500],
  [ERR_INTERNAL,          'internal_error',    500],
];

EXPECTED.forEach(function ([constant, expectedCode, expectedStatus]) {
  test('stała ' + expectedCode + ': jest instancją TrackingError z kodem i statusem HTTP', function () {
    assert.ok(constant instanceof TrackingError);
    assert.equal(constant.code, expectedCode);
    assert.equal(constant.httpStatus, expectedStatus);
  });

  test('stała ' + expectedCode + ': messagePl nie jest puste i ma co najwyżej 200 znaków', function () {
    assert.ok(typeof constant.messagePl === 'string' && constant.messagePl.length > 0,
      'messagePl nie może być puste');
    assert.ok(constant.messagePl.length <= 200,
      'messagePl przekracza 200 znaków (' + constant.messagePl.length + ')');
  });

  test('stała ' + expectedCode + ': messagePl nie zawiera adresu IP, portu, nazwy hosta ani śladu stosu', function () {
    const msg = constant.messagePl;
    // Brak adresu IPv4 (np. 111.231.71.230)
    assert.doesNotMatch(msg, /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
      'messagePl nie może zawierać adresu IPv4');
    // Brak literału :port (np. :8082)
    assert.doesNotMatch(msg, /:\d{2,5}/,
      'messagePl nie może zawierać numeru portu');
    // Brak śladu stosu (at …)
    assert.doesNotMatch(msg, /\bat\s+\w/,
      'messagePl nie może zawierać śladu stosu');
    // Brak nazwy hosta (heurystycznie: brak ciągu wyglądającego jak hostname)
    assert.doesNotMatch(msg, /\b[a-z0-9-]+\.[a-z]{2,}\b/i,
      'messagePl nie może zawierać nazwy hosta');
  });
});

/* ===== writeLog ===== */

test('writeLog: zapisuje dokładnie jedną linię JSON zakończoną \\n na stdout', function () {
  const written = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = function (chunk) { written.push(chunk); return true; };

  try {
    writeLog({ event: 'test_event', code: 'test_code', httpStatus: 200, reason: 'powód', durationMs: 42 });
  } finally {
    process.stdout.write = originalWrite;
  }

  assert.equal(written.length, 1, 'musi być dokładnie jeden zapis');
  assert.ok(written[0].endsWith('\n'), 'wpis musi kończyć się znakiem nowej linii');

  const line = JSON.parse(written[0]);
  assert.ok(typeof line.ts === 'string', 'pole ts musi być łańcuchem');
  assert.equal(line.event, 'test_event');
  assert.equal(line.code, 'test_code');
  assert.equal(line.httpStatus, 200);
  assert.equal(line.reason, 'powód');
  assert.equal(line.durationMs, 42);
});

test('writeLog: pola ts, event, code, httpStatus, reason, durationMs — wszystkie obecne', function () {
  const written = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = function (chunk) { written.push(chunk); return true; };

  try {
    writeLog({ event: 'e', code: null, httpStatus: 500, reason: '', durationMs: 0 });
  } finally {
    process.stdout.write = originalWrite;
  }

  const line = JSON.parse(written[0]);
  assert.ok('ts' in line, 'brak pola ts');
  assert.ok('event' in line, 'brak pola event');
  assert.ok('code' in line, 'brak pola code');
  assert.ok('httpStatus' in line, 'brak pola httpStatus');
  assert.ok('reason' in line, 'brak pola reason');
  assert.ok('durationMs' in line, 'brak pola durationMs');
});

test('writeLog: code może być null', function () {
  const written = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = function (chunk) { written.push(chunk); return true; };

  try {
    writeLog({ event: 'success', code: null, httpStatus: 200, reason: '', durationMs: 100 });
  } finally {
    process.stdout.write = originalWrite;
  }

  const line = JSON.parse(written[0]);
  assert.equal(line.code, null);
});

test('writeLog: błąd zapisu jest pochłaniany — nie wyrzuca wyjątku', function () {
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = function () { throw new Error('symulowany błąd zapisu'); };

  try {
    // nie powinno rzucić wyjątku
    assert.doesNotThrow(function () {
      writeLog({ event: 'e', code: 'c', httpStatus: 500, reason: 'r', durationMs: 1 });
    });
  } finally {
    process.stdout.write = originalWrite;
  }
});

test('writeLog: nie zawiera treści odpowiedzi upstream — pole upstreamBody jest ignorowane', function () {
  const written = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = function (chunk) { written.push(chunk); return true; };

  try {
    // przekazujemy nadmiarowe pole upstreamBody, które nie powinno trafić do logu
    writeLog({
      event: 'upstream_resp',
      code: null,
      httpStatus: 200,
      reason: '',
      durationMs: 50,
      upstreamBody: '<html>sekretne dane upstream</html>',
    });
  } finally {
    process.stdout.write = originalWrite;
  }

  const line = JSON.parse(written[0]);
  assert.ok(!('upstreamBody' in line), 'pole upstreamBody nie może trafić do dziennika');
});
