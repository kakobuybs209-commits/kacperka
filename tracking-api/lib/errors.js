'use strict';

/**
 * Taksonomia błędów Funkcji_Śledzenia.
 * Każdy błąd ma: code (identyfikator), httpStatus (kod HTTP odpowiedzi),
 * messagePl (komunikat po polsku, ≤ 200 znaków, bez adresu IP / portu / hosta / śladu stosu),
 * logReason (szczegółowa przyczyna do dziennika, nigdy nie trafia do odpowiedzi HTTP).
 */
class TrackingError extends Error {
  /**
   * @param {string} code         - stały identyfikator błędu (np. 'code_invalid')
   * @param {number} httpStatus   - kod statusu HTTP (400 / 403 / 404 / 429 / 500)
   * @param {string} messagePl    - komunikat po polsku widoczny w odpowiedzi HTTP
   * @param {string} [logReason]  - opcjonalny opis przyczyny wyłącznie do dziennika
   */
  constructor(code, httpStatus, messagePl, logReason) {
    super(messagePl);
    this.name = 'TrackingError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.messagePl = messagePl;
    this.logReason = logReason || '';
  }
}

/* ---------- Stałe błędów ---------- */

/** 400 — podany kod śledzenia jest nieprawidłowy (zbyt krótki, zbyt długi lub zawiera niedozwolone znaki). */
const ERR_CODE_INVALID = new TrackingError(
  'code_invalid',
  400,
  'Podany kod śledzenia jest nieprawidłowy. Kod powinien mieć od 6 do 40 znaków i zawierać wyłącznie litery, cyfry oraz łącznik.',
  'kod śledzenia nie przeszedł walidacji formatu'
);

/** 403 — żądanie pochodzi z niedozwolonej domeny (brak nagłówka Origin lub niedopasowana wartość). */
const ERR_ORIGIN_DENIED = new TrackingError(
  'origin_denied',
  403,
  'Dostęp zabroniony.',
  'nagłówek Origin nieobecny lub niedopasowany do listy dozwolonych domen'
);

/** 404 — brak danych o przesyłce dla podanego kodu. */
const ERR_NOT_FOUND = new TrackingError(
  'not_found',
  404,
  'Nie znaleziono informacji o przesyłce dla podanego kodu śledzenia.',
  'serwer upstream nie zwrócił żadnych zdarzeń śledzenia'
);

/** 404 — serwer upstream nie odpowiedział w wymaganym czasie. */
const ERR_UPSTREAM_TIMEOUT = new TrackingError(
  'upstream_timeout',
  404,
  'Nie znaleziono informacji o przesyłce. Serwer zewnętrzny nie odpowiedział w wymaganym czasie.',
  'przekroczony limit czasu zapytania do serwera upstream (8000 ms)'
);

/** 429 — przekroczono limit zapytań dla danego adresu IP. */
const ERR_RATE_LIMITED = new TrackingError(
  'rate_limited',
  429,
  'Przekroczono limit zapytań. Spróbuj ponownie za chwilę.',
  'przekroczony limit zapytań dla danego adresu IP'
);

/** 500 — brak wymaganej konfiguracji środowiskowej. */
const ERR_CONFIG_MISSING = new TrackingError(
  'config_missing',
  500,
  'Błąd konfiguracji serwera. Skontaktuj się z administratorem.',
  'brak lub błędna wartość wymaganej zmiennej środowiskowej'
);

/** 500 — nieobsłużony błąd wewnętrzny serwera. */
const ERR_INTERNAL = new TrackingError(
  'internal_error',
  500,
  'Wystąpił błąd serwera. Spróbuj ponownie za chwilę.',
  'nieobsłużony wyjątek wewnętrzny'
);

module.exports = {
  TrackingError,
  ERR_CODE_INVALID,
  ERR_ORIGIN_DENIED,
  ERR_NOT_FOUND,
  ERR_UPSTREAM_TIMEOUT,
  ERR_RATE_LIMITED,
  ERR_CONFIG_MISSING,
  ERR_INTERNAL,
};
