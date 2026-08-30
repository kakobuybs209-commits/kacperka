# Implementation Plan: Product Detail View

## Overview

This implementation plan breaks down the Product Detail View feature into discrete, testable tasks. The feature adds a full-page product detail experience with related products, action buttons, image lightbox, and URL routing. Implementation will integrate with existing vanilla JavaScript codebase (index.html, script.js, style.css, translations.js) and follow established patterns.

## Tasks

- [x] 1. Set up HTML structure and base styling
  - [x] 1.1 Add product-detail-view container to index.html
    - Add main view section with id `product-detail-view`
    - Include back navigation, loading state, error state, and content sections
    - Add product image section with expand button
    - Add product info section (title, meta, price, actions, description, stats)
    - Add related products section with horizontal scroll container
    - Place after existing views (home-view, products-view, sellers-view)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 1.2 Add image lightbox modal HTML
    - Create lightbox overlay div with id `pdv-lightbox`
    - Add close button with icon
    - Add lightbox image element
    - _Requirements: 12.4_

  - [x] 1.3 Add base CSS styles for product detail view
    - Add main container, back navigation, loading, and error state styles
    - Use monochromatic black/gray/white color scheme
    - Follow existing CSS variable patterns (--text-primary, --bg-surface, etc.)
    - _Requirements: 3.11, 8.1, 8.2, 8.3, 8.4_

- [x] 2. Implement core product detail display
  - [x] 2.1 Create showProductDetail() function in script.js
    - Accept productId parameter
    - Store previous view state and scroll position
    - Retrieve product data from getProducts() or SAMPLE_PRODUCTS
    - Handle product not found scenario
    - Switch to product-detail-view using showView()
    - Call renderProductDetail() with product data
    - Call loadRelatedProducts() with product data
    - Update URL with updateProductUrl()
    - Increment view count with incrementClicks()
    - Initialize event listeners with initProductDetailListeners()
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 9.1, 9.2, 14.1, 14.2, 14.5_

  - [x] 2.2 Create renderProductDetail() function
    - Hide loading/error states, show content
    - Render product image with fallback placeholder
    - Render product title
    - Render product ID/SKU
    - Render style (if available) or hide section
    - Render price with currency
    - Set view button link href
    - Render description or hide section if empty
    - Render view count and likes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.10, 9.2, 9.3_

  - [x] 2.3 Create showProductDetailError() function
    - Show error state with icon and message
    - Hide loading and content sections
    - Display "Nie znaleziono produktu" error
    - Provide back button to return to products view
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 2.4 Add ProductDetailView state object
    - Create state object to track currentProduct, previousView, previousScrollPosition, relatedProducts
    - _Requirements: 2.3, 4.2_

- [x] 3. Implement navigation and routing
  - [x] 3.1 Create navigateBackFromDetail() function
    - Restore previous view using showView()
    - Restore previous scroll position
    - Handle browser history navigation
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 3.2 Create updateProductUrl() function
    - Update browser URL to #product/{productId}
    - Use history.pushState for proper history management
    - Fallback to hash-based routing for older browsers
    - _Requirements: 10.1, 10.5_

  - [x] 3.3 Create handleProductRouting() function
    - Parse URL hash to extract product ID
    - Call showProductDetail() with parsed product ID
    - Handle invalid or missing product IDs
    - _Requirements: 10.2, 10.5_

  - [x] 3.4 Add popstate event listener
    - Listen for browser back/forward button clicks
    - Handle navigation state changes
    - Restore appropriate view based on history state
    - _Requirements: 10.3, 10.4_

  - [x] 3.5 Initialize routing on page load
    - Add DOMContentLoaded listener to call handleProductRouting()
    - Handle direct navigation to product URLs
    - _Requirements: 10.2_

- [x] 4. Checkpoint - Verify core functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement related products system
  - [x] 5.1 Create loadRelatedProducts() function
    - Filter products by matching category
    - Exclude current product from results
    - Handle empty or null category gracefully
    - Update category name in section header
    - Clear and populate related products container
    - Show/hide section based on availability of related products
    - Setup "View all" link click handler
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 7.1_

  - [x] 5.2 Create buildRelatedProductCard() function
    - Build card HTML with image, category, title, price, views, likes
    - Use same styling as product grid cards
    - Add click handler to navigate to clicked product
    - Return HTMLElement
    - _Requirements: 6.3, 6.4, 6.7_

  - [x] 5.3 Create navigateToCategory() function
    - Switch to products-view
    - Apply category filter using filterProductsGrid()
    - Update category dropdown label and active state
    - _Requirements: 7.2, 7.3_

  - [x] 5.4 Add related products CSS styling
    - Style related products section header and "View all" link
    - Style horizontal scroll container with drag behavior
    - Style related product cards with hover effects
    - Add responsive adjustments for different screen sizes
    - Customize scrollbar appearance
    - _Requirements: 6.5, 6.6, 8.3_

- [x] 6. Implement action buttons and interactions
  - [x] 6.1 Create initProductDetailListeners() function
    - Attach click handler to back button
    - Attach click handler to save button
    - Attach click handler to share button
    - Attach click handler to expand image button
    - Attach click handler to fullscreen button
    - Attach click handler to description toggle
    - Attach click handler to report link
    - _Requirements: 4.1, 11.2, 12.1, 12.2, 12.3, 12.4_

  - [x] 6.2 Create saveProduct() function
    - Read savedProducts from localStorage
    - Check if product already saved
    - Add product ID to saved list
    - Update localStorage
    - Update button state and show toast notification
    - _Requirements: 12.2, 12.5_

  - [x] 6.3 Create shareProduct() function
    - Generate product URL
    - Try native share API first (for mobile)
    - Fallback to copyToClipboard() if not available
    - Show success toast notification
    - _Requirements: 12.3, 12.5_

  - [x] 6.4 Create copyToClipboard() function
    - Use navigator.clipboard.writeText() if available
    - Fallback to document.execCommand('copy') for older browsers
    - Show appropriate toast notification (success or error)
    - _Requirements: 12.3_

  - [x] 6.5 Create reportProblem() function
    - Log problem report to console
    - Show confirmation toast
    - (Placeholder for future modal or contact form integration)
    - _Requirements: 3.9_

  - [x] 6.6 Create toggleDescription() function
    - Toggle hidden class on description content
    - Rotate chevron icon (0deg collapsed, 180deg expanded)
    - Use smooth CSS transition
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 6.7 Create openImageLightbox() function
    - Set lightbox image src
    - Show lightbox overlay
    - Disable body scroll (overflow: hidden)
    - _Requirements: 12.4_

  - [x] 6.8 Create closeImageLightbox() function
    - Hide lightbox overlay
    - Restore body scroll
    - _Requirements: 12.4_

  - [x] 6.9 Add lightbox event listeners
    - Attach click handler to lightbox close button
    - Close lightbox on overlay click (not on image click)
    - Close lightbox on Escape key press
    - _Requirements: 12.4_

- [x] 7. Integrate product card click navigation
  - [x] 7.1 Update buildProductCard() function in script.js
    - Add cursor: pointer style to product cards
    - Add click event listener to card
    - Call showProductDetail(product.id) on click
    - Prevent navigation when clicking "See agents" button
    - _Requirements: 2.1, 2.2, 2.5_

- [x] 8. Add complete CSS styling
  - [x] 8.1 Add product info section CSS
    - Style title, meta badges, price section
    - Style action buttons (primary, secondary, icon variants)
    - Style report link
    - Style description expandable section
    - Style stats display
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 11.4_

  - [x] 8.2 Add image section and lightbox CSS
    - Style product image wrapper with white background
    - Style expand button with hover effects
    - Style lightbox overlay with backdrop blur
    - Style lightbox close button
    - Style lightbox image with max dimensions
    - _Requirements: 3.2, 12.4_

  - [x] 8.3 Add responsive CSS breakpoints
    - Add styles for max-width 1024px (tablet)
    - Add styles for max-width 768px (mobile)
    - Add styles for max-width 480px (small mobile)
    - Ensure single column layout on mobile
    - Ensure related products maintain horizontal scroll
    - Ensure action buttons stack vertically on mobile
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 8.4 Add animations and transitions
    - Add fadeIn animation for content
    - Add smooth hover transitions for all interactive elements
    - Add description expand/collapse animation
    - Add lightbox fade in/out transition
    - Use GPU-accelerated properties (transform, opacity)
    - _Requirements: 11.4_

- [x] 9. Add translation keys
  - [x] 9.1 Add Polish translations to translations.js
    - Add keys for pdv.back, pdv.loading, pdv.error.title, pdv.error.message, pdv.error.back
    - Add keys for pdv.customerService, pdv.sku, pdv.style
    - Add keys for pdv.view, pdv.save, pdv.report, pdv.description
    - Add keys for pdv.views, pdv.likes, pdv.viewAll
    - _Requirements: 3.1, 3.4, 3.5, 3.6, 3.8, 3.9, 3.10, 4.1, 6.2, 7.1, 13.1, 14.1_

  - [x] 9.2 Add English translations to translations.js
    - Add English equivalents for all pdv.* keys
    - Ensure consistency with existing translation structure
    - _Requirements: All requirements (i18n support)_

- [x] 10. Final checkpoint - Testing and QA
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks build incrementally on previous work
- Each task is independently testable through browser interaction
- Tasks reference specific requirements for traceability
- Checkpoints ensure validation at logical break points
- Implementation follows existing codebase patterns (showView, getProducts, SAMPLE_PRODUCTS)
- CSS uses existing CSS variables and design tokens
- Translation system follows existing i18n patterns

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.4"] },
    { "id": 2, "tasks": ["2.1", "9.1", "9.2"] },
    { "id": 3, "tasks": ["2.2", "2.3", "3.2", "3.3"] },
    { "id": 4, "tasks": ["3.1", "3.4", "3.5"] },
    { "id": 5, "tasks": ["5.1", "5.3", "6.1"] },
    { "id": 6, "tasks": ["5.2", "5.4", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "6.8", "6.9"] },
    { "id": 7, "tasks": ["7.1", "8.1", "8.2"] },
    { "id": 8, "tasks": ["8.3", "8.4"] }
  ]
}
```
