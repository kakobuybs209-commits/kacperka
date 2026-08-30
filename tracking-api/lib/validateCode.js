'use strict';

/**
 * validateCode — walidacja i normalizacja Kodu_Śledzenia.
 *
 * Reguła identyczna z funkcją validateCode w sekcji FXTRK:CORE w script.js
 * (wymagania 1.11, 2.5, 6.1).
 *
 * Wejście : string (lub cokolwiek innego).
 * Wyjście : { ok: boolean, normalized: string }
 *
 *   ok = true  gdy po trim() długość 6–40 i wyłącznie litery (w tym rozszerzony
 *              alfabet łaciński \u00C0–\u024F), cyfry lub łącznik „-"
 *   ok = false w pozostałych przypadkach:
 *              • wejście niebędące stringiem
 *              • po trim() długość 0 (puste / same białe znaki)
 *              • po trim() długość < 6 lub > 40
 *              • surowa długość > 50 (odrzucona przed trim())
 *              • niedozwolony znak
 *
 * normalized :
 *   ok = true  → po trim() + toUpperCase()
 *   ok = false → po samym trim() (bez toUpperCase, by znak niedozwolony
 *                nie zmylił diagnostyki); gdy wejście nie jest stringiem → ''
 */
function validateCode(raw) {
    if (typeof raw !== 'string') {
        return { ok: false, normalized: '' };
    }
    // Odrzuć surowe wejście dłuższe niż 50 znaków przed trim()
    if (raw.length > 50) {
        return { ok: false, normalized: raw.trim() };
    }
    var trimmed = raw.trim();
    if (trimmed.length < 6 || trimmed.length > 40) {
        return { ok: false, normalized: trimmed };
    }
    if (!/^[A-Za-z\u00C0-\u024F\d-]+$/.test(trimmed)) {
        return { ok: false, normalized: trimmed };
    }
    return { ok: true, normalized: trimmed.toUpperCase() };
}

module.exports = { validateCode };
