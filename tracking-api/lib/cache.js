'use strict';

/**
 * Cache_Śledzenia — własna implementacja na Map.
 *
 * Wymagania: 7.1, 7.2, 7.3, 7.4, 7.8, 7.9
 *
 * Ograniczenie: moduł nie odwołuje się do Date.now() wewnątrz logiki;
 * bieżący czas jest pobierany przez funkcję nowFn przekazaną przy tworzeniu.
 */

const TTL_MIN_S = 60;
const TTL_MAX_S = 86400;
const DEFAULT_TTL_S = 3600;
const MAX_ENTRIES = 1000;
const LAZY_CLEANUP_GRACE_MS = 600 * 1000; // 600 s po upływie TTL

/**
 * Tworzy instancję Cache_Śledzenia.
 *
 * @param {number} [ttlSeconds]  - Czas życia wpisu w sekundach (60–86400; domyślnie 3600).
 *                                 Wartość poza zakresem jest po cichu zastąpiona domyślną.
 * @param {function} [nowFn]     - Funkcja zwracająca bieżący czas w ms (domyślnie Date.now).
 *                                 Wstrzykiwana, by testy nie zależały od prawdziwego zegara.
 * @returns {{ get(code: string): object|null, set(code: string, payload: object): void, size(): number }}
 */
function createCache(ttlSeconds, nowFn) {
  // Walidacja TTL: zakres 60–86400 s (wymaganie 7.4 / 7.5)
  let resolvedTtlMs;
  if (
    typeof ttlSeconds !== 'number' ||
    !Number.isFinite(ttlSeconds) ||
    ttlSeconds < TTL_MIN_S ||
    ttlSeconds > TTL_MAX_S
  ) {
    resolvedTtlMs = DEFAULT_TTL_S * 1000;
  } else {
    resolvedTtlMs = ttlSeconds * 1000;
  }

  // Dostawca czasu — zero odwołań do Date.now wewnątrz logiki (ograniczenie zadania)
  const now = typeof nowFn === 'function' ? nowFn : Date.now;

  /** @type {Map<string, { payload: object, insertedAt: number, expiresAt: number }>} */
  const store = new Map();

  /**
   * Normalizuje klucz: trim + toUpperCase (wymaganie 7.3).
   * @param {string} code
   * @returns {string}
   */
  function normalizeKey(code) {
    return String(code).trim().toUpperCase();
  }

  /**
   * Leniwe czyszczenie przy zapisie — usuwa wpisy przedawnione o > LAZY_CLEANUP_GRACE_MS
   * (wymaganie 7.4: nie później niż 600 s po upływie TTL).
   */
  function lazyCleanup() {
    const cutoff = now() - LAZY_CLEANUP_GRACE_MS;
    for (const [key, entry] of store) {
      if (entry.expiresAt < cutoff) {
        store.delete(key);
      }
    }
  }

  /**
   * Odczytuje wpis z cache.
   * Zwraca payload jeśli wpis istnieje i nie jest przedawniony.
   * Wpis przedawniony jest usuwany i zwracany jest null (wymaganie 7.4).
   * Każdy błąd jest pochłaniany i traktowany jako brak wpisu (wymaganie 7.8).
   *
   * @param {string} code
   * @returns {object|null}
   */
  function get(code) {
    try {
      const key = normalizeKey(code);
      const entry = store.get(key);
      if (!entry) return null;

      if (now() >= entry.expiresAt) {
        // Przedawniony wpis: usuń i zwróć brak (wymaganie 7.4)
        store.delete(key);
        return null;
      }

      return entry.payload;
    } catch (_) {
      // Każdy błąd → brak wpisu (wymaganie 7.8)
      return null;
    }
  }

  /**
   * Zapisuje wpis do cache.
   * TTL jest walidowany w konstruktorze — nieznane TTL daje wartość domyślną.
   * Przy zapisie:
   *   1. Leniwe czyszczenie wpisów przeterminowanych > 600 s (wymaganie 7.4).
   *   2. Jeśli rozmiar ≥ 1000, eksmisja najstarszego wpisu (pierwszy klucz Map) (wymaganie 7.9).
   *   3. Dodanie nowego wpisu.
   * Każdy błąd jest pochłaniany (wymaganie 7.8).
   *
   * @param {string} code
   * @param {object} payload
   */
  function set(code, payload) {
    try {
      const key = normalizeKey(code);
      const insertedAt = now();
      const expiresAt = insertedAt + resolvedTtlMs;

      // Leniwe czyszczenie przeterminowanych wpisów (wymaganie 7.4)
      lazyCleanup();

      // Twardy limit 1000 wpisów — eksmisja najstarszego (wymaganie 7.9)
      if (store.size >= MAX_ENTRIES) {
        const oldestKey = store.keys().next().value;
        if (oldestKey !== undefined) {
          store.delete(oldestKey);
        }
      }

      store.set(key, { payload, insertedAt, expiresAt });
    } catch (_) {
      // Każdy błąd → brak wpisu, obsługa kontynuowana (wymaganie 7.8)
    }
  }

  /**
   * Zwraca bieżącą liczbę wpisów w cache (wliczając potencjalnie przedawnione,
   * które nie zostały jeszcze wyczyszczone).
   *
   * @returns {number}
   */
  function size() {
    return store.size;
  }

  return { get, set, size };
}

module.exports = { createCache };
