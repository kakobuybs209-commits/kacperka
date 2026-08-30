// Supabase Configuration
const SUPABASE_URL = 'https://ziqvkrchmgmtlorqpghk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppcXZrcmNobWdtdGxvcnFwZ2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNTI3ODEsImV4cCI6MjEwMzYyODc4MX0.CtofbvgJqkVipgvnndiEe7YvITMRyVMkwx7EqL7vyEM';

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =========================================
// PRODUCTS DATABASE FUNCTIONS
// =========================================

// Get all products from Supabase
async function getProductsFromDB() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

// Save product to Supabase
async function saveProductToDB(product) {
    try {
        const { data, error } = await supabase
            .from('products')
            .insert([{
                id: product.id,
                name: product.name,
                price: product.price,
                currency: product.currency,
                image: product.image,
                category: product.category,
                link: product.link,
                status: product.status,
                clicks: product.clicks || 0,
                popular: product.popular || false
            }])
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error saving product:', error);
        return null;
    }
}

// Update product in Supabase
async function updateProductInDB(id, updates) {
    try {
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error updating product:', error);
        return null;
    }
}

// Delete product from Supabase
async function deleteProductFromDB(id) {
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting product:', error);
        return false;
    }
}

// =========================================
// SELLERS DATABASE FUNCTIONS
// =========================================

// Get all sellers from Supabase
async function getSellersFromDB() {
    try {
        const { data, error } = await supabase
            .from('sellers')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching sellers:', error);
        return [];
    }
}

// Save seller to Supabase
async function saveSellerToDB(seller) {
    try {
        const { data, error } = await supabase
            .from('sellers')
            .insert([{
                name: seller.name,
                brands: seller.brands,
                description: seller.description,
                shop_url: seller.shop_url,
                top_rated: seller.top_rated || false
            }])
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error saving seller:', error);
        return null;
    }
}

// Delete seller from Supabase
async function deleteSellerFromDB(id) {
    try {
        const { error } = await supabase
            .from('sellers')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting seller:', error);
        return false;
    }
}

// =========================================
// ANALYTICS DATABASE FUNCTIONS
// =========================================

// Save analytics event (visit, click, etc.)
async function saveAnalyticsEvent(eventType, metadata = {}) {
    try {
        const { data, error } = await supabase
            .from('analytics')
            .insert([{
                event_type: eventType,
                metadata: metadata,
                timestamp: new Date().toISOString()
            }])
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error saving analytics:', error);
        return null;
    }
}

// Get analytics data for dashboard
async function getAnalyticsData(startDate, endDate) {
    try {
        const { data, error } = await supabase
            .from('analytics')
            .select('*')
            .gte('timestamp', startDate)
            .lte('timestamp', endDate)
            .order('timestamp', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return [];
    }
}

// Get analytics counts (visits, unique users, products)
async function getAnalyticsCounts(period = 'day') {
    try {
        let startDate = new Date();
        
        switch(period) {
            case 'day':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setDate(startDate.getDate() - 30);
                break;
        }
        
        const { data, error } = await supabase
            .from('analytics')
            .select('event_type')
            .gte('timestamp', startDate.toISOString());
        
        if (error) throw error;
        
        const visits = data.filter(e => e.event_type === 'visit').length;
        const uniqueUsers = new Set(data.filter(e => e.event_type === 'visit').map(e => e.metadata?.userId)).size;
        
        return { visits, uniqueUsers };
    } catch (error) {
        console.error('Error fetching analytics counts:', error);
        return { visits: 0, uniqueUsers: 0 };
    }
}

// =========================================
// MIGRATION HELPER
// =========================================

// Migrate localStorage data to Supabase (run once)
async function migrateLocalStorageToSupabase() {
    console.log('Starting migration from localStorage to Supabase...');
    
    // Migrate products
    const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
    if (localProducts.length > 0) {
        console.log(`Migrating ${localProducts.length} products...`);
        for (const product of localProducts) {
            await saveProductToDB(product);
        }
        console.log('Products migrated successfully!');
    }
    
    // Migrate sellers
    const localSellers = JSON.parse(localStorage.getItem('sellers') || '[]');
    if (localSellers.length > 0) {
        console.log(`Migrating ${localSellers.length} sellers...`);
        for (const seller of localSellers) {
            await saveSellerToDB(seller);
        }
        console.log('Sellers migrated successfully!');
    }
    
    console.log('Migration completed!');
}
