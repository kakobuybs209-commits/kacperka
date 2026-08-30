# tracking-api

Funkcja serverless śledzenia przesyłek dla fxlsereps.pl, wdrażana na Vercel.

Przyjmuje `GET /api/tracking/{kod}`, odpytuje zewnętrzny serwer trackingowy,
parsuje HTML (cheerio), tłumaczy statusy i lokalizacje na polski, sortuje
zdarzenia malejąco po dacie i zwraca JSON z polami `Informacje_główne` +
`Szczegóły_przesyłki`. Całość działa jako proxy — przeglądarka nigdy nie
kontaktuje się z serwerem upstream bezpośrednio.

---

## Zmienne środowiskowe

Ustawiane w panelu projektu Vercel → Settings → Environment Variables.

| Nazwa | Przeznaczenie | Domyślnie | Status |
|---|---|---|---|
| `TRACKING_UPSTREAM_URL` | Pełny adres serwera upstream (`http://...`) | — | **wymagana** |
| `TRACKING_ALLOWED_ORIGINS` | Lista domen źródłowych rozdzielona przecinkami, np. `https://fxlsereps.pl` | — | **wymagana** |
| `TRACKING_CACHE_TTL_SECONDS` | Czas życia wpisu pamięci podręcznej (60–86400 s) | `3600` | opcjonalna |
| `TRACKING_RATE_LIMIT` | Limit zapytań na adres IP w oknie rozliczeniowym (1–1000) | `10` | opcjonalna |
| `TRACKING_RATE_WINDOW_SECONDS` | Długość okna rozliczeniowego rate limitera (1–3600 s) | `60` | opcjonalna |

---

## Wdrożenie na Vercel

1. Utwórz nowy projekt w Vercel i podepnij repozytorium.
2. W ustawieniach projektu ustaw **Root Directory** na `tracking-api/`.  
   Vercel będzie widział tylko ten katalog — pliki statycznej strony są
   ignorowane i nie będą budowane ani serwowane przez Vercel.
3. W zakładce **Environment Variables** dodaj przynajmniej dwie wymagane zmienne:
   `TRACKING_UPSTREAM_URL` i `TRACKING_ALLOWED_ORIGINS`.
4. Kliknij **Deploy**.

Po wdrożeniu funkcja jest dostępna pod:

```
https://<projekt>.vercel.app/api/tracking/{kod}
```

lub własną domeną, jeśli jest skonfigurowana (np. `https://api.fxlsereps.pl`).

### Strona statyczna jest hostowana osobno

Strona `fxlsereps.pl` (pliki `index.html`, `script.js`, `style.css`) pozostaje
na obecnym hostingu statycznym i **nie jest wdrażana przez Vercel**.

To celowa decyzja architektoniczna: funkcja sprawdza nagłówek `Origin` każdego
żądania i odrzuca wywołania bez tego nagłówka (HTTP 403). Żądania same-origin
(strona i API na tej samej domenie Vercel) nie zawierają nagłówka `Origin` dla
metody GET — przeglądarka po prostu go nie wysyła. Przy rozdzielonym hostingu
żądanie jest cross-origin, przeglądarka wysyła `Origin`, a funkcja może
zweryfikować, czy pochodzi z dozwolonej domeny.

---

## Bezpieczeństwo — najważniejsze uwagi

### Nieszyfrowane połączenie z upstream

Odcinek **Funkcja_Śledzenia → Serwer_Upstream** korzysta ze zwykłego HTTP.
Jest to jedyny nieszyfrowany fragment całego systemu. Przeglądarka zawsze
komunikuje się z funkcją po HTTPS (Vercel wymusza HTTPS), więc nie ma
ostrzeżeń o treściach mieszanych.

**Zmiana adresu upstream nie wymaga modyfikacji kodu.**  
Wystarczy zaktualizować zmienną `TRACKING_UPSTREAM_URL` w ustawieniach projektu
Vercel i ponownie wdrożyć funkcję (przycisk **Redeploy** lub nowy push do gałęzi).

### Rate limiting

Funkcja stosuje okno stałe (fixed window) per adres IP. Limity odczytywane są
z `TRACKING_RATE_LIMIT` i `TRACKING_RATE_WINDOW_SECONDS`. Domyślnie: 10 zapytań
na 60 sekund. Przy przekroczeniu limitu zwracany jest HTTP 429 z nagłówkiem
`Retry-After`.

### Pamięć podręczna — zasięg per instancja

Cache_Śledzenia (`Map` z TTL) działa w pamięci procesu jednej instancji funkcji
serverless. Przy większym ruchu Vercel uruchomi wiele równoległych instancji,
każda z własnym cache — skuteczność cache'owania może być wtedy niższa.

**Rozwiązanie dla wyższego ruchu:** Redis lub inny zewnętrzny magazyn klucz–wartość
jako wspólna pamięć podręczna dla wszystkich instancji.

### Sprawdzanie Origin

Każde żądanie jest weryfikowane względem listy `TRACKING_ALLOWED_ORIGINS`.
Żądania z niedozwolonego lub brakującego nagłówka `Origin` są odrzucane (HTTP 403)
bez kontaktu z serwerem upstream.

---

## Rozszerzenie: mapa 3D (przyszłość)

Mapa 3D jest poza zakresem obecnej wersji i nie zawiera żadnego kodu tej funkcji.

Aby dodać ją w przyszłości, będą potrzebne:
- `react-globe.gl` w wersji `^2.37.1`
- `three` w wersji `^0.184.0`

Obydwie biblioteki wymagają kroku budowania po stronie frontendu (nie są
kompatybilne ze statyczną stroną bez bundlera). Funkcja serverless po stronie
`tracking-api/` nie wymaga żadnych zmian — mapa jest wyłącznie elementem
warstwy prezentacji.
