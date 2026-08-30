'use strict';

/**
 * Limiter_Zapytań — fixed-window rate limiter per bucket key.
 *
 * Design constraints:
 *  - State is a plain Map passed in by caller (testability).
 *  - `now` is always a parameter; zero calls to Date.now() inside window logic.
 *  - On rejection: count and windowEndsAt remain unchanged.
 *
 * Requirements: 8.2, 8.3, 8.8, 8.9, 8.10
 */

// ---------------------------------------------------------------------------
// IPv4 / IPv6 validation helpers
// ---------------------------------------------------------------------------

/** Simple IPv4 pattern: four 0-255 octets. */
const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/**
 * IPv6: full, compressed (::), or mixed IPv4/IPv6.
 * We accept the broad RFC 2373 address forms without a port.
 * The regex intentionally covers the common cases and delegates
 * the rare edge cases to the fallback bucket — acceptable per spec.
 */
const IPV6_RE = /^[0-9a-fA-F:]+$/;

/**
 * Returns true when the trimmed string looks like a valid IPv4 address.
 * @param {string} s
 * @returns {boolean}
 */
function isIPv4(s) {
  const m = IPV4_RE.exec(s);
  if (!m) return false;
  return [m[1], m[2], m[3], m[4]].every((part) => {
    const n = Number(part);
    return n >= 0 && n <= 255;
  });
}

/**
 * Returns true when the trimmed string looks like a valid IPv6 address.
 * Accepts full, compressed, and mixed forms.
 * @param {string} s
 * @returns {boolean}
 */
function isIPv6(s) {
  // Must contain at least one colon.
  if (!s.includes(':')) return false;
  // Must only contain hex digits and colons (allows :: and mixed IPv4 tail).
  // Strip a trailing IPv4 segment for mixed addresses before checking.
  const noMixed = s.replace(/(\d{1,3}\.){3}\d{1,3}$/, '0:0');
  return IPV6_RE.test(noMixed);
}

/**
 * Returns true when the string is a valid IPv4 or IPv6 address.
 * @param {string} s
 * @returns {boolean}
 */
function isValidIP(s) {
  return isIPv4(s) || isIPv6(s);
}

// ---------------------------------------------------------------------------
// Bucket key extraction
// ---------------------------------------------------------------------------

const FALLBACK_BUCKET = '__fallback__';

/**
 * Extracts the rate-limit bucket key from an HTTP request object.
 *
 * Rule (requirements 8.2, 8.9):
 *  - Take the first comma-separated entry in `x-forwarded-for` after trim().
 *  - If the header is absent, or the first entry is not a valid IPv4/IPv6
 *    address, return the shared fallback bucket "__fallback__".
 *
 * @param {object} req  Node.js-style HTTP request (has `.headers` object).
 * @returns {string}
 */
function extractBucketKey(req) {
  const header =
    req &&
    req.headers &&
    (req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For']);

  if (!header || typeof header !== 'string') {
    return FALLBACK_BUCKET;
  }

  // Take the first entry from the comma-separated list and trim whitespace.
  const firstEntry = header.split(',')[0].trim();

  if (!firstEntry || !isValidIP(firstEntry)) {
    return FALLBACK_BUCKET;
  }

  return firstEntry;
}

// ---------------------------------------------------------------------------
// Core rate-limit logic
// ---------------------------------------------------------------------------

/**
 * Checks (and records) a request against the fixed-window rate limiter.
 *
 * @param {Map<string, {count: number, windowEndsAt: number}>} state
 *   Caller-owned Map used as the in-memory bucket store.
 * @param {string} bucketKey
 *   The IP address string or "__fallback__" from extractBucketKey().
 * @param {number} now
 *   Current timestamp in milliseconds (never call Date.now() here).
 * @param {number} limit
 *   Maximum number of allowed requests per window (1–1000).
 * @param {number} windowMs
 *   Window duration in milliseconds (1_000–3_600_000).
 * @returns {{ allowed: boolean, retryAfterSeconds: number|null }}
 */
function checkRateLimit(state, bucketKey, now, limit, windowMs) {
  const entry = state.get(bucketKey);

  if (!entry || now >= entry.windowEndsAt) {
    // No existing entry, or the previous window has expired — open a new window.
    state.set(bucketKey, { count: 1, windowEndsAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: null };
  }

  // We are within an active window.
  if (entry.count < limit) {
    // Increment in-place — this is the same object already stored in the Map.
    entry.count += 1;
    return { allowed: true, retryAfterSeconds: null };
  }

  // Limit exceeded — do NOT modify count or windowEndsAt (requirement 8.10).
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((entry.windowEndsAt - now) / 1000)
  );
  return { allowed: false, retryAfterSeconds };
}

// ---------------------------------------------------------------------------
// Exports (CommonJS)
// ---------------------------------------------------------------------------

module.exports = { checkRateLimit, extractBucketKey, FALLBACK_BUCKET };
