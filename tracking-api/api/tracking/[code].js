'use strict';

/**
 * Punkt wejścia Funkcji_Śledzenia — orkiestracja 7 kroków.
 *
 * Kolejność kroków (wymagania 8.1, 1.7, 1.11, 9.2, 7.1, 1.9, 7.6):
 *   1. Limiter_Zapytań  — zawsze zlicza żądanie; odrzuca z 429 + Retry-After
 *   2. Sprawdzenie Origin — 403 bez ACAO przy niedopasowaniu
 *   3. Walidacja Kodu_Śledzenia — 400 przy niepoprawnym kodzie
 *   4. Walidacja Konfiguracji — 500 przy brakującej konfiguracji
 *   5. Odczyt Cache_Śledzenia — zwrot 200 z cache przy trafieniu
 *   6. Zapytanie do Serwera_Upstream — 404 przy braku zdarzeń / timeout
 *   7. Zapis do Cache_Śledzenia — tylko dla 200 z ≥1 zdarzeniem
 *
 * Sygnatura Vercel Node.js serverless: (req, res)
 * Kod śledzenia pochodzi z req.query.code (dynamiczny segment trasy).
 */

const { createCache } = require('../../lib/cache');
const { checkRateLimit, extractBucketKey } = require('../../lib/rateLimiter');
const { checkOrigin } = require('../../lib/cors');
const { validateCode } = require('../../lib/validateCode');
const { getConfig } = require('../../lib/config');
const { fetchUpstream } = require('../../lib/upstreamClient');
const { parseUpstream } = require('../../lib/parseUpstream');
const { writeLog } = require('../../lib/log');
const {
  TrackingError,
  ERR_CODE_INVALID,
  ERR_ORIGIN_DENIED,
  ERR_NOT_FOUND,
  ERR_RATE_LIMITED,
  ERR_CONFIG_MISSING,
  ERR_INTERNAL,
} = require('../../lib/errors');

// ─── Singletony na poziomie modułu (cold start) ──────────────────────────────

/** Cache_Śledzenia — singleton tworzona przy zimnym starcie (wymaganie 7.x) */
const cache = createCache();

/** Stan Limitera_Zapytań — singleton Map (wymaganie 8.x) */
const rateLimiterState = new Map();

// ─── Stała pola Źródło ────────────────────────────────────────────────────────
const SOURCE = 'New Tracking Server';

// ─── Główna funkcja obsługi żądania ──────────────────────────────────────────

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
module.exports = async function handler(req, res) {
  const startMs = Date.now();

  try {
    // ── Krok 1: Limiter_Zapytań ────────────────────────────────────────────
    // Zlicza żądanie niezależnie od końcowego kodu HTTP (wymaganie 8.2).
    // Konfiguracja jest potrzebna do pobrania limitu i okna — jednak limiter
    // musi być krokiem PIERWSZYM przed odczytem config (wymaganie 8.1).
    // Używamy tymczasowych wartości domyślnych gdy config nie jest jeszcze
    // znana; config jest walidowana w kroku 4. Ponieważ limiter musi być
    // przed sprawdzeniem Origin i config, używamy stałych domyślnych tutaj —
    // docelowe wartości z config zostaną użyte jeśli config jest dostępna,
    // ale rzut TrackingError z config też jest za 429 (krok 4 jest za krokiem 1).
    //
    // Aby uniknąć czytania config dwukrotnie i jednocześnie zachować kolejność
    // kroków, limiter w kroku 1 używa wartości odczytanej live z process.env
    // (z fallbackiem do domyślnych) — co jest bezpieczne, bo getConfig() też
    // tak robi i jest idempotentne.
    const DEFAULT_RATE_LIMIT = 10;
    const DEFAULT_RATE_WINDOW_MS = 60_000;

    let earlyRateLimit = DEFAULT_RATE_LIMIT;
    let earlyRateWindowMs = DEFAULT_RATE_WINDOW_MS;
    try {
      const rl = parseInt(process.env.TRACKING_RATE_LIMIT, 10);
      if (Number.isFinite(rl) && rl >= 1 && rl <= 1000) earlyRateLimit = rl;
      const rw = parseInt(process.env.TRACKING_RATE_WINDOW_SECONDS, 10);
      if (Number.isFinite(rw) && rw >= 1 && rw <= 3600) earlyRateWindowMs = rw * 1000;
    } catch (_) {
      // użyj wartości domyślnych
    }

    const bucketKey = extractBucketKey(req);
    const now = Date.now();
    const rlResult = checkRateLimit(rateLimiterState, bucketKey, now, earlyRateLimit, earlyRateWindowMs);

    if (!rlResult.allowed) {
      // Nagłówek Retry-After (wymaganie 8.3)
      res.setHeader('Retry-After', String(rlResult.retryAfterSeconds));
      // ACAO jeszcze nie znamy — nie ustawiamy (limiter jest przed Origin check)
      res.setHeader('Content-Type', 'application/json');
      res.status(429).json({ success: false, message: ERR_RATE_LIMITED.messagePl });
      return;
    }

    // ── Krok 2: Sprawdzenie Origin ─────────────────────────────────────────
    // Odczytujemy listę dopuszczonych domen ze zmiennych środowiskowych.
    // W przypadku braku TRACKING_ALLOWED_ORIGINS checkOrigin zwróci denied.
    const rawOrigins = process.env.TRACKING_ALLOWED_ORIGINS || '';
    const allowedOrigins = rawOrigins
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const originHeader = req.headers['origin'];
    const { allowed: originAllowed, allowOriginValue } = checkOrigin(originHeader, allowedOrigins);

    if (!originAllowed) {
      // 403 — bez nagłówka ACAO (wymaganie 1.7, 9.7, 9.8)
      res.setHeader('Content-Type', 'application/json');
      res.status(403).json({ success: false, message: ERR_ORIGIN_DENIED.messagePl });
      return;
    }

    // Od tego miejsca Origin jest dopasowany — ustawiamy ACAO dla wszystkich dalszych odpowiedzi.
    res.setHeader('Access-Control-Allow-Origin', allowOriginValue);

    // ── Krok 3: Walidacja Kodu_Śledzenia ──────────────────────────────────
    const rawCode = req.query.code;

    // Brak lub pusty segment w URL → 400 (wymaganie 1.11)
    if (!rawCode || (typeof rawCode === 'string' && rawCode.trim() === '')) {
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({ success: false, message: ERR_CODE_INVALID.messagePl });
      return;
    }

    const { ok: codeOk, normalized } = validateCode(rawCode);
    if (!codeOk) {
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({ success: false, message: ERR_CODE_INVALID.messagePl });
      return;
    }

    // ── Krok 4: Walidacja Konfiguracji ────────────────────────────────────
    let config;
    try {
      config = getConfig();
    } catch (err) {
      const durationMs = Date.now() - startMs;
      writeLog({
        event: 'config_error',
        code: 'config_missing',
        httpStatus: 500,
        reason: err instanceof TrackingError ? err.logReason : String(err),
        durationMs,
      });
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ success: false, message: ERR_CONFIG_MISSING.messagePl });
      return;
    }

    // ── Krok 5: Odczyt Cache_Śledzenia ────────────────────────────────────
    const cached = cache.get(normalized);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        success: true,
        Informacje_główne: cached.Informacje_główne,
        Szczegóły_przesyłki: cached.Szczegóły_przesyłki,
        Źródło: cached.Źródło,
      });
      return;
    }

    // ── Krok 6: Zapytanie do Serwera_Upstream ─────────────────────────────
    let html;
    try {
      html = await fetchUpstream(config.upstreamUrl, normalized);
    } catch (err) {
      // ERR_UPSTREAM_TIMEOUT lub ERR_NOT_FOUND — oba mapują na 404
      const trackErr = err instanceof TrackingError ? err : ERR_NOT_FOUND;
      const durationMs = Date.now() - startMs;
      writeLog({
        event: 'not_found',
        code: null,
        httpStatus: 404,
        reason: 'No events for code',
        durationMs,
      });
      res.setHeader('Content-Type', 'application/json');
      res.status(trackErr.httpStatus).json({ success: false, message: trackErr.messagePl });
      return;
    }

    // Parsowanie HTML
    const { mainInfo, events } = parseUpstream(html);

    // Brak zdarzeń → 404 (wymaganie 1.9)
    if (!events || events.length === 0) {
      const durationMs = Date.now() - startMs;
      writeLog({
        event: 'not_found',
        code: null,
        httpStatus: 404,
        reason: 'No events for code',
        durationMs,
      });
      res.setHeader('Content-Type', 'application/json');
      res.status(404).json({ success: false, message: ERR_NOT_FOUND.messagePl });
      return;
    }

    // ── Krok 7: Zapis do Cache_Śledzenia ──────────────────────────────────
    // Tylko dla 200 z ≥1 zdarzeniem (wymaganie 7.6)
    const payload = {
      Informacje_główne: mainInfo,
      Szczegóły_przesyłki: events,
      Źródło: SOURCE,
    };
    cache.set(normalized, payload);

    // Odpowiedź 200
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      Informacje_główne: mainInfo,
      Szczegóły_przesyłki: events,
      Źródło: SOURCE,
    });
  } catch (err) {
    // Globalny try/catch — mapowanie nieoczekiwanego wyjątku na 500 (wymaganie 6.3)
    const durationMs = Date.now() - startMs;
    writeLog({
      event: 'internal_error',
      code: 'internal_error',
      httpStatus: 500,
      reason: String(err),
      durationMs,
    });
    try {
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ success: false, message: ERR_INTERNAL.messagePl });
    } catch (_) {
      // odpowiedź już mogła być wysłana — pochłaniamy
    }
  }
};
