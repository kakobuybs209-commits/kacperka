// Tracking translations — handles Chinese/English/Polish/German/Spanish/Chinese UI

// ─── Chinese → English mapping ───────────────────────────────────────────────
// Keys MUST match the English keys used in trackingTranslations below so that
// the pipeline Chinese→EN→TargetLang works correctly.
const CHINESE_TO_EN = {
  // Cities & regions
  '深圳': 'Shenzhen',
  '广州': 'Guangzhou',
  '上海': 'Shanghai',
  '北京': 'Beijing',
  '香港': 'Hong Kong',
  '杭州': 'Hangzhou',
  '义乌': 'Yiwu',
  '宁波': 'Ningbo',
  '成都': 'Chengdu',
  '武汉': 'Wuhan',
  '天津': 'Tianjin',
  '西安': 'Xian',
  '重庆': 'Chongqing',
  // Hubs & company terms
  '总公司': 'General Office',
  '分公司': 'Branch Office',
  '集散中心': 'Distribution Center',
  '转运中心': 'Transit Center',
  '操作中心': 'Operations Center',
  // Statuses — keys match trackingTranslations English keys exactly
  '已签收': 'Delivered',
  '签收': 'Delivered',
  '已揽收': 'Pick-up was successful.',
  '揽收': 'Pick-up was successful.',
  '派送中': 'Out for delivery',
  '派送': 'Out for delivery',
  '运输中': 'Item in transit',
  '在途中': 'Item in transit',
  '航班已起飞': 'Flight has departed',
  '航班已抵达': 'Flight has arrived',
  '清关完成': 'Customs clearance completed',
  '出口清关完成': 'Export customs clearance completed',
  '等待提取': 'Pending pickup',
  '离开扫描': 'Departure scan',
  '收货扫描': 'Receiving scan',
  '已预报': 'Pre-advised',
  '拆板中': 'Dismantling the board',
  '装机': 'Loaded on aircraft',
  // Misc words (translate then strip)
  '预计': 'Est.',
  '号航班': ' flight',
  '到达': 'Arrived',
  '出发': 'Departed',
  '离开': 'Departed',
};

// ─── CJK regex ────────────────────────────────────────────────────────────────
const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/g;

const cleanSpaces = (s) => s.replace(/\s{2,}/g, ' ').trim();

// Strip CJK only — keeps any native language text already in the string
const stripChineseOnly = (text) => {
  if (!text) return text;
  return cleanSpaces(text.replace(CJK_REGEX, ''));
};

// Translate Chinese → English, then strip remaining CJK
const stripChineseToEn = (text) => {
  if (!text) return text;
  let result = text;
  Object.entries(CHINESE_TO_EN).forEach(([zh, en]) => {
    result = result.split(zh).join(en);
  });
  return cleanSpaces(result.replace(CJK_REGEX, ''));
};

// Smart normalize for non-English languages:
// - If the text has meaningful native content after stripping CJK → keep it (Type B: "航班已起飞Lot odleciał")
// - If it's CJK-only → translate to English so the dict pipeline can convert it (Type A: "收货扫描")
const normalize = (text) => {
  const stripped = stripChineseOnly(text);
  // Meaningful = has at least 2 non-numeric, non-punctuation characters
  const meaningful = stripped.replace(/[\d\s\-\/:.,()\[\]]/g, '').length >= 2;
  return meaningful ? stripped : stripChineseToEn(text);
};

// ─── Status translations ──────────────────────────────────────────────────────
export const trackingTranslations = {
  pl: {
    // Standard carrier messages
    'The shipment has been successfully delivered': 'Twoja przesyłka została pomyślnie dostarczona',
    'Your parcel has been delivered successfully.': 'Twoja przesyłka została pomyślnie dostarczona',
    'Delivered': 'Dostarczono',
    'The shipment has been loaded onto the delivery vehicle': 'Przesyłka została załadowana na pojazd dostawczy',
    'The shipment is being prepared for delivery in the delivery depot': 'Przesyłka jest przygotowywana do doręczenia w magazynie dostaw',
    'The shipment has been processed in the parcel center': 'Przesyłka została przetworzona w centrum dystrybucyjnym',
    'The shipment has arrived in the destination country/destination area': 'Przesyłka dotarła do kraju docelowego',
    'The international shipment has been processed in the export parcel center': 'Przesyłka międzynarodowa została przetworzona w centrum eksportu',
    'The international shipment has been processed in the parcel center of origin': 'Przesyłka międzynarodowa została przetworzona w centrum nadania',
    'Pick-up was successful.': 'Odbiór przebiegł pomyślnie',
    'Shipment information received': 'Otrzymano informacje o przesyłce',
    'Electronic information received': 'Otrzymano informacje o przesyłce',
    'Flight has arrived': 'Lot przyleciał',
    'Flight has departed': 'Lot odleciał',
    'Customs clearance completed': 'Odprawa celna zakończona',
    'Customs clearance in progress': 'Trwa odprawa celna',
    'Export customs clearance completed': 'Odprawa celna eksportowa zakończona',
    'Item in transit': 'Przesyłka w transporcie',
    'In transit': 'W tranzycie',
    'Out for delivery': 'Przekazano do doręczenia',
    'At parcel delivery centre.': 'Przesyłka w centrum doręczeń',
    'The parcel has left the parcel delivery centre and is on its way to the consignee.': 'Przesyłka opuściła centrum doręczeń i jest w drodze do odbiorcy',
    'The parcel is at the parcel dispatch centre.': 'Przesyłka w centrum wysyłkowym',
    'Dismantling the board': 'Demontaż tablicy',
    'Arrived at destination airport': 'Przesyłka dotarła na lotnisko docelowe',
    'Pre-advised': 'Otrzymano dane elektroniczne',
    // Chinese-origin phrases (translated via CHINESE_TO_EN first)
    'Departure scan': 'Skan wyjazdu',
    'Receiving scan': 'Skan odbioru',
    'Pending pickup': 'Oczekuje na odbiór',
    'Loaded on aircraft': 'Załadowano na samolot',
    'General Office': 'Centrala',
    'Branch Office': 'Oddział',
    'Distribution Center': 'Centrum dystrybucji',
    'Transit Center': 'Centrum tranzytowe',
    'Operations Center': 'Centrum operacyjne',
    // English-only API phrases
    'The goods leave the operation center': 'Towar opuścił centrum operacyjne',
    'Arrived at the operating center': 'Przesyłka dotarła do centrum operacyjnego',
    'The goods have arrived at the operation center': 'Towar dotarł do centrum operacyjnego',
    'Departed': 'Wyjechało',
    'Arrived': 'Przybyło',
  },
  de: {
    'The shipment has been successfully delivered': 'Ihre Sendung wurde erfolgreich zugestellt',
    'Your parcel has been delivered successfully.': 'Ihre Sendung wurde erfolgreich zugestellt',
    'Delivered': 'Zugestellt',
    'The shipment has been loaded onto the delivery vehicle': 'Die Sendung wurde in das Zustellfahrzeug geladen',
    'The shipment is being prepared for delivery in the delivery depot': 'Die Sendung wird im Zustelldepot zur Auslieferung vorbereitet',
    'The shipment has been processed in the parcel center': 'Die Sendung wurde im Paketzentrum bearbeitet',
    'The shipment has arrived in the destination country/destination area': 'Die Sendung ist im Zielland angekommen',
    'The international shipment has been processed in the export parcel center': 'Die internationale Sendung wurde im Export-Paketzentrum bearbeitet',
    'The international shipment has been processed in the parcel center of origin': 'Die internationale Sendung wurde im Herkunfts-Paketzentrum bearbeitet',
    'Pick-up was successful.': 'Abholung war erfolgreich',
    'Shipment information received': 'Sendungsinformationen empfangen',
    'Flight has arrived': 'Flug ist angekommen',
    'Flight has departed': 'Flug ist gestartet',
    'Customs clearance completed': 'Zollabfertigung abgeschlossen',
    'Customs clearance in progress': 'Zollabfertigung läuft',
    'Export customs clearance completed': 'Exportzollabfertigung abgeschlossen',
    'Item in transit': 'Sendung in Transit',
    'In transit': 'In Transit',
    'Out for delivery': 'In der Zustellung',
    'At parcel delivery centre.': 'Im Paket-Zustellzentrum',
    'The parcel has left the parcel delivery centre and is on its way to the consignee.': 'Das Paket hat das Zustellzentrum verlassen',
    'The parcel is at the parcel dispatch centre.': 'Das Paket befindet sich im Versandzentrum',
    'Dismantling the board': 'Demontage des Boards',
    'In transit': 'In Transit',
    'Arrived at destination airport': 'Am Zielflughafen angekommen',
    'Pre-advised': 'Vorangemeldet',
    'Departure scan': 'Ausgangsscan',
    'Receiving scan': 'Eingangsscan',
    'The goods leave the operation center': 'Ware hat das Betriebszentrum verlassen',
    'Arrived at the operating center': 'Am Betriebszentrum angekommen',
  },
  es: {
    'The shipment has been successfully delivered': 'Su envío ha sido entregado con éxito',
    'Your parcel has been delivered successfully.': 'Su envío ha sido entregado con éxito',
    'Delivered': 'Entregado',
    'The shipment has been loaded onto the delivery vehicle': 'El envío ha sido cargado en el vehículo de entrega',
    'The shipment is being prepared for delivery in the delivery depot': 'El envío se está preparando para su entrega',
    'The shipment has been processed in the parcel center': 'El envío ha sido procesado en el centro de paquetería',
    'The shipment has arrived in the destination country/destination area': 'El envío ha llegado al país de destino',
    'Pick-up was successful.': 'La recogida fue exitosa',
    'Shipment information received': 'Información de envío recibida',
    'Flight has arrived': 'El vuelo ha llegado',
    'Flight has departed': 'El vuelo ha despegado',
    'Customs clearance completed': 'Despacho de aduana completado',
    'Customs clearance in progress': 'Despacho de aduana en curso',
    'Export customs clearance completed': 'Despacho de aduana de exportación completado',
    'Item in transit': 'Envío en tránsito',
    'In transit': 'En tránsito',
    'Out for delivery': 'En reparto',
    'Departure scan': 'Escaneo de salida',
    'Receiving scan': 'Escaneo de recepción',
    'The goods leave the operation center': 'La mercancía sale del centro operativo',
    'Arrived at the operating center': 'Llegó al centro operativo',
  },
  zh: {
    'The shipment has been successfully delivered': '您的包裹已成功送达',
    'Your parcel has been delivered successfully.': '您的包裹已成功送达',
    'Flight has arrived': '航班已抵达',
    'Flight has departed': '航班已起飞',
    'Customs clearance completed': '清关完成',
    'Export customs clearance completed': '出口清关完成',
    'In transit': '在途中',
    'Out for delivery': '派送中',
  },
};

// ─── Location translations ────────────────────────────────────────────────────
export const locationTranslations = {
  pl: {
    'Shenzhen': 'Shenzhen',
    'Guangzhou': 'Kanton (Guangzhou)',
    'Hong Kong': 'Hongkong',
    'Shanghai': 'Szanghaj',
    'Beijing': 'Pekin',
    'General Office': 'Centrala',
    'Branch Office': 'Oddział',
  },
  de: {
    'Polska': 'Polen',
    'Holandia': 'Niederlande',
    'Niemcy': 'Deutschland',
    'Chiny': 'China',
    'General Office': 'Zentrale',
  },
};

// ─── translateStatus ──────────────────────────────────────────────────────────
export const translateStatus = (status, lang) => {
  if (!status) return '';

  // English: Chinese → EN, done
  if (lang === 'en') return stripChineseToEn(status);

  const dict = trackingTranslations[lang];

  // Normalise: keep native text if present, otherwise translate Chinese → EN
  const text = dict ? normalize(status) : stripChineseOnly(status);

  if (!dict) return text;

  // Exact match
  if (dict[text]) return dict[text];

  // Fuzzy/partial match — replace English phrases with target language
  let translated = text;
  Object.entries(dict).forEach(([en, local]) => {
    if (text.includes(en)) {
      translated = translated.replace(en, local);
    }
  });

  return translated;
};

// ─── translateLocation ────────────────────────────────────────────────────────
export const translateLocation = (location, lang) => {
  if (!location) return '';

  if (lang === 'en') return stripChineseToEn(location);

  // Normalise location string
  const dict = locationTranslations[lang];
  const text = normalize(location);

  if (!dict) return text;

  let translated = text;
  Object.entries(dict).forEach(([en, local]) => {
    translated = translated.replace(new RegExp(en, 'g'), local);
  });

  return translated;
};
