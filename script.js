document.addEventListener('DOMContentLoaded', () => {
    // Add Product Modal Logic
    const addProductBtn = document.getElementById('dodaj-przedmiot-btn');
    const addProductModal = document.getElementById('add-product-modal');
    const closeAddProductBtn = document.getElementById('close-add-product');

    function toggleAddProductModal() {
        if(addProductModal) addProductModal.classList.toggle('hidden');
    }

    if(addProductBtn) addProductBtn.addEventListener('click', toggleAddProductModal);
    if(closeAddProductBtn) closeAddProductBtn.addEventListener('click', toggleAddProductModal);

    if(addProductModal) {
        addProductModal.addEventListener('click', (e) => {
            if (e.target === addProductModal) {
                toggleAddProductModal();
            }
        });
    }

    // SPA View Routing (Home vs Sellers)
    const navHomeBtn = document.getElementById('nav-home-btn');
    const navSellersBtn = document.getElementById('nav-sellers-btn');
    const homeView = document.getElementById('home-view');
    const sellersView = document.getElementById('sellers-view');

    // Helper: przełącz widok — też dostępna globalnie
    function showView(viewId) {
        document.querySelectorAll('.main-view').forEach(v => {
            v.classList.add('hidden');
            v.classList.remove('active');
        });
        const target = document.getElementById(viewId);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
        }
        window.scrollTo(0, 0);
        // footer visibility
        const footer = document.getElementById('site-footer');
        if (footer) footer.style.display = viewId === 'home-view' ? 'block' : 'none';
    }
    window.showView = showView; // eksportuj globalnie

    if(navHomeBtn && navSellersBtn && homeView && sellersView) {
        navHomeBtn.addEventListener('click', () => showView('home-view'));

        navSellersBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showView('sellers-view');
        });
    }

    // hf-card kliknięcia (features section)
    document.querySelectorAll('.hf-card[data-view]').forEach(card => {
        card.addEventListener('click', () => {
            const viewId = card.getAttribute('data-view');
            showView(viewId);
            if (viewId === 'products-view') loadProductsGrid();
        });
    });

    // Eksploruj Spreadsheet → products-view
    const heroExploreBtn = document.getElementById('hero-explore-btn');
    if (heroExploreBtn) {
        heroExploreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showView('products-view');
            loadProductsGrid();
            // animacja wejścia
            const pv = document.getElementById('products-view');
            if (pv) {
                pv.classList.remove('pv-animate-in');
                void pv.offsetWidth; // reflow
                pv.classList.add('pv-animate-in');
            }
        });
    }

    // Products filter bar
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.products-filter-btn');
        if (!btn) return;
        document.querySelectorAll('.products-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.getAttribute('data-cat');
        filterProductsGrid(cat);
    });


    // Sellers Tags Logic
    // Sellers Tags Logic — event delegation żeby działało z nowymi tagami
    const sellersGrid = document.getElementById('sellers-grid');

    function filterSellersByBrand(brand) {
        const cards = document.querySelectorAll('.seller-card-premium');
        cards.forEach(card => {
            const cardBrands = card.getAttribute('data-brands') || '';
            if (brand === 'Wszystkie' || cardBrands.includes(brand)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    function filterSellersBySearch(query) {
        const cards = document.querySelectorAll('.seller-card-premium');
        const q = query.toLowerCase().trim();
        cards.forEach(card => {
            const name   = (card.querySelector('.seller-info h3')?.textContent || '').toLowerCase();
            const brands = (card.getAttribute('data-brands') || '').toLowerCase();
            const desc   = (card.querySelector('.seller-desc')?.textContent || '').toLowerCase();
            card.style.display = (!q || name.includes(q) || brands.includes(q) || desc.includes(q)) ? '' : 'none';
        });
    }

    // Tag click — event delegation
    document.addEventListener('click', (e) => {
        const tag = e.target.closest('#sellers-view .sv-tag, #sellers-view .seller-tag');
        if (!tag) return;
        document.querySelectorAll('#sellers-view .sv-tag, #sellers-view .seller-tag')
            .forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        filterSellersByBrand(tag.innerText.trim());
    });

    // Sellers search — event delegation na input
    document.addEventListener('input', (e) => {
        if (!e.target.classList.contains('sellers-search-input')) return;
        filterSellersBySearch(e.target.value);
    });

    // Category selection logic
    const categoryItems = document.querySelectorAll('.category-item');

    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.id === 'show-girls-btn') {
                const subCategories = document.getElementById('girls-subcategories');
                if (!subCategories) return;
                subCategories.classList.toggle('hidden');
                if (subCategories.classList.contains('hidden')) {
                    item.classList.remove('active');
                } else {
                    categoryItems.forEach(i => { if(i.id !== 'show-girls-btn') i.classList.remove('active'); });
                    item.classList.add('active');
                }
                return;
            }
            categoryItems.forEach(i => { if(!i.classList.contains('girl-item')) i.classList.remove('active'); });
            item.classList.add('active');
            if (!item.classList.contains('girl-item') && item.id !== 'show-girls-btn') {
                const subCategories = document.getElementById('girls-subcategories');
                if (subCategories) subCategories.classList.add('hidden');
            }
            const nameEl = item.querySelector('.category-name');
            if (nameEl) console.log(`Selected category: ${nameEl.innerText}`);

        });
    });

    // Search bar logic
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') console.log(`Searching for: ${searchInput.value}`);
        });
    }

    // Sort select logic
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            console.log(`Sorting by: ${e.target.value}`);
        });
    }        // Perform sort

    // Typewriter effect
    const textElement = document.getElementById('typewriter-text');
    const textsToType = [
        "Najlepsze przedmioty z rzetelnymi recenzjami!",
        "Narzędzia, które podniosą Twoją wiedzę!",
        "Nowości ze świata Reps, których potrzebujesz"
    ];
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 70;
    let pauseAfterTyping = 2000;
    let pauseAfterDeleting = 500;

    function typeWriter() {
        const currentText = textsToType[textIndex];
        
        if (!isDeleting && charIndex < currentText.length) {
            // Type next character
            textElement.innerHTML = currentText.substring(0, charIndex + 1);
            charIndex++;
            setTimeout(typeWriter, typingSpeed);
        } else if (isDeleting && charIndex > 0) {
            // Delete character
            textElement.innerHTML = currentText.substring(0, charIndex - 1);
            charIndex--;
            setTimeout(typeWriter, typingSpeed / 2); // delete faster
        } else if (!isDeleting && charIndex === currentText.length) {
            // Finished typing, pause then start deleting
            isDeleting = true;
            setTimeout(typeWriter, pauseAfterTyping);
        } else if (isDeleting && charIndex === 0) {
            // Finished deleting, pause then start typing again
            isDeleting = false;
            textIndex = (textIndex + 1) % textsToType.length; // move to next string
            setTimeout(typeWriter, pauseAfterDeleting);
        }
    }

    // Start the animation
    setTimeout(typeWriter, 1000);

    // Modal logic
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings');

    function toggleModal() {
        if (!settingsModal) return;
        settingsModal.classList.toggle('hidden');
    }

    if (settingsBtn) settingsBtn.addEventListener('click', toggleModal);
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', toggleModal);

    // Close modal on outside click
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) toggleModal();
        });
    }

    // Modal option selection logic
    const settingsSections = document.querySelectorAll('.settings-section');
    
    settingsSections.forEach(section => {
        const options = section.querySelectorAll('.settings-option');
        
        options.forEach(option => {
            option.addEventListener('click', () => {
                // Remove active class and hide check icon from all options in this section
                options.forEach(opt => {
                    opt.classList.remove('active');
                    opt.querySelector('.check-icon').classList.add('hidden');
                });
                
                // Add active class and show check icon for clicked option
                option.classList.add('active');
                option.querySelector('.check-icon').classList.remove('hidden');
            });
        });
    });

    // Login Modal Logic
    const loginBtn = document.querySelector('.login-btn');
    const loginModal = document.getElementById('login-modal');
    const closeLoginBtn = document.getElementById('close-login');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    function toggleLoginModal() {
        if (!loginModal) return;
        loginModal.classList.toggle('hidden');
        if (!loginModal.classList.contains('hidden')) {
            if (loginError) loginError.classList.add('hidden');
            if (loginForm) loginForm.reset();
        }
    }

    if (loginBtn) loginBtn.addEventListener('click', toggleLoginModal);
    if (closeLoginBtn) closeLoginBtn.addEventListener('click', toggleLoginModal);
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) toggleLoginModal();
        });
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // prevent page reload
        
        const usernameInput = document.getElementById('admin-login').value;
        const passwordInput = document.getElementById('admin-password').value;

        // Hardcoded admin check
        if (usernameInput === 'admin' && passwordInput === 'fxlserepswebsiteapi') {
            // Success
            loginError.classList.add('hidden');
            toggleLoginModal();
            
            // Hide main site elements
            document.querySelectorAll('.container').forEach(c => c.style.display = 'none');
            const floatingSidebar = document.querySelector('.floating-sidebar');
            if (floatingSidebar) floatingSidebar.style.display = 'none';
            
            // Hide all main views
            document.querySelectorAll('.main-view').forEach(view => {
                view.classList.add('hidden');
                view.classList.remove('active');
            });
            
            // Show admin panel
            const adminPanel = document.getElementById('admin-panel');
            if (adminPanel) {
                adminPanel.classList.remove('hidden');
                adminPanel.classList.add('active');
                adminPanel.style.display = 'flex';
            }
            
        } else {
            // Failure
            loginError.classList.remove('hidden');
        }
    });

    // Admin Panel Navigation
    const adminLinks = document.querySelectorAll('.admin-link');
    const adminViews = document.querySelectorAll('.admin-view');

    adminLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            adminLinks.forEach(l => l.classList.remove('active'));
            adminViews.forEach(v => v.classList.remove('active'));
            link.classList.add('active');
            const targetId = 'view-' + link.getAttribute('data-target');
            const targetView = document.getElementById(targetId);
            if (targetView) targetView.classList.add('active');
            // Załaduj dane dla danego widoku
            if (link.getAttribute('data-target') === 'sellers') loadAdminSellers();
            if (link.getAttribute('data-target') === 'products') loadAdminProducts();
        });
    });

    // Admin Settings Tabs
    const settingsTabs = document.querySelectorAll('.settings-tab');
    const settingsPanes = document.querySelectorAll('.settings-pane');

    settingsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all tabs and panes
            settingsTabs.forEach(t => t.classList.remove('active'));
            settingsPanes.forEach(p => p.classList.remove('active'));
            
            // Add active to clicked tab
            tab.classList.add('active');
            
            // Show corresponding pane
            const targetId = 'pane-' + tab.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Logout
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', () => {
        document.getElementById('admin-panel').classList.add('hidden');
        const cont = document.querySelector('.container');
        if (cont) cont.style.display = 'block';
        const floatBar = document.querySelector('.floating-sidebar');
        if (floatBar) floatBar.style.display = 'flex';
        if (loginForm) loginForm.reset();
    });

    // Sellers Tags Scroll and Drag Logic
    const tagsContainer = document.querySelector('.sellers-tags-scroll');
    const scrollLeftBtn = document.querySelector('.scroll-btn.left');
    const scrollRightBtn = document.querySelector('.scroll-btn.right');

    if (tagsContainer) {
        let isDown = false;
        let startX;
        let scrollLeft;

        tagsContainer.addEventListener('mousedown', (e) => {
            isDown = true;
            tagsContainer.style.cursor = 'grabbing';
            startX = e.pageX - tagsContainer.offsetLeft;
            scrollLeft = tagsContainer.scrollLeft;
        });

        tagsContainer.addEventListener('mouseleave', () => {
            isDown = false;
            tagsContainer.style.cursor = 'grab';
        });

        tagsContainer.addEventListener('mouseup', () => {
            isDown = false;
            tagsContainer.style.cursor = 'grab';
        });

        tagsContainer.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - tagsContainer.offsetLeft;
            const walk = (x - startX) * 2; // scroll-fast
            tagsContainer.scrollLeft = scrollLeft - walk;
        });

        // Setup cursors
        tagsContainer.style.cursor = 'grab';
        
        // Setup buttons
        if (scrollLeftBtn) {
            scrollLeftBtn.addEventListener('click', () => {
                tagsContainer.scrollBy({ left: -200, behavior: 'smooth' });
            });
        }
        if (scrollRightBtn) {
            scrollRightBtn.addEventListener('click', () => {
                tagsContainer.scrollBy({ left: 200, behavior: 'smooth' });
            });
        }
    }

});


// =========================================
// TRACKING — 111.231.71.230:8082 API
// =========================================
// TRACKING — 111.231.71.230:8082
// Używamy iframe trick: POST przez hidden form → iframe → parsujemy contentDocument
// (serwer nie ma CORS, fetch jest blokowany przez przeglądarkę)
// =========================================

const TRACKING_API = 'http://111.231.71.230:8082';

// Enter na polu trackingu
document.addEventListener('DOMContentLoaded', () => {
    const iqNum = document.getElementById('YQNum');
    if (iqNum) iqNum.addEventListener('keydown', e => { if (e.key === 'Enter') doTrack(); });
});

// Statusy → polskie
const TRACK_STATUS_MAP = {
    'The shipment has been successfully delivered': 'Przesyłka dostarczona ✓',
    'Loaded to movement / tour vehicle': 'Załadowano do pojazdu',
    'Movement / tour vehicle arrived': 'Pojazd dotarł na miejsce',
    'The shipment has been processed in the destination parcel center': 'Przetworzona w centrum docelowym',
    'Unloaded from movement / tour vehicle': 'Rozładowano z pojazdu',
    'The shipment has been processed in the parcel center of origin': 'Przetworzona w centrum nadawczym',
    'Pick-up was successful': 'Odebrano przesyłkę',
    'Pick-up was successful.': 'Odebrano przesyłkę',
    'Customs clearance completed pending scanning': 'Odprawa celna zakończona',
    'Export customs clearance completed': 'Eksportowa odprawa celna zakończona',
    'Flight has arrived': 'Samolot wylądował',
    'Flight has departed': 'Samolot wystartował',
    '拆板中Dismantling the board': 'Rozpakowywanie palety',
    '航班已抵达Flight has arrived': 'Samolot wylądował',
    '航班已起飞Flight has departed': 'Samolot wystartował',
    '清关完成,等待提取Customs clearance completed pending scanning': 'Odprawa celna zakończona',
    '出口清关完成 Export customs clearance completed': 'Eksportowa odprawa celna zakończona',
};

function _track_translateStatus(status) {
    if (!status) return '';
    const t = status.trim();
    if (TRACK_STATUS_MAP[t]) return TRACK_STATUS_MAP[t];
    for (const [key, val] of Object.entries(TRACK_STATUS_MAP)) {
        if (t.includes(key)) return t.replace(key, val);
    }
    return t;
}

function _track_parseDoc(doc) {
    let reference = '', trackingNum = '', destination = '', latestStatus = '', recipient = '';

    // Główny wiersz — li z klasami div_li*
    const liItems = doc.querySelectorAll('.div_li3, .div_li1, .div_li2, .div_li4');
    if (liItems.length >= 4) {
        const texts = Array.from(liItems).map(el => el.textContent.trim().replace(/\s+/g, ' '));
        trackingNum  = texts.find(t => /^[A-Z]{2}\d{6,}/i.test(t)) || '';
        destination  = texts.find(t => /^[A-Z]{2}$/.test(t)) || '';
        latestStatus = texts.find(t => t.length > 15 && t !== trackingNum && t !== destination) || '';
        reference    = texts[0] || '';
    }

    // Odbiorca — szukaj li bez klasy lub ostatni li
    doc.querySelectorAll('li').forEach(li => {
        const cls = li.className || '';
        const txt = li.textContent.trim();
        if (!cls && txt.includes(' ') && txt.length > 3 && txt.length < 50) recipient = txt;
    });

    // Eventy — td z datą YYYY-MM-DD
    const events = [];
    const tds = Array.from(doc.querySelectorAll('td'));
    for (let i = 0; i < tds.length; i++) {
        const cellText = tds[i].textContent.trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(cellText)) {
            const date     = cellText;
            const location = tds[i + 1]?.textContent.trim() || '';
            const status   = tds[i + 2]?.textContent.trim() || '';
            if (status || location) {
                events.push({ date, location, status: status || location });
                i += 2; // przeskocz przetworzone komórki
            }
        }
    }

    return { reference, trackingNum, destination, latestStatus, recipient, events };
}

function _track_renderResult(container, data) {
    const { trackingNum, destination, latestStatus, recipient, events } = data;
    const isDelivered = (latestStatus || '').toLowerCase().includes('delivered') || (latestStatus || '').includes('dostarczona');
    const badgeColor  = isDelivered ? '#10b981' : '#a78bfa';

    const metaParts = [
        trackingNum && `<span><i class="fa-solid fa-barcode"></i> ${trackingNum}</span>`,
        destination && `<span><i class="fa-solid fa-location-dot"></i> ${destination}</span>`,
        recipient   && `<span><i class="fa-solid fa-user"></i> ${recipient}</span>`,
    ].filter(Boolean).join('');

    const eventsHtml = events.length
        ? events.map((ev, i) => `
            <div class="track-event ${i === 0 ? 'track-event--first' : ''}">
                <div class="track-event__dot ${i === 0 ? 'track-event__dot--active' : ''}"></div>
                <div class="track-event__content">
                    <div class="track-event__date">${ev.date}</div>
                    <div class="track-event__status">${_track_translateStatus(ev.status)}</div>
                    ${ev.location ? `<div class="track-event__loc"><i class="fa-solid fa-location-dot"></i> ${ev.location}</div>` : ''}
                </div>
            </div>`).join('')
        : `<p style="text-align:center;color:rgba(255,255,255,0.3);padding:2rem 0">Brak szczegółów przesyłki.</p>`;

    container.innerHTML = `
        <div class="track-result">
            <div class="track-result__header">
                <div class="track-result__badge" style="background:${badgeColor}22;border:1px solid ${badgeColor}55;color:${badgeColor}">
                    <i class="fa-solid fa-circle" style="font-size:0.45rem"></i>
                    ${_track_translateStatus(latestStatus) || 'W drodze'}
                </div>
                ${metaParts ? `<div class="track-result__meta">${metaParts}</div>` : ''}
            </div>
            <div class="track-result__timeline">${eventsHtml}</div>
        </div>`;
}

function doTrack() {
    const input = document.getElementById('YQNum');
    const num   = input ? input.value.trim() : '';
    if (!num) { if (input) input.focus(); return; }

    const container = document.getElementById('YQContainer');
    if (!container) return;

    container.innerHTML = `
        <div style="text-align:center;padding:3rem;color:rgba(255,255,255,0.4);">
            <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;margin-bottom:1rem;display:block;"></i>
            Sprawdzam status przesyłki...
        </div>`;

    // Usuń stary iframe jeśli istnieje
    const oldFrame = document.getElementById('_track_iframe');
    if (oldFrame) oldFrame.remove();
    const oldForm  = document.getElementById('_track_form');
    if (oldForm)  oldForm.remove();

    // Utwórz ukryty iframe jako target dla form POST
    const iframe = document.createElement('iframe');
    iframe.id    = '_track_iframe';
    iframe.name  = '_track_iframe';
    iframe.style.cssText = 'display:none;width:0;height:0;border:none;position:absolute;';
    document.body.appendChild(iframe);

    // Utwórz ukryty form POST
    const form = document.createElement('form');
    form.id     = '_track_form';
    form.method = 'POST';
    form.action = `${TRACKING_API}/trackIndex.htm`;
    form.target = '_track_iframe';
    form.style.cssText = 'display:none;';

    const field = document.createElement('input');
    field.type  = 'hidden';
    field.name  = 'documentCode';
    field.value = num;
    form.appendChild(field);
    document.body.appendChild(form);

    // Timeout — jeśli iframe nie załaduje się w 12s
    const timeout = setTimeout(() => {
        iframe.remove();
        form.remove();
        container.innerHTML = `
            <div style="text-align:center;padding:3rem;color:rgba(255,255,255,0.3);">
                <span style="font-size:2rem;display:block;margin-bottom:1rem;">⚠️</span>
                <strong style="color:rgba(255,255,255,0.6);">Brak odpowiedzi serwera</strong><br>
                <small style="margin-top:0.5rem;display:block;opacity:0.6;">Sprawdź czy serwer śledzenia jest dostępny.</small>
            </div>`;
    }, 12000);

    // Gdy iframe załaduje odpowiedź — parsujemy DOM
    iframe.addEventListener('load', () => {
        clearTimeout(timeout);
        try {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            if (!doc || !doc.body) throw new Error('empty_response');

            const data = _track_parseDoc(doc);

            if (!data.events.length && !data.trackingNum) {
                container.innerHTML = `
                    <div style="text-align:center;padding:3rem;color:rgba(255,255,255,0.3);">
                        <span style="font-size:2rem;display:block;margin-bottom:1rem;">📦</span>
                        Nie znaleziono przesyłki o numerze <strong style="color:rgba(255,255,255,0.6)">${num}</strong>.
                    </div>`;
            } else {
                _track_renderResult(container, data);
            }
        } catch (err) {
            container.innerHTML = `
                <div style="text-align:center;padding:3rem;color:rgba(255,255,255,0.3);">
                    <span style="font-size:2rem;display:block;margin-bottom:1rem;">⚠️</span>
                    <strong style="color:rgba(255,255,255,0.6);">Błąd odczytu odpowiedzi</strong><br>
                    <small style="margin-top:0.5rem;display:block;opacity:0.6;">${err.message}</small>
                </div>`;
        } finally {
            iframe.remove();
            form.remove();
        }
    });

    form.submit();
}
document.querySelectorAll('[data-view]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetViewId = link.getAttribute('data-view');
        
        document.querySelectorAll('.main-view').forEach(v => {
            v.classList.add('hidden');
            v.classList.remove('active');
        });
        
        const targetView = document.getElementById(targetViewId);
        if(targetView) {
            targetView.classList.remove('hidden');
            targetView.classList.add('active');
        }
        
        window.scrollTo(0,0);
    });
});

// Image Search Logic
document.addEventListener('DOMContentLoaded', () => {
    const uploadZone = document.getElementById('upload-zone');
    const imageInput = document.getElementById('image-upload-input');
    const previewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');

    if(uploadZone && imageInput) {
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            if(e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleImageFile(e.dataTransfer.files[0]);
            }
        });

        imageInput.addEventListener('change', function() {
            if(this.files && this.files.length > 0) {
                handleImageFile(this.files[0]);
            }
        });

        // Trigger file input on zone click (except button)
        uploadZone.addEventListener('click', (e) => {
            if(e.target !== document.querySelector('.upload-btn')) {
                imageInput.click();
            }
        });
    }

    function handleImageFile(file) {
        if(!file.type.startsWith('image/')) {
            alert('Proszę wybrać plik graficzny (JPG, PNG).');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            uploadZone.classList.add('hidden');
            previewContainer.classList.remove('hidden');
        }
        reader.readAsDataURL(file);
    }
    
    window.resetImageSearch = function() {
        imageInput.value = '';
        imagePreview.src = '';
        previewContainer.classList.add('hidden');
        uploadZone.classList.remove('hidden');
    }
    
    window.startImageSearch = function() {
        alert('Moduł wyszukiwania sztuczną inteligencją w przygotowaniu! Wersja docelowa połączy się tu z API wyszukiwarki Taobao/1688.');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const uploadZone1688 = document.getElementById('upload-zone-1688');
    const imageInput1688 = document.getElementById('image-upload-input-1688');
    const previewContainer1688 = document.getElementById('image-preview-container-1688');
    const imagePreview1688 = document.getElementById('image-preview-1688');
    const resultsContainer = document.getElementById('search-results-1688');

    if(uploadZone1688 && imageInput1688) {
        uploadZone1688.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone1688.classList.add('dragover'); });
        uploadZone1688.addEventListener('dragleave', (e) => { e.preventDefault(); uploadZone1688.classList.remove('dragover'); });
        uploadZone1688.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone1688.classList.remove('dragover');
            if(e.dataTransfer.files && e.dataTransfer.files.length > 0) handleImageFile1688(e.dataTransfer.files[0]);
        });
        
        imageInput1688.addEventListener('change', function() {
            if(this.files && this.files.length > 0) handleImageFile1688(this.files[0]);
        });
        uploadZone1688.addEventListener('click', () => imageInput1688.click());
    }

    function handleImageFile1688(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview1688.src = e.target.result;
            uploadZone1688.classList.add('hidden');
            previewContainer1688.classList.remove('hidden');
            resultsContainer.classList.add('hidden');
        }
        reader.readAsDataURL(file);
    }
    
    window.resetImageSearch1688 = function() {
        imageInput1688.value = '';
        imagePreview1688.src = '';
        previewContainer1688.classList.add('hidden');
        uploadZone1688.classList.remove('hidden');
        resultsContainer.classList.add('hidden');
    }
    
    window.startImageSearch1688 = function() {
        const btn = document.querySelector('.start-search-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Szukanie... <i class="fa-solid fa-spinner fa-spin"></i>';
        
        // Symulacja wysyłania do API 1688 i generowania linków
        setTimeout(() => {
            btn.innerHTML = originalText;
            document.getElementById('search-results-1688').classList.remove('hidden');
            
            // W rzeczywistości tutaj podmienialibyśmy linki na podstawie API:
            document.getElementById('link-kakobuy').onclick = function() { window.open('https://www.kakobuy.com/item/details?url=' + encodeURIComponent('https://detail.1688.com/offer/123456789.html'), '_blank'); };
            document.getElementById('link-wellgobuy').onclick = function() { window.open('https://www.wellgobuy.com/item/details?url=' + encodeURIComponent('https://detail.1688.com/offer/123456789.html'), '_blank'); };
        }, 1500);
    }
});

// Translation Dictionary
const i18n = {
    'pl': {
        'Strona Główna': 'Strona Główna',
        'Sprzedawcy': 'Sprzedawcy',
        'QC Zdjęcia': 'QC Zdjęcia',
        'Zaloguj': 'Zaloguj',
        'Najlepsi Sprzedawcy z': 'Najlepsi Sprzedawcy z',
        'Szukaj sprzedawcy...': 'Szukaj sprzedawcy...',
        'Znalezionych sprzedawców:': 'Znalezionych sprzedawców:',
        'Kopiuj Link': 'Kopiuj Link',
        'Konfiguracja Systemu': 'Konfiguracja Systemu',
        'Użytkownicy': 'Użytkownicy',
        'Ustawienia': 'Ustawienia',
        'JĘZYK WYŚWIETLANIA': 'JĘZYK WYŚWIETLANIA',
        'AGENT ZAKUPOWY': 'AGENT ZAKUPOWY',
        'Polski': 'Polski',
        'Angielski': 'Angielski',
        'Śledzenie Paczek': 'Śledzenie Paczek',
        'Wpisz numer śledzenia...': 'Wpisz numer śledzenia...',
        'Śledź': 'Śledź',
        'Śledź swoje przesyłki w jednym miejscu': 'Śledź swoje przesyłki w jednym miejscu',
        'Promocje': 'Promocje',
        'Zaloguj się': 'Zaloguj się',
        'Hasło': 'Hasło',
        'Login': 'Login',
        'Wprowadź login...': 'Wprowadź login...',
        'Wprowadź hasło...': 'Wprowadź hasło...',
        'Wpisz link ze sklepu (np. Weidian, Taobao, 1688)...': 'Wpisz link ze sklepu (np. Weidian, Taobao, 1688)...',
        'Brak wyników': 'Brak wyników',
        'Zarządzanie': 'Zarządzanie',
        'Wszystkie': 'Wszystkie',
        'Ubrania': 'Ubrania',
        'Buty': 'Buty',
        'Akcesoria': 'Akcesoria',
        'Elektronika': 'Elektronika',
        'Biżuteria': 'Biżuteria',
        'Zegarki': 'Zegarki',
        'Torby': 'Torby',
        'Wygląd': 'Wygląd',
        'Agenci': 'Agenci',
        'Zabezpieczenia': 'Zabezpieczenia',
        'Motyw aplikacji': 'Motyw aplikacji',
        'Tryb ciemny, jasny lub auto.': 'Tryb ciemny, jasny lub auto.',
        'Animacje interfejsu': 'Animacje interfejsu',
        'Płynne przejścia między zakładkami.': 'Płynne przejścia między zakładkami.',
        'Tryb Halloween/Święta': 'Tryb Halloween/Święta',
        'Włącza animację spadającego śniegu lub pajęczyn na stronie.': 'Włącza animację spadającego śniegu lub pajęczyn na stronie.',
        'Konfiguracja Agentów': 'Konfiguracja Agentów',
        'Tu możesz ustawić, na jakich chińskich agentów tłumaczone są linki ze spreadsheetu.': 'Tu możesz ustawić, na jakich chińskich agentów tłumaczone są linki ze spreadsheetu.',
        'Zmień hasło i zarządzaj kluczami API.': 'Zmień hasło i zarządzaj kluczami API.',
        'Logowanie Administratora': 'Logowanie Administratora',
        'Nieprawidłowy login lub hasło.': 'Nieprawidłowy login lub hasło.',
        'Wszystkie kategorie': 'Wszystkie kategorie',
        'Preferencje Wyglądu': 'Preferencje Wyglądu',
        'SWAGREPS': 'SWAGREPS'
    },
    'en': {
        'Strona Główna': 'Home',
        'Sprzedawcy': 'Sellers',
        'QC Zdjęcia': 'QC Photos',
        'Zaloguj': 'Login',
        'Najlepsi Sprzedawcy z': 'Best Sellers from',
        'Szukaj sprzedawcy...': 'Search seller...',
        'Znalezionych sprzedawców:': 'Sellers found:',
        'Kopiuj Link': 'Copy Link',
        'Konfiguracja Systemu': 'System Config',
        'Użytkownicy': 'Users',
        'Ustawienia': 'Settings',
        'JĘZYK WYŚWIETLANIA': 'DISPLAY LANGUAGE',
        'AGENT ZAKUPOWY': 'SHOPPING AGENT',
        'Polski': 'Polish',
        'Angielski': 'English',
        'Śledzenie Paczek': 'Package Tracking',
        'Wpisz numer śledzenia...': 'Enter tracking number...',
        'Śledź': 'Track',
        'Śledź swoje przesyłki w jednym miejscu': 'Track your packages in one place',
        'Promocje': 'Discounts',
        'Zaloguj się': 'Sign In',
        'Hasło': 'Password',
        'Login': 'Username',
        'Wprowadź login...': 'Enter username...',
        'Wprowadź hasło...': 'Enter password...',
        'Wpisz link ze sklepu (np. Weidian, Taobao, 1688)...': 'Enter shop link (e.g., Weidian, Taobao, 1688)...',
        'Brak wyników': 'No results',
        'Zarządzanie': 'Management',
        'Wszystkie': 'All',
        'Ubrania': 'Clothes',
        'Buty': 'Shoes',
        'Akcesoria': 'Accessories',
        'Elektronika': 'Electronics',
        'Biżuteria': 'Jewelry',
        'Zegarki': 'Watches',
        'Torby': 'Bags',
        'Wygląd': 'Appearance',
        'Agenci': 'Agents',
        'Zabezpieczenia': 'Security',
        'Motyw aplikacji': 'App Theme',
        'Tryb ciemny, jasny lub auto.': 'Dark, light or auto mode.',
        'Animacje interfejsu': 'UI Animations',
        'Płynne przejścia między zakładkami.': 'Smooth transitions between tabs.',
        'Tryb Halloween/Święta': 'Halloween/Holiday Mode',
        'Włącza animację spadającego śniegu lub pajęczyn na stronie.': 'Enables falling snow or cobweb animations.',
        'Konfiguracja Agentów': 'Agents Configuration',
        'Tu możesz ustawić, na jakich chińskich agentów tłumaczone są linki ze spreadsheetu.': 'Here you can set which Chinese agents the spreadsheet links are translated to.',
        'Zmień hasło i zarządzaj kluczami API.': 'Change password and manage API keys.',
        'Logowanie Administratora': 'Admin Login',
        'Nieprawidłowy login lub hasło.': 'Invalid username or password.',
        'Wszystkie kategorie': 'All categories',
        'Preferencje Wyglądu': 'Appearance Preferences',
        'SWAGREPS': 'SWAGREPS'
    }
};

let currentLang = 'pl';

function translatePage(lang) {
    if(!i18n[lang]) return;
    currentLang = lang;
    
    // Translate text nodes
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while(node = walk.nextNode()) {
        let text = node.nodeValue.trim();
        if(text.length > 0) {
            // Find original key if page is already translated
            let originalKey = text;
            if(lang === 'en') {
                // We assume source is mostly PL
                for(let key in i18n['en']) {
                    if(i18n['pl'][key] === text) { originalKey = key; break; }
                }
            } else {
                for(let key in i18n['pl']) {
                    if(i18n['en'][key] === text) { originalKey = key; break; }
                }
            }
            
            if(i18n[lang][originalKey]) {
                node.nodeValue = node.nodeValue.replace(text, i18n[lang][originalKey]);
            }
        }
    }
    
    // Translate placeholders
    document.querySelectorAll('input, textarea').forEach(el => {
        if(el.placeholder) {
            let ph = el.placeholder.trim();
            let originalKey = ph;
            if(lang === 'en') {
                for(let key in i18n['en']) {
                    if(i18n['pl'][key] === ph) { originalKey = key; break; }
                }
            } else {
                for(let key in i18n['pl']) {
                    if(i18n['en'][key] === ph) { originalKey = key; break; }
                }
            }
            if(i18n[lang][originalKey]) {
                el.placeholder = i18n[lang][originalKey];
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const langOptions = document.querySelectorAll('.lang-option');
    langOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            // Update UI
            langOptions.forEach(o => {
                o.classList.remove('active');
                o.querySelector('.check-icon').classList.add('hidden');
            });
            opt.classList.add('active');
            opt.querySelector('.check-icon').classList.remove('hidden');
            
            // Translate
            const lang = opt.getAttribute('data-lang');
            translatePage(lang);
        });
    });
});

    // Template Import Logic Simulation
    const importRefreshBtn = document.getElementById('import-refresh-btn');
    const importStartBtn = document.getElementById('import-start-btn');
    const processingTracker = document.getElementById('processing-tracker');
    const processingBar = document.getElementById('processing-bar');
    const importUrlInput = document.getElementById('import-url');
    const productsTbody = document.getElementById('admin-products-tbody');
    
    function parseCSV(str) {
        const arr = [];
        let quote = false;
        let col = 0, row = 0;
        for (let c = 0; c < str.length; c++) {
            let cc = str[c], nc = str[c+1];
            arr[row] = arr[row] || [];
            arr[row][col] = arr[row][col] || '';
            if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }
            if (cc == '"') { quote = !quote; continue; }
            if (cc == ',' && !quote) { ++col; continue; }
            if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }
            if (cc == '\n' && !quote) { ++row; col = 0; continue; }
            if (cc == '\r' && !quote) { ++row; col = 0; continue; }
            arr[row][col] += cc;
        }
        return arr;
    }

    async function startImportProcess(e) {
        if(e) e.preventDefault();
        const urlValue = importUrlInput.value.trim();
        if (urlValue === '') {
            alert('Wklej link do Google Sheets!');
            return;
        }
        
        if(processingTracker) processingTracker.classList.remove('hidden');
        if (processingBar) processingBar.style.width = '10%';
        
        // 1. Fetch CSV
        let productsToAdd = [];
        try {
            const sheetIdMatch = urlValue.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if(!sheetIdMatch) {
                alert('Nieprawidłowy link Google Sheets!');
                if (processingTracker) processingTracker.classList.add('hidden');
                return;
            }
            const sheetId = sheetIdMatch[1];
            const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
            
            const response = await fetch(csvUrl);
            if(!response.ok) throw new Error('Brak dostępu. Upewnij się, że arkusz jest publiczny ("Każdy mający link").');
            
            const csvText = await response.text();
            const rows = parseCSV(csvText);
            
            // Skip header
            for(let i=1; i<rows.length; i++) {
                const row = rows[i];
                if(!row || row.length < 1) continue;
                
                let linkColIndex = -1;
                let link = '';
                for(let j=0; j<row.length; j++) {
                    const cell = row[j] ? row[j].trim() : '';
                    const cellLower = cell.toLowerCase();
                    // Detect typical rep domains or http
                    if(cellLower.includes('http') || cellLower.includes('weidian.com') || cellLower.includes('taobao.com') || cellLower.includes('1688.com') || cellLower.includes('yupoo.com') || cellLower.includes('tmall.com') || cellLower.includes('pinduoduo.com')) {
                        linkColIndex = j;
                        link = cell;
                        if (!link.startsWith('http')) {
                            link = 'https://' + link;
                        }
                        break;
                    }
                }
                
                if(linkColIndex === -1) continue;
                
                let name = '';
                for(let j=0; j<row.length; j++) {
                    if(j !== linkColIndex && row[j] && row[j].trim() !== '') {
                        name = row[j].trim();
                        break;
                    }
                }
                
                if(!name) name = 'Produkt ' + i;
                
                if(link) {
                    productsToAdd.push({ name, link });
                }
            }
            
        } catch(error) {
            console.error(error);
            alert('Błąd pobierania danych: ' + error.message + '\n(Upewnij się, że plik ma uprawnienia: "Każdy mający link może wyświetlać")');
            if (processingTracker) processingTracker.classList.add('hidden');
            return;
        }
        
        if(productsToAdd.length === 0) {
            alert('Nie znaleziono żadnych produktów z linkami w tym arkuszu!');
            if (processingTracker) processingTracker.classList.add('hidden');
            return;
        }
        
        // Update Tracker Text
        const trackerH4 = processingTracker.querySelector('h4');
        if(trackerH4) trackerH4.innerHTML = `<i class="fa-solid fa-box-open" style="color: #d97706;"></i> Processing: 0 / ${productsToAdd.length}`;
        
        // 2. Determine Agent & Category
        let activeAgent = 'Kakobuy';
        const agentOptions = document.querySelectorAll('.settings-section .settings-option');
        agentOptions.forEach(opt => {
            if(opt.classList.contains('active')) {
                const text = opt.innerText.trim();
                if(text.includes('Kakobuy')) activeAgent = 'Kakobuy';
                if(text.includes('WellGoBuy')) activeAgent = 'WellGoBuy';
            }
        });
        
        let domain = 'kakobuy.com';
        if(activeAgent === 'WellGoBuy') domain = 'wellgobuy.com';
        
        // Get category from modal
        let selectedCategory = 'Accessories';
        const categorySelects = document.querySelectorAll('#add-product-modal select');
        if(categorySelects.length > 1) {
            selectedCategory = categorySelects[1].value;
        }
        
        // 3. Process Products iteratively to animate
        let progress = 10;
        let processedCount = 0;
        
        if (window.importInterval) clearInterval(window.importInterval);
        
        if (productsTbody) productsTbody.innerHTML = '';
        
        window.importInterval = setInterval(() => {
            if (processedCount >= productsToAdd.length) {
                clearInterval(window.importInterval);
                setTimeout(() => {
                    const modal = document.getElementById('add-product-modal');
                    if(modal) modal.classList.add('hidden');
                }, 500);
                return;
            }
            
            // Add 1 product per tick
            const p = productsToAdd[processedCount];
            let affParam = activeAgent === 'Kakobuy' ? '&affcode=truskawka' : '&promoteCode=977Pkqgka';
            const finalLink = `https://${domain}/item/details?url=${encodeURIComponent(p.link)}${affParam}`;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="product-cell">
                        <div class="product-img-mock"><i class="fa-solid fa-box"></i></div>
                        <div>
                            <strong>${p.name}</strong>
                            <span class="product-id">#NEW</span>
                        </div>
                    </div>
                </td>
                <td><span class="badge badge-outline">${selectedCategory}</span></td>
                <td>$0.00</td>
                <td><span class="badge badge-success"><i class="fa-solid fa-check-circle"></i> In Stock</span></td>
                <td>0</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn" title="Edytuj"><i class="fa-solid fa-pen"></i></button>
                        <button class="action-btn" title="Kopiuj link (${activeAgent})" onclick="prompt('Affiliate Link:', '${finalLink}')"><i class="fa-solid fa-link"></i></button>
                        <button class="action-btn danger" title="Usuń" onclick="this.closest('tr').remove()"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;
            if (productsTbody) productsTbody.appendChild(tr);
            
            processedCount++;
            progress = 10 + (90 * (processedCount / productsToAdd.length));
            if (processingBar) processingBar.style.width = Math.min(progress, 100) + '%';
            if (trackerH4) trackerH4.innerHTML = `<i class="fa-solid fa-box-open" style="color: #d97706;"></i> Processing: ${processedCount} / ${productsToAdd.length}`;
            
        }, 100); // add one product every 100ms
    }
    
    if (importRefreshBtn) importRefreshBtn.addEventListener('click', startImportProcess);
    if (importStartBtn) importStartBtn.addEventListener('click', startImportProcess);

    // Import Modal Buttons Toggle Logic
    const methodBtns = document.querySelectorAll('.import-method-btn');
    const modeBtns = document.querySelectorAll('.import-mode-btn');

    methodBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            methodBtns.forEach(b => {
                b.style.background = 'rgba(255,255,255,0.03)';
                b.style.border = '1px solid rgba(255,255,255,0.05)';
                b.classList.remove('active');
            });
            btn.style.background = 'rgba(168,85,247,0.15)';
            btn.style.border = '1px solid #a855f7';
            btn.classList.add('active');
        });
    });

    modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            modeBtns.forEach(b => {
                b.style.background = 'rgba(255,255,255,0.03)';
                b.style.border = '1px solid rgba(255,255,255,0.05)';
                b.classList.remove('active');
            });
            btn.style.background = 'rgba(168,85,247,0.15)';
            btn.style.border = '1px solid #a855f7';
            btn.classList.add('active');
        });
    });


// ==========================================
// ADMIN PANEL - PRODUCTS MANAGEMENT
// ==========================================

// Product Data Store (localStorage)
function getProducts() {
    const products = localStorage.getItem('products');
    return products ? JSON.parse(products) : [];
}

function saveProducts(products) {
    localStorage.setItem('products', JSON.stringify(products));
}

// Open Add Product Modal
document.getElementById('dodaj-przedmiot-btn')?.addEventListener('click', () => {
    document.getElementById('add-product-modal').classList.remove('hidden');
});

// Close Add Product Modal
function closeAddProductModal() {
    document.getElementById('add-product-modal').classList.add('hidden');
    document.getElementById('add-product-form').reset();
}

// Add Product
function addProduct(event) {
    event.preventDefault();
    
    const products = getProducts();
    
    const newProduct = {
        id: Date.now(),
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value),
        image: document.getElementById('product-image').value,
        category: document.getElementById('product-category').value,
        link: document.getElementById('product-link').value,
        status: 'active',
        clicks: 0,
        createdAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    saveProducts(products);
    
    closeAddProductModal();
    loadAdminProducts();
    showToast('Produkt dodany pomyślnie!', 'success');
}

// Load Products in Admin Table
function loadAdminProducts() {
    const products = getProducts();
    const tbody = document.getElementById('admin-products-tbody');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-muted);">Brak produktów. Dodaj pierwszy produkt!</td></tr>';
        return;
    }
    
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
                    <span>${product.name}</span>
                </div>
            </td>
            <td><span class="badge">${product.category}</span></td>
            <td>¥${product.price}</td>
            <td><span class="status-badge status-${product.status}">${product.status === 'active' ? 'In Stock' : 'Dead Link'}</span></td>
            <td>${product.clicks}</td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="icon-btn" onclick="editProduct(${product.id})" title="Edytuj"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-btn" onclick="deleteProduct(${product.id})" title="Usuń"><i class="fa-solid fa-trash"></i></button>
                    <a href="${product.link}" target="_blank" class="icon-btn" title="Otwórz link"><i class="fa-solid fa-external-link"></i></a>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Also update products grid on main page
    loadProductsGrid();
}

// Delete Product
function deleteProduct(id) {
    if (!confirm('Czy na pewno chcesz usunąć ten produkt?')) return;
    
    let products = getProducts();
    products = products.filter(p => p.id !== id);
    saveProducts(products);
    
    loadAdminProducts();
    showToast('Produkt usunięty', 'success');
}

// Edit Product (placeholder - można rozbudować)
function editProduct(id) {
    showToast('Funkcja edycji w przygotowaniu', 'info');
}

// Toast Notification
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ---- Default sample products (shown when localStorage is empty) ----
const SAMPLE_PRODUCTS = [
    { id: 's1',  name: 'Nike Socks',               price: 15.95,  currency: 'PLN', image: 'https://images.unsplash.com/photo-1556906781-9a414e2a9c86?w=600&q=80',  category: 'Accessories',     link: '#', status: 'active', clicks: 65,  popular: true  },
    { id: 's2',  name: 'Nike Elite Bag',            price: 52.72,  currency: 'PLN', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',  category: 'Bags & Backpacks',link: '#', status: 'active', clicks: 32,  popular: true  },
    { id: 's3',  name: 'Calvin Klein Boxers',       price: 8.27,   currency: 'PLN', image: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=600&q=80', category: 'Accessories',     link: '#', status: 'active', clicks: 14,  popular: true  },
    { id: 's4',  name: 'LV Belt',                   price: 51.17,  currency: 'PLN', image: 'https://images.unsplash.com/photo-1624222247344-550fb60fe8ff?w=600&q=80', category: 'Accessories',     link: '#', status: 'active', clicks: 20,  popular: true  },
    { id: 's5',  name: 'Air Jordan 1 Retro',        price: 89.99,  currency: 'PLN', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',  category: 'Shoes',           link: '#', status: 'active', clicks: 120, popular: true  },
    { id: 's6',  name: 'Supreme Box Logo Hoodie',   price: 64.50,  currency: 'PLN', image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80', category: 'Hoodies',         link: '#', status: 'active', clicks: 88,  popular: false },
    { id: 's7',  name: 'Balenciaga Track Sneakers', price: 112.00, currency: 'PLN', image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80', category: 'Shoes',           link: '#', status: 'active', clicks: 77,  popular: true  },
    { id: 's8',  name: 'Rolex Submariner',          price: 78.40,  currency: 'PLN', image: 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=600&q=80', category: 'Watches',         link: '#', status: 'active', clicks: 43,  popular: false },
    { id: 's9',  name: 'Stone Island Jacket',       price: 134.00, currency: 'PLN', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80', category: 'Jackets',         link: '#', status: 'active', clicks: 56,  popular: true  },
    { id: 's10', name: 'Essentials Hoodie',         price: 38.90,  currency: 'PLN', image: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80',  category: 'Hoodies',         link: '#', status: 'active', clicks: 99,  popular: true  },
    { id: 's11', name: 'New Balance 550',           price: 72.00,  currency: 'PLN', image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80', category: 'Shoes',           link: '#', status: 'active', clicks: 61,  popular: false },
    { id: 's12', name: 'Gucci Cap',                 price: 44.20,  currency: 'PLN', image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600&q=80', category: 'Accessories',     link: '#', status: 'active', clicks: 37,  popular: true  },
    { id: 's13', name: 'Off-White T-Shirt',         price: 29.99,  currency: 'PLN', image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80', category: 'T-shirts',        link: '#', status: 'active', clicks: 52,  popular: true  },
    { id: 's14', name: 'Carhartt WIP Pants',        price: 55.00,  currency: 'PLN', image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80', category: 'Pants',           link: '#', status: 'active', clicks: 28,  popular: false },
    { id: 's15', name: 'Bape Shark Hoodie',         price: 95.00,  currency: 'PLN', image: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600&q=80', category: 'Hoodies',         link: '#', status: 'active', clicks: 110, popular: true  },
    { id: 's16', name: 'Nike Tech Fleece Shorts',   price: 24.50,  currency: 'PLN', image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80', category: 'Shorts',          link: '#', status: 'active', clicks: 45,  popular: false },
    { id: 's17', name: 'Dior Saddle Bag',           price: 168.00, currency: 'PLN', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80',  category: 'Bags & Backpacks',link: '#', status: 'active', clicks: 33,  popular: true  },
    { id: 's18', name: 'Adidas Yeezy Foam RNR',     price: 67.00,  currency: 'PLN', image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&q=80', category: 'Shoes',           link: '#', status: 'active', clicks: 89,  popular: true  },
    { id: 's19', name: 'Chrome Hearts Ring',        price: 31.00,  currency: 'PLN', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80', category: 'Accessories',     link: '#', status: 'active', clicks: 19,  popular: false },
    { id: 's20', name: 'Moncler Grenoble Jacket',   price: 245.00, currency: 'PLN', image: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=600&q=80',  category: 'Jackets',         link: '#', status: 'active', clicks: 71,  popular: true  },
    { id: 's21', name: 'Stussy 8-Ball Tee',         price: 22.00,  currency: 'PLN', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80', category: 'T-shirts',        link: '#', status: 'active', clicks: 48,  popular: false },
    { id: 's22', name: 'Palace Tri-Ferg Shorts',    price: 34.00,  currency: 'PLN', image: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=600&q=80', category: 'Shorts',          link: '#', status: 'active', clicks: 26,  popular: false },
    { id: 's23', name: 'Patek Philippe Calatrava',  price: 119.00, currency: 'PLN', image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=80', category: 'Watches',         link: '#', status: 'active', clicks: 55,  popular: true  },
    { id: 's24', name: 'North Face Nuptse Jacket',  price: 88.00,  currency: 'PLN', image: 'https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=600&q=80',  category: 'Jackets',         link: '#', status: 'active', clicks: 64,  popular: true  },
];

// =========================================
// INFINITY SCROLL ENGINE
// =========================================
const CARDS_PER_PAGE = 8;
let _infinityProducts = [];  // aktualnie przefiltrowane produkty
let _infinityPage     = 0;   // ile stron już załadowano
let _infinityLoading  = false;
let _infinityObserver = null;

function _getCardStartIndex() {
    return _infinityPage * CARDS_PER_PAGE;
}

/** Animuje karty które właśnie weszły do DOM */
function _animateNewCards(cards) {
    cards.forEach((card, i) => {
        // global index = już istniejące + i
        const globalIdx = _getCardStartIndex() - CARDS_PER_PAGE + i;
        card.style.setProperty('--card-i', Math.min(i, 7)); // max delay = 7*55ms = 385ms
        // reflow żeby animacja faktycznie odpalila
        void card.offsetWidth;
        card.classList.add('card-visible');
    });
}

/** Ładuje kolejną stronę kart do gridu */
function _loadNextPage() {
    if (_infinityLoading) return;
    const start = _infinityPage * CARDS_PER_PAGE;
    if (start >= _infinityProducts.length) {
        // Koniec — ukryj loader
        const loader = document.getElementById('products-loader');
        if (loader) loader.classList.add('hidden');
        return;
    }

    _infinityLoading = true;
    const loader = document.getElementById('products-loader');
    if (loader) loader.classList.remove('hidden');

    // Symulacja małego opóźnienia sieciowego (100ms) — daje efekt "ładowania"
    setTimeout(() => {
        const grid  = document.getElementById('products-grid');
        if (!grid) { _infinityLoading = false; return; }

        const slice = _infinityProducts.slice(start, start + CARDS_PER_PAGE);
        const newCards = slice.map(p => buildProductCard(p));

        newCards.forEach(c => grid.appendChild(c));
        _animateNewCards(newCards);

        _infinityPage++;
        _infinityLoading = false;

        if (loader) loader.classList.add('hidden');

        // Jeśli załadowaliśmy wszystko — odłącz observer
        if (_infinityPage * CARDS_PER_PAGE >= _infinityProducts.length) {
            if (_infinityObserver) {
                const sentinel = document.getElementById('scroll-sentinel');
                if (sentinel) _infinityObserver.unobserve(sentinel);
            }
        }
    }, 120);
}

/** Inicjalizuje infinity scroll z podaną listą produktów */
function initInfinityScroll(products) {
    _infinityProducts = products;
    _infinityPage     = 0;
    _infinityLoading  = false;

    const grid = document.getElementById('products-grid');
    if (grid) grid.innerHTML = '';

    // Odłącz stary observer
    if (_infinityObserver) {
        _infinityObserver.disconnect();
        _infinityObserver = null;
    }

    // Ładuj pierwszą stronę
    _loadNextPage();

    // Ustaw IntersectionObserver na sentinel
    const sentinel = document.getElementById('scroll-sentinel');
    if (!sentinel) return;

    _infinityObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) _loadNextPage();
        });
    }, { rootMargin: '200px' }); // triggeruj 200px przed końcem

    _infinityObserver.observe(sentinel);
}

// Shared card builder

// Shared card builder
function buildProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    const popularBadge = product.popular
        ? `<span class="product-card__badge-popular"><i class="fa-solid fa-fire"></i> Popular</span>` : '';
    const catBadge = product.category
        ? `<span class="product-card__badge-cat">${product.category}</span>` : '';
    const imgSrc = product.image || 'https://via.placeholder.com/400x600/0f0f0f/555?text=No+Image';
    const currency = product.currency || 'PLN';
    const priceFormatted = parseFloat(product.price).toFixed(2);
    const views = product.clicks || 0;
    card.innerHTML = `
        <div class="product-card__img-wrap">
            <img src="${imgSrc}" alt="${product.name}" loading="lazy">
            ${popularBadge}
            ${catBadge}
        </div>
        <div class="product-card__body">
            <div class="product-card__cat-label">${product.category || ''}</div>
            <div class="product-card__name">${product.name}</div>
            <div class="product-card__bottom-row">
                <div class="product-card__price">${priceFormatted} ${currency}</div>
                <div class="product-card__meta">
                    <span><i class="fa-regular fa-eye"></i> ${views}</span>
                    <span><i class="fa-regular fa-heart"></i> 0</span>
                </div>
            </div>
            <a href="${product.link || '#'}" target="_blank" class="product-card__btn" onclick="incrementClicks('${product.id}')">
                See agents
            </a>
        </div>
    `;
    return card;
}

// Filter products grid by category
function filterProductsGrid(cat) {
    const all = getProducts().length > 0 ? getProducts() : SAMPLE_PRODUCTS;
    const filtered = (!cat || cat === 'All')
        ? all
        : all.filter(p => p.category === cat);
    initInfinityScroll(filtered);
}

// Load Products Grid on Main Page
function loadProductsGrid() {
    const all = getProducts().length > 0 ? getProducts() : SAMPLE_PRODUCTS;
    initInfinityScroll(all);
}

// Increment Clicks
function incrementClicks(id) {
    const products = getProducts();
    // id may be number or string — compare loosely
    const product = products.find(p => p.id == id);
    if (product) {
        product.clicks++;
        saveProducts(products);
    }
}

// Toggle Favorite (placeholder)
function toggleFavorite(id) {
    showToast('Dodano do ulubionych!', 'success');
}

// Initialize - Load products when admin panel is visible
document.addEventListener('DOMContentLoaded', () => {
    // Load products grid on page load
    loadProductsGrid();
    
    // Load admin products if admin panel is visible
    if (document.getElementById('admin-panel') && !document.getElementById('admin-panel').classList.contains('hidden')) {
        loadAdminProducts();
    }
});

// CSS Animations for Toast
const toastStyles = document.createElement('style');
toastStyles.textContent = `
@keyframes slideIn {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(400px);
        opacity: 0;
    }
}
`;
document.head.appendChild(toastStyles);


// =========================================
// INTERACTIVE LINE CHART LOGIC
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    const chartPoints = document.querySelectorAll('.chart-point');
    const tooltip = document.getElementById('chart-tooltip');
    
    if (!chartPoints.length || !tooltip) return;
    
    chartPoints.forEach(point => {
        point.addEventListener('mouseenter', (e) => {
            // Get data from point
            const day = point.getAttribute('data-day');
            const visits = point.getAttribute('data-visits');
            const users = point.getAttribute('data-users');
            const products = point.getAttribute('data-products');
            
            // Update tooltip content
            tooltip.querySelector('.tooltip-day').textContent = day;
            tooltip.querySelector('.visits-value').textContent = visits;
            tooltip.querySelector('.users-value').textContent = users;
            tooltip.querySelector('.products-value').textContent = products;
            
            // Position tooltip near the point
            const pointRect = e.target.getBoundingClientRect();
            const chartContainer = document.querySelector('.line-chart-container');
            const containerRect = chartContainer.getBoundingClientRect();
            
            // Calculate position relative to container
            const leftPos = pointRect.left - containerRect.left + (pointRect.width / 2);
            const topPos = pointRect.top - containerRect.top - 10;
            
            tooltip.style.left = leftPos + 'px';
            tooltip.style.top = topPos + 'px';
            tooltip.style.transform = 'translate(-50%, -100%)';
            
            // Show tooltip
            tooltip.classList.remove('hidden');
        });
        
        point.addEventListener('mouseleave', () => {
            // Hide tooltip
            tooltip.classList.add('hidden');
        });
    });
});


// =========================================
// PRODUCTS VIEW — dropdown & search
// Czyste event delegation, zero init guards
// =========================================

document.addEventListener('DOMContentLoaded', () => {
    // ---- Category dropdown toggle ----
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#pv-cat-btn');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            const dd = document.getElementById('pv-cat-dropdown');
            if (dd) dd.classList.toggle('open');
            return;
        }

        // ---- Drop item click ----
        const item = e.target.closest('#pv-cat-dropdown .pv-drop-item');
        if (item) {
            e.stopPropagation();
            const dd    = document.getElementById('pv-cat-dropdown');
            const label = document.getElementById('pv-cat-label');
            dd.querySelectorAll('.pv-drop-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const sp = item.querySelector('span');
            if (label && sp) label.textContent = sp.textContent.trim();
            dd.classList.remove('open');
            filterProductsGrid(item.getAttribute('data-cat'));
            return;
        }

        // ---- Pill filter ----
        const pill = e.target.closest('.pv-filter-pill');
        if (pill) {
            document.querySelectorAll('.pv-filter-pill').forEach(b => b.classList.remove('active'));
            pill.classList.add('active');
            filterProductsGrid(pill.getAttribute('data-cat'));
            return;
        }

        // ---- Close dropdown on outside click ----
        const dd = document.getElementById('pv-cat-dropdown');
        if (dd && !dd.contains(e.target)) dd.classList.remove('open');
    });

    // ---- Search inside dropdown (stop propagation) ----
    document.addEventListener('click', (e) => {
        if (e.target.closest('.pv-drop-search-wrap')) e.stopPropagation();
    });
    document.addEventListener('input', (e) => {
        if (!e.target.classList.contains('pv-drop-search')) return;
        const q  = e.target.value.toLowerCase();
        const dd = document.getElementById('pv-cat-dropdown');
        if (!dd) return;
        dd.querySelectorAll('.pv-drop-item').forEach(it => {
            const sp = it.querySelector('span');
            it.style.display = sp && sp.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    });

    // ---- Main search bar ----
    document.addEventListener('input', (e) => {
        if (e.target.id !== 'products-search') return;
        const q   = e.target.value.toLowerCase().trim();
        const all = getProducts().length > 0 ? getProducts() : SAMPLE_PRODUCTS;
        initInfinityScroll(q ? all.filter(p =>
            p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
        ) : all);
    });
});


// =========================================
// TOOL VIEWS — animacja wejścia
// =========================================
(function() {
    // Patch showView żeby dodawała animację do tool-view
    const _origShowView = window.showView;
    // Używamy MutationObserver lub po prostu nadpisujemy data-view listener
    document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-view]');
        if (!link) return;
        const viewId = link.getAttribute('data-view');
        const view = document.getElementById(viewId);
        if (view && view.classList.contains('tool-view')) {
            setTimeout(() => {
                view.classList.remove('tool-animate');
                void view.offsetWidth;
                view.classList.add('tool-animate');
            }, 10);
        }
    });

    // Animacja przy kliknięciu Eksploruj (products-view)
    // już obsługiwana w hero-explore-btn listener
})();

// =========================================
// LINK CONVERTER — logika (oparty na REUSABLE_MODULES/converter)
// =========================================

// --- Funkcje konwersji (port z converter.js) ---
function _conv_detectPlatform(url) {
    const v = String(url || '').toLowerCase();
    if (!v) return 'auto';
    if (v.includes('weidian.com'))   return 'weidian';
    if (v.includes('kakobuy.com'))   return 'kakobuy';
    if (v.includes('usfans.com'))    return 'usfans';
    if (v.includes('acbuy.com') || v.includes('allchinabuy.com')) return 'allchinabuy';
    if (v.includes('litbuy.com'))    return 'litbuy';
    if (v.includes('mulebuy.com'))   return 'mulebuy';
    if (v.includes('oopbuy.com'))    return 'oopbuy';
    if (v.includes('gtbuy.com'))     return 'gtbuy';
    if (v.includes('hipobuy.com'))   return 'hipobuy';
    if (v.includes('taobao.com') || v.includes('tmall.com')) return 'taobao';
    if (v.includes('1688.com'))      return '1688';
    return 'unknown';
}

function _conv_safeUrl(value) {
    try { return new URL(value); } catch { return null; }
}

function _conv_deepDecode(value, rounds = 4) {
    let result = String(value || '');
    for (let i = 0; i < rounds; i++) {
        try {
            const decoded = decodeURIComponent(result);
            if (decoded === result) break;
            result = decoded;
        } catch { break; }
    }
    return result;
}

function _conv_normalizeUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(raw)) return `https://${raw}`;
    return raw;
}

function _conv_extractWeidianItemId(url) {
    const safe = _conv_safeUrl(url);
    if (safe) {
        const itemId = safe.searchParams.get('itemID') || safe.searchParams.get('itemId') || safe.searchParams.get('id');
        if (itemId && /^\d+$/.test(itemId)) return itemId;
    }
    const match = String(url || '').match(/itemID(?:%3D|=)(\d+)/i);
    return match ? match[1] : '';
}

function _conv_extractTaobaoItemId(url) {
    const safe = _conv_safeUrl(url);
    if (safe) {
        const id = safe.searchParams.get('id');
        if (id && /^\d+$/.test(id)) return id;
    }
    const match = String(url || '').match(/[?&]id=(\d+)/i);
    return match ? match[1] : '';
}

function _conv_extract1688ItemId(url) {
    const match = String(url || '').match(/\/offer\/(\d+)\.html/i);
    return match ? match[1] : '';
}

function _conv_extractOriginalFromAgent(inputUrl) {
    const normalized = _conv_normalizeUrl(inputUrl);
    const url = _conv_safeUrl(normalized);
    if (!url) return normalized;
    const candidateKeys = ['url', 'itemUrl', 'goodsUrl', 'link', 'target', 'redirect'];
    for (const key of candidateKeys) {
        const value = url.searchParams.get(key);
        if (!value) continue;
        const deep = _conv_deepDecode(value);
        const norm = _conv_normalizeUrl(deep);
        if (norm.startsWith('http')) return norm;
    }
    return normalized;
}

function _conv_buildWeidianUrl(itemId) {
    return `https://weidian.com/item.html?itemID=${itemId}`;
}

function _conv_analyzeInput(rawUrl) {
    const cleaned = _conv_normalizeUrl(rawUrl);
    if (!cleaned) return { platform: 'unknown', originalUrl: '', itemId: '', source: 'unknown' };

    const platform = _conv_detectPlatform(cleaned);

    if (platform === 'weidian') {
        const itemId = _conv_extractWeidianItemId(cleaned);
        return { platform, originalUrl: itemId ? _conv_buildWeidianUrl(itemId) : cleaned, itemId, source: 'weidian' };
    }
    if (platform === 'taobao') {
        const itemId = _conv_extractTaobaoItemId(cleaned);
        return { platform, originalUrl: cleaned, itemId, source: 'taobao' };
    }
    if (platform === '1688') {
        const itemId = _conv_extract1688ItemId(cleaned);
        return { platform, originalUrl: cleaned, itemId, source: '1688' };
    }
    // Agent links — wyciągnij oryginalny URL
    if (['kakobuy','usfans','allchinabuy','litbuy','mulebuy','oopbuy','gtbuy','hipobuy'].includes(platform)) {
        const original = _conv_extractOriginalFromAgent(cleaned);
        const itemId   = _conv_extractWeidianItemId(original) || _conv_extractTaobaoItemId(original);
        return { platform, originalUrl: original, itemId, source: _conv_detectPlatform(original) };
    }
    // Nieznane — traktuj jako raw URL
    return { platform: 'unknown', originalUrl: cleaned, itemId: _conv_extractWeidianItemId(cleaned), source: 'unknown' };
}

function _conv_buildResult(analysis, target) {
    const { itemId, originalUrl, source } = analysis;
    if (!originalUrl) return '';

    // Jeśli target to raw link — zwróć oryginalny URL
    if (!target || target === 'raw') return originalUrl;

    // Dla weidian — użyj itemID gdzie możliwe
    if (source === 'weidian' && itemId) {
        const wdUrl = _conv_buildWeidianUrl(itemId);
        switch (target) {
            case 'litbuy':      return `https://www.litbuy.com/item/details?url=${encodeURIComponent(wdUrl)}`;
            case 'kakobuy':     return `https://www.kakobuy.com/item/details?url=${encodeURIComponent(wdUrl)}&affcode=xfrostyy`;
            case 'usfans':      return `https://www.usfans.com/product/3/${itemId}`;
            case 'allchinabuy': return `https://www.acbuy.com/product/?id=${itemId}&source=WD`;
            case 'mulebuy':     return `https://mulebuy.com/product?id=${itemId}&platform=WEIDIAN`;
            case 'oopbuy':      return `https://oopbuy.com/product/weidian/${itemId}`;
            case 'gtbuy':       return `https://www.gtbuy.com/product/weidian/${itemId}`;
            case 'hipobuy':     return `https://hipobuy.com/product/weidian/${itemId}`;
            case 'wegobuy':     return `https://www.wegobuy.com/en/page/buy?from=search-input&url=${encodeURIComponent(wdUrl)}`;
            case 'acbuy':       return `https://www.acbuy.com/product/?id=${itemId}&source=WD`;
            default:            return `https://www.${target}.com/item/details?url=${encodeURIComponent(wdUrl)}`;
        }
    }

    // Fallback — URL-wrap dla agentów które to obsługują
    const encodedOriginal = encodeURIComponent(originalUrl);
    switch (target) {
        case 'litbuy':      return `https://www.litbuy.com/item/details?url=${encodedOriginal}`;
        case 'kakobuy':     return `https://www.kakobuy.com/item/details?url=${encodedOriginal}&affcode=xfrostyy`;
        case 'wegobuy':     return `https://www.wegobuy.com/en/page/buy?from=search-input&url=${encodedOriginal}`;
        case 'acbuy':       return `https://www.acbuy.com/item/details?url=${encodedOriginal}`;
        default:            return `https://www.${target}.com/item/details?url=${encodedOriginal}`;
    }
}

// --- Konfiguracja agentów ---
const CONVERTER_AGENTS = [
    { id: 'litbuy',      name: 'Litbuy',      abbr: 'LI' },
    { id: 'kakobuy',     name: 'Kakobuy',     abbr: 'KA' },
    { id: 'usfans',      name: 'Usfans',      abbr: 'US' },
    { id: 'acbuy',       name: 'Acbuy',       abbr: 'AC' },
    { id: 'wegobuy',     name: 'Wegobuy',     abbr: 'WG' },
    { id: 'mulebuy',     name: 'MuleBuy',     abbr: 'MU' },
    { id: 'oopbuy',      name: 'OopBuy',      abbr: 'OP' },
    { id: 'gtbuy',       name: 'GTBuy',       abbr: 'GT' },
    { id: 'hipobuy',     name: 'HipoBuy',     abbr: 'HI' },
    { id: 'allchinabuy', name: 'AllChinaBuy', abbr: 'CB' },
    { id: 'raw',         name: 'Raw Link',    abbr: 'RA' },
];

document.addEventListener('DOMContentLoaded', () => {

    const agentDropdown = document.getElementById('agent-dropdown');
    const agentBtn      = document.getElementById('agent-btn');
    const agentNameEl   = document.getElementById('agent-name');
    const agentAvatarEl = document.getElementById('agent-avatar');
    const agentMenu     = document.getElementById('agent-menu');

    let selectedAgentId = 'litbuy';

    // Zbuduj menu agentów dynamicznie
    if (agentMenu) {
        agentMenu.innerHTML = `<div class="agent-menu__label">SELECT AGENT</div>`;
        CONVERTER_AGENTS.forEach((agent, idx) => {
            const btn = document.createElement('button');
            btn.className = 'agent-item' + (idx === 0 ? ' active' : '');
            btn.setAttribute('data-agent', agent.id);
            btn.setAttribute('data-abbr', agent.abbr);
            btn.innerHTML = `<span class="agent-avatar">${agent.abbr}</span> ${agent.name} <i class="fa-solid fa-check agent-check"></i>`;
            agentMenu.appendChild(btn);
        });
    }

    // Toggle dropdown
    if (agentBtn) {
        agentBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (agentDropdown) agentDropdown.classList.toggle('open');
        });
    }

    // Wybór agenta + zamknięcie dropdowna
    document.addEventListener('click', (e) => {
        const item = e.target.closest('.agent-item');
        if (item && agentMenu && agentMenu.contains(item)) {
            agentMenu.querySelectorAll('.agent-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            selectedAgentId = item.getAttribute('data-agent');
            const abbr = item.getAttribute('data-abbr');
            const name = item.textContent.replace(/\s*\uf00c\s*/g, '').trim();
            if (agentNameEl)   agentNameEl.textContent   = item.querySelector('.agent-avatar') ? item.querySelector('.agent-avatar').nextSibling?.textContent?.trim() || '' : name;
            if (agentAvatarEl) agentAvatarEl.textContent = abbr;
            if (agentDropdown) agentDropdown.classList.remove('open');
            return;
        }
        if (agentDropdown && !agentDropdown.contains(e.target)) {
            agentDropdown.classList.remove('open');
        }
    });

    // Convert button
    const convertBtn         = document.getElementById('convert-btn');
    const converterInput     = document.getElementById('converter-input');
    const converterResult    = document.getElementById('converter-result');
    const converterResultUrl = document.getElementById('converter-result-url');
    const converterCopyBtn   = document.getElementById('converter-copy-btn');
    const converterOpenBtn   = document.getElementById('converter-open-btn');

    function doConvert() {
        if (!converterInput) return;
        const raw = converterInput.value.trim();
        if (!raw) { converterInput.focus(); return; }

        const analysis = _conv_analyzeInput(raw);
        const finalUrl = _conv_buildResult(analysis, selectedAgentId);

        if (!finalUrl) {
            if (converterResult) {
                converterResult.classList.remove('hidden');
                if (converterResultUrl) converterResultUrl.textContent = 'Nie można przetworzyć tego linku.';
            }
            return;
        }

        if (converterResultUrl) converterResultUrl.textContent = finalUrl;
        if (converterOpenBtn)   converterOpenBtn.href = finalUrl;
        if (converterResult)    converterResult.classList.remove('hidden');
    }

    if (convertBtn)     convertBtn.addEventListener('click', doConvert);
    if (converterInput) converterInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doConvert(); });

    if (converterCopyBtn) {
        converterCopyBtn.addEventListener('click', () => {
            const url = converterResultUrl ? converterResultUrl.textContent : '';
            if (!url || url === 'Nie można przetworzyć tego linku.') return;
            navigator.clipboard.writeText(url).then(() => {
                converterCopyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                setTimeout(() => converterCopyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy', 2000);
            });
        });
    }

    // =========================================
    // QC FINDER — Picks.ly API
    // =========================================
    const qcBtn   = document.getElementById('qc-btn');
    const qcInput = document.getElementById('qc-input');

    function _qc_buildGallery(albums) {
        if (!albums || !albums.length) return null;

        // Zbierz wszystkie zdjęcia z wszystkich albumów
        const allImages = albums.flatMap(album => album.images || []).filter(Boolean);
        if (!allImages.length) return null;

        let currentQcIndex = 0;

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'width:100%;max-width:900px;margin:0 auto;padding:0 2rem 4rem;';

        // Licznik
        const counter = document.createElement('p');
        counter.style.cssText = 'text-align:center;font-size:0.8rem;color:rgba(255,255,255,0.35);margin-bottom:1.5rem;';
        counter.textContent = `Znaleziono ${allImages.length} zdjęć QC`;
        wrapper.appendChild(counter);

        // Grid zdjęć
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:0.75rem;';

        allImages.forEach((imgUrl, idx) => {
            const card = document.createElement('div');
            card.style.cssText = 'aspect-ratio:1/1;overflow:hidden;border-radius:12px;background:#111;border:1px solid rgba(255,255,255,0.07);cursor:pointer;';

            const img = document.createElement('img');
            img.src = imgUrl;
            img.alt = `QC ${idx + 1}`;
            img.loading = 'lazy';
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease;';
            img.onerror = () => { card.style.display = 'none'; };
            card.addEventListener('mouseenter', () => { img.style.transform = 'scale(1.05)'; });
            card.addEventListener('mouseleave', () => { img.style.transform = 'scale(1)'; });
            card.addEventListener('click', () => _qc_openLightbox(allImages, idx));

            card.appendChild(img);
            grid.appendChild(card);
        });
        wrapper.appendChild(grid);
        return wrapper;
    }

    // Lightbox
    function _qc_openLightbox(images, startIndex) {
        let idx = startIndex;
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);backdrop-filter:blur(8px);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;';

        const close = document.createElement('button');
        close.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        close.style.cssText = 'position:absolute;top:1.5rem;right:1.5rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);color:#fff;width:40px;height:40px;border-radius:10px;font-size:1.1rem;cursor:pointer;';
        close.addEventListener('click', () => document.body.removeChild(overlay));
        overlay.appendChild(close);

        const imgEl = document.createElement('img');
        imgEl.style.cssText = 'max-width:90vw;max-height:80vh;object-fit:contain;border-radius:12px;user-select:none;';
        overlay.appendChild(imgEl);

        const nav = document.createElement('div');
        nav.style.cssText = 'display:flex;align-items:center;gap:1.5rem;margin-top:1.5rem;';

        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        prevBtn.style.cssText = 'background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);color:#fff;width:40px;height:40px;border-radius:10px;font-size:1rem;cursor:pointer;';

        const info = document.createElement('span');
        info.style.cssText = 'color:rgba(255,255,255,0.5);font-size:0.85rem;min-width:60px;text-align:center;';

        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        nextBtn.style.cssText = 'background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);color:#fff;width:40px;height:40px;border-radius:10px;font-size:1rem;cursor:pointer;';

        function update() {
            imgEl.src = images[idx];
            info.textContent = `${idx + 1} / ${images.length}`;
            prevBtn.style.opacity = idx === 0 ? '0.3' : '1';
            nextBtn.style.opacity = idx === images.length - 1 ? '0.3' : '1';
        }

        prevBtn.addEventListener('click', () => { if (idx > 0) { idx--; update(); } });
        nextBtn.addEventListener('click', () => { if (idx < images.length - 1) { idx++; update(); } });

        // Swipe support
        let touchStartX = 0;
        overlay.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
        overlay.addEventListener('touchend', e => {
            const delta = e.changedTouches[0].clientX - touchStartX;
            if (delta > 50 && idx > 0) { idx--; update(); }
            if (delta < -50 && idx < images.length - 1) { idx++; update(); }
        });

        // Keyboard support
        const keyHandler = (e) => {
            if (e.key === 'ArrowLeft'  && idx > 0) { idx--; update(); }
            if (e.key === 'ArrowRight' && idx < images.length - 1) { idx++; update(); }
            if (e.key === 'Escape') { document.body.removeChild(overlay); document.removeEventListener('keydown', keyHandler); }
        };
        document.addEventListener('keydown', keyHandler);
        overlay.addEventListener('click', e => { if (e.target === overlay) { document.body.removeChild(overlay); document.removeEventListener('keydown', keyHandler); } });

        nav.appendChild(prevBtn);
        nav.appendChild(info);
        nav.appendChild(nextBtn);
        overlay.appendChild(nav);

        document.body.appendChild(overlay);
        update();
    }

    async function doQcSearch() {
        if (!qcInput) return;
        const url = qcInput.value.trim();
        if (!url) { qcInput.focus(); return; }

        const placeholder = document.getElementById('qc-placeholder');
        const results     = document.getElementById('qc-results');
        if (!results) return;

        // Pokaż loading
        if (placeholder) placeholder.style.display = 'none';
        results.classList.remove('hidden');
        results.innerHTML = `
            <div style="text-align:center;padding:3rem;color:rgba(255,255,255,0.4);">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;margin-bottom:1rem;display:block;"></i>
                Szukam zdjęć QC...
            </div>`;

        try {
            // Wyczyść URL z parametrów agentów (wyciągnij oryginalny link)
            const analysis = _conv_analyzeInput(url);
            const cleanUrl = analysis.originalUrl || url;

            const apiUrl = `https://partner.picks.ly/api/qc/search?url=${encodeURIComponent(cleanUrl)}`;
            const resp = await fetch(apiUrl, {
                headers: { 'Accept': 'application/json' }
            });

            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();

            if (!data.success || !data.albums || !data.albums.length) {
                results.innerHTML = `
                    <div style="text-align:center;padding:3rem;color:rgba(255,255,255,0.3);">
                        <span style="font-size:2rem;display:block;margin-bottom:1rem;">📷</span>
                        Nie znaleziono zdjęć QC dla tego produktu.
                    </div>`;
                return;
            }

            results.innerHTML = '';
            const gallery = _qc_buildGallery(data.albums);
            if (gallery) {
                results.appendChild(gallery);
            } else {
                results.innerHTML = `<div style="text-align:center;padding:3rem;color:rgba(255,255,255,0.3);">Brak zdjęć w odpowiedzi API.</div>`;
            }

        } catch (err) {
            console.error('QC Search error:', err);
            results.innerHTML = `
                <div style="text-align:center;padding:3rem;color:rgba(255,255,255,0.3);">
                    <span style="font-size:2rem;display:block;margin-bottom:1rem;">⚠️</span>
                    <strong style="color:rgba(255,255,255,0.6);">Błąd połączenia z API QC</strong><br>
                    <small style="margin-top:0.5rem;display:block;">Sprawdź czy link jest poprawny i spróbuj ponownie.</small>
                </div>`;
        }
    }

    if (qcBtn)   qcBtn.addEventListener('click', doQcSearch);
    if (qcInput) qcInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doQcSearch(); });
});


// =========================================
// SCROLL REVEAL — IntersectionObserver
// =========================================
(function initScrollReveal() {
    if (!('IntersectionObserver' in window)) {
        // fallback — pokaż wszystko natychmiast
        document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('in-view'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0,
        rootMargin: '0px 0px -40px 0px' // trigger lekko przed dolną krawędzią
    });

    // Obserwuj wszystkie elementy z data-reveal
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));

    // Re-observe gdy nowe elementy wejdą do DOM (np. po zmianie widoku)
    const mutObs = new MutationObserver(() => {
        document.querySelectorAll('[data-reveal]:not(.in-view)').forEach(el => {
            observer.observe(el);
        });
    });
    mutObs.observe(document.body, { childList: true, subtree: true });
})();


// =========================================
// NAV — aktywne stany + Produkty link
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    const navProductsBtn = document.getElementById('nav-products-btn');
    if (navProductsBtn) {
        navProductsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.showView('products-view');
            loadProductsGrid();
            setNavActive('products');
        });
    }

    const heroSellerBtn = document.getElementById('nav-sellers-hero-btn');
    if (heroSellerBtn) {
        heroSellerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.showView('sellers-view');
            setNavActive('sellers');
        });
    }

    const footerHome     = document.getElementById('footer-home-btn');
    const footerProducts = document.getElementById('footer-products-btn');
    const footerSellers  = document.getElementById('footer-sellers-btn');
    if (footerHome)     footerHome.addEventListener('click',     e => { e.preventDefault(); window.showView('home-view');     setNavActive('home'); });
    if (footerProducts) footerProducts.addEventListener('click', e => { e.preventDefault(); window.showView('products-view'); loadProductsGrid(); setNavActive('products'); });
    if (footerSellers)  footerSellers.addEventListener('click',  e => { e.preventDefault(); window.showView('sellers-view');  loadSellersGrid();  setNavActive('sellers'); });

    const navSellersBtn = document.getElementById('nav-sellers-btn');
    if (navSellersBtn) navSellersBtn.addEventListener('click', () => { setNavActive('sellers'); loadSellersGrid(); });

    // init footer visibility
    const footer = document.getElementById('site-footer');
    if (footer) footer.style.display = 'block'; // home is active on load
});

function setNavActive(view) {
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('nav-active'));
    const map = { 'home': 'nav-home-btn', 'products': 'nav-products-btn', 'sellers': 'nav-sellers-btn' };
    if (map[view]) {
        const el = document.getElementById(map[view]);
        if (el) el.classList.add('nav-active');
    }
}

// =========================================
// SELLERS — localStorage CRUD
// =========================================
function getSellers() {
    try { return JSON.parse(localStorage.getItem('custom_sellers') || '[]'); }
    catch { return []; }
}
function saveSellers(arr) {
    localStorage.setItem('custom_sellers', JSON.stringify(arr));
}

function buildSellerCard(seller) {
    const initial = (seller.name || '?')[0].toUpperCase();
    const brandsArr = (seller.brands || '').split(',').map(b => b.trim()).filter(Boolean);
    const tagsHtml = brandsArr.slice(0,4).map(b =>
        `<span class="seller-tag-premium">${b}</span>`
    ).join('');
    const card = document.createElement('div');
    card.className = 'seller-card-premium';
    card.setAttribute('data-brands', seller.brands || '');
    card.setAttribute('data-seller-id', seller.id);
    card.innerHTML = `
        <div class="seller-header">
            <div class="seller-avatar-initial">${initial}</div>
            <div class="seller-info">
                <h3>${seller.name} <span class="top-rated-star"><i class="fa-solid fa-star"></i> Top rated</span></h3>
            </div>
        </div>
        <p class="seller-desc">${seller.desc || ''}</p>
        <div class="seller-tags-premium">${tagsHtml}</div>
        <a href="${seller.link || '#'}" target="_blank" class="seller-btn-premium">Odwiedź Sklep</a>
    `;
    return card;
}

function loadSellersGrid() {
    const custom = getSellers();
    if (!custom.length) return;
    const grid = document.getElementById('sellers-grid');
    if (!grid) return;
    // usuń stare custom karty
    grid.querySelectorAll('[data-seller-id]').forEach(c => c.remove());
    // dodaj nowe na początku
    custom.forEach(seller => {
        const card = buildSellerCard(seller);
        grid.insertBefore(card, grid.firstChild);
    });
}

function adminAddSeller(e) {
    e.preventDefault();
    const name   = document.getElementById('seller-name').value.trim();
    const desc   = document.getElementById('seller-desc-input').value.trim();
    const brands = document.getElementById('seller-brands').value.trim();
    const link   = document.getElementById('seller-link').value.trim();
    if (!name) return;
    const sellers = getSellers();
    const newSeller = { id: Date.now(), name, desc, brands, link };
    sellers.unshift(newSeller);
    saveSellers(sellers);
    document.getElementById('add-seller-modal').classList.add('hidden');
    document.getElementById('add-seller-form').reset();
    loadAdminSellers();
    loadSellersGrid();
    showToast('Sprzedawca dodany!', 'success');
}

function deleteAdminSeller(id) {
    if (!confirm('Usunąć tego sprzedawcę?')) return;
    const sellers = getSellers().filter(s => s.id != id);
    saveSellers(sellers);
    loadAdminSellers();
    // odświeżamy kartę w sellers-view
    document.querySelectorAll(`[data-seller-id="${id}"]`).forEach(el => el.remove());
    showToast('Sprzedawca usunięty', 'success');
}

function loadAdminSellers() {
    const tbody = document.getElementById('admin-sellers-tbody');
    if (!tbody) return;
    const sellers = getSellers();
    if (!sellers.length) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--text-muted)">Brak dodanych sprzedawców. Kliknij "Dodaj Sprzedawcę".</td></tr>`;
        return;
    }
    tbody.innerHTML = '';
    sellers.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong style="color:#fff">${s.name}</strong><br><small style="color:rgba(255,255,255,0.4)">${s.desc?.slice(0,50)}...</small></td>
            <td style="color:rgba(255,255,255,0.5);font-size:0.8rem">${(s.brands||'').slice(0,40)}</td>
            <td><a href="${s.link}" target="_blank" style="color:rgba(255,255,255,0.4);font-size:0.8rem;word-break:break-all">${s.link?.slice(0,30)}...</a></td>
            <td>
                <button class="action-btn delete" onclick="deleteAdminSeller(${s.id})" title="Usuń"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Admin sellers init
document.addEventListener('DOMContentLoaded', () => {
    // Open/close modal
    const openBtn  = document.getElementById('open-add-seller-btn');
    const closeBtn = document.getElementById('close-add-seller');
    if (openBtn)  openBtn.addEventListener('click', () => document.getElementById('add-seller-modal').classList.remove('hidden'));
    if (closeBtn) closeBtn.addEventListener('click', () => document.getElementById('add-seller-modal').classList.add('hidden'));

    // Admin sellers search
    const adminSearch = document.getElementById('admin-sellers-search');
    if (adminSearch) {
        adminSearch.addEventListener('input', () => {
            const q = adminSearch.value.toLowerCase();
            document.querySelectorAll('#admin-sellers-tbody tr').forEach(tr => {
                tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
            });
        });
    }

    // Load sellers grid on sellers-view open
    loadSellersGrid();
});

// Patch admin panel view switching to load sellers
const _origAdminLinks = document.querySelectorAll('.admin-link');


// =========================================
// PREFERENCES MODAL
// =========================================
document.addEventListener('DOMContentLoaded', () => {

    // Toggle sub-panels on row click
    ['currency', 'lang', 'agent'].forEach(key => {
        const row = document.getElementById(`pref-${key}-row`);
        const sub = document.getElementById(`pref-${key}-sub`);
        if (!row || !sub) return;
        row.addEventListener('click', () => {
            const isOpen = !sub.classList.contains('hidden');
            // close all
            document.querySelectorAll('.pref-sub').forEach(s => s.classList.add('hidden'));
            document.querySelectorAll('.pref-row').forEach(r => r.classList.remove('open'));
            if (!isOpen) {
                sub.classList.remove('hidden');
                row.classList.add('open');
            }
        });
    });

    // Sub-item selection
    document.addEventListener('click', (e) => {
        const item = e.target.closest('.pref-sub-item');
        if (!item) return;
        const pref = item.getAttribute('data-pref');
        const val  = item.getAttribute('data-val');

        // update active
        item.closest('.pref-sub').querySelectorAll('.pref-sub-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // update row value
        const valEl = document.getElementById(`pref-${pref}-val`);
        if (valEl) valEl.textContent = val;

        // agent avatar
        if (pref === 'agent') {
            const abbr = item.getAttribute('data-abbr');
            const avatar = document.getElementById('pref-agent-avatar');
            if (avatar && abbr) avatar.textContent = abbr;
            // save globally for converter
            window._selectedAgentUrl = item.getAttribute('data-url') || '';
        }

        // language
        if (pref === 'lang') {
            const lang = item.getAttribute('data-lang');
            if (lang && typeof translatePage === 'function') translatePage(lang);
        }

        // save to localStorage
        localStorage.setItem(`pref_${pref}`, val);

        // close sub after short delay
        setTimeout(() => {
            item.closest('.pref-sub').classList.add('hidden');
            document.querySelectorAll('.pref-row').forEach(r => r.classList.remove('open'));
        }, 250);
    });

    // Load saved prefs
    ['currency', 'lang', 'agent'].forEach(key => {
        const saved = localStorage.getItem(`pref_${key}`);
        if (!saved) return;
        const valEl = document.getElementById(`pref-${key}-val`);
        if (valEl) valEl.textContent = saved;
        // mark active
        const sub = document.getElementById(`pref-${key}-sub`);
        if (sub) {
            sub.querySelectorAll('.pref-sub-item').forEach(i => {
                i.classList.toggle('active', i.getAttribute('data-val') === saved);
            });
        }
        if (key === 'agent') {
            const activeItem = document.querySelector(`#pref-agent-sub .pref-sub-item.active`);
            if (activeItem) {
                const abbr = activeItem.getAttribute('data-abbr');
                const avatar = document.getElementById('pref-agent-avatar');
                if (avatar && abbr) avatar.textContent = abbr;
                window._selectedAgentUrl = activeItem.getAttribute('data-url') || '';
            }
        }
    });
});
