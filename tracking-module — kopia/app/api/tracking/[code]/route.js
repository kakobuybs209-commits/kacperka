import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import NodeCache from 'node-cache';

// Cache configuration (TTL: 1 hour)
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Lista serwerów TrackIndex (tylko nowy serwer)
const apiUrls = [
    'http://111.231.71.230:8082/trackIndex.htm'
];

// ─── Funkcja tłumaczenia statusów ─────────────────────────────────────────────
function translateStatus(record, date = '') {
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
        'Dismantling the board': 'Demontaż z pokładu',
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
        '预计7-9号航班起飞': 'Przewidywany lot 9 lipca',
        '货物电子信息已经收到': 'Otrzymano elektroniczne informacje o przesyłce'
    };

    // Czyszczenie statusu
    let cleanRecord = record
        .replace(/transit$/, '')
        .replace(/pickup$/, '')
        .replace(/\(Homepage.*?\)/, '')
        .trim();

    // Zachowaj prefiks 签收 dla statusu dostarczenia
    let prefix = cleanRecord.startsWith('签收') ? '签收' : '';
    cleanRecord = cleanRecord.replace(/^签收/, '').trim();

    // Zwróć przetłumaczony status z prefiksem lub oryginalny jeśli brak tłumaczenia
    return statusTranslations[cleanRecord] ? `${prefix}${statusTranslations[cleanRecord]}` : `${prefix}${cleanRecord}`;
}

// ─── Funkcja obliczania przewidywanego czasu dostawy ──────────────────────────
function calculateEstimatedDelivery(trackingData) {
    if (!trackingData || !trackingData.length) return null;
    
    const latestEvent = trackingData[0]; // Najnowsze zdarzenie (posortowane)
    const latestStatus = latestEvent.Status.toLowerCase();
    const latestLocation = latestEvent.Lokalizacja.toLowerCase();
    const latestDate = new Date(latestEvent.OriginalDate);
    const now = new Date();
    
    console.log(`[DELIVERY CALC] Latest: ${latestStatus} at ${latestLocation} on ${latestEvent.OriginalDate}`);
    
    // Jeśli już dostarczono
    if (latestStatus.includes('dostarczone') || latestStatus.includes('delivered') || 
        latestStatus.includes('successfully delivered') || latestStatus.includes('签收') || 
        latestStatus.includes('pomyślnie dostarczona') || latestStatus.includes('odbiór przebiegł pomyślnie')) {
        return {
            status: 'delivered',
            message: '✅ Przesyłka została już dostarczona',
            estimatedDate: 'Dostarczono'
        };
    }
    
    // Jeśli "out for delivery" lub załadowana na pojazd dostawczy w Polsce
    if ((latestLocation.includes('polska') || latestLocation.includes('poland') || 
         latestLocation.includes('stalowa wola') || latestLocation.includes('warszawa') ||
         latestLocation.includes('poznan') || latestLocation.includes('dobra')) &&
        (latestStatus.includes('out for delivery') || latestStatus.includes('załadowana') || 
         latestStatus.includes('loaded') || latestStatus.includes('pojazd') || 
         latestStatus.includes('vehicle') || latestStatus.includes('delivery vehicle'))) {
        
        const deliveryDate = new Date(latestDate);
        deliveryDate.setHours(deliveryDate.getHours() + 6); // Dostawa w ciągu 6 godzin
        
        // Jeśli to już jutro, ustaw na jutro rano
        if (deliveryDate.getDate() !== latestDate.getDate()) {
            deliveryDate.setDate(latestDate.getDate() + 1);
            deliveryDate.setHours(10, 0, 0, 0); // 10:00 następnego dnia
        }
        
        return {
            status: 'out_for_delivery',
            estimatedDate: deliveryDate.toLocaleDateString('pl-PL', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            message: '🚚 W drodze do dostawy - dzisiaj lub jutro rano!'
        };
    }
    
    // Jeśli w centrum dystrybucyjnym w Polsce (parcel center, delivery depot)
    if ((latestLocation.includes('polska') || latestLocation.includes('poland') || 
         latestLocation.includes('stalowa wola') || latestLocation.includes('dobra') ||
         latestLocation.includes('strykow')) &&
        (latestStatus.includes('parcel center') || latestStatus.includes('delivery depot') || 
         latestStatus.includes('centrum') || latestStatus.includes('prepared for delivery') ||
         latestStatus.includes('parcel delivery centre') || latestStatus.includes('at parcel delivery centre'))) {
        
        const deliveryDate = new Date(latestDate);
        deliveryDate.setDate(deliveryDate.getDate() + 1);
        deliveryDate.setHours(14, 0, 0, 0); // Jutro po południu
        
        return {
            status: 'at_delivery_center',
            estimatedDate: deliveryDate.toLocaleDateString('pl-PL', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            message: '📦 W polskim centrum - dostawa jutro!'
        };
    }
    
    // Jeśli w Polsce ale w tranzycie (ready to be transported, on its way)
    if ((latestLocation.includes('polska') || latestLocation.includes('poland')) &&
        (latestStatus.includes('ready to be transported') || latestStatus.includes('on its way') ||
         latestStatus.includes('in transit') || latestStatus.includes('ready to leave'))) {
        
        const deliveryDate = new Date(latestDate);
        deliveryDate.setDate(deliveryDate.getDate() + 2);
        
        return {
            status: 'poland_transit',
            estimatedDate: deliveryDate.toLocaleDateString('pl-PL', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            message: '�� Przesyłka w Polsce - dostawa za 1-2 dni'
        };
    }
    
    // Jeśli w Holandii (Vijfhuizen, Oirschot, Veenendaal) - hub europejski
    if (latestLocation.includes('holandia') || latestLocation.includes('netherlands') ||
        latestLocation.includes('vijfhuizen') || latestLocation.includes('oirschot') ||
        latestLocation.includes('veenendaal') || latestLocation.includes('amsterdam')) {
        
        const deliveryDate = new Date(latestDate);
        
        // Jeśli już przeszło odprawę celną w Holandii
        if (latestStatus.includes('customs clearance') || latestStatus.includes('cleared') ||
            latestStatus.includes('dispatch centre') || latestStatus.includes('arrived at our depot')) {
            deliveryDate.setDate(deliveryDate.getDate() + 3); // 2-3 dni z Holandii do Polski
        } else {
            deliveryDate.setDate(deliveryDate.getDate() + 5); // 4-5 dni jeśli jeszcze odprawa
        }
        
        return {
            status: 'netherlands_hub',
            estimatedDate: deliveryDate.toLocaleDateString('pl-PL', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            message: '�� W Holandii - dostawa za 3-5 dni'
        };
    }
    
    // Jeśli w Niemczech (Hamburg, Germany)
    if (latestLocation.includes('niemcy') || latestLocation.includes('germany') ||
        latestLocation.includes('hamburg')) {
        
        const deliveryDate = new Date(latestDate);
        deliveryDate.setDate(deliveryDate.getDate() + 4);
        
        return {
            status: 'germany_hub',
            estimatedDate: deliveryDate.toLocaleDateString('pl-PL', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            message: '🇩🇪 W Niemczech - dostawa za 3-4 dni'
        };
    }
    
    // Jeśli lot już wylądował ale jeszcze odprawa celna
    if (latestStatus.includes('flight has arrived') || latestStatus.includes('arrived at destination') ||
        latestStatus.includes('lot dotarł') || latestStatus.includes('货物已落地')) {
        
        const deliveryDate = new Date(latestDate);
        deliveryDate.setDate(deliveryDate.getDate() + 4); // Odprawa + transport = 3-4 dni
        
        return {
            status: 'arrived_customs',
            estimatedDate: deliveryDate.toLocaleDateString('pl-PL', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            message: '✈️ Lot dotarł do Europy - dostawa za 3-4 dni'
        };
    }
    
    // Jeśli lot wystartował z Chin
    if (latestStatus.includes('flight has departed') || latestStatus.includes('departed from origin') ||
        latestStatus.includes('lot odleciał') || latestStatus.includes('货物已起飞')) {
        
        const deliveryDate = new Date(latestDate);
        deliveryDate.setDate(deliveryDate.getDate() + 6); // Lot + odprawa + transport = 5-6 dni
        
        return {
            status: 'flight_en_route',
            estimatedDate: deliveryDate.toLocaleDateString('pl-PL', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            message: '✈️ Lot w drodze z Chin - dostawa za 5-6 dni'
        };
    }
    
    // Jeśli w Chinach - przygotowanie do lotu
    if (latestLocation.includes('chiny') || latestLocation.includes('china') || 
        latestLocation.includes('shanghai') || latestLocation.includes('shenzhen') ||
        latestLocation.includes('beijing') || latestStatus.includes('货物')) {
        
        const deliveryDate = new Date(latestDate);
        
        // Jeśli już opuściło centrum operacyjne
        if (latestStatus.includes('goods leave') || latestStatus.includes('outbound in sorting') ||
            latestStatus.includes('shipped out') || latestStatus.includes('货物已出货')) {
            deliveryDate.setDate(deliveryDate.getDate() + 8); // Czeka na lot = 7-8 dni
        } else if (latestStatus.includes('arrived at operating') || latestStatus.includes('货物已收货')) {
            deliveryDate.setDate(deliveryDate.getDate() + 10); // Jeszcze przetwarzanie = 9-10 dni
        } else {
            deliveryDate.setDate(deliveryDate.getDate() + 12); // Początkowe etapy = 11-12 dni
        }
        
        return {
            status: 'china_processing',
            estimatedDate: deliveryDate.toLocaleDateString('pl-PL', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            message: '🇨🇳 Przetwarzanie w Chinach - dostawa za 8-12 dni'
        };
    }
    
    // Domyślnie - jeśli brak szczegółowych informacji
    const deliveryDate = new Date(latestDate);
    deliveryDate.setDate(deliveryDate.getDate() + 10);
    return {
        status: 'processing',
        estimatedDate: deliveryDate.toLocaleDateString('pl-PL', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }),
        message: '📦 W trakcie przetwarzania - dostawa za 7-10 dni'
    };
}

// ─── Funkcja formatowania lokalizacji ─────────────────────────────────────────
function formatLocation(location) {
    const locationMappings = {
        'PL': 'Polska',
        'CN': 'Chiny', 
        'DE': 'Niemcy',
        'NL': 'Holandia',
        'US': 'USA',
        'GB': 'Wielka Brytania',
        'FR': 'Francja',
        'POLAND': 'Polska',
        'CHINA': 'Chiny',
        'GERMANY': 'Niemcy',
        'NETHERLANDS': 'Holandia',
        'HOLLAND': 'Holandia'
    };
    
    if (!location || location.trim() === '') {
        return 'Brak danych o lokalizacji';
    }
    
    const cleanLocation = location.trim();
    
    // Jeśli zawiera nazwę miasta polskiego
    if (cleanLocation.includes('STALOWA WOLA') || cleanLocation.includes('WARSZAWA') || 
        cleanLocation.includes('KRAKÓW') || cleanLocation.includes('GDAŃSK') ||
        cleanLocation.includes('POZNAŃ') || cleanLocation.includes('WROCŁAW')) {
        const cityMatch = cleanLocation.match(/([A-ZĄĆĘŁŃÓŚŹŻ\s]+)/);
        if (cityMatch) {
            return `${cityMatch[1].trim()}, Polska`;
        }
        return `${cleanLocation}, Polska`;
    }
    
    // Jeśli zawiera Shanghai, Beijing itp.
    if (cleanLocation.includes('SHANGHAI') || cleanLocation.includes('BEIJING') || 
        cleanLocation.includes('GUANGZHOU') || cleanLocation.includes('SHENZHEN')) {
        return `${cleanLocation}, Chiny`;
    }
    
    // Jeśli zawiera Amsterdam, Rotterdam
    if (cleanLocation.includes('AMSTERDAM') || cleanLocation.includes('ROTTERDAM') ||
        cleanLocation.includes('EINDHOVEN')) {
        return `${cleanLocation}, Holandia`;
    }
    
    // Sprawdź kody krajów
    const upperLocation = cleanLocation.toUpperCase();
    if (locationMappings[upperLocation]) {
        return locationMappings[upperLocation];
    }
    
    // Jeśli to format "MIASTO (KOD_KRAJU)"
    const cityCountryMatch = cleanLocation.match(/^(.*?)\s*\(([A-Z]{2})\)$/);
    if (cityCountryMatch) {
        const city = cityCountryMatch[1].trim();
        const countryCode = cityCountryMatch[2];
        const country = locationMappings[countryCode] || countryCode;
        return `${city}, ${country}`;
    }
    
    // Jeśli to samo kod kraju bez nawiasów
    if (cleanLocation.length === 2 && /^[A-Z]{2}$/.test(cleanLocation)) {
        return locationMappings[cleanLocation] || cleanLocation;
    }
    
    // Zwróć oryginalną lokalizację jeśli nie ma mapowania
    return cleanLocation;
}

// ─── Pobieranie z serwera IP (skraper) ────────────────────────────────────────
async function fetchFromApi(apiUrl, trackingCode) {
    try {
        const requestData = new URLSearchParams();
        requestData.append('documentCode', trackingCode);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: requestData,
            signal: AbortSignal.timeout(8000) // Increased from 5000 to 8000ms
        });

        if (!response.ok) return null;

        const responseBody = await response.text();
        const $ = cheerio.load(responseBody, { decodeEntities: false });
        const trackingInfo = [];

        $('table tr:has(td:nth-child(1):not(:empty))').each((index, element) => {
            const date = $(element).find('td:nth-child(1)').text().trim();
            const location = $(element).find('td:nth-child(2)').text().trim();
            const record = $(element).find('td:nth-child(3)').text().trim();

            if (date && record) {
                trackingInfo.push({ 
                    Data: date, 
                    Lokalizacja: formatLocation(location), 
                    Status: translateStatus(record, date),
                    OriginalDate: date,
                    OriginalLocation: location,
                    OriginalStatus: record
                });
            }
        });

        // Sortuj zdarzenia chronologicznie (najnowsze na górze)
        trackingInfo.sort((a, b) => {
            const dateA = new Date(a.OriginalDate);
            const dateB = new Date(b.OriginalDate);
            return dateB - dateA; // Sortowanie malejące (najnowsze pierwsze)
        });

        const mainInfo = {};
        $('.menu_ ul:nth-child(2) li').each((index, element) => {
            const text = $(element).text().trim();
            if (index === 0) mainInfo['Numer referencyjny'] = text;
            if (index === 1) mainInfo['Numer śledzenia'] = text;
            if (index === 2) mainInfo['Kraj'] = text;
            if (index === 3) mainInfo['Data'] = text;
            if (index === 4) mainInfo['Ostatni status'] = translateStatus(text.split('/')[0].trim());
            if (index === 5) {
                // Clean up recipient field - remove status prefixes
                let recipient = text;
                // Remove Chinese delivery confirmation character
                recipient = recipient.replace(/^签收/, '').trim();
                // Remove status text patterns
                recipient = recipient.replace(/Poland,\s*The shipment has been successfully delivered\s*\/?\s*/gi, '').trim();
                recipient = recipient.replace(/Poland\s*$/i, '').trim();
                recipient = recipient.replace(/\s*\/\s*Poland\s*$/i, '').trim();
                mainInfo['Odbiorca'] = recipient || 'Brak danych';
            }
        });

        // Dodaj informację o przewidywanym czasie dostawy
        const deliveryEstimate = calculateEstimatedDelivery(trackingInfo); // Używaj oryginalnych danych
        if (deliveryEstimate) {
            mainInfo['Przewidywana dostawa'] = deliveryEstimate.message;
            mainInfo['Data dostawy'] = deliveryEstimate.estimatedDate || 'Brak danych';
        }

        // Dodaj aktualną lokalizację paczki
        if (trackingInfo.length > 0) {
            mainInfo['Aktualna lokalizacja'] = trackingInfo[0].Lokalizacja || 'Brak danych';
        }

        return trackingInfo.length > 0 ? { 
            mainInfo, 
            trackingInfo: trackingInfo, // Zwróć płaską listę (frontend sam grupuje)
            source_api: 'New Tracking Server' 
        } : null;
    } catch (error) {
        return null;
    }
}

// ─── Szybki wyścig serwerów IP (Promise.any) ─────────────────────────────────
async function fastIpServersRace(trackingCode) {
    // Odpalamy zapytania do wszystkich serwerów IP
    const promises = apiUrls.map(url => 
        fetchFromApi(url, trackingCode).then(result => {
            // Promise.any akceptuje pierwszy RESOLVED promise. 
            // Jeśli wynik to null, rzucamy błąd, aby Promise.any go zignorował
            if (!result) throw new Error('No data');
            return result;
        })
    );

    try {
        // Zwraca dane pierwszego serwera, który odpisze prawidłowymi danymi
        return await Promise.any(promises);
    } catch (e) {
        // Wszystkie serwery zawiodły (lub timeout)
        return null;
    }
}

// ─── Główny Endpoint API ──────────────────────────────────────────────────────
export async function GET(request, { params }) {
    const { code } = await params;
    if (!code) return NextResponse.json({ error: 'Tracking number required' }, { status: 400 });

    try {
        const trimmedCode = code.trim().toUpperCase();
        
        // Inteligentny klucz cache (czyste dane) - DISABLED FOR DEBUG
        const cacheKey = `tracking_raw_${trimmedCode}`;
        const cachedData = null; // cache.get(cacheKey); // TEMPORARILY DISABLED
        if (cachedData) {
            return NextResponse.json({
                success: true,
                ...cachedData
            }, { status: 200, headers: { 'Cache-Control': 'no-store' }});
        }

        let data = null;
        const errors = [];

        // Use only the new IP server for all tracking
        console.log(`[TRACKING] ${trimmedCode} - Using new IP server only`);
        try {
            data = await fastIpServersRace(trimmedCode);
            if (data) {
                console.log(`[TRACKING] ${trimmedCode} - Found in new IP server`);
            } else {
                console.log(`[TRACKING] ${trimmedCode} - No data found in new IP server`);
            }
        } catch (e) {
            errors.push('New IP server: ' + e.message);
            console.log(`[TRACKING] ${trimmedCode} - Error from new IP server: ${e.message}`);
        }

        if (data && data.trackingInfo && data.trackingInfo.length > 0) {
            const finalPayload = {
                Informacje_główne: data.mainInfo,
                Szczegóły_przesyłki: data.trackingInfo,
                Źródło: data.source_api
            };
            
            cache.set(cacheKey, finalPayload);
            
            return NextResponse.json({
                success: true,
                ...finalPayload
            }, { status: 200, headers: { 'Cache-Control': 'no-store' }});
        }

        // Log errors for debugging but don't expose to user
        if (errors.length > 0) {
            console.error(`[TRACKING] ${trimmedCode} failed from all sources:`, errors);
        } else {
            console.warn(`[TRACKING] ${trimmedCode} - No data found and no errors captured`);
        }

        return NextResponse.json({ 
            success: false, 
            message: 'Nie znaleziono informacji o przesyłce. Spróbuj ponownie później.' 
        }, { status: 404 });
    } catch (error) {
        console.error('Tracking API error:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Błąd serwera. Spróbuj ponownie za chwilę.' 
        }, { status: 500 });
    }
}
