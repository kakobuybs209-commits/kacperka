/**
 * Integration tests for the tracking serverless function.
 *
 * Run standalone (separate from npm test):
 *   node tests/integration/integration.js
 *   FXTRK_API_URL=https://... node tests/integration/integration.js
 *
 * Required env vars:
 *   FXTRK_API_URL          - base URL of deployed function, e.g. https://project.vercel.app
 *   FXTRK_TRACKING_CODE    - a valid tracking code that returns 200 with events
 *   FXTRK_NONEXISTENT_CODE - a code known to return 404
 *   FXTRK_ALLOWED_ORIGIN   - an origin allowed by the function's TRACKING_ALLOWED_ORIGINS config
 *
 * This file uses .js (not .test.js) so it is NOT picked up by the
 * `npm test` glob  "tests/**\/*.test.js"  and must be run directly.
 *
 * Validates: Requirements 9.3, 9.4, 9.7, 9.8, 6.2
 */

'use strict';

const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');

// ---------------------------------------------------------------------------
// Config from environment
// ---------------------------------------------------------------------------
const API_URL          = (process.env.FXTRK_API_URL || '').replace(/\/$/, '');
const TRACKING_CODE    = process.env.FXTRK_TRACKING_CODE    || '';
const NONEXISTENT_CODE = process.env.FXTRK_NONEXISTENT_CODE || '';
const ALLOWED_ORIGIN   = process.env.FXTRK_ALLOWED_ORIGIN   || '';

/** When FXTRK_API_URL is unset all tests are skipped gracefully. */
const SKIP = !API_URL;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the full endpoint URL for a given tracking code.
 * @param {string} code
 * @returns {string}
 */
function endpointUrl(code) {
  return `${API_URL}/api/tracking/${encodeURIComponent(code)}`;
}

/**
 * Fetch with an explicit deadline (ms).  Returns { res, body } where body is
 * parsed JSON when Content-Type contains application/json, otherwise raw text.
 * @param {string} url
 * @param {RequestInit} opts
 * @param {number} timeoutMs
 * @returns {Promise<{ res: Response, body: any }>}
 */
async function fetchWithTimeout(url, opts = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    const contentType = res.headers.get('content-type') || '';
    let body;
    if (contentType.includes('application/json')) {
      body = await res.json();
    } else {
      body = await res.text();
    }
    return { res, body };
  } finally {
    clearTimeout(timerId);
  }
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Tracking function — integration', () => {

  before(() => {
    if (SKIP) {
      console.log('[SKIP] FXTRK_API_URL is not set — all integration tests will be skipped.');
    }
  });

  // -------------------------------------------------------------------------
  // Test 1: valid tracking code → 200 with non-empty events list, within 10 s
  // Validates: Requirements 6.2, 9.4
  // -------------------------------------------------------------------------
  test(
    'valid code returns 200 with non-empty events list within 10 s budget',
    { skip: SKIP || !TRACKING_CODE },
    async () => {
      const start = Date.now();

      const { res, body } = await fetchWithTimeout(
        endpointUrl(TRACKING_CODE),
        {
          method:  'GET',
          headers: { Origin: ALLOWED_ORIGIN || 'https://fxlsereps.pl' },
        },
        11000, // 11 s fetch deadline; we check elapsed < 10 000 ms ourselves
      );

      const elapsed = Date.now() - start;

      // HTTP status
      assert.equal(res.status, 200, `Expected HTTP 200, got ${res.status}`);

      // 10 s budget (requirement 6.2)
      assert.ok(
        elapsed < 10000,
        `Response must arrive within 10 000 ms (took ${elapsed} ms)`,
      );

      // Content-Type must be application/json (requirement 1.4)
      const contentType = res.headers.get('content-type') || '';
      assert.ok(
        contentType.includes('application/json'),
        `Expected Content-Type: application/json, got "${contentType}"`,
      );

      // success: true
      assert.equal(body.success, true, 'Expected success: true in response body');

      // Non-empty events list (requirement 6.2)
      assert.ok(
        Array.isArray(body['Szczegóły_przesyłki']),
        'Expected Szczegóły_przesyłki to be an array',
      );
      assert.ok(
        body['Szczegóły_przesyłki'].length >= 1,
        `Expected at least one tracking event, got ${body['Szczegóły_przesyłki'].length}`,
      );
    },
  );

  // -------------------------------------------------------------------------
  // Test 2: non-existent tracking code → 404
  // Validates: Requirements 6.2
  // -------------------------------------------------------------------------
  test(
    'non-existent tracking code returns 404',
    { skip: SKIP || !NONEXISTENT_CODE },
    async () => {
      const { res, body } = await fetchWithTimeout(
        endpointUrl(NONEXISTENT_CODE),
        {
          method:  'GET',
          headers: { Origin: ALLOWED_ORIGIN || 'https://fxlsereps.pl' },
        },
      );

      assert.equal(res.status, 404, `Expected HTTP 404, got ${res.status}`);
      assert.equal(body.success, false, 'Expected success: false in 404 response');
      assert.ok(
        typeof body.message === 'string' && body.message.length > 0,
        'Expected a non-empty message string in 404 response',
      );
    },
  );

  // -------------------------------------------------------------------------
  // Test 3: request from disallowed Origin → 403 without Access-Control-Allow-Origin
  // Validates: Requirements 9.7, 9.8
  // -------------------------------------------------------------------------
  test(
    'request from disallowed Origin returns 403 without Access-Control-Allow-Origin header',
    { skip: SKIP },
    async () => {
      const disallowedOrigin = 'https://definitely-not-allowed.example.com';

      // CORS check is the second step in the handler — any code works here
      const code = TRACKING_CODE || NONEXISTENT_CODE || 'TEST123456';

      const { res, body } = await fetchWithTimeout(
        endpointUrl(code),
        {
          method:  'GET',
          headers: { Origin: disallowedOrigin },
        },
      );

      // Must be 403 (requirement 9.7)
      assert.equal(res.status, 403, `Expected HTTP 403 for disallowed origin, got ${res.status}`);

      // Access-Control-Allow-Origin must be absent (requirement 9.7)
      const acao = res.headers.get('access-control-allow-origin');
      assert.equal(
        acao,
        null,
        `Expected no Access-Control-Allow-Origin header on 403 response, but got "${acao}"`,
      );

      // Body must have success: false
      assert.equal(body.success, false, 'Expected success: false in 403 response');
    },
  );

  // -------------------------------------------------------------------------
  // Test 4: request over http → no response or redirect to https
  // Validates: Requirements 9.3
  // -------------------------------------------------------------------------
  test(
    'request over http receives no usable response or is redirected to https',
    { skip: SKIP },
    async () => {
      // Build the http:// counterpart of the HTTPS API URL
      const httpUrl = API_URL.replace(/^https:\/\//, 'http://');

      if (httpUrl === API_URL) {
        // FXTRK_API_URL doesn't start with https:// — test not applicable
        console.log('    [SKIP] FXTRK_API_URL does not start with https://, skipping http test');
        return;
      }

      const code = TRACKING_CODE || NONEXISTENT_CODE || 'TEST123456';
      const url  = `${httpUrl}/api/tracking/${encodeURIComponent(code)}`;

      let outcome = 'unknown';

      try {
        const controller = new AbortController();
        const timerId = setTimeout(() => controller.abort(), 10000);

        let res;
        try {
          res = await fetch(url, {
            method:   'GET',
            redirect: 'manual', // capture 3xx without following
            headers:  { Origin: ALLOWED_ORIGIN || 'https://fxlsereps.pl' },
            signal:   controller.signal,
          });
        } finally {
          clearTimeout(timerId);
        }

        const status = res.status;

        if (status >= 300 && status < 400) {
          // Redirect — location must point to https (requirement 9.3)
          const location = res.headers.get('location') || '';
          assert.ok(
            location.startsWith('https://'),
            `Redirect must point to https://, got location: "${location}"`,
          );
          outcome = `redirect ${status} → ${location}`;
        } else if (status === 0 || status === 421) {
          // 421 Misdirected Request — platform refuses plain http; acceptable
          outcome = `status ${status} (http not served by platform)`;
        } else {
          // A usable non-redirect response over plain http violates requirement 9.3
          assert.fail(
            `Expected no usable http response (redirect or connection refused), got HTTP ${status}`,
          );
        }
      } catch (err) {
        if (err instanceof assert.AssertionError) {
          throw err; // re-throw our own assertion failures
        }
        // Network-level errors (ECONNREFUSED, ECONNRESET, AbortError) mean
        // the platform does not serve http at all — this satisfies requirement 9.3
        if (err.name === 'AbortError') {
          outcome = 'connection timed out (no http server)';
        } else {
          outcome = `connection error: ${err.message}`;
        }
      }

      console.log(`    http test outcome: ${outcome}`);
    },
  );

});
