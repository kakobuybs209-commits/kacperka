'use strict';

/**
 * Normalizator_Lokalizacji
 *
 * Priorytet:
 *  1. Wejście puste / tylko białe znaki / undefined → stała "Brak danych o lokalizacji"
 *  2. Znane polskie nazwy miast → MIASTO, Polska
 *  3. Znane chińskie nazwy miast → MIASTO, Chiny
 *  4. Znane holenderskie nazwy miast → MIASTO, Holandia
 *  5. Pełna nazwa kraju (np. POLAND → Polska)
 *  6. Dwuliterowy kod kraju (np. PL → Polska)
 *  7. Format "MIASTO (KOD)" → "MIASTO, polska nazwa" lub "MIASTO, KOD"
 *  8. Brak dopasowania → wejście po trim()
 *
 * Requirements: 3.6, 3.7, 3.8, 3.9, 3.10
 */

const MISSING_LOCATION = 'Brak danych o lokalizacji';

/** Odwzorowanie dwuliterowych kodów krajów i pełnych nazw → polska nazwa kraju */
const locationMappings = {
    // Kody dwuliterowe
    'PL': 'Polska',
    'CN': 'Chiny',
    'DE': 'Niemcy',
    'NL': 'Holandia',
    'US': 'USA',
    'GB': 'Wielka Brytania',
    'FR': 'Francja',
    // Pełne nazwy krajów
    'POLAND': 'Polska',
    'CHINA': 'Chiny',
    'GERMANY': 'Niemcy',
    'NETHERLANDS': 'Holandia',
    'HOLLAND': 'Holandia'
};

/** Znane polskie nazwy miast – każde wpasowanie → Polska */
const knownPolishCities = [
    'STALOWA WOLA',
    'WARSZAWA',
    'KRAKÓW',
    'GDAŃSK',
    'POZNAŃ',
    'WROCŁAW',
    'STRYKÓW',
    'STRYKOW',
    'RUDNIK'
];

/** Znane chińskie nazwy miast – każde wpasowanie → Chiny */
const knownChineseCities = [
    'SHANGHAI',
    'BEIJING',
    'GUANGZHOU',
    'SHENZHEN',
    'PUTIAN'
];

/** Znane holenderskie nazwy miast – każde wpasowanie → Holandia */
const knownDutchCities = [
    'AMSTERDAM',
    'ROTTERDAM',
    'EINDHOVEN',
    'OIRSCHOT',
    'VIJFHUIZEN',
    'VEENENDAAL'
];

/**
 * Normalizuje lokalizację do czytelnej polskiej postaci.
 *
 * @param {string|undefined} location
 * @returns {string}
 */
function normalizeLocation(location) {
    // 1. Wejście puste / tylko białe znaki / undefined
    if (location === undefined || location === null) {
        return MISSING_LOCATION;
    }
    if (typeof location === 'string' && location.trim() === '') {
        return MISSING_LOCATION;
    }

    const cleanLocation = String(location).trim();

    // 2. Znane polskie nazwy miast (porównanie na wielkich literach)
    const upperLocation = cleanLocation.toUpperCase();
    for (var i = 0; i < knownPolishCities.length; i++) {
        if (upperLocation.indexOf(knownPolishCities[i]) !== -1) {
            return cleanLocation + ', Polska';
        }
    }

    // 3. Znane chińskie nazwy miast
    for (var j = 0; j < knownChineseCities.length; j++) {
        if (upperLocation.indexOf(knownChineseCities[j]) !== -1) {
            return cleanLocation + ', Chiny';
        }
    }

    // 4. Znane holenderskie nazwy miast
    for (var k = 0; k < knownDutchCities.length; k++) {
        if (upperLocation.indexOf(knownDutchCities[k]) !== -1) {
            return cleanLocation + ', Holandia';
        }
    }

    // 5. Pełna nazwa kraju
    if (locationMappings[upperLocation]) {
        return locationMappings[upperLocation];
    }

    // 6. Dwuliterowy kod kraju (dokładnie 2 wielkie litery)
    if (/^[A-Z]{2}$/.test(upperLocation)) {
        if (locationMappings[upperLocation]) {
            return locationMappings[upperLocation];
        }
        // Kod bez odwzorowania – zwróć oryginał po trim()
        return cleanLocation;
    }

    // 7. Format "MIASTO (KOD_KRAJU)" – KOD to dokładnie dwie wielkie litery na końcu
    var cityCountryMatch = cleanLocation.match(/^(.*?)\s*\(([A-Z]{2})\)$/);
    if (cityCountryMatch) {
        var city = cityCountryMatch[1].trim();
        var countryCode = cityCountryMatch[2];
        var countryName = locationMappings[countryCode] || countryCode;
        return city + ', ' + countryName;
    }

    // 8. Brak dopasowania – zwróć wejście po trim()
    return cleanLocation;
}

module.exports = { normalizeLocation, MISSING_LOCATION, locationMappings };
