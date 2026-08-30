'use strict';

/**
 * Testy jednostkowe dla lib/upstreamClient.js.
 * Wymagania: 2.6, 2.7, 1.9
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { TrackingError, ERR_UPSTREAM_TIMEOUT, ERR_NOT_FOUND } = require('../lib/errors');
const { fetchUpstream } = require('../lib/upstreamClient');

/* ======================================================
 * Pomocnik: tworzy atrapy globalnego fetch
 * ====================================================== */

/**
 * Ustawia global.fetch na atrapę i zwraca funkcję przywracającą oryginał.
 * @param {Function} mockFn - atrapa fetch
 * @returns {Function} restore - wywołaj na końcu testu
 */
function mockFetch(mockFn) {
  const original = global.fetch;
  global.fetch = mockFn;
  return function restore() {
    global.fetch = original;
  };
}

function makeOkResponse(body) {
  return {
    ok: true,
    status: 200,
    text: function () { return Promise.resolve(body); },
  };
}

function makeErrorResponse(status) {
  return {
    ok: false,
    status: status,
    text: function () { return Promise.resolve(''); },
  };
}

/* ======================================================
 * Testy poprawnej odpowiedzi
 * ====================================================== */

test('fetchUpstream: zwraca HTML przy odpowiedzi 200', async function () {
  const html = '<html><body>tracking data</body></html>';
  const calls = [];

  const restore = mockFetch(async function (url, opts) {
    calls.push({ url, opts });
    return makeOkResponse(html);
  });

  try {
    const result = await fetchUpstream('http://example.com/track', 'ABC123', 500);
    assert.equal(result, html);
    assert.equal(calls.length, 1);
  } finally {
    restore();
  }
});

test('fetchUpstream: wysyła POST z Content-Type application/x-www-form-urlencoded', async function () {
  let capturedOpts;

  const restore = mockFetch(async function (url, opts) {
    capturedOpts = opts;
    return makeOkResponse('<html></html>');
  });

  try {
    await fetchUpstream('http://example.com/track', 'XYZ999', 500);
    assert.equal(capturedOpts.method, 'POST');
    assert.equal(capturedOpts.headers['Content-Type'], 'application/x-www-form-urlencoded');
  } finally {
    restore();
  }
});

test('fetchUpstream: ciało żądania zawiera pole documentCode z przekazanym kodem', async function () {
  let capturedBody;

  const restore = mockFetch(async function (url, opts) {
    capturedBody = opts.body;
    return makeOkResponse('<html></html>');
  });

  try {
    await fetchUpstream('http://example.com/track', 'MYCODE123', 500);
    // application/x-www-form-urlencoded: "documentCode=MYCODE123"
    assert.equal(capturedBody, 'documentCode=MYCODE123');
  } finally {
    restore();
  }
});

test('fetchUpstream: pole documentCode koduje znaki specjalne', async function () {
  let capturedBody;

  const restore = mockFetch(async function (url, opts) {
    capturedBody = opts.body;
    return makeOkResponse('<html></html>');
  });

  try {
    await fetchUpstream('http://example.com/track', 'A B+C', 500);
    // URLSearchParams koduje spację jako '+', a '+' jako '%2B'
    const params = new URLSearchParams(capturedBody);
    assert.equal(params.get('documentCode'), 'A B+C');
  } finally {
    restore();
  }
});

test('fetchUpstream: przekazuje AbortSignal do fetch', async function () {
  let capturedSignal;

  const restore = mockFetch(async function (url, opts) {
    capturedSignal = opts.signal;
    return makeOkResponse('<html></html>');
  });

  try {
    await fetchUpstream('http://example.com/track', 'ABC', 500);
    assert.ok(capturedSignal !== undefined && capturedSignal !== null, 'signal musi być przekazany');
    // AbortSignal.timeout zwraca obiekt z właściwością aborted
    assert.ok(typeof capturedSignal.aborted === 'boolean', 'signal musi mieć właściwość aborted');
  } finally {
    restore();
  }
});

/* ======================================================
 * Testy domyślnego timeoutu
 * ====================================================== */

test('fetchUpstream: bez argumentu timeoutMs używa domyślnych 8000 ms', async function () {
  // Nie możemy sprawdzić wartości AbortSignal.timeout bezpośrednio,
  // ale weryfikujemy, że wywołanie bez trzeciego argumentu nie rzuca błędu składniowego
  const restore = mockFetch(async function () {
    return makeOkResponse('<html></html>');
  });

  try {
    const result = await fetchUpstream('http://example.com/track', 'DEFAULT');
    assert.equal(typeof result, 'string');
  } finally {
    restore();
  }
});

/* ======================================================
 * Testy obsługi błędów — timeout / sieć
 * ====================================================== */

test('fetchUpstream: AbortError jest mapowany na ERR_UPSTREAM_TIMEOUT', async function () {
  const abortErr = new Error('The operation was aborted');
  abortErr.name = 'AbortError';

  const restore = mockFetch(async function () {
    throw abortErr;
  });

  try {
    await assert.rejects(
      fetchUpstream('http://example.com/track', 'ABC123', 500),
      function (err) {
        assert.ok(err instanceof TrackingError);
        assert.equal(err.code, ERR_UPSTREAM_TIMEOUT.code);
        assert.equal(err.httpStatus, ERR_UPSTREAM_TIMEOUT.httpStatus);
        return true;
      }
    );
  } finally {
    restore();
  }
});

test('fetchUpstream: TimeoutError (name=TimeoutError) jest mapowany na ERR_UPSTREAM_TIMEOUT', async function () {
  const timeoutErr = new Error('signal timed out');
  timeoutErr.name = 'TimeoutError';

  const restore = mockFetch(async function () {
    throw timeoutErr;
  });

  try {
    await assert.rejects(
      fetchUpstream('http://example.com/track', 'ABC123', 500),
      function (err) {
        assert.ok(err instanceof TrackingError);
        assert.equal(err.code, ERR_UPSTREAM_TIMEOUT.code);
        return true;
      }
    );
  } finally {
    restore();
  }
});

test('fetchUpstream: błąd sieci (TypeError) jest mapowany na ERR_UPSTREAM_TIMEOUT', async function () {
  const netErr = new TypeError('Failed to fetch');

  const restore = mockFetch(async function () {
    throw netErr;
  });

  try {
    await assert.rejects(
      fetchUpstream('http://example.com/track', 'ABC123', 500),
      function (err) {
        assert.ok(err instanceof TrackingError);
        assert.equal(err.code, ERR_UPSTREAM_TIMEOUT.code);
        assert.equal(err.httpStatus, ERR_UPSTREAM_TIMEOUT.httpStatus);
        return true;
      }
    );
  } finally {
    restore();
  }
});

test('fetchUpstream: ERR_UPSTREAM_TIMEOUT messagePl nie ujawnia adresu IP ani portu', async function () {
  const restore = mockFetch(async function () {
    const err = new Error('abort');
    err.name = 'AbortError';
    throw err;
  });

  try {
    await assert.rejects(
      fetchUpstream('http://111.231.71.230:8082/trackIndex.htm', 'ABC', 500),
      function (err) {
        assert.doesNotMatch(err.messagePl, /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
        assert.doesNotMatch(err.messagePl, /:\d{2,5}/);
        return true;
      }
    );
  } finally {
    restore();
  }
});

/* ======================================================
 * Testy obsługi odpowiedzi nie-2xx
 * ====================================================== */

test('fetchUpstream: odpowiedź 404 rzuca TrackingError z kodem not_found', async function () {
  const restore = mockFetch(async function () {
    return makeErrorResponse(404);
  });

  try {
    await assert.rejects(
      fetchUpstream('http://example.com/track', 'NOTFOUND', 500),
      function (err) {
        assert.ok(err instanceof TrackingError);
        assert.equal(err.code, ERR_NOT_FOUND.code);
        assert.equal(err.httpStatus, ERR_NOT_FOUND.httpStatus);
        return true;
      }
    );
  } finally {
    restore();
  }
});

test('fetchUpstream: odpowiedź 500 rzuca TrackingError z kodem not_found', async function () {
  const restore = mockFetch(async function () {
    return makeErrorResponse(500);
  });

  try {
    await assert.rejects(
      fetchUpstream('http://example.com/track', 'ERR500', 500),
      function (err) {
        assert.ok(err instanceof TrackingError);
        assert.equal(err.code, ERR_NOT_FOUND.code);
        return true;
      }
    );
  } finally {
    restore();
  }
});

test('fetchUpstream: odpowiedź 403 rzuca TrackingError z kodem not_found', async function () {
  const restore = mockFetch(async function () {
    return makeErrorResponse(403);
  });

  try {
    await assert.rejects(
      fetchUpstream('http://example.com/track', 'FORBIDDEN', 500),
      function (err) {
        assert.ok(err instanceof TrackingError);
        assert.equal(err.code, ERR_NOT_FOUND.code);
        return true;
      }
    );
  } finally {
    restore();
  }
});

/* ======================================================
 * Test: zero ponowień
 * ====================================================== */

test('fetchUpstream: brak ponowień — fetch wywołany dokładnie raz mimo błędu', async function () {
  let callCount = 0;

  const restore = mockFetch(async function () {
    callCount++;
    const err = new Error('abort');
    err.name = 'AbortError';
    throw err;
  });

  try {
    await assert.rejects(fetchUpstream('http://example.com/track', 'ONCE', 500));
    assert.equal(callCount, 1, 'fetch może być wywołany dokładnie raz — zero ponowień');
  } finally {
    restore();
  }
});
