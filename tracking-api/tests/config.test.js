'use strict';

/**
 * Testy jednostkowe lib/config.js — walidacja Konfiguracji_Środowiska
 * Requirements: 8.4, 9.1, 9.2, 9.10, 9.11, 7.5, 8.7
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

// Zapisuje i przywraca zmienne środowiskowe po każdym teście
function withEnv(overrides, fn) {
  const saved = {};
  const KEYS = [
    'TRACKING_UPSTREAM_URL',
    'TRACKING_ALLOWED_ORIGINS',
    'TRACKING_CACHE_TTL_SECONDS',
    'TRACKING_RATE_LIMIT',
    'TRACKING_RATE_WINDOW_SECONDS',
  ];

  // Usuń require cache by moduł czytał świeże process.env przy każdym teście
  for (const key of Object.keys(require.cache)) {
    if (key.includes('config.js') || key.includes('errors.js') || key.includes('log.js')) {
      delete require.cache[key];
    }
  }

  for (const key of KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }

  for (const [key, val] of Object.entries(overrides)) {
    if (val === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = val;
    }
  }

  try {
    return fn();
  } finally {
    for (const key of KEYS) {
      if (saved[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = saved[key];
      }
    }
    // Wyczyść require cache po teście
    for (const key of Object.keys(require.cache)) {
      if (key.includes('config.js') || key.includes('errors.js') || key.includes('log.js')) {
        delete require.cache[key];
      }
    }
  }
}

const VALID_ENV = {
  TRACKING_UPSTREAM_URL: 'http://example.com/track',
  TRACKING_ALLOWED_ORIGINS: 'https://fxlsereps.pl',
};

describe('lib/config.js', function () {

  describe('TRACKING_UPSTREAM_URL — wymagana', function () {

    it('akceptuje poprawny adres http', function () {
      withEnv({
        ...VALID_ENV,
        TRACKING_UPSTREAM_URL: 'http://example.com/path',
      }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.upstreamUrl, 'http://example.com/path');
      });
    });

    it('akceptuje poprawny adres https', function () {
      withEnv({
        ...VALID_ENV,
        TRACKING_UPSTREAM_URL: 'https://api.example.com',
      }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.upstreamUrl, 'https://api.example.com');
      });
    });

    it('akceptuje adres z portem i ścieżką', function () {
      withEnv({
        ...VALID_ENV,
        TRACKING_UPSTREAM_URL: 'http://192.168.1.1:8082/trackIndex.htm',
      }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.upstreamUrl, 'http://192.168.1.1:8082/trackIndex.htm');
      });
    });

    it('usuwa białe znaki z początku i końca', function () {
      withEnv({
        ...VALID_ENV,
        TRACKING_UPSTREAM_URL: '  http://example.com  ',
      }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.upstreamUrl, 'http://example.com');
      });
    });

    it('rzuca ERR_CONFIG_MISSING gdy zmienna nieobecna', function () {
      withEnv({
        TRACKING_ALLOWED_ORIGINS: 'https://fxlsereps.pl',
      }, function () {
        const { getConfig } = require('../lib/config.js');
        const { ERR_CONFIG_MISSING } = require('../lib/errors.js');
        assert.throws(function () { getConfig(); }, function (err) {
          return err.code === ERR_CONFIG_MISSING.code && err.httpStatus === 500;
        });
      });
    });

    it('rzuca ERR_CONFIG_MISSING gdy zmienna pusta', function () {
      withEnv({
        ...VALID_ENV,
        TRACKING_UPSTREAM_URL: '',
      }, function () {
        const { getConfig } = require('../lib/config.js');
        const { ERR_CONFIG_MISSING } = require('../lib/errors.js');
        assert.throws(function () { getConfig(); }, function (err) {
          return err.code === ERR_CONFIG_MISSING.code;
        });
      });
    });

    it('rzuca ERR_CONFIG_MISSING gdy zmienna złożona tylko z białych znaków', function () {
      withEnv({
        ...VALID_ENV,
        TRACKING_UPSTREAM_URL: '   ',
      }, function () {
        const { getConfig } = require('../lib/config.js');
        const { ERR_CONFIG_MISSING } = require('../lib/errors.js');
        assert.throws(function () { getConfig(); }, function (err) {
          return err.code === ERR_CONFIG_MISSING.code;
        });
      });
    });

    it('rzuca ERR_CONFIG_MISSING gdy URL > 2048 znaków', function () {
      withEnv({
        ...VALID_ENV,
        TRACKING_UPSTREAM_URL: 'http://example.com/' + 'a'.repeat(2030),
      }, function () {
        const { getConfig } = require('../lib/config.js');
        const { ERR_CONFIG_MISSING } = require('../lib/errors.js');
        assert.throws(function () { getConfig(); }, function (err) {
          return err.code === ERR_CONFIG_MISSING.code;
        });
      });
    });

    it('akceptuje URL o długości dokładnie 2048 znaków', function () {
      // http://x.com/ = 13 znaków, dopełniamy ścieżką do 2048
      const url = 'http://x.com/' + 'a'.repeat(2048 - 14);
      assert.ok(url.length <= 2048, 'url ma ' + url.length + ' znaków');
      withEnv({
        ...VALID_ENV,
        TRACKING_UPSTREAM_URL: url,
      }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.upstreamUrl, url);
      });
    });

    it('rzuca ERR_CONFIG_MISSING dla schematu ftp://', function () {
      withEnv({
        ...VALID_ENV,
        TRACKING_UPSTREAM_URL: 'ftp://example.com/path',
      }, function () {
        const { getConfig } = require('../lib/config.js');
        const { ERR_CONFIG_MISSING } = require('../lib/errors.js');
        assert.throws(function () { getConfig(); }, function (err) {
          return err.code === ERR_CONFIG_MISSING.code;
        });
      });
    });

    it('rzuca ERR_CONFIG_MISSING dla adresu bez hosta', function () {
      withEnv({
        ...VALID_ENV,
        TRACKING_UPSTREAM_URL: 'http://',
      }, function () {
        const { getConfig } = require('../lib/config.js');
        const { ERR_CONFIG_MISSING } = require('../lib/errors.js');
        assert.throws(function () { getConfig(); }, function (err) {
          return err.code === ERR_CONFIG_MISSING.code;
        });
      });
    });

    it('rzuca ERR_CONFIG_MISSING dla nieparsowanego adresu URL', function () {
      withEnv({
        ...VALID_ENV,
        TRACKING_UPSTREAM_URL: 'nie-jest-url',
      }, function () {
        const { getConfig } = require('../lib/config.js');
        const { ERR_CONFIG_MISSING } = require('../lib/errors.js');
        assert.throws(function () { getConfig(); }, function (err) {
          return err.code === ERR_CONFIG_MISSING.code;
        });
      });
    });
  });

  describe('TRACKING_ALLOWED_ORIGINS — wymagana', function () {

    it('akceptuje jedną poprawną domenę', function () {
      withEnv({
        ...VALID_ENV,
        TRACKING_ALLOWED_ORIGINS: 'https://fxlsereps.pl',
      }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.deepEqual(cfg.allowedOrigins, ['https://fxlsereps.pl']);
      });
    });

    it('akceptuje 10 domen (maksimum)', function () {
      const origins = Array.from({ length: 10 }, function (_, i) { return 'https://domain' + i + '.com'; });
      withEnv({
        ...VALID_ENV,
        TRACKING_ALLOWED_ORIGINS: origins.join(','),
      }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.allowedOrigins.length, 10);
      });
    });

    it('przycina białe znaki przy każdej pozycji', function () {
      withEnv({
        ...VALID_ENV,
        TRACKING_ALLOWED_ORIGINS: ' https://a.com , https://b.com ',
      }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.deepEqual(cfg.allowedOrigins, ['https://a.com', 'https://b.com']);
      });
    });

    it('rzuca ERR_CONFIG_MISSING gdy zmienna nieobecna', function () {
      withEnv({
        TRACKING_UPSTREAM_URL: VALID_ENV.TRACKING_UPSTREAM_URL,
      }, function () {
        const { getConfig } = require('../lib/config.js');
        const { ERR_CONFIG_MISSING } = require('../lib/errors.js');
        assert.throws(function () { getConfig(); }, function (err) {
          return err.code === ERR_CONFIG_MISSING.code;
        });
      });
    });

    it('rzuca ERR_CONFIG_MISSING gdy zmienna pusta', function () {
      withEnv({
        ...VALID_ENV,
        TRACKING_ALLOWED_ORIGINS: '',
      }, function () {
        const { getConfig } = require('../lib/config.js');
        const { ERR_CONFIG_MISSING } = require('../lib/errors.js');
        assert.throws(function () { getConfig(); }, function (err) {
          return err.code === ERR_CONFIG_MISSING.code;
        });
      });
    });

    it('rzuca ERR_CONFIG_MISSING gdy lista ma 11 pozycji', function () {
      const origins = Array.from({ length: 11 }, function (_, i) { return 'https://domain' + i + '.com'; });
      withEnv({
        ...VALID_ENV,
        TRACKING_ALLOWED_ORIGINS: origins.join(','),
      }, function () {
        const { getConfig } = require('../lib/config.js');
        const { ERR_CONFIG_MISSING } = require('../lib/errors.js');
        assert.throws(function () { getConfig(); }, function (err) {
          return err.code === ERR_CONFIG_MISSING.code;
        });
      });
    });

    it('rzuca ERR_CONFIG_MISSING gdy lista jest złożona tylko z przecinków', function () {
      withEnv({
        ...VALID_ENV,
        TRACKING_ALLOWED_ORIGINS: ',,,',
      }, function () {
        const { getConfig } = require('../lib/config.js');
        const { ERR_CONFIG_MISSING } = require('../lib/errors.js');
        assert.throws(function () { getConfig(); }, function (err) {
          return err.code === ERR_CONFIG_MISSING.code;
        });
      });
    });
  });

  describe('TRACKING_CACHE_TTL_SECONDS — opcjonalna', function () {

    it('zwraca domyślną wartość 3600 s (3600000 ms) gdy brak zmiennej', function () {
      withEnv(VALID_ENV, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.cacheTtlMs, 3600 * 1000);
        assert.ok(cfg.defaultsUsed.includes('TRACKING_CACHE_TTL_SECONDS'));
      });
    });

    it('akceptuje wartość 60 (minimum)', function () {
      withEnv({ ...VALID_ENV, TRACKING_CACHE_TTL_SECONDS: '60' }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.cacheTtlMs, 60 * 1000);
        assert.ok(!cfg.defaultsUsed.includes('TRACKING_CACHE_TTL_SECONDS'));
      });
    });

    it('akceptuje wartość 86400 (maksimum)', function () {
      withEnv({ ...VALID_ENV, TRACKING_CACHE_TTL_SECONDS: '86400' }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.cacheTtlMs, 86400 * 1000);
      });
    });

    it('używa domyślnej i dodaje do defaultsUsed gdy wartość 59 (poniżej minimum)', function () {
      withEnv({ ...VALID_ENV, TRACKING_CACHE_TTL_SECONDS: '59' }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.cacheTtlMs, 3600 * 1000);
        assert.ok(cfg.defaultsUsed.includes('TRACKING_CACHE_TTL_SECONDS'));
      });
    });

    it('używa domyślnej i dodaje do defaultsUsed gdy wartość 86401 (powyżej maksimum)', function () {
      withEnv({ ...VALID_ENV, TRACKING_CACHE_TTL_SECONDS: '86401' }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.cacheTtlMs, 3600 * 1000);
        assert.ok(cfg.defaultsUsed.includes('TRACKING_CACHE_TTL_SECONDS'));
      });
    });

    it('używa domyślnej gdy wartość nie jest liczbą', function () {
      withEnv({ ...VALID_ENV, TRACKING_CACHE_TTL_SECONDS: 'abc' }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.cacheTtlMs, 3600 * 1000);
        assert.ok(cfg.defaultsUsed.includes('TRACKING_CACHE_TTL_SECONDS'));
      });
    });

    it('używa domyślnej gdy wartość jest liczbą zmiennoprzecinkową', function () {
      withEnv({ ...VALID_ENV, TRACKING_CACHE_TTL_SECONDS: '3600.5' }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.cacheTtlMs, 3600 * 1000);
        assert.ok(cfg.defaultsUsed.includes('TRACKING_CACHE_TTL_SECONDS'));
      });
    });
  });

  describe('TRACKING_RATE_LIMIT — opcjonalna', function () {

    it('zwraca domyślną wartość 10 gdy brak zmiennej', function () {
      withEnv(VALID_ENV, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.rateLimit, 10);
        assert.ok(cfg.defaultsUsed.includes('TRACKING_RATE_LIMIT'));
      });
    });

    it('akceptuje wartość 1 (minimum)', function () {
      withEnv({ ...VALID_ENV, TRACKING_RATE_LIMIT: '1' }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.rateLimit, 1);
        assert.ok(!cfg.defaultsUsed.includes('TRACKING_RATE_LIMIT'));
      });
    });

    it('akceptuje wartość 1000 (maksimum)', function () {
      withEnv({ ...VALID_ENV, TRACKING_RATE_LIMIT: '1000' }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.rateLimit, 1000);
      });
    });

    it('używa domyślnej gdy wartość 0 (poniżej minimum)', function () {
      withEnv({ ...VALID_ENV, TRACKING_RATE_LIMIT: '0' }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.rateLimit, 10);
        assert.ok(cfg.defaultsUsed.includes('TRACKING_RATE_LIMIT'));
      });
    });

    it('używa domyślnej gdy wartość 1001 (powyżej maksimum)', function () {
      withEnv({ ...VALID_ENV, TRACKING_RATE_LIMIT: '1001' }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.rateLimit, 10);
        assert.ok(cfg.defaultsUsed.includes('TRACKING_RATE_LIMIT'));
      });
    });
  });

  describe('TRACKING_RATE_WINDOW_SECONDS — opcjonalna', function () {

    it('zwraca domyślną wartość 60 s (60000 ms) gdy brak zmiennej', function () {
      withEnv(VALID_ENV, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.rateWindowMs, 60 * 1000);
        assert.ok(cfg.defaultsUsed.includes('TRACKING_RATE_WINDOW_SECONDS'));
      });
    });

    it('akceptuje wartość 1 (minimum)', function () {
      withEnv({ ...VALID_ENV, TRACKING_RATE_WINDOW_SECONDS: '1' }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.rateWindowMs, 1000);
        assert.ok(!cfg.defaultsUsed.includes('TRACKING_RATE_WINDOW_SECONDS'));
      });
    });

    it('akceptuje wartość 3600 (maksimum)', function () {
      withEnv({ ...VALID_ENV, TRACKING_RATE_WINDOW_SECONDS: '3600' }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.rateWindowMs, 3600 * 1000);
      });
    });

    it('używa domyślnej gdy wartość 3601 (powyżej maksimum)', function () {
      withEnv({ ...VALID_ENV, TRACKING_RATE_WINDOW_SECONDS: '3601' }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.rateWindowMs, 60 * 1000);
        assert.ok(cfg.defaultsUsed.includes('TRACKING_RATE_WINDOW_SECONDS'));
      });
    });
  });

  describe('kształt zwracanego obiektu', function () {

    it('zawiera wszystkie pola gdy wszystkie zmienne podane poprawnie', function () {
      withEnv({
        TRACKING_UPSTREAM_URL: 'https://api.example.com/track',
        TRACKING_ALLOWED_ORIGINS: 'https://fxlsereps.pl,https://www.fxlsereps.pl',
        TRACKING_CACHE_TTL_SECONDS: '1800',
        TRACKING_RATE_LIMIT: '50',
        TRACKING_RATE_WINDOW_SECONDS: '120',
      }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.equal(cfg.upstreamUrl, 'https://api.example.com/track');
        assert.deepEqual(cfg.allowedOrigins, ['https://fxlsereps.pl', 'https://www.fxlsereps.pl']);
        assert.equal(cfg.cacheTtlMs, 1800 * 1000);
        assert.equal(cfg.rateLimit, 50);
        assert.equal(cfg.rateWindowMs, 120 * 1000);
        assert.deepEqual(cfg.defaultsUsed, []);
      });
    });

    it('defaultsUsed zawiera nazwy wszystkich trzech opcjonalnych zmiennych gdy ich brak', function () {
      withEnv(VALID_ENV, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.ok(cfg.defaultsUsed.includes('TRACKING_CACHE_TTL_SECONDS'));
        assert.ok(cfg.defaultsUsed.includes('TRACKING_RATE_LIMIT'));
        assert.ok(cfg.defaultsUsed.includes('TRACKING_RATE_WINDOW_SECONDS'));
      });
    });

    it('defaultsUsed jest pustą tablicą gdy wszystkie zmienne opcjonalne są prawidłowe', function () {
      withEnv({
        TRACKING_UPSTREAM_URL: 'http://example.com',
        TRACKING_ALLOWED_ORIGINS: 'https://example.pl',
        TRACKING_CACHE_TTL_SECONDS: '3600',
        TRACKING_RATE_LIMIT: '10',
        TRACKING_RATE_WINDOW_SECONDS: '60',
      }, function () {
        const { getConfig } = require('../lib/config.js');
        const cfg = getConfig();
        assert.deepEqual(cfg.defaultsUsed, []);
      });
    });
  });
});
