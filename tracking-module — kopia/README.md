# Tracking Module — paczka do przeniesienia

Samodzielny modul sledzenia przesylek (Next.js App Router). Nie zalezy od reszty
kodu repfinder — ma wlasne tlumaczenia, wlasne style i wlasny endpoint API.

Sprawdzone: `next build` przechodzi po wrzuceniu tego folderu do czystej aplikacji Next.

## Zawartosc

```
tracking-module/
  app/
    tracking/page.js               -> strona /tracking
    api/tracking/[code]/route.js   -> backend: scraping + tlumaczenia + ETA
  components/
    Tracking.jsx                   -> cale UI, grupowanie po krajach
    TrackingGlobe.jsx              -> mapa 3D (opcjonalna)
  lib/
    i18n.js                        -> tlumaczenia UI (pl/en/de/es/cn)
    trackingTranslations.js        -> tlumaczenia statusow i lokalizacji
    deliveryEstimator.js           -> model szacowanej daty dostawy
  styles/
    Tracking.module.css
  dependencies.json
```

Wszystkie importy wewnatrz modulu sa relatywne, wiec alias `@/` nie jest wymagany.

## Instalacja

1. Skopiuj folder `tracking-module/` do docelowego projektu (np. do `src/`).

2. Doinstaluj zaleznosci (lista w `dependencies.json`):

```
npm i cheerio node-cache @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/react-fontawesome react-globe.gl three
```

`react-globe.gl` i `three` sa potrzebne tylko dla mapy 3D. Jesli jej nie chcesz,
usun import `TrackingGlobe` z `components/Tracking.jsx` i pomin te dwie paczki.

3. Podepnij route'y do App Routera. Dwie opcje:

**Opcja A — przenies pliki do `app/`:**

```
src/app/tracking/page.js              (z tracking-module/app/tracking/page.js)
src/app/api/tracking/[code]/route.js  (z tracking-module/app/api/tracking/[code]/route.js)
```

Po przeniesieniu popraw sciezki importu w `page.js` na wlasciwa glebokosc,
np. `import Tracking from '../../tracking-module/components/Tracking';`

**Opcja B — cienkie re-eksporty** (modul zostaje w jednym miejscu):

```js
// src/app/tracking/page.js
export { default, metadata } from '../../tracking-module/app/tracking/page';
```

```js
// src/app/api/tracking/[code]/route.js
export { GET } from '../../../../tracking-module/app/api/tracking/[code]/route';
```

## Wazne: zaznaczanie tekstu

Modul ustawia `user-select: text` na `.trackingPage`. Jesli docelowa strona ma
globalny `user-select: none` na `body` (repfinder mial), dodaj wyjatek w globals.css:

```css
.trackingPage {
  user-select: text;
  -webkit-user-select: text;
}
```

## Jezyk

Domyslnie modul sam wykrywa jezyk: `localStorage['tracking_lang']` -> jezyk
przegladarki -> `en`.

Zeby uzyc i18n z docelowej aplikacji, owin strone providerem:

```jsx
import { TrackingLanguageProvider } from '../tracking-module/lib/i18n';
import Tracking from '../tracking-module/components/Tracking';

<TrackingLanguageProvider language={language} t={t}>
  <Tracking />
</TrackingLanguageProvider>
```

Wtedy `t('tracking.*')` leci do Twojego tlumacza. Klucze, ktore musisz miec:
`title, subtitle, placeholder, mainInfo, reference, trackingNumber, country,
date, recipient, status, history, location, showLess, showMore, errorServer,
errorNotFound, errorGeneral, open3DMap, origin, destination, beta`.

## Jak to dziala

`GET /api/tracking/{kod}` robi POST na zewnetrzny serwer trackingowy,
parsuje HTML (cheerio), tlumaczy statusy i lokalizacje, sortuje malejaco po
dacie i zwraca `Informacje_glowne` + `Szczegoly_przesylki`. Frontend grupuje
zdarzenia po kraju i rysuje timeline.

Wykrywanie kraju (`getCountryInfo` w `Tracking.jsx`) jest kolejnoscia regul,
bo API zwraca niespojne lokalizacje. Skrot:

1. Lokalizacja to sama nazwa `Holandia` -> CHINY (API tak taguje odprawe eksportowa w CN)
2. Konkretne miasto (Szanghaj, Poznan, Bremen, Vijfhuizen) -> jego kraj
3. Statusy z prefiksem `Poland,` / `Germany,` -> odpowiedni kraj
4. Odprawa eksportowa / lot odlecial -> CHINY; odprawa z `pending scanning` / lot dotarl -> HOLANDIA
5. `Odbior przebiegl pomyslnie` oraz `Zaladowany do pojazdu` bez polskiego miasta -> NIEMCY
6. Fallback -> CHINY

Sasiednie grupy o tym samym kraju sa scalane, wiec pojedyncze bledne zdarzenie
nie rozbija chronologii. Docelowa kolejnosc: CHINY -> HOLANDIA -> NIEMCY -> POLSKA.

## Rzeczy do sprawdzenia przed produkcja

- **Endpoint jest po HTTP i na goly IP** (`apiUrls` w `route.js`). Ruch nie jest
  szyfrowany, a IP moze sie zmienic. Warto trzymac go w zmiennej srodowiskowej
  i rozwazyc proxy po HTTPS.
- **Endpoint API nie ma zadnej autoryzacji ani rate limitingu.** Kazdy moze go
  wolac dowolna liczbe razy, a kazde wywolanie generuje zapytanie do zewnetrznego
  serwera. Dodaj rate limiting przed wystawieniem publicznie.
- **Cache jest wylaczony** — w `route.js` jest `const cachedData = null;` z
  komentarzem `TEMPORARILY DISABLED`. Wlacz `cache.get(cacheKey)`, zeby
  odciazyc zewnetrzny serwer (TTL jest juz ustawiony na 1h).
- `node-cache` trzyma dane w pamieci procesu, wiec na serverless (Vercel) cache
  jest per-instancja. Przy wiekszym ruchu lepszy bedzie Redis.
- Reguly wykrywania krajow sa dopasowane do trasy CN -> NL -> DE -> PL. Inne
  trasy moga wymagac dopisania regul.
- `deliveryEstimator.js` jest skalibrowany na dostawach do Polski
  (`COUNTRY_DELTA`), inne kraje maja szacunkowe korekty.
