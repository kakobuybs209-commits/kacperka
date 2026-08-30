'use strict';

/**
 * Klient Serwera_Upstream.
 *
 * Wysyła POST application/x-www-form-urlencoded z polem documentCode
 * do podanego URL. Timeout jest parametrem modułu (domyślnie 8000 ms),
 * dzięki czemu testy nie czekają na prawdziwy zegar.
 *
 * Rzuca TrackingError przy:
 *   - przekroczeniu limitu czasu (AbortError / TimeoutError) → ERR_UPSTREAM_TIMEOUT
 *   - błędzie sieci i każdym innym odrzuceniu fetch               → ERR_UPSTREAM_TIMEOUT
 *   - odpowiedzi z response.ok === false (np. 404 upstream)       → ERR_NOT_FOUND
 *
 * Wymagania: 2.6, 2.7, 1.9
 */

const { ERR_UPSTREAM_TIMEOUT, ERR_NOT_FOUND, TrackingError } = require('./errors');

/**
 * Wysyła zapytanie POST do Serwera_Upstream.
 *
 * @param {string} url            - pełny adres HTTP Serwera_Upstream
 * @param {string} normalizedCode - znormalizowany Kod_Śledzenia (już po trim+toUpperCase)
 * @param {number} [timeoutMs=8000] - limit czasu w milisekundach (parametr modułu)
 * @returns {Promise<string>}     - HTML zwrócony przez serwer upstream
 * @throws {TrackingError}        - przy timeout, błędzie sieci lub odpowiedzi nie-2xx
 */
async function fetchUpstream(url, normalizedCode, timeoutMs) {
  if (timeoutMs === undefined) {
    timeoutMs = 8000;
  }

  const body = new URLSearchParams({ documentCode: normalizedCode }).toString();

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    // AbortError (timeout) lub błąd sieci — mapujemy na ERR_UPSTREAM_TIMEOUT
    const reason = (err && err.name === 'AbortError')
      ? 'AbortSignal.timeout: przekroczony limit czasu (' + timeoutMs + ' ms)'
      : 'błąd sieci: ' + (err && err.message ? err.message : String(err));

    throw new TrackingError(
      ERR_UPSTREAM_TIMEOUT.code,
      ERR_UPSTREAM_TIMEOUT.httpStatus,
      ERR_UPSTREAM_TIMEOUT.messagePl,
      reason
    );
  }

  if (!response.ok) {
    throw new TrackingError(
      ERR_NOT_FOUND.code,
      ERR_NOT_FOUND.httpStatus,
      ERR_NOT_FOUND.messagePl,
      'serwer upstream zwrócił HTTP ' + response.status
    );
  }

  return response.text();
}

module.exports = { fetchUpstream };
