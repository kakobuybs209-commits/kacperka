# Design Document: Product Detail View

## Overview

The Product Detail View system provides an immersive, full-page experience for viewing individual product details within the existing SWAGREPS e-commerce platform. This design integrates seamlessly with the current vanilla JavaScript architecture, leveraging existing view switching patterns, data structures, and monochromatic design language.

### Key Design Principles

1. **Consistency**: Reuse existing patterns for view switching, styling, and data management
2. **Performance**: Lightweight implementation with lazy loading and smooth transitions
3. **Maintainability**: Follow established code conventions in script.js and style.css
4. **Responsiveness**: Mobile-first design that adapts elegantly to all screen sizes
5. **User Experience**: Smooth navigation with browser history support and deep linking

## Architecture

### High-Level Component Structure

```
┌─────────────────────────────────────────────────────┐
│                   Browser URL                        │
│  #product/{id} or /product/{id} (hash routing)      │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              Navigation System                       │
│  - showView() orchestrator                          │
│  - URL/Hash routing manager                         │
│  - History state management                         │
└─────────────────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
┌─────────────────┐           ┌──────────────────────┐
│ Product Grid    │           │ Product Detail View  │
│ (products-view) │◄─────────│  (product-detail-view)│
└─────────────────┘           └──────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
         ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
         │ Main Product     │  │ Action       │  │ Related      │
         │ Display          │  │ Buttons      │  │ Products     │
         │ Component        │  │ Component    │  │ Component    │
         └──────────────────┘  └──────────────┘  └──────────────┘
```

### Data Flow Architecture

```
                    ┌─────────────────────┐
                    │   localStorage      │
                    │  "products" key     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   getProducts()     │
                    │   Returns: Array    │
                    └──────────┬──────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
    ┌──────────────────────┐       ┌──────────────────────┐
    │ Product Grid         │       │ Product Detail       │
    │ buildProductCard()   │       │ showProductDetail()  │
    └──────────────────────┘       └──────────┬───────────┘
                                               │
                                ┌──────────────┴──────────────┐
                                ▼                             ▼
                    ┌─────────────────────┐       ┌─────────────────────┐
                    │ Related Products    │       │ Action Handlers     │
                    │ filterByCategory()  │       │ - incrementClicks() │
                    └─────────────────────┘       │ - saveProduct()     │
                                                  │ - shareProduct()    │
                                                  └─────────────────────┘
```

## Components and Interfaces

### 1. HTML Structure (index.html)

#### Product Detail View Container

Add new main view section after existing views (home-view, products-view, sellers-view):

```html
<!-- Product Detail View -->
<div id="product-detail-view" class="main-view hidden">
    <!-- Back Navigation -->
    <div class="pdv-back-nav">
        <button class="pdv-back-btn" id="pdv-back-btn">
            <i class="fa-solid fa-arrow-left"></i>
            <span data-i18n="pdv.back">Powrót</span>
        </button>
    </div>

    <!-- Product Detail Container -->
    <div class="pdv-container">
        <!-- Loading State -->
        <div class="pdv-loading" id="pdv-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p data-i18n="pdv.loading">Ładowanie produktu...</p>
        </div>

        <!-- Error State -->
        <div class="pdv-error hidden" id="pdv-error">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <h3 data-i18n="pdv.error.title">Nie znaleziono produktu</h3>
            <p data-i18n="pdv.error.message">Produkt o podanym ID nie istnieje lub został usunięty.</p>
            <button class="btn btn-primary" onclick="showView('products-view')">
                <i class="fa-solid fa-arrow-left"></i>
                <span data-i18n="pdv.error.back">Wróć do produktów</span>
            </button>
        </div>

        <!-- Main Content -->
        <div class="pdv-content hidden" id="pdv-content">
            <!-- Product Image -->
            <div class="pdv-image-section">
                <div class="pdv-image-wrapper">
                    <img id="pdv-image" src="" alt="" class="pdv-image">
                    <button class="pdv-expand-btn" id="pdv-expand-btn" title="Powiększ obraz">
                        <i class="fa-solid fa-expand"></i>
                    </button>
                </div>
            </div>

            <!-- Product Information -->
            <div class="pdv-info-section">
                <!-- Title -->
                <h1 class="pdv-title" id="pdv-title"></h1>

                <!-- Meta Information -->
                <div class="pdv-meta">
                    <span class="pdv-badge pdv-badge-service">
                        <i class="fa-solid fa-headset"></i>
                        <span data-i18n="pdv.customerService">Customer Service</span>
                    </span>
                    <span class="pdv-meta-item" id="pdv-product-id">
                        <i class="fa-solid fa-barcode"></i>
                        <span data-i18n="pdv.sku">SKU:</span> <span id="pdv-id-value"></span>
                    </span>
                    <span class="pdv-meta-item" id="pdv-product-style">
                        <i class="fa-solid fa-tag"></i>
                        <span data-i18n="pdv.style">Style:</span> <span id="pdv-style-value"></span>
                    </span>
                </div>

                <!-- Price -->
                <div class="pdv-price-section">
                    <span class="pdv-price" id="pdv-price"></span>
                    <span class="pdv-currency" id="pdv-currency"></span>
                </div>

                <!-- Action Buttons -->
                <div class="pdv-actions">
                    <a class="pdv-action-btn pdv-action-primary" id="pdv-view-btn" href="#" target="_blank">
                        <i class="fa-solid fa-external-link-alt"></i>
                        <span data-i18n="pdv.view">View</span>
                    </a>
                    <button class="pdv-action-btn pdv-action-secondary" id="pdv-save-btn">
                        <i class="fa-regular fa-bookmark"></i>
                        <span data-i18n="pdv.save">Save</span>
                    </button>
                    <button class="pdv-action-btn pdv-action-icon" id="pdv-share-btn" title="Udostępnij">
                        <i class="fa-solid fa-share-nodes"></i>
                    </button>
                    <button class="pdv-action-btn pdv-action-icon" id="pdv-fullscreen-btn" title="Pełny ekran">
                        <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
                    </button>
                </div>

                <!-- Report Problem Link -->
                <a href="#" class="pdv-report-link" id="pdv-report-link">
                    <i class="fa-solid fa-flag"></i>
                    <span data-i18n="pdv.report">Raport problem link</span>
                </a>

                <!-- Description Section (Expandable) -->
                <div class="pdv-description-section" id="pdv-description-section">
                    <button class="pdv-description-header" id="pdv-description-toggle">
                        <span data-i18n="pdv.description">Opis produktu</span>
                        <i class="fa-solid fa-chevron-down pdv-description-icon"></i>
                    </button>
                    <div class="pdv-description-content hidden" id="pdv-description-content">
                        <p id="pdv-description-text"></p>
                    </div>
                </div>

                <!-- Stats -->
                <div class="pdv-stats">
                    <div class="pdv-stat">
                        <i class="fa-regular fa-eye"></i>
                        <span id="pdv-views">0</span>
                        <span data-i18n="pdv.views">wyświetleń</span>
                    </div>
                    <div class="pdv-stat">
                        <i class="fa-regular fa-heart"></i>
                        <span id="pdv-likes">0</span>
                        <span data-i18n="pdv.likes">polubień</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Related Products Section -->
        <div class="pdv-related-section hidden" id="pdv-related-section">
            <div class="pdv-related-header">
                <h2 class="pdv-related-title">
                    <span id="pdv-related-category-name"></span>
                </h2>
                <a href="#" class="pdv-related-view-all" id="pdv-related-view-all">
                    <span data-i18n="pdv.viewAll">View all</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </a>
            </div>
            <div class="pdv-related-scroll" id="pdv-related-scroll">
                <!-- Related product cards will be inserted here -->
            </div>
        </div>
    </div>
</div>

<!-- Image Lightbox Modal -->
<div class="pdv-lightbox-overlay hidden" id="pdv-lightbox">
    <button class="pdv-lightbox-close" id="pdv-lightbox-close">
        <i class="fa-solid fa-times"></i>
    </button>
    <img src="" alt="" class="pdv-lightbox-image" id="pdv-lightbox-image">
</div>
```

#### Modifications to Existing Product Cards

Update the `buildProductCard()` function in script.js to add click handlers that navigate to product detail view.

### 2. JavaScript Architecture (script.js)

#### Core Functions

```javascript
// =========================================
// PRODUCT DETAIL VIEW SYSTEM
// =========================================

/**
 * Product Detail View State
 */
const ProductDetailView = {
    currentProduct: null,
    previousView: 'products-view',
    previousScrollPosition: 0,
    relatedProducts: []
};

/**
 * Show product detail view
 * @param {string|number} productId - Product ID to display
 */
function showProductDetail(productId) {
    // Store previous view state
    ProductDetailView.previousView = document.querySelector('.main-view.active')?.id || 'products-view';
    ProductDetailView.previousScrollPosition = window.scrollY;

    // Get product data
    const allProducts = getProducts().length > 0 ? getProducts() : SAMPLE_PRODUCTS;
    const product = allProducts.find(p => p.id == productId);

    if (!product) {
        showProductDetailError();
        return;
    }

    // Store current product
    ProductDetailView.currentProduct = product;

    // Switch to detail view
    showView('product-detail-view');

    // Render product details
    renderProductDetail(product);

    // Load related products
    loadRelatedProducts(product);

    // Update URL
    updateProductUrl(productId);

    // Increment view count
    incrementClicks(productId);

    // Initialize event listeners
    initProductDetailListeners();
}

/**
 * Render product detail information
 * @param {Object} product - Product object
 */
function renderProductDetail(product) {
    const loading = document.getElementById('pdv-loading');
    const error = document.getElementById('pdv-error');
    const content = document.getElementById('pdv-content');

    // Hide loading/error, show content
    if (loading) loading.classList.add('hidden');
    if (error) error.classList.add('hidden');
    if (content) content.classList.remove('hidden');

    // Image
    const image = document.getElementById('pdv-image');
    if (image) {
        image.src = product.image || 'https://via.placeholder.com/800x800/0f0f0f/555?text=No+Image';
        image.alt = product.name;
    }

    // Title
    const title = document.getElementById('pdv-title');
    if (title) title.textContent = product.name;

    // Product ID
    const idValue = document.getElementById('pdv-id-value');
    if (idValue) idValue.textContent = product.id;

    // Style (if available)
    const styleSection = document.getElementById('pdv-product-style');
    const styleValue = document.getElementById('pdv-style-value');
    if (product.style && styleValue) {
        styleValue.textContent = product.style;
        if (styleSection) styleSection.classList.remove('hidden');
    } else {
        if (styleSection) styleSection.classList.add('hidden');
    }

    // Price
    const price = document.getElementById('pdv-price');
    const currency = document.getElementById('pdv-currency');
    if (price) price.textContent = parseFloat(product.price).toFixed(2);
    if (currency) currency.textContent = product.currency || 'PLN';

    // View button link
    const viewBtn = document.getElementById('pdv-view-btn');
    if (viewBtn) viewBtn.href = product.link || '#';

    // Description
    const descSection = document.getElementById('pdv-description-section');
    const descText = document.getElementById('pdv-description-text');
    if (product.description && descText) {
        descText.textContent = product.description;
        if (descSection) descSection.classList.remove('hidden');
    } else {
        if (descSection) descSection.classList.add('hidden');
    }

    // Stats
    const views = document.getElementById('pdv-views');
    const likes = document.getElementById('pdv-likes');
    if (views) views.textContent = product.clicks || 0;
    if (likes) likes.textContent = product.likes || 0;
}

/**
 * Show error state when product not found
 */
function showProductDetailError() {
    const loading = document.getElementById('pdv-loading');
    const error = document.getElementById('pdv-error');
    const content = document.getElementById('pdv-content');

    if (loading) loading.classList.add('hidden');
    if (content) content.classList.add('hidden');
    if (error) error.classList.remove('hidden');

    showView('product-detail-view');
}

/**
 * Load and display related products from the same category
 * @param {Object} product - Current product
 */
function loadRelatedProducts(product) {
    const relatedSection = document.getElementById('pdv-related-section');
    const relatedScroll = document.getElementById('pdv-related-scroll');
    const categoryName = document.getElementById('pdv-related-category-name');

    if (!product.category || !relatedSection || !relatedScroll) {
        if (relatedSection) relatedSection.classList.add('hidden');
        return;
    }

    // Filter products by category, exclude current product
    const allProducts = getProducts().length > 0 ? getProducts() : SAMPLE_PRODUCTS;
    const related = allProducts.filter(p => 
        p.category === product.category && p.id !== product.id
    );

    if (related.length === 0) {
        relatedSection.classList.add('hidden');
        return;
    }

    // Store related products
    ProductDetailView.relatedProducts = related;

    // Update category name
    if (categoryName) categoryName.textContent = product.category;

    // Clear and populate related products
    relatedScroll.innerHTML = '';
    related.forEach(p => {
        const card = buildRelatedProductCard(p);
        relatedScroll.appendChild(card);
    });

    // Show section
    relatedSection.classList.remove('hidden');

    // Setup "View all" link
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
 * @param {Object} product - Product object
 * @returns {HTMLElement} - Product card element
 */
function buildRelatedProductCard(product) {
    const card = document.createElement('div');
    card.className = 'pdv-related-card';
    
    const imgSrc = product.image || 'https://via.placeholder.com/300x300/0f0f0f/555?text=No+Image';
    const priceFormatted = parseFloat(product.price).toFixed(2);
    const currency = product.currency || 'PLN';
    const views = product.clicks || 0;
    
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
                    <span><i class="fa-regular fa-heart"></i> 0</span>
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
 * Navigate back to products view
 */
function navigateBackFromDetail() {
    const previousView = ProductDetailView.previousView || 'products-view';
    showView(previousView);
    
    // Restore scroll position
    setTimeout(() => {
        window.scrollTo(0, ProductDetailView.previousScrollPosition);
    }, 0);
    
    // Update URL
    if (window.location.hash.startsWith('#product/')) {
        history.back();
    }
}

/**
 * Navigate to products view filtered by category
 * @param {string} category - Category name
 */
function navigateToCategory(category) {
    showView('products-view');
    filterProductsGrid(category);
    
    // Update category dropdown if exists
    const catLabel = document.getElementById('pv-cat-label');
    if (catLabel) catLabel.textContent = category;
    
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
        window.location.hash = newUrl;
    }
}

/**
 * Initialize event listeners for product detail view
 */
function initProductDetailListeners() {
    // Back button
    const backBtn = document.getElementById('pdv-back-btn');
    if (backBtn) {
        backBtn.onclick = navigateBackFromDetail;
    }

    // Save button
    const saveBtn = document.getElementById('pdv-save-btn');
    if (saveBtn) {
        saveBtn.onclick = () => {
            saveProduct(ProductDetailView.currentProduct.id);
        };
    }

    // Share button
    const shareBtn = document.getElementById('pdv-share-btn');
    if (shareBtn) {
        shareBtn.onclick = () => {
            shareProduct(ProductDetailView.currentProduct.id);
        };
    }

    // Expand image button
    const expandBtn = document.getElementById('pdv-expand-btn');
    if (expandBtn) {
        expandBtn.onclick = () => {
            openImageLightbox(ProductDetailView.currentProduct.image);
        };
    }

    // Fullscreen button (same as expand)
    const fullscreenBtn = document.getElementById('pdv-fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.onclick = () => {
            openImageLightbox(ProductDetailView.currentProduct.image);
        };
    }

    // Description toggle
    const descToggle = document.getElementById('pdv-description-toggle');
    if (descToggle) {
        descToggle.onclick = toggleDescription;
    }

    // Report link
    const reportLink = document.getElementById('pdv-report-link');
    if (reportLink) {
        reportLink.onclick = (e) => {
            e.preventDefault();
            reportProblem(ProductDetailView.currentProduct.id);
        };
    }
}

/**
 * Toggle description expand/collapse
 */
function toggleDescription() {
    const content = document.getElementById('pdv-description-content');
    const icon = document.querySelector('.pdv-description-icon');
    
    if (content) {
        content.classList.toggle('hidden');
    }
    
    if (icon) {
        icon.style.transform = content.classList.contains('hidden') 
            ? 'rotate(0deg)' 
            : 'rotate(180deg)';
    }
}

/**
 * Open image in lightbox/fullscreen mode
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
 */
function closeImageLightbox() {
    const lightbox = document.getElementById('pdv-lightbox');
    
    if (lightbox) {
        lightbox.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

/**
 * Save product to user's saved items
 * @param {string|number} productId - Product ID
 */
function saveProduct(productId) {
    // Get saved products from localStorage
    let savedProducts = localStorage.getItem('savedProducts');
    savedProducts = savedProducts ? JSON.parse(savedProducts) : [];
    
    // Check if already saved
    if (savedProducts.includes(productId)) {
        showToast('Produkt jest już zapisany', 'info');
        return;
    }
    
    // Add to saved
    savedProducts.push(productId);
    localStorage.setItem('savedProducts', JSON.stringify(savedProducts));
    
    // Update button state
    const saveBtn = document.getElementById('pdv-save-btn');
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> <span>Zapisano</span>';
        saveBtn.disabled = true;
    }
    
    showToast('Dodano do zapisanych!', 'success');
}

/**
 * Share product (copy URL to clipboard or use native share)
 * @param {string|number} productId - Product ID
 */
function shareProduct(productId) {
    const productUrl = `${window.location.origin}${window.location.pathname}#product/${productId}`;
    
    // Try native share API first (mobile)
    if (navigator.share) {
        navigator.share({
            title: ProductDetailView.currentProduct.name,
            text: `Sprawdź ten produkt: ${ProductDetailView.currentProduct.name}`,
            url: productUrl
        }).then(() => {
            showToast('Udostępniono!', 'success');
        }).catch(() => {
            // Fallback to clipboard
            copyToClipboard(productUrl);
        });
    } else {
        // Fallback to clipboard
        copyToClipboard(productUrl);
    }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Link skopiowany do schowka!', 'success');
        }).catch(() => {
            showToast('Nie udało się skopiować linku', 'error');
        });
    } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast('Link skopiowany do schowka!', 'success');
        } catch (err) {
            showToast('Nie udało się skopiować linku', 'error');
        }
        document.body.removeChild(textarea);
    }
}

/**
 * Report problem with product link
 * @param {string|number} productId - Product ID
 */
function reportProblem(productId) {
    // This could open a modal or redirect to a contact form
    showToast('Zgłoszenie zostało wysłane', 'success');
    console.log('Report problem for product:', productId);
}

/**
 * Handle URL routing for product detail view
 */
function handleProductRouting() {
    const hash = window.location.hash;
    
    // Check if URL matches #product/{id}
    const productMatch = hash.match(/^#product\/(.+)$/);
    
    if (productMatch) {
        const productId = productMatch[1];
        showProductDetail(productId);
    }
}

/**
 * Handle browser back/forward navigation
 */
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.view === 'product-detail') {
        showProductDetail(event.state.productId);
    } else {
        handleProductRouting();
    }
});

/**
 * Initialize product detail view routing on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check URL on initial load
    handleProductRouting();
    
    // Initialize lightbox close button
    const lightboxClose = document.getElementById('pdv-lightbox-close');
    if (lightboxClose) {
        lightboxClose.onclick = closeImageLightbox;
    }
    
    // Close lightbox on overlay click
    const lightbox = document.getElementById('pdv-lightbox');
    if (lightbox) {
        lightbox.onclick = (e) => {
            if (e.target === lightbox) {
                closeImageLightbox();
            }
        };
    }
    
    // Close lightbox on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeImageLightbox();
        }
    });
});

/**
 * Modify buildProductCard to add click navigation
 */
// Update the existing buildProductCard function to include click handler
// Add this after the card.innerHTML = ... line:
/*
card.style.cursor = 'pointer';
card.addEventListener('click', (e) => {
    // Don't navigate if clicking the "See agents" button
    if (e.target.closest('.product-card__btn')) {
        return;
    }
    showProductDetail(product.id);
});
*/
```

### 3. CSS Styling (style.css)

#### Product Detail View Styles

```css
/* =========================================
   PRODUCT DETAIL VIEW STYLES
========================================= */

/* Main Container */
#product-detail-view {
    padding: 0;
}

.pdv-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
}

/* Back Navigation */
.pdv-back-nav {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1.5rem 2rem 0;
}

.pdv-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--text-secondary);
    padding: 0.75rem 1.25rem;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition-smooth);
}

.pdv-back-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateX(-2px);
}

/* Loading State */
.pdv-loading {
    text-align: center;
    padding: 5rem 2rem;
    color: var(--text-secondary);
}

.pdv-loading i {
    font-size: 3rem;
    margin-bottom: 1rem;
    display: block;
    color: var(--text-primary);
}

.pdv-loading p {
    font-size: 1.1rem;
}

/* Error State */
.pdv-error {
    text-align: center;
    padding: 5rem 2rem;
    max-width: 500px;
    margin: 0 auto;
}

.pdv-error i {
    font-size: 4rem;
    color: #ef4444;
    margin-bottom: 1.5rem;
    display: block;
}

.pdv-error h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--text-primary);
}

.pdv-error p {
    color: var(--text-secondary);
    margin-bottom: 2rem;
    line-height: 1.6;
}

/* Main Content Layout */
.pdv-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    margin-top: 2rem;
}

/* Image Section */
.pdv-image-section {
    position: relative;
}

.pdv-image-wrapper {
    position: relative;
    background: #ffffff;
    border-radius: var(--radius-lg);
    overflow: hidden;
    aspect-ratio: 1 / 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.pdv-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 2rem;
}

.pdv-expand-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 44px;
    height: 44px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--transition-smooth);
    opacity: 0;
}

.pdv-image-wrapper:hover .pdv-expand-btn {
    opacity: 1;
}

.pdv-expand-btn:hover {
    background: rgba(0, 0, 0, 0.8);
    transform: scale(1.05);
}

/* Info Section */
.pdv-info-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.pdv-title {
    font-size: 2rem;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.02em;
    color: var(--text-primary);
    margin: 0;
}

/* Meta Information */
.pdv-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
}

.pdv-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.5rem 1rem;
    border-radius: var(--radius-pill);
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
}

.pdv-badge-service {
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.2);
    color: #10b981;
}

.pdv-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: var(--text-secondary);
}

.pdv-meta-item i {
    color: var(--text-muted);
}

/* Price Section */
.pdv-price-section {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    padding: 1.5rem 0;
    border-top: 1px solid var(--border-subtle);
    border-bottom: 1px solid var(--border-subtle);
}

.pdv-price {
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--text-primary);
}

.pdv-currency {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-secondary);
}

/* Action Buttons */
.pdv-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.pdv-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: var(--transition-smooth);
    border: none;
    font-family: inherit;
    text-decoration: none;
}

.pdv-action-primary {
    background: #ffffff;
    color: #000000;
    flex: 1;
    min-width: 150px;
}

.pdv-action-primary:hover {
    background: #e5e5e5;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2);
}

.pdv-action-secondary {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
    border: 1px solid rgba(255, 255, 255, 0.1);
    flex: 1;
    min-width: 150px;
}

.pdv-action-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
}

.pdv-action-icon {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-secondary);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1rem;
    min-width: auto;
}

.pdv-action-icon:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    border-color: rgba(255, 255, 255, 0.2);
}

/* Report Link */
.pdv-report-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-muted);
    font-size: 0.85rem;
    font-weight: 500;
    transition: var(--transition-smooth);
    text-decoration: none;
}

.pdv-report-link:hover {
    color: #ef4444;
}

/* Description Section */
.pdv-description-section {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-lg);
    overflow: hidden;
}

.pdv-description-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    background: transparent;
    border: none;
    color: var(--text-primary);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition-smooth);
    font-family: inherit;
}

.pdv-description-header:hover {
    background: rgba(255, 255, 255, 0.05);
}

.pdv-description-icon {
    transition: transform 0.3s ease;
    color: var(--text-secondary);
}

.pdv-description-content {
    padding: 0 1.5rem 1.5rem;
    color: var(--text-secondary);
    line-height: 1.7;
    max-height: 500px;
    overflow-y: auto;
}

.pdv-description-content.hidden {
    display: none;
}

/* Stats */
.pdv-stats {
    display: flex;
    gap: 2rem;
    padding-top: 1rem;
}

.pdv-stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: var(--text-secondary);
}

.pdv-stat i {
    color: var(--text-muted);
}

.pdv-stat span:first-of-type {
    font-weight: 600;
    color: var(--text-primary);
}

/* Related Products Section */
.pdv-related-section {
    margin-top: 4rem;
    padding-top: 3rem;
    border-top: 1px solid var(--border-subtle);
}

.pdv-related-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.pdv-related-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
}

.pdv-related-view-all {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-secondary);
    font-size: 0.9rem;
    font-weight: 500;
    transition: var(--transition-smooth);
    text-decoration: none;
}

.pdv-related-view-all:hover {
    color: var(--text-primary);
    gap: 0.75rem;
}

/* Related Products Scroll Container */
.pdv-related-scroll {
    display: flex;
    gap: 1.5rem;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    padding-bottom: 1rem;
    scrollbar-width: thin;
    scrollbar-color: var(--border-strong) transparent;
    cursor: grab;
}

.pdv-related-scroll:active {
    cursor: grabbing;
}

.pdv-related-scroll::-webkit-scrollbar {
    height: 8px;
}

.pdv-related-scroll::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
}

.pdv-related-scroll::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 10px;
}

.pdv-related-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
}

/* Related Product Card */
.pdv-related-card {
    flex: 0 0 280px;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    overflow: hidden;
    cursor: pointer;
    transition: var(--transition-smooth);
}

.pdv-related-card:hover {
    border-color: var(--border-strong);
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.pdv-related-card__img-wrap {
    background: #ffffff;
    aspect-ratio: 1 / 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.pdv-related-card__img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 1rem;
}

.pdv-related-card__body {
    padding: 1rem;
}

.pdv-related-card__cat {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
}

.pdv-related-card__name {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.75rem;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.pdv-related-card__bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.pdv-related-card__price {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary);
}

.pdv-related-card__meta {
    display: flex;
    gap: 0.75rem;
    font-size: 0.8rem;
    color: var(--text-muted);
}

/* Image Lightbox */
.pdv-lightbox-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 2rem;
    opacity: 1;
    transition: opacity 0.3s ease;
}

.pdv-lightbox-overlay.hidden {
    opacity: 0;
    pointer-events: none;
}

.pdv-lightbox-close {
    position: absolute;
    top: 2rem;
    right: 2rem;
    width: 50px;
    height: 50px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    color: #ffffff;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--transition-smooth);
}

.pdv-lightbox-close:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
}

.pdv-lightbox-image {
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
    border-radius: var(--radius-lg);
}

/* Responsive Design */
@media (max-width: 1024px) {
    .pdv-content {
        grid-template-columns: 1fr;
        gap: 2rem;
    }
    
    .pdv-related-card {
        flex: 0 0 240px;
    }
}

@media (max-width: 768px) {
    .pdv-container {
        padding: 1rem;
    }
    
    .pdv-back-nav {
        padding: 1rem 1rem 0;
    }
    
    .pdv-title {
        font-size: 1.5rem;
    }
    
    .pdv-price {
        font-size: 2rem;
    }
    
    .pdv-actions {
        flex-direction: column;
    }
    
    .pdv-action-btn {
        width: 100%;
    }
    
    .pdv-related-card {
        flex: 0 0 200px;
    }
    
    .pdv-lightbox-overlay {
        padding: 1rem;
    }
    
    .pdv-lightbox-close {
        top: 1rem;
        right: 1rem;
        width: 44px;
        height: 44px;
    }
}

@media (max-width: 480px) {
    .pdv-back-btn {
        font-size: 0.85rem;
        padding: 0.6rem 1rem;
    }
    
    .pdv-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
    }
    
    .pdv-price-section {
        padding: 1rem 0;
    }
    
    .pdv-related-card {
        flex: 0 0 180px;
    }
}

/* Animations */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.pdv-content {
    animation: fadeIn 0.4s ease-out;
}

/* Enable drag scrolling for related products */
.pdv-related-scroll {
    -webkit-overflow-scrolling: touch;
}
```

## Data Models

### Product Data Structure

The existing product data structure from `SAMPLE_PRODUCTS` and localStorage:

```typescript
interface Product {
    id: string | number;              // Unique product identifier
    name: string;                     // Product name/title
    price: number;                    // Product price (numeric)
    currency: string;                 // Currency code (e.g., "PLN", "USD")
    image: string;                    // Product image URL
    category: string;                 // Product category
    link: string;                     // External product link (agent link)
    status: string;                   // Product status ("active", "inactive")
    clicks: number;                   // View/click count
    popular?: boolean;                // Optional popular flag
    description?: string;             // Optional product description
    style?: string;                   // Optional style identifier
    likes?: number;                   // Optional likes count
}
```

### View State Management

```typescript
interface ProductDetailViewState {
    currentProduct: Product | null;   // Currently displayed product
    previousView: string;             // Previous view ID (for navigation)
    previousScrollPosition: number;   // Scroll position to restore
    relatedProducts: Product[];       // Filtered related products array
}
```

### URL Routing Structure

```
Base URL Structure:
- Product Grid: #products-view or /
- Product Detail: #product/{productId}
- Product Detail with Category: #product/{productId}?category={category}

Examples:
- https://example.com/#product/s1
- https://example.com/#product/s5
- https://example.com/#product/s12?category=Accessories
```

## Testing Strategy

### Unit Tests

1. **Product Data Retrieval**
   - Test `getProducts()` with empty localStorage
   - Test `getProducts()` with populated localStorage
   - Test fallback to `SAMPLE_PRODUCTS`

2. **Product Detail Rendering**
   - Test `renderProductDetail()` with complete product data
   - Test `renderProductDetail()` with missing optional fields
   - Test `showProductDetailError()` when product not found

3. **Related Products Filtering**
   - Test `loadRelatedProducts()` with matching category
   - Test `loadRelatedProducts()` excluding current product
   - Test `loadRelatedProducts()` with empty category
   - Test `loadRelatedProducts()` with no matching products

4. **URL Routing**
   - Test `updateProductUrl()` updates browser history
   - Test `handleProductRouting()` parses hash correctly
   - Test `handleProductRouting()` handles invalid product IDs

5. **Action Handlers**
   - Test `saveProduct()` adds to localStorage
   - Test `saveProduct()` prevents duplicate saves
   - Test `shareProduct()` copies URL to clipboard
   - Test `shareProduct()` uses native share API when available

### Integration Tests

1. **Navigation Flow**
   - Navigate from product grid to detail view
   - Navigate back from detail view to grid
   - Navigate between related products
   - Test browser back/forward buttons

2. **View State Management**
   - Verify previous view restoration
   - Verify scroll position restoration
   - Verify filter state preservation

3. **Responsive Behavior**
   - Test layout on mobile viewports (< 768px)
   - Test layout on tablet viewports (768px - 1024px)
   - Test layout on desktop viewports (> 1024px)
   - Test related products horizontal scroll on all sizes

### User Acceptance Testing

1. **Product Card Click**: User clicks any product card → Detail view loads with correct product
2. **Back Navigation**: User clicks "Powrót" button → Returns to previous view at same scroll position
3. **Related Products**: User sees related products from same category (excluding current product)
4. **Related Product Click**: User clicks related product → Detail view updates to new product
5. **View All Link**: User clicks "View all" → Navigates to product grid filtered by category
6. **Image Expand**: User clicks expand icon → Image opens in fullscreen lightbox
7. **Save Product**: User clicks "Save" button → Product added to saved items with confirmation
8. **Share Product**: User clicks share button → URL copied to clipboard with confirmation
9. **Description Toggle**: User clicks description header → Description expands/collapses smoothly
10. **Direct URL**: User navigates to `#product/s1` → Product detail view loads correctly
11. **Invalid Product URL**: User navigates to `#product/invalid` → Error state displayed with "Wróć do produktów" button
12. **Mobile Horizontal Scroll**: User swipes related products horizontally on mobile → Smooth scroll behavior

## Error Handling

### Error Scenarios and Handling

1. **Product Not Found**
   ```javascript
   // Error State: Display user-friendly message
   - Show error icon and title "Nie znaleziono produktu"
   - Provide "Wróć do produktów" button
   - Log error to console for debugging
   ```

2. **Missing Image**
   ```javascript
   // Fallback: Use placeholder image
   const imgSrc = product.image || 'https://via.placeholder.com/800x800/0f0f0f/555?text=No+Image';
   ```

3. **Missing Optional Fields**
   ```javascript
   // Graceful Degradation: Hide sections without data
   - Hide description section if product.description is empty
   - Hide style meta if product.style is undefined
   - Show 0 for likes if product.likes is undefined
   ```

4. **localStorage Not Available**
   ```javascript
   // Fallback: Use in-memory state
   try {
       localStorage.setItem('test', 'test');
       localStorage.removeItem('test');
   } catch (e) {
       // Use session state or in-memory array
       console.warn('localStorage not available, using fallback');
   }
   ```

5. **Network Errors (Image Loading)**
   ```javascript
   // Image Error Handler
   image.onerror = () => {
       image.src = 'https://via.placeholder.com/800x800/0f0f0f/555?text=Image+Error';
   };
   ```

6. **Clipboard API Not Supported**
   ```javascript
   // Fallback: Use document.execCommand('copy')
   if (!navigator.clipboard) {
       // Use textarea fallback method
   }
   ```

7. **History API Not Supported**
   ```javascript
   // Fallback: Use hash-based routing only
   if (!window.history || !window.history.pushState) {
       window.location.hash = `#product/${productId}`;
   }
   ```

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading Images**
   ```html
   <img src="..." alt="..." loading="lazy">
   ```
   - All product images use `loading="lazy"` attribute
   - Related product images load on-demand as user scrolls

2. **Debounced Scroll Handling**
   ```javascript
   // Debounce related products scroll for smooth performance
   let scrollTimeout;
   relatedScroll.addEventListener('scroll', () => {
       clearTimeout(scrollTimeout);
       scrollTimeout = setTimeout(() => {
           // Handle scroll end
       }, 150);
   });
   ```

3. **Efficient DOM Updates**
   - Batch DOM updates using DocumentFragment
   - Update only changed elements instead of full re-render
   - Use `classList.add/remove` instead of `className =`

4. **CSS Animations with GPU Acceleration**
   ```css
   /* Use transform and opacity for smooth 60fps animations */
   .pdv-content {
       animation: fadeIn 0.4s ease-out;
       will-change: opacity, transform;
   }
   ```

5. **Minimize Layout Thrashing**
   ```javascript
   // Read all layout properties first, then write
   const width = element.offsetWidth;
   const height = element.offsetHeight;
   // Then update styles
   element.style.width = `${width}px`;
   ```

6. **Event Delegation**
   ```javascript
   // Use event delegation for related product clicks
   relatedScroll.addEventListener('click', (e) => {
       const card = e.target.closest('.pdv-related-card');
       if (card) {
           // Handle click
       }
   });
   ```

7. **Intersection Observer for Visibility**
   ```javascript
   // Lazy load related products when section becomes visible
   const observer = new IntersectionObserver((entries) => {
       entries.forEach(entry => {
           if (entry.isIntersecting) {
               loadRelatedProducts(product);
               observer.unobserve(entry.target);
           }
       });
   });
   ```

### Performance Metrics

- **First Contentful Paint (FCP)**: < 1.0s
- **Time to Interactive (TTI)**: < 2.0s
- **Largest Contentful Paint (LCP)**: < 1.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

## Accessibility Considerations

### WCAG 2.1 Compliance

1. **Keyboard Navigation**
   - All interactive elements accessible via Tab key
   - Focus indicators visible on all interactive elements
   - Escape key closes lightbox modal

2. **Screen Reader Support**
   - Semantic HTML elements (`<button>`, `<a>`, `<nav>`)
   - ARIA labels for icon-only buttons
   - Alternative text for all images
   - Proper heading hierarchy (h1, h2, h3)

3. **Color Contrast**
   - Text color: #ffffff on #000000 (21:1 contrast ratio) ✓
   - Secondary text: #a3a3a3 on #000000 (11.6:1 contrast ratio) ✓
   - Buttons meet minimum 4.5:1 contrast ratio ✓

4. **Focus Management**
   - Focus trapped in lightbox when open
   - Focus returns to triggering element when lightbox closes
   - Skip links for keyboard users

5. **Responsive Text**
   - Minimum font size: 14px (0.85rem)
   - Text scales with viewport
   - Line height: 1.5 or greater for body text

### Accessibility Enhancements

```html
<!-- Example: Enhanced button with ARIA -->
<button 
    class="pdv-expand-btn" 
    id="pdv-expand-btn" 
    aria-label="Powiększ obraz produktu"
    title="Powiększ obraz">
    <i class="fa-solid fa-expand" aria-hidden="true"></i>
</button>

<!-- Example: Enhanced image with proper alt text -->
<img 
    id="pdv-image" 
    src="..." 
    alt="Zdjęcie produktu: Nike Air Jordan 1 Retro w kolorze czarnym i czerwonym" 
    class="pdv-image">
```

## Browser Compatibility

### Supported Browsers

- **Chrome/Edge**: Version 90+ (Chromium-based)
- **Firefox**: Version 88+
- **Safari**: Version 14+
- **Mobile Safari**: iOS 14+
- **Chrome Android**: Version 90+

### Polyfills and Fallbacks

1. **CSS Grid**: Native support in all target browsers (no polyfill needed)
2. **CSS Custom Properties**: Native support in all target browsers
3. **Intersection Observer**: Native support in all target browsers
4. **History API**: Fallback to hash-based routing for older browsers
5. **Clipboard API**: Fallback to `document.execCommand('copy')`
6. **Native Share API**: Fallback to clipboard copy
7. **CSS `aspect-ratio`**: Fallback to padding-bottom trick for older browsers

### Feature Detection

```javascript
// Feature detection examples
const hasHistoryAPI = !!(window.history && window.history.pushState);
const hasClipboardAPI = !!navigator.clipboard;
const hasShareAPI = !!navigator.share;
const hasIntersectionObserver = 'IntersectionObserver' in window;
```

## Security Considerations

### XSS Prevention

1. **User-Generated Content**
   - Sanitize product names before inserting into DOM
   - Use `textContent` instead of `innerHTML` for user data
   - Escape HTML entities in descriptions

2. **URL Validation**
   - Validate product IDs before querying
   - Sanitize URL parameters
   - Prevent JavaScript injection in URLs

### Content Security Policy (CSP)

```http
Content-Security-Policy: 
    default-src 'self'; 
    script-src 'self' 'unsafe-inline'; 
    style-src 'self' 'unsafe-inline' fonts.googleapis.com; 
    img-src 'self' https: data:; 
    font-src 'self' fonts.gstatic.com;
    connect-src 'self';
```

### localStorage Security

- **No Sensitive Data**: Never store passwords, tokens, or personal information
- **Data Validation**: Validate all data read from localStorage
- **Size Limits**: Implement size limits for saved products array
- **Sanitization**: Sanitize data before storing

## Future Enhancements

### Phase 2 Features

1. **Image Gallery**
   - Multiple product images
   - Thumbnail navigation
   - Zoom on hover

2. **Product Variants**
   - Size/color selection
   - Variant-specific pricing
   - Availability indicators

3. **Reviews and Ratings**
   - User reviews section
   - Star rating system
   - Review filtering and sorting

4. **Wishlist Integration**
   - Persistent wishlist across sessions
   - Wishlist sharing
   - Email notifications for price changes

5. **Recently Viewed Products**
   - Track product views
   - Display recently viewed section
   - Clear history option

6. **Social Proof**
   - "X people viewed this today"
   - "Popular in [category]" badge
   - Trending products indicator

7. **Advanced Analytics**
   - Track time spent on product page
   - Track scroll depth
   - A/B testing for layout variations

### Technical Debt and Refactoring

1. **Modularization**: Break down `script.js` into smaller modules
2. **TypeScript Migration**: Add type safety to JavaScript codebase
3. **CSS Modules**: Scope CSS to components to prevent conflicts
4. **State Management**: Implement centralized state management (e.g., Redux-like pattern)
5. **Build Process**: Add bundling and minification pipeline (Webpack, Vite, or Rollup)
6. **Testing Framework**: Integrate Jest for unit tests and Playwright for E2E tests

## Implementation Checklist

### Phase 1: Foundation (Core Functionality)

- [ ] Add HTML structure for product-detail-view
- [ ] Add image lightbox modal HTML
- [ ] Implement `showProductDetail()` function
- [ ] Implement `renderProductDetail()` function
- [ ] Implement `showProductDetailError()` function
- [ ] Implement `navigateBackFromDetail()` function
- [ ] Add product detail view CSS styles
- [ ] Add responsive CSS breakpoints
- [ ] Test product detail loading from grid

### Phase 2: Related Products

- [ ] Implement `loadRelatedProducts()` function
- [ ] Implement `buildRelatedProductCard()` function
- [ ] Implement `navigateToCategory()` function
- [ ] Add related products section CSS
- [ ] Add horizontal scroll styling
- [ ] Enable drag-to-scroll functionality
- [ ] Test related products filtering
- [ ] Test "View all" link navigation

### Phase 3: Actions and Interactions

- [ ] Implement `saveProduct()` function
- [ ] Implement `shareProduct()` function
- [ ] Implement `copyToClipboard()` function
- [ ] Implement `reportProblem()` function
- [ ] Implement `toggleDescription()` function
- [ ] Implement `openImageLightbox()` function
- [ ] Implement `closeImageLightbox()` function
- [ ] Add action button event listeners
- [ ] Test all action buttons

### Phase 4: URL Routing

- [ ] Implement `updateProductUrl()` function
- [ ] Implement `handleProductRouting()` function
- [ ] Add `popstate` event listener
- [ ] Add initial routing on page load
- [ ] Test hash-based routing
- [ ] Test browser back/forward navigation
- [ ] Test direct URL navigation
- [ ] Test invalid product ID handling

### Phase 5: Product Card Integration

- [ ] Update `buildProductCard()` to add click handlers
- [ ] Prevent navigation when clicking "See agents" button
- [ ] Add cursor pointer to product cards
- [ ] Test product card click navigation
- [ ] Test grid to detail transition

### Phase 6: Polish and Testing

- [ ] Add loading animations
- [ ] Add error state styling
- [ ] Add smooth transitions
- [ ] Test responsive layouts (mobile, tablet, desktop)
- [ ] Test image lazy loading
- [ ] Test performance (FCP, LCP, CLS)
- [ ] Test accessibility (keyboard navigation, screen readers)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Add translation keys to translations.js
- [ ] Final QA pass

## Conclusion

This design document provides a comprehensive blueprint for implementing the Product Detail View system within the existing SWAGREPS platform. The design prioritizes:

1. **Consistency**: Seamless integration with existing patterns and styles
2. **Performance**: Lightweight, fast-loading implementation
3. **User Experience**: Intuitive navigation and smooth interactions
4. **Maintainability**: Clean, well-documented code following established conventions
5. **Responsiveness**: Mobile-first design that works beautifully on all devices

The implementation follows vanilla JavaScript patterns already established in the codebase, avoids introducing new dependencies, and leverages existing utility functions and styles. The modular structure allows for incremental development and testing while maintaining full backwards compatibility with the existing product grid and navigation system.
