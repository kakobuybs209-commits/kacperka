'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createCache } = require('../lib/cache.js');

// ---------------------------------------------------------------------------
// Helper: sterowalne zegary
// ---------------------------------------------------------------------------

/**
 * Zwraca { nowFn, advance(ms) }.
 * nowFn() zawsze zwraca bieżący czas w ms (nie odwołuje się do Date.now).
 */
function makeClock(startMs = 0) {
  let t = startMs;
  return {
    nowFn: () => t,
    advance(ms) { t += ms; },
  };
}

const PAYLOAD_A = { event: 'A', items: [1, 2, 3] };
const PAYLOAD_B = { event: 'B', items: [4, 5, 6] };

// ---------------------------------------------------------------------------
// 1. Walidacja TTL
// ---------------------------------------------------------------------------

describe('createCache — walidacja TTL', () => {
  it('akceptuje TTL = 60 s (dolna granica zakresu)', () => {
    const { nowFn, advance } = makeClock();
    const cache = createCache(60, nowFn);
    cache.set('CODE', PAYLOAD_A);
    advance(59_999);
    assert.deepEqual(cache.get('CODE'), PAYLOAD_A, 'wpis powinien istnieć przed upływem TTL');
    advance(1); // łącznie 60 000 ms — dokładnie na granicy
    assert.equal(cache.get('CODE'), null, 'wpis powinien wygasnąć po 60 000 ms');
  });

  it('akceptuje TTL = 86400 s (górna granica zakresu)', () => {
    const { nowFn, advance } = makeClock();
    const cache = createCache(86400, nowFn);
    cache.set('CODE', PAYLOAD_A);
    advance(86_400_000 - 1);
    assert.deepEqual(cache.get('CODE'), PAYLOAD_A);
    advance(1);
    assert.equal(cache.get('CODE'), null);
  });

  it('używa domyślnego TTL = 3600 s gdy wartość < 60', () => {
    const { nowFn, advance } = makeClock();
    const cache = createCache(59, nowFn);
    cache.set('K', PAYLOAD_A);
    advance(3_600_000 - 1);
    assert.deepEqual(cache.get('K'), PAYLOAD_A, 'wpis powinien istnieć przed domyślnym TTL');
    advance(1);
    assert.equal(cache.get('K'), null, 'wpis powinien wygasnąć po domyślnym TTL');
  });

  it('używa domyślnego TTL = 3600 s gdy wartość > 86400', () => {
    const { nowFn, advance } = makeClock();
    const cache = createCache(86401, nowFn);
    cache.set('K', PAYLOAD_A);
    advance(3_600_000 - 1);
    assert.deepEqual(cache.get('K'), PAYLOAD_A);
    advance(1);
    assert.equal(cache.get('K'), null);
  });

  it('używa domyślnego TTL gdy wartość to NaN', () => {
    const { nowFn, advance } = makeClock();
    const cache = createCache(NaN, nowFn);
    cache.set('K', PAYLOAD_A);
    advance(3_600_000 - 1);
    assert.deepEqual(cache.get('K'), PAYLOAD_A);
    advance(1);
    assert.equal(cache.get('K'), null);
  });

  it('używa domyślnego TTL gdy wartość to string', () => {
    const { nowFn, advance } = makeClock();
    const cache = createCache('3600', nowFn);
    cache.set('K', PAYLOAD_A);
    advance(3_600_000 - 1);
    assert.deepEqual(cache.get('K'), PAYLOAD_A);
  });

  it('używa domyślnego TTL gdy ttlSeconds jest undefined', () => {
    const { nowFn, advance } = makeClock();
    const cache = createCache(undefined, nowFn);
    cache.set('K', PAYLOAD_A);
    advance(3_600_000 - 1);
    assert.deepEqual(cache.get('K'), PAYLOAD_A);
  });
});

// ---------------------------------------------------------------------------
// 2. Podstawowe operacje get/set
// ---------------------------------------------------------------------------

describe('get/set — podstawowe operacje', () => {
  it('zwraca null dla nieistniejącego klucza', () => {
    const cache = createCache(3600, makeClock().nowFn);
    assert.equal(cache.get('NIEISTNIEJE'), null);
  });

  it('zwraca zapisany payload', () => {
    const cache = createCache(3600, makeClock().nowFn);
    cache.set('XYZ', PAYLOAD_A);
    assert.deepEqual(cache.get('XYZ'), PAYLOAD_A);
  });

  it('nadpisuje istniejący wpis przy ponownym set', () => {
    const cache = createCache(3600, makeClock().nowFn);
    cache.set('XYZ', PAYLOAD_A);
    cache.set('XYZ', PAYLOAD_B);
    assert.deepEqual(cache.get('XYZ'), PAYLOAD_B);
  });
});

// ---------------------------------------------------------------------------
// 3. Normalizacja klucza (wymaganie 7.3)
// ---------------------------------------------------------------------------

describe('normalizacja klucza — trim + toUpperCase (req 7.3)', () => {
  it('traktuje „abc" i „ABC" jako ten sam klucz', () => {
    const cache = createCache(3600, makeClock().nowFn);
    cache.set('abc', PAYLOAD_A);
    assert.deepEqual(cache.get('ABC'), PAYLOAD_A);
  });

  it('przycina białe znaki z klucza przed normalizacją', () => {
    const cache = createCache(3600, makeClock().nowFn);
    cache.set('  abc  ', PAYLOAD_A);
    assert.deepEqual(cache.get('ABC'), PAYLOAD_A);
    assert.deepEqual(cache.get('  ABC  '), PAYLOAD_A);
  });

  it('traktuje „ AbC " i „ABC" jako ten sam klucz', () => {
    const cache = createCache(3600, makeClock().nowFn);
    cache.set(' AbC ', PAYLOAD_A);
    assert.deepEqual(cache.get('ABC'), PAYLOAD_A);
  });

  it('zapisanie przez małe litery i odczyt przez wielkie daje ten sam wpis', () => {
    const cache = createCache(3600, makeClock().nowFn);
    cache.set('abc123', PAYLOAD_A);
    assert.deepEqual(cache.get('ABC123'), PAYLOAD_A);
  });
});

// ---------------------------------------------------------------------------
// 4. Przeterminowanie wpisów (wymaganie 7.4)
// ---------------------------------------------------------------------------

describe('przeterminowanie wpisów (req 7.4)', () => {
  it('zwraca null po upływie TTL', () => {
    const { nowFn, advance } = makeClock();
    const cache = createCache(120, nowFn); // TTL = 120 s
    cache.set('CODE', PAYLOAD_A);
    advance(120_001);
    assert.equal(cache.get('CODE'), null);
  });

  it('zwraca wpis tuż przed upływem TTL', () => {
    const { nowFn, advance } = makeClock();
    const cache = createCache(120, nowFn);
    cache.set('CODE', PAYLOAD_A);
    advance(119_999);
    assert.deepEqual(cache.get('CODE'), PAYLOAD_A);
  });

  it('usuwa przeterminowany wpis z Map przy odczycie (req 7.4)', () => {
    const { nowFn, advance } = makeClock();
    const cache = createCache(60, nowFn);
    cache.set('CODE', PAYLOAD_A);
    assert.equal(cache.size(), 1);
    advance(60_001);
    cache.get('CODE'); // wywołuje usunięcie
    assert.equal(cache.size(), 0, 'przeterminowany wpis powinien zostać usunięty po odczycie');
  });
});

// ---------------------------------------------------------------------------
// 5. Leniwe czyszczenie przy set — grace 600 s (wymaganie 7.4)
// ---------------------------------------------------------------------------

describe('leniwe czyszczenie przy set — grace 600 s (req 7.4)', () => {
  it('usuwa wpisy przeterminowane o > 600 s przy kolejnym set', () => {
    const { nowFn, advance } = makeClock();
    const cache = createCache(60, nowFn); // TTL = 60 s

    cache.set('OLD', PAYLOAD_A); // wygasa w t = 60 000
    advance(660_001); // t = 660 001 ms; OLD przeterminowany o 600 001 ms > 600 000 ms grace

    assert.equal(cache.size(), 1, 'przed set OLD powinien być w Map');
    cache.set('NEW', PAYLOAD_B); // wywołuje lazyCleanup → OLD usunięty, NEW dodany
    assert.equal(cache.size(), 1, 'po set cache powinien zawierać tylko NEW');
    assert.deepEqual(cache.get('NEW'), PAYLOAD_B);
  });

  it('nie usuwa wpisów przeterminowanych o < 600 s przy set', () => {
    const { nowFn, advance } = makeClock();
    const cache = createCache(60, nowFn); // TTL = 60 s

    cache.set('OLD', PAYLOAD_A); // wygasa w t = 60 000
    advance(659_999); // przeterminowany o ~599 999 ms < 600 000 ms grace

    cache.set('NEW', PAYLOAD_B);
    // OLD powinien zostać, bo grace jeszcze nie upłynął
    assert.equal(cache.size(), 2, 'OLD nie powinien być usunięty — grace niecały');
  });

  it('czyści wiele starych wpisów jednocześnie przy set', () => {
    const { nowFn, advance } = makeClock();
    const cache = createCache(60, nowFn);

    for (let i = 0; i < 5; i++) {
      cache.set(`OLD${i}`, { n: i });
    }
    assert.equal(cache.size(), 5);

    advance(660_001); // wszystkie 5 przeterminowane o > 600 s
    cache.set('NEW', PAYLOAD_A);
    assert.equal(cache.size(), 1, 'wszystkie OLD powinny zostać wyczyszczone');
  });
});

// ---------------------------------------------------------------------------
// 6. Twardy limit 1000 wpisów z eksmisją najstarszego (wymaganie 7.9)
// ---------------------------------------------------------------------------

describe('twardy limit 1000 wpisów — eksmisja najstarszego (req 7.9)', () => {
  it('po wypełnieniu cache do 1000 wpisów, set eksmituje najstarszy wpis', () => {
    const { nowFn, advance } = makeClock();
    const cache = createCache(3600, nowFn);

    for (let i = 0; i < 1000; i++) {
      cache.set(`CODE${i}`, { n: i });
      advance(1); // różne czasy wstawiania — CODE0 najstarszy
    }
    assert.equal(cache.size(), 1000);
    assert.notEqual(cache.get('CODE0'), null, 'CODE0 powinien istnieć przed nowym set');

    cache.set('CODE_NEW', PAYLOAD_B);
    assert.equal(cache.size(), 1000, 'rozmiar nie powinien przekroczyć 1000');
    assert.equal(cache.get('CODE0'), null, 'najstarszy wpis CODE0 powinien zostać eksmitowany');
    assert.deepEqual(cache.get('CODE_NEW'), PAYLOAD_B, 'nowy wpis powinien być dostępny');
  });

  it('eksmisja usuwa dokładnie jeden wpis na jedno set', () => {
    const { nowFn } = makeClock();
    const cache = createCache(3600, nowFn);

    for (let i = 0; i < 1000; i++) {
      cache.set(`CODE${i}`, { n: i });
    }
    cache.set('EXTRA', PAYLOAD_A);

    // CODE0 usunięty, CODE1 nadal istnieje
    assert.equal(cache.size(), 1000);
    assert.equal(cache.get('CODE0'), null);
    assert.notEqual(cache.get('CODE1'), null, 'CODE1 powinien nadal istnieć');
  });

  it('cache nie przekracza 1000 wpisów po wielu kolejnych set', () => {
    const { nowFn } = makeClock();
    const cache = createCache(3600, nowFn);

    for (let i = 0; i < 1200; i++) {
      cache.set(`K${i}`, { n: i });
    }
    assert.ok(cache.size() <= 1000, `rozmiar cache ${cache.size()} przekroczył 1000`);
  });
});

// ---------------------------------------------------------------------------
// 7. Odporność na błędy (wymaganie 7.8)
// ---------------------------------------------------------------------------

describe('odporność na błędy (req 7.8)', () => {
  it('get z kluczem undefined nie rzuca wyjątku', () => {
    const cache = createCache(3600, makeClock().nowFn);
    assert.doesNotThrow(() => cache.get(undefined));
  });

  it('get z kluczem null nie rzuca wyjątku', () => {
    const cache = createCache(3600, makeClock().nowFn);
    assert.doesNotThrow(() => cache.get(null));
  });

  it('set z kluczem undefined nie rzuca wyjątku', () => {
    const cache = createCache(3600, makeClock().nowFn);
    assert.doesNotThrow(() => cache.set(undefined, PAYLOAD_A));
  });

  it('set z kluczem null nie rzuca wyjątku', () => {
    const cache = createCache(3600, makeClock().nowFn);
    assert.doesNotThrow(() => cache.set(null, PAYLOAD_A));
  });

  it('get nie rzuca wyjątku gdy nowFn rzuca przy odczycie', () => {
    let calls = 0;
    const faultyNow = () => {
      calls++;
      if (calls === 1) return 0; // pierwsze wywołanie (set — insertedAt)
      if (calls === 2) return 0; // drugie wywołanie (set — expiresAt = insertedAt + ttl)
      throw new Error('zegar zepsuty');
    };
    // Przy set: nowFn wywoływana 1 raz; przy get: nowFn wywoływana kolejny raz
    const cache = createCache(3600, faultyNow);
    cache.set('X', PAYLOAD_A); // calls 1
    // get wywołuje nowFn (calls 2+) — może rzucić → powinno być pochłonięte
    assert.doesNotThrow(() => cache.get('X'));
  });
});

// ---------------------------------------------------------------------------
// 8. size()
// ---------------------------------------------------------------------------

describe('size()', () => {
  it('zwraca 0 dla pustego cache', () => {
    const cache = createCache(3600, makeClock().nowFn);
    assert.equal(cache.size(), 0);
  });

  it('rośnie po set', () => {
    const cache = createCache(3600, makeClock().nowFn);
    cache.set('A', PAYLOAD_A);
    assert.equal(cache.size(), 1);
    cache.set('B', PAYLOAD_B);
    assert.equal(cache.size(), 2);
  });

  it('maleje po odczycie i usunięciu przeterminowanego wpisu', () => {
    const { nowFn, advance } = makeClock();
    const cache = createCache(60, nowFn);
    cache.set('A', PAYLOAD_A);
    cache.set('B', PAYLOAD_B);
    assert.equal(cache.size(), 2);
    advance(60_001);
    cache.get('A');
    assert.equal(cache.size(), 1);
    cache.get('B');
    assert.equal(cache.size(), 0);
  });
});

// ---------------------------------------------------------------------------
// 9. Niezależność wielu instancji cache
// ---------------------------------------------------------------------------

describe('niezależność instancji', () => {
  it('dwie instancje cache nie dzielą stanu', () => {
    const { nowFn } = makeClock();
    const c1 = createCache(3600, nowFn);
    const c2 = createCache(3600, nowFn);
    c1.set('K', PAYLOAD_A);
    assert.equal(c2.get('K'), null, 'c2 nie powinien widzieć wpisu z c1');
  });

  it('różne TTL w różnych instancjach działają niezależnie', () => {
    const { nowFn, advance } = makeClock();
    const short = createCache(60, nowFn);  // TTL = 60 s
    const long = createCache(3600, nowFn); // TTL = 3600 s

    short.set('K', PAYLOAD_A);
    long.set('K', PAYLOAD_B);

    advance(61_000); // short wygasł, long nie
    assert.equal(short.get('K'), null);
    assert.deepEqual(long.get('K'), PAYLOAD_B);
  });
});

// ---------------------------------------------------------------------------
// 10. Kształt wpisu w cache (wymaganie: { payload, insertedAt, expiresAt })
// ---------------------------------------------------------------------------

describe('kształt wpisu — payload nie jest mutowany', () => {
  it('get zwraca dokładnie ten sam obiekt payload, który przekazano do set', () => {
    const cache = createCache(3600, makeClock().nowFn);
    const payload = { success: false, data: [1, 2, 3] };
    cache.set('K', payload);
    assert.equal(cache.get('K'), payload, 'get powinien zwrócić tę samą referencję obiektu');
  });
});
