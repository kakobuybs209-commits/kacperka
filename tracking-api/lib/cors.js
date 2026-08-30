'use strict';

/**
 * Dopasowanie nagłówka Origin do listy dopuszczonych domen źródłowych.
 *
 * Requirements: 1.7, 9.7, 9.8
 *
 * @param {string|undefined} originHeader  Wartość nagłówka Origin z żądania
 * @param {string[]|undefined} allowlist   Lista dopuszczonych domen (URL-format, np. "https://fxlsereps.pl")
 * @returns {{ allowed: boolean, allowOriginValue: string|null }}
 *   - allowed: czy Origin jest na liście
 *   - allowOriginValue: dopasowany Origin (dokładna wartość), nigdy '*', null gdy denied
 */
function checkOrigin(originHeader, allowlist) {
    // Brak nagłówka Origin → odmowa (wymaganie 9.8)
    if (!originHeader || typeof originHeader !== 'string' || originHeader.trim() === '') {
        return { allowed: false, allowOriginValue: null };
    }

    // Lista nieustawiona, pusta lub > 10 pozycji → odmowa (wymaganie 9.8)
    if (!Array.isArray(allowlist) || allowlist.length === 0 || allowlist.length > 10) {
        return { allowed: false, allowOriginValue: null };
    }

    // Rozbiór Origin na schemat, host (bez rozróżniania wielkości liter) i port (wymaganie 9.7)
    var parsed = parseOrigin(originHeader.trim());
    if (!parsed) {
        // Origin nierozkładalny → odmowa (wymaganie 9.8)
        return { allowed: false, allowOriginValue: null };
    }

    // Porównanie z każdą pozycją listy
    for (var i = 0; i < allowlist.length; i++) {
        var entry = allowlist[i];
        if (typeof entry !== 'string' || entry.trim() === '') {
            continue;
        }
        var entryParsed = parseOrigin(entry.trim());
        if (!entryParsed) {
            continue;
        }
        if (originsMatch(parsed, entryParsed)) {
            // Dopasowano — zwracamy dokładną wartość z nagłówka Origin, nigdy '*'
            return { allowed: true, allowOriginValue: originHeader.trim() };
        }
    }

    return { allowed: false, allowOriginValue: null };
}

/**
 * Rozkłada ciąg na { scheme, host, port }.
 * Zwraca null gdy ciąg nie jest poprawnym URL-em z schematem i hostem.
 *
 * @param {string} str
 * @returns {{ scheme: string, host: string, port: string }|null}
 */
function parseOrigin(str) {
    // Używamy globalnego URL jeśli dostępny (Node >= 10), z fallbackem na regex
    try {
        var url = new URL(str);
        var scheme = url.protocol.replace(/:$/, '').toLowerCase(); // 'https', 'http'
        var host = url.hostname.toLowerCase();                      // bez portu, bez nawiasów IPv6
        if (!host) {
            return null;
        }
        // url.port jest stringiem: '' gdy domyślny dla schematu, inaczej numer
        var port = url.port; // '' lub numer jako string
        return { scheme: scheme, host: host, port: port };
    } catch (e) {
        return null;
    }
}

/**
 * Porównuje dwa rozłożone originy.
 * Schemat: dokładny, host: bez rozróżniania wielkości liter (już znormalizowany),
 * port: '' (domyślny) vs '' → równe; inaczej string-porównanie.
 *
 * @param {{ scheme: string, host: string, port: string }} a
 * @param {{ scheme: string, host: string, port: string }} b
 * @returns {boolean}
 */
function originsMatch(a, b) {
    return a.scheme === b.scheme &&
           a.host === b.host &&
           a.port === b.port;
}

module.exports = {
    checkOrigin: checkOrigin,
    // eksportowane pomocniczo dla testów
    parseOrigin: parseOrigin,
    originsMatch: originsMatch
};
