 # Implementation Plan: Integracja modułu śledzenia

## Overview

Plan realizuje ścieżkę hybrydową z projektu: funkcja serverless w osobnym katalogu `tracking-api/` (projekt Vercel, Root Directory = `tracking-api/`) oraz UI w czystym JavaScripcie wewnątrz istniejącego `script.js`. Język implementacji: **JavaScript** (Node.js dla funkcji, ES5/ES2017 bez modułów dla plików statycznych) — wynika bezpośrednio z projektu, nie jest wyborem tego planu.

Kolejność faz jest kolejnością migracji z sekcji *Migration and Rollout*: najpierw funkcja i jej weryfikacja w izolacji, potem sekcje `FXTRK:CORE`/`FXTRK:UI` i CSS, potem kopia weryfikacyjna i weryfikacja równoważności, i tylko na końcu jednokrokowe wdrożenie docelowe usuwające implementację iframe.

Trzy zasady obowiązujące w całym planie:

- **`fxlsereps.pl/` to katalog wdrożenia strony statycznej** i zawiera dokładnie `index.html`, `script.js`, `style.css`. Żadne zadanie nie dodaje do niego `package.json`, `node_modules`, plików testowych ani żadnego innego pliku (wymaganie 1.1). Wszystkie pliki `package.json`, testy i narzędzia żyją w `tracking-api/`.
- **Sekcje FXTRK dopisywane do `script.js` w fazach 8–10 są uśpione.** `wireTracking()` uruchamia się wyłącznie wtedy, gdy Widok_Śledzenia nosi atrybut `data-fxtrk-nolocale`, którego `index.html` produkcyjny nabywa dopiero w zadaniu 14.2. Do tego momentu strona produkcyjna nadal korzysta z implementacji iframe, a nowy kod jest martwy — dzięki temu testy własnościowe czytają prawdziwy `script.js`, a wdrożenie docelowe pozostaje jednym krokiem.
- **Kod zależny od czasu przyjmuje wstrzykiwanego dostawcę `now()`** (`lib/cache.js`, `lib/rateLimiter.js`, moduł UI: potwierdzenie kopiowania 2000 ms i trzy poziomy limitów czasu 8000/10000/15000 ms). Testy nigdy nie czekają na prawdziwy zegar.

Testy własnościowe: `node:test` + `fast-check`, minimum `{ numRuns: 100 }`, dokładnie jeden test na każdą z 42 własności, każdy oznaczony komentarzem `// Feature: tracking-module-integration, Property N: <nazwa>`.

Zadania oznaczone **(RĘCZNE)** nie dają się zautomatyzować — wymagają przeglądarki, wdrożonej funkcji albo prawdziwych numerów przesyłek. Są w planie, bo projekt czyni je warunkiem wejścia do wdrożenia docelowego.

## Tasks

- [x] 1. Szkielet projektu tracking-api i fundamenty
  - [x] 1.1 Utworzyć strukturę projektu Vercel
    - `tracking-api/package.json`: zależność produkcyjna `cheerio`, devDependencies `fast-check` i `jsdom`, skrypt `"test": "node --test tests/"`
    - `tracking-api/vercel.json`: `maxDuration` funkcji = 15 s
    - Katalogi `api/tracking/`, `lib/`, `tests/`, `tests/helpers/`, `tests/integration/`
    - Zero plików tworzonych w `fxlsereps.pl/`
    - _Requirements: 1.1, 1.4_

  - [x] 1.2 Zaimplementować taksonomię błędów i dziennik
    - `lib/errors.js`: klasa `TrackingError` z polami `code`, `httpStatus`, `messagePl`, `logReason` oraz siedem stałych: `ERR_CODE_INVALID` (400), `ERR_ORIGIN_DENIED` (403), `ERR_NOT_FOUND` (404), `ERR_UPSTREAM_TIMEOUT` (404), `ERR_RATE_LIMITED` (429), `ERR_CONFIG_MISSING` (500), `ERR_INTERNAL` (500); komunikaty polskie, ≤ 200 znaków, bez adresu, portu, hosta i śladu stosu
    - `lib/log.js`: jednolinijkowy wpis JSON (`ts`, `event`, `code`, `httpStatus`, `reason`, `durationMs`), zero treści odpowiedzi upstream, błąd zapisu dziennika pochłaniany
    - _Requirements: 6.3, 6.4, 6.10_

  - [x] 1.3 Zaimplementować walidację Konfiguracji_Środowiska
    - `lib/config.js`: odczyt pięciu zmiennych przy każdym żądaniu, walidacja `TRACKING_UPSTREAM_URL` (schemat `http`/`https`, niepusty host, ≤ 2048 znaków) i `TRACKING_ALLOWED_ORIGINS` (1–10 pozycji), wartości domyślne 3600 s / 10 żądań / 60 s dla zmiennych opcjonalnych, lista `defaultsUsed`
    - Zero wystąpień adresu Serwera_Upstream w kodzie źródłowym
    - _Requirements: 8.4, 9.1, 9.2, 9.10, 9.11, 7.5, 8.7_

  - [x]* 1.4 Test własnościowy walidacji konfiguracji
    - **Property 35: Wartości domyślne i walidacja Konfiguracji_Środowiska**
    - **Validates: Requirements 7.5, 8.4, 8.7, 9.2, 9.10**

- [x] 2. Kontrole wstępne żądania
  - [x] 2.1 Zaimplementować Limiter_Zapytań
    - `lib/rateLimiter.js`: okno stałe na klucz koszyka, wpis `{ count, windowEndsAt }`, klucz = pierwszy adres z `x-forwarded-for` po `trim()`, koszyk `__fallback__` dla adresu nieobecnego lub niebędącego adresem IPv4/IPv6, `retryAfterSeconds = max(1, ceil((windowEndsAt - now)/1000))`
    - Odrzucenie nie zmienia licznika ani `windowEndsAt`
    - **Ograniczenie: moduł przyjmuje `now` jako parametr; zero odwołań do `Date.now()` wewnątrz logiki okna**
    - _Requirements: 8.2, 8.3, 8.8, 8.9, 8.10_

  - [x]* 2.2 Test własnościowy okna i koszyków limitera
    - **Property 34: Okno stałe i koszyki Limitera_Zapytań**
    - **Validates: Requirements 8.2, 8.8, 8.9, 8.10**

  - [x] 2.3 Zaimplementować dopasowanie nagłówka Origin
    - `lib/cors.js`: rozbiór `Origin` na schemat, host (bez rozróżniania wielkości liter) i port, porównanie z pozycjami listy, zwrot `{ allowed, allowOriginValue }`; wartość `*` nigdy nie jest zwracana; brak `Origin`, `Origin` nierozkładalny oraz lista nieustawiona, pusta lub > 10 pozycji dają odmowę
    - _Requirements: 1.7, 9.7, 9.8_

  - [x]* 2.4 Test własnościowy listy dopuszczonych domen źródłowych
    - **Property 36: Lista dopuszczonych domen źródłowych**
    - **Validates: Requirements 1.7, 9.7, 9.8**

  - [x] 2.5 Zaimplementować walidację Kodu_Śledzenia
    - `lib/validateCode.js`: po `trim()` długość 6–40 znaków, wyłącznie litery, cyfry i łącznik; normalizacja przez `trim()` + `toUpperCase()`; wejście nieobecne, puste, białe albo dłuższe niż 50 znaków odrzucone
    - _Requirements: 1.11, 2.5, 6.1_

- [x] 3. Klient upstream, tłumaczenia i parser
  - [x] 3.1 Zaimplementować klienta Serwera_Upstream
    - `lib/upstreamClient.js`: `POST` z ciałem `application/x-www-form-urlencoded` i polem `documentCode` równym znormalizowanemu kodowi, `AbortSignal.timeout(8000)`, zero ponowień, timeout mapowany na `ERR_UPSTREAM_TIMEOUT`
    - **Ograniczenie: limit 8000 ms jest parametrem modułu, aby test nie czekał na prawdziwy zegar**
    - _Requirements: 2.6, 2.7, 1.9_

  - [x]* 3.2 Test własnościowy normalizacji kodu w żądaniu do upstream
    - **Property 2: Normalizacja Kodu_Śledzenia przed wysłaniem do upstream**
    - **Validates: Requirements 2.5, 2.6**

  - [x] 3.3 Zaimplementować Tłumacz_Statusów
    - `lib/statusTranslator.js`: potok oczyszczania w kolejności — usunięcie jednego przyrostka `transit`/`pickup` z końca, usunięcie pierwszego fragmentu od `(Homepage` do najbliższego `)`, redukcja sekwencji znaków białych do jednego odstępu, `trim()`; następnie dopasowanie dokładne, potem po podłańcuchu; brak dopasowania zwraca tekst oczyszczony; przedrostek `签收` zachowany bez separatora; wejście puste/białe/nieokreślone zwraca tekst pusty
    - _Requirements: 1.3, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x]* 3.4 Test własnościowy potoku oczyszczania statusów
    - **Property 6: Potok oczyszczania Tłumacza_Statusów**
    - **Validates: Requirements 3.3, 3.5**

  - [x]* 3.5 Test własnościowy odwzorowania i zachowania treści statusów
    - **Property 7: Odwzorowanie i zachowanie treści statusów**
    - **Validates: Requirements 1.3, 3.1, 3.2**

  - [x]* 3.6 Test własnościowy zachowania przedrostka 签收
    - **Property 8: Zachowanie przedrostka 签收**
    - **Validates: Requirements 3.4**

  - [x] 3.7 Zaimplementować Normalizator_Lokalizacji
    - `lib/locationNormalizer.js`: dwuliterowy kod kraju i pełna nazwa kraju → polska nazwa kraju; format `MIASTO (KOD)` → `MIASTO, nazwa kraju` albo `MIASTO, KOD`; znana nazwa miasta → `MIASTO, nazwa kraju`; brak dopasowania → wejście po `trim()`; wejście puste/białe/nieokreślone → stała `"Brak danych o lokalizacji"`
    - _Requirements: 3.6, 3.7, 3.8, 3.9, 3.10_

  - [x]* 3.8 Test własnościowy totalności normalizatora lokalizacji
    - **Property 9: Totalność Normalizatora_Lokalizacji**
    - **Validates: Requirements 3.6, 3.7, 3.8, 3.9, 3.10**

  - [x] 3.9 Zaimplementować parser HTML upstream
    - `lib/parseUpstream.js`: wiersze `table tr` (data / lokalizacja / rekord) → Zdarzenia_Śledzenia z polami `Data`, `Lokalizacja`, `Status` oraz `OriginalDate`, `OriginalLocation`, `OriginalStatus` zapisanymi znak w znak przed jakimkolwiek przetwarzaniem; `.menu_ ul:nth-child(2) li` → sześć pól `Informacje_główne` ze stałym tekstem `"Brak danych"` dla pola brakującego lub pustego; `Ostatni status` = tekst przed pierwszym `/` przez Tłumacz_Statusów; `Odbiorca` oczyszczony z przedrostka `签收`, fragmentów statusu dostawy i samodzielnej nazwy kraju na końcu; sortowanie stabilne malejąco po `OriginalDate` z datami nieinterpretowalnymi na końcu; zdeformowany HTML i błąd pojedynczego zdarzenia nie przerywają budowy pozostałych
    - Zero pól `Przewidywana dostawa`, `Data dostawy` i `Aktualna lokalizacja` — `calculateEstimatedDelivery` nie jest przenoszone na serwer
    - _Requirements: 1.3, 2.8, 2.9, 3.5, 3.11, 3.12_

  - [x]* 3.10 Test własnościowy porządku listy zdarzeń
    - **Property 3: Porządek listy Zdarzeń_Śledzenia**
    - **Validates: Requirements 1.3, 2.9**

  - [x]* 3.11 Test własnościowy niezmienności pól surowych
    - **Property 5: Niezmienność pól surowych**
    - **Validates: Requirements 3.11**

  - [x]* 3.12 Test własnościowy oczyszczania pola Odbiorca
    - **Property 10: Oczyszczanie pola Odbiorca**
    - **Validates: Requirements 3.12**

- [x] 4. Cache_Śledzenia
  - [x] 4.1 Zaimplementować cache na strukturze Map
    - `lib/cache.js`: własna implementacja zamiast `node-cache`; klucz = kod po `trim()` + `toUpperCase()`; wpis `{ payload, insertedAt, expiresAt }`; TTL walidowany w zakresie 60–86400 s; odczyt przedawnionego wpisu usuwa go i zwraca brak; leniwe czyszczenie przy zapisie usuwa wpisy przedawnione o więcej niż 600 s; twardy limit 1000 wpisów z eksmisją najstarszego zapisu (pierwszy klucz iteracji `Map`); każdy błąd `get`/`set` przechwycony i traktowany jak brak wpisu
    - **Ograniczenie: moduł przyjmuje `now` jako parametr albo pole konfiguracji; zero odwołań do prawdziwego zegara**
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.8, 7.9_

  - [x]* 4.2 Test własnościowy czasu życia i pojemności cache
    - **Property 31: Czas życia i pojemność Cache_Śledzenia**
    - **Validates: Requirements 7.4, 7.9**

- [x] 5. Punkt wejścia Funkcji_Śledzenia
  - [x] 5.1 Zaimplementować orkiestrację w api/tracking/[code].js
    - Stała kolejność kroków: (1) Limiter_Zapytań, (2) sprawdzenie `Origin`, (3) walidacja Kodu_Śledzenia, (4) walidacja Konfiguracji, (5) odczyt cache, (6) zapytanie do upstream, (7) zapis do cache
    - Limiter zlicza żądanie niezależnie od końcowego kodu HTTP; nagłówek `Retry-After` przy 429; nagłówek `Access-Control-Allow-Origin` z dokładnie jedną domeną, nigdy `*`, pominięty przy 403
    - Odpowiedź 200: `success`, `Informacje_główne`, `Szczegóły_przesyłki`, `Źródło`, `Content-Type: application/json`; odpowiedź błędu: dokładnie `success` i `message`
    - Zapis do cache wyłącznie dla 200 z co najmniej jednym zdarzeniem; `try/catch` obejmujący całą obsługę mapuje nieoczekiwany wyjątek na 500 `internal_error`; wpis dziennika przy 404 i 500
    - Zero obsługi `OPTIONS` — żądanie klienta jest żądaniem prostym CORS
    - _Requirements: 1.4, 1.7, 1.9, 2.10, 6.1, 6.2, 6.3, 6.4, 6.10, 7.6, 8.1, 8.3, 8.6_

  - [x]* 5.2 Test własnościowy kształtu odpowiedzi dla wyniku niepustego
    - **Property 4: Kształt Odpowiedzi_Śledzenia dla wyniku niepustego**
    - **Validates: Requirements 1.4, 2.8, 2.10**

  - [x]* 5.3 Test własnościowy ścieżki braku danych i timeoutu upstream
    - **Property 23: Ścieżka braku danych i timeoutu upstream**
    - **Validates: Requirements 1.9, 2.7, 6.2, 6.10**

  - [x]* 5.4 Test własnościowy braku wycieku szczegółów wewnętrznych
    - **Property 24: Ciało odpowiedzi błędu nie ujawnia szczegółów wewnętrznych**
    - **Validates: Requirements 6.3, 6.4**

  - [x]* 5.5 Test własnościowy trafienia w cache
    - **Property 30: Trafienie w Cache_Śledzenia eliminuje zapytanie do upstream**
    - **Validates: Requirements 7.1, 7.2, 7.3**

  - [x]* 5.6 Test własnościowy odporności na błędy cache i braku zapisu odpowiedzi błędu
    - **Property 32: Cache nie przechowuje odpowiedzi błędu i nie wpływa na odpowiedź przy awarii**
    - **Validates: Requirements 7.6, 7.8**

  - [x]* 5.7 Test własnościowy pierwszeństwa limitera
    - **Property 33: Limiter_Zapytań jest pierwszym krokiem obsługi**
    - **Validates: Requirements 8.1, 8.3, 8.6**

  - [x]* 5.8 Test własnościowy kontrolowanej odpowiedzi 500
    - **Property 37: Nieobsłużony błąd zawsze daje kontrolowaną odpowiedź 500**
    - **Validates: Requirements 6.3**

- [ ] 6. Checkpoint — backend kompletny
  - Uruchomić `npm test` w `tracking-api/`; upewnić się, że wszystkie testy przechodzą, i zapytać użytkownika, jeśli pojawią się wątpliwości.

- [ ] 7. Dokumentacja wdrożenia i weryfikacja funkcji w izolacji
  - [x] 7.1 Napisać tracking-api/README.md
    - Tabela pięciu zmiennych Konfiguracji_Środowiska: nazwa, przeznaczenie, wartość domyślna, oznaczenie „wymagana”/„opcjonalna”
    - Nota o zasięgu Cache_Śledzenia w granicach jednej instancji serverless wraz ze wskazaniem magazynu zewnętrznego typu Redis dla większego ruchu
    - Opis nieszyfrowanego odcinka do Serwera_Upstream i procedura zmiany jego adresu: aktualizacja `TRACKING_UPSTREAM_URL` w ustawieniach projektu Vercel i ponowne wdrożenie, bez zmiany kodu
    - Nota o mapie 3D jako przyszłym rozszerzeniu wymagającym `react-globe.gl` `^2.37.1`, `three` `^0.184.0` i kroku budowania
    - Ustawienie Root Directory projektu Vercel na `tracking-api/` oraz informacja, że strona statyczna nie jest wdrażana przez Vercel (sprawdzanie `Origin` wymaga konfiguracji cross-origin)
    - _Requirements: 7.7, 9.6, 9.9, 12.4_

  - [x] 7.2 Napisać skrypt testów integracyjnych
    - `tests/integration/` uruchamiany osobno od `npm test`, cztery przypadki: prawdziwy kod → 200 z niepustą listą w budżecie 10 s, nieistniejący kod → 404, żądanie z niedozwolonego `Origin` → 403 bez nagłówka `Access-Control-Allow-Origin`, żądanie po `http` → brak odpowiedzi albo przekierowanie na `https`
    - Adres funkcji i numery przesyłek przekazywane przez zmienne środowiskowe, nie zapisane na stałe
    - _Requirements: 9.3, 9.4, 9.7, 9.8, 6.2_

  - [ ] 7.3 **(RĘCZNE)** Wdrożyć funkcję i uruchomić testy integracyjne
    - **Warunek wejścia: właściciel strony podaje docelową wartość `TRACKING_ALLOWED_ORIGINS`** (wariant z `www`, ewentualne domeny testowe). Brak tej wartości nie blokuje żadnego zadania kodowania — blokuje wyłącznie to zadanie i zadania 13.2–13.3
    - Utworzyć projekt Vercel z Root Directory `tracking-api/`, ustawić `TRACKING_UPSTREAM_URL` i `TRACKING_ALLOWED_ORIGINS` (na czas weryfikacji lista musi zawierać origin środowiska testowego), opcjonalnie trzy pozostałe zmienne
    - Wdrożyć i uruchomić skrypt z zadania 7.2; zapisać adres funkcji jako wartość `FXTRK_API_BASE` do użycia w zadaniu 10.4
    - Strona produkcyjna pozostaje na implementacji iframe — to zadanie nie dotyka plików statycznych
    - _Requirements: 9.1, 9.2, 9.3, 9.6, 9.11_

- [x] 8. Sekcja FXTRK:CORE w script.js
  - [x] 8.1 Utworzyć sekcję CORE z tabelami danych
    - Znaczniki `/* ==== FXTRK:CORE START ==== */` i `/* ==== FXTRK:CORE END ==== */` w `fxlsereps.pl/script.js`
    - Tabele: `FXTRK_STATUS_PL`, `FXTRK_CHINESE_TO_EN`, `FXTRK_COUNTRY_MAP`, `FXTRK_CITY_RULES`, `FXTRK_GENERIC_COUNTRY_LABELS`, `FXTRK_MILESTONES`, `FXTRK_COUNTRY_DELTA`, `FXTRK_TRK_KEYS`
    - `FXTRK_MILESTONES`: kolejność znacząca od `delivered` do `packaging`; pola `key`, `patterns`, `minDays`, `maxDays`, `labelPl`, `labelEn` (bez `labelDe`, `labelEs`); listy `patterns` rozszerzone o **polskie odpowiedniki** produkowane przez Tłumacz_Statusów (np. `przesyłka została pomyślnie dostarczona`, `załadowana na pojazd dostawczy`, `odprawa celna zakończona`, `lot odleciał`, `lot dotarł`) obok istniejących wzorców angielskich i chińskich, ponieważ detekcja Kamienia_Milowego działa na już przetłumaczonych polach `Status` i `Lokalizacja`
    - `FXTRK_CHINESE_TO_EN` bez słowników `de`, `es`, `zh`
    - Końcowy eksport `window.FXTRK_CORE = { ... }` jako jedyny kontakt sekcji z globalnym środowiskiem; zero `import`/`require`, zero `document`, `window.location`, `fetch`
    - _Requirements: 1.2, 5.1, 10.3, 12.2_

  - [x] 8.2 Napisać pomocniki testowe wycinające sekcje ze script.js
    - `tracking-api/tests/helpers/loadCore.js`: odczyt `fxlsereps.pl/script.js` jako tekst, wycięcie fragmentu między znacznikami CORE, uruchomienie w piaskownicy `node:vm` z `sandbox = { window: {}, console }`, zwrot `sandbox.window.FXTRK_CORE`; brak znaczników = błąd
    - `tracking-api/tests/helpers/loadUi.js`: analogiczne wycięcie sekcji `FXTRK:UI` i uruchomienie w kontekście z `document`/`window` z `jsdom` oraz atrapami `fetch`, `localStorage`, `navigator.clipboard` i sterowanym dostawcą czasu
    - Zero duplikacji logiki w plikach testowych; zero plików dodanych do `fxlsereps.pl/`
    - _Requirements: 1.2_

  - [x] 8.3 Zaimplementować walidację kodu i tłumaczenia po stronie klienta
    - `validateCode` — reguła identyczna z `lib/validateCode.js` (6–40 znaków po `trim()`, litery, cyfry, łącznik)
    - `translateStatusForLang`, `translateLocationForLang`: dla `pl` i każdego języka innego niż `en` zwracają pola `Status`/`Lokalizacja` z Odpowiedzi_Śledzenia; dla `en` przetwarzają `OriginalStatus`/`OriginalLocation` przez `CHINESE_TO_EN`, `CJK_REGEX`, `stripChineseOnly`, `stripChineseToEn`, `normalize`, `cleanSpaces` i tabelę lokalizacji
    - _Requirements: 1.11, 2.1, 2.14, 10.3, 10.8_

  - [x] 8.4 Zaimplementować Grupowanie_Krajów
    - `getCountryInfo`: uporządkowana lista sześciu reguł, wynik pierwszej dopasowanej, dalsze reguły nie sprawdzane; reguła domyślna `CN`/CHINY; zdarzenie wejściowe niemodyfikowane
    - Kolejność przy dopasowaniu miast z różnych krajów: `CN`, `PL`, `DE`, `NL`
    - `groupByCountry`: scalanie sąsiadujących grup o identycznym kodzie, zachowanie kolejności zdarzeń
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.11, 4.12, 4.13_

  - [x]* 8.5 Test własnościowy totalności i determinizmu grupowania
    - **Property 11: Totalność i determinizm Grupowania_Krajów**
    - **Validates: Requirements 4.1, 4.4**

  - [x]* 8.6 Test własnościowy pierwszeństwa reguł grupowania
    - **Property 12: Pierwszeństwo reguł Grupowania_Krajów**
    - **Validates: Requirements 4.2, 4.3, 4.11, 4.12, 4.13**

  - [x]* 8.7 Test własnościowy niezmienników listy grup
    - **Property 13: Niezmienniki listy grup**
    - **Validates: Requirements 4.5**

  - [x] 8.8 Zaimplementować rozstrzyganie wyświetlanej lokalizacji i detekcję Kamienia_Milowego
    - `resolveDisplayLocation`: gdy pole `Lokalizacja` zawiera wyłącznie ogólną nazwę kraju różną od nazwy kraju grupy, wynikiem jest nazwa kraju grupy; data i status pozostają nietknięte
    - `detectMilestone`: przegląd zdarzeń od najnowszego, dla każdego zdarzenia Kamienie_Milowe w kolejności od `delivered` do `packaging`, dopasowanie po podłańcuchu na złączeniu `Status` + `Lokalizacja` sprowadzonym do małych liter
    - _Requirements: 4.8, 5.1_

  - [x]* 8.9 Test własnościowy podmiany sprzecznej nazwy kraju
    - **Property 16: Podmiana sprzecznej nazwy kraju w lokalizacji**
    - **Validates: Requirements 4.8**

  - [x]* 8.10 Test własnościowy pierwszeństwa dopasowania Kamienia_Milowego
    - **Property 17: Rozpoznanie Kamienia_Milowego jest pierwszym dopasowaniem**
    - **Validates: Requirements 5.1**

  - [x] 8.11 Zaimplementować Estymator_Dostawy
    - `estimateDelivery`: dla `delivered` — pusty przedział, znacznik dostarczenia prawda, korekta 0, pewność `high`; dla pozostałych kamieni — dolna granica `max(0, minDays + korekta)` dni od daty bazowej (data dopasowanego zdarzenia albo chwila obecna, gdy nieinterpretowalna), podniesiona do chwili obecnej, gdy wypada w przeszłości; górna granica `max(dolna + 1, maxDays + korekta)`, ustawiana na chwilę obecną + 2 dni, gdy wypada w przeszłości; brak dopasowania — etykieta braku danych, pusty przedział, brak klucza, pewność `low`
    - Poziomy pewności z tabeli przypisania; obniżenie `high` → `medium` przy korekcie > 4 dni; kod kraju pusty, krótszy niż 2 znaki albo nieobecny w `COUNTRY_DELTA` daje korektę 0 i zwrot kodu znormalizowanego
    - `getCountryDeltaNote`, `formatDateRange` (dzień miesiąca + skrócona nazwa miesiąca w regionalnych ustawieniach aktywnego języka, `pl` dla języka nieobsługiwanego), `confidenceLabel`
    - **Ograniczenie: „chwila obecna” pochodzi z wstrzykiwanego dostawcy `now`, nie z `new Date()` wewnątrz funkcji**
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.10, 5.11, 5.12_

  - [x]* 8.12 Test własnościowy przedziału dat estymatora
    - **Property 18: Przedział dat Estymatora_Dostawy**
    - **Validates: Requirements 5.3, 5.4, 5.10, 5.11**

  - [x]* 8.13 Test własnościowy kształtu wyniku dla dostarczonej i dla braku danych
    - **Property 19: Kształt wyniku dla przesyłki dostarczonej i dla braku danych**
    - **Validates: Requirements 5.2, 5.5**

  - [x]* 8.14 Test własnościowy poziomu pewności i normalizacji kraju
    - **Property 20: Poziom pewności i normalizacja kraju docelowego**
    - **Validates: Requirements 5.6, 5.7, 5.12**

- [x] 9. Słownik_Tłumaczeń
  - [x] 9.1 Dodać klucze śledzenia do i18n i funkcję dostępu
    - 17 par kluczy śledzenia w `i18n.pl` i `i18n.en` z zachowaniem konwencji kluczowania polskim tekstem źródłowym (`pl` jako odwzorowanie tożsamościowe), plus klucze pomocnicze walidacji, limitu zapytań, schowka i trzech opisów poziomu pewności; każdy tekst 1–80 znaków
    - Zero wersji `de`, `es`, `cn`; zero kluczy `open3DMap` i `beta`
    - `trkT(key)`: nieznany klucz symboliczny → nazwa klucza, brak odwzorowania w wybranym języku → polski tekst źródłowy, język inny niż `en` → `pl`; jedynym źródłem języka jest `currentLang`, bez odczytu `localStorage['tracking_lang']` i ustawień przeglądarki
    - _Requirements: 10.1, 10.2, 10.3, 10.6, 10.7, 10.8, 10.9, 10.10, 12.7_

  - [ ]* 9.2 Test własnościowy ścieżki zapasowej słownika
    - **Property 39: Ścieżka zapasowa Słownika_Tłumaczeń**
    - **Validates: Requirements 10.6, 10.7, 10.8, 10.10**

  - [ ]* 9.3 Test własnościowy kompletności dwujęzycznych tekstów
    - **Property 40: Kompletność dwujęzycznych tekstów śledzenia**
    - **Validates: Requirements 10.3, 10.9**

  - [ ]* 9.4 Test przykładowy obecności 17 kluczy
    - Sprawdzić obecność wszystkich 17 kluczy w mapie `FXTRK_TRK_KEYS` oraz w `i18n.pl` i `i18n.en`
    - _Requirements: 10.2_

- [x] 10. Sekcja FXTRK:UI w script.js
  - [x] 10.1 Utworzyć sekcję UI ze stanem i szkieletem renderowania
    - Znaczniki `/* ==== FXTRK:UI START ==== */` i `/* ==== FXTRK:UI END ==== */`
    - `fxtrkState` z polami `code`, `status`, `data`, `searchedCode`, `errorKey`, `errorParams`, `showAll`, `copiedField`, `copiedTimer`, `controller`, `safetyTimer`
    - `renderTracking()` jako funkcja totalna: przełącznik po `state.status`, pełne przebudowanie zawartości `#YQContainer`; `renderLoading()`; `renderError()` z Kodem_Śledzenia wstawianym przez `textContent`; `showError(key, params)` czyszczące kontener, dzięki czemu widoczny jest dokładnie jeden komunikat i zero starych wyników
    - Struktura wyłącznie przez `document.createElement`, wartości wyłącznie przez `textContent`, ikony jako osobne elementy; zero `innerHTML` z danymi, zero `eval`/`new Function`/`setTimeout` z łańcuchem
    - _Requirements: 6.5, 6.8, 6.9, 6.12_

  - [x] 10.2 Zaimplementować renderowanie wyniku, karty estymaty i informacji głównych
    - `renderResult()`, `renderEstimateCard(estimate)` (etykieta Kamienia_Milowego, przedział dat obecny tylko gdy niepusty, dokładnie jeden wskaźnik pewności ze zbioru `high`/`medium`/`low` z opisem w aktywnym języku, adnotacja korekty kraju wyłącznie przy korekcie różnej od 0 — ze znakiem, liczbą dni, nazwą jednostki i kodem kraju), `renderMainInfo(mainInfo)` (sześć pól zawsze rozwiniętych, zero przycisków przełączających ich widoczność, dwa przyciski kopiowania)
    - Karta estymaty w głównym widoku wyników; zero elementów otwierających mapę 3D i zero etykiet wersji testowej w każdym stanie widoku
    - `Aktualna lokalizacja` wyznaczana z najnowszego Zdarzenia_Śledzenia po stronie klienta
    - _Requirements: 5.8, 5.9, 5.13, 11.3, 12.1, 12.3, 12.5_

  - [x] 10.3 Zaimplementować oś czasu, próg 15 zdarzeń i skrót ostatniego kodu
    - `renderTimeline(groups)`: nagłówek grupy z dwuliterowym kodem i nazwą kraju wielkimi literami dokładnie raz na grupę; na każde zdarzenie trzy niepuste pola (data, status, lokalizacja) ze stałym tekstem zastępczym w miejsce pola o długości zero
    - `renderShowMoreButton(total)`: przy ≥ 16 zdarzeniach dokładnie 15 pozycji i dokładnie jeden przycisk rozwijania, przy 1–15 wszystkie pozycje i zero przycisków; rozwinięcie zachowuje podział na grupy i zamienia przycisk na zwijający
    - `renderLastSearched()`: skrót wyświetlany wyłącznie gdy wartość `last_tracking_code` przejdzie tę samą walidację co wpisany kod; `localStorage` traktowane jako wejście niezaufane
    - Pusta lista `Szczegóły_przesyłki` przy `success: true` → komunikat o braku informacji, zero osi czasu i zero grup
    - _Requirements: 4.6, 4.7, 4.9, 4.10, 2.12, 6.12_

  - [x] 10.4 Zaimplementować wiązanie zdarzeń, wysyłanie żądania i trzy limity czasu
    - `FXTRK_API_BASE` jako jedna stała z adresem absolutnym HTTPS (wartość z zadania 7.3); zero wystąpień adresu Serwera_Upstream w plikach statycznych
    - `wireTracking()` uruchamiane **wyłącznie** gdy Widok_Śledzenia nosi atrybut `data-fxtrk-nolocale`; nasłuch `click` przycisku i `keydown` Enter w `#YQNum` prowadzące do tej samej `submitTracking()`; jedna delegacja `click` na `#YQContainer` rozpoznająca akcje po `data-fxtrk-action` ze zbioru zamkniętego, ustawianym przez `setAttribute`
    - `submitTracking()`: natychmiastowe wyjście przy `status === 'loading'` (maksymalnie 1 żądanie równolegle), walidacja przed wysłaniem, `encodeURIComponent` kodu, `fetch` po HTTPS, `AbortController` 10000 ms, zabezpieczenie `setTimeout` 15000 ms, czyszczenie oba timerów w jednym bloku `finally`, wskaźnik ładowania i blokada przycisku, zapis `last_tracking_code` po udanej odpowiedzi z pominięciem skrótu przy błędzie `localStorage`
    - Mapowanie odpowiedzi: 400 → komunikat walidacyjny, 403/500/inne poza 2xx → błąd serwera, 404 → brak przesyłki z kodem jako tekstem, 429 → limit zapytań z liczbą sekund z `Retry-After` (60 s przy nagłówku nieobecnym lub niepoprawnym), treść nieparsowalna jako JSON → błąd serwera, odrzucenie `fetch`/poziom 2/poziom 3 → błąd połączenia; każde zakończenie przywraca stan interaktywny i zachowuje wpisany kod
    - Renderowanie wewnątrz Widoku_Śledzenia z zachowaniem mechanizmu `.hidden` i `data-view`
    - **Ograniczenie: limity 10000 ms i 15000 ms pochodzą z konfiguracji modułu przyjmującej dostawcę czasu, aby testy nie czekały na prawdziwy zegar**
    - _Requirements: 1.5, 1.8, 1.10, 2.1, 2.2, 2.3, 2.4, 2.11, 2.13, 2.14, 2.15, 6.6, 6.7, 6.11, 6.13, 8.5, 9.4, 9.12_

  - [x] 10.5 Zaimplementować kopiowanie do schowka
    - Zapis dokładnie wyświetlanej wartości po `trim()`, bez etykiety pola; potwierdzenie wyłącznie przy przycisku użytym jako ostatni; usunięcie potwierdzenia i przywrócenie przycisku po 2000 ms; odrzucenie obietnicy albo niedostępny interfejs schowka → wartość niezmieniona, brak potwierdzenia, komunikat ze Słownika_Tłumaczeń
    - **Ograniczenie: opóźnienie 2000 ms realizowane przez wstrzykiwany dostawcę czasu/timerów**
    - _Requirements: 11.5, 11.6, 11.7, 11.8_

  - [x] 10.6 Zmodyfikować translatePage i podłączyć nasłuch zmiany języka
    - Dwie zmiany w istniejącej `translatePage(lang)`: `NodeFilter` odrzucający węzły wewnątrz elementu z atrybutem `data-fxtrk-nolocale` oraz `document.dispatchEvent(new CustomEvent('fxtrk:langchange', { detail: { lang } }))` na końcu
    - Nasłuch `fxtrk:langchange` w sekcji UI wywołujący `renderTracking()`; przerysowanie czyta `state.data` z pamięci, zero wywołań `fetch`, zero utraty wyświetlanych danych
    - _Requirements: 10.1, 10.4, 10.5_

  - [ ]* 10.7 Test własnościowy spójności walidacji kodu po obu stronach granicy
    - **Property 1: Walidacja Kodu_Śledzenia jest spójna po obu stronach granicy**
    - **Validates: Requirements 1.11, 2.1, 2.3, 2.14, 6.1**

  - [ ]* 10.8 Test własnościowy renderowania osi czasu i progu 15 zdarzeń
    - **Property 14: Renderowanie osi czasu i progu 15 zdarzeń**
    - **Validates: Requirements 4.6, 4.7, 4.9**

  - [ ]* 10.9 Test własnościowy odwracalności rozwinięcia listy
    - **Property 15: Rozwinięcie i zwinięcie listy jest odwracalne**
    - **Validates: Requirements 4.10**

  - [ ]* 10.10 Test własnościowy adnotacji korekty kraju
    - **Property 21: Adnotacja korekty kraju docelowego**
    - **Validates: Requirements 5.8, 5.13**

  - [ ]* 10.11 Test własnościowy karty estymaty i braku mapy 3D
    - **Property 22: Karta estymaty i brak mapy 3D w każdym stanie widoku**
    - **Validates: Requirements 5.9, 12.3, 12.5**

  - [ ]* 10.12 Test własnościowy wstawiania danych do DOM jako tekstu
    - **Property 25: Wstawianie danych do DOM nie tworzy znaczników**
    - **Validates: Requirements 6.5**

  - [ ]* 10.13 Test własnościowy powrotu do stanu interaktywnego
    - **Property 26: Zakończenie żądania zawsze przywraca widok do stanu interaktywnego**
    - **Validates: Requirements 1.10, 2.13, 6.6, 6.7, 6.11, 6.13**

  - [ ]* 10.14 Test własnościowy liczby widocznych komunikatów błędu
    - **Property 27: Dokładnie jeden albo zero komunikatów błędu**
    - **Validates: Requirements 6.8, 6.9, 6.12**

  - [ ]* 10.15 Test własnościowy jednego żądania w danym momencie i zapisu ostatniego kodu
    - **Property 28: Jedno żądanie w danym momencie i zapis ostatniego kodu**
    - **Validates: Requirements 2.2, 2.4, 2.11**

  - [ ]* 10.16 Test własnościowy skrótu ostatniego wyszukiwania
    - **Property 29: Skrót ostatniego wyszukiwania**
    - **Validates: Requirements 2.12**

  - [ ]* 10.17 Test własnościowy przełączenia języka bez sieci
    - **Property 38: Przełączenie języka przerysowuje widok bez sieci**
    - **Validates: Requirements 10.1, 10.4, 10.5**

  - [ ]* 10.18 Test własnościowy kopiowania do schowka
    - **Property 41: Kopiowanie do schowka**
    - **Validates: Requirements 11.5, 11.6, 11.7, 11.8**

  - [ ]* 10.19 Testy przykładowe warstwy widoku
    - Zachowanie klasy `.hidden` i atrybutów `data-view` po renderze (1.8); błąd `localStorage.setItem` → wynik zachowany, skrót pominięty (2.15); zero przycisków przełączających widoczność pól informacji głównych (11.3)
    - _Requirements: 1.8, 2.15, 11.3_

- [ ] 11. Checkpoint — CORE, UI i słownik kompletne
  - Uruchomić `npm test` w `tracking-api/`; upewnić się, że wszystkie testy przechodzą, i zapytać użytkownika, jeśli pojawią się wątpliwości.

- [x] 12. Port CSS
  - [x] 12.1 Przenieść style modułu do style.css z przedrostkiem fxtrk-
    - Wszystkie klasy z przedrostkiem `fxtrk-` w konwencji bloku i elementu (`fxtrk-box`, `fxtrk-timeline__item`, `fxtrk-estimate--high`); warianty pewności jako `fxtrk-estimate--high`/`fxtrk-dot--high`/`fxtrk-fill--high` zamiast składania nazw klas przez interpolację
    - Konsolidacja progów: 768/640/480 px z modułu → progi strony **1024 px** i **768 px**, reguły z zakresów 640 i 480 px scalone do progu 768 px
    - `fxtrk-info-grid`: `1fr 1fr` powyżej 768 px, `1fr` na 768 px i mniej; oś czasu jednokolumnowa na każdej szerokości
    - `fxtrk-root`: `max-width: 900px`, `width: 100%`, `overflow-x: hidden`; długie wartości `overflow-wrap: anywhere`
    - `#tracking-view .fxtrk-root { user-select: text; -webkit-user-select: text; }`
    - Zero reguł mapy 3D: pominięte `.mapBanner*`, `.betaBadge`, `.globe*`, `.sideInfoBox`, `.mobileInfoToggle`, `.closeGlobe`, `.floatingTitle`; odstęp po dawnym banerze przejmuje `margin-bottom: 30px` pierwszej sekcji wyników
    - Karta estymaty jako `fxtrk-estimate` w głównym widoku wyników
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.9, 11.10, 12.6_

  - [ ]* 12.2 Test własnościowy rozłączności nazw klas
    - **Property 42: Rozłączność nazw klas CSS**
    - **Validates: Requirements 11.9**

- [ ] 13. Kopia weryfikacyjna i weryfikacja równoważności
  - [ ] 13.1 Utworzyć kopię weryfikacyjną strony
    - `index.tracking-preview.html` — kopia `index.html` z Widokiem_Śledzenia bez atrybutu `onclick="doTrack()"`, z atrybutami `data-fxtrk-nolocale` na `#YQContainer` i sekcji bohatera, korzystająca z tego samego `script.js` (sekcje FXTRK aktywują się przez obecność atrybutu)
    - Plik jest tymczasowy i zostaje usunięty w zadaniu 14.4; do tego czasu strona produkcyjna działa na implementacji iframe
    - _Requirements: 1.8, 10.4_

  - [ ] 13.2 **(RĘCZNE)** Zweryfikować równoważność ze implementacją iframe
    - **Warunek wejścia: `TRACKING_ALLOWED_ORIGINS` zawiera origin środowiska weryfikacyjnego**
    - Zestaw **co najmniej 5 prawdziwych numerów przesyłek**: przesyłka w tranzycie w Chinach, po odprawie w Holandii, w Niemczech, dostarczona w Polsce oraz numer nieistniejący
    - Porównanie **faktów, nie sformatowanego tekstu**: liczba zdarzeń (`data.events.length` vs `Szczegóły_przesyłki.length`) — równe; zbiór dat (`ev.date` vs `OriginalDate`) — identyczne; zbiór statusów surowych (`ev.status` vs `OriginalStatus`) — identyczne; numer śledzenia; kraj docelowy; ostatni status przed tłumaczeniem — odpowiadające sobie; numer nieistniejący — oba bez wyniku
    - **Rozbieżność liczby zdarzeń albo zbioru dat jest blokerem zadania 14.2** i oznacza błąd w selektorach parsera. Rozbieżność w sformatowanym tekście statusu blokerem nie jest — nowa tablica tłumaczeń jest szersza celowo
    - _Requirements: 1.3, 2.8, 2.9, 3.11, 6.2_

  - [ ] 13.3 **(RĘCZNE)** Potwierdzić trzy zachowania nieobecne w starej implementacji
    - Przełączenie języka bez ponownego pobrania danych (panel sieci: zero żądań po pierwszym pobraniu)
    - Próg 15 zdarzeń z przyciskiem rozwijania i zwijania
    - Karta szacowanej dostawy w głównym widoku wyników
    - _Requirements: 10.5, 4.9, 4.10, 12.5_

- [ ] 14. Wdrożenie docelowe i weryfikacja poprodukcyjna
  - [ ] 14.1 Wykonać obowiązkową kopię zapasową plików statycznych
    - Kopia `index.html`, `script.js`, `style.css` poza katalogiem wdrożenia, wraz z sumami kontrolnymi
    - **Kopia jest obowiązkowa: implementacja iframe zostaje usunięta bez ścieżki awaryjnej w kodzie i po zadaniu 14.2 kopia jest jej jedynym źródłem**
    - _Requirements: 1.6_

  - [ ] 14.2 Wykonać wdrożenie docelowe w jednym kroku
    - Usunąć z `script.js` całą implementację iframe: `TRACKING_API`, `_track_form`, `_track_iframe`, `_track_parseDoc`, `_track_renderResult`, `doTrack`, `TRACK_STATUS_MAP`, `_track_translateStatus`
    - Zaktualizować `#tracking-view` w `index.html`: usunąć `onclick="doTrack()"`, dodać `data-fxtrk-nolocale` na `#YQContainer` i sekcji bohatera, zachować `#YQNum`, `#YQContainer` oraz mechanizm `.hidden`/`data-view`
    - Usunąć ze `style.css` bloki `.track-result*` i `.track-event*`; podnieść `style.css?v=NNNN` w `index.html`
    - Potwierdzić, że katalog wdrożenia zawiera dokładnie trzy pliki i zero plików konfiguracji kroku budowania
    - _Requirements: 1.1, 1.2, 1.6, 1.8, 11.9, 12.2_

  - [ ]* 14.3 Napisać kontrole statyczne plików strony statycznej
    - `tests/static.test.js` czytający `index.html`, `script.js`, `style.css` jako tekst: zero `import`/`require`; zero wystąpień adresu Serwera_Upstream; zero odwołań `react`, `react-dom`, `next`, `react-globe.gl`, `three`, `TrackingGlobe`; zero pozostałości `.track-*`, `_track_form`, `_track_iframe`, `doTrack`, `TRACK_STATUS_MAP`; obecność obu par znaczników sekcji; zero `document` i `fetch` wewnątrz sekcji `FXTRK:CORE`; progi `@media` ograniczone do 1024 i 768 px w regułach `fxtrk-`; obecność `user-select: text` dla kontenera Widoku_Śledzenia; dokładnie trzy pliki wdrażane w `fxlsereps.pl/`
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 9.12, 11.4, 11.10, 12.1, 12.2_

  - [ ] 14.4 Usunąć kopię weryfikacyjną
    - Usunąć `index.tracking-preview.html`; sprawdzić, że w katalogu wdrożenia pozostają dokładnie `index.html`, `script.js`, `style.css`
    - _Requirements: 1.1_

  - [ ] 14.5 **(RĘCZNE)** Weryfikacja poprodukcyjna układu i sieci
    - Lista kontrolna układu przy pięciu szerokościach okna: 320, 375, 768, 1024, 1440 px — oś czasu jednokolumnowa w zakresie 320–768 px, brak poziomego paska przewijania w całym zakresie, wszystkie pola informacji głównych rozwinięte powyżej 768 px, możliwe zaznaczenie numeru śledzenia i treści zdarzeń
    - Panel sieci podczas wyszukiwania: zero żądań na adres Serwera_Upstream, zero ostrzeżeń o treściach mieszanych, zero żądań o zasoby mapy 3D
    - Kontrola katalogu wdrożenia: trzy pliki, sumy kontrolne zgodne ze źródłem
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 1.1, 1.5, 9.4, 9.12, 12.1_

- [ ] 15. Checkpoint końcowy
  - Uruchomić `npm test` w `tracking-api/`; upewnić się, że wszystkie testy przechodzą, i zapytać użytkownika, jeśli pojawią się wątpliwości.

## Notes

- Zadania oznaczone `*` są opcjonalne i można je pominąć przy szybszym MVP; wszystkie 42 testy własnościowe są opcjonalne w tym sensie, ale każdy odpowiada dokładnie jednej własności z projektu i pominięcie ich zdejmuje z planu główną gwarancję poprawności.
- Zadania oznaczone **(RĘCZNE)** — 7.3, 13.2, 13.3, 14.5 — wymagają przeglądarki, wdrożonej funkcji albo prawdziwych numerów przesyłek i nie dają się wykonać automatycznie.
- `TRACKING_ALLOWED_ORIGINS` wymaga wartości od właściciela strony. Jest to warunek wejścia zadań 7.3, 13.2 i 14.2, a nie bloker żadnego zadania kodowania — fazy 1–6 oraz 8–12 wykonują się w całości bez tej wartości.
- Punktem bez powrotu jest zadanie 14.2; domyka go zadanie 14.5. Zadania 1–13 nie zmieniają zachowania strony produkcyjnej, bo sekcje FXTRK pozostają uśpione do momentu dodania atrybutu `data-fxtrk-nolocale` do `index.html`.
- Wycofanie: pliki statyczne z kopii zadania 14.1 i przywrócenie poprzedniego `?v=`; funkcja przez „Instant Rollback” na Vercel. Obie warstwy wycofują się niezależnie, bez migracji danych.
- Każdy test własnościowy nosi komentarz `// Feature: tracking-module-integration, Property N: <nazwa>` i uruchamia się z `{ numRuns: 100 }` jako minimum.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "8.1"] },
    { "id": 1, "tasks": ["1.2", "8.2", "8.3"] },
    { "id": 2, "tasks": ["1.3", "2.1", "2.3", "2.5", "3.1", "3.3", "3.7", "4.1", "8.4"] },
    { "id": 3, "tasks": ["1.4", "2.2", "2.4", "3.2", "3.4", "3.5", "3.6", "3.8", "3.9", "4.2", "8.8"] },
    { "id": 4, "tasks": ["3.10", "3.11", "3.12", "5.1", "8.11"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "7.1", "7.2", "9.1"] },
    { "id": 6, "tasks": ["7.3", "8.5", "8.6", "8.7", "10.1"] },
    { "id": 7, "tasks": ["8.9", "8.10", "10.2"] },
    { "id": 8, "tasks": ["8.12", "8.13", "8.14", "10.3"] },
    { "id": 9, "tasks": ["9.2", "9.3", "9.4", "10.4"] },
    { "id": 10, "tasks": ["10.5"] },
    { "id": 11, "tasks": ["10.6", "12.1"] },
    { "id": 12, "tasks": ["10.7", "10.8", "10.9", "10.10", "10.11", "10.12", "10.13", "10.14", "10.15", "10.16", "10.17", "10.18", "10.19", "12.2"] },
    { "id": 13, "tasks": ["13.1"] },
    { "id": 14, "tasks": ["13.2", "13.3"] },
    { "id": 15, "tasks": ["14.1"] },
    { "id": 16, "tasks": ["14.2"] },
    { "id": 17, "tasks": ["14.3", "14.4"] },
    { "id": 18, "tasks": ["14.5"] }
  ]
}
```
