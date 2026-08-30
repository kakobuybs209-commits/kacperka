'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { translateStatus } = require('../lib/statusTranslator.js');

// ─── Wymaganie 3.5: puste / białe / undefined → pusty łańcuch ────────────────
describe('translateStatus — puste/białe/undefined (wymaganie 3.5)', () => {
    it('zwraca pusty łańcuch dla undefined', () => {
        assert.strictEqual(translateStatus(undefined), '');
    });

    it('zwraca pusty łańcuch dla null', () => {
        assert.strictEqual(translateStatus(null), '');
    });

    it('zwraca pusty łańcuch dla pustego łańcucha', () => {
        assert.strictEqual(translateStatus(''), '');
    });

    it('zwraca pusty łańcuch dla łańcucha złożonego wyłącznie ze spacji', () => {
        assert.strictEqual(translateStatus('   '), '');
    });

    it('zwraca pusty łańcuch dla łańcucha złożonego z tabulatora i spacji', () => {
        assert.strictEqual(translateStatus('\t  \n'), '');
    });
});

// ─── Wymaganie 3.1: dopasowanie dokładne ────────────────────────────────────
describe('translateStatus — dopasowanie dokładne (wymaganie 3.1)', () => {
    it('tłumaczy znany chiński status', () => {
        assert.strictEqual(
            translateStatus('清关完成'),
            'Odprawa celna zakończona'
        );
    });

    it('tłumaczy status z ukośnikiem w kluczu', () => {
        assert.strictEqual(
            translateStatus('The shipment has arrived in the destination country/destination area'),
            'Przesyłka dotarła do kraju docelowego'
        );
    });

    it('tłumaczy "Flight has departed"', () => {
        assert.strictEqual(
            translateStatus('Flight has departed'),
            'Lot odleciał'
        );
    });

    it('tłumaczy "Delivered successfully"', () => {
        assert.strictEqual(
            translateStatus('Delivered successfully'),
            'Dostarczone pomyślnie'
        );
    });

    it('tłumaczy "Out for delivery"', () => {
        assert.strictEqual(
            translateStatus('Out for delivery'),
            'W drodze do dostawy'
        );
    });

    it('tłumaczy "Shipment information received" (nie kończy się transit/pickup)', () => {
        assert.strictEqual(
            translateStatus('Shipment information received'),
            'Otrzymane informacje o przesyłce'
        );
    });

    it('tłumaczy "Packaging completed"', () => {
        assert.strictEqual(
            translateStatus('Packaging completed'),
            'Pakowanie zakończone'
        );
    });

    it('tłumaczy "In transittransit" — suffix transit usunięty → "In transit" → dopasowanie', () => {
        // Potok: usuń "transit" z końca → "In transit" → dokładne dopasowanie
        assert.strictEqual(
            translateStatus('In transittransit'),
            'W tranzycie'
        );
    });
});

// ─── Wymaganie 3.3: potok oczyszczania ───────────────────────────────────────
describe('translateStatus — potok oczyszczania (wymaganie 3.3)', () => {
    it('usuwa przyrostek transit przed wyszukiwaniem', () => {
        // "In transittransit" → po usunięciu jednego "transit" z końca → "In transit" → tłumaczy
        assert.strictEqual(
            translateStatus('In transittransit'),
            'W tranzycie'
        );
    });

    it('usuwa przyrostek pickup przed wyszukiwaniem (gdy brak transit)', () => {
        // "Out for deliverypickup" → "Out for delivery" → tłumaczy
        assert.strictEqual(
            translateStatus('Out for deliverypickup'),
            'W drodze do dostawy'
        );
    });

    it('usuwa tylko jeden przyrostek — transit ma pierwszeństwo nad pickup', () => {
        // "Out for deliverytransit" → po usunięciu transit → "Out for delivery"
        assert.strictEqual(
            translateStatus('Out for deliverytransit'),
            'W drodze do dostawy'
        );
    });

    it('usuwa fragment (Homepage...) przed wyszukiwaniem', () => {
        // "In transit(Homepage xyz)" → po usunięciu → "In transit" → tłumaczy
        assert.strictEqual(
            translateStatus('In transit(Homepage xyz)'),
            'W tranzycie'
        );
    });

    it('usuwa fragment (Homepage...) z tekstem bez innych przyrostków', () => {
        assert.strictEqual(
            translateStatus('Flight has arrived(Homepage something here)'),
            'Lot dotarł'
        );
    });

    it('redukuje wielokrotne spacje do jednej (status bez transit/pickup na końcu)', () => {
        // "Packaging   completed" → redukcja spacji → "Packaging completed" → tłumaczy
        assert.strictEqual(
            translateStatus('Packaging   completed'),
            'Pakowanie zakończone'
        );
    });

    it('usuwa białe znaki z początku i końca', () => {
        assert.strictEqual(
            translateStatus('  In transit  '),
            'W tranzycie'
        );
    });

    it('łączy wszystkie kroki oczyszczania naraz', () => {
        // "  In transittransit  (Homepage test)  " →
        //   1. usuwa "transit" z końca → "  In transittransit  (Homepage test)  "... wait
        // Właściwie: krok 1 działa na całym łańcuchu przed innymi krokami.
        // "  In transit(Homepage test)transit" →
        //   1. usuwa "transit" z końca → "  In transit(Homepage test)"
        //   2. usuwa "(Homepage test)" → "  In transit"
        //   3. redukuje białe znaki → "  In transit"
        //   4. trim → "In transit"
        assert.strictEqual(
            translateStatus('  In transit(Homepage test)transit'),
            'W tranzycie'
        );
    });
});

// ─── Wymaganie 3.2: brak dopasowania → oczyszczony tekst ────────────────────
describe('translateStatus — brak dopasowania (wymaganie 3.2)', () => {
    it('zwraca oczyszczony tekst, gdy brak dopasowania', () => {
        assert.strictEqual(
            translateStatus('Nieznany status XYZ'),
            'Nieznany status XYZ'
        );
    });

    it('zwraca oczyszczony tekst po usunięciu przyrostka transit', () => {
        assert.strictEqual(
            translateStatus('Nieznany statustransit'),
            'Nieznany status'
        );
    });

    it('zwraca oczyszczony tekst po usunięciu (Homepage...)', () => {
        assert.strictEqual(
            translateStatus('Nieznany status(Homepage abc)'),
            'Nieznany status'
        );
    });

    it('nie zmienia kolejności, wielkości liter ani treści pozostałych znaków', () => {
        const input = 'SomeUnknownStatus ABC 123';
        assert.strictEqual(translateStatus(input), 'SomeUnknownStatus ABC 123');
    });
});

// ─── Wymaganie 3.4: przedrostek 签收 ─────────────────────────────────────────
describe('translateStatus — przedrostek 签收 (wymaganie 3.4)', () => {
    it('zachowuje przedrostek 签收 bezpośrednio przed przetłumaczonym tekstem', () => {
        // "签收Packaging completed" → oczyszczanie nie dotyka nic → prefix=签收, rest="Packaging completed" → tłumaczy
        const result = translateStatus('签收Packaging completed');
        assert.match(result, /^签收/);
        assert.strictEqual(result, '签收Pakowanie zakończone');
    });

    it('zachowuje przedrostek 签收 przy nieznanym statusie', () => {
        const result = translateStatus('签收Nieznany status');
        assert.strictEqual(result, '签收Nieznany status');
    });

    it('nie wstawia separatora między 签收 a resztą', () => {
        // Bezpośrednio po 签收 (2 znaki) musi być pierwsze słowo tłumaczenia bez spacji
        const result = translateStatus('签收Packaging completed');
        // result = "签收Pakowanie zakończone" — po 签收 (indeks 2) jest 'P'
        assert.strictEqual(result.charAt(2), 'P');
    });

    it('zachowuje przedrostek 签收 po oczyszczeniu przyrostka transit', () => {
        // "签收In transittransit" → usuwa transit z końca → "签收In transit"
        // → prefix=签收, rest="In transit" → tłumaczy
        const result = translateStatus('签收In transittransit');
        assert.strictEqual(result, '签收W tranzycie');
    });
});

// ─── Wymaganie 3.3: kolejność kroków — transit przed pickup ──────────────────
describe('translateStatus — kolejność usuwania przyrostków (wymaganie 3.3)', () => {
    it('transit jest usuwany, pickup pozostaje gdy oba obecne na końcu', () => {
        // "statuspickuptransit" → usuwa transit → "statuspickup" → brak w tabeli → zwraca "statuspickup"
        // Spec: "usunięcie jednego przyrostka `transit` lub `pickup`" — tylko jeden!
        const result = translateStatus('statuspickuptransit');
        assert.strictEqual(result, 'statuspickup');
    });

    it('pickup jest usuwany gdy nie ma transit', () => {
        const result = translateStatus('Unknown statuspickup');
        assert.strictEqual(result, 'Unknown status');
    });

    it('nie usuwa transit ze środka tekstu', () => {
        // "transit in middle" — transit nie jest na końcu
        const result = translateStatus('transit in middle');
        assert.strictEqual(result, 'transit in middle');
    });

    it('nie usuwa pickup ze środka tekstu', () => {
        const result = translateStatus('pickup in middle');
        assert.strictEqual(result, 'pickup in middle');
    });
});

// ─── Wymaganie 3.1: dopasowanie po podłańcuchu ───────────────────────────────
describe('translateStatus — dopasowanie po podłańcuchu (wymaganie 3.1)', () => {
    it('dopasowuje po podłańcuchu gdy klucz jest zawarty w oczyszczonym statusie', () => {
        // "Customs clearance completed pending scanning extra text" →
        // podłańcuch "Customs clearance completed pending scanning" pasuje
        const result = translateStatus('Customs clearance completed pending scanning extra text');
        assert.strictEqual(result, 'Odprawa celna zakończona, oczekuje na skanowanie');
    });
});

// ─── Dodatkowe przypadki z kluczami zawierającymi przyrostki w tabeli ─────────
describe('translateStatus — klucze z przyrostkami w tabeli tłumaczeń', () => {
    it('tłumaczy "The shipment has been processed in the parcel centertransit" bezpośrednio', () => {
        // Ten klucz istnieje w tabeli — dopasowanie dokładne po oczyszczeniu
        // Oczyszczenie "The shipment has been processed in the parcel centertransit":
        //   1. Usuwa "transit" z końca → "The shipment has been processed in the parcel center"
        //   2. Dopasowanie dokładne
        assert.strictEqual(
            translateStatus('The shipment has been processed in the parcel centertransit'),
            'Przesyłka została przetworzona w centrum dystrybucyjnym'
        );
    });

    it('tłumaczy status DHL z przyrostkiem transit', () => {
        assert.strictEqual(
            translateStatus('The instruction data for this shipment have been provided by the sender to DHL electronicallytransit'),
            'Dane przesyłki zostały przesłane elektronicznie przez nadawcę do DHL'
        );
    });
});

// ─── Wydajność: wymaganie 3.1 (≤ 50 ms na jedno zdarzenie) ──────────────────
describe('translateStatus — wydajność (wymaganie 3.1)', () => {
    it('kończy tłumaczenie w czasie poniżej 50 ms', () => {
        const start = Date.now();
        for (let i = 0; i < 100; i++) {
            translateStatus('The shipment has been successfully delivered');
        }
        const elapsed = Date.now() - start;
        // 100 wywołań w < 50 ms = 0.5 ms/wywołanie — z dużym zapasem
        assert.ok(elapsed < 50, `100 wywołań zajęło ${elapsed} ms (oczekiwano < 50 ms)`);
    });
});
