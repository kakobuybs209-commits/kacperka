'use strict';

/**
 * Jednolinijkowy wpis dziennika w formacie JSON zapisywany do process.stdout.
 *
 * Pola wpisu:
 *   ts          — znacznik czasu ISO 8601
 *   event       — identyfikator zdarzenia (np. 'request_error', 'request_success')
 *   code        — kod błędu TrackingError albo null dla sukcesu
 *   httpStatus  — kod statusu HTTP odpowiedzi
 *   reason      — logReason z TrackingError albo pusty łańcuch
 *   durationMs  — czas obsługi żądania w milisekundach
 *
 * Zasady:
 *   - Wpis nigdy nie zawiera treści odpowiedzi serwera upstream.
 *   - Błąd zapisu dziennika (process.stdout.write) jest przechwytywany i cicho pochłaniany.
 *   - Każde wywołanie zapisuje dokładnie jedną linię JSON zakończoną '\n'.
 *
 * @param {{ event: string, code: string|null, httpStatus: number, reason: string, durationMs: number }} entry
 */
function writeLog(entry) {
  try {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      event: entry.event,
      code: entry.code !== undefined ? entry.code : null,
      httpStatus: entry.httpStatus,
      reason: entry.reason !== undefined ? entry.reason : '',
      durationMs: entry.durationMs,
    });
    process.stdout.write(line + '\n');
  } catch (_err) {
    // błąd zapisu dziennika jest pochłaniany — nie może przerwać obsługi żądania
  }
}

module.exports = { writeLog };
