# Requirements Document

## Introduction

Do przestrzeni roboczej dostarczono samodzielny moduł śledzenia przesyłek (`tracking-module`), napisany jako moduł Next.js App Router. Docelowa strona `fxlsereps.pl` jest stroną w pełni statyczną: `index.html`, `script.js`, `style.css`, bez kroku budowania, bez `package.json`, bez Reacta i bez środowiska uruchomieniowego po stronie serwera. Modułu nie da się wgrać bez zmian, ponieważ jego backend wymaga środowiska serwerowego (`cheerio`, `node-cache`), a jego frontend wymaga Reacta.

Wybrana ścieżka integracji to **ścieżka hybrydowa**: warstwa prezentacji zostaje przeniesiona do czystego JavaScriptu i wbudowana w istniejący widok `#tracking-view`, natomiast logika backendu z `app/api/tracking/[code]/route.js` zostaje wdrożona jako pojedyncza funkcja serverless wystawiona po HTTPS. Dzięki temu strona pozostaje statyczna, a jednocześnie znika obecna obejściowa implementacja oparta na ukrytym formularzu POST i parsowaniu `contentDocument` iframe'a (`script.js`, linie ~428–620), którą wymuszał brak nagłówków CORS na serwerze upstream.

Zakres został zawężony pięcioma decyzjami:

- Mapa 3D (`react-globe.gl`, `three`) jest **poza zakresem** tej integracji.
- Interfejs ma obsługiwać **wyłącznie języki `pl` i `en`**, zgodnie z resztą strony.
- Dotychczasowa implementacja śledzenia oparta na iframe zostaje **usunięta**, a nie zachowana jako awaryjna.
- Teksty interfejsu pochodzą ze **słownika tłumaczeń strony** w `script.js`; moduł nie utrzymuje własnego wykrywania języka przez `localStorage['tracking_lang']`.
- Funkcja serverless zostaje wdrożona na **Vercel**.

Wybór Vercel jako platformy wdrożenia ma następujące konsekwencje dla zakresu: funkcja żyje w katalogu `/api` projektu Vercel i jest dostępna pod ścieżką `/api/tracking/{kod}`; kod trasy Next.js z `app/api/tracking/[code]/route.js` przenosi się z minimalną zmianą, ponieważ Vercel uruchamia go w tym samym środowisku Node.js; pamięć podręczna oparta na `node-cache` obowiązuje w granicach jednej instancji środowiska serverless Vercel, więc jej skuteczność zależy od liczby równolegle utrzymywanych instancji; wszystkie zmienne środowiskowe (adres serwera upstream, limity zapytań, czas życia wpisu pamięci podręcznej, lista dopuszczonych domen źródłowych) konfiguruje się w ustawieniach projektu Vercel, a nie w plikach repozytorium.

Dokładna domena, którą lista dopuszczonych domen źródłowych ma przyjmować dla `fxlsereps.pl` (wariant z prefiksem `www` i ewentualne domeny testowe), pozostaje **otwartą wartością konfiguracyjną** do podania przez właściciela strony. Jest to wartość zmiennej środowiskowej, nie element projektu, więc jej brak nie blokuje niniejszej specyfikacji ani projektu technicznego.

Dokument obejmuje także zagadnienia produkcyjne wskazane w README modułu i potwierdzone w kodzie: brak szyfrowania połączenia z upstream (zwykły HTTP na goły adres IP), brak jakiegokolwiek limitowania ruchu na endpoint, wyłączony cache (`const cachedData = null; // TEMPORARILY DISABLED`) przy już skonfigurowanym TTL 3600 s, oraz kalibrację reguł wykrywania kraju i modelu ETA pod trasę CN → NL → DE → PL.

Niniejsza specyfikacja **zastępuje wymaganie 20** z `.kiro/specs/streetwear-landing-page/requirements.md`, które opisuje widok śledzenia jako integrację z serwisem 17track.net. Tamten opis jest nieaktualny — nie odpowiada ani obecnemu kodowi w `script.js`, ani dostarczonemu modułowi.

## Glossary

- **Strona_Statyczna** — istniejąca witryna `fxlsereps.pl`, złożona z `index.html`, `script.js` i `style.css`, serwowana bez kroku budowania i bez logiki serwerowej.
- **Widok_Śledzenia** — sekcja `#tracking-view` w `index.html`, przełączana klasą `.hidden` i atrybutami `data-view`, zawierająca pole numeru przesyłki i przycisk uruchamiający wyszukiwanie.
- **UI_Śledzenia** — warstwa prezentacji śledzenia po przeniesieniu do czystego JavaScriptu, renderowana wewnątrz Widoku_Śledzenia.
- **Funkcja_Śledzenia** — funkcja serverless powstała z `app/api/tracking/[code]/route.js`, wystawiona pod publicznym adresem HTTPS, przyjmująca żądania `GET` z **Kodem_Śledzenia** w ścieżce.
- **Platforma_Wdrożenia** — Vercel, wybrana platforma hostingu Funkcji_Śledzenia; funkcja jest umieszczona w katalogu `/api` projektu i dostępna pod ścieżką `/api/tracking/{Kod_Śledzenia}`, a Konfiguracja_Środowiska jest ustawiana w ustawieniach projektu Vercel.
- **Serwer_Upstream** — zewnętrzny serwer śledzenia pod adresem `http://111.231.71.230:8082/trackIndex.htm`, przyjmujący `POST` z polem `documentCode` w formacie `application/x-www-form-urlencoded` i zwracający HTML.
- **Kod_Śledzenia** — identyfikator przesyłki wpisany przez użytkownika, przekazywany do Serwera_Upstream jako `documentCode`.
- **Odpowiedź_Śledzenia** — dokument JSON zwracany przez Funkcję_Śledzenia, zawierający pola `success`, `Informacje_główne`, `Szczegóły_przesyłki` i `Źródło`.
- **Zdarzenie_Śledzenia** — pojedynczy wpis historii przesyłki z polami `Data`, `Lokalizacja`, `Status`, `OriginalDate`, `OriginalLocation`, `OriginalStatus`.
- **Tłumacz_Statusów** — logika `translateStatus` z `route.js` oraz `lib/trackingTranslations.js`, odwzorowująca statusy Serwera_Upstream na teksty w języku docelowym.
- **Normalizator_Lokalizacji** — logika `formatLocation` z `route.js`, ujednolicająca zapis lokalizacji (kody krajów, format `MIASTO (KOD)`, nazwy miast).
- **Grupowanie_Krajów** — logika `getCountryInfo` z `components/Tracking.jsx`, uporządkowana lista reguł przypisujących Zdarzenie_Śledzenia do kraju, wraz ze scalaniem sąsiadujących grup o tym samym kodzie kraju.
- **Estymator_Dostawy** — model `lib/deliveryEstimator.js` wyznaczający przewidywany przedział daty dostawy na podstawie rozpoznanego kamienia milowego i tabeli `COUNTRY_DELTA`.
- **Kamień_Milowy** — wpis z tablicy `MILESTONES` w Estymatorze_Dostawy, z listą wzorców tekstowych, zakresem `minDays`–`maxDays` i etykietami językowymi.
- **Cache_Śledzenia** — pamięć podręczna Odpowiedzi_Śledzenia w Funkcji_Śledzenia, o czasie życia 3600 sekund, kluczowana znormalizowanym Kodem_Śledzenia, obowiązująca w granicach jednej instancji środowiska serverless Platformy_Wdrożenia.
- **Limiter_Zapytań** — mechanizm ograniczający liczbę żądań przyjmowanych przez Funkcję_Śledzenia w zadanym okresie, w podziale na adres IP klienta.
- **Słownik_Tłumaczeń** — istniejący słownik polsko-angielski w `script.js`, zawierający już klucze związane ze śledzeniem.
- **Konfiguracja_Środowiska** — zbiór zmiennych środowiskowych Funkcji_Śledzenia ustawianych w ustawieniach projektu Platformy_Wdrożenia, obejmujący adres Serwera_Upstream, limity Limitera_Zapytań, czas życia Cache_Śledzenia oraz listę dopuszczonych domen źródłowych.

## Requirements

### Requirement 1: Architektura hybrydowa integracji

**User Story:** Jako właściciel strony chcę zintegrować moduł śledzenia bez przebudowy witryny na Next.js, aby zachować obecny statyczny hosting i jednocześnie zyskać backend śledzenia.

#### Acceptance Criteria

1. THE Strona_Statyczna SHALL pozostać zbiorem plików `index.html`, `script.js` i `style.css`, przy zerowej liczbie plików konfiguracji kroku budowania (`package.json`, `next.config.js`, `webpack.config.js`, `vite.config.js`) w katalogu wdrożenia oraz przy treści wdrożonych plików identycznej znak w znak z treścią plików źródłowych.
2. THE UI_Śledzenia SHALL być zaimplementowane w `script.js` i `style.css` przy zerowej liczbie instrukcji `import` i `require` oraz zerowej liczbie odwołań do pakietów `react`, `react-dom` i `next`, tak aby Widok_Śledzenia działał po otwarciu `index.html` bez instalowania zależności.
3. THE Funkcja_Śledzenia SHALL zachować logikę parsowania, tłumaczenia i sortowania z `app/api/tracking/[code]/route.js`, porządkując Zdarzenia_Śledzenia malejąco po polu `OriginalDate` (od najnowszego do najstarszego) oraz zwracając dla statusu bez odwzorowania w tabeli tłumaczeń tekst wejściowy po oczyszczeniu.
4. WHEN Funkcja_Śledzenia otrzyma żądanie `GET` pod ścieżką `/api/tracking/{Kod_Śledzenia}`, THE Funkcja_Śledzenia SHALL zwrócić w czasie nie dłuższym niż 10 sekund dokument JSON z nagłówkiem `Content-Type: application/json`, zawierający pole `success` o wartości logicznej, pole `Informacje_główne` z polami nagłówkowymi przesyłki, pole `Szczegóły_przesyłki` z listą Zdarzeń_Śledzenia oraz pole `Źródło` z tekstem wskazującym pochodzenie danych.
5. THE UI_Śledzenia SHALL pobierać dane wyłącznie przez wywołanie `fetch` do Funkcji_Śledzenia po protokole HTTPS, przy zerowej liczbie żądań przeglądarki kierowanych bezpośrednio na adres Serwera_Upstream, co wyklucza ostrzeżenia o treściach mieszanych oraz zapytania międzydomenowe do Serwera_Upstream.
6. THE Strona_Statyczna SHALL zostać pozbawiona kodu tworzącego ukryty formularz `_track_form` oraz iframe `_track_iframe` wraz z funkcjami `_track_parseDoc` i `_track_renderResult`.
7. THE Funkcja_Śledzenia SHALL zwracać nagłówek `Access-Control-Allow-Origin` o wartości równej dokładnie jednej domenie Strony_Statycznej odczytanej z Konfiguracji_Środowiska, z wykluczeniem wartości `*`.
8. THE UI_Śledzenia SHALL renderować wyniki wewnątrz Widoku_Śledzenia, zachowując istniejący mechanizm przełączania widoków oparty na klasie `.hidden` i atrybutach `data-view`.
9. IF Serwer_Upstream nie odpowie w ciągu 8000 milisekund albo zwróci dokument, z którego Funkcja_Śledzenia wyodrębni zero Zdarzeń_Śledzenia, THEN THE Funkcja_Śledzenia SHALL przerwać połączenie z Serwerem_Upstream i zwrócić Odpowiedź_Śledzenia z polem `success` o wartości `false`, bez ponowienia zapytania.
10. IF Funkcja_Śledzenia nie zwróci odpowiedzi w ciągu 10000 milisekund od wysłania żądania przez UI_Śledzenia, THEN THE UI_Śledzenia SHALL przerwać oczekiwanie, wyświetlić komunikat błędu pobrany ze Słownika_Tłumaczeń, zachować niezmienioną wartość wpisanego Kodu_Śledzenia w polu numeru przesyłki oraz odblokować przycisk wyszukiwania, umożliwiając ponowienie próby.
11. WHEN Funkcja_Śledzenia otrzyma Kod_Śledzenia, THE Funkcja_Śledzenia SHALL przyjąć do dalszej obsługi wyłącznie wartość, która po usunięciu znaków białych z początku i końca ma długość od 6 do 40 znaków i składa się wyłącznie z liter, cyfr i znaku łącznika.

### Requirement 2: Wyszukiwanie przesyłki

**User Story:** Jako klient chcę wpisać numer przesyłki i zobaczyć jej aktualny status, aby wiedzieć, gdzie znajduje się moje zamówienie.

#### Acceptance Criteria

1. WHEN użytkownik zatwierdzi formularz śledzenia z Kodem_Śledzenia, który po usunięciu znaków białych z początku i końca ma długość od 6 do 40 znaków i składa się wyłącznie z liter, cyfr i znaku łącznika, THE UI_Śledzenia SHALL wysłać dokładnie jedno żądanie `GET` do Funkcji_Śledzenia z tym Kodem_Śledzenia zakodowanym funkcją `encodeURIComponent`.
2. WHILE żadne żądanie do Funkcji_Śledzenia nie jest w toku, WHEN użytkownik naciśnie klawisz Enter w polu numeru przesyłki, THE UI_Śledzenia SHALL uruchomić to samo wyszukiwanie co zatwierdzenie formularza przyciskiem, bez ponownego wczytania strony.
3. IF użytkownik zatwierdzi formularz z Kodem_Śledzenia pustym lub złożonym wyłącznie ze znaków białych, THEN THE UI_Śledzenia SHALL zaniechać wysłania żądania, zachować niezmienioną wartość pola numeru przesyłki, ustawić na nim fokus oraz wyświetlić komunikat walidacyjny pobrany ze Słownika_Tłumaczeń.
4. WHILE żądanie do Funkcji_Śledzenia jest w toku, THE UI_Śledzenia SHALL wyświetlać wskaźnik ładowania, utrzymywać przycisk wyszukiwania w stanie zablokowanym oraz pomijać kolejne zatwierdzenia formularza, tak aby liczba jednocześnie wysłanych żądań do Funkcji_Śledzenia nie przekroczyła 1.
5. WHEN Funkcja_Śledzenia otrzyma Kod_Śledzenia, THE Funkcja_Śledzenia SHALL usunąć znaki białe z jego początku i końca oraz zamienić litery na wielkie przed wysłaniem zapytania do Serwera_Upstream.
6. WHEN Funkcja_Śledzenia wysyła zapytanie do Serwera_Upstream, THE Funkcja_Śledzenia SHALL użyć metody `POST` z ciałem `application/x-www-form-urlencoded` zawierającym pole `documentCode`.
7. IF Serwer_Upstream nie odpowie w ciągu 8000 milisekund, THEN THE Funkcja_Śledzenia SHALL przerwać żądanie, zwrócić Odpowiedź_Śledzenia z polem `success` o wartości `false`, zaniechać ponowienia zapytania do Serwera_Upstream oraz zaniechać zapisu w Cache_Śledzenia.
8. WHEN Funkcja_Śledzenia otrzyma HTML z Serwera_Upstream, THE Funkcja_Śledzenia SHALL wyodrębnić z niego pola `Numer referencyjny`, `Numer śledzenia`, `Kraj`, `Data`, `Ostatni status` i `Odbiorca` oraz listę Zdarzeń_Śledzenia z kolumnami daty, lokalizacji i statusu, wstawiając w miejsce pola nieobecnego lub o długości zero stały tekst zastępczy informujący o braku danych, identyczny dla każdego takiego pola.
9. WHEN Funkcja_Śledzenia zbuduje listę Zdarzeń_Śledzenia, THE Funkcja_Śledzenia SHALL uporządkować ją malejąco po polu `OriginalDate`, zachowując dla Zdarzeń_Śledzenia o identycznej wartości `OriginalDate` kolejność ich wystąpienia w dokumencie Serwera_Upstream oraz umieszczając Zdarzenia_Śledzenia o wartości `OriginalDate`, której nie da się zinterpretować jako data, na końcu listy.
10. WHEN Funkcja_Śledzenia zwraca Odpowiedź_Śledzenia z co najmniej jednym Zdarzeniem_Śledzenia, THE Funkcja_Śledzenia SHALL ustawić pole `success` na wartość `true` oraz kod statusu HTTP 200.
11. WHEN UI_Śledzenia otrzyma Odpowiedź_Śledzenia z polem `success` równym `true`, THE UI_Śledzenia SHALL zapisać pod kluczem `last_tracking_code` w `localStorage` użyty Kod_Śledzenia o długości co najwyżej 40 znaków, nadpisując wartość wcześniej zapisaną pod tym kluczem.
12. WHERE w `localStorage` istnieje pod kluczem `last_tracking_code` wartość o długości od 6 do 40 znaków złożona wyłącznie z liter, cyfr i znaku łącznika, THE UI_Śledzenia SHALL wyświetlić skrót, którego jedno kliknięcie wpisuje tę wartość do pola numeru przesyłki i uruchamia wyszukiwanie tego Kodu_Śledzenia.
13. WHEN UI_Śledzenia otrzyma Odpowiedź_Śledzenia, napotka błąd wywołania `fetch` albo gdy od wysłania żądania upłynie 10000 milisekund, THE UI_Śledzenia SHALL ukryć wskaźnik ładowania i odblokować przycisk wyszukiwania.
14. IF użytkownik zatwierdzi formularz z Kodem_Śledzenia, który po usunięciu znaków białych ma długość mniejszą niż 6 znaków albo większą niż 40 znaków, albo zawiera znak inny niż litera, cyfra i łącznik, THEN THE UI_Śledzenia SHALL zaniechać wysłania żądania do Funkcji_Śledzenia oraz wyświetlić komunikat walidacyjny pobrany ze Słownika_Tłumaczeń.
15. IF zapis wartości pod kluczem `last_tracking_code` w `localStorage` zakończy się błędem, THEN THE UI_Śledzenia SHALL zachować wyświetlony wynik wyszukiwania bez zmian oraz pominąć wyświetlenie skrótu ponownego wyszukiwania.

### Requirement 3: Tłumaczenie statusów i normalizacja lokalizacji

**User Story:** Jako polskojęzyczny klient chcę widzieć statusy i lokalizacje w zrozumiałym języku, aby nie musieć czytać angielskich i chińskich komunikatów przewoźnika.

#### Acceptance Criteria

1. WHEN Tłumacz_Statusów otrzyma status o długości od 1 do 500 znaków, którego postać po oczyszczeniu jest identyczna (z uwzględnieniem wielkości liter i pojedynczych odstępów) z kluczem w tabeli tłumaczeń dla języka docelowego, THE Tłumacz_Statusów SHALL zwrócić wyłącznie tekst docelowy przypisany temu kluczowi, w czasie nie dłuższym niż 50 ms na jedno zdarzenie.
2. WHEN Tłumacz_Statusów otrzyma status, dla którego tabela tłumaczeń nie zawiera ani klucza identycznego, ani klucza występującego jako podłańcuch, THE Tłumacz_Statusów SHALL zwrócić tekst wejściowy po oczyszczeniu, bez zmiany kolejności, wielkości liter i treści pozostałych znaków.
3. WHEN Tłumacz_Statusów przetwarza status, THE Tłumacz_Statusów SHALL wykonać oczyszczanie w kolejności: usunięcie jednego przyrostka `transit` lub `pickup` występującego wyłącznie na końcu tekstu, usunięcie pierwszego fragmentu rozpoczynającego się od `(Homepage` i kończącego najbliższym znakiem `)`, zredukowanie każdej sekwencji dwóch lub więcej znaków białych do jednego odstępu oraz usunięcie znaków białych z początku i końca tekstu, i dopiero po tym poszukiwać odwzorowania.
4. WHEN Tłumacz_Statusów otrzyma status rozpoczynający się znakami `签收`, THE Tłumacz_Statusów SHALL zwrócić tekst wynikowy rozpoczynający się tymi dwoma znakami, bezpośrednio połączonymi z przetłumaczoną lub nieprzetłumaczoną resztą tekstu, bez wstawiania odstępu ani innego separatora.
5. IF Tłumacz_Statusów otrzyma status pusty, złożony wyłącznie ze znaków białych albo o wartości nieokreślonej, THEN THE Tłumacz_Statusów SHALL zwrócić tekst pusty i nie zgłaszać błędu przerywającego budowanie pozostałych Zdarzeń_Śledzenia.
6. WHEN Normalizator_Lokalizacji otrzyma tekst o długości od 1 do 200 znaków będący dwuliterowym kodem kraju lub pełną nazwą kraju posiadającą odwzorowanie, przy porównaniu prowadzonym bez rozróżniania wielkości liter, THE Normalizator_Lokalizacji SHALL zwrócić wyłącznie polską nazwę kraju z tabeli odwzorowań.
7. WHEN Normalizator_Lokalizacji otrzyma tekst w formacie `MIASTO (KOD_KRAJU)`, gdzie `KOD_KRAJU` składa się z dokładnie dwóch wielkich liter na końcu tekstu, THE Normalizator_Lokalizacji SHALL zwrócić tekst w formacie `MIASTO, nazwa kraju` dla kodu posiadającego odwzorowanie oraz w formacie `MIASTO, KOD_KRAJU` dla kodu bez odwzorowania, przy czym nazwa miasta jest pozbawiona znaków białych z początku i końca.
8. WHEN Normalizator_Lokalizacji otrzyma tekst zawierający nazwę miasta obecną na liście znanych miast, THE Normalizator_Lokalizacji SHALL zwrócić tekst w formacie `MIASTO, nazwa kraju` przypisanego temu miastu na liście.
9. IF Normalizator_Lokalizacji otrzyma tekst, dla którego nie znaleziono odwzorowania kodu kraju, nazwy kraju, formatu `MIASTO (KOD_KRAJU)` ani znanej nazwy miasta, THEN THE Normalizator_Lokalizacji SHALL zwrócić tekst wejściowy pozbawiony znaków białych z początku i końca, bez innych modyfikacji.
10. IF Normalizator_Lokalizacji otrzyma tekst pusty, złożony wyłącznie ze znaków białych albo o wartości nieokreślonej, THEN THE Normalizator_Lokalizacji SHALL zwrócić stały tekst zastępczy informujący o braku danych o lokalizacji, identyczny dla każdego takiego wejścia.
11. WHEN Funkcja_Śledzenia buduje Zdarzenie_Śledzenia, THE Funkcja_Śledzenia SHALL zapisać w polach `OriginalDate`, `OriginalLocation` i `OriginalStatus` wartości otrzymane od Serwera_Upstream w postaci znak w znak identycznej z odczytaną, przed jakimkolwiek tłumaczeniem, oczyszczaniem i normalizacją, oraz nie modyfikować tych pól po ich zapisaniu.
12. WHEN Funkcja_Śledzenia buduje pole `Odbiorca`, THE Funkcja_Śledzenia SHALL usunąć przedrostek `签收` występujący na początku tekstu, usunąć wszystkie fragmenty odpowiadające tekstowi statusu dostawy oraz nazwie kraju występującej samodzielnie na końcu tekstu, usunąć znaki białe z początku i końca wyniku, a jeżeli wynik ma długość zero, wstawić stały tekst zastępczy informujący o braku danych.

### Requirement 4: Grupowanie zdarzeń po krajach i oś czasu

**User Story:** Jako klient chcę widzieć historię przesyłki podzieloną na kraje w kolejności trasy, aby jednym spojrzeniem ocenić, jak daleko dotarła paczka.

#### Acceptance Criteria

1. WHEN UI_Śledzenia przekaże Grupowaniu_Krajów listę od 1 do 200 Zdarzeń_Śledzenia, THE Grupowanie_Krajów SHALL przypisać każdemu Zdarzeniu_Śledzenia dokładnie jedną parę kodu i nazwy kraju ze zbioru `CN`/CHINY, `NL`/HOLANDIA, `DE`/NIEMCY, `PL`/POLSKA, stosując reguły w kolejności: (1) pole `Lokalizacja` zawierające wyłącznie nazwę kraju Holandia, (2) nazwa znanego miasta w polu `OriginalLocation` lub `OriginalStatus`, (3) przedrostek `Poland,` lub `Germany,` w polu `OriginalStatus`, (4) status odprawy celnej lub etapu lotniczego, (5) status `pick-up successful` albo `loaded to vehicle`/`załadowana` przy braku nazwy polskiego miasta w polach lokalizacji, dający kod `DE` i nazwę NIEMCY, (6) reguła domyślna, przy czym wynik wyznacza pierwsza dopasowana reguła i dalsze reguły nie są sprawdzane, a przypisanie kodów dla całej listy kończy się w czasie nie dłuższym niż 200 milisekund.
2. WHEN pole `Lokalizacja` Zdarzenia_Śledzenia po usunięciu znaków białych z początku i końca jest identyczne — przy porównaniu bez rozróżniania wielkości liter — z jednym z tekstów `holandia`, `holland` lub `netherlands`, THE Grupowanie_Krajów SHALL przypisać temu Zdarzeniu_Śledzenia kod `CN` i nazwę CHINY, ponieważ Serwer_Upstream tak oznacza odprawę eksportową w Chinach.
3. WHEN pole `OriginalLocation` lub `OriginalStatus` Zdarzenia_Śledzenia zawiera jako podłańcuch — przy porównaniu bez rozróżniania wielkości liter — jedną z nazw znanych miast `Shanghai`, `Szanghaj`, `上海`, `Shenzhen`, `深圳`, `Putian`, `莆田`, `Beijing`, `北京`, `Pekin` dla kodu `CN`, `Poznan`, `Poznań`, `Stalowa Wola`, `Warszawa`, `Stryków`, `Strykow`, `Rudnik` dla kodu `PL`, `Bremen`, `Brema`, `Hamburg` dla kodu `DE` albo `Oirschot`, `Vijfhuizen`, `Veenendaal` dla kodu `NL`, THE Grupowanie_Krajów SHALL przypisać kod kraju przypisanego dopasowanemu miastu, a przy dopasowaniu miast z różnych krajów w jednym Zdarzeniu_Śledzenia — kod pierwszego kraju w kolejności `CN`, `PL`, `DE`, `NL`.
4. IF żadna reguła Grupowania_Krajów nie dopasuje Zdarzenia_Śledzenia, w tym gdy pola `Lokalizacja`, `OriginalLocation` i `OriginalStatus` są puste, złożone wyłącznie ze znaków białych albo o wartości nieokreślonej, THEN THE Grupowanie_Krajów SHALL przypisać temu Zdarzeniu_Śledzenia kod `CN` i nazwę CHINY oraz pozostawić pozostałe pola tego Zdarzenia_Śledzenia bez zmian.
5. WHEN Grupowanie_Krajów utworzy listę grup, THE Grupowanie_Krajów SHALL scalić każde dwie sąsiadujące grupy o identycznym kodzie kraju w jedną grupę zachowującą kolejność Zdarzeń_Śledzenia, tak aby w liście wynikowej każde dwie sąsiadujące grupy miały różne kody kraju, a dla przesyłki przebywającej trasę CHINY → HOLANDIA → NIEMCY → POLSKA grupy uporządkowane od najstarszego Zdarzenia_Śledzenia miały kody w kolejności `CN`, `NL`, `DE`, `PL`.
6. WHEN UI_Śledzenia renderuje grupę krajów, THE UI_Śledzenia SHALL wyświetlić w nagłówku tej grupy dwuliterowy kod kraju oraz nazwę kraju zapisaną wielkimi literami, dokładnie jeden raz na grupę.
7. WHEN UI_Śledzenia renderuje Zdarzenie_Śledzenia, THE UI_Śledzenia SHALL wyświetlić trzy niepuste pola — datę, przetłumaczony status oraz znormalizowaną lokalizację — wstawiając stały tekst zastępczy informujący o braku danych w miejsce pola o długości zero.
8. WHEN pole `Lokalizacja` Zdarzenia_Śledzenia zawiera wyłącznie nazwę kraju różną od nazwy kraju przypisanej grupie tego Zdarzenia_Śledzenia, THE UI_Śledzenia SHALL wyświetlić nazwę kraju tej grupy w miejsce nazwy z pola `Lokalizacja`, pozostawiając wyświetlaną datę i status bez zmian.
9. WHILE liczba Zdarzeń_Śledzenia wynosi 16 lub więcej, THE UI_Śledzenia SHALL wyświetlać dokładnie 15 pierwszych Zdarzeń_Śledzenia listy uporządkowanej malejąco po dacie oraz dokładnie jeden przycisk rozwijający pełną listę, a przy liczbie Zdarzeń_Śledzenia od 1 do 15 SHALL wyświetlać wszystkie Zdarzenia_Śledzenia bez tego przycisku.
10. WHEN użytkownik użyje przycisku rozwijającego listę, THE UI_Śledzenia SHALL wyświetlić wszystkie Zdarzenia_Śledzenia z zachowaniem podziału na grupy krajów i kolejności grup oraz zamienić ten przycisk na przycisk zwijający listę do 15 Zdarzeń_Śledzenia.
11. WHEN pole `OriginalStatus` Zdarzenia_Śledzenia rozpoczyna się przedrostkiem `Poland,` albo `Germany,`, przy porównaniu bez rozróżniania wielkości liter, THE Grupowanie_Krajów SHALL przypisać kod `PL` i nazwę POLSKA dla przedrostka `Poland,` oraz kod `DE` i nazwę NIEMCY dla przedrostka `Germany,`.
12. WHEN pole `OriginalStatus` Zdarzenia_Śledzenia zawiera tekst odprawy eksportowej `export customs clearance` albo tekst odlotu samolotu `flight departed`, a żadna wcześniejsza reguła Grupowania_Krajów nie dopasowała tego Zdarzenia_Śledzenia, THE Grupowanie_Krajów SHALL przypisać kod `CN` i nazwę CHINY.
13. WHEN pole `OriginalStatus` Zdarzenia_Śledzenia zawiera tekst odprawy oczekującej na skanowanie `clearance pending scanning` albo tekst przylotu samolotu `flight arrived`, a żadna wcześniejsza reguła Grupowania_Krajów nie dopasowała tego Zdarzenia_Śledzenia, THE Grupowanie_Krajów SHALL przypisać kod `NL` i nazwę HOLANDIA.

### Requirement 5: Szacowanie daty dostawy

**User Story:** Jako klient chcę zobaczyć przewidywany przedział daty dostawy, aby zaplanować odbiór paczki.

#### Acceptance Criteria

1. WHEN UI_Śledzenia przekaże Estymator_Dostawy listę od 1 do 200 Zdarzeń_Śledzenia uporządkowaną od najnowszego do najstarszego, THE Estymator_Dostawy SHALL rozpoznać Kamień_Milowy jako pierwsze dopasowanie uzyskane przez sprawdzenie, czy tekst powstały ze złączenia pól `Status` i `Lokalizacja` sprowadzonych do małych liter zawiera jako podciąg któryś ze wzorców tekstowych Kamienia_Milowego, przy czym Zdarzenia_Śledzenia są przeglądane od najnowszego, a dla każdego Zdarzenia_Śledzenia Kamienie_Milowe są sprawdzane w kolejności od `delivered` (najpóźniejszy) do `packaging` (najwcześniejszy).
2. WHEN Estymator_Dostawy rozpozna Kamień_Milowy o kluczu `delivered`, THE Estymator_Dostawy SHALL zwrócić etykietę tego Kamienia_Milowego w aktywnym języku interfejsu, pusty przedział dat, znacznik dostarczenia o wartości prawda, korektę kraju równą 0 dni oraz poziom pewności `high`, niezależnie od wartości `COUNTRY_DELTA` dla kraju docelowego.
3. WHEN Estymator_Dostawy rozpozna Kamień_Milowy inny niż `delivered`, THE Estymator_Dostawy SHALL wyznaczyć przedział dat względem daty bazowej, którą jest data Zdarzenia_Śledzenia dopasowanego do Kamienia_Milowego, a gdy ta data jest pusta lub nie daje się zinterpretować jako poprawna data — chwila obecna, przyjmując jako dolną granicę datę bazową powiększoną o większą z wartości: 0 dni oraz (`minDays` + korekta `COUNTRY_DELTA`), a jako górną granicę datę bazową powiększoną o większą z wartości: (liczba dni dolnej granicy + 1) oraz (`maxDays` + korekta `COUNTRY_DELTA`).
4. IF dolna granica wyznaczonego przedziału dat wypada przed chwilą obecną, THEN THE Estymator_Dostawy SHALL ustawić dolną granicę przedziału na chwilę obecną.
5. IF Estymator_Dostawy nie rozpozna żadnego Kamienia_Milowego, w tym gdy lista Zdarzeń_Śledzenia jest pusta lub nie została przekazana, THEN THE Estymator_Dostawy SHALL zwrócić etykietę braku danych w aktywnym języku interfejsu, pusty przedział dat, brak klucza Kamienia_Milowego, znacznik dostarczenia o wartości fałsz oraz poziom pewności `low`.
6. IF kod kraju docelowego jest pusty, krótszy niż 2 znaki lub — po usunięciu spacji i zamianie na wielkie litery — nie występuje w tabeli `COUNTRY_DELTA`, THEN THE Estymator_Dostawy SHALL zastosować korektę 0 dni, odpowiadającą kalibracji dla Polski (`PL`), i zwrócić ten znormalizowany kod kraju wraz z wynikiem szacowania.
7. IF korekta `COUNTRY_DELTA` dla kraju docelowego jest większa niż 4 dni oraz ustalony poziom pewności wynosi `high`, THEN THE Estymator_Dostawy SHALL zwrócić poziom pewności `medium`, pozostawiając poziomy `medium` i `low` bez zmian.
8. WHEN UI_Śledzenia otrzyma z Estymator_Dostawy korektę `COUNTRY_DELTA` różną od 0 dni, THE UI_Śledzenia SHALL wyświetlić adnotację zawierającą znak korekty, liczbę dni korekty, nazwę jednostki dni w aktywnym języku interfejsu oraz dwuliterowy kod kraju docelowego.
9. WHEN UI_Śledzenia renderuje kartę szacowanej dostawy, THE UI_Śledzenia SHALL wyświetlić etykietę Kamienia_Milowego, wskaźnik poziomu pewności odpowiadający dokładnie jednej z trzech wartości `high`, `medium`, `low` opisanej w aktywnym języku interfejsu, oraz przedział dat, jeżeli Estymator_Dostawy zwrócił przedział niepusty.
10. THE Estymator_Dostawy SHALL formatować obie granice przedziału dat jako dzień miesiąca oraz skróconą nazwę miesiąca w ustawieniach regionalnych odpowiadających aktywnemu językowi interfejsu, a dla języka nieobsługiwanego — w ustawieniach regionalnych języka polskiego.
11. IF górna granica wyznaczonego przedziału dat wypada przed chwilą obecną, THEN THE Estymator_Dostawy SHALL ustawić górną granicę przedziału na chwilę obecną powiększoną o 2 dni.
12. WHEN Estymator_Dostawy rozpozna Kamień_Milowy inny niż `delivered`, THE Estymator_Dostawy SHALL ustalić poziom pewności jako `high` dla kluczy `out_for_delivery`, `at_delivery_depot`, `arrived_destination` i `in_germany`, jako `medium` dla kluczy `customs_cleared`, `flight_arrived` i `handed_to_courier`, a jako `low` dla pozostałych kluczy Kamieni_Milowych.
13. IF korekta `COUNTRY_DELTA` zwrócona przez Estymator_Dostawy wynosi 0 dni, THEN THE UI_Śledzenia SHALL nie wyświetlać adnotacji o korekcie kraju docelowego.

### Requirement 6: Obsługa błędów i stanów pustych

**User Story:** Jako klient chcę otrzymać zrozumiały komunikat, gdy śledzenie nie zadziała, aby wiedzieć, czy błąd jest po mojej stronie, czy po stronie systemu.

#### Acceptance Criteria

1. IF Funkcja_Śledzenia otrzyma żądanie, w którym Kod_Śledzenia jest nieobecny, pusty, złożony wyłącznie ze znaków białych albo dłuższy niż 50 znaków, THEN THE Funkcja_Śledzenia SHALL zwrócić kod statusu HTTP 400 z polem `success` o wartości `false` i komunikatem w języku polskim oraz zaniechać wysłania zapytania do Serwera_Upstream.
2. IF Serwer_Upstream nie zwróci żadnego Zdarzenia_Śledzenia dla podanego Kodu_Śledzenia, THEN THE Funkcja_Śledzenia SHALL zwrócić w czasie nie dłuższym niż 10000 milisekund od przyjęcia żądania, co obejmuje limit 8000 milisekund na odpowiedź Serwera_Upstream, kod statusu HTTP 404 wraz z polem `success` o wartości `false` i komunikatem w języku polskim informującym o braku informacji o przesyłce.
3. IF podczas obsługi żądania w Funkcji_Śledzenia wystąpi nieobsłużony błąd, THEN THE Funkcja_Śledzenia SHALL zwrócić kod statusu HTTP 500 z ciałem zawierającym dokładnie dwa pola — `success` o wartości `false` oraz `message` z komunikatem w języku polskim informującym o błędzie serwera — bez pól `Informacje_główne`, `Szczegóły_przesyłki` i `Źródło`.
4. WHEN Funkcja_Śledzenia zwraca kod statusu HTTP 400, 404, 429 lub 500, THE Funkcja_Śledzenia SHALL umieścić w ciele odpowiedzi wyłącznie pola `success` i `message`, przy czym pole `message` ma długość co najwyżej 200 znaków i zawiera zero wystąpień adresu IP, numeru portu, nazwy hosta i ścieżki Serwera_Upstream oraz zero fragmentów śladu stosu.
5. IF Funkcja_Śledzenia zwróci kod statusu HTTP 404, THEN THE UI_Śledzenia SHALL wyświetlić komunikat o nieznalezieniu przesyłki wraz z wyszukiwanym Kodem_Śledzenia wstawionym jako tekst, bez interpretowania jego znaków jako znaczników HTML.
6. IF Funkcja_Śledzenia zwróci kod statusu HTTP spoza zakresu od 200 do 299, inny niż 404 i inny niż 429, THEN THE UI_Śledzenia SHALL wyświetlić komunikat o błędzie serwera pobrany ze Słownika_Tłumaczeń.
7. IF wywołanie `fetch` do Funkcji_Śledzenia zakończy się odrzuceniem obietnicy, w tym przerwaniem po 10000 milisekundach, albo nie zwróci odpowiedzi w ciągu 15000 milisekund stanowiących zabezpieczenie nadrzędne, THEN THE UI_Śledzenia SHALL wyświetlić komunikat o błędzie połączenia pobrany ze Słownika_Tłumaczeń.
8. WHEN UI_Śledzenia wyświetla komunikat błędu, THE UI_Śledzenia SHALL usunąć z widoku wyniki poprzedniego wyszukiwania oraz utrzymywać dokładnie jeden widoczny komunikat błędu.
9. WHEN użytkownik rozpocznie nowe wyszukiwanie, THE UI_Śledzenia SHALL usunąć wcześniejszy komunikat błędu przed wysłaniem żądania do Funkcji_Śledzenia, tak aby liczba widocznych komunikatów błędu w czasie trwania żądania wynosiła zero.
10. WHEN Funkcja_Śledzenia zwraca kod statusu HTTP 404 lub 500, THE Funkcja_Śledzenia SHALL zapisać w dzienniku serwera jeden wpis zawierający znacznik czasu, znormalizowany Kod_Śledzenia, zwrócony kod statusu HTTP oraz przyczynę niepowodzenia, bez treści odpowiedzi Serwera_Upstream.
11. IF treści odpowiedzi Funkcji_Śledzenia nie da się zinterpretować jako dokument JSON, THEN THE UI_Śledzenia SHALL wyświetlić komunikat o błędzie serwera pobrany ze Słownika_Tłumaczeń.
12. IF Odpowiedź_Śledzenia zawiera pole `success` o wartości `true`, a pole `Szczegóły_przesyłki` jest nieobecne albo jest listą o długości zero, THEN THE UI_Śledzenia SHALL wyświetlić komunikat o braku informacji o przesyłce oraz zaniechać renderowania osi czasu i grup krajów.
13. WHEN UI_Śledzenia wyświetli komunikat błędu, THE UI_Śledzenia SHALL ukryć wskaźnik ładowania, odblokować przycisk wyszukiwania oraz odblokować pole numeru przesyłki.

### Requirement 7: Pamięć podręczna odpowiedzi

**User Story:** Jako właściciel strony chcę ograniczyć liczbę zapytań do zewnętrznego serwera, aby uniknąć blokady i przyspieszyć powtarzane wyszukiwania.

#### Acceptance Criteria

1. THE Funkcja_Śledzenia SHALL obsługiwać Cache_Śledzenia z włączoną zarówno ścieżką odczytu, jak i ścieżką zapisu, bez obecnego w dostarczonym kodzie zastąpienia odczytu wartością pustą.
2. WHEN Funkcja_Śledzenia otrzyma żądanie dla znormalizowanego Kodu_Śledzenia, dla którego w Cache_Śledzenia istnieje nieprzedawniony wpis, THE Funkcja_Śledzenia SHALL zwrócić zapisaną Odpowiedź_Śledzenia z polem `success` o wartości `true` i kodem statusu HTTP 200, bez wysłania zapytania do Serwera_Upstream, w czasie nie dłuższym niż 100 milisekund od przyjęcia żądania.
3. WHEN Funkcja_Śledzenia otrzyma od Serwera_Upstream dane zawierające co najmniej jedno Zdarzenie_Śledzenia, THE Funkcja_Śledzenia SHALL zapisać zwracaną Odpowiedź_Śledzenia w Cache_Śledzenia pod kluczem wyznaczonym przez Kod_Śledzenia po usunięciu znaków białych z początku i końca oraz zamianie liter na wielkie, tak aby zapytania różniące się wyłącznie wielkością liter i znakami białymi trafiały na ten sam wpis.
4. WHEN od zapisania wpisu w Cache_Śledzenia upłynie czas życia z zakresu 60–86400 sekund określony w Konfiguracji_Środowiska, THE Funkcja_Śledzenia SHALL traktować ten wpis jako nieobecny i wykonać nowe zapytanie do Serwera_Upstream, przy czym wpis przedawniony SHALL zostać usunięty z pamięci nie później niż 600 sekund po upływie czasu życia.
5. IF Konfiguracja_Środowiska nie zawiera czasu życia wpisu Cache_Śledzenia albo zawiera wartość nieliczbową lub wartość poza zakresem 60–86400 sekund, THEN THE Funkcja_Śledzenia SHALL zastosować czas życia równy 3600 sekund.
6. IF obsługa żądania zakończy się kodem statusu HTTP 400, 404 lub 500, THEN THE Funkcja_Śledzenia SHALL nie zapisywać tej odpowiedzi w Cache_Śledzenia, tak aby kolejne żądanie dla tego samego Kodu_Śledzenia trafiło do Serwera_Upstream.
7. THE dokumentacja wdrożenia SHALL opisywać, że Cache_Śledzenia oparty na pamięci procesu obowiązuje w granicach jednej instancji funkcji serverless, oraz wskazywać zewnętrzny magazyn typu Redis jako rozwiązanie dla większego ruchu.
8. IF odczyt lub zapis Cache_Śledzenia zakończy się błędem, THEN THE Funkcja_Śledzenia SHALL potraktować żądanie jak brak wpisu w Cache_Śledzenia i dokończyć obsługę przez zapytanie do Serwera_Upstream, bez zmiany kodu statusu HTTP i treści Odpowiedzi_Śledzenia widocznej dla klienta.
9. WHEN liczba wpisów w Cache_Śledzenia osiągnie 1000 i ma zostać zapisany nowy wpis, THE Funkcja_Śledzenia SHALL usunąć wpis o najstarszym czasie zapisania przed dodaniem nowego.

### Requirement 8: Limitowanie liczby zapytań

**User Story:** Jako właściciel strony chcę ograniczyć liczbę wywołań endpointu na klienta, aby publiczne wystawienie funkcji nie obciążyło zewnętrznego serwera.

#### Acceptance Criteria

1. WHEN Funkcja_Śledzenia przyjmie żądanie, THE Funkcja_Śledzenia SHALL wykonać sprawdzenie Limitera_Zapytań jako pierwszy krok obsługi, przed odczytem Cache_Śledzenia i przed wysłaniem zapytania do Serwera_Upstream, tak aby dla żądania odrzuconego liczba odczytów Cache_Śledzenia oraz liczba zapytań do Serwera_Upstream wynosiła zero.
2. WHEN Limiter_Zapytań przyjmie żądanie, THE Limiter_Zapytań SHALL zliczyć je w koszyku wyznaczonym pierwszym adresem z listy rozdzielonej przecinkami odczytanej z nagłówka adresu klienta, niezależnie od kodu statusu HTTP zwróconego ostatecznie dla tego żądania.
3. IF liczba żądań zliczonych dla jednego adresu IP w bieżącym okresie rozliczeniowym przekroczy limit z Konfiguracji_Środowiska, THEN THE Funkcja_Śledzenia SHALL zwrócić kod statusu HTTP 429 z polem `success` o wartości `false` i komunikatem w języku polskim oraz z nagłówkiem `Retry-After` o wartości równej liczbie pełnych sekund pozostałych do końca okresu rozliczeniowego, zaokrąglonej w górę i nie mniejszej niż 1.
4. THE Funkcja_Śledzenia SHALL odczytywać z Konfiguracji_Środowiska limit żądań z zakresu od 1 do 1000 żądań oraz długość okresu rozliczeniowego z zakresu od 1 do 3600 sekund.
5. IF Funkcja_Śledzenia zwróci kod statusu HTTP 429, THEN THE UI_Śledzenia SHALL wyświetlić komunikat o przekroczeniu limitu zapytań pobrany ze Słownika_Tłumaczeń wraz z liczbą sekund odczytaną z nagłówka `Retry-After`, przyjmując 60 sekund, gdy nagłówek jest nieobecny albo jego wartość nie jest liczbą całkowitą większą od zera.
6. WHEN Limiter_Zapytań odrzuci żądanie, THE Funkcja_Śledzenia SHALL zaniechać wysłania zapytania do Serwera_Upstream.
7. IF Konfiguracja_Środowiska nie zawiera limitu żądań albo długości okresu rozliczeniowego, albo zawiera dla nich wartość nieliczbową lub wartość poza dopuszczonym zakresem, THEN THE Funkcja_Śledzenia SHALL zastosować limit 10 żądań na 60 sekund dla jednego adresu IP oraz zapisać w dzienniku serwera wpis o użyciu wartości domyślnej.
8. WHEN Limiter_Zapytań zliczy pierwsze żądanie z danego adresu IP, THE Limiter_Zapytań SHALL otworzyć dla tego adresu okres rozliczeniowy o stałej długości odczytanej z Konfiguracji_Środowiska, liczonej od chwili przyjęcia tego żądania, oraz wyzerować licznik tego adresu po upływie tego okresu.
9. IF adres IP klienta jest nieobecny w nagłówkach żądania albo nie daje się zinterpretować jako adres IP, THEN THE Limiter_Zapytań SHALL zliczyć żądanie we wspólnym koszyku zastępczym objętym tym samym limitem i tą samą długością okresu rozliczeniowego.
10. WHEN Limiter_Zapytań odrzuci żądanie z powodu przekroczenia limitu, THE Limiter_Zapytań SHALL pozostawić licznik żądań tego adresu IP bez zmian oraz zachować niezmienioną chwilę zakończenia bieżącego okresu rozliczeniowego.

### Requirement 9: Bezpieczeństwo transportu i konfiguracja

**User Story:** Jako właściciel strony chcę, aby adres zewnętrznego serwera był konfigurowalny, a ruch z przeglądarki szyfrowany, aby zmiana adresu IP nie wymagała zmiany kodu i aby przeglądarka nie blokowała treści mieszanych.

#### Acceptance Criteria

1. WHEN Funkcja_Śledzenia rozpoczyna obsługę żądania, THE Funkcja_Śledzenia SHALL odczytać adres Serwera_Upstream wyłącznie z Konfiguracji_Środowiska, przy zerowej liczbie wystąpień tego adresu zapisanych na stałe w kodzie źródłowym Funkcji_Śledzenia.
2. IF zmienna środowiskowa z adresem Serwera_Upstream jest nieustawiona albo ma wartość pustą, THEN THE Funkcja_Śledzenia SHALL zaniechać wysłania zapytania do Serwera_Upstream, zwrócić kod statusu HTTP 500 z polem `success` o wartości `false` i komunikatem w języku polskim informującym o błędzie konfiguracji oraz zapisać w dzienniku serwera wpis o brakującej konfiguracji.
3. THE Funkcja_Śledzenia SHALL być dostępna wyłącznie pod adresem o schemacie `https`, przy zerowej liczbie działających adresów wywołania o schemacie `http`.
4. THE Strona_Statyczna SHALL wywoływać Funkcję_Śledzenia wyłącznie pod adresem o schemacie `https`, tak aby liczba ostrzeżeń przeglądarki o treściach mieszanych zgłoszonych w konsoli podczas wyszukiwania przesyłki wynosiła zero.
5. THE Funkcja_Śledzenia SHALL pozostać jedynym elementem systemu komunikującym się z Serwerem_Upstream po protokole HTTP.
6. THE dokumentacja wdrożenia SHALL podawać dla każdej zmiennej Konfiguracji_Środowiska — adresu Serwera_Upstream, limitu żądań, długości okresu rozliczeniowego Limitera_Zapytań, czasu życia Cache_Śledzenia oraz listy dopuszczonych domen źródłowych — jej nazwę, przeznaczenie, wartość domyślną oraz oznaczenie „wymagana” albo „opcjonalna”.
7. IF nagłówek `Origin` żądania, porównywany jako schemat, nazwa hosta bez rozróżniania wielkości liter oraz numer portu, nie odpowiada żadnej pozycji listy dopuszczonych domen z Konfiguracji_Środowiska, THEN THE Funkcja_Śledzenia SHALL zwrócić kod statusu HTTP 403 z polem `success` o wartości `false`, pominąć w odpowiedzi nagłówek `Access-Control-Allow-Origin` oraz zaniechać wysłania zapytania do Serwera_Upstream.
8. IF nagłówek `Origin` jest nieobecny albo nie daje się rozłożyć na schemat, nazwę hosta i numer portu, albo lista dopuszczonych domen jest nieustawiona, pusta lub zawiera więcej niż 10 pozycji, THEN THE Funkcja_Śledzenia SHALL zwrócić kod statusu HTTP 403 oraz zaniechać wysłania zapytania do Serwera_Upstream.
9. THE dokumentacja wdrożenia SHALL opisywać nieszyfrowany charakter połączenia z Serwerem_Upstream oraz procedurę zmiany jego adresu IP obejmującą aktualizację zmiennej środowiskowej w ustawieniach projektu Platformy_Wdrożenia i ponowne wdrożenie Funkcji_Śledzenia.
10. IF adres Serwera_Upstream z Konfiguracji_Środowiska jest ustawiony, lecz jego schemat jest inny niż `http` i inny niż `https`, albo brakuje w nim nazwy hosta, albo jego długość przekracza 2048 znaków, THEN THE Funkcja_Śledzenia SHALL potraktować konfigurację jako brakującą i postąpić zgodnie z kryterium 2 tego wymagania.
11. WHEN operator zmieni wartość zmiennej środowiskowej z adresem Serwera_Upstream w ustawieniach projektu Platformy_Wdrożenia i ponownie wdroży Funkcję_Śledzenia, THE Funkcja_Śledzenia SHALL kierować kolejne zapytania na nowy adres przy zerowej liczbie zmienionych znaków w kodzie źródłowym.
12. THE Strona_Statyczna SHALL zawierać zero wystąpień adresu Serwera_Upstream w plikach `index.html`, `script.js` i `style.css` oraz generować zero żądań przeglądarki kierowanych do Serwera_Upstream.

### Requirement 10: Wielojęzyczność interfejsu

**User Story:** Jako użytkownik przełączający język strony chcę, aby widok śledzenia zmieniał język razem z resztą witryny, aby interfejs pozostał spójny.

#### Acceptance Criteria

1. THE UI_Śledzenia SHALL pobierać wszystkie teksty interfejsu wyłącznie ze Słownika_Tłumaczeń Strony_Statycznej, bez korzystania z własnego słownika modułu.
2. THE Słownik_Tłumaczeń SHALL zawierać komplet 17 kluczy śledzenia: tytuł, podtytuł, tekst zastępczy pola, informacje główne, numer referencyjny, numer śledzenia, kraj, datę, odbiorcę, status, historię, lokalizację, tekst przycisku zwijania listy, tekst przycisku rozwijania listy, komunikat błędu serwera, komunikat braku przesyłki oraz komunikat błędu ogólnego.
3. THE Słownik_Tłumaczeń SHALL zawierać dla każdego z 17 kluczy śledzenia dokładnie dwie wersje językowe — polską (`pl`) i angielską (`en`) — każdą jako niepusty tekst o długości od 1 do 80 znaków, bez wersji dla kodów `de`, `es` i `cn`.
4. WHEN użytkownik zmieni język Strony_Statycznej, THE UI_Śledzenia SHALL przerysować wszystkie widoczne teksty interfejsu w wybranym języku w czasie nieprzekraczającym 1 sekundy, bez ponownego wczytania strony.
5. WHEN użytkownik zmieni język Strony_Statycznej przy wyświetlonym wyniku wyszukiwania, THE UI_Śledzenia SHALL przerysować statusy, lokalizacje, etykiety Estymatora_Dostawy, zakresy dat oraz opisy poziomu pewności w wybranym języku w czasie nieprzekraczającym 1 sekundy, bez ponownego wywołania Funkcji_Śledzenia i bez utraty aktualnie wyświetlanych danych przesyłki.
6. IF Słownik_Tłumaczeń nie zawiera odwzorowania dla żądanego klucza w wybranym języku, THEN THE UI_Śledzenia SHALL wyświetlić wartość tego klucza w języku polskim.
7. THE UI_Śledzenia SHALL pomijać odczyt klucza `tracking_lang` z `localStorage` oraz wykrywanie języka na podstawie ustawień przeglądarki, przyjmując aktywny język Strony_Statycznej jako jedyne źródło języka, a przy braku ustawionego języka — język polski.
8. IF aktywnym językiem Strony_Statycznej jest kod inny niż `pl` lub `en`, THEN THE UI_Śledzenia SHALL wyświetlić wszystkie teksty interfejsu, statusy, lokalizacje i etykiety Estymatora_Dostawy w języku polskim.
9. THE UI_Śledzenia SHALL udostępniać opisy trzech poziomów pewności Estymatora_Dostawy (wysoki, średni, niski) dokładnie w dwóch wariantach językowych — polskim dla `pl` i angielskim dla `en` — bez użycia wariantów niemieckiego i hiszpańskiego.
10. IF żądany klucz nie występuje ani w wersji wybranego języka, ani w wersji polskiej, THEN THE UI_Śledzenia SHALL wyświetlić nazwę tego klucza jako tekst zastępczy i kontynuować renderowanie pozostałych elementów widoku bez przerwania.

### Requirement 11: Responsywność i zaznaczanie tekstu

**User Story:** Jako klient korzystający z telefonu chcę czytać i kopiować dane przesyłki na małym ekranie, aby wkleić numer śledzenia do wiadomości.

#### Acceptance Criteria

1. WHILE szerokość okna przeglądarki mieści się w zakresie od 320 do 768 pikseli włącznie, THE UI_Śledzenia SHALL wyświetlać oś czasu przesyłki w jednej kolumnie, co SHALL zostać potwierdzone przy szerokościach 320, 375 i 768 pikseli.
2. WHILE szerokość okna przeglądarki mieści się w zakresie od 320 do 1440 pikseli włącznie, THE UI_Śledzenia SHALL renderować pola informacji głównych tak, że szerokość ich treści nie przekracza szerokości okna, a dokument nie uzyskuje poziomego paska przewijania, co SHALL zostać potwierdzone przy szerokościach 320, 375, 768, 1024 i 1440 pikseli.
3. WHILE szerokość okna przeglądarki przekracza 768 pikseli, THE UI_Śledzenia SHALL wyświetlać wszystkie pola informacji głównych w stanie rozwiniętym, przy zerowej liczbie przycisków przełączających widoczność tych pól.
4. WHERE Strona_Statyczna stosuje globalną regułę `user-select` o wartości innej niż `text`, THE UI_Śledzenia SHALL ustawić właściwość `user-select` na wartość `text` dla kontenera Widoku_Śledzenia, tak aby użytkownik mógł zaznaczyć wyświetlony numer śledzenia oraz treść Zdarzeń_Śledzenia.
5. WHEN użytkownik użyje przycisku kopiowania obok numeru referencyjnego lub numeru śledzenia, THE UI_Śledzenia SHALL zapisać w schowku systemowym dokładnie wyświetlaną wartość tego pola, bez etykiety pola oraz bez znaków białych z początku i końca.
6. WHEN UI_Śledzenia zapisze wartość w schowku systemowym, THE UI_Śledzenia SHALL wyświetlić potwierdzenie kopiowania wyłącznie przy przycisku użytym jako ostatni.
7. WHEN od wyświetlenia potwierdzenia kopiowania upłynie 2000 milisekund, THE UI_Śledzenia SHALL usunąć to potwierdzenie z widoku i przywrócić przycisk kopiowania do stanu początkowego.
8. IF zapis do schowka systemowego zakończy się odrzuceniem obietnicy albo interfejs schowka przeglądarki jest niedostępny, THEN THE UI_Śledzenia SHALL zachować niezmienioną widoczną wartość pola, pominąć wyświetlenie potwierdzenia kopiowania oraz wyświetlić komunikat pobrany ze Słownika_Tłumaczeń.
9. THE style UI_Śledzenia SHALL zostać przeniesione do `style.css` z jednym wspólnym przedrostkiem nazw klas, przy zerowej liczbie kolizji z nazwami klas obecnymi w `style.css` i `index.html` przed integracją.
10. THE style UI_Śledzenia SHALL stosować progi zmiany układu 1024 i 768 pikseli używane przez Stronę_Statyczną w miejsce progów 768, 640 i 480 pikseli z `styles/Tracking.module.css`.

### Requirement 12: Wyłączenie mapy 3D z zakresu

**User Story:** Jako właściciel strony chcę pominąć mapę 3D, aby nie dodawać dwóch ciężkich zależności do statycznej witryny.

#### Acceptance Criteria

1. THE UI_Śledzenia SHALL zawierać zero odwołań do komponentu mapy 3D z `components/TrackingGlobe.jsx` oraz generować zero żądań sieciowych po zasoby mapy 3D, w tym tekstury globu, dane geograficzne i biblioteki renderowania.
2. THE Strona_Statyczna SHALL zawierać zero deklaracji i zero wywołań zależności `react-globe.gl` w wersji `^2.37.1` oraz `three` w wersji `^0.184.0`, oraz SHALL działać bez kroku budowania wymaganego przez te dwie zależności.
3. THE UI_Śledzenia SHALL wyświetlać zero elementów interfejsu otwierających mapę 3D oraz zero etykiet wersji testowej w każdym z trzech stanów widoku: podczas ładowania, po udanym wyszukaniu przesyłki oraz po wystąpieniu błędu.
4. THE dokumentacja wdrożenia SHALL wskazywać mapę 3D jako rozszerzenie możliwe do dodania w przyszłości wraz z listą dwóch wymaganych zależności `react-globe.gl` w wersji `^2.37.1` i `three` w wersji `^0.184.0` oraz informacją o koniecznym kroku budowania.
5. THE UI_Śledzenia SHALL wyświetlać kartę szacowanej daty dostawy w głównym widoku wyników, niezależnie od pominięcia mapy 3D, w której panelu karta ta była renderowana w dostarczonym module.
6. THE style UI_Śledzenia SHALL zawierać zero reguł CSS odnoszących się do mapy 3D oraz SHALL zachować w miejscu dawnego elementu otwierającego mapę odstęp równy standardowemu odstępowi między sekcjami widoku wyników.
7. THE UI_Śledzenia SHALL działać przy zerowej liczbie kluczy `open3DMap` i `beta` w wersjach `pl` i `en` Słownika_Tłumaczeń.
