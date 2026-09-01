document.addEventListener('DOMContentLoaded', () => {
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

    // Helper function to normalize brand names (remove special chars, lowercase)
    function normalizeBrand(brand) {
        return brand.toLowerCase().trim()
            .replace(/['']/g, '')  // Remove apostrophes
            .replace(/[\s\-\.]/g, ''); // Remove spaces, hyphens, dots
    }

    function filterSellersByBrand(brand) {
        const cards = document.querySelectorAll('.seller-card-premium');
        const normalizedSearchBrand = normalizeBrand(brand);
        
        console.log('Filtering by brand:', brand, 'normalized:', normalizedSearchBrand);
        
        let visibleCount = 0;
        cards.forEach(card => {
            const cardBrands = card.getAttribute('data-brands') || '';
            
            // Show all if "Wszystkie"
            if (brand === 'Wszystkie') {
                card.style.display = '';
                card.style.visibility = 'visible';
                card.style.opacity = '1';
                card.style.position = 'relative';
                visibleCount++;
                return;
            }
            
            // Split brands by comma and normalize each
            const brandList = cardBrands.split(',').map(b => normalizeBrand(b));
            
            // Check if any brand matches EXACTLY (not partial match)
            const matches = brandList.some(b => b === normalizedSearchBrand);
            
            if (matches) {
                card.style.display = '';
                card.style.visibility = 'visible';
                card.style.opacity = '1';
                card.style.position = 'relative';
                visibleCount++;
                console.log('Showing card for:', brand);
            } else {
                card.style.display = 'none';
                card.style.visibility = 'hidden';
                card.style.opacity = '0';
                card.style.position = 'absolute';
            }
        });
        
        console.log('Visible cards:', visibleCount);
    }

    function filterSellersBySearch(query) {
        const cards = document.querySelectorAll('.seller-card-premium');
        const q = query.toLowerCase().trim();
        
        console.log('Searching for:', q);
        
        // Reset active tag to "Wszystkie" when searching
        if (q) {
            document.querySelectorAll('#sellers-view .sv-tag, #sellers-view .seller-tag')
                .forEach(t => t.classList.remove('active'));
            const wszystkieTag = Array.from(document.querySelectorAll('#sellers-view .sv-tag, #sellers-view .seller-tag'))
                .find(t => t.textContent.trim() === 'Wszystkie');
            if (wszystkieTag) wszystkieTag.classList.add('active');
        }
        
        let visibleCount = 0;
        cards.forEach(card => {
            if (!q) {
                card.style.display = '';
                card.style.visibility = 'visible';
                card.style.opacity = '1';
                card.style.position = 'relative';
                visibleCount++;
                return;
            }
            
            const name   = (card.querySelector('.seller-info h3')?.textContent || '').toLowerCase();
            const brands = (card.getAttribute('data-brands') || '').toLowerCase();
            const desc   = (card.querySelector('.seller-desc')?.textContent || '').toLowerCase();
            
            const matches = name.includes(q) || brands.includes(q) || desc.includes(q);
            
            if (matches) {
                card.style.display = '';
                card.style.visibility = 'visible';
                card.style.opacity = '1';
                card.style.position = 'relative';
                visibleCount++;
            } else {
                card.style.display = 'none';
                card.style.visibility = 'hidden';
                card.style.opacity = '0';
                card.style.position = 'absolute';
            }
        });
        
        console.log('Search results:', visibleCount, 'cards');
    }

    // Tag click — event delegation
    document.addEventListener('click', (e) => {
        const tag = e.target.closest('#sellers-view .sv-tag, #sellers-view .seller-tag');
        if (!tag) return;
        
        console.log('Tag clicked:', tag.textContent.trim());
        
        // Clear search when clicking tag
        const searchInput = document.querySelector('#sellers-view .sellers-search-input');
        if (searchInput) searchInput.value = '';
        
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
    
    // Function to get translated typewriter texts
    function getTypewriterTexts() {
        if (typeof t === 'function') {
            return [
                t('typewriter.1'),
                t('typewriter.2'),
                t('typewriter.3')
            ];
        }
        // Fallback if translations not loaded yet
        return [
            "Najlepsze przedmioty z rzetelnymi recenzjami!",
            "Narzędzia, które podniosą Twoją wiedzę!",
            "Nowości ze świata Reps, których potrzebujesz"
        ];
    }
    
    let textsToType = getTypewriterTexts();
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
    
    // Update typewriter texts when language changes
    if (typeof window !== 'undefined') {
        window.addEventListener('languageChanged', () => {
            textsToType = getTypewriterTexts();
            // Reset to start with new language
            if (isDeleting) {
                // If currently deleting, let it finish and pick up new texts
                return;
            }
            // If at the start of a text, update immediately
            if (charIndex === 0) {
                textIndex = 0;
            }
        });
    }

    // Start the animation
    setTimeout(typeWriter, 1000);

    // Modal logic
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings');

    function toggleModal() {
        if (!settingsModal) return;
        const isHidden = settingsModal.classList.contains('hidden');
        
        if (isHidden) {
            // Otwieranie modala
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
            document.body.classList.add('modal-open');
            
            // Usuń klasę hidden żeby zaczęła się animacja
            settingsModal.classList.remove('hidden');
            
            // Force reflow żeby animacja zadziałała
            void settingsModal.offsetHeight;
        } else {
            // Zamykanie modala
            settingsModal.classList.add('hidden');
            
            // Odblokuj scrollowanie po zakończeniu animacji
            setTimeout(() => {
                document.body.classList.remove('modal-open');
                document.documentElement.style.setProperty('--scrollbar-width', '0px');
            }, 300);
        }
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
        const isHidden = loginModal.classList.contains('hidden');
        
        if (isHidden) {
            // Otwieranie modala
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
            document.body.classList.add('modal-open');
            
            loginModal.classList.remove('hidden');
            if (loginError) loginError.classList.add('hidden');
            if (loginForm) loginForm.reset();
        } else {
            // Zamykanie modala
            loginModal.classList.add('hidden');
            
            setTimeout(() => {
                document.body.classList.remove('modal-open');
                document.documentElement.style.setProperty('--scrollbar-width', '0px');
            }, 300);
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
            
            // Initialize admin event listeners (after panel is shown)
            initializeAdminEventListeners();
            
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
    }

    // =========================================
    // BULK SCRAPE LOGIC (Weidian)
    // =========================================
    
    const bulkScrapeBtn = document.getElementById('bulk-import-btn');
    const bulkScrapeModal = document.getElementById('bulk-scrape-modal');
    const closeBulkScrapeBtn = document.getElementById('close-bulk-scrape-modal');
    const bulkScrapeUrlsTextarea = document.getElementById('bulk-scrape-urls');
    const startBulkScrapeBtn = document.getElementById('start-bulk-scrape-btn');
    const bulkScrapeBatchSelect = document.getElementById('bulk-scrape-batch');
    const bulkScrapeConcurrencySelect = document.getElementById('bulk-scrape-concurrency');
    const bulkScrapePinCheckbox = document.getElementById('bulk-scrape-pin');
    const bulkScrapeProgress = document.getElementById('bulk-scrape-progress');
    const bulkScrapeProgressBar = document.getElementById('bulk-scrape-progress-bar');
    const bulkScrapeStatus = document.getElementById('bulk-scrape-status');
    const bulkScrapeResults = document.getElementById('bulk-scrape-results');
    const bulkScrapeSuccessCount = document.getElementById('bulk-scrape-success-count');
    const bulkScrapeErrorCount = document.getElementById('bulk-scrape-error-count');
    
    console.log('Bulk scrape elements:', { bulkScrapeBtn, bulkScrapeModal, closeBulkScrapeBtn });
    
    // Open bulk scrape modal
    if (bulkScrapeBtn) {
        bulkScrapeBtn.addEventListener('click', () => {
            console.log('Bulk Scrape button clicked');
            if (bulkScrapeModal) {
                console.log('Opening bulk scrape modal');
                bulkScrapeModal.classList.remove('hidden');
                document.body.classList.add('modal-open');
            } else {
                console.error('Bulk scrape modal not found');
            }
        });
    } else {
        console.error('Bulk scrape button not found');
    }
    
    // Close bulk scrape modal
    if (closeBulkScrapeBtn) {
        closeBulkScrapeBtn.addEventListener('click', () => {
            bulkScrapeModal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        });
    }
    
    // Click outside to close
    if (bulkScrapeModal) {
        bulkScrapeModal.addEventListener('click', (e) => {
            if (e.target === bulkScrapeModal) {
                closeBulkScrapeBtn.click();
            }
        });
    }
    
    // Start bulk scrape
    if (startBulkScrapeBtn) {
        startBulkScrapeBtn.addEventListener('click', async () => {
            const urls = bulkScrapeUrlsTextarea.value.trim();
            if (!urls) {
                showToast('Wklej przynajmniej jeden link Weidian', 'error');
                return;
            }
            
            // Parse URLs
            const urlArray = urls.split(/[\n\s]+/).filter(url => url.trim());
            console.log('Parsed URLs:', urlArray);
            
            const batch = bulkScrapeBatchSelect.value;
            const concurrency = parseInt(bulkScrapeConcurrencySelect.value);
            const pin = bulkScrapePinCheckbox.checked;
            
            // Show progress
            bulkScrapeProgress.classList.remove('hidden');
            bulkScrapeResults.classList.add('hidden');
            bulkScrapeProgressBar.style.width = '0%';
            bulkScrapeStatus.textContent = 'Rozpoczynam scraping...';
            startBulkScrapeBtn.disabled = true;
            
            try {
                const response = await fetch('/api/scrape-bulk', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        urls: urlArray,
                        batch,
                        concurrency,
                        pin,
                        replaceMode: 'none'
                    })
                });
                
                const data = await response.json();
                console.log('Bulk scrape response:', data);
                
                // Update progress bar
                bulkScrapeProgressBar.style.width = '100%';
                
                // Show results
                bulkScrapeProgress.classList.add('hidden');
                bulkScrapeResults.classList.remove('hidden');
                bulkScrapeSuccessCount.textContent = data.successes || 0;
                bulkScrapeErrorCount.textContent = data.failures || 0;
                
                if (data.success) {
                    showToast(`Zaimportowano ${data.successes} produktów!`, 'success');
                    // Reload products after successful import
                    if (typeof loadAdminProducts === 'function') {
                        loadAdminProducts();
                    }
                } else {
                    showToast(`Import zakończony z ${data.failures} błędami`, 'warning');
                }
                
            } catch (error) {
                console.error('Bulk scrape error:', error);
                bulkScrapeProgress.classList.add('hidden');
                showToast('Błąd podczas scrapingu: ' + error.message, 'error');
            } finally {
                startBulkScrapeBtn.disabled = false;
            }
        });
    }

    // =========================================
    // BULK IMPORT/EXPORT LOGIC (CSV/JSON)
    // =========================================
    
    const exportBtn = document.getElementById('export-products-btn');
    const importModal = document.getElementById('import-products-modal');
    const closeImportBtn = document.getElementById('close-import-modal');
    const selectFileBtn = document.getElementById('select-file-btn');
    const fileInput = document.getElementById('import-file-input');
    const startImportBtn = document.getElementById('start-import-btn');
    const downloadTemplateBtn = document.getElementById('download-template');
    
    let selectedProducts = [];
    
    console.log('CSV/JSON import elements:', { importModal, closeImportBtn });
    
    // Close import modal
    if (closeImportBtn) {
        closeImportBtn.addEventListener('click', () => {
            importModal.classList.add('hidden');
            document.body.classList.remove('modal-open');
            // Reset modal
            selectedProducts = [];
            document.getElementById('file-info').classList.add('hidden');
            document.getElementById('import-progress').classList.add('hidden');
            document.getElementById('import-results').classList.add('hidden');
            startImportBtn.disabled = true;
        });
    }
    
    // Click outside to close
    if (importModal) {
        importModal.addEventListener('click', (e) => {
            if (e.target === importModal) {
                closeImportBtn.click();
            }
        });
    }
    
    // Select file button
    if (selectFileBtn) {
        selectFileBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }
    
    // File selected
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                selectedProducts = await importProductsFromFile(file);
                
                // Show file info
                document.getElementById('file-name').textContent = file.name;
                document.getElementById('products-count').textContent = selectedProducts.length;
                document.getElementById('file-info').classList.remove('hidden');
                startImportBtn.disabled = false;
                
                // Hide results from previous import
                document.getElementById('import-results').classList.add('hidden');
                
            } catch (error) {
                showToast('Błąd podczas wczytywania pliku: ' + error.message, 'error');
            }
        });
    }
    
    // Start import
    if (startImportBtn) {
        startImportBtn.addEventListener('click', async () => {
            startImportBtn.disabled = true;
            selectFileBtn.disabled = true;
            
            // Show progress
            document.getElementById('import-progress').classList.remove('hidden');
            
            const results = await bulkImportProducts(selectedProducts, (progress) => {
                // Update progress bar
                const percent = (progress.current / progress.total) * 100;
                document.getElementById('import-progress-bar').style.width = percent + '%';
                document.getElementById('import-status').textContent = 
                    `Importowanie ${progress.current}/${progress.total}: ${progress.product}`;
            });
            
            // Show results
            document.getElementById('success-count').textContent = results.success;
            document.getElementById('error-count').textContent = results.failed;
            document.getElementById('import-results').classList.remove('hidden');
            
            // Hide progress
            document.getElementById('import-progress').classList.add('hidden');
            
            // Re-enable buttons
            selectFileBtn.disabled = false;
            
            // Reload products table
            if (results.success > 0) {
                await loadAdminProducts();
                showToast(`Zaimportowano ${results.success} produktów!`, 'success');
            }
            
            if (results.failed > 0) {
                console.error('Import errors:', results.errors);
            }
        });
    }
    
    // Download template
    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const template = generateCSVTemplate();
            downloadCSV(template, 'products-template.csv');
            showToast('Szablon pobrany!', 'success');
        });
    }
    
    // Export products
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            try {
                const products = await getProducts();
                const csv = exportProductsToCSV(products);
                downloadCSV(csv, `products-export-${Date.now()}.csv`);
                showToast(`Wyeksportowano ${products.length} produktów!`, 'success');
            } catch (error) {
                showToast('Błąd podczas eksportu: ' + error.message, 'error');
            }
        });
    }
    
    // Function to initialize admin event listeners after login
    function initializeAdminEventListeners() {
        // Get elements after admin panel is shown
        const addProductBtn = document.getElementById('dodaj-przedmiot-btn');
        const addMethodModal = document.getElementById('add-method-modal');
        const closeMethodBtn = document.getElementById('close-method-modal');
        const methodScraperCard = document.getElementById('method-scraper');
        const methodBulkCard = document.getElementById('method-bulk');
        const addProductModal = document.getElementById('add-product-modal');
        const closeAddProductBtn = document.getElementById('close-add-product');
        
        console.log('Initializing admin event listeners:', { addProductBtn, addMethodModal });
        
        // Open add product modal directly (no method selection)
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                console.log('Add product button clicked');
                if (addProductModal) {
                    addProductModal.classList.remove('hidden');
                    document.body.classList.add('modal-open');
                }
            });
        }
        
        // Close method modal
        if (closeMethodBtn) {
            closeMethodBtn.addEventListener('click', () => {
                addMethodModal.classList.add('hidden');
                document.body.classList.remove('modal-open');
            });
        }
        
        // Click outside to close
        if (addMethodModal) {
            addMethodModal.addEventListener('click', (e) => {
                if (e.target === addMethodModal) {
                    closeMethodBtn.click();
                }
            });
        }
        
        // Hover effects for cards
        document.querySelectorAll('.add-method-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px)';
                card.style.background = 'rgba(255,255,255,0.08)';
                card.style.borderColor = 'rgba(255,255,255,0.2)';
                card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.5)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.background = 'rgba(255,255,255,0.03)';
                card.style.borderColor = 'rgba(255,255,255,0.1)';
                card.style.boxShadow = 'none';
            });
        });
        
        // Scraper method - opens manual add modal
        if (methodScraperCard) {
            methodScraperCard.addEventListener('click', () => {
                addMethodModal.classList.add('hidden');
                if (addProductModal) {
                    addProductModal.classList.remove('hidden');
                }
            });
        }
        
        // Bulk method - opens import modal
        if (methodBulkCard) {
            methodBulkCard.addEventListener('click', () => {
                addMethodModal.classList.add('hidden');
                const importModal = document.getElementById('import-products-modal');
                if (importModal) {
                    importModal.classList.remove('hidden');
                    document.body.classList.add('modal-open');
                }
            });
        }
        
        // Close add product modal
        if (closeAddProductBtn) {
            closeAddProductBtn.addEventListener('click', () => {
                if (addProductModal) {
                    addProductModal.classList.toggle('hidden');
                }
            });
        }
        
        if (addProductModal) {
            addProductModal.addEventListener('click', (e) => {
                if (e.target === addProductModal) {
                    addProductModal.classList.toggle('hidden');
                }
            });
        }
    }
    
    // Make function available globally
    window.initializeAdminEventListeners = initializeAdminEventListeners;

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
        
        // Ukryj wszystkie views
        document.querySelectorAll('.main-view').forEach(v => {
            v.classList.add('hidden');
            v.classList.remove('active');
        });
        
        // Pokaż target view
        const targetView = document.getElementById(targetViewId);
        if(targetView) {
            targetView.classList.remove('hidden');
            targetView.classList.add('active');
            
            // Scrolluj do góry NOWEGO view
            window.scrollTo(0,0);
        }
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
// Old translation system removed - now using translations.js with data-i18n attributes

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

// Product Data Store (Supabase with localStorage fallback)
async function getProducts() {
    // Try Supabase first
    const products = await getProductsFromDB();
    if (products && products.length > 0) {
        return products;
    }
    // Fallback to localStorage
    const local = localStorage.getItem('products');
    return local ? JSON.parse(local) : [];
}

async function saveProducts(products) {
    // Save to Supabase (will update all products - use sparingly)
    // Better to use saveProductToDB, updateProductInDB for single operations
    localStorage.setItem('products', JSON.stringify(products));
    console.warn('saveProducts() is deprecated - use saveProductToDB() instead');
}

// Open Add Product Modal
document.getElementById('dodaj-przedmiot-btn')?.addEventListener('click', () => {
    showAddProductModal();
});

// Admin Products Filters
const adminProductsView = document.getElementById('view-products');
if (adminProductsView) {
    const searchInput = adminProductsView.querySelector('.admin-search-bar input');
    const categorySelect = adminProductsView.querySelector('.custom-select:nth-child(2) select');
    const statusSelect = adminProductsView.querySelector('.custom-select:nth-child(3) select');
    
    let filterTimeout;
    
    const applyAdminFilters = () => {
        const filters = {
            search: searchInput?.value || '',
            category: categorySelect?.value || 'all',
            status: statusSelect?.value || 'all'
        };
        loadAdminProducts(filters);
    };
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(filterTimeout);
            filterTimeout = setTimeout(applyAdminFilters, 300);
        });
    }
    
    if (categorySelect) {
        categorySelect.addEventListener('change', applyAdminFilters);
    }
    
    if (statusSelect) {
        statusSelect.addEventListener('change', applyAdminFilters);
    }
}

// Close Add Product Modal
function closeAddProductModal() {
    document.getElementById('add-product-modal').classList.add('hidden');
    document.getElementById('add-product-form').reset();
}

// Add Product
async function addProduct(event) {
    event.preventDefault();
    
    const newProduct = {
        id: Date.now().toString(),
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value),
        currency: document.getElementById('product-currency')?.value || 'PLN',
        image: document.getElementById('product-image').value,
        category: document.getElementById('product-category').value,
        link: document.getElementById('product-link').value,
        status: document.getElementById('product-status')?.value || 'active',
        popular: document.getElementById('product-popular')?.checked || false,
        clicks: 0
    };
    
    // Save to Supabase
    const saved = await saveProductToDB(newProduct);
    
    if (saved) {
        closeAddProductModal();
        await loadAdminProducts();
        showToast('Produkt dodany pomyślnie!', 'success');
    } else {
        showToast('Błąd podczas dodawania produktu', 'error');
    }
}

// Load Products in Admin Table
async function loadAdminProducts(filters = {}) {
    let products = await getProducts();
    const tbody = document.getElementById('admin-products-tbody');
    
    if (!tbody) return;
    
    // Apply filters
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        products = products.filter(p => 
            p.name.toLowerCase().includes(searchLower) ||
            p.category.toLowerCase().includes(searchLower)
        );
    }
    
    if (filters.category && filters.category !== 'all') {
        products = products.filter(p => p.category.toLowerCase() === filters.category.toLowerCase());
    }
    
    if (filters.status && filters.status !== 'all') {
        products = products.filter(p => p.status === filters.status);
    }
    
    tbody.innerHTML = '';
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-muted);">Brak produktów spełniających kryteria.</td></tr>';
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
            <td>${product.price} ${product.currency}</td>
            <td><span class="status-badge status-${product.status}">${product.status === 'active' ? 'In Stock' : 'Dead Link'}</span></td>
            <td>${product.clicks}</td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="icon-btn" onclick="editProduct('${product.id}')" title="Edytuj"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-btn" onclick="deleteProduct('${product.id}')" title="Usuń"><i class="fa-solid fa-trash"></i></button>
                    <a href="${product.link}" target="_blank" class="icon-btn" title="Otwórz link"><i class="fa-solid fa-external-link"></i></a>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Update stats
    updateDashboardStats();
    
    // Also update products grid on main page
    loadProductsGrid();
}

// Add Product - show modal
function showAddProductModal() {
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.id = 'add-product-modal';
    modal.innerHTML = `
        <div class="admin-modal-content">
            <div class="admin-modal-header">
                <h3>Dodaj Nowy Produkt</h3>
                <button class="modal-close-btn" onclick="closeAddModal()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <form id="add-product-form" class="admin-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nazwa produktu *</label>
                        <input type="text" name="name" placeholder="np. Nike Air Jordan 1" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Cena *</label>
                        <input type="number" name="price" placeholder="99.99" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Waluta *</label>
                        <select name="currency" required>
                            <option value="PLN">PLN</option>
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="CNY">CNY</option>
                            <option value="GBP">GBP</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Kategoria *</label>
                        <select name="category" required>
                            <option value="">Wybierz kategorię</option>
                            <option value="Shoes">Shoes</option>
                            <option value="Hoodies">Hoodies</option>
                            <option value="T-shirts">T-shirts</option>
                            <option value="Pants">Pants</option>
                            <option value="Shorts">Shorts</option>
                            <option value="Jackets">Jackets</option>
                            <option value="Bags & Backpacks">Bags & Backpacks</option>
                            <option value="Accessories">Accessories</option>
                            <option value="Watches">Watches</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Status *</label>
                        <select name="status" required>
                            <option value="active">Active</option>
                            <option value="dead">Dead Link</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>URL obrazka *</label>
                    <input type="url" name="image" placeholder="https://example.com/image.jpg" required>
                </div>
                
                <div class="form-group">
                    <label>Link do produktu *</label>
                    <input type="url" name="link" placeholder="https://weidian.com/..." required>
                </div>
                
                <div class="form-row">
                    <div class="form-group checkbox-group">
                        <label>
                            <input type="checkbox" name="popular">
                            <span>Polecany produkt</span>
                        </label>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeAddModal()">Anuluj</button>
                    <button type="submit" class="btn btn-primary">Dodaj produkt</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add form submit handler
    document.getElementById('add-product-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addNewProduct(e.target);
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAddModal();
    });
    
    // Show modal with animation
    setTimeout(() => modal.classList.add('show'), 10);
}

// Close Add Modal
function closeAddModal() {
    const modal = document.getElementById('add-product-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// Add New Product
function addNewProduct(form) {
    const formData = new FormData(form);
    
    const products = getProducts();
    
    // Generate new ID
    const newId = 'p' + Date.now();
    
    const newProduct = {
        id: newId,
        name: formData.get('name'),
        price: parseFloat(formData.get('price')),
        currency: formData.get('currency'),
        category: formData.get('category'),
        status: formData.get('status'),
        image: formData.get('image'),
        link: formData.get('link'),
        popular: formData.get('popular') === 'on',
        clicks: 0
    };
    
    products.push(newProduct);
    saveProducts(products);
    loadAdminProducts();
    closeAddModal();
    showToast('Produkt dodany pomyślnie', 'success');
}

// Update Dashboard Stats
async function updateDashboardStats() {
    const products = await getProducts();
    
    // Calculate total clicks
    const totalClicks = products.reduce((sum, p) => sum + (p.clicks || 0), 0);
    
    // Update products count
    const productsCountEl = document.querySelector('.stat-card:nth-child(3) .stat-value');
    if (productsCountEl) {
        productsCountEl.textContent = products.length.toLocaleString();
    }
    
    // Update visits (using total clicks as proxy)
    const visitsCountEl = document.querySelector('.stat-card:nth-child(1) .stat-value');
    if (visitsCountEl) {
        visitsCountEl.textContent = totalClicks.toLocaleString();
    }
    
    // Update unique users (estimate: clicks / 1.5)
    const usersCountEl = document.querySelector('.stat-card:nth-child(2) .stat-value');
    if (usersCountEl) {
        usersCountEl.textContent = Math.floor(totalClicks / 1.5).toLocaleString();
    }
}

// Chart Period Management
let currentPeriod = 'day';

function initChartPeriods() {
    const periodBtns = document.querySelectorAll('.period-btn');
    const customPicker = document.getElementById('custom-period-picker');
    const applyBtn = document.getElementById('apply-custom-period');
    
    if (!periodBtns.length) return;
    
    periodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const period = btn.dataset.period;
            
            // Update active state
            periodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show/hide custom picker
            if (period === 'custom') {
                customPicker?.classList.remove('hidden');
            } else {
                customPicker?.classList.add('hidden');
                currentPeriod = period;
                updateChartForPeriod(period);
            }
        });
    });
    
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            const startDate = document.getElementById('period-start')?.value;
            const endDate = document.getElementById('period-end')?.value;
            
            if (!startDate || !endDate) {
                showToast('Wybierz daty początkową i końcową', 'error');
                return;
            }
            
            if (new Date(startDate) > new Date(endDate)) {
                showToast('Data początkowa nie może być późniejsza niż końcowa', 'error');
                return;
            }
            
            currentPeriod = 'custom';
            updateChartForPeriod('custom', startDate, endDate);
            showToast('Okres zaktualizowany', 'success');
        });
    }
}

function updateChartForPeriod(period, startDate = null, endDate = null) {
    console.log(`Chart updated for period: ${period}`, { startDate, endDate });
    
    const periodText = period === 'day' ? 'dzień' : 
                      period === 'week' ? 'tydzień' : 
                      period === 'month' ? 'miesiąc' : 
                      'własny okres';
    
    // Update chart title
    const chartHeader = document.querySelector('.chart-header h3');
    if (chartHeader) {
        chartHeader.textContent = `Wizyty strony - ${periodText}`;
    }
    
    // Generate data based on period
    let chartData;
    
    switch(period) {
        case 'day':
            // 24 hours data
            chartData = generateDayData();
            break;
        case 'week':
            // 7 days data
            chartData = generateWeekData();
            break;
        case 'month':
            // 4 weeks data
            chartData = generateMonthData();
            break;
        case 'custom':
            // Custom range data
            chartData = generateCustomData(startDate, endDate);
            break;
    }
    
    // Update the chart
    updateChartVisuals(chartData);
}

// Generate data for day view (24 hours)
function generateDayData() {
    const hours = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
    return hours.map((hour, i) => ({
        label: hour,
        visits: Math.floor(Math.random() * 20) + 10,  // 10-30
        users: Math.floor(Math.random() * 15) + 5,    // 5-20
        products: Math.floor(Math.random() * 8) + 3   // 3-11
    }));
}

// Generate data for week view (7 days with dates)
function generateWeekData() {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        
        data.push({
            label: `${day}.${month}`,
            visits: Math.floor(Math.random() * 50) + 30,  // 30-80
            users: Math.floor(Math.random() * 35) + 20,   // 20-55
            products: Math.floor(Math.random() * 15) + 8  // 8-23
        });
    }
    
    return data;
}

// Generate data for month view (every 2 days for 30 days = 15 points)
function generateMonthData() {
    const data = [];
    const today = new Date();
    
    // Generate 15 points (every 2 days for last 30 days)
    for (let i = 14; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 2));
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        
        data.push({
            label: `${day}.${month}`,
            visits: Math.floor(Math.random() * 100) + 60,  // 60-160
            users: Math.floor(Math.random() * 70) + 40,    // 40-110
            products: Math.floor(Math.random() * 30) + 15  // 15-45
        });
    }
    
    return data;
}

// Generate data for custom period
function generateCustomData(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    if (daysDiff <= 7) {
        // Show daily data with dates
        const data = [];
        for (let i = 0; i < daysDiff; i++) {
            const date = new Date(start);
            date.setDate(date.getDate() + i);
            
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            
            data.push({
                label: `${day}.${month}`,
                visits: Math.floor(Math.random() * 150) + 50,
                users: Math.floor(Math.random() * 100) + 30,
                products: Math.floor(Math.random() * 40) + 10
            });
        }
        return data;
    } else if (daysDiff <= 31) {
        // Show weekly aggregates
        const weeks = Math.ceil(daysDiff / 7);
        const data = [];
        
        for (let i = 0; i < weeks; i++) {
            const weekStart = new Date(start);
            weekStart.setDate(weekStart.getDate() + (i * 7));
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            if (weekEnd > end) weekEnd.setTime(end.getTime());
            
            const startDay = String(weekStart.getDate()).padStart(2, '0');
            const startMonth = String(weekStart.getMonth() + 1).padStart(2, '0');
            const endDay = String(weekEnd.getDate()).padStart(2, '0');
            const endMonth = String(weekEnd.getMonth() + 1).padStart(2, '0');
            
            data.push({
                label: `${startDay}.${startMonth}-${endDay}.${endMonth}`,
                visits: Math.floor(Math.random() * 800) + 300,
                users: Math.floor(Math.random() * 600) + 200,
                products: Math.floor(Math.random() * 200) + 80
            });
        }
        return data;
    } else {
        // Show monthly aggregates
        const months = Math.ceil(daysDiff / 30);
        const data = [];
        
        for (let i = 0; i < months; i++) {
            const monthStart = new Date(start);
            monthStart.setMonth(monthStart.getMonth() + i);
            
            const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
            
            data.push({
                label: monthNames[monthStart.getMonth()],
                visits: Math.floor(Math.random() * 3000) + 1000,
                users: Math.floor(Math.random() * 2000) + 800,
                products: Math.floor(Math.random() * 600) + 300
            });
        }
        return data;
    }
}

// Update chart visuals with new data
function updateChartVisuals(data) {
    const svg = document.querySelector('.line-chart');
    if (!svg) return;
    
    const width = 800;
    const height = 240;  // Kompaktowa wysokość
    const padding = { left: 80, right: 50, top: 30, bottom: 50 };  // Zmniejszony top
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Calculate max value for scaling
    const maxVisits = Math.max(...data.map(d => d.visits));
    const scaleY = chartHeight / maxVisits;
    const scaleX = chartWidth / (data.length - 1);
    
    // Generate path data
    let pathData = '';
    let areaData = '';
    const points = [];
    
    data.forEach((point, i) => {
        const x = padding.left + (i * scaleX);
        const y = padding.top + chartHeight - (point.visits * scaleY);
        
        if (i === 0) {
            pathData += `M ${x} ${y}`;
            areaData += `M ${x} ${y}`;
        } else {
            pathData += ` L ${x} ${y}`;
            areaData += ` L ${x} ${y}`;
        }
        
        points.push({ x, y, ...point });
    });
    
    // Close area path
    areaData += ` L ${padding.left + chartWidth} ${padding.top + chartHeight}`;
    areaData += ` L ${padding.left} ${padding.top + chartHeight} Z`;
    
    // Update path elements
    const linePath = svg.querySelector('.line-path');
    const areaPath = svg.querySelector('.line-area');
    
    if (linePath) linePath.setAttribute('d', pathData);
    if (areaPath) areaPath.setAttribute('d', areaData);
    
    // Remove old elements
    const oldElements = svg.querySelectorAll('.chart-point, .chart-label, .chart-hover-group, .chart-labels-group, .chart-points-group');
    oldElements.forEach(el => el.remove());
    
    // Add X-axis labels (smaller font)
    const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelsGroup.classList.add('chart-labels-group');
    
    points.forEach((point, i) => {
        // Always show all labels
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.classList.add('chart-label');
        text.setAttribute('x', point.x);
        text.setAttribute('y', padding.top + chartHeight + 28);  // Pod wykresem
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '11');
        text.setAttribute('fill', '#a3a3a3');
        text.setAttribute('font-weight', '500');
        text.textContent = point.label;
        labelsGroup.appendChild(text);
    });
    
    svg.appendChild(labelsGroup);
    
    // Re-initialize interactive tracking
    initInteractiveChart(points, padding, chartHeight);
}

// Initialize interactive chart with continuous hover tracking and interpolation
function initInteractiveChart(points, padding, chartHeight) {
    const svg = document.querySelector('.line-chart');
    const tooltip = document.getElementById('chart-tooltip');
    const container = svg.closest('.line-chart-container');
    
    if (!tooltip || !container) return;
    
    const viewBox = svg.getAttribute('viewBox').split(' ');
    const svgWidth = parseFloat(viewBox[2]);
    const svgHeight = parseFloat(viewBox[3]);
    const chartWidth = svgWidth - padding.left - padding.right;
    
    // Create single hover point that will follow mouse SMOOTHLY
    let hoverPoint = svg.querySelector('.chart-hover-point');
    if (!hoverPoint) {
        hoverPoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hoverPoint.classList.add('chart-hover-point');
        hoverPoint.setAttribute('r', '5');
        hoverPoint.style.opacity = '0';
        hoverPoint.style.fill = '#a3a3a3';
        hoverPoint.style.stroke = '#fff';
        hoverPoint.style.strokeWidth = '2';
        hoverPoint.style.pointerEvents = 'none';
        svg.appendChild(hoverPoint);
    }
    
    // Create invisible overlay for mouse tracking - FULL CHART AREA
    let overlay = svg.querySelector('.chart-overlay');
    if (overlay) overlay.remove();
    
    overlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    overlay.classList.add('chart-overlay');
    overlay.setAttribute('x', padding.left);
    overlay.setAttribute('y', padding.top);
    overlay.setAttribute('width', chartWidth);
    overlay.setAttribute('height', chartHeight);
    overlay.style.fill = 'transparent';
    overlay.style.cursor = 'crosshair';
    svg.appendChild(overlay);
    
    overlay.addEventListener('mousemove', (e) => {
        const rect = svg.getBoundingClientRect();
        
        // Convert mouse position to SVG coordinates
        const scaleX = svgWidth / rect.width;
        const mouseX = (e.clientX - rect.left) * scaleX;
        
        // Clamp mouseX to chart bounds
        const clampedX = Math.max(padding.left, Math.min(padding.left + chartWidth, mouseX));
        
        // Find two nearest points for interpolation
        let leftIndex = 0;
        let rightIndex = 0;
        
        for (let i = 0; i < points.length - 1; i++) {
            if (clampedX >= points[i].x && clampedX <= points[i + 1].x) {
                leftIndex = i;
                rightIndex = i + 1;
                break;
            }
        }
        
        // Handle edge cases
        if (clampedX <= points[0].x) {
            leftIndex = rightIndex = 0;
        } else if (clampedX >= points[points.length - 1].x) {
            leftIndex = rightIndex = points.length - 1;
        }
        
        const leftPoint = points[leftIndex];
        const rightPoint = points[rightIndex];
        
        // Linear interpolation
        let interpolatedY, interpolatedValue, displayLabel;
        
        if (leftIndex === rightIndex) {
            // On exact point
            interpolatedY = leftPoint.y;
            interpolatedValue = leftPoint.visits;
            displayLabel = leftPoint.label;
        } else {
            // Between two points - interpolate
            const ratio = (clampedX - leftPoint.x) / (rightPoint.x - leftPoint.x);
            interpolatedY = leftPoint.y + (rightPoint.y - leftPoint.y) * ratio;
            interpolatedValue = Math.round(leftPoint.visits + (rightPoint.visits - leftPoint.visits) * ratio);
            
            // Decide which label to show based on proximity
            if (ratio < 0.5) {
                displayLabel = leftPoint.label;
            } else {
                displayLabel = rightPoint.label;
            }
        }
        
        // Update hover point position - SMOOTHLY along the line
        hoverPoint.setAttribute('cx', clampedX);
        hoverPoint.setAttribute('cy', interpolatedY);
        hoverPoint.style.opacity = '1';
        
        // Update tooltip with interpolated value
        tooltip.querySelector('.tooltip-day').textContent = displayLabel;
        tooltip.querySelector('.visits-value').textContent = interpolatedValue.toLocaleString();
        tooltip.querySelector('.users-value').textContent = Math.round(interpolatedValue * 0.7).toLocaleString();
        tooltip.querySelector('.products-value').textContent = Math.round(interpolatedValue * 0.3).toLocaleString();
        
        // Position tooltip - FIXED to cursor with smooth tracking
        tooltip.style.position = 'fixed';
        tooltip.style.left = (e.clientX + 15) + 'px';  // 15px right of cursor
        tooltip.style.top = (e.clientY + 15) + 'px';   // 15px below cursor
        tooltip.style.transform = 'none';
        tooltip.classList.remove('hidden');
    });
    
    overlay.addEventListener('mouseleave', () => {
        hoverPoint.style.opacity = '0';
        tooltip.classList.add('hidden');
    });
    
    overlay.addEventListener('mouseenter', () => {
        hoverPoint.style.opacity = '0';
    });
}

// Initialize on admin panel load
document.addEventListener('DOMContentLoaded', () => {
    initChartPeriods();
    
    // Initialize chart with default period (day) on first load
    setTimeout(() => {
        updateChartForPeriod('day');
    }, 100);
});

// Delete Product
async function deleteProduct(id) {
    if (!confirm('Czy na pewno chcesz usunąć ten produkt?')) return;
    
    const success = await deleteProductFromDB(id);
    
    if (success) {
        await loadAdminProducts();
        showToast('Produkt usunięty', 'success');
    } else {
        showToast('Błąd podczas usuwania produktu', 'error');
    }
}

// Edit Product - opens modal with product data
async function editProduct(id) {
    const products = await getProducts();
    const product = products.find(p => p.id === id);
    
    if (!product) {
        showToast('Nie znaleziono produktu', 'error');
        return;
    }
    
    // Create and show edit modal
    showEditModal(product);
}

// Show Edit Modal
function showEditModal(product) {
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.id = 'edit-product-modal';
    modal.innerHTML = `
        <div class="admin-modal-content">
            <div class="admin-modal-header">
                <h3>Edytuj Produkt</h3>
                <button class="modal-close-btn" onclick="closeEditModal()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <form id="edit-product-form" class="admin-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nazwa produktu *</label>
                        <input type="text" name="name" value="${product.name}" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Cena *</label>
                        <input type="number" name="price" value="${product.price}" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Waluta *</label>
                        <select name="currency" required>
                            <option value="PLN" ${product.currency === 'PLN' ? 'selected' : ''}>PLN</option>
                            <option value="EUR" ${product.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                            <option value="USD" ${product.currency === 'USD' ? 'selected' : ''}>USD</option>
                            <option value="CNY" ${product.currency === 'CNY' ? 'selected' : ''}>CNY</option>
                            <option value="GBP" ${product.currency === 'GBP' ? 'selected' : ''}>GBP</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Kategoria *</label>
                        <select name="category" required>
                            <option value="Shoes" ${product.category === 'Shoes' ? 'selected' : ''}>Shoes</option>
                            <option value="Hoodies" ${product.category === 'Hoodies' ? 'selected' : ''}>Hoodies</option>
                            <option value="T-shirts" ${product.category === 'T-shirts' ? 'selected' : ''}>T-shirts</option>
                            <option value="Pants" ${product.category === 'Pants' ? 'selected' : ''}>Pants</option>
                            <option value="Shorts" ${product.category === 'Shorts' ? 'selected' : ''}>Shorts</option>
                            <option value="Jackets" ${product.category === 'Jackets' ? 'selected' : ''}>Jackets</option>
                            <option value="Bags & Backpacks" ${product.category === 'Bags & Backpacks' ? 'selected' : ''}>Bags & Backpacks</option>
                            <option value="Accessories" ${product.category === 'Accessories' ? 'selected' : ''}>Accessories</option>
                            <option value="Watches" ${product.category === 'Watches' ? 'selected' : ''}>Watches</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Status *</label>
                        <select name="status" required>
                            <option value="active" ${product.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="dead" ${product.status === 'dead' ? 'selected' : ''}>Dead Link</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>URL obrazka *</label>
                    <input type="url" name="image" value="${product.image}" required>
                </div>
                
                <div class="form-group">
                    <label>Link do produktu *</label>
                    <input type="url" name="link" value="${product.link}" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group checkbox-group">
                        <label>
                            <input type="checkbox" name="popular" ${product.popular ? 'checked' : ''}>
                            <span>Polecany produkt</span>
                        </label>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeEditModal()">Anuluj</button>
                    <button type="submit" class="btn btn-primary">Zapisz zmiany</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add form submit handler
    document.getElementById('edit-product-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveEditedProduct(product.id, e.target);
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeEditModal();
    });
    
    // Show modal with animation
    setTimeout(() => modal.classList.add('show'), 10);
}

// Close Edit Modal
function closeEditModal() {
    const modal = document.getElementById('edit-product-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// Save Edited Product
function saveEditedProduct(id, form) {
    const formData = new FormData(form);
    
    let products = getProducts();
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
        showToast('Nie znaleziono produktu', 'error');
        return;
    }
    
    // Update product
    products[productIndex] = {
        ...products[productIndex],
        name: formData.get('name'),
        price: parseFloat(formData.get('price')),
        currency: formData.get('currency'),
        category: formData.get('category'),
        status: formData.get('status'),
        image: formData.get('image'),
        link: formData.get('link'),
        popular: formData.get('popular') === 'on'
    };
    
    saveProducts(products);
    loadAdminProducts();
    closeEditModal();
    showToast('Produkt zaktualizowany', 'success');
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
        </div>
    `;
    
    // Add cursor pointer style for clickable cards
    card.style.cursor = 'pointer';
    
    // Add click event listener to navigate to product detail view
    card.addEventListener('click', (e) => {
        showProductDetail(product.id);
    });
    
    return card;
}

// Filter products grid by category
function filterProductsGrid(cat) {
    applyFiltersAndSort();
}

// Load Products Grid on Main Page
async function loadProductsGrid() {
    const all = (await getProducts()).length > 0 ? await getProducts() : SAMPLE_PRODUCTS;
    initInfinityScroll(all);
}

// Increment Clicks
async function incrementClicks(id) {
    try {
        const { data, error } = await supabase
            .from('products')
            .update({ clicks: supabase.raw('clicks + 1') })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.warn('Could not increment clicks for product:', id, error);
        return null;
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

// ---- Category dropdown toggle ----
document.addEventListener('click', (e) => {
    console.log('Click event:', e.target);
    
    const btn = e.target.closest('#pv-cat-btn');
    if (btn) {
        console.log('Button clicked - toggling dropdown');
        e.preventDefault();
        e.stopPropagation();
        const container = document.getElementById('pv-cat-dropdown');
        // Close other dropdowns
        document.querySelectorAll('.pv-filter-dropdown').forEach(dd => {
            if (dd.id !== 'pv-cat-dropdown') dd.classList.remove('open');
        });
        if (container) {
            container.classList.toggle('open');
            console.log('Dropdown open state:', container.classList.contains('open'));
        }
        return;
    }

    // ---- Price dropdown toggle ----
    const priceBtn = e.target.closest('#pv-price-btn');
    if (priceBtn) {
        e.preventDefault();
        e.stopPropagation();
        const container = document.getElementById('pv-price-dropdown');
        // Close other dropdowns
        document.querySelectorAll('.pv-filter-dropdown').forEach(dd => {
            if (dd.id !== 'pv-price-dropdown') dd.classList.remove('open');
        });
        if (container) container.classList.toggle('open');
        return;
    }

    // ---- Sort dropdown toggle ----
    const sortBtn = e.target.closest('#pv-sort-btn');
    if (sortBtn) {
        e.preventDefault();
        e.stopPropagation();
        const container = document.getElementById('pv-sort-dropdown');
        // Close other dropdowns
        document.querySelectorAll('.pv-filter-dropdown').forEach(dd => {
            if (dd.id !== 'pv-sort-dropdown') dd.classList.remove('open');
        });
        if (container) container.classList.toggle('open');
        return;
    }

    // ---- Category item click ----
    const item = e.target.closest('.pv-drop-item');
    if (item && item.closest('#pv-cat-menu')) {
        console.log('Category item clicked:', item.getAttribute('data-cat'));
        e.preventDefault();
        e.stopPropagation();
        const container = document.getElementById('pv-cat-dropdown');
        const dd        = document.getElementById('pv-cat-menu');
        const label     = document.getElementById('pv-cat-label');
        if (dd) dd.querySelectorAll('.pv-drop-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const sp = item.querySelector('span');
        if (label && sp) label.textContent = sp.textContent.trim();
        if (container) container.classList.remove('open');
        
        // Clear pill filters when selecting category
        document.querySelectorAll('.pv-filter-pill').forEach(p => p.classList.remove('active'));
        window._activePillFilter = null;
        
        const cat = item.getAttribute('data-cat');
        console.log('Filtering by category:', cat);
        applyFiltersAndSort();
        return;
    }

    // ---- Price item click ----
    if (item && item.closest('#pv-price-menu')) {
        e.preventDefault();
        e.stopPropagation();
        const container = document.getElementById('pv-price-dropdown');
        const dd        = document.getElementById('pv-price-menu');
        const label     = document.getElementById('pv-price-label');
        if (dd) dd.querySelectorAll('.pv-drop-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const sp = item.querySelector('span');
        if (label && sp) label.textContent = sp.textContent.trim();
        if (container) container.classList.remove('open');
        
        // Clear custom range
        window._customPriceRange = null;
        const minInput = document.getElementById('price-min');
        const maxInput = document.getElementById('price-max');
        if (minInput) minInput.value = '';
        if (maxInput) maxInput.value = '';
        
        const price = item.getAttribute('data-price');
        console.log('Filtering by price:', price);
        applyFiltersAndSort();
        return;
    }

    // ---- Sort item click ----
    if (item && item.closest('#pv-sort-menu')) {
        e.preventDefault();
        e.stopPropagation();
        const container = document.getElementById('pv-sort-dropdown');
        const dd        = document.getElementById('pv-sort-menu');
        const label     = document.getElementById('pv-sort-label');
        if (dd) dd.querySelectorAll('.pv-drop-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const sp = item.querySelector('span');
        if (label && sp) label.textContent = sp.textContent.trim();
        if (container) container.classList.remove('open');
        const sort = item.getAttribute('data-sort');
        console.log('Sorting by:', sort);
        applyFiltersAndSort();
        return;
    }

    // ---- Pill filter ----
    const pill = e.target.closest('.pv-filter-pill');
    if (pill) {
        const filterType = pill.getAttribute('data-filter');
        console.log('Pill filter clicked:', filterType);
        
        // Toggle pill (allow deselection)
        if (pill.classList.contains('active')) {
            pill.classList.remove('active');
            window._activePillFilter = null;
        } else {
            document.querySelectorAll('.pv-filter-pill').forEach(b => b.classList.remove('active'));
            pill.classList.add('active');
            window._activePillFilter = filterType;
        }
        
        applyFiltersAndSort();
        return;
    }

    // ---- Close dropdown on outside click ----
    const ddContainer = e.target.closest('.pv-filter-dropdown');
    if (!ddContainer) {
        document.querySelectorAll('.pv-filter-dropdown').forEach(dd => dd.classList.remove('open'));
        console.log('All dropdowns closed by outside click');
    }
});

// ---- Custom price range apply ----
document.addEventListener('click', (e) => {
    if (e.target.id === 'apply-custom-price') {
        e.stopPropagation();
        const minInput = document.getElementById('price-min');
        const maxInput = document.getElementById('price-max');
        const min = parseInt(minInput.value) || 0;
        const max = parseInt(maxInput.value) || Infinity;
        
        if (min > 0 || max < Infinity) {
            // Set custom range
            const customRange = max === Infinity ? `${min}+` : `${min}-${max}`;
            
            // Update label
            const label = document.getElementById('pv-price-label');
            const currency = localStorage.getItem('pref_currency') || 'PLN';
            if (label) {
                if (max === Infinity) {
                    label.textContent = `${min}+ ${currency}`;
                } else {
                    label.textContent = `${min}-${max} ${currency}`;
                }
            }
            
            // Remove active from all preset items
            document.querySelectorAll('#pv-price-menu .pv-drop-item').forEach(i => i.classList.remove('active'));
            
            // Store custom range for filtering
            window._customPriceRange = customRange;
            
            // Close dropdown
            const container = document.getElementById('pv-price-dropdown');
            if (container) container.classList.remove('open');
            
            // Apply filter
            applyFiltersAndSort();
        }
    }
});

// Stop propagation on custom price inputs to prevent dropdown close
document.addEventListener('click', (e) => {
    if (e.target.closest('.pv-price-custom')) {
        e.stopPropagation();
    }
});

// ---- Search inside dropdown (stop propagation) ----
document.addEventListener('click', (e) => {
    if (e.target.closest('.pv-drop-search-wrap')) e.stopPropagation();
});

document.addEventListener('input', (e) => {
    if (!e.target.classList.contains('pv-drop-search')) return;
    const q  = e.target.value.toLowerCase();
    const dd = document.getElementById('pv-cat-menu');
    if (!dd) return;
    dd.querySelectorAll('.pv-drop-item').forEach(it => {
        const sp = it.querySelector('span');
        it.style.display = sp && sp.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
});

// ---- Main search bar ----
document.addEventListener('input', async (e) => {
    if (e.target.id !== 'products-search') return;
    const q   = e.target.value.toLowerCase().trim();
    const all = (await getProducts()).length > 0 ? await getProducts() : SAMPLE_PRODUCTS;
    initInfinityScroll(q ? all.filter(p =>
        p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
    ) : all);
});

// =========================================
// PRICE FILTER & SORT LOGIC
// =========================================

function getSelectedCategory() {
    const activeItem = document.querySelector('#pv-cat-menu .pv-drop-item.active');
    return activeItem ? activeItem.getAttribute('data-cat') : 'All';
}

function getSelectedPriceRange() {
    // Check if custom range is set
    if (window._customPriceRange) {
        return window._customPriceRange;
    }
    // Otherwise get from dropdown
    const activeItem = document.querySelector('#pv-price-menu .pv-drop-item.active');
    return activeItem ? activeItem.getAttribute('data-price') : 'all';
}

function getSelectedSort() {
    const activeItem = document.querySelector('#pv-sort-menu .pv-drop-item.active');
    return activeItem ? activeItem.getAttribute('data-sort') : 'name-asc';
}

function filterByPrice(products, priceRange) {
    if (priceRange === 'all') return products;
    
    // Parse price range (these are in CNY base values from dropdown data attributes)
    const [min, max] = priceRange.includes('+') 
        ? [parseInt(priceRange), Infinity]
        : priceRange.split('-').map(v => parseInt(v));
    
    return products.filter(p => {
        // Get product price and currency
        const productPrice = parseFloat(p.price) || 0;
        const productCurrency = p.currency || 'PLN';
        
        // Convert product price to CNY for comparison
        // If product is already in CNY, use directly; otherwise convert back to CNY
        let priceInCNY;
        if (productCurrency === 'CNY') {
            priceInCNY = productPrice;
        } else {
            // Reverse conversion: divide by the rate to get back to CNY
            const rate = CURRENCY_RATES[productCurrency] || CURRENCY_RATES['PLN'];
            priceInCNY = productPrice / rate;
        }
        
        // Compare with CNY range
        return priceInCNY >= min && (max === Infinity || priceInCNY <= max);
    });
}

function sortProducts(products, sortBy) {
    const sorted = [...products];
    
    switch(sortBy) {
        case 'name-asc':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'name-desc':
            return sorted.sort((a, b) => b.name.localeCompare(a.name));
        case 'price-asc':
            return sorted.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
        case 'price-desc':
            return sorted.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
        case 'newest':
            return sorted.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
        default:
            return sorted;
    }
}

async function applyFiltersAndSort() {
    const all = (await getProducts()).length > 0 ? await getProducts() : SAMPLE_PRODUCTS;
    
    // 1. Filter by category
    const category = getSelectedCategory();
    let filtered = (!category || category === 'All')
        ? all
        : all.filter(p => p.category === category);
    
    // 2. Apply pill filter (women/recommended/newest)
    const pillFilter = window._activePillFilter;
    if (pillFilter === 'women') {
        // Filter products for women (categories like bags, accessories, certain shoes)
        const womenCategories = ['Bags & Backpacks', 'Accessories'];
        filtered = filtered.filter(p => 
            womenCategories.includes(p.category) || 
            (p.name && (p.name.toLowerCase().includes('women') || p.name.toLowerCase().includes('ladies')))
        );
    } else if (pillFilter === 'recommended') {
        // Filter only popular products
        filtered = filtered.filter(p => p.popular === true);
    } else if (pillFilter === 'newest') {
        // Sort by newest (highest ID = newest)
        filtered = [...filtered].sort((a, b) => (b.id || '').localeCompare(a.id || ''));
    }
    
    // 3. Filter by price
    const priceRange = getSelectedPriceRange();
    filtered = filterByPrice(filtered, priceRange);
    
    // 4. Sort (only if newest pill is not active)
    if (pillFilter !== 'newest') {
        const sortBy = getSelectedSort();
        filtered = sortProducts(filtered, sortBy);
    }
    
    // 5. Display
    initInfinityScroll(filtered);
}

// ---- Update price dropdown currency display ----
const CURRENCY_RATES = {
    'CNY': 1,      // Base currency (Chinese Yuan)
    'PLN': 0.58,   // 1 CNY = ~0.58 PLN
    'EUR': 0.13,   // 1 CNY = ~0.13 EUR
    'USD': 0.14,   // 1 CNY = ~0.14 USD
    'GBP': 0.11    // 1 CNY = ~0.11 GBP
};

function convertPrice(priceInCNY, targetCurrency) {
    const rate = CURRENCY_RATES[targetCurrency] || CURRENCY_RATES['PLN'];
    return Math.round(priceInCNY * rate);
}

function updatePriceDropdownCurrency() {
    const currency = localStorage.getItem('pref_currency') || 'PLN';
    
    // Update currency symbols
    document.querySelectorAll('#pv-price-menu .price-curr').forEach(el => {
        el.textContent = currency;
    });
    
    // Update price values - converting from CNY base
    const priceRanges = [
        { selector: '[data-price="0-50"]', cnyValues: [50] },
        { selector: '[data-price="50-100"]', cnyValues: [50, 100] },
        { selector: '[data-price="100-200"]', cnyValues: [100, 200] },
        { selector: '[data-price="200-500"]', cnyValues: [200, 500] },
        { selector: '[data-price="500+"]', cnyValues: [500] }
    ];
    
    priceRanges.forEach(range => {
        const item = document.querySelector(`#pv-price-menu ${range.selector}`);
        if (!item) return;
        
        const priceVals = item.querySelectorAll('.price-val');
        range.cnyValues.forEach((cnyVal, idx) => {
            if (priceVals[idx]) {
                priceVals[idx].textContent = convertPrice(cnyVal, currency);
            }
        });
    });
}

// Update currency on page load
if (document.getElementById('pv-price-menu')) {
    updatePriceDropdownCurrency();
}

// Update currency when preference changes
window.addEventListener('storage', (e) => {
    if (e.key === 'pref_currency') {
        updatePriceDropdownCurrency();
    }
});

// Also update when preferences modal changes currency
document.addEventListener('click', (e) => {
    const prefItem = e.target.closest('[data-pref="currency"]');
    if (prefItem) {
        setTimeout(updatePriceDropdownCurrency, 100);
    }
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
// SELLERS — Supabase CRUD
// =========================================
async function getSellers() {
    // Try Supabase first
    const sellers = await getSellersFromDB();
    if (sellers && sellers.length > 0) {
        return sellers;
    }
    // Fallback to localStorage
    try { return JSON.parse(localStorage.getItem('custom_sellers') || '[]'); }
    catch { return []; }
}
async function saveSellers(arr) {
    localStorage.setItem('custom_sellers', JSON.stringify(arr));
    console.warn('saveSellers() is deprecated - use saveSellerToDB() instead');
}

function buildSellerCard(seller, searchQuery = '') {
    const initial = (seller.name || '?')[0].toUpperCase();
    
    // Get brands from seller object (could be array or string)
    let brandsArr = [];
    if (Array.isArray(seller.brands)) {
        brandsArr = seller.brands;
    } else if (typeof seller.brands === 'string') {
        brandsArr = seller.brands.split(',').map(b => b.trim()).filter(Boolean);
    }
    
    // Smart tag selection: show up to 6 tags to increase visibility
    // If search is active, prioritize matching brands
    let displayBrands = [];
    const maxTags = 6;
    
    if (searchQuery && searchQuery.length > 0) {
        const query = searchQuery.toLowerCase();
        // First add matching brands
        const matching = brandsArr.filter(b => b.toLowerCase().includes(query));
        const nonMatching = brandsArr.filter(b => !b.toLowerCase().includes(query));
        // Show matching first, then fill with non-matching up to maxTags
        displayBrands = [...matching.slice(0, maxTags), ...nonMatching].slice(0, maxTags);
    } else {
        // No search - show first 6
        displayBrands = brandsArr.slice(0, maxTags);
    }
    
    // Build tags HTML with icons
    const tagsHtml = displayBrands.map(b => {
        // Highlight matching tags if search is active
        const isMatch = searchQuery && b.toLowerCase().includes(searchQuery.toLowerCase());
        const highlightClass = isMatch ? ' seller-tag-highlight' : '';
        return `<span class="seller-tag-premium${highlightClass}"><i class="fa-solid fa-tag" style="font-size: 0.7rem; margin-right: 4px; opacity: 0.5;"></i> ${b}</span>`;
    }).join('');
    
    const card = document.createElement('div');
    card.className = 'seller-card-premium';
    // Store all brands in data-brands attribute for filtering
    card.setAttribute('data-brands', brandsArr.join(','));
    card.setAttribute('data-seller-id', seller.id);
    card.innerHTML = `
        <div class="seller-header">
            <div class="seller-avatar-initial">${initial}</div>
            <div class="seller-info">
                <h3>${seller.name} <span class="top-rated-star"><i class="fa-solid fa-star"></i> Top rated</span></h3>
            </div>
        </div>
        <p class="seller-desc">${seller.desc || seller.description || ''}</p>
        <div class="seller-tags-premium">${tagsHtml}</div>
        <a href="${seller.link || seller.shop_url || '#'}" target="_blank" class="seller-btn-premium">Odwiedź Sklep</a>
    `;
    return card;
}

async function loadSellersGrid() {
    const custom = await getSellers();
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

async function adminAddSeller(e) {
    e.preventDefault();
    const name   = document.getElementById('seller-name').value.trim();
    const desc   = document.getElementById('seller-desc-input').value.trim();
    const brands = document.getElementById('seller-brands').value.trim();
    const link   = document.getElementById('seller-link').value.trim();
    if (!name) return;
    
    const newSeller = { 
        name, 
        description: desc, 
        brands: brands.split(',').map(b => b.trim()), 
        shop_url: link,
        top_rated: false
    };
    
    const saved = await saveSellerToDB(newSeller);
    
    if (saved) {
        document.getElementById('add-seller-modal').classList.add('hidden');
        document.getElementById('add-seller-form').reset();
        await loadAdminSellers();
        await loadSellersGrid();
        showToast('Sprzedawca dodany!', 'success');
    } else {
        showToast('Błąd podczas dodawania sprzedawcy', 'error');
    }
}

async function deleteAdminSeller(id) {
    if (!confirm('Usunąć tego sprzedawcę?')) return;
    
    const success = await deleteSellerFromDB(id);
    
    if (success) {
        await loadAdminSellers();
        // odświeżamy kartę w sellers-view
        document.querySelectorAll(`[data-seller-id="${id}"]`).forEach(el => el.remove());
        showToast('Sprzedawca usunięty', 'success');
    } else {
        showToast('Błąd podczas usuwania sprzedawcy', 'error');
    }
}

async function loadAdminSellers() {
    const tbody = document.getElementById('admin-sellers-tbody');
    if (!tbody) return;
    const sellers = await getSellers();
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
            if (lang && typeof setLanguage === 'function') {
                setLanguage(lang);
            }
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

/* ==== FXTRK:CORE START ==== */
/*
 * Sekcja CORE modułu śledzenia — wyłącznie tabele danych i funkcje czyste.
 * Zero odwołań do drzewa strony, adresu strony i sieci. Jedyny kontakt
 * z globalnym środowiskiem to końcowe przypisanie obiektu FXTRK_CORE.
 * Sekcja jest wycinana między znacznikami i uruchamiana w izolacji przez testy.
 */
(function () {
    'use strict';

    /* ── Tabela tłumaczeń statusów przewoźnika na język polski ───────────── */
    var FXTRK_STATUS_PL = {
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
        'Electronic information received': 'Otrzymano informacje o przesyłce',
        'Delivered': 'Dostarczono',
        'Delivered successfully': 'Dostarczone pomyślnie',
        'Your parcel has been delivered successfully': 'Twoja paczka została pomyślnie dostarczona',
        'Your parcel has been delivered successfully.': 'Twoja przesyłka została pomyślnie dostarczona',
        'Your parcel is out for delivery': 'Twoja paczka jest w drodze do dostawy',
        'Out for delivery': 'W drodze do dostawy',
        'At parcel delivery centre': 'W centrum dostaw',
        'At parcel delivery centre.': 'Przesyłka w centrum doręczeń',
        'In transit': 'W tranzycie',
        'Item in transit': 'Przesyłka w transporcie',
        'Your parcel is on its way': 'Twoja paczka jest w drodze',
        'Your parcel is ready to leave our hub': 'Twoja paczka jest gotowa do opuszczenia naszego centrum',
        'Your parcel is ready to be transported to our next premises': 'Twoja paczka jest gotowa do transportu do następnego centrum',
        'Your parcel arrived at our depot': 'Twoja paczka dotarła do naszego magazynu',
        'Your parcel delivery date has changed': 'Data dostawy Twojej paczki została zmieniona',
        'Your parcel is estimated to be delivered on': 'Przewidywana dostawa Twojej paczki',
        'The parcel has left the parcel delivery centre and is on its way to the consignee': 'Paczka opuściła centrum dostaw i jest w drodze do odbiorcy',
        'The parcel has left the parcel delivery centre and is on its way to the consignee.': 'Przesyłka opuściła centrum doręczeń i jest w drodze do odbiorcy',
        'The parcel is at the parcel dispatch centre': 'Paczka znajduje się w centrum dystrybucyjnym',
        'The parcel is at the parcel dispatch centre.': 'Przesyłka w centrum wysyłkowym',
        'Odprawa celna zakończona pending scanning': 'Odprawa celna zakończona, oczekuje na skanowanie',
        'Customs clearance completed pending scanning': 'Odprawa celna zakończona, oczekuje na skanowanie',
        'Customs clearance completed, waiting for extraction of Customs clearance pending scanning': 'Odprawa celna zakończona, oczekuje na skanowanie',
        'Customs clearance completed': 'Odprawa celna zakończona',
        'Customs clearance in progress': 'Trwa odprawa celna',
        'Export customs clearance completed': 'Eksportowa odprawa celna zakończona',
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
        'Pre-advised': 'Otrzymano dane elektroniczne',
        'Leave the scan': 'Skanowanie wyjścia',
        'Receiving Scan': 'Skanowanie odbioru',
        'Receiving scan': 'Skan odbioru',
        'Departure scan': 'Skan wyjazdu',
        'Pending pickup': 'Oczekuje na odbiór',
        'Loaded on aircraft': 'Załadowano na samolot',
        'Dismantling the board': 'Demontaż z pokładu',
        'Arrived at destination airport': 'Przesyłka dotarła na lotnisko docelowe',
        'The flight has arrived': 'Lot dotarł',
        'Flight has arrived': 'Lot dotarł',
        'Flight has departed': 'Lot odleciał',
        'Expected flight on July 9st': 'Przewidywany lot 9 lipca',
        'The instruction data for this shipment have been provided by the sender to DHL electronically': 'Dane przesyłki zostały przesłane elektronicznie przez nadawcę do DHL',
        'The instruction data for this shipment have been provided by the sender to DHL electronicallytransit': 'Dane przesyłki zostały przesłane elektronicznie przez nadawcę do DHL',
        'The goods leave the operation center': 'Przesyłka opuściła centrum operacyjne',
        'Arrived at the operating center': 'Przesyłka dotarła do centrum operacyjnego',
        'The goods have arrived at the operation center': 'Towar dotarł do centrum operacyjnego',
        'General Office': 'Centrala',
        'Branch Office': 'Oddział',
        'Distribution Center': 'Centrum dystrybucji',
        'Transit Center': 'Centrum tranzytowe',
        'Operations Center': 'Centrum operacyjne',
        'Departed': 'Wyjechało',
        'Arrived': 'Przybyło',
        '已交仓，等待扫描提取': 'Dostarczone do magazynu, oczekuje na skanowanie i odbiór',
        '清关完成，等待交仓': 'Odprawa celna zakończona, przesyłka oczekuje na przekazanie do magazynu',
        '清关中': 'Przesyłka w trakcie odprawy celnej',
        '已落地，待清关': 'Przesyłka wylądowała, oczekuje na odprawę celną',
        '过港中，航班待定': 'Przesyłka w tranzycie, lot do potwierdzenia',
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

    /* ── Odwzorowanie chińskich fraz na angielskie (bez de/es/zh) ─────────── */
    var FXTRK_CHINESE_TO_EN = {
        // Miasta i regiony
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
        // Węzły i terminy firmowe
        '总公司': 'General Office',
        '分公司': 'Branch Office',
        '集散中心': 'Distribution Center',
        '转运中心': 'Transit Center',
        '操作中心': 'Operations Center',
        // Statusy — klucze zgodne z angielskimi kluczami tabeli statusów
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
        // Pozostałe słowa (najpierw tłumaczone, potem usuwane znaki CJK)
        '预计': 'Est.',
        '号航班': ' flight',
        '到达': 'Arrived',
        '出发': 'Departed',
        '离开': 'Departed'
    };

    /* ── Kody krajów i ich nazwy wielkimi literami ────────────────────────── */
    var FXTRK_COUNTRY_MAP = {
        'PL': 'POLSKA',
        'DE': 'NIEMCY',
        'CN': 'CHINY',
        'NL': 'HOLANDIA',
        'GB': 'WIELKA BRYTANIA',
        'US': 'USA',
        'FR': 'FRANCJA',
        'ES': 'HISZPANIA',
        'IT': 'WŁOCHY',
        'BE': 'BELGIA',
        'CZ': 'CZECHY',
        'SK': 'SŁOWACJA',
        'HU': 'WĘGRY',
        'AT': 'AUSTRIA'
    };

    /* ── Reguły miast → kraj ──────────────────────────────────────────────
     * Kolejność pozycji tablicy jest kolejnością rozstrzygania konfliktu,
     * gdy tekst lokalizacji zawiera miasta z różnych krajów: CN, PL, DE, NL.
     * Nazwy miast zapisane małymi literami — porównanie na tekście
     * sprowadzonym do małych liter.
     */
    var FXTRK_CITY_RULES = [
        {
            code: 'CN',
            cities: [
                'shanghai', 'szanghaj', '上海',
                'shenzhen', '深圳',
                'putian', '莆田',
                'beijing', '北京', 'pekin'
            ]
        },
        {
            code: 'PL',
            cities: [
                'poznan', 'poznań',
                'stalowa wola',
                'warszawa',
                'stryków', 'strykow',
                'rudnik'
            ]
        },
        {
            code: 'DE',
            cities: [
                'bremen', 'brema',
                'hamburg'
            ]
        },
        {
            code: 'NL',
            cities: [
                'oirschot',
                'vijfhuizen',
                'veenendaal'
            ]
        }
    ];

    /* ── Ogólne nazwy krajów pojawiające się jako cała lokalizacja ────────── */
    var FXTRK_GENERIC_COUNTRY_LABELS = {
        'holandia': 'NL',
        'holland': 'NL',
        'netherlands': 'NL',
        'polska': 'PL',
        'poland': 'PL',
        'niemcy': 'DE',
        'germany': 'DE',
        'chiny': 'CN',
        'china': 'CN'
    };

    /* ── Kamienie milowe ─────────────────────────────────────────────────────
     * Kolejność tablicy jest znacząca: od `delivered` do `packaging`.
     * Pierwsze dopasowanie wygrywa (wymaganie 5.1).
     * Wzorce zapisane małymi literami — dopasowanie po podłańcuchu na
     * złączeniu pól Status i Lokalizacja sprowadzonym do małych liter.
     * Obok wzorców angielskich i chińskich listy zawierają polskie
     * odpowiedniki, ponieważ pola Status i Lokalizacja przychodzą
     * z Funkcji_Śledzenia już po polsku.
     */
    var FXTRK_MILESTONES = [
        {
            key: 'delivered',
            patterns: [
                'delivered successfully', 'successfully delivered', 'delivery successful',
                'delivered.', 'dostarczono', 'dostarczona', 'pomyślnie dostarczona',
                'przesyłka została pomyślnie dostarczona', 'dostarczone pomyślnie',
                'twoja paczka została pomyślnie dostarczona',
                '已签收', '签收'
            ],
            minDays: 0,
            maxDays: 0,
            labelPl: 'DOSTARCZONO',
            labelEn: 'DELIVERED'
        },
        {
            key: 'out_for_delivery',
            patterns: [
                'out for delivery', 'being delivered', 'loaded to movement',
                'loaded onto the delivery vehicle', 'on its way to the consignee',
                'załadowana na pojazd dostawczy', 'w drodze do dostawy',
                'w drodze do odbiorcy', 'przekazano do doręczenia',
                'załadowany do pojazdu transportowego'
            ],
            minDays: 0,
            maxDays: 1,
            labelPl: 'W DOSTAWIE',
            labelEn: 'OUT FOR DELIVERY'
        },
        {
            key: 'at_delivery_depot',
            patterns: [
                'at parcel delivery centre', 'parcel delivery centre',
                'being prepared for delivery in the delivery depot',
                'shipment processed at delivery depot',
                'parcel center',
                'przygotowywana do doręczenia w magazynie dostaw',
                'w centrum dostaw', 'w centrum doręczeń',
                'w centrum dystrybucyjnym', 'w centrum wysyłkowym'
            ],
            minDays: 1,
            maxDays: 2,
            labelPl: 'W CENTRUM DOSTAWY',
            labelEn: 'AT DELIVERY DEPOT'
        },
        {
            key: 'arrived_destination',
            patterns: [
                'arrived in the destination country',
                'destination country/destination area',
                'ruda slaska', 'strykow', 'stalowa wola', 'dobra', 'poznan',
                '(pl)', 'poland, the shipment',
                'dotarła do kraju docelowego', 'dotarła do regionu odbiorcy',
                'polska'
            ],
            minDays: 1,
            maxDays: 3,
            labelPl: 'W KRAJU DOCELOWYM',
            labelEn: 'IN DESTINATION COUNTRY'
        },
        {
            key: 'in_germany',
            patterns: [
                'germany, germany', 'germany, the international', 'germany, the shipment',
                'frankfurt', 'hamburg', 'duisburg', 'mörsdorf',
                'parcel center of origin', 'export parcel center',
                'przetworzona w centrum nadania', 'przetworzona w centrum eksportu',
                'brema', 'niemcy'
            ],
            minDays: 2,
            maxDays: 4,
            labelPl: 'W NIEMCZECH',
            labelEn: 'IN GERMANY'
        },
        {
            key: 'handed_to_courier',
            patterns: [
                'in transit to dhl', 'shipment is in transit to dhl', 'transit to dhl',
                'hand over service provider', 'handed to dhl', 'pick-up was successful',
                'odbiór przebiegł pomyślnie', 'przekazano dostawcy usług',
                'dostawca usług dostawy'
            ],
            minDays: 2,
            maxDays: 5,
            labelPl: 'PRZEKAZANO DO KURIERA',
            labelEn: 'HANDED TO COURIER'
        },
        {
            key: 'customs_cleared',
            patterns: [
                'customs clearance completed', 'item have been cleared',
                'cleared customs', 'customs clearance pending scanning',
                'odprawa celna zakończona', 'przedmiot został odprawiony',
                'odprawa celna w miejscu przeznaczenia zakończona',
                '清关完成'
            ],
            minDays: 3,
            maxDays: 6,
            labelPl: 'ODPRAWA CELNA ZAKOŃCZONA',
            labelEn: 'CUSTOMS CLEARED'
        },
        {
            key: 'flight_arrived',
            patterns: [
                'flight has arrived', 'the flight has arrived',
                'item arrived at destination', 'dismantling the board',
                'item start customs clearance',
                'lot dotarł', 'lot przyleciał', 'przedmiot dotarł do celu',
                'demontaż z pokładu', 'demontaż tablicy',
                'dotarła na lotnisko docelowe',
                '航班已抵达'
            ],
            minDays: 4,
            maxDays: 8,
            labelPl: 'LOT PRZYLECIAŁ (NL/AMS)',
            labelEn: 'FLIGHT ARRIVED (NL/AMS)'
        },
        {
            key: 'flight_departed',
            patterns: [
                'flight has departed', 'item departed from origin', 'flight departed',
                'lot odleciał', 'lot wyleciał', 'przedmiot opuścił miejsce nadania',
                '航班已起飞'
            ],
            minDays: 6,
            maxDays: 10,
            labelPl: 'LOT WYLECIAŁ',
            labelEn: 'FLIGHT DEPARTED'
        },
        {
            key: 'export_customs',
            patterns: [
                'export customs clearance completed', 'the goods leave the operation center',
                'item outbound in sorting center', 'leave the scan', 'outbound',
                'eksportowa odprawa celna zakończona',
                'zakończono odprawę celną eksportową',
                'opuściła centrum operacyjne', 'opuszcza centrum operacyjne',
                'wyszedł z centrum sortowniczego', 'skanowanie wyjścia',
                '出口清关完成', '出口清关完毕'
            ],
            minDays: 8,
            maxDays: 14,
            labelPl: 'ODPRAWA EKSPORTOWA CN',
            labelEn: 'EXPORT CUSTOMS CN'
        },
        {
            key: 'arrived_sorting',
            patterns: [
                'arrived at the operating center', 'goods have been received',
                'shipment information received', 'arrived at operating center',
                'dotarła do centrum operacyjnego', 'dotarł do centrum operacyjnego',
                'towary zostały odebrane', 'otrzymane informacje o przesyłce',
                'otrzymano informacje o przesyłce', 'otrzymano informację o wysyłce'
            ],
            minDays: 10,
            maxDays: 17,
            labelPl: 'CENTRUM SORTOWANIA CN',
            labelEn: 'SORTING CENTER CN'
        },
        {
            key: 'packaging',
            patterns: [
                'leaving the warehouse', 'packaging completed',
                'leaving warehouse', 'leaving the warehouse and shipping',
                'opuszczenie magazynu', 'pakowanie zakończone',
                'wysłana z magazynu', 'towary zostały wysłane'
            ],
            minDays: 11,
            maxDays: 19,
            labelPl: 'NADANA W CHINACH',
            labelEn: 'SHIPPED FROM CHINA'
        }
    ];

    /* ── Korekta kraju docelowego w dniach doliczana do bazy PL ───────────────
     * Wartość dodatnia = wolniej (dalej od węzła NL/DE albo dodatkowa odprawa),
     * wartość ujemna = szybciej (przesyłka trafia do kraju węzła).
     */
    var FXTRK_COUNTRY_DELTA = {
        // UE / Schengen, blisko węzła DE/NL
        NL: -3,
        BE: -2,
        DE: -1,
        AT: 1,
        CZ: 0,
        SK: 0,
        HU: 1,
        PL: 0,
        // Europa Zachodnia
        FR: 2,
        LU: 1,
        CH: 2,
        LI: 2,
        // Półwysep Iberyjski
        ES: 3,
        PT: 4,
        // Włochy / basen Morza Śródziemnego
        IT: 2,
        SI: 1,
        HR: 2,
        // Europa Północna
        DK: 2,
        SE: 3,
        NO: 4,
        FI: 4,
        IS: 6,
        // Europa Wschodnia
        RO: 2,
        BG: 3,
        GR: 3,
        RS: 5,
        BA: 5,
        MK: 5,
        AL: 6,
        ME: 5,
        // Kraje bałtyckie
        EE: 3,
        LV: 3,
        LT: 2,
        // Wielka Brytania (odprawa po brexicie)
        GB: 5,
        UK: 5,
        // Turcja
        TR: 6,
        // Bliski Wschód
        AE: 7,
        SA: 8,
        IL: 7,
        // USA / Kanada
        US: 10,
        CA: 12,
        // Azja i Pacyfik
        AU: 14,
        NZ: 16,
        JP: 8,
        KR: 7,
        SG: 8,
        // Pozostałe
        RU: 9,
        UA: 7
    };

    /* ── Mapa symboliczna kluczy Słownika_Tłumaczeń ───────────────────────────
     * Wartości są polskimi tekstami źródłowymi, którymi kluczowany jest
     * słownik i18n Strony_Statycznej. Zadanie 9.1 dodaje odpowiadające im
     * pary w i18n.pl i i18n.en.
     * Zero kluczy mapy 3D i zero etykiet wersji testowej (wymaganie 12.7).
     */
    var FXTRK_TRK_KEYS = {
        // 17 kluczy interfejsu śledzenia
        title:            'Śledzenie Przesyłki',
        subtitle:         'Wprowadź kod śledzenia, aby sprawdzić status swojej paczki',
        placeholder:      'Wprowadź kod śledzenia...',
        mainInfo:         'Informacje Główne',
        reference:        'Numer referencyjny',
        trackingNumber:   'Numer śledzenia',
        country:          'Kraj',
        date:             'Data',
        recipient:        'Odbiorca',
        status:           'Ostatni status',
        history:          'Historia Przesyłki',
        location:         'Lokalizacja',
        showLess:         'Pokaż mniej',
        showMore:         'Pokaż więcej',
        errorServer:      'Błąd serwera',
        errorNotFound:    'Nie znaleziono informacji o przesyłce',
        errorGeneral:     'Błąd połączenia',
        // Klucze pomocnicze — walidacja
        errorInvalidCode: 'Nieprawidłowy kod śledzenia',
        // Klucze pomocnicze — limit zapytań
        errorRateLimited: 'Zbyt wiele zapytań. Spróbuj ponownie za',
        secondsUnit:      'sekund',
        // Klucze pomocnicze — schowek
        copied:           'Skopiowano',
        errorClipboard:   'Nie udało się skopiować do schowka',
        // Klucze pomocnicze — poziomy pewności
        confidenceHigh:   'Wysoka pewność szacowania',
        confidenceMedium: 'Średnia pewność szacowania',
        confidenceLow:    'Niska pewność szacowania'
    };

    /* ── Wzorzec CJK (zakres znaków chińskich/japońskich/koreańskich i in.) ─ */
    var FXTRK_CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/g;

    /* ── Tabela lokalizacji polskich → angielskie (używana przy lang=en) ─────
     * Wartości odpowiadają znormalizowanym angielskim nazwom miejscowości
     * i krajów wyświetlanym po wybraniu języka angielskiego.
     */
    var FXTRK_LOCATION_PL_TO_EN = {
        'Polska':       'Poland',
        'POLSKA':       'Poland',
        'Niemcy':       'Germany',
        'NIEMCY':       'Germany',
        'Holandia':     'Netherlands',
        'HOLANDIA':     'Netherlands',
        'Szanghaj':     'Shanghai',
        'Pekin':        'Beijing',
        'Kanton':       'Guangzhou',
        // Polskie znormalizowane nazwy centrów
        'Centrum dystrybucji':   'Distribution Center',
        'Centrum tranzytowe':    'Transit Center',
        'Centrum operacyjne':    'Operations Center',
        'Centrum sortowania':    'Sorting Center',
        'Centrum dystrybucyjne': 'Distribution Center',
        'Centrum dostaw':        'Delivery Center',
        'Centrum doręczeń':      'Delivery Center',
        'Centrum wysyłkowe':     'Dispatch Center',
        'Centrala':              'General Office',
        'Oddział':               'Branch Office'
    };

    /* ── Pomocnicze funkcje obsługi CJK i oczyszczania łańcuchów ─────────── */

    /** Redukcja wielokrotnych spacji do jednej, usunięcie spacji z brzegów. */
    function fxtrkCleanSpaces(s) {
        return s.replace(/\s{2,}/g, ' ').trim();
    }

    /**
     * Usuwa znaki CJK ze łańcucha, zachowując tekst natywny.
     * @param {string} text
     * @returns {string}
     */
    function fxtrkStripChineseOnly(text) {
        if (!text) return text;
        return fxtrkCleanSpaces(text.replace(FXTRK_CJK_REGEX, ''));
    }

    /**
     * Tłumaczy chińskie frazy przez FXTRK_CHINESE_TO_EN, następnie usuwa
     * pozostałe znaki CJK.
     * @param {string} text
     * @returns {string}
     */
    function fxtrkStripChineseToEn(text) {
        if (!text) return text;
        var result = text;
        var entries = Object.keys(FXTRK_CHINESE_TO_EN);
        for (var i = 0; i < entries.length; i++) {
            var zh = entries[i];
            var en = FXTRK_CHINESE_TO_EN[zh];
            result = result.split(zh).join(en);
        }
        return fxtrkCleanSpaces(result.replace(FXTRK_CJK_REGEX, ''));
    }

    /**
     * Normalizacja tekstu dla języków innych niż angielski:
     * - jeśli po usunięciu CJK pozostaje znaczący tekst natywny → zwraca go
     *   (typ B: „航班已起飞Lot odleciał" → „Lot odleciał")
     * - jeśli tekst jest wyłącznie CJK → tłumaczy przez CHINESE_TO_EN
     *   (typ A: „收货扫描" → „Receiving scan")
     * @param {string} text
     * @returns {string}
     */
    function fxtrkNormalize(text) {
        var stripped = fxtrkStripChineseOnly(text);
        // Znaczący = co najmniej 2 znaki inne niż cyfry i znaki interpunkcyjne
        var meaningful = stripped.replace(/[\d\s\-\/:.,()\[\]]/g, '').length >= 2;
        return meaningful ? stripped : fxtrkStripChineseToEn(text);
    }

    /* ── validateCode ─────────────────────────────────────────────────────────
     * Identyczna reguła z lib/validateCode.js (wymaganie 1.11, 2.14).
     * Wejście: string (lub cokolwiek).
     * Wyjście: { ok: boolean, normalized: string }
     *   ok = true  gdy po trim() długość 6–40 i wyłącznie litery, cyfry, łącznik
     *   ok = false gdy wejście puste/białe/za krótkie/za długie/niedozwolony znak
     * normalized — po trim() i toUpperCase() (tylko gdy ok = true; gdy ok = false
     *   to trim() wejścia, ale bez uToUpperCase, bo znak niedozwolony mógłby zmylić)
     */
    function validateCode(raw) {
        if (typeof raw !== 'string') {
            return { ok: false, normalized: '' };
        }
        var trimmed = raw.trim();
        if (trimmed.length < 6 || trimmed.length > 40) {
            return { ok: false, normalized: trimmed };
        }
        if (!/^[A-Za-z\u00C0-\u024F\d-]+$/.test(trimmed)) {
            return { ok: false, normalized: trimmed };
        }
        return { ok: true, normalized: trimmed.toUpperCase() };
    }

    /* ── translateStatusForLang ───────────────────────────────────────────────
     * Wybiera odpowiedni tekst statusu dla języka wyświetlania (wymaganie 10.3,
     * 10.8, 2.1).
     *
     * @param {object} event  Zdarzenie_Śledzenia z polami Status i OriginalStatus
     * @param {string} lang   'pl' | 'en' (lub inny, traktowany jak 'pl')
     * @returns {string}
     *
     * Dla pl (i każdego kodu innego niż 'en'):
     *   Zwraca event.Status bez zmian (przetworzone przez serwer, po polsku).
     *
     * Dla en:
     *   1. Pobiera event.OriginalStatus (surowy tekst z upstream).
     *   2. Przepuszcza przez fxtrkStripChineseToEn (CHINESE_TO_EN + usunięcie CJK).
     *   3. Zwraca wynik.
     */
    function translateStatusForLang(event, lang) {
        if (!event) return '';
        if (lang === 'en') {
            var orig = event.OriginalStatus || '';
            return fxtrkStripChineseToEn(orig);
        }
        // pl i wszystkie inne języki → przetworzone po polsku z serwera
        return event.Status || '';
    }

    /* ── translateLocationForLang ─────────────────────────────────────────────
     * Wybiera odpowiedni tekst lokalizacji dla języka wyświetlania (wymaganie
     * 10.3, 10.8, 2.14).
     *
     * @param {object} event  Zdarzenie_Śledzenia z polami Lokalizacja i OriginalLocation
     * @param {string} lang   'pl' | 'en' (lub inny, traktowany jak 'pl')
     * @returns {string}
     *
     * Dla pl (i każdego kodu innego niż 'en'):
     *   Zwraca event.Lokalizacja bez zmian.
     *
     * Dla en:
     *   1. Pobiera event.OriginalLocation (surowy tekst z upstream).
     *   2. Przepuszcza przez fxtrkStripChineseToEn (CHINESE_TO_EN + usunięcie CJK).
     *   3. Stosuje tabelę FXTRK_LOCATION_PL_TO_EN (zamienia polskie nazwy na angielskie).
     *   4. Zwraca wynik po fxtrkCleanSpaces.
     */
    function translateLocationForLang(event, lang) {
        if (!event) return '';
        if (lang === 'en') {
            var orig = event.OriginalLocation || '';
            // Krok 1: transliteracja chińskiego + usunięcie CJK
            var result = fxtrkStripChineseToEn(orig);
            // Krok 2: zamiana polskich nazw lokalizacji na angielskie
            var keys = Object.keys(FXTRK_LOCATION_PL_TO_EN);
            for (var i = 0; i < keys.length; i++) {
                var pl = keys[i];
                var en = FXTRK_LOCATION_PL_TO_EN[pl];
                if (result.indexOf(pl) !== -1) {
                    result = result.split(pl).join(en);
                }
            }
            return fxtrkCleanSpaces(result);
        }
        // pl i wszystkie inne języki → przetworzone po polsku z serwera
        return event.Lokalizacja || '';
    }

    /* ── getCountryInfo ───────────────────────────────────────────────────────
     * Określa kraj zdarzenia na podstawie 6 reguł (w tej kolejności).
     * Pierwsze dopasowanie kończy przeszukiwanie; żadna reguła nie modyfikuje
     * obiektu wejściowego (wymagania 4.1–4.5, 4.11–4.13).
     *
     * Reguły (kolejność):
     *   1. Wyświetlana lokalizacja jest ogólną nazwą Holandii → CN (błędna klasyfikacja)
     *   2. originalLocation lub originalStatus zawiera znane miasto CN/PL/DE/NL
     *      (pierwszeństwo wg kolejności w FXTRK_CITY_RULES: CN, PL, DE, NL)
     *   3. Reguły oparte na treści originalStatus (loty, odprawy, statusy DHL…)
     *   4. Dokładne kody krajów w originalLocation ('pl', 'de', 'nl', 'germany',
     *      'netherlands')
     *   5. Jakikolwiek znak CJK w originalStatus lub originalLocation → CN
     *   6. Domyślnie → CN (CHINY)
     *
     * @param {object} item  Zdarzenie_Śledzenia
     * @returns {{ code: 'CN'|'NL'|'DE'|'PL', name: 'CHINY'|'HOLANDIA'|'NIEMCY'|'POLSKA' }}
     */
    function getCountryInfo(item) {
        var location         = (item.Lokalizacja       || '').toLowerCase();
        var originalLocation = (item.OriginalLocation  || '').toLowerCase();
        var originalStatus   = (item.OriginalStatus    || '').toLowerCase();

        /* Reguła 1: wyświetlana lokalizacja to ogólna nazwa Holandii → CN */
        if (location === 'holandia' || location === 'holland' || location === 'netherlands') {
            return { code: 'CN', name: 'CHINY' };
        }

        /* Reguła 2: znane nazwy miast (FXTRK_CITY_RULES) — priorytet CN>PL>DE>NL */
        for (var ci = 0; ci < FXTRK_CITY_RULES.length; ci++) {
            var rule = FXTRK_CITY_RULES[ci];
            for (var ki = 0; ki < rule.cities.length; ki++) {
                var city = rule.cities[ki];
                if (originalLocation.indexOf(city) !== -1 ||
                    originalStatus.indexOf(city) !== -1) {
                    return { code: rule.code, name: FXTRK_COUNTRY_MAP[rule.code] };
                }
            }
        }

        /* Reguła 3: reguły statusowe */

        // Polska — odprawa wejściowa
        if (originalStatus.indexOf('poland, the international shipment has been processed in the parcel center of origin') !== -1) {
            return { code: 'PL', name: 'POLSKA' };
        }
        // Niemcy — centrum tranzytowe
        if (originalStatus.indexOf('germany, the international shipment has been processed') !== -1) {
            return { code: 'DE', name: 'NIEMCY' };
        }
        // Dostarczone = Polska
        if (originalStatus.indexOf('successfully delivered') !== -1 ||
            originalStatus.indexOf('pomyślnie dostarczona') !== -1 ||
            originalStatus.indexOf('delivered successfully') !== -1 ||
            originalStatus.indexOf('签收') !== -1) {
            return { code: 'PL', name: 'POLSKA' };
        }
        // Operacje DHL na terenie Polski
        if (originalStatus.indexOf('poland, the shipment has been loaded onto the delivery vehicle') !== -1 ||
            originalStatus.indexOf('poland, the shipment is being prepared for delivery') !== -1 ||
            originalStatus.indexOf('poland, the shipment has been processed in the parcel center') !== -1 ||
            originalStatus.indexOf('poland, the shipment has arrived in the destination country') !== -1 ||
            originalStatus.indexOf('loaded onto the delivery vehicle') !== -1 ||
            originalStatus.indexOf('prepared for delivery in the delivery depot') !== -1) {
            return { code: 'PL', name: 'POLSKA' };
        }
        // Dotarła do kraju docelowego
        if (originalStatus.indexOf('the shipment has arrived in the destination country') !== -1) {
            return { code: 'PL', name: 'POLSKA' };
        }
        // Przetworzona w docelowym centrum
        if (originalStatus.indexOf('processed in the destination parcel center') !== -1 ||
            originalStatus.indexOf('unloaded from movement') !== -1 ||
            originalStatus.indexOf('przesyłka została przetworzona w docelowym centrum obsługi paczek') !== -1 ||
            originalStatus.indexOf('rozładunek z pojazdu transportowego') !== -1 ||
            originalStatus.indexOf('przybył pojazd transportowy') !== -1) {
            if (originalLocation.indexOf('poznan') !== -1 || originalLocation.indexOf('poznań') !== -1 ||
                originalLocation.indexOf('stalowa') !== -1 || originalLocation.indexOf('rudnik') !== -1 ||
                originalLocation.indexOf('polska') !== -1 || originalLocation === 'pl') {
                return { code: 'PL', name: 'POLSKA' };
            }
        }
        // Przetworzona w centrum nadania
        if (originalStatus.indexOf('processed in the parcel center of origin') !== -1 ||
            originalStatus.indexOf('przetworzona w centrum dystrybucyjnym of origin') !== -1) {
            if (originalLocation.indexOf('poznan') !== -1 || originalLocation.indexOf('poznań') !== -1 ||
                originalLocation.indexOf('stalowa') !== -1 || originalLocation.indexOf('rudnik') !== -1 ||
                originalLocation.indexOf('polska') !== -1) {
                return { code: 'PL', name: 'POLSKA' };
            }
            if (originalLocation.indexOf('bremen') !== -1 || originalLocation.indexOf('brema') !== -1) {
                return { code: 'DE', name: 'NIEMCY' };
            }
        }
        // Lot wyleciał → CN
        if (originalStatus.indexOf('flight has departed') !== -1 ||
            originalStatus.indexOf('航班已起飞') !== -1) {
            return { code: 'CN', name: 'CHINY' };
        }
        // Lot przyleciał → NL
        if (originalStatus.indexOf('flight has arrived') !== -1 ||
            originalStatus.indexOf('航班已抵达') !== -1) {
            return { code: 'NL', name: 'HOLANDIA' };
        }
        // Odprawa eksportowa → CN
        if (originalStatus.indexOf('export customs clearance completed') !== -1 ||
            originalStatus.indexOf('出口清关完成') !== -1 ||
            originalStatus.indexOf('export customs') !== -1 ||
            originalStatus.indexOf('odprawa celna eksportowa') !== -1 ||
            originalStatus.indexOf('expected flight') !== -1 ||
            originalStatus.indexOf('预计') !== -1) {
            return { code: 'CN', name: 'CHINY' };
        }
        // Import: specyficzne statusy → NL
        if (originalStatus.indexOf('customs clearance completed pending scanning') !== -1 ||
            originalStatus.indexOf('清关完成,等待提取') !== -1 ||
            originalStatus.indexOf('dismantling the board') !== -1 ||
            originalStatus.indexOf('拆板中') !== -1) {
            return { code: 'NL', name: 'HOLANDIA' };
        }
        // Odprawa celna zakończona (bez 'export') — kontekst
        if ((originalStatus.indexOf('odprawa celna zakończona') !== -1 ||
             originalStatus.indexOf('customs clearance completed') !== -1 ||
             originalStatus.indexOf('清关完成') !== -1) &&
            originalStatus.indexOf('export') === -1 &&
            originalStatus.indexOf('eksportowa') === -1 &&
            originalStatus.indexOf('出口') === -1) {
            if (originalStatus.indexOf('抵达【ams】') !== -1) {
                return { code: 'NL', name: 'HOLANDIA' };
            }
            if (originalLocation.indexOf('amsterdam') !== -1 ||
                originalLocation.indexOf('rotterdam') !== -1 ||
                originalLocation.indexOf('eindhoven') !== -1 ||
                originalLocation.indexOf('oirschot') !== -1 ||
                originalLocation.indexOf('vijfhuizen') !== -1) {
                return { code: 'NL', name: 'HOLANDIA' };
            }
            if (originalLocation.indexOf('holandia') !== -1 ||
                originalLocation.indexOf('holland') !== -1 ||
                originalLocation.indexOf('netherlands') !== -1) {
                return { code: 'CN', name: 'CHINY' };
            }
            return { code: 'NL', name: 'HOLANDIA' };
        }
        // Krótki kod "ams" bez kontekstu przyjazdu → CN
        if (originalStatus.trim() === 'ams' &&
            originalStatus.indexOf('抵达') === -1 &&
            originalStatus.indexOf('arrived') === -1) {
            return { code: 'CN', name: 'CHINY' };
        }
        // Chińskie operacje magazynowe → CN
        if (originalStatus.indexOf('货物离开操作中心') !== -1 ||
            originalStatus.indexOf('到达操作中心') !== -1 ||
            originalStatus.indexOf('快件到达机场') !== -1 ||
            originalStatus.indexOf('快件已出库') !== -1 ||
            originalStatus.indexOf('启运') !== -1 ||
            originalStatus.indexOf('快件到达始发地海关') !== -1) {
            return { code: 'CN', name: 'CHINY' };
        }
        // Dotarł do AMS → NL
        if (originalStatus.indexOf('抵达【ams】') !== -1) {
            return { code: 'NL', name: 'HOLANDIA' };
        }
        if (originalStatus.indexOf('目的地清关完成') !== -1) {
            return { code: 'NL', name: 'HOLANDIA' };
        }
        // Informacje wstępne → CN
        if (originalStatus.indexOf('shipment information received') !== -1 ||
            originalStatus.indexOf('货物电子信息已经收到') !== -1 ||
            originalStatus.indexOf('instruction data') !== -1 ||
            originalStatus.indexOf('已预报') !== -1) {
            return { code: 'CN', name: 'CHINY' };
        }
        // Odbiór przez kuriera → DE
        if (originalStatus.indexOf('pick-up was successful') !== -1 ||
            originalStatus.indexOf('odbiór przebiegł pomyślnie') !== -1) {
            return { code: 'DE', name: 'NIEMCY' };
        }
        // Załadowany do pojazdu — rozróżnienie PL/DE
        if (originalStatus.indexOf('loaded to movement') !== -1 ||
            originalStatus.indexOf('załadowany do pojazdu') !== -1) {
            /* Serwer_Upstream podaje Polskę jako dwuliterowe `PL`, nie jako
             * pełną nazwę — bez tego warunku zdarzenie spadało do gałęzi DE. */
            if (originalStatus.indexOf('polska') !== -1 ||
                originalLocation === 'pl' ||
                originalLocation.indexOf('polska') !== -1 ||
                originalLocation.indexOf('poland') !== -1) {
                return { code: 'PL', name: 'POLSKA' };
            }
            if (originalLocation.indexOf('poznan') !== -1 || originalLocation.indexOf('poznań') !== -1 ||
                originalLocation.indexOf('stalowa') !== -1 || originalLocation.indexOf('rudnik') !== -1 ||
                originalLocation.indexOf('warszawa') !== -1) {
                return { code: 'PL', name: 'POLSKA' };
            }
            return { code: 'DE', name: 'NIEMCY' };
        }

        /* Reguła 4: dokładne kody krajów w originalLocation */
        if (originalLocation === 'pl') {
            return { code: 'PL', name: 'POLSKA' };
        }
        if (originalLocation === 'de' || originalLocation === 'germany') {
            return { code: 'DE', name: 'NIEMCY' };
        }
        if (originalLocation === 'nl' || originalLocation === 'netherlands') {
            return { code: 'NL', name: 'HOLANDIA' };
        }

        /* Reguła 5: jakikolwiek znak CJK → CN */
        if (/[\u4e00-\u9fa5]/.test(originalStatus) || /[\u4e00-\u9fa5]/.test(originalLocation)) {
            return { code: 'CN', name: 'CHINY' };
        }

        /* Reguła 6: domyślnie → CN */
        return { code: 'CN', name: 'CHINY' };
    }

    /* ── groupByCountry ───────────────────────────────────────────────────────
     * Grupuje zdarzenia po kraju, a następnie scala sąsiadujące grupy
     * z identycznym kodem kraju (wymagania 4.2, 4.3, 4.4, 4.5, 4.12, 4.13).
     *
     * Algorytm:
     *   1. Iteruje zdarzenia w kolejności wejściowej.
     *   2. Gdy kod kraju różni się od poprzedniego → otwiera nową grupę.
     *   3. Po zebraniu surowych grup scala sąsiednie o tym samym kodzie.
     *
     * Niezmiennik: każde dwie sąsiednie grupy w wyniku mają różny `code`.
     * Suma items.length = liczba zdarzeń wejściowych.
     *
     * @param {object[]} events  Zdarzenie_Śledzenia[]
     * @returns {{ code: string, name: string, items: object[] }[]}
     */
    function groupByCountry(events) {
        if (!Array.isArray(events) || events.length === 0) {
            return [];
        }

        /* Krok 1: budowa surowych grup (zmiana kodu = nowa grupa) */
        var rawGroups = [];
        var currentGroup = null;

        for (var i = 0; i < events.length; i++) {
            var item    = events[i];
            var country = getCountryInfo(item);
            if (!currentGroup || currentGroup.code !== country.code) {
                currentGroup = { code: country.code, name: country.name, items: [] };
                rawGroups.push(currentGroup);
            }
            currentGroup.items.push(item);
        }

        /* Krok 2: scalanie sąsiadujących grup z identycznym kodem */
        var groups = [];
        for (var j = 0; j < rawGroups.length; j++) {
            var group = rawGroups[j];
            var prev  = groups[groups.length - 1];
            if (prev && prev.code === group.code) {
                prev.items = prev.items.concat(group.items);
            } else {
                groups.push({ code: group.code, name: group.name, items: group.items.slice() });
            }
        }

        return groups;
    }

    /* ── resolveDisplayLocation ───────────────────────────────────────────────
     * Gdy pole Lokalizacja zawiera wyłącznie ogólną nazwę kraju (klucz w
     * FXTRK_GENERIC_COUNTRY_LABELS) INNEGO niż kraj grupy (groupCode), zwraca
     * polską nazwę kraju grupy z FXTRK_COUNTRY_MAP, zachowując datę i status
     * bez zmian. W każdym innym przypadku zwraca rawLocation bez modyfikacji.
     * (wymagania 4.8)
     *
     * @param {string} rawLocation  Wartość pola Lokalizacja zdarzenia
     * @param {string} groupCode    Kod kraju grupy ('CN'|'NL'|'DE'|'PL')
     * @returns {string}
     */
    function resolveDisplayLocation(rawLocation, groupCode) {
        var trimmed = (rawLocation || '').trim();
        var lower   = trimmed.toLowerCase();

        /* Sprawdź czy to ogólna nazwa kraju */
        if (!Object.prototype.hasOwnProperty.call(FXTRK_GENERIC_COUNTRY_LABELS, lower)) {
            return rawLocation;
        }

        var labelCountryCode = FXTRK_GENERIC_COUNTRY_LABELS[lower];

        /* Jeśli kod z etykiety zgadza się z kodem grupy — pozostaw bez zmian */
        if (labelCountryCode === groupCode) {
            return rawLocation;
        }

        /* Ogólna nazwa różni się od kodu grupy → zastąp nazwą kraju grupy */
        return FXTRK_COUNTRY_MAP[groupCode] || rawLocation;
    }

    /* ── detectMilestone ─────────────────────────────────────────────────────
     * Skanuje zdarzenia od najnowszego (index 0), szukając pierwszego pasującego
     * Kamienia_Milowego. Dla każdego zdarzenia kolejno sprawdza milestones
     * w kolejności tablicy FXTRK_MILESTONES (od 'delivered' do 'packaging').
     * Dopasowanie po podłańcuchu na złączeniu (Status + ' ' + Lokalizacja)
     * sprowadzonym do małych liter.
     * (wymagania 5.1)
     *
     * @param {object[]} events  Zdarzenie_Śledzenia[] — posortowane od najnowszego
     * @returns {{ milestone: string, milestoneDate: Date|null }|null}
     */
    function detectMilestone(events) {
        if (!Array.isArray(events) || events.length === 0) {
            return null;
        }

        for (var ei = 0; ei < events.length; ei++) {
            var event = events[ei];
            var text  = ((event.Status || '') + ' ' + (event.Lokalizacja || '')).toLowerCase();

            for (var mi = 0; mi < FXTRK_MILESTONES.length; mi++) {
                var milestone = FXTRK_MILESTONES[mi];
                var patterns  = milestone.patterns;

                for (var pi = 0; pi < patterns.length; pi++) {
                    if (text.indexOf(patterns[pi]) !== -1) {
                        /* Dopasowanie znalezione — wyznacz datę */
                        var rawDate = event.OriginalDate;
                        var parsed  = rawDate ? new Date(rawDate) : null;
                        var milestoneDate = (parsed && !isNaN(parsed.getTime())) ? parsed : null;

                        return {
                            milestone:     milestone.key,
                            milestoneDate: milestoneDate
                        };
                    }
                }
            }
        }

        return null;
    }

    /* ── formatDateRange ─────────────────────────────────────────────────────
     * Formatuje przedział dat do postaci "12 lis – 18 lis" (pl) lub
     * "12 Nov – 18 Nov" (en). Dla języków nieobsługiwanych przez środowisko
     * wraca do 'pl-PL'.
     * (wymagania 5.10, 5.11)
     *
     * @param {Date} earliest
     * @param {Date} latest
     * @param {string} lang 'pl' | 'en'
     * @returns {string}
     */
    function formatDateRange(earliest, latest, lang) {
        var locale = (lang === 'en') ? 'en-GB' : 'pl-PL';
        var opts   = { day: 'numeric', month: 'short' };

        var fmtEarliest, fmtLatest;
        try {
            fmtEarliest = earliest.toLocaleDateString(locale, opts);
            fmtLatest   = latest.toLocaleDateString(locale, opts);
        } catch (e) {
            fmtEarliest = earliest.toLocaleDateString('pl-PL', opts);
            fmtLatest   = latest.toLocaleDateString('pl-PL', opts);
        }

        return fmtEarliest + ' \u2013 ' + fmtLatest;
    }

    /* ── confidenceLabel ─────────────────────────────────────────────────────
     * Zwraca etykietę tekstową poziomu pewności. Używa mapy FXTRK_TRK_KEYS
     * bezpośrednio (funkcja trkT jest definiowana w zadaniu 9.1).
     * (wymaganie 5.12)
     *
     * @param {'high'|'medium'|'low'} confidence
     * @param {string} lang 'pl' | 'en'
     * @returns {string}
     */
    function confidenceLabel(confidence, lang) {
        var keyMap = {
            high:   'confidenceHigh',
            medium: 'confidenceMedium',
            low:    'confidenceLow'
        };
        var trkKey = keyMap[confidence] || 'confidenceLow';
        var plText = FXTRK_TRK_KEYS[trkKey] || trkKey;

        /* Gdy trkT będzie dostępna (zadanie 9.1) można ją tu podstawić.
         * Na razie bezpośredni odczyt ze słownika i18n z fallbackiem. */
        if (lang === 'en') {
            try {
                if (typeof i18n !== 'undefined' && i18n.en && i18n.en[plText]) {
                    return i18n.en[plText];
                }
            } catch (e) { /* i18n może nie być dostępne w piaskownicy testu */ }
        }
        return plText;
    }

    /* ── getCountryDeltaNote ─────────────────────────────────────────────────
     * Zwraca adnotację o korekcie krajowej, np. "+2 dni (ES)" lub null gdy
     * delta === 0.
     * (wymaganie 5.7)
     *
     * @param {string} countryCode znormalizowany kod 2-literowy
     * @param {number} delta
     * @param {string} lang 'pl' | 'en'
     * @returns {string|null}
     */
    function getCountryDeltaNote(countryCode, delta, lang) {
        if (!delta) return null;
        var sign = (delta > 0) ? '+' : '';
        var unit = (lang === 'en') ? 'days' : 'dni';
        return sign + delta + ' ' + unit + ' (' + countryCode + ')';
    }

    /* ── estimateDelivery ────────────────────────────────────────────────────
     * Estymuje przedział dat dostawy na podstawie tablicy zdarzeń.
     *
     * Reguły (wymagania 5.2–5.7, 5.10–5.12):
     *  • Brak dopasowania → label="brak danych", dateRange=null, key=null, low
     *  • delivered → label, dateRange=null, isDelivered=true, delta=0, high
     *  • Inne → lower=max(0, minDays+delta) od daty zdarzenia (lub now),
     *           podnieś do now jeśli w przeszłości;
     *           upper=max(lower+1, maxDays+delta),
     *           ustaw na now+2 jeśli upper w przeszłości.
     *  • Pewność wg tabeli; jeśli delta>4 i high → medium.
     *  • Brak / krótki / nieznany kod kraju → delta=0.
     *
     * @param {object[]} events        Zdarzenie_Śledzenia[] posortowane od najnowszego
     * @param {string}   lang          'pl' | 'en'
     * @param {string}   destinationCountry  2-literowy kod ISO (domyślnie 'PL')
     * @param {function} nowFn         () => number (ms timestamp), wstrzykiwane dla testowalności
     * @returns {object} Wynik_Estymatora
     */
    function estimateDelivery(events, lang, destinationCountry, nowFn) {
        /* ── normalizacja języka ── */
        var effectiveLang = (lang === 'en') ? 'en' : 'pl';

        /* ── normalizacja kodu kraju i wyznaczenie delty ── */
        var rawCode = (typeof destinationCountry === 'string') ? destinationCountry.trim().toUpperCase() : '';
        var normalizedCode = (rawCode.length >= 2) ? rawCode : 'PL';
        var delta = (FXTRK_COUNTRY_DELTA.hasOwnProperty(normalizedCode))
            ? FXTRK_COUNTRY_DELTA[normalizedCode]
            : 0;

        /* ── "teraz" pochodzi wyłącznie z wstrzykniętego nowFn ── */
        var nowMs = (typeof nowFn === 'function') ? nowFn() : Date.now();
        var now   = new Date(nowMs);

        /* ── wykrycie Kamienia_Milowego ── */
        var detected = detectMilestone(events);

        /* ── brak dopasowania ── */
        if (!detected) {
            var noDataLabel = (effectiveLang === 'en') ? 'NO DATA' : 'BRAK DANYCH';
            return {
                label:              noDataLabel,
                dateRange:          null,
                milestoneKey:       null,
                confidence:         'low',
                isDelivered:        false,
                countryDelta:       delta,
                destinationCountry: normalizedCode
            };
        }

        /* ── odnaleziony Kamień_Milowy ── */
        var matchedKey  = detected.milestone;
        var msDef       = null;
        /* Znajdź obiekt definicji milestone */
        for (var mi = 0; mi < FXTRK_MILESTONES.length; mi++) {
            if (FXTRK_MILESTONES[mi].key === matchedKey) {
                msDef = FXTRK_MILESTONES[mi];
                break;
            }
        }

        /* Na wypadek niespójności danych (defensywnie) */
        if (!msDef) {
            return {
                label:              (effectiveLang === 'en') ? 'NO DATA' : 'BRAK DANYCH',
                dateRange:          null,
                milestoneKey:       null,
                confidence:         'low',
                isDelivered:        false,
                countryDelta:       delta,
                destinationCountry: normalizedCode
            };
        }

        var milestoneLabel = (effectiveLang === 'en') ? msDef.labelEn : msDef.labelPl;

        /* ── przypadek: dostarczono ── */
        if (matchedKey === 'delivered') {
            return {
                label:              milestoneLabel,
                dateRange:          null,
                milestoneKey:       matchedKey,
                confidence:         'high',
                isDelivered:        true,
                countryDelta:       0,
                destinationCountry: normalizedCode
            };
        }

        /* ── data bazowa: data dopasowanego zdarzenia lub now ── */
        var baseDate = detected.milestoneDate instanceof Date && !isNaN(detected.milestoneDate.getTime())
            ? detected.milestoneDate
            : now;

        /* ── obliczenie granic przedziału ── */
        var minDays = Math.max(0, msDef.minDays + delta);
        var maxDays = Math.max(minDays + 1, msDef.maxDays + delta);

        /* lower bound */
        var earliest = new Date(baseDate.getTime() + minDays * 86400000);
        if (earliest < now) earliest = now;

        /* upper bound */
        var latest   = new Date(baseDate.getTime() + maxDays * 86400000);
        if (latest < now) latest = new Date(nowMs + 2 * 86400000);

        /* ── pewność ── */
        var highKeys   = ['out_for_delivery', 'at_delivery_depot', 'arrived_destination', 'in_germany'];
        var mediumKeys = ['customs_cleared', 'flight_arrived', 'handed_to_courier'];
        var rawConf;
        if (highKeys.indexOf(matchedKey) !== -1) {
            rawConf = 'high';
        } else if (mediumKeys.indexOf(matchedKey) !== -1) {
            rawConf = 'medium';
        } else {
            rawConf = 'low';
        }
        var finalConf = (delta > 4 && rawConf === 'high') ? 'medium' : rawConf;

        return {
            label:              milestoneLabel,
            dateRange:          formatDateRange(earliest, latest, effectiveLang),
            milestoneKey:       matchedKey,
            confidence:         finalConf,
            isDelivered:        false,
            countryDelta:       delta,
            destinationCountry: normalizedCode
        };
    }

    /* ── Eksport — jedyny kontakt sekcji z globalnym środowiskiem ─────────── */
    window.FXTRK_CORE = {
        STATUS_PL: FXTRK_STATUS_PL,
        CHINESE_TO_EN: FXTRK_CHINESE_TO_EN,
        COUNTRY_MAP: FXTRK_COUNTRY_MAP,
        CITY_RULES: FXTRK_CITY_RULES,
        GENERIC_COUNTRY_LABELS: FXTRK_GENERIC_COUNTRY_LABELS,
        MILESTONES: FXTRK_MILESTONES,
        COUNTRY_DELTA: FXTRK_COUNTRY_DELTA,
        TRK_KEYS: FXTRK_TRK_KEYS,
        CJK_REGEX: FXTRK_CJK_REGEX,
        LOCATION_PL_TO_EN: FXTRK_LOCATION_PL_TO_EN,
        cleanSpaces: fxtrkCleanSpaces,
        stripChineseOnly: fxtrkStripChineseOnly,
        stripChineseToEn: fxtrkStripChineseToEn,
        normalize: fxtrkNormalize,
        validateCode: validateCode,
        translateStatusForLang: translateStatusForLang,
        translateLocationForLang: translateLocationForLang,
        getCountryInfo: getCountryInfo,
        groupByCountry: groupByCountry,
        resolveDisplayLocation: resolveDisplayLocation,
        detectMilestone: detectMilestone,
        estimateDelivery: estimateDelivery,
        getCountryDeltaNote: getCountryDeltaNote,
        formatDateRange: formatDateRange,
        confidenceLabel: confidenceLabel
    };
})();
/* ==== FXTRK:CORE END ==== */

/**
 * trkT(key) — Tłumaczenie klucza symbolicznego modułu śledzenia.
 *
 * Zasady (wymagania 10.1, 10.6, 10.7, 10.8, 10.9, 10.10):
 *  - Nieznany klucz symboliczny → zwraca samą nazwę klucza (10.10)
 *  - Brak odwzorowania w wybranym języku → polski tekst źródłowy (10.6)
 *  - Każdy język inny niż 'en' jest traktowany jak 'pl' (10.8)
 *  - Jedynym źródłem języka jest currentLang strony (10.7)
 */
function trkT(key) {
    var pl = (window.FXTRK_CORE && window.FXTRK_CORE.TRK_KEYS)
        ? window.FXTRK_CORE.TRK_KEYS[key]
        : null;
    if (!pl) return key;
    var lang = (currentLang === 'en') ? 'en' : 'pl';
    var dict = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : null;
    return (dict && dict[pl]) ? dict[pl] : pl;
}

/* ==== FXTRK:UI START ==== */
/*
 * Sekcja UI modułu śledzenia — stan, renderowanie, zdarzenia i żądanie sieciowe.
 *
 * Zasady obowiązujące w całej sekcji:
 *  • Struktura wyłącznie przez document.createElement, wartości wyłącznie przez
 *    textContent. Zero innerHTML z danymi, zero eval / new Function /
 *    setTimeout z łańcuchem znaków (wymaganie 6.5).
 *  • Zero elementów otwierających mapę 3D i zero etykiet wersji testowej
 *    w każdym stanie widoku (wymagania 12.1, 12.3).
 *  • Sekcja jest uśpiona do chwili, gdy Widok_Śledzenia otrzyma atrybut
 *    data-fxtrk-nolocale — dopiero wtedy wireTracking() podłącza nasłuchy.
 */
(function () {
    'use strict';

    /* ── Adres Funkcji_Śledzenia ──────────────────────────────────────────────
     * UWAGA WDROŻENIOWA: poniższą wartość NALEŻY ZAMIENIĆ na adres wdrożonej
     * funkcji serverless (zadanie 7.3), np. 'https://tracking-api.vercel.app'
     * albo domenę własną 'https://api.fxlsereps.pl'. To jedyne miejsce plików
     * statycznych powiązane z backendem. Adres Serwera_Upstream nie występuje
     * w plikach statycznych ani razu (wymagania 9.4, 9.12).
     */
    var FXTRK_API_BASE = 'http://localhost:3001';

    /* ── Stałe ────────────────────────────────────────────────────────────── */
    var FXTRK_NO_DATA        = 'Brak danych';
    var FXTRK_ABORT_MS       = 10000;   /* AbortController (wymaganie 1.10) */
    var FXTRK_SAFETY_MS      = 15000;   /* zabezpieczenie nadrzędne (6.7)   */
    var FXTRK_COPIED_MS      = 2000;    /* potwierdzenie kopiowania (11.7)  */
    var FXTRK_VISIBLE_LIMIT  = 15;      /* próg zwinięcia listy (4.9)       */
    var FXTRK_RETRY_FALLBACK = 60;      /* sekundy przy braku Retry-After   */
    /* Zamknięty zbiór akcji delegacji zdarzeń */
    var FXTRK_ACTIONS        = ['copy', 'toggle-all', 'use-last'];

    /* ── Dostawcy czasu i timerów (wstrzykiwalni w testach) ───────────────── */
    var fxtrkNow = function () { return Date.now(); };
    var fxtrkSetTimeout = function (fn, ms) { return window.setTimeout(fn, ms); };
    var fxtrkClearTimeout = function (id) { return window.clearTimeout(id); };

    /* ── Stan — jedno źródło prawdy ───────────────────────────────────────── */
    var fxtrkState = {
        code:         '',      /* zawartość pola wejściowego                  */
        status:       'idle',  /* 'idle'|'loading'|'success'|'empty'|'error'  */
        data:         null,    /* ostatnia udana Odpowiedź_Śledzenia          */
        searchedCode: null,    /* kod, dla którego uzyskano wynik/błąd        */
        errorKey:     null,    /* klucz Słownika_Tłumaczeń                    */
        errorParams:  null,    /* np. { seconds: 42 }                         */
        showAll:      false,   /* rozwinięcie listy poza 15 zdarzeń           */
        copiedField:  null,    /* 'reference' | 'tracking' | null             */
        copiedTimer:  null,    /* uchwyt timera 2000 ms                       */
        controller:   null,    /* AbortController żądania w toku              */
        safetyTimer:  null     /* uchwyt zabezpieczenia 15000 ms              */
    };

    /* Komunikat schowka — trzymany osobno, aby nie czyścić wyniku (11.8) */
    var fxtrkClipboardErrorKey = null;

    /* ── Pomocniki ────────────────────────────────────────────────────────── */

    function core() {
        return window.FXTRK_CORE || null;
    }

    /** Aktywny język: jedynym źródłem jest currentLang Strony_Statycznej (10.7, 10.8). */
    function fxtrkLang() {
        try {
            return (typeof currentLang !== 'undefined' && currentLang === 'en') ? 'en' : 'pl';
        } catch (e) {
            return 'pl';
        }
    }

    /** Tekst ze Słownika_Tłumaczeń; w piaskownicy testu spada do tekstu polskiego. */
    function fxtrkT(key) {
        if (typeof trkT === 'function') {
            try { return trkT(key); } catch (e) { /* spadek do mapy CORE */ }
        }
        var keys = (core() && core().TRK_KEYS) ? core().TRK_KEYS : null;
        return (keys && keys[key]) ? keys[key] : key;
    }

    function fxtrkEl(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (typeof text === 'string') node.textContent = text;
        return node;
    }

    function fxtrkIcon(className) {
        var node = document.createElement('i');
        node.className = className;
        return node;
    }

    function fxtrkClear(node) {
        if (!node) return;
        while (node.firstChild) node.removeChild(node.firstChild);
    }

    function fxtrkText(value) {
        var text = (value === null || value === undefined) ? '' : String(value);
        return (text.trim().length === 0) ? FXTRK_NO_DATA : text;
    }

    function fxtrkView() {
        return document.getElementById('tracking-view');
    }

    function fxtrkContainer() {
        return document.getElementById('YQContainer');
    }

    function fxtrkInput() {
        return document.getElementById('YQNum');
    }

    function fxtrkButton() {
        var view = fxtrkView();
        if (!view) return document.getElementById('YQBtn');
        return view.querySelector('#YQBtn')
            || view.querySelector('.tool-btn')
            || view.querySelector('button');
    }

    /** Blokada/odblokowanie elementów interaktywnych (wymagania 2.4, 2.13, 6.13). */
    function fxtrkSetBusy(busy) {
        var button = fxtrkButton();
        var input = fxtrkInput();
        if (button) button.disabled = !!busy;
        if (input) input.disabled = !!busy;
    }

    function fxtrkEvents() {
        var data = fxtrkState.data;
        var list = data ? data['Szczegóły_przesyłki'] : null;
        return Array.isArray(list) ? list : [];
    }

    /* ── renderTracking — funkcja totalna ─────────────────────────────────────
     * Dla każdego stanu buduje pełną zawartość #YQContainer od nowa. Dzięki temu
     * komunikat błędu automatycznie usuwa poprzedni wynik, a przełączenie języka
     * jest zwykłym wywołaniem tej funkcji (wymagania 6.8, 6.9, 10.5).
     */
    function renderTracking() {
        var container = fxtrkContainer();
        if (!container) return null;

        fxtrkClear(container);

        var root = fxtrkEl('div', 'fxtrk-root');
        var main = fxtrkEl('div', 'fxtrk-main');
        root.appendChild(main);
        container.appendChild(root);

        switch (fxtrkState.status) {
            case 'loading':
                main.appendChild(renderLoading());
                break;
            case 'error':
                main.appendChild(renderError());
                break;
            case 'empty':
                main.appendChild(renderEmpty());
                break;
            case 'success':
                renderResult(main);
                break;
            default:
                /* 'idle' — sam skrót ostatniego wyszukiwania */
                break;
        }

        if (fxtrkState.status !== 'loading') {
            var shortcut = renderLastSearched();
            if (shortcut) main.appendChild(shortcut);
        }

        return main;
    }

    /** Wskaźnik ładowania (wymaganie 2.4). */
    function renderLoading() {
        var box = fxtrkEl('div', 'fxtrk-loading');
        box.appendChild(fxtrkEl('span', 'fxtrk-spinner'));
        return box;
    }

    /* ── renderError — dokładnie jeden komunikat błędu ────────────────────────
     * Kod_Śledzenia wstawiany jako tekst, nigdy jako znaczniki (wymaganie 6.5).
     */
    function renderError() {
        var box = fxtrkEl('div', 'fxtrk-status-msg');
        box.setAttribute('data-fxtrk-role', 'error');

        var key = fxtrkState.errorKey || 'errorGeneral';
        var params = fxtrkState.errorParams || {};

        if (key === 'errorRateLimited') {
            var seconds = (typeof params.seconds === 'number') ? params.seconds : FXTRK_RETRY_FALLBACK;
            box.appendChild(fxtrkEl('span', 'fxtrk-status-msg__text', fxtrkT('errorRateLimited')));
            box.appendChild(fxtrkEl('span', 'fxtrk-status-msg__value', ' ' + seconds + ' ' + fxtrkT('secondsUnit')));
            return box;
        }

        box.appendChild(fxtrkEl('span', 'fxtrk-status-msg__text', fxtrkT(key)));
        if (key === 'errorNotFound' && typeof fxtrkState.searchedCode === 'string' && fxtrkState.searchedCode.length > 0) {
            box.appendChild(fxtrkEl('span', 'fxtrk-status-msg__value', ' ' + fxtrkState.searchedCode));
        }
        return box;
    }

    /* Pusta lista Szczegóły_przesyłki przy success:true — zero osi czasu i grup (6.12). */
    function renderEmpty() {
        var box = fxtrkEl('div', 'fxtrk-status-msg');
        box.setAttribute('data-fxtrk-role', 'empty');
        box.appendChild(fxtrkEl('span', 'fxtrk-status-msg__text', fxtrkT('errorNotFound')));
        if (typeof fxtrkState.searchedCode === 'string' && fxtrkState.searchedCode.length > 0) {
            box.appendChild(fxtrkEl('span', 'fxtrk-status-msg__value', ' ' + fxtrkState.searchedCode));
        }
        return box;
    }

    /** Ustawia stan błędu: czyści wynik i pokazuje dokładnie jeden komunikat. */
    function showError(key, params) {
        fxtrkState.status = 'error';
        fxtrkState.errorKey = key || 'errorGeneral';
        fxtrkState.errorParams = params || null;
        fxtrkState.data = null;
        fxtrkState.showAll = false;
        fxtrkState.copiedField = null;
        fxtrkClipboardErrorKey = null;
        fxtrkSetBusy(false);
        return renderTracking();
    }

    /* ── renderResult — karta estymaty + informacje główne + oś czasu ───────── */
    function renderResult(parent) {
        var c = core();
        var data = fxtrkState.data || {};
        var events = fxtrkEvents();
        var lang = fxtrkLang();
        var mainInfo = data['Informacje_główne'] || {};

        if (c) {
            var estimate = c.estimateDelivery(events, lang, mainInfo['Kraj'], fxtrkNow);
            parent.appendChild(renderEstimateCard(estimate));
        }

        parent.appendChild(renderMainInfo(mainInfo));

        var total = events.length;
        var visible = fxtrkState.showAll ? events : events.slice(0, FXTRK_VISIBLE_LIMIT);
        var groups = c ? c.groupByCountry(visible) : [];
        parent.appendChild(renderTimeline(groups));

        var toggle = renderShowMoreButton(total);
        if (toggle) parent.appendChild(toggle);

        if (fxtrkClipboardErrorKey) {
            var msg = fxtrkEl('div', 'fxtrk-status-msg');
            msg.setAttribute('data-fxtrk-role', 'clipboard');
            msg.appendChild(fxtrkEl('span', 'fxtrk-status-msg__text', fxtrkT(fxtrkClipboardErrorKey)));
            parent.appendChild(msg);
        }

        return parent;
    }

    /* ── renderEstimateCard ──────────────────────────────────────────────────
     * Etykieta Kamienia_Milowego, przedział dat tylko gdy niepusty, dokładnie
     * jeden wskaźnik pewności, adnotacja korekty kraju tylko gdy delta ≠ 0.
     * Zero elementów mapy 3D i zero etykiet wersji testowej (5.8, 5.9, 5.13, 12.3, 12.5).
     */
    function renderEstimateCard(estimate) {
        var est = estimate || {};
        var lang = fxtrkLang();
        var confidence = (est.confidence === 'high' || est.confidence === 'medium') ? est.confidence : 'low';

        var card = fxtrkEl('section', 'fxtrk-estimate fxtrk-estimate--' + confidence);

        card.appendChild(fxtrkEl('div', 'fxtrk-estimate__label', String(est.label || '')));

        if (typeof est.dateRange === 'string' && est.dateRange.length > 0) {
            card.appendChild(fxtrkEl('div', 'fxtrk-estimate__range', est.dateRange));
        }

        var confRow = fxtrkEl('div', 'fxtrk-estimate__confidence');
        confRow.appendChild(fxtrkEl('span', 'fxtrk-dot fxtrk-dot--' + confidence));
        var confKey = (confidence === 'high') ? 'confidenceHigh'
            : (confidence === 'medium') ? 'confidenceMedium' : 'confidenceLow';
        confRow.appendChild(fxtrkEl('span', 'fxtrk-estimate__confidence-text', fxtrkT(confKey)));
        card.appendChild(confRow);

        var delta = (typeof est.countryDelta === 'number') ? est.countryDelta : 0;
        if (delta !== 0 && core()) {
            var note = core().getCountryDeltaNote(est.destinationCountry, delta, lang);
            if (note) card.appendChild(fxtrkEl('div', 'fxtrk-estimate__delta', note));
        }

        return card;
    }

    /* ── renderMainInfo ──────────────────────────────────────────────────────
     * Sześć pól nagłówkowych zawsze rozwiniętych, zero przycisków przełączających
     * ich widoczność (wymaganie 11.3), dwa przyciski kopiowania (11.5).
     * Pole `Aktualna lokalizacja` wyznaczane po stronie klienta z najnowszego
     * Zdarzenia_Śledzenia.
     */
    function renderMainInfo(mainInfo) {
        var info = mainInfo || {};
        var section = fxtrkEl('section', 'fxtrk-info');
        section.appendChild(fxtrkEl('h3', 'fxtrk-info__title', fxtrkT('mainInfo')));

        var grid = fxtrkEl('div', 'fxtrk-info-grid');
        section.appendChild(grid);

        grid.appendChild(fxtrkInfoItem('reference', fxtrkT('reference'), info['Numer referencyjny'], true));
        grid.appendChild(fxtrkInfoItem('tracking', fxtrkT('trackingNumber'), info['Numer śledzenia'], true));
        grid.appendChild(fxtrkInfoItem('country', fxtrkT('country'), info['Kraj'], false));
        grid.appendChild(fxtrkInfoItem('date', fxtrkT('date'), info['Data'], false));
        grid.appendChild(fxtrkInfoItem('recipient', fxtrkT('recipient'), info['Odbiorca'], false));
        grid.appendChild(fxtrkInfoItem('status', fxtrkT('status'), info['Ostatni status'], false));

        var current = fxtrkCurrentLocation();
        if (current !== null) {
            grid.appendChild(fxtrkInfoItem('location', fxtrkT('location'), current, false));
        }

        return section;
    }

    /** Aktualna lokalizacja z najnowszego Zdarzenia_Śledzenia. */
    function fxtrkCurrentLocation() {
        var c = core();
        var events = fxtrkEvents();
        if (!c || events.length === 0) return null;

        var newest = events[0];
        var lang = fxtrkLang();
        var location = c.translateLocationForLang(newest, lang);
        var group = c.getCountryInfo(newest);
        return c.resolveDisplayLocation(location, group ? group.code : '');
    }

    function fxtrkInfoItem(field, label, value, copyable) {
        var item = fxtrkEl('div', 'fxtrk-info-item');
        item.setAttribute('data-fxtrk-field', field);

        item.appendChild(fxtrkEl('span', 'fxtrk-info-item__label', String(label)));
        item.appendChild(fxtrkEl('span', 'fxtrk-info-item__value', fxtrkText(value)));

        if (copyable) {
            var copied = (fxtrkState.copiedField === field);
            var button = fxtrkEl('button', 'fxtrk-copy-btn' + (copied ? ' fxtrk-copy-btn--copied' : ''));
            button.type = 'button';
            button.setAttribute('data-fxtrk-action', 'copy');
            button.setAttribute('data-fxtrk-field', field);
            if (copied) {
                button.appendChild(fxtrkIcon('fa-solid fa-check'));
                button.appendChild(fxtrkEl('span', 'fxtrk-copy-btn__text', fxtrkT('copied')));
            } else {
                button.appendChild(fxtrkIcon('fa-regular fa-copy'));
            }
            item.appendChild(button);
        }

        return item;
    }

    /* ── renderTimeline ──────────────────────────────────────────────────────
     * Nagłówek grupy z dwuliterowym kodem i nazwą kraju wielkimi literami
     * dokładnie raz na grupę; na każde zdarzenie trzy niepuste pola
     * (wymagania 4.6, 4.7, 4.8).
     */
    function renderTimeline(groups) {
        var c = core();
        var lang = fxtrkLang();
        var list = Array.isArray(groups) ? groups : [];

        var section = fxtrkEl('section', 'fxtrk-timeline');
        section.appendChild(fxtrkEl('h3', 'fxtrk-timeline__title', fxtrkT('history')));

        for (var gi = 0; gi < list.length; gi++) {
            var group = list[gi] || {};
            var groupEl = fxtrkEl('div', 'fxtrk-timeline__group');
            groupEl.setAttribute('data-fxtrk-country', String(group.code || ''));

            var groupCode = String(group.code || '').trim();
            var groupName = String(group.name || '').trim().toUpperCase();

            /* Nagłówek tylko gdy grupa ma rozpoznany kraj — puste pigułki
             * zaśmiecały widok (kod i nazwa zlewały się w "PLPOLSKA"). */
            if (groupCode || groupName) {
                var header = fxtrkEl('div', 'fxtrk-timeline__group-header');
                if (groupCode) {
                    header.appendChild(fxtrkEl('span', 'fxtrk-timeline__group-code', groupCode));
                }
                if (groupName) {
                    header.appendChild(fxtrkEl('span', 'fxtrk-timeline__group-name', groupName));
                }
                groupEl.appendChild(header);
            }

            var items = Array.isArray(group.items) ? group.items : [];
            for (var ii = 0; ii < items.length; ii++) {
                var event = items[ii] || {};

                var status = c ? c.translateStatusForLang(event, lang) : (event.Status || '');
                var location = c ? c.translateLocationForLang(event, lang) : (event.Lokalizacja || '');
                if (c) location = c.resolveDisplayLocation(location, group.code);
                var date = event.Data || event.OriginalDate || '';

                var itemEl = fxtrkEl('div', 'fxtrk-timeline__item');
                if (gi === 0 && ii === 0) {
                    itemEl.className += ' fxtrk-timeline__item--latest';
                }

                itemEl.appendChild(fxtrkEl('span', 'fxtrk-timeline__dot'));

                var body = fxtrkEl('div', 'fxtrk-timeline__body');
                body.appendChild(fxtrkEl('div', 'fxtrk-timeline__date', fxtrkText(date)));
                body.appendChild(fxtrkEl('div', 'fxtrk-timeline__status', fxtrkText(status)));

                var locationEl = fxtrkEl('div', 'fxtrk-timeline__location');
                locationEl.appendChild(fxtrkIcon('fa-solid fa-location-dot'));
                locationEl.appendChild(fxtrkEl('span', 'fxtrk-timeline__location-text', fxtrkText(location)));
                body.appendChild(locationEl);

                itemEl.appendChild(body);
                groupEl.appendChild(itemEl);
            }

            section.appendChild(groupEl);
        }

        return section;
    }

    /* ── renderShowMoreButton ────────────────────────────────────────────────
     * Przy ≥ 16 zdarzeniach dokładnie jeden przycisk; przy 1–15 zero przycisków
     * (wymagania 4.9, 4.10).
     */
    function renderShowMoreButton(total) {
        var count = (typeof total === 'number') ? total : 0;
        if (count <= FXTRK_VISIBLE_LIMIT) return null;

        var button = fxtrkEl('button', 'fxtrk-show-more');
        button.type = 'button';
        button.setAttribute('data-fxtrk-action', 'toggle-all');
        button.appendChild(fxtrkEl(
            'span',
            'fxtrk-show-more__text',
            fxtrkState.showAll ? fxtrkT('showLess') : fxtrkT('showMore')
        ));
        return button;
    }

    /* ── renderLastSearched ──────────────────────────────────────────────────
     * Skrót wyświetlany wyłącznie gdy wartość last_tracking_code przejdzie tę
     * samą walidację co kod wpisany przez użytkownika. localStorage jest
     * wejściem niezaufanym (wymaganie 2.12).
     */
    function renderLastSearched() {
        var c = core();
        if (!c) return null;

        var raw = null;
        try {
            raw = window.localStorage ? window.localStorage.getItem('last_tracking_code') : null;
        } catch (e) {
            return null;
        }
        if (typeof raw !== 'string') return null;

        var verdict = c.validateCode(raw);
        if (!verdict || !verdict.ok) return null;

        var code = raw.trim();
        var button = fxtrkEl('button', 'fxtrk-last-searched');
        button.type = 'button';
        button.setAttribute('data-fxtrk-action', 'use-last');
        button.setAttribute('data-fxtrk-code', code);
        button.appendChild(fxtrkIcon('fa-solid fa-rotate-left'));
        button.appendChild(fxtrkEl('strong', 'fxtrk-last-searched__code', code));
        return button;
    }

    /* ── Kopiowanie do schowka (wymagania 11.5–11.8) ──────────────────────── */

    function handleCopy(button) {
        if (!button) return;
        var field = button.getAttribute('data-fxtrk-field') || '';

        /* Dokładnie wyświetlana wartość, bez etykiety pola, po trim() */
        var host = button.parentNode;
        var valueEl = host && host.querySelector ? host.querySelector('.fxtrk-info-item__value') : null;
        var value = valueEl ? String(valueEl.textContent).trim() : '';

        var clipboard = (window.navigator && window.navigator.clipboard) ? window.navigator.clipboard : null;
        if (!clipboard || typeof clipboard.writeText !== 'function') {
            fxtrkClipboardFailed();
            return;
        }

        var promise;
        try {
            promise = clipboard.writeText(value);
        } catch (e) {
            fxtrkClipboardFailed();
            return;
        }
        if (!promise || typeof promise.then !== 'function') {
            fxtrkClipboardFailed();
            return;
        }

        promise.then(function () {
            fxtrkClipboardErrorKey = null;
            if (fxtrkState.copiedTimer !== null) {
                fxtrkClearTimeout(fxtrkState.copiedTimer);
                fxtrkState.copiedTimer = null;
            }
            fxtrkState.copiedField = field;
            renderTracking();
            fxtrkState.copiedTimer = fxtrkSetTimeout(function () {
                fxtrkState.copiedField = null;
                fxtrkState.copiedTimer = null;
                renderTracking();
            }, FXTRK_COPIED_MS);
        }, function () {
            fxtrkClipboardFailed();
        });
    }

    /** Wartość pola pozostaje niezmieniona, brak potwierdzenia, komunikat ze słownika. */
    function fxtrkClipboardFailed() {
        fxtrkState.copiedField = null;
        if (fxtrkState.copiedTimer !== null) {
            fxtrkClearTimeout(fxtrkState.copiedTimer);
            fxtrkState.copiedTimer = null;
        }
        fxtrkClipboardErrorKey = 'errorClipboard';
        renderTracking();
    }

    /* ── Żądanie do Funkcji_Śledzenia ─────────────────────────────────────── */

    function fxtrkRetryAfterSeconds(response) {
        var raw = null;
        try {
            raw = (response && response.headers && typeof response.headers.get === 'function')
                ? response.headers.get('Retry-After')
                : null;
        } catch (e) {
            raw = null;
        }
        if (typeof raw !== 'string' || !/^\s*\d+\s*$/.test(raw)) return FXTRK_RETRY_FALLBACK;
        var seconds = parseInt(raw, 10);
        return (isFinite(seconds) && seconds > 0) ? seconds : FXTRK_RETRY_FALLBACK;
    }

    /**
     * submitTracking — jedna ścieżka dla przycisku, klawisza Enter i skrótu.
     * Maksymalnie jedno żądanie równolegle (2.4); walidacja przed wysłaniem
     * (2.3, 2.14); każde zakończenie przywraca stan interaktywny (2.13, 6.13).
     */
    function submitTracking() {
        if (fxtrkState.status === 'loading') return null;

        var c = core();
        var input = fxtrkInput();
        var raw = input ? String(input.value) : String(fxtrkState.code || '');
        fxtrkState.code = raw;

        var verdict = c ? c.validateCode(raw) : { ok: false, normalized: '' };
        if (!verdict.ok) {
            /* Zero żądań, kod zachowany, fokus na polu, komunikat walidacyjny */
            showError('errorInvalidCode', null);
            if (input) {
                input.value = raw;
                try { input.focus(); } catch (e) { /* fokus nie jest krytyczny */ }
            }
            return null;
        }

        fxtrkState.status = 'loading';
        fxtrkState.data = null;
        fxtrkState.errorKey = null;
        fxtrkState.errorParams = null;
        fxtrkState.showAll = false;
        fxtrkState.copiedField = null;
        fxtrkState.searchedCode = verdict.normalized;
        fxtrkClipboardErrorKey = null;
        fxtrkSetBusy(true);
        renderTracking();

        var settled = false;
        var controller = (typeof AbortController === 'function') ? new AbortController() : null;
        fxtrkState.controller = controller;

        /* Poziom 2: przerwanie żądania po 10000 ms (wymaganie 1.10) */
        var abortTimer = fxtrkSetTimeout(function () {
            if (controller) {
                try { controller.abort(); } catch (e) { /* przerwanie best-effort */ }
            }
            if (!settled) terminate('errorGeneral', null);
        }, FXTRK_ABORT_MS);

        /* Poziom 3: zabezpieczenie nadrzędne po 15000 ms (wymaganie 6.7) */
        var safetyTimer = fxtrkSetTimeout(function () {
            if (!settled) terminate('errorGeneral', null);
        }, FXTRK_SAFETY_MS);
        fxtrkState.safetyTimer = safetyTimer;

        function clearTimers() {
            fxtrkClearTimeout(abortTimer);
            fxtrkClearTimeout(safetyTimer);
            fxtrkState.safetyTimer = null;
            fxtrkState.controller = null;
        }

        /** Zakończenie błędem — jedno miejsce przywracania stanu interaktywnego. */
        function terminate(key, params) {
            if (settled) return;
            settled = true;
            clearTimers();
            fxtrkSetBusy(false);
            showError(key, params);
        }

        /** Zakończenie powodzeniem. */
        function succeed(body) {
            if (settled) return;
            settled = true;
            clearTimers();
            fxtrkSetBusy(false);

            var events = body ? body['Szczegóły_przesyłki'] : null;
            fxtrkState.data = body;
            fxtrkState.errorKey = null;
            fxtrkState.errorParams = null;
            fxtrkState.status = (Array.isArray(events) && events.length > 0) ? 'success' : 'empty';

            /* Zapis ostatniego kodu; błąd zapisu pomija skrót, wynik zostaje (2.11, 2.15) */
            try {
                if (window.localStorage) {
                    window.localStorage.setItem('last_tracking_code', verdict.normalized.slice(0, 40));
                }
            } catch (e) { /* skrót pominięty */ }

            renderTracking();
        }

        function onResponse(response) {
            if (settled) return null;
            if (!response) { terminate('errorGeneral', null); return null; }

            var status = response.status;

            if (status === 429) {
                terminate('errorRateLimited', { seconds: fxtrkRetryAfterSeconds(response) });
                return null;
            }
            if (status === 404) { terminate('errorNotFound', null); return null; }
            if (status === 400) { terminate('errorInvalidCode', null); return null; }
            if (!(status >= 200 && status <= 299)) { terminate('errorServer', null); return null; }

            /* Treść nieparsowalna jako JSON → błąd serwera (wymaganie 6.11) */
            return response.json().then(function (body) {
                if (settled) return;
                if (!body || body.success !== true) {
                    terminate('errorNotFound', null);
                    return;
                }
                succeed(body);
            }, function () {
                terminate('errorServer', null);
            });
        }

        var url = FXTRK_API_BASE + '/api/tracking/' + encodeURIComponent(verdict.normalized);
        var init = controller ? { signal: controller.signal } : {};

        var request;
        try {
            request = window.fetch(url, init);
        } catch (err) {
            request = Promise.reject(err);
        }
        if (!request || typeof request.then !== 'function') {
            request = Promise.reject(new Error('fetch niedostępny'));
        }

        var chain = request.then(onResponse, function () {
            /* Odrzucenie fetch, w tym przerwanie po 10000 ms → błąd połączenia */
            terminate('errorGeneral', null);
        });

        /* Oba timery czyszczone w jednym bloku finally */
        if (typeof chain['finally'] === 'function') {
            chain['finally'](clearTimers);
        } else {
            chain.then(clearTimers, clearTimers);
        }

        return chain;
    }

    /* ── Delegacja zdarzeń kontenera ──────────────────────────────────────────
     * Jeden nasłuch `click` na #YQContainer, akcje ze zbioru zamkniętego
     * rozpoznawane po atrybucie data-fxtrk-action. Pełne przerysowanie
     * kontenera nie gubi nasłuchu.
     */
    function onContainerClick(event) {
        var target = event && event.target ? event.target : null;
        var actionEl = null;

        if (target && typeof target.closest === 'function') {
            actionEl = target.closest('[data-fxtrk-action]');
        } else {
            while (target) {
                if (target.getAttribute && target.getAttribute('data-fxtrk-action')) { actionEl = target; break; }
                target = target.parentNode;
            }
        }
        if (!actionEl) return;

        var action = actionEl.getAttribute('data-fxtrk-action');
        if (FXTRK_ACTIONS.indexOf(action) === -1) return;

        if (event.preventDefault) event.preventDefault();

        if (action === 'copy') {
            handleCopy(actionEl);
            return;
        }
        if (action === 'toggle-all') {
            fxtrkState.showAll = !fxtrkState.showAll;
            renderTracking();
            return;
        }
        if (action === 'use-last') {
            var code = actionEl.getAttribute('data-fxtrk-code') || '';
            var input = fxtrkInput();
            if (input) input.value = code;
            fxtrkState.code = code;
            submitTracking();
        }
    }

    /* ── wireTracking ─────────────────────────────────────────────────────────
     * Uruchamia się wyłącznie wtedy, gdy Widok_Śledzenia nosi atrybut
     * data-fxtrk-nolocale (na sobie albo na elemencie wewnątrz). Do czasu
     * aktualizacji index.html sekcja pozostaje uśpiona.
     */
    var fxtrkWired = false;

    function wireTracking() {
        if (fxtrkWired) return true;

        var view = fxtrkView();
        if (!view) return false;

        var armed = (view.hasAttribute && view.hasAttribute('data-fxtrk-nolocale'))
            || !!view.querySelector('[data-fxtrk-nolocale]');
        if (!armed) return false;

        var input = fxtrkInput();
        var button = fxtrkButton();
        var container = fxtrkContainer();

        if (button) {
            button.addEventListener('click', function (event) {
                if (event && event.preventDefault) event.preventDefault();
                submitTracking();
            });
        }

        if (input) {
            input.addEventListener('keydown', function (event) {
                if (!event) return;
                if (event.key === 'Enter' || event.keyCode === 13) {
                    if (event.preventDefault) event.preventDefault();
                    submitTracking();
                }
            });
            /* Zero ponownych wczytań strony przy zatwierdzeniu formularza (2.2) */
            if (input.form) {
                input.form.addEventListener('submit', function (event) {
                    if (event && event.preventDefault) event.preventDefault();
                    submitTracking();
                });
            }
        }

        if (container) container.addEventListener('click', onContainerClick);

        /* Zmiana języka: przerysowanie z pamięci, zero wywołań fetch (10.4, 10.5) */
        document.addEventListener('fxtrk:langchange', function () {
            renderTracking();
        });

        fxtrkWired = true;
        renderTracking();
        return true;
    }

    /* Próba natychmiastowa (skrypt na końcu dokumentu) z zapasowym nasłuchem
     * DOMContentLoaded. wireTracking() jest idempotentne. */
    if (!wireTracking()) {
        document.addEventListener('DOMContentLoaded', function () { wireTracking(); });
    }

    /* ── Eksport — punkt dostępu dla testów i reszty strony ───────────────── */
    window.FXTRK_UI = {
        API_BASE:            FXTRK_API_BASE,
        ACTIONS:             FXTRK_ACTIONS,
        state:               fxtrkState,
        renderTracking:      renderTracking,
        renderLoading:       renderLoading,
        renderError:         renderError,
        renderEmpty:         renderEmpty,
        renderResult:        renderResult,
        renderEstimateCard:  renderEstimateCard,
        renderMainInfo:      renderMainInfo,
        renderTimeline:      renderTimeline,
        renderShowMoreButton: renderShowMoreButton,
        renderLastSearched:  renderLastSearched,
        showError:           showError,
        submitTracking:      submitTracking,
        handleCopy:          handleCopy,
        wireTracking:        wireTracking,
        isWired:             function () { return fxtrkWired; },
        trkT:                fxtrkT,
        lang:                fxtrkLang,
        /* Wstrzykiwanie dostawców czasu — testy nie czekają na prawdziwy zegar */
        setNow:              function (fn) { if (typeof fn === 'function') fxtrkNow = fn; },
        setTimers:           function (setFn, clearFn) {
            if (typeof setFn === 'function') fxtrkSetTimeout = setFn;
            if (typeof clearFn === 'function') fxtrkClearTimeout = clearFn;
        }
    };
})();
/* ==== FXTRK:UI END ==== */


// =========================================
// PRODUCT DETAIL VIEW SYSTEM
// =========================================

/**
 * Product Detail View State
 * Tracks the current product being viewed and navigation state
 */
const ProductDetailView = {
    currentProduct: null,           // Currently displayed product object
    previousView: 'products-view',  // Previous view ID (for back navigation)
    previousScrollPosition: 0,      // Scroll position before entering detail view
    relatedProducts: []             // Array of related products from same category
};

/**
 * Show product detail view
 * Main entry point function that displays detailed information for a specific product
 * @param {string|number} productId - Product ID to display
 */
async function showProductDetail(productId) {
    // Store previous view state (view ID and scroll position)
    const activeView = document.querySelector('.main-view.active');
    ProductDetailView.previousView = activeView?.id || 'products-view';
    ProductDetailView.previousScrollPosition = window.scrollY;

    // Get product data from getProducts() or SAMPLE_PRODUCTS
    const allProducts = (await getProducts()).length > 0 ? await getProducts() : SAMPLE_PRODUCTS;
    const product = allProducts.find(p => p.id == productId);

    // Handle product not found by calling showProductDetailError()
    if (!product) {
        showProductDetailError();
        return;
    }

    // Store current product in ProductDetailView.currentProduct
    ProductDetailView.currentProduct = product;

    // Switch to detail view using showView('product-detail-view')
    showView('product-detail-view');

    // Call renderProductDetail(product) to populate the view
    renderProductDetail(product);

    // Call loadRelatedProducts(product)
    loadRelatedProducts(product);

    // Update URL with updateProductUrl(productId)
    updateProductUrl(productId);

    // Increment view count with incrementClicks(productId)
    incrementClicks(productId);

    // Initialize event listeners with initProductDetailListeners()
    initProductDetailListeners();
}

/**
 * Render product detail information
 * Populates the product detail view with product data
 * @param {Object} product - Product object containing all product information
 */
function renderProductDetail(product) {
    // Get state elements
    const loading = document.getElementById('pdv-loading');
    const error = document.getElementById('pdv-error');
    const content = document.getElementById('pdv-content');

    // Hide loading/error states, show content
    if (loading) {
        loading.classList.add('hidden');
    }
    if (error) {
        error.classList.add('hidden');
    }
    if (content) {
        content.classList.remove('hidden');
    }

    // Set product image (with placeholder if missing)
    const image = document.getElementById('pdv-image');
    if (image) {
        image.src = product.image || 'https://via.placeholder.com/800x800/0f0f0f/555?text=No+Image';
        image.alt = product.name || 'Product Image';
    }

    // Set product title
    const title = document.getElementById('pdv-title');
    if (title) {
        title.textContent = product.name || '';
    }

    // Set product ID/SKU
    const idValue = document.getElementById('pdv-id-value');
    if (idValue) {
        idValue.textContent = product.id || '';
    }

    // Set style (if available) or hide section
    const styleSection = document.getElementById('pdv-product-style');
    const styleValue = document.getElementById('pdv-style-value');
    if (product.style && styleValue) {
        styleValue.textContent = product.style;
        if (styleSection) {
            styleSection.classList.remove('hidden');
        }
    } else {
        if (styleSection) {
            styleSection.classList.add('hidden');
        }
    }

    // Set price and currency
    const price = document.getElementById('pdv-price');
    const currency = document.getElementById('pdv-currency');
    if (price) {
        price.textContent = parseFloat(product.price || 0).toFixed(2);
    }
    if (currency) {
        currency.textContent = product.currency || 'PLN';
    }

    // Set View button href
    const viewBtn = document.getElementById('pdv-view-btn');
    if (viewBtn) {
        viewBtn.href = product.link || '#';
    }

    // Populate description (hide section if empty)
    const descSection = document.getElementById('pdv-description-section');
    const descText = document.getElementById('pdv-description-text');
    if (product.description && descText) {
        descText.textContent = product.description;
        if (descSection) {
            descSection.classList.remove('hidden');
        }
    } else {
        if (descSection) {
            descSection.classList.add('hidden');
        }
    }

    // Display view and like counts
    const views = document.getElementById('pdv-views');
    const likes = document.getElementById('pdv-likes');
    if (views) {
        views.textContent = product.clicks || 0;
    }
    if (likes) {
        likes.textContent = product.likes || 0;
    }
}

/**
 * Show error state when product not found
 * Displays error message and hides loading/content sections
 */
function showProductDetailError() {
    // Get state elements
    const loading = document.getElementById('pdv-loading');
    const error = document.getElementById('pdv-error');
    const content = document.getElementById('pdv-content');

    // Hide loading state if visible
    if (loading) {
        loading.classList.add('hidden');
    }

    // Hide content section
    if (content) {
        content.classList.add('hidden');
    }

    // Show error state
    if (error) {
        error.classList.remove('hidden');
    }

    // Switch to product-detail-view
    showView('product-detail-view');
}

/**
 * Load and display related products from the same category
 * Filters products by matching category, excludes current product, and populates the related products section
 * @param {Object} product - Current product object
 */
async function loadRelatedProducts(product) {
    // Get relatedSection, relatedScroll, and categoryName elements
    const relatedSection = document.getElementById('pdv-related-section');
    const relatedScroll = document.getElementById('pdv-related-scroll');
    const categoryName = document.getElementById('pdv-related-category-name');

    // Return early (hide section) if no product.category or missing elements
    if (!product.category || !relatedSection || !relatedScroll) {
        if (relatedSection) {
            relatedSection.classList.add('hidden');
        }
        return;
    }

    // Filter products by matching category, exclude current product
    const allProducts = (await getProducts()).length > 0 ? await getProducts() : SAMPLE_PRODUCTS;
    const related = allProducts.filter(p => 
        p.category === product.category && p.id !== product.id
    );

    // Hide section if no related products found
    if (related.length === 0) {
        relatedSection.classList.add('hidden');
        return;
    }

    // Store related products in ProductDetailView.relatedProducts
    ProductDetailView.relatedProducts = related;

    // Update category name display
    if (categoryName) {
        categoryName.textContent = product.category;
    }

    // Clear and populate relatedScroll with buildRelatedProductCard() for each product
    relatedScroll.innerHTML = '';
    related.forEach(p => {
        const card = buildRelatedProductCard(p);
        relatedScroll.appendChild(card);
    });

    // Show section
    relatedSection.classList.remove('hidden');

    // Setup "View all" link with navigateToCategory() handler
    const viewAllLink = document.getElementById('pdv-related-view-all');
    if (viewAllLink) {
        viewAllLink.onclick = (e) => {
            e.preventDefault();
            navigateToCategory(product.category);
        };
    }
}

/**
 * Build a related product card
 * Creates an HTML element for a product card in the related products section
 * @param {Object} product - Product object
 * @returns {HTMLElement} - Product card element
 */
function buildRelatedProductCard(product) {
    const card = document.createElement('div');
    card.className = 'pdv-related-card';
    
    const imgSrc = product.image || 'https://via.placeholder.com/300x300/0f0f0f/555?text=No+Image';
    const priceFormatted = parseFloat(product.price || 0).toFixed(2);
    const currency = product.currency || 'PLN';
    const views = product.clicks || 0;
    const likes = product.likes || 0;
    
    card.innerHTML = `
        <div class="pdv-related-card__img-wrap">
            <img src="${imgSrc}" alt="${product.name}" loading="lazy">
        </div>
        <div class="pdv-related-card__body">
            <div class="pdv-related-card__cat">${product.category || ''}</div>
            <div class="pdv-related-card__name">${product.name}</div>
            <div class="pdv-related-card__bottom">
                <div class="pdv-related-card__price">${priceFormatted} ${currency}</div>
                <div class="pdv-related-card__meta">
                    <span><i class="fa-regular fa-eye"></i> ${views}</span>
                    <span><i class="fa-regular fa-heart"></i> ${likes}</span>
                </div>
            </div>
        </div>
    `;
    
    // Add click handler to navigate to this product
    card.onclick = () => {
        showProductDetail(product.id);
    };
    
    return card;
}

/**
 * Navigate to products view filtered by category
 * Switches to products view and applies the specified category filter
 * @param {string} category - Category name
 */
function navigateToCategory(category) {
    // Switch to products-view
    showView('products-view');
    
    // Apply category filter using filterProductsGrid()
    filterProductsGrid(category);
    
    // Update category dropdown label if exists
    const catLabel = document.getElementById('pv-cat-label');
    if (catLabel) {
        catLabel.textContent = category;
    }
    
    // Update active state in dropdown
    document.querySelectorAll('.pv-drop-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-cat') === category) {
            item.classList.add('active');
        }
    });
}

/**
 * Update URL with product ID
 * Updates the browser URL to reflect the current product being viewed
 * Uses history.pushState for better browser history management with fallback to hash-based routing
 * @param {string|number} productId - Product ID
 */
function updateProductUrl(productId) {
    const newUrl = `#product/${productId}`;
    
    // Use history.pushState for better browser history management
    if (window.history && window.history.pushState) {
        window.history.pushState(
            { view: 'product-detail', productId: productId },
            '',
            newUrl
        );
    } else {
        // Fallback to hash-based routing for older browsers
        window.location.hash = newUrl;
    }
}

/**
 * Handle URL routing for product detail view
 * Parses window.location.hash and displays product detail if URL matches #product/{id} pattern
 */
function handleProductRouting() {
    // Read window.location.hash
    const hash = window.location.hash;
    
    // Check if hash matches pattern: #product/{id}
    const productMatch = hash.match(/^#product\/(.+)$/);
    
    // Extract product ID and call showProductDetail if match found
    if (productMatch) {
        const productId = productMatch[1];
        showProductDetail(productId);
    }
}

/**
 * Open image in lightbox/fullscreen mode
 * Displays the product image in a fullscreen lightbox overlay
 * @param {string} imageSrc - Image source URL
 */
function openImageLightbox(imageSrc) {
    const lightbox = document.getElementById('pdv-lightbox');
    const lightboxImage = document.getElementById('pdv-lightbox-image');
    
    if (lightbox && lightboxImage) {
        lightboxImage.src = imageSrc;
        lightbox.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close image lightbox
 * Hides the lightbox overlay and restores body scroll
 */
function closeImageLightbox() {
    const lightbox = document.getElementById('pdv-lightbox');
    
    if (lightbox) {
        lightbox.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

/**
 * Initialize product detail view routing on page load
 * Sets up routing, lightbox event listeners, and keyboard shortcuts
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check URL on initial load to handle direct navigation to product URLs
    handleProductRouting();
    
    // Initialize lightbox close button event listener
    const lightboxClose = document.getElementById('pdv-lightbox-close');
    if (lightboxClose) {
        lightboxClose.onclick = closeImageLightbox;
    }
    
    // Add lightbox overlay click handler (close on overlay click, not on image click)
    const lightbox = document.getElementById('pdv-lightbox');
    if (lightbox) {
        lightbox.onclick = (e) => {
            if (e.target === lightbox) {
                closeImageLightbox();
            }
        };
    }
    
    // Add Escape key handler to close lightbox
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeImageLightbox();
        }
    });
});

/**
 * Handle browser back/forward navigation
 * Listens to popstate events and navigates to the appropriate view based on history state
 */
window.addEventListener('popstate', (event) => {
    // Check if event.state exists and view is 'product-detail'
    if (event.state && event.state.view === 'product-detail') {
        // Call showProductDetail with event.state.productId
        showProductDetail(event.state.productId);
    } else {
        // Otherwise call handleProductRouting() to check hash
        handleProductRouting();
    }
});

/**
 * Navigate back from product detail view
 * Restores previous view state, scroll position, and updates browser history
 */
function navigateBackFromDetail() {
    // Get previous view from ProductDetailView.previousView (default 'products-view')
    const previousView = ProductDetailView.previousView || 'products-view';
    
    // Call showView() with previous view
    showView(previousView);
    
    // Restore scroll position using ProductDetailView.previousScrollPosition (with setTimeout for timing)
    setTimeout(() => {
        window.scrollTo(0, ProductDetailView.previousScrollPosition);
    }, 0);
    
    // Update URL by calling history.back() if URL starts with #product/
    if (window.location.hash.startsWith('#product/')) {
        history.back();
    }
}

/**
 * Save product to user's saved items
 * Adds product to localStorage savedProducts array, updates button state, and shows toast notification
 * @param {string|number} productId - Product ID to save
 */
function saveProduct(productId) {
    // Get saved products from localStorage('savedProducts')
    let savedProducts = localStorage.getItem('savedProducts');
    
    // Parse JSON or initialize empty array if null
    savedProducts = savedProducts ? JSON.parse(savedProducts) : [];
    
    // Check if product already saved (return early with "already saved" toast if so)
    if (savedProducts.includes(productId)) {
        showToast('Produkt jest już zapisany', 'info');
        return;
    }
    
    // Add productId to saved array
    savedProducts.push(productId);
    
    // Save back to localStorage
    localStorage.setItem('savedProducts', JSON.stringify(savedProducts));
    
    // Update save button state (change icon to fa-solid, text to "Zapisano", disable button)
    const saveBtn = document.getElementById('pdv-save-btn');
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> <span data-i18n="pdv.saved">Zapisano</span>';
        saveBtn.disabled = true;
    }
    
    // Show success toast
    showToast('Dodano do zapisanych!', 'success');
}

/**
 * Share product (copy URL to clipboard or use native share)
 * Creates product URL and attempts to share using native share API first (mobile),
 * then falls back to copying to clipboard. Shows success toast on completion.
 * @param {string|number} productId - Product ID to share
 */
function shareProduct(productId) {
    // Create product URL using window.location.origin + pathname + #product/{productId}
    const productUrl = `${window.location.origin}${window.location.pathname}#product/${productId}`;
    
    // Get product title and description for share data
    const product = ProductDetailView.currentProduct;
    const title = product ? product.name : 'Produkt';
    const description = product ? (product.description || `Sprawdź ten produkt: ${product.name}`) : 'Sprawdź ten produkt';
    
    // Try native share API first (navigator.share) if available
    if (navigator.share) {
        navigator.share({
            title: title,
            text: description,
            url: productUrl
        }).then(() => {
            // Show success toast if share succeeds
            showToast('Udostępniono!', 'success');
        }).catch((err) => {
            // Fallback to copyToClipboard if share fails or is cancelled
            if (err.name !== 'AbortError') {
                // Only fallback if not user cancellation
                copyToClipboard(productUrl);
            }
        });
    } else {
        // Fallback to copyToClipboard(productUrl) if share not available
        copyToClipboard(productUrl);
    }
}

/**
 * Copy text to clipboard
 * Copies the provided text to the user's clipboard using modern or fallback methods
 * Displays success or error toast notification based on result
 * @param {string} text - Text to copy to clipboard
 */
function copyToClipboard(text) {
    // Try modern Clipboard API if available
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            // Success - show success toast
            showToast('Link skopiowany do schowka!', 'success');
        }).catch((err) => {
            // Failed - show error toast
            console.error('Clipboard API failed:', err);
            showToast('Nie udało się skopiować linku', 'error');
        });
    } else {
        // Fallback for older browsers using execCommand
        // Create temporary textarea element
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        
        // Select the text
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        
        try {
            // Execute copy command
            const successful = document.execCommand('copy');
            if (successful) {
                showToast('Link skopiowany do schowka!', 'success');
            } else {
                showToast('Nie udało się skopiować linku', 'error');
            }
        } catch (err) {
            console.error('execCommand failed:', err);
            showToast('Nie udało się skopiować linku', 'error');
        } finally {
            // Remove textarea element
            document.body.removeChild(textarea);
        }
    }
}

/**
 * Toggle description expand/collapse
 * Toggles the visibility of the product description content section
 * Rotates the chevron icon to indicate expanded/collapsed state
 */
function toggleDescription() {
    // Get description content element (pdv-description-content)
    const content = document.getElementById('pdv-description-content');
    
    // Get description icon element (.pdv-description-icon)
    const icon = document.querySelector('.pdv-description-icon');
    
    // Toggle 'hidden' class on content
    if (content) {
        content.classList.toggle('hidden');
    }
    
    // Rotate icon based on state: 0deg when hidden, 180deg when visible
    if (icon) {
        const isHidden = content && content.classList.contains('hidden');
        icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
    }
}

/**
 * Report problem with product link
 * Handles problem reporting for the current product
 * Currently logs to console and shows confirmation toast (placeholder for future implementation)
 * @param {string|number} productId - Product ID to report
 */
function reportProblem(productId) {
    // Log problem report to console (placeholder for future implementation)
    console.log('Report problem for product:', productId);
    
    // Show confirmation toast notification
    showToast('Zgłoszenie zostało wysłane', 'success');
    
    // TODO: Future implementation could:
    // - Open a modal with a problem report form
    // - Redirect to a contact form page
    // - Send data to a backend API endpoint
}

/**
 * Initialize event listeners for product detail view
 * Sets up click handlers for all interactive elements in the product detail view
 * Should be called after rendering product details
 */
function initProductDetailListeners() {
    // Back button (pdv-back-btn) → navigateBackFromDetail()
    const backBtn = document.getElementById('pdv-back-btn');
    if (backBtn) {
        backBtn.onclick = navigateBackFromDetail;
    }

    // Save button (pdv-save-btn) → saveProduct(currentProduct.id)
    const saveBtn = document.getElementById('pdv-save-btn');
    if (saveBtn) {
        saveBtn.onclick = () => {
            if (ProductDetailView.currentProduct) {
                saveProduct(ProductDetailView.currentProduct.id);
            }
        };
    }

    // Share button (pdv-share-btn) → shareProduct(currentProduct.id)
    const shareBtn = document.getElementById('pdv-share-btn');
    if (shareBtn) {
        shareBtn.onclick = () => {
            if (ProductDetailView.currentProduct) {
                shareProduct(ProductDetailView.currentProduct.id);
            }
        };
    }

    // Expand image button (pdv-expand-btn) → openImageLightbox(currentProduct.image)
    const expandBtn = document.getElementById('pdv-expand-btn');
    if (expandBtn) {
        expandBtn.onclick = () => {
            if (ProductDetailView.currentProduct) {
                openImageLightbox(ProductDetailView.currentProduct.image);
            }
        };
    }

    // Fullscreen button (pdv-fullscreen-btn) → openImageLightbox(currentProduct.image)
    const fullscreenBtn = document.getElementById('pdv-fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.onclick = () => {
            if (ProductDetailView.currentProduct) {
                openImageLightbox(ProductDetailView.currentProduct.image);
            }
        };
    }

    // Description toggle (pdv-description-toggle) → toggleDescription()
    const descToggle = document.getElementById('pdv-description-toggle');
    if (descToggle) {
        descToggle.onclick = toggleDescription;
    }

    // Report link (pdv-report-link) → reportProblem(currentProduct.id)
    const reportLink = document.getElementById('pdv-report-link');
    if (reportLink) {
        reportLink.onclick = (e) => {
            e.preventDefault();
            if (ProductDetailView.currentProduct) {
                reportProblem(ProductDetailView.currentProduct.id);
            }
        };
    }
}
