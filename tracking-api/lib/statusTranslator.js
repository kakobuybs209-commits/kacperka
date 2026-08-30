'use strict';

// ─── Tabela tłumaczeń statusów ────────────────────────────────────────────────
const statusTranslations = {
    'The shipment has been successfully delivered': 'Przesyłka została pomyślnie dostarczona',
    'The shipment has been successfully delivereddelivered': 'Przesyłka została pomyślnie dostarczona',
    'The shipment has been loaded onto the delivery vehicle': 'Przesyłka została załadowana na pojazd dostawczy',
    'The shipment has been loaded onto the delivery vehiclepickup': 'Przesyłka została załadowana na pojazd dostawczy',
    'The shipment is being prepared for delivery in the delivery depot': 'Przesyłka jest przygotowywana do doręczenia w magazynie dostaw',
    'The shipment is being prepared for delivery in the delivery depotpickup': 'Przesyłka jest przygotowywana do doręczenia w magazynie dostaw',
    'The shipment has been processed in the parcel center': 'Przesyłka została przetworzona w centrum dystrybucyjnym',
    'The shipment has been processed in the parcel centertransit': 'Przesyłka została przetworzona w centrum dystrybucyjnym',
    'The shipment has arrived in the destination country/destination area': 'Przesyłka dotarła do kraju docelowego',
    'The shipment arrived in the region of recipient and will be transported to the delivery base in the next step': 'Przesyłka dotarła do regionu odbiorcy i zostanie przetransportowana do bazy dostaw w następnym kroku',
    'The shipment arrived in the region of recipient and will be transported to the delivery base in the next step.transit': 'Przesyłka dotarła do regionu odbiorcy i zostanie przetransportowana do bazy dostaw w następnym kroku',
    'The international shipment has been processed in the export parcel center': 'Przesyłka międzynarodowa została przetworzona w centrum eksportu',
    'The international shipment has been processed in the export parcel centertransit': 'Przesyłka międzynarodowa została przetworzona w centrum eksportu',
    'The international shipment has been processed in the parcel center of origin': 'Przesyłka międzynarodowa została przetworzona w centrum nadania',
    'The international shipment has been processed in the parcel center of origintransit': 'Przesyłka międzynarodowa została przetworzona w centrum nadania',
    'The shipment has been processed in the destination parcel center': 'Przesyłka została przetworzona w docelowym centrum obsługi paczek',
    'Loaded to movement / tour vehicle': 'Załadowany do pojazdu transportowego',
    'Movement / tour vehicle arrived': 'Przybył pojazd transportowy',
    'Unloaded from movement / tour vehicle': 'Rozładunek z pojazdu transportowego',
    'Pick-up was successful.': 'Odbiór przebiegł pomyślnie',
    'Shipment information received': 'Otrzymane informacje o przesyłce',
    'Delivered successfully': 'Dostarczone pomyślnie',
    'Your parcel has been delivered successfully': 'Twoja paczka została pomyślnie dostarczona',
    'Your parcel is out for delivery': 'Twoja paczka jest w drodze do dostawy',
    'Out for delivery': 'W drodze do dostawy',
    'At parcel delivery centre': 'W centrum dostaw',
    'In transit': 'W tranzycie',
    'Your parcel is on its way': 'Twoja paczka jest w drodze',
    'Your parcel is ready to leave our hub': 'Twoja paczka jest gotowa do opuszczenia naszego centrum',
    'Your parcel is ready to be transported to our next premises': 'Twoja paczka jest gotowa do transportu do następnego centrum',
    'Your parcel arrived at our depot': 'Twoja paczka dotarła do naszego magazynu',
    'Your parcel delivery date has changed': 'Data dostawy Twojej paczki została zmieniona',
    'Your parcel is estimated to be delivered on': 'Przewidywana dostawa Twojej paczki',
    'The parcel has left the parcel delivery centre and is on its way to the consignee': 'Paczka opuściła centrum dostaw i jest w drodze do odbiorcy',
    'The parcel is at the parcel dispatch centre': 'Paczka znajduje się w centrum dystrybucyjnym',
    'Odprawa celna zakończona pending scanning': 'Odprawa celna zakończona, oczekuje na skanowanie',
    'Customs clearance completed pending scanning': 'Odprawa celna zakończona, oczekuje na skanowanie',
    'Customs clearance completed, waiting for extraction of Customs clearance pending scanning': 'Odprawa celna zakończona, oczekuje na skanowanie',
    'Item have been cleared': 'Przedmiot został odprawiony',
    'Item start customs clearance': 'Rozpoczęto odprawę celną przedmiotu',
    'Item arrived at destination': 'Przedmiot dotarł do celu',
    'Item departed from origin': 'Przedmiot opuścił miejsce nadania',
    'Item outbound in sorting center': 'Przedmiot wyszedł z centrum sortowniczego',
    'The goods have been shipped out': 'Towary zostały wysłane',
    'Goods have been received': 'Towary zostały odebrane',
    'Hand over service provider': 'Przekazano dostawcy usług',
    'Leaving the warehouse and shipping to the logistics provider': 'Opuszczenie magazynu i wysyłka do dostawcy logistycznego',
    'Packaging completed': 'Pakowanie zakończone',
    'Forecasted': 'Prognozowane',
    'Leave the scan': 'Skanowanie wyjścia',
    'Receiving Scan': 'Skanowanie odbioru',
    'Export customs clearance completed': 'Eksportowa odprawa celna zakończona',
    'Dismantling the board': 'Demontaż z pokładu',
    'The flight has arrived': 'Lot dotarł',
    'Flight has arrived': 'Lot dotarł',
    '已交仓，等待扫描提取': 'Dostarczone do magazynu, oczekuje na skanowanie i odbiór',
    '清关完成，等待交仓': 'Odprawa celna zakończona, przesyłka oczekuje na przekazanie do magazynu',
    '清关中': 'Przesyłka w trakcie odprawy celnej',
    '已落地，待清关': 'Przesyłka wylądowała, oczekuje na odprawę celną',
    '过港中，航班待定': 'Przesyłka w tranzycie, lot do potwierdzenia',
    'The instruction data for this shipment have been provided by the sender to DHL electronically': 'Dane przesyłki zostały przesłane elektronicznie przez nadawcę do DHL',
    'The instruction data for this shipment have been provided by the sender to DHL electronicallytransit': 'Dane przesyłki zostały przesłane elektronicznie przez nadawcę do DHL',
    'The goods leave the operation center': 'Przesyłka opuściła centrum operacyjne',
    'Arrived at the operating center': 'Przesyłka dotarła do centrum operacyjnego',
    '货物电子信息已经收到': 'Otrzymano elektroniczne informacje o przesyłce',
    '清关完成,等待提取Customs clearance completed pending scanning': 'Odprawa celna zakończona, oczekuje na skanowanie i odbiór',
    '航班已抵达Flight has arrived': 'Lot dotarł',
    '航班已起飞Flight has departed': 'Lot odleciał',
    '航班已起飞': 'Lot odleciał',
    '交货服务商': 'Dostawca usług dostawy',
    '清关完成': 'Odprawa celna zakończona',
    '航班排航中': 'Loty są w trakcie planowania',
    '货物移交航司': 'Przekazanie ładunku przewoźnikowi',
    '货物已出货': 'Wysłane towary',
    '航班已抵达': 'Lot dotarł',
    '货物已收货': 'Otrzymane towary',
    'Flight has departed': 'Lot odleciał',
    'Expected flight on July 9st': 'Przewidywany lot 9 lipca',
    '到达【AMS】': 'Przyjazd do [AMS]',
    '出发【上海】': 'Wylot [Szanghaj]',
    '出口清关完毕': 'Zakończono odprawę celną eksportową',
    '包裹到达始发地海关【上海】，等待清关': 'Przesyłka dociera do urzędu celnego w miejscu nadania [Szanghaj] i oczekuje na odprawę celną',
    '快件到达机场': 'Ekspres przyjeżdża na lotnisko',
    '包裹发出仓库': 'Przesyłka została wysłana z magazynu',
    '货物离开操作中心': 'Towar opuszcza centrum operacyjne',
    '到达操作中心': 'Dotarłem do centrum operacyjnego',
    '已收到发货信息': 'Otrzymano informację o wysyłce',
    '目的国清关完成': 'Odprawa celna w miejscu przeznaczenia zakończona',
    '预计7-9号航班起飞': 'Przewidywany lot 9 lipca'
};

/**
 * Oczyszcza tekst statusu zgodnie z potokiem wymaganym przez wymagania 3.3.
 *
 * Kolejność kroków:
 *   1. Usuń jeden przyrostek `transit` lub `pickup` z końca (pierwszy pasujący)
 *   2. Usuń pierwszy fragment od `(Homepage` do najbliższego `)`
 *   3. Zredukuj każdą sekwencję znaków białych do jednego odstępu
 *   4. trim()
 *
 * @param {string} text
 * @returns {string}
 */
function cleanRecord(text) {
    // Krok 1: Usuń jeden przyrostek transit lub pickup z końca (pierwsza pasująca reguła)
    let cleaned = text.replace(/transit$/, match => { return ''; });
    if (cleaned === text) {
        // transit nie zostało usunięte — spróbuj pickup
        cleaned = text.replace(/pickup$/, '');
    }

    // Krok 2: Usuń pierwszy fragment od `(Homepage` do najbliższego `)`
    cleaned = cleaned.replace(/\(Homepage[^)]*\)/, '');

    // Krok 3: Zredukuj sekwencje znaków białych do jednego odstępu
    cleaned = cleaned.replace(/\s{2,}/g, ' ');

    // Krok 4: trim()
    cleaned = cleaned.trim();

    return cleaned;
}

/**
 * Tłumacz_Statusów — tłumaczy status przesyłki na język polski.
 *
 * Potok oczyszczania jest wykonywany przed wyszukiwaniem w tabeli.
 * Kolejność wyszukiwania: dopasowanie dokładne, potem po podłańcuchu.
 * Brak dopasowania zwraca oczyszczony tekst wejściowy.
 * Przedrostek `签收` jest zachowany bez separatora.
 * Wejście puste/białe/undefined zwraca pusty łańcuch.
 *
 * @param {string|undefined} record
 * @returns {string}
 */
function translateStatus(record) {
    // Wymaganie 3.5: puste/białe/undefined → pusty łańcuch
    if (record === null || record === undefined) return '';
    if (typeof record !== 'string') return '';
    if (record.trim() === '') return '';

    // Potok oczyszczania (wymaganie 3.3)
    let cleaned = cleanRecord(record);

    // Wymaganie 3.4: zachowaj przedrostek 签收
    let prefix = '';
    if (cleaned.startsWith('签收')) {
        prefix = '签收';
        cleaned = cleaned.slice('签收'.length).trim();
    }

    // Wymaganie 3.1: dopasowanie dokładne
    if (Object.prototype.hasOwnProperty.call(statusTranslations, cleaned)) {
        return prefix + statusTranslations[cleaned];
    }

    // Wymaganie 3.1 (fallback): dopasowanie po podłańcuchu —
    // sprawdź, czy któryś klucz z tabeli jest zawarty w oczyszczonym tekście
    const keys = Object.keys(statusTranslations);
    for (let i = 0; i < keys.length; i++) {
        if (cleaned.includes(keys[i])) {
            return prefix + statusTranslations[keys[i]];
        }
    }

    // Wymaganie 3.2: brak dopasowania → oczyszczony tekst
    return prefix + cleaned;
}

module.exports = { translateStatus };
