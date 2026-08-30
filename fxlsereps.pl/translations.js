// Słownik tłumaczeń dla całej strony
const translations = {
    pl: {
        // Nawigacja
        'nav.products': 'Produkty',
        'nav.sellers': 'Sprzedawcy',
        'nav.tools': 'Tools',
        'nav.guide': 'Poradnik',
        'nav.tracking': 'Tracking',
        'nav.converter': 'Link Converter',
        'nav.qc': 'QC Finder',
        
        // Przyciski
        'btn.login': 'Zaloguj',
        'btn.settings': 'Ustawienia',
        'btn.explore': 'Eksploruj Spreadsheet',
        'btn.sellers': 'Sprzedawcy',
        
        // Hero
        'hero.badge': 'NAJLEPSZY SPREADSHEET W POLSCE',
        'hero.title.1': 'Wszystko czego',
        'hero.title.2': 'potrzebujesz',
        'hero.title.3': 'w jednym miejscu.',
        
        // Features Section
        'features.badge': 'FUNKCJE',
        'features.title': 'Wszystko czego potrzebujesz',
        'features.subtitle': 'Kompleksowe narzędzia dla każdego kto kupuje repy',
        'features.products.title': '2000+ Produktów',
        'features.products.desc': 'Największa baza linków. Znajdź buty, ubrania, akcesoria i wszystko inne czego potrzebujesz.',
        'features.products.link': 'Przeglądaj',
        'features.tracking.title': 'Śledzenie Paczek',
        'features.tracking.desc': 'Śledź swoje zamówienia w jednym miejscu. Wpisz numer i sprawdź status przesyłki.',
        'features.tracking.link': 'Śledź',
        'features.converter.title': 'Link Converter',
        'features.converter.desc': 'Zamień link z Taobao, Weidian lub 1688 na link agenta jednym kliknięciem.',
        'features.converter.link': 'Konwertuj',
        'features.qc.title': 'QC Finder',
        'features.qc.desc': 'Znajdź zdjęcia QC dla swoich produktów z wielu źródeł przed zakupem.',
        'features.qc.link': 'Szukaj',
        
        // Tools Section
        'tools.badge': 'NARZĘDZIA',
        'tools.title': 'Produktowe Narzędzia',
        'tools.subtitle': 'Wszystkie narzędzia których potrzebujesz, całkowicie za darmo',
        'tools.tracking.title': 'Śledzenie Paczek',
        'tools.tracking.desc': 'Śledź przesyłki od dowolnego przewoźnika w jednym miejscu',
        'tools.converter.title': 'Link Converter',
        'tools.converter.desc': 'Konwertuj linki Taobao, Weidian i 1688 na linki agentów',
        'tools.qc.title': 'QC Finder',
        'tools.qc.desc': 'Znajdź zdjęcia kontroli jakości dla produktów z Taobao i Tmall',
        
        // Discord Banner
        'discord.title': 'Dołącz do społeczności',
        'discord.desc': 'Najlepsza społeczność Reps w Polsce — Discord, porady, najnowsze linki',
        'discord.button': 'Dołącz do Discorda',
        
        // Tracking
        'tracking.title': 'Śledzenie Paczek',
        'tracking.subtitle': 'Wpisz numer śledzenia poniżej',
        'tracking.placeholder': 'Wpisz numer przesyłki...',
        'tracking.button': 'Śledź',
        'tracking.status': 'Status',
        'tracking.location': 'Lokalizacja',
        'tracking.date': 'Data',
        'tracking.recipient': 'Odbiorca',
        'tracking.number': 'Numer Śledzenia',
        'tracking.courier': 'Kurier',
        'tracking.nodata': 'Brak danych o lokalizacji',
        'tracking.timeline': 'Historia Przesyłki',
        'tracking.loading': 'Ładowanie...',
        'tracking.error': 'Nie znaleziono przesyłki',
        'tracking.confidence.high': 'Wysoka pewność',
        'tracking.confidence.medium': 'Średnia pewność',
        'tracking.confidence.low': 'Niska pewność',
        
        // Preferences
        'pref.title': 'Ustawienia',
        'pref.currency': 'Waluta',
        'pref.language': 'Język',
        'pref.agent': 'Agent',
        'pref.currency.desc': 'PLN - Polski Złoty',
        'pref.language.desc': 'Polski',
        'pref.agent.desc': 'Brak preferencji',
        
        // Footer
        'footer.navigation': 'Nawigacja',
        'footer.tools': 'Narzędzia',
        'footer.info': 'Info',
        'footer.home': 'Strona główna',
        'footer.products': 'Produkty',
        'footer.sellers': 'Sprzedawcy',
        'footer.guide': 'Poradnik',
        'footer.discord': 'Discord',
        'footer.contact': 'Kontakt',
        'footer.rights': '© 2026 SWAGREPS. All rights reserved.',
        'footer.designed': 'Designed & built by frostyyreps',
        
        // Typewriter texts
        'typewriter.1': 'Najlepsze przedmioty z rzetelnymi recenzjami!',
        'typewriter.2': 'Narzędzia, które podniosą Twoją wiedzę!',
        'typewriter.3': 'Nowości ze świata Reps, których potrzebujesz',
        
        // Product Detail View
        'pdv.back': 'Powrót',
        'pdv.loading': 'Ładowanie produktu...',
        'pdv.error.title': 'Nie znaleziono produktu',
        'pdv.error.message': 'Produkt o podanym ID nie istnieje lub został usunięty.',
        'pdv.error.back': 'Wróć do produktów',
        'pdv.customerService': 'Customer Service',
        'pdv.sku': 'SKU',
        'pdv.style': 'Styl',
        'pdv.view': 'View',
        'pdv.save': 'Save',
        'pdv.report': 'Raport problem link',
        'pdv.description': 'Opis produktu',
        'pdv.views': 'wyświetleń',
        'pdv.likes': 'polubień',
        'pdv.viewAll': 'View all'
    },
    
    en: {
        // Navigation
        'nav.products': 'Products',
        'nav.sellers': 'Sellers',
        'nav.tools': 'Tools',
        'nav.guide': 'Guide',
        'nav.tracking': 'Tracking',
        'nav.converter': 'Link Converter',
        'nav.qc': 'QC Finder',
        
        // Buttons
        'btn.login': 'Login',
        'btn.settings': 'Settings',
        'btn.explore': 'Explore Spreadsheet',
        'btn.sellers': 'Sellers',
        
        // Hero
        'hero.badge': 'BEST SPREADSHEET IN POLAND',
        'hero.title.1': 'Everything you',
        'hero.title.2': 'need',
        'hero.title.3': 'in one place.',
        
        // Features Section
        'features.badge': 'FEATURES',
        'features.title': 'Everything you need',
        'features.subtitle': 'Comprehensive tools for everyone buying reps',
        'features.products.title': '2000+ Products',
        'features.products.desc': 'Largest link database. Find shoes, clothing, accessories and everything else you need.',
        'features.products.link': 'Browse',
        'features.tracking.title': 'Package Tracking',
        'features.tracking.desc': 'Track your orders in one place. Enter number and check shipment status.',
        'features.tracking.link': 'Track',
        'features.converter.title': 'Link Converter',
        'features.converter.desc': 'Convert Taobao, Weidian or 1688 links to agent links with one click.',
        'features.converter.link': 'Convert',
        'features.qc.title': 'QC Finder',
        'features.qc.desc': 'Find QC photos for your products from multiple sources before purchase.',
        'features.qc.link': 'Search',
        
        // Tools Section
        'tools.badge': 'TOOLS',
        'tools.title': 'Product Tools',
        'tools.subtitle': 'All the tools you need, completely free',
        'tools.tracking.title': 'Package Tracking',
        'tools.tracking.desc': 'Track shipments from any carrier in one place',
        'tools.converter.title': 'Link Converter',
        'tools.converter.desc': 'Convert Taobao, Weidian and 1688 links to agent links',
        'tools.qc.title': 'QC Finder',
        'tools.qc.desc': 'Find quality control photos for products from Taobao and Tmall',
        
        // Discord Banner
        'discord.title': 'Join the community',
        'discord.desc': 'Best Reps community in Poland — Discord, tips, latest links',
        'discord.button': 'Join Discord',
        
        // Tracking
        'tracking.title': 'Package Tracking',
        'tracking.subtitle': 'Enter tracking number below',
        'tracking.placeholder': 'Enter tracking number...',
        'tracking.button': 'Track',
        'tracking.status': 'Status',
        'tracking.location': 'Location',
        'tracking.date': 'Date',
        'tracking.recipient': 'Recipient',
        'tracking.number': 'Tracking Number',
        'tracking.courier': 'Courier',
        'tracking.nodata': 'No location data',
        'tracking.timeline': 'Shipment History',
        'tracking.loading': 'Loading...',
        'tracking.error': 'Shipment not found',
        'tracking.confidence.high': 'High confidence',
        'tracking.confidence.medium': 'Medium confidence',
        'tracking.confidence.low': 'Low confidence',
        
        // Preferences
        'pref.title': 'Preferences',
        'pref.currency': 'Currency',
        'pref.language': 'Language',
        'pref.agent': 'Agent',
        'pref.currency.desc': 'PLN - Polish Zloty',
        'pref.language.desc': 'English',
        'pref.agent.desc': 'No preference',
        
        // Footer
        'footer.navigation': 'Navigation',
        'footer.tools': 'Tools',
        'footer.info': 'Info',
        'footer.home': 'Home',
        'footer.products': 'Products',
        'footer.sellers': 'Sellers',
        'footer.guide': 'Guide',
        'footer.discord': 'Discord',
        'footer.contact': 'Contact',
        'footer.rights': '© 2026 SWAGREPS. All rights reserved.',
        'footer.designed': 'Designed & built by frostyyreps',
        
        // Typewriter texts
        'typewriter.1': 'Best products with reliable reviews!',
        'typewriter.2': 'Tools that will boost your knowledge!',
        'typewriter.3': 'Latest Reps news you need',
        
        // Product Detail View
        'pdv.back': 'Back',
        'pdv.loading': 'Loading product...',
        'pdv.error.title': 'Product not found',
        'pdv.error.message': 'The product with the given ID does not exist or has been removed.',
        'pdv.error.back': 'Back to products',
        'pdv.customerService': 'Customer Service',
        'pdv.sku': 'SKU',
        'pdv.style': 'Style',
        'pdv.view': 'View',
        'pdv.save': 'Save',
        'pdv.report': 'Report problem link',
        'pdv.description': 'Product description',
        'pdv.views': 'views',
        'pdv.likes': 'likes',
        'pdv.viewAll': 'View all'
    }
};

// Obecny język (domyślnie polski)
let currentLanguage = localStorage.getItem('language') || 'pl';

// Funkcja zwracająca tłumaczenie
function t(key) {
    return translations[currentLanguage][key] || key;
}

// Funkcja przełączająca język
function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    updatePageLanguage();
}

// Funkcja aktualizująca wszystkie teksty na stronie
function updatePageLanguage() {
    // Aktualizuj wszystkie elementy z data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);
        
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.placeholder = translation;
        } else {
            element.textContent = translation;
        }
    });
    
    // Aktualizuj title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        const translation = t(key);
        element.setAttribute('title', translation);
    });
    
    // Aktualizuj tytuł w preferences
    const prefTitle = document.querySelector('.pref-modal h2');
    if (prefTitle) {
        prefTitle.innerHTML = `<i class="fa-solid fa-gear"></i> ${t('pref.title')}`;
    }
    
    // Aktualizuj wyświetlany język w preferences
    const langValue = document.querySelector('#pref-lang-val');
    if (langValue) {
        langValue.textContent = currentLanguage === 'pl' ? 'PL' : 'EN';
    }
    
    // Powiadom inne komponenty o zmianie języka
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: currentLanguage } }));
}

// Inicjalizacja przy załadowaniu strony
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[i18n] Initializing translations, language:', currentLanguage);
        updatePageLanguage();
    });
} else {
    // DOM już załadowany
    console.log('[i18n] DOM already loaded, initializing translations, language:', currentLanguage);
    updatePageLanguage();
}
