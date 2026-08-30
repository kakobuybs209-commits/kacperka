'use strict';

/**
 * Walidacja Konfiguracji_Środowiska Funkcji_Śledzenia.
 *
 * Zmienne środowiskowe:
 *   TRACKING_UPSTREAM_URL      — wymagana; schemat http/https, niepusty host, ≤ 2048 znaków
 *   TRACKING_ALLOWED_ORIGINS   — wymagana; lista rozdzielona przecinkami, 1–10 pozycji
 *   TRACKING_CACHE_TTL_SECONDS — opcjonalna; zakres 60–86400; domyślnie 3600
 *   TRACKING_RATE_LIMIT        — opcjonalna; zakres 1–1000; domyślnie 10
 *   TRACKING_RATE_WINDOW_SECONDS — opcjonalna; zakres 1–3600; domyślnie 60
 *
 * Funkcja czyta zmienne przy każdym żądaniu, dzięki czemu zmiana wartości
 * w ustawieniach projektu i ponowne wdrożenie nie wymagają zmiany kodu (wymaganie 9.11).
 *
 * @returns {{
 *   upstreamUrl: string,
 *   allowedOrigins: string[],
 *   cacheTtlMs: number,
 *   rateLimit: number,
 *   rateWindowMs: number,
 *   defaultsUsed: string[]
 * }}
 * @throws {import('./errors').TrackingError} ERR_CONFIG_MISSING gdy wymagana zmienna
 *   jest nieobecna lub ma nieprawidłową wartość.
 */
function getConfig() {
  const { ERR_CONFIG_MISSING } = require('./errors');
  const { writeLog } = require('./log');

  const defaultsUsed = [];

  /* ------------------------------------------------------------------ */
  /* 1. TRACKING_UPSTREAM_URL — wymagana                                  */
  /* ------------------------------------------------------------------ */
  const rawUpstreamUrl = process.env.TRACKING_UPSTREAM_URL;

  if (!rawUpstreamUrl || rawUpstreamUrl.trim().length === 0) {
    throw ERR_CONFIG_MISSING;
  }

  const upstreamUrl = rawUpstreamUrl.trim();

  if (upstreamUrl.length > 2048) {
    throw ERR_CONFIG_MISSING;
  }

  // Walidacja schematu i hosta przez wbudowany parser URL
  let parsedUrl;
  try {
    parsedUrl = new URL(upstreamUrl);
  } catch (_e) {
    throw ERR_CONFIG_MISSING;
  }

  const scheme = parsedUrl.protocol; // zawiera ':' na końcu, np. 'http:'
  if (scheme !== 'http:' && scheme !== 'https:') {
    throw ERR_CONFIG_MISSING;
  }

  // host (bez portu) musi być niepusty
  if (!parsedUrl.hostname || parsedUrl.hostname.length === 0) {
    throw ERR_CONFIG_MISSING;
  }

  /* ------------------------------------------------------------------ */
  /* 2. TRACKING_ALLOWED_ORIGINS — wymagana                               */
  /* ------------------------------------------------------------------ */
  const rawAllowedOrigins = process.env.TRACKING_ALLOWED_ORIGINS;

  if (!rawAllowedOrigins || rawAllowedOrigins.trim().length === 0) {
    throw ERR_CONFIG_MISSING;
  }

  const allowedOrigins = rawAllowedOrigins
    .split(',')
    .map(function (s) { return s.trim(); })
    .filter(function (s) { return s.length > 0; });

  if (allowedOrigins.length < 1 || allowedOrigins.length > 10) {
    throw ERR_CONFIG_MISSING;
  }

  /* ------------------------------------------------------------------ */
  /* 3. TRACKING_CACHE_TTL_SECONDS — opcjonalna, domyślnie 3600           */
  /* ------------------------------------------------------------------ */
  const CACHE_TTL_DEFAULT = 3600;
  const CACHE_TTL_MIN = 60;
  const CACHE_TTL_MAX = 86400;

  let cacheTtlSeconds = _parseOptionalInt(
    process.env.TRACKING_CACHE_TTL_SECONDS,
    CACHE_TTL_MIN,
    CACHE_TTL_MAX
  );

  if (cacheTtlSeconds === null) {
    cacheTtlSeconds = CACHE_TTL_DEFAULT;
    defaultsUsed.push('TRACKING_CACHE_TTL_SECONDS');
    writeLog({
      event: 'config_default_used',
      code: null,
      httpStatus: 0,
      reason: 'TRACKING_CACHE_TTL_SECONDS poza zakresem lub nieprawidłowa; użyto wartości domyślnej ' + CACHE_TTL_DEFAULT,
      durationMs: 0,
    });
  }

  /* ------------------------------------------------------------------ */
  /* 4. TRACKING_RATE_LIMIT — opcjonalna, domyślnie 10                    */
  /* ------------------------------------------------------------------ */
  const RATE_LIMIT_DEFAULT = 10;
  const RATE_LIMIT_MIN = 1;
  const RATE_LIMIT_MAX = 1000;

  let rateLimit = _parseOptionalInt(
    process.env.TRACKING_RATE_LIMIT,
    RATE_LIMIT_MIN,
    RATE_LIMIT_MAX
  );

  if (rateLimit === null) {
    rateLimit = RATE_LIMIT_DEFAULT;
    defaultsUsed.push('TRACKING_RATE_LIMIT');
    writeLog({
      event: 'config_default_used',
      code: null,
      httpStatus: 0,
      reason: 'TRACKING_RATE_LIMIT poza zakresem lub nieprawidłowa; użyto wartości domyślnej ' + RATE_LIMIT_DEFAULT,
      durationMs: 0,
    });
  }

  /* ------------------------------------------------------------------ */
  /* 5. TRACKING_RATE_WINDOW_SECONDS — opcjonalna, domyślnie 60           */
  /* ------------------------------------------------------------------ */
  const RATE_WINDOW_DEFAULT = 60;
  const RATE_WINDOW_MIN = 1;
  const RATE_WINDOW_MAX = 3600;

  let rateWindowSeconds = _parseOptionalInt(
    process.env.TRACKING_RATE_WINDOW_SECONDS,
    RATE_WINDOW_MIN,
    RATE_WINDOW_MAX
  );

  if (rateWindowSeconds === null) {
    rateWindowSeconds = RATE_WINDOW_DEFAULT;
    defaultsUsed.push('TRACKING_RATE_WINDOW_SECONDS');
    writeLog({
      event: 'config_default_used',
      code: null,
      httpStatus: 0,
      reason: 'TRACKING_RATE_WINDOW_SECONDS poza zakresem lub nieprawidłowa; użyto wartości domyślnej ' + RATE_WINDOW_DEFAULT,
      durationMs: 0,
    });
  }

  return {
    upstreamUrl,
    allowedOrigins,
    cacheTtlMs: cacheTtlSeconds * 1000,
    rateLimit,
    rateWindowMs: rateWindowSeconds * 1000,
    defaultsUsed,
  };
}

/**
 * Parsuje wartość opcjonalnej zmiennej środowiskowej jako liczbę całkowitą.
 *
 * @param {string|undefined} raw  - surowa wartość zmiennej środowiskowej
 * @param {number} min            - minimalna dopuszczalna wartość (włącznie)
 * @param {number} max            - maksymalna dopuszczalna wartość (włącznie)
 * @returns {number|null}
 *   - liczbę z zakresu [min, max] gdy wartość jest prawidłowa
 *   - null gdy zmienna jest nieobecna, pusta, nieprawidłowa lub poza zakresem
 *     (we wszystkich tych przypadkach wywołujący powinien użyć wartości domyślnej
 *     i dodać nazwę zmiennej do defaultsUsed)
 */
function _parseOptionalInt(raw, min, max) {
  if (raw === undefined || raw === null || raw.trim().length === 0) {
    return null;
  }

  const trimmed = raw.trim();
  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return null;
  }

  if (parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

module.exports = { getConfig };
