'use client';

/**
 * Standalone i18n for the tracking module.
 *
 * The tracking UI originally pulled `t()` and `language` from the host app's
 * LanguageContext. To keep this module drop-in portable, it ships its own
 * translations and exposes the same API shape: `useLanguage() -> { t, language }`.
 *
 * Two ways to use it:
 *
 * 1. Standalone (default) — nothing to do. Language is read from
 *    localStorage['tracking_lang'], falling back to browser locale, then 'en'.
 *
 * 2. Wired into an existing app — wrap the tracking page in
 *    <TrackingLanguageProvider language={yourLang} t={yourT}> and the module
 *    will use the host app's language and translator instead.
 */

import { createContext, useContext, useEffect, useState } from 'react';

const SUPPORTED = ['pl', 'en', 'de', 'es', 'cn'];
const STORAGE_KEY = 'tracking_lang';

export const TRACKING_TRANSLATIONS = {
  pl: {
    title: 'Śledzenie Przesyłki',
    subtitle: 'Wprowadź kod śledzenia, aby sprawdzić status swojej paczki',
    placeholder: 'Wprowadź kod śledzenia...',
    mainInfo: 'Informacje Główne',
    reference: 'Numer referencyjny',
    trackingNumber: 'Numer śledzenia',
    country: 'Kraj',
    date: 'Data',
    recipient: 'Odbiorca',
    status: 'Ostatni status',
    history: 'Historia Przesyłki',
    location: 'Lokalizacja',
    showLess: 'Pokaż mniej',
    showMore: 'Pokaż więcej',
    errorServer: 'Błąd serwera',
    errorNotFound: 'Nie znaleziono informacji o śledzeniu.',
    errorGeneral: 'Nie znaleziono trackingu paczki',
    open3DMap: 'Otwórz mapę 3D',
    origin: '(ORIGIN)',
    destination: '(DOCELOWY)',
    beta: 'BETA',
  },
  en: {
    title: 'Package Tracking',
    subtitle: 'Enter tracking code to check your package status',
    placeholder: 'Enter tracking code...',
    mainInfo: 'Main Information',
    reference: 'Reference number',
    trackingNumber: 'Tracking number',
    country: 'Country',
    date: 'Date',
    recipient: 'Recipient',
    status: 'Last status',
    history: 'Shipment History',
    location: 'Location',
    showLess: 'Show less',
    showMore: 'Show more',
    errorServer: 'Server error',
    errorNotFound: 'No tracking information found.',
    errorGeneral: 'Package tracking not found',
    open3DMap: 'Open 3D map',
    origin: '(ORIGIN)',
    destination: '(DESTINATION)',
    beta: 'BETA',
  },
  de: {
    title: 'Sendungsverfolgung',
    subtitle: 'Geben Sie den Sendungscode ein, um den Status Ihres Pakets zu prüfen',
    placeholder: 'Sendungscode eingeben...',
    mainInfo: 'Hauptinformationen',
    reference: 'Referenznummer',
    trackingNumber: 'Sendungsnummer',
    country: 'Land',
    date: 'Datum',
    recipient: 'Empfänger',
    status: 'Letzter Status',
    history: 'Sendungsverlauf',
    location: 'Standort',
    showLess: 'Weniger anzeigen',
    showMore: 'Mehr anzeigen',
    errorServer: 'Serverfehler',
    errorNotFound: 'Keine Sendungsinformationen gefunden.',
    errorGeneral: 'Sendungsverfolgung nicht gefunden',
    open3DMap: '3D-Karte öffnen',
    origin: '(URSPRUNG)',
    destination: '(ZIEL)',
    beta: 'BETA',
  },
  es: {
    title: 'Seguimiento de paquetes',
    subtitle: 'Introduzca el código de seguimiento para comprobar el estado de su paquete',
    placeholder: 'Introduzca el código de seguimiento...',
    mainInfo: 'Información principal',
    reference: 'Número de referencia',
    trackingNumber: 'Número de seguimiento',
    country: 'País',
    date: 'Fecha',
    recipient: 'Destinatario',
    status: 'Último estado',
    history: 'Historial del envío',
    location: 'Ubicación',
    showLess: 'Mostrar menos',
    showMore: 'Mostrar más',
    errorServer: 'Error del servidor',
    errorNotFound: 'No se encontró información de seguimiento.',
    errorGeneral: 'No se encontró el seguimiento del paquete',
    open3DMap: 'Abrir mapa 3D',
    origin: '(ORIGEN)',
    destination: '(DESTINO)',
    beta: 'BETA',
  },
  cn: {
    title: '包裹追踪',
    subtitle: '输入追踪码以查询包裹状态',
    placeholder: '输入追踪码...',
    mainInfo: '主要信息',
    reference: '参考编号',
    trackingNumber: '追踪号',
    country: '国家',
    date: '日期',
    recipient: '收件人',
    status: '最新状态',
    history: '运输历史',
    location: '位置',
    showLess: '收起',
    showMore: '展开',
    errorServer: '服务器错误',
    errorNotFound: '未找到追踪信息。',
    errorGeneral: '未找到包裹追踪',
    open3DMap: '打开 3D 地图',
    origin: '(起点)',
    destination: '(目的地)',
    beta: 'BETA',
  },
};

function detectBrowserLanguage() {
  if (typeof navigator === 'undefined') return 'en';
  const candidates = navigator.languages || [navigator.language || 'en'];
  for (const entry of candidates) {
    const code = entry.toLowerCase().split('-')[0];
    const mapped = code === 'zh' ? 'cn' : code;
    if (SUPPORTED.includes(mapped)) return mapped;
  }
  return 'en';
}

const TrackingLanguageContext = createContext(null);

/**
 * Optional provider. Pass `language` and `t` to delegate to the host app's i18n.
 * Omit both to let the module manage language on its own.
 */
export function TrackingLanguageProvider({ children, language, t }) {
  return (
    <TrackingLanguageContext.Provider value={{ language, t }}>
      {children}
    </TrackingLanguageContext.Provider>
  );
}

export function useLanguage() {
  const host = useContext(TrackingLanguageContext);
  const [language, setLanguage] = useState('en'); // SSR-safe default

  useEffect(() => {
    if (host?.language) return; // host controls the language
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    setLanguage(saved && SUPPORTED.includes(saved) ? saved : detectBrowserLanguage());
  }, [host?.language]);

  const activeLanguage = host?.language || language;

  const t = (keyPath) => {
    if (host?.t) return host.t(keyPath);
    // Only the `tracking.*` namespace is bundled here.
    const key = keyPath.startsWith('tracking.') ? keyPath.slice('tracking.'.length) : keyPath;
    const dict = TRACKING_TRANSLATIONS[activeLanguage] || TRACKING_TRANSLATIONS.en;
    return dict[key] ?? TRACKING_TRANSLATIONS.en[key] ?? keyPath;
  };

  return { language: activeLanguage, t };
}
