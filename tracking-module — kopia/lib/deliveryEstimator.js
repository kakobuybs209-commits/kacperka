/**
 * deliveryEstimator.js
 *
 * Statistical model for CN→destination delivery time estimation.
 * Calibrated on 14 real CN→PL shipments (Rudnik nad Sanem / Stalowa Wola area,
 * Podkarpacie, Apr 2025 – May 2026).
 *
 * Country adjustment (COUNTRY_DELTA) adds extra days on top of the PL baseline
 * to account for different last-mile distances from the EU hub (NL/DE).
 *
 * Median transit times (days from milestone → delivered PL, baseline):
 *  packaging/leaving warehouse: 11–19 days (median 14)
 *  arrived at sorting center:   10–17 days (median 13)
 *  export customs cleared:       8–14 days (median 12)
 *  flight departed:              6–10 days (median  8)
 *  flight arrived (NL/AMS):      4–8  days (median  6)
 *  customs clearance NL:         3–6  days (median  4)
 *  arrived in Germany:           2–4  days (median  3)
 *  arrived in Poland:            1–3  days (median  2)
 *  out for delivery:             0–1  days (median  0)
 */

// ─── Country adjustment table (days added to PL baseline) ───────────────────
// Positive = slower (farther from EU hub or extra customs)
// Negative = faster (package arrives at the hub country itself)
const COUNTRY_DELTA = {
  // ── EU / Schengen, close to DE/NL hub ──
  NL:  -3,  // Netherlands — IS the hub, very fast
  BE:  -2,  // Belgium — next to NL hub
  DE:  -1,  // Germany — last-mile from DE hub
  AT:   1,  // Austria (Vienna) — DE → AT, 1 extra day
  CZ:   0,  // Czech Republic — similar to PL
  SK:   0,  // Slovakia
  HU:   1,  // Hungary
  PL:   0,  // Poland — baseline (calibrated)
  // ── Western Europe ──
  FR:   2,  // France
  LU:   1,  // Luxembourg
  CH:   2,  // Switzerland (non-EU customs)
  LI:   2,  // Liechtenstein
  // ── Iberian Peninsula ──
  ES:   3,  // Spain
  PT:   4,  // Portugal
  // ── Italy / Mediterranean ──
  IT:   2,  // Italy
  SI:   1,  // Slovenia
  HR:   2,  // Croatia
  // ── Northern Europe ──
  DK:   2,  // Denmark
  SE:   3,  // Sweden
  NO:   4,  // Norway (non-EU customs)
  FI:   4,  // Finland
  IS:   6,  // Iceland
  // ── Eastern Europe ──
  RO:   2,  // Romania
  BG:   3,  // Bulgaria
  GR:   3,  // Greece
  RS:   5,  // Serbia (non-EU customs)
  BA:   5,  // Bosnia
  MK:   5,  // North Macedonia
  AL:   6,  // Albania
  ME:   5,  // Montenegro
  // ── Baltic states ──
  EE:   3,  // Estonia
  LV:   3,  // Latvia
  LT:   2,  // Lithuania
  // ── UK (post-Brexit customs) ──
  GB:   5,
  UK:   5,
  // ── Turkey ──
  TR:   6,  // Turkey — separate customs process
  // ── Middle East ──
  AE:   7,  // UAE
  SA:   8,  // Saudi Arabia
  IL:   7,  // Israel
  // ── USA / Canada ──
  US:  10,
  CA:  12,
  // ── Asia-Pacific ──
  AU:  14,
  NZ:  16,
  JP:   8,
  KR:   7,
  SG:   8,
  // ── Other ──
  RU:   9,  // Russia
  UA:   7,  // Ukraine (war-related delays)
};

// ─── Milestone definitions ───────────────────────────────────────────────────
// Ordered latest → earliest — we match the most recent milestone first.
const MILESTONES = [
  {
    key: 'delivered',
    patterns: [
      'delivered successfully', 'successfully delivered', 'delivery successful', 'dostarczono', 'dostarczona',
      'delivered.', 'zugestellt', 'doręczono', 'pomyślnie dostarczona',
    ],
    minDays: 0, maxDays: 0,
    labelPl: 'DOSTARCZONO',
    labelEn: 'DELIVERED',
    labelDe: 'ZUGESTELLT',
    labelEs: 'ENTREGADO',
  },
  {
    key: 'out_for_delivery',
    patterns: [
      'out for delivery', 'being delivered', 'loaded to movement',
      'loaded onto the delivery vehicle', 'on its way to the consignee',
    ],
    minDays: 0, maxDays: 1,
    labelPl: 'W DOSTAWIE',
    labelEn: 'OUT FOR DELIVERY',
    labelDe: 'IN ZUSTELLUNG',
    labelEs: 'EN CAMINO',
  },
  {
    key: 'at_delivery_depot',
    patterns: [
      'at parcel delivery centre', 'parcel delivery centre',
      'being prepared for delivery in the delivery depot',
      'shipment processed at delivery depot',
      'parcel center',
    ],
    minDays: 1, maxDays: 2,
    labelPl: 'W CENTRUM DOSTAWY',
    labelEn: 'AT DELIVERY DEPOT',
    labelDe: 'IM ZUSTELLZENTRUM',
    labelEs: 'EN CENTRO ENTREGA',
  },
  {
    key: 'arrived_destination',
    patterns: [
      'arrived in the destination country',
      'destination country/destination area',
      'ruda slaska', 'strykow', 'stalowa wola', 'dobra', 'poznan',
      '(pl)', 'poland, the shipment',
    ],
    minDays: 1, maxDays: 3,
    labelPl: 'W KRAJU DOCELOWYM',
    labelEn: 'IN DESTINATION COUNTRY',
    labelDe: 'IM ZIELLAND',
    labelEs: 'EN PAÍS DESTINO',
  },
  {
    key: 'in_germany',
    patterns: [
      'germany, germany', 'germany, the international', 'germany, the shipment',
      'frankfurt', 'hamburg', 'duisburg', 'mörsdorf',
      'parcel center of origin', 'export parcel center',
    ],
    minDays: 2, maxDays: 4,
    labelPl: 'W NIEMCZECH',
    labelEn: 'IN GERMANY',
    labelDe: 'IN DEUTSCHLAND',
    labelEs: 'EN ALEMANIA',
  },
  {
    key: 'handed_to_courier',
    patterns: [
      'in transit to dhl', 'shipment is in transit to dhl', 'transit to dhl',
      'hand over service provider', 'handed to dhl', 'pick-up was successful',
    ],
    minDays: 2, maxDays: 5,
    labelPl: 'PRZEKAZANO DO KURIERA',
    labelEn: 'HANDED TO COURIER',
    labelDe: 'AN KURIER ÜBERGEBEN',
    labelEs: 'ENTREGADO A MENSAJERÍA',
  },
  {
    key: 'customs_cleared',
    patterns: [
      'customs clearance completed', 'item have been cleared',
      'cleared customs', 'customs clearance pending scanning',
    ],
    minDays: 3, maxDays: 6,
    labelPl: 'ODPRAWA CELNA ZAKOŃCZONA',
    labelEn: 'CUSTOMS CLEARED',
    labelDe: 'ZOLL ABGEFERTIGT',
    labelEs: 'ADUANAS DESPACHADO',
  },
  {
    key: 'flight_arrived',
    patterns: [
      'flight has arrived', 'the flight has arrived',
      'item arrived at destination', 'dismantling the board',
      'item start customs clearance',
    ],
    minDays: 4, maxDays: 8,
    labelPl: 'LOT PRZYLECIAŁ (NL/AMS)',
    labelEn: 'FLIGHT ARRIVED (NL/AMS)',
    labelDe: 'FLUG ANGEKOMMEN (NL/AMS)',
    labelEs: 'VUELO ATERRIZÓ (NL/AMS)',
  },
  {
    key: 'flight_departed',
    patterns: [
      'flight has departed', 'item departed from origin', 'flight departed',
    ],
    minDays: 6, maxDays: 10,
    labelPl: 'LOT WYLECIAŁ',
    labelEn: 'FLIGHT DEPARTED',
    labelDe: 'FLUG ABGEFLOGEN',
    labelEs: 'VUELO SALIÓ',
  },
  {
    key: 'export_customs',
    patterns: [
      'export customs clearance completed', 'the goods leave the operation center',
      'item outbound in sorting center', 'leave the scan', 'outbound',
    ],
    minDays: 8, maxDays: 14,
    labelPl: 'ODPRAWA EKSPORTOWA CN',
    labelEn: 'EXPORT CUSTOMS CN',
    labelDe: 'EXPORTZOLL CN',
    labelEs: 'ADUANA EXPORTACIÓN CN',
  },
  {
    key: 'arrived_sorting',
    patterns: [
      'arrived at the operating center', 'goods have been received',
      'shipment information received', 'arrived at operating center',
    ],
    minDays: 10, maxDays: 17,
    labelPl: 'CENTRUM SORTOWANIA CN',
    labelEn: 'SORTING CENTER CN',
    labelDe: 'SORTIERCENTER CN',
    labelEs: 'CENTRO CLASIFICACIÓN CN',
  },
  {
    key: 'packaging',
    patterns: [
      'leaving the warehouse', 'packaging completed',
      'leaving warehouse', 'leaving the warehouse and shipping',
    ],
    minDays: 11, maxDays: 19,
    labelPl: 'NADANA W CHINACH',
    labelEn: 'SHIPPED FROM CHINA',
    labelDe: 'IN CHINA AUFGEGEBEN',
    labelEs: 'ENVIADO DESDE CHINA',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectMilestone(events) {
  if (!events || events.length === 0) return null;
  for (const event of events) {
    const combined = (event.Status || '').toLowerCase() + ' ' + (event.Lokalizacja || '').toLowerCase();
    for (const milestone of MILESTONES) {
      for (const pattern of milestone.patterns) {
        if (combined.includes(pattern)) {
          return { milestone, milestoneDate: parseDate(event.Data) };
        }
      }
    }
  }
  return null;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr.trim());
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(date, language) {
  if (!date) return '?';
  const locales = { pl: 'pl-PL', de: 'de-DE', en: 'en-GB', es: 'es-ES' };
  const locale = locales[language] || 'pl-PL';
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function capitalize(str) {
  if (!str) return 'Pl';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Tries to detect the destination country code from the tracking data.
 * Looks at the last events' location strings for country codes like (PL), (DE) etc.
 */
export function detectDestinationCountry(events) {
  if (!events || events.length === 0) return null;
  // Look at last few events (latest = most recent destination)
  for (const event of events) {
    const combined = (event.Status || '') + ' ' + (event.Lokalizacja || '');
    const codeMatch = combined.match(/\b([A-Z]{2})\b/);
    if (codeMatch) {
      const code = codeMatch[1];
      if (COUNTRY_DELTA[code] !== undefined) return code;
    }
  }
  return null;
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Estimates delivery date range based on tracking events.
 *
 * @param {Array}  events           - Tracking event array (newest first).
 * @param {string} language         - 'pl' | 'en' | 'de' | 'es'
 * @param {string} destinationCountry - ISO 3166-1 alpha-2 code (e.g. 'AT', 'TR', 'US').
 *                                    Defaults to 'PL' (baseline calibration).
 * @returns {{ label, dateRange, milestoneKey, confidence, isDelivered, countryDelta, destinationCountry }}
 */
export function estimateDelivery(events, language = 'pl', destinationCountry = 'PL') {
  const countryCode = (destinationCountry || 'PL').toUpperCase();
  const delta = COUNTRY_DELTA[countryCode] ?? 0; // unknown country → treat as PL

  const result = detectMilestone(events);

  if (!result) {
    return {
      label: { pl: 'BRAK DANYCH', en: 'NO DATA', de: 'KEINE DATEN', es: 'SIN DATOS' }[language] || 'BRAK DANYCH',
      dateRange: null,
      milestoneKey: null,
      confidence: 'low',
      isDelivered: false,
      countryDelta: delta,
      destinationCountry: countryCode,
    };
  }

  const { milestone, milestoneDate } = result;

  if (milestone.key === 'delivered') {
    return {
      label: milestone[`label${capitalize(language)}`] || milestone.labelPl,
      dateRange: null,
      milestoneKey: milestone.key,
      confidence: 'high',
      isDelivered: true,
      countryDelta: 0,
      destinationCountry: countryCode,
    };
  }

  const now = new Date();
  const baseDate = milestoneDate || now;

  // Apply country delta to the range
  const minDays = Math.max(0, milestone.minDays + delta);
  const maxDays = Math.max(minDays + 1, milestone.maxDays + delta);

  const earliest = addDays(baseDate, minDays);
  const latest   = addDays(baseDate, maxDays);

  // If estimated window is already in the past, anchor to now
  const adjustedEarliest = earliest < now ? now : earliest;
  const adjustedLatest   = latest   < now ? addDays(now, 2) : latest;

  const dateRange = `${formatDate(adjustedEarliest, language)} – ${formatDate(adjustedLatest, language)}`;

  const confidence =
    ['out_for_delivery', 'at_delivery_depot', 'arrived_destination', 'in_germany'].includes(milestone.key)
      ? 'high'
      : ['customs_cleared', 'flight_arrived', 'handed_to_courier'].includes(milestone.key)
        ? 'medium'
        : 'low';

  // For non-EU / non-standard routes, cap confidence at medium
  const finalConfidence = (delta > 4 && confidence === 'high') ? 'medium' : confidence;

  return {
    label: milestone[`label${capitalize(language)}`] || milestone.labelPl,
    dateRange,
    milestoneKey: milestone.key,
    confidence: finalConfidence,
    isDelivered: false,
    countryDelta: delta,
    destinationCountry: countryCode,
  };
}

/**
 * Returns a human-readable note about destination country adjustment.
 * e.g. "+2 dni (Wiedeń, Austria)" or "−1 dzień (Niemcy)"
 */
export function getCountryDeltaNote(countryCode, delta, language) {
  if (delta === 0 || !delta) return null;
  const sign  = delta > 0 ? '+' : '';
  const unit  = { pl: 'dni', en: 'days', de: 'Tage', es: 'días' }[language] || 'dni';
  const label = { pl: 'kraj docelowy', en: 'destination', de: 'Zielland', es: 'destino' }[language] || 'kraj';
  return `${sign}${delta} ${unit} (${label}: ${countryCode})`;
}
