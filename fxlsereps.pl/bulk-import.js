// =========================================
// BULK IMPORT FUNCTIONS
// =========================================

/**
 * Parse CSV file to products array
 */
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const products = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const product = {};
        
        headers.forEach((header, index) => {
            product[header] = values[index] || '';
        });
        
        // Convert to correct format
        products.push({
            id: product.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: product.name || 'Unnamed Product',
            price: parseFloat(product.price) || 0,
            currency: product.currency || 'PLN',
            image: product.image || '',
            category: product.category || 'Uncategorized',
            link: product.link || '',
            status: product.status || 'active',
            clicks: parseInt(product.clicks) || 0,
            popular: product.popular === 'true' || product.popular === '1'
        });
    }
    
    return products;
}

/**
 * Parse JSON file to products array
 */
function parseJSON(jsonText) {
    try {
        const data = JSON.parse(jsonText);
        
        // If it's an array, use it directly
        if (Array.isArray(data)) {
            return data.map(p => ({
                id: p.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name: p.name || 'Unnamed Product',
                price: parseFloat(p.price) || 0,
                currency: p.currency || 'PLN',
                image: p.image || '',
                category: p.category || 'Uncategorized',
                link: p.link || '',
                status: p.status || 'active',
                clicks: parseInt(p.clicks) || 0,
                popular: p.popular === true || p.popular === 'true'
            }));
        }
        
        // If it's an object with products property
        if (data.products && Array.isArray(data.products)) {
            return parseJSON(JSON.stringify(data.products));
        }
        
        return [];
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return [];
    }
}

/**
 * Import products from file
 */
async function importProductsFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const text = e.target.result;
                let products = [];
                
                // Detect file type
                if (file.name.endsWith('.csv')) {
                    products = parseCSV(text);
                } else if (file.name.endsWith('.json')) {
                    products = parseJSON(text);
                } else {
                    reject(new Error('Unsupported file format. Use CSV or JSON.'));
                    return;
                }
                
                resolve(products);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Bulk import products to Supabase
 */
async function bulkImportProducts(products, onProgress) {
    const results = {
        success: 0,
        failed: 0,
        errors: []
    };
    
    for (let i = 0; i < products.length; i++) {
        try {
            const product = products[i];
            await saveProductToDB(product);
            results.success++;
            
            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: products.length,
                    product: product.name,
                    status: 'success'
                });
            }
        } catch (error) {
            results.failed++;
            results.errors.push({
                product: products[i].name,
                error: error.message
            });
            
            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: products.length,
                    product: products[i].name,
                    status: 'error',
                    error: error.message
                });
            }
        }
    }
    
    return results;
}

/**
 * Export products to CSV
 */
function exportProductsToCSV(products) {
    const headers = ['id', 'name', 'price', 'currency', 'image', 'category', 'link', 'status', 'clicks', 'popular'];
    const csvLines = [headers.join(',')];
    
    products.forEach(product => {
        const values = headers.map(header => {
            const value = product[header];
            // Escape commas in values
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        });
        csvLines.push(values.join(','));
    });
    
    return csvLines.join('\n');
}

/**
 * Download CSV file
 */
function downloadCSV(csvContent, filename = 'products-export.csv') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Generate CSV template
 */
function generateCSVTemplate() {
    const headers = ['id', 'name', 'price', 'currency', 'image', 'category', 'link', 'status', 'clicks', 'popular'];
    const example = [
        '1',
        'Example Product',
        '99.99',
        'PLN',
        'https://example.com/image.jpg',
        'Shoes',
        'https://example.com/product',
        'active',
        '0',
        'false'
    ];
    
    return [headers.join(','), example.join(',')].join('\n');
}
