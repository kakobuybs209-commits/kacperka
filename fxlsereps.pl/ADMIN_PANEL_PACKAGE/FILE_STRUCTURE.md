# 📂 Admin Panel Package - File Structure

## Package Contents Overview

This document explains where each file should be placed in your Next.js project and what dependencies they have.

---

## 📁 File Mapping

### Frontend Components

```
ADMIN_PANEL_PACKAGE/
│
├── admin-products-page.jsx
│   → YOUR_PROJECT/src/app/admin/products/page.jsx
│   Dependencies:
│   - @/styles/Admin.module.css
│   - @/utils/categoryHelper
│   - @/components/admin/TemplateImportModal
│
├── TemplateImportModal.jsx
│   → YOUR_PROJECT/src/components/admin/TemplateImportModal.jsx
│   Dependencies:
│   - @/utils/template-helpers
│
├── Admin.module.css
│   → YOUR_PROJECT/src/styles/Admin.module.css
│   Dependencies: None
│
├── categoryHelper.js
│   → YOUR_PROJECT/src/utils/categoryHelper.js
│   Dependencies: None
│
└── template-helpers.js
    → YOUR_PROJECT/src/utils/template-helpers.js
    Dependencies: None
```

### API Routes

```
ADMIN_PANEL_PACKAGE/api-routes/
│
├── products-route.js
│   → YOUR_PROJECT/src/app/api/products/route.js
│   Dependencies:
│   - @/lib/supabase (ProductDB, supabaseAdmin)
│   - @/auth (auth) - OPTIONAL, can remove
│
├── scrape-route.js
│   → YOUR_PROJECT/src/app/api/admin/scrape/route.js
│   Dependencies:
│   - @/lib/supabase (ProductDB)
│   - @/auth (auth) - OPTIONAL, can remove
│   - @/utils/categoryHelper (detectCategory)
│   - axios
│   - cheerio
│
├── scrape-bulk-route.js
│   → YOUR_PROJECT/src/app/api/admin/scrape/bulk/route.js
│   Dependencies:
│   - @/lib/supabase (ProductDB, supabaseAdmin)
│   - @/auth (auth) - OPTIONAL, can remove
│   - @/utils/categoryHelper (detectCategory)
│   - axios
│   - cheerio
│
├── scrape-template-route.js
│   → YOUR_PROJECT/src/app/api/admin/scrape/template/route.js
│   Dependencies:
│   - @/lib/supabase (ProductDB, supabaseAdmin)
│   - @/auth (auth) - OPTIONAL, can remove
│   - @/utils/categoryHelper (detectCategory)
│   - axios
│   - cheerio
│
├── scrape-sheets-route.js
│   → YOUR_PROJECT/src/app/api/admin/scrape/sheets/route.js
│   Dependencies:
│   - axios
│
├── fix-categories-route.js
│   → YOUR_PROJECT/src/app/api/admin/fix-categories/route.js
│   Dependencies:
│   - @/lib/supabase (ProductDB, supabaseAdmin)
│   - @/auth (auth) - OPTIONAL, can remove
│   - @/utils/categoryHelper (detectCategory)
│
└── upload-route.js
    → YOUR_PROJECT/src/app/api/admin/upload/route.js
    Dependencies:
    - @/auth (auth) - OPTIONAL, can remove
    - fs (Node.js built-in)
    - path (Node.js built-in)
    - OR cloudinary (if using cloud storage)
```

---

## 🔧 Required Setup Files

These files are NOT included in the package - you need to create them or adapt to your existing setup:

### 1. Database Connection (`src/lib/supabase.js` or similar)

**For Supabase:**
```javascript
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export class ProductDB {
  static async getAll(filters = {}) {
    let query = supabaseAdmin.from('products').select('*');
    
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.batch) {
      query = query.eq('batch', filters.batch);
    }
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    if (filters.isPinned !== undefined) {
      query = query.eq('is_pinned', filters.isPinned);
    }
    
    query = query.order('pinned_order', { ascending: true });
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Convert snake_case to camelCase
    return data.map(row => ({
      ...row,
      isPinned: row.is_pinned,
      pinnedOrder: row.pinned_order,
      qcImages: row.qc_images || [],
    }));
  }
  
  static async create(product) {
    const dbProduct = {
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      batch: product.batch,
      link: product.link,
      is_pinned: product.isPinned || false,
      pinned_order: product.pinnedOrder || 999999,
      clicks: 0,
      qc_images: product.qcImages || [],
    };
    
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(dbProduct)
      .select()
      .single();
    
    if (error) throw error;
    return this.fromDB(data);
  }
  
  static async update(id, updates) {
    const dbUpdates = { ...updates };
    
    // Convert camelCase to snake_case if present
    if ('isPinned' in updates) {
      dbUpdates.is_pinned = updates.isPinned;
      delete dbUpdates.isPinned;
    }
    if ('pinnedOrder' in updates) {
      dbUpdates.pinned_order = updates.pinnedOrder;
      delete dbUpdates.pinnedOrder;
    }
    if ('qcImages' in updates) {
      dbUpdates.qc_images = updates.qcImages;
      delete dbUpdates.qcImages;
    }
    
    const { data, error } = await supabaseAdmin
      .from('products')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return this.fromDB(data);
  }
  
  static async delete(id) {
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
  
  static fromDB(row) {
    return {
      ...row,
      isPinned: row.is_pinned,
      pinnedOrder: row.pinned_order,
      qcImages: row.qc_images || [],
    };
  }
}
```

**For MongoDB:**
```javascript
import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db('your_database_name');
const products = db.collection('products');

export class ProductDB {
  static async getAll(filters = {}) {
    const query = {};
    
    if (filters.category) query.category = filters.category;
    if (filters.batch) query.batch = filters.batch;
    if (filters.search) query.name = { $regex: filters.search, $options: 'i' };
    if (filters.isPinned !== undefined) query.isPinned = filters.isPinned;
    
    return products
      .find(query)
      .sort({ pinnedOrder: 1 })
      .toArray();
  }
  
  static async create(product) {
    const result = await products.insertOne({
      ...product,
      isPinned: product.isPinned || false,
      pinnedOrder: product.pinnedOrder || 999999,
      clicks: 0,
      qcImages: product.qcImages || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return { ...product, _id: result.insertedId };
  }
  
  static async update(id, updates) {
    const result = await products.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    
    return result.value;
  }
  
  static async delete(id) {
    await products.deleteOne({ _id: new ObjectId(id) });
  }
}
```

### 2. Authentication (`src/auth.js` or similar) - OPTIONAL

If you want to protect admin routes:

```javascript
import { getServerSession } from 'next-auth';

export async function auth() {
  const session = await getServerSession();
  return session;
}
```

**OR** you can remove all `auth()` calls from the API routes if you don't need authentication.

### 3. Image Upload Setup

Choose one option:

**Option A: Local Storage (Simplest)**

No additional files needed. The `upload-route.js` uses Node.js `fs` and `path` modules.

**Option B: Cloudinary**

Install: `npm install cloudinary`

Update `upload-route.js` to use Cloudinary:
```javascript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
```

---

## 📦 NPM Packages Required

Install these packages in your project:

```bash
# For Supabase (if using)
npm install @supabase/supabase-js

# For MongoDB (if using)
npm install mongodb

# For scraping
npm install axios cheerio

# For image upload (optional)
npm install cloudinary

# Already included in Next.js
# - react
# - next
```

---

## 🔄 Import Path Patterns

The package uses these import path aliases:

- `@/styles/*` → `src/styles/*`
- `@/utils/*` → `src/utils/*`
- `@/components/*` → `src/components/*`
- `@/lib/*` → `src/lib/*`
- `@/auth` → `src/auth.js` or your auth file

If your project uses different path aliases, update `tsconfig.json` or `jsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 🗂️ Recommended Project Structure

After integration, your project should look like:

```
YOUR_PROJECT/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── products/
│   │   │       └── page.jsx          ← admin-products-page.jsx
│   │   └── api/
│   │       ├── products/
│   │       │   └── route.js           ← products-route.js
│   │       └── admin/
│   │           ├── scrape/
│   │           │   ├── route.js       ← scrape-route.js
│   │           │   ├── bulk/
│   │           │   │   └── route.js   ← scrape-bulk-route.js
│   │           │   ├── template/
│   │           │   │   └── route.js   ← scrape-template-route.js
│   │           │   └── sheets/
│   │           │       └── route.js   ← scrape-sheets-route.js
│   │           ├── fix-categories/
│   │           │   └── route.js       ← fix-categories-route.js
│   │           └── upload/
│   │               └── route.js       ← upload-route.js
│   │
│   ├── components/
│   │   └── admin/
│   │       └── TemplateImportModal.jsx
│   │
│   ├── utils/
│   │   ├── categoryHelper.js
│   │   └── template-helpers.js
│   │
│   ├── styles/
│   │   └── Admin.module.css
│   │
│   ├── lib/
│   │   └── supabase.js              ← YOU CREATE THIS
│   │
│   └── auth.js                       ← OPTIONAL, YOU CREATE THIS
│
├── public/
│   └── uploads/                      ← For local image storage
│
├── .env.local
├── package.json
└── next.config.js
```

---

## ✅ Integration Checklist

Use this checklist when integrating:

### Files Copied
- [ ] admin-products-page.jsx → src/app/admin/products/page.jsx
- [ ] TemplateImportModal.jsx → src/components/admin/TemplateImportModal.jsx
- [ ] Admin.module.css → src/styles/Admin.module.css
- [ ] categoryHelper.js → src/utils/categoryHelper.js
- [ ] template-helpers.js → src/utils/template-helpers.js
- [ ] products-route.js → src/app/api/products/route.js
- [ ] scrape-route.js → src/app/api/admin/scrape/route.js
- [ ] scrape-bulk-route.js → src/app/api/admin/scrape/bulk/route.js
- [ ] scrape-template-route.js → src/app/api/admin/scrape/template/route.js
- [ ] scrape-sheets-route.js → src/app/api/admin/scrape/sheets/route.js
- [ ] fix-categories-route.js → src/app/api/admin/fix-categories/route.js
- [ ] upload-route.js → src/app/api/admin/upload/route.js

### Setup Files Created
- [ ] Database connection file (supabase.js or similar)
- [ ] ProductDB class with CRUD methods
- [ ] Field name mapping (if using Supabase)
- [ ] Auth file (optional)
- [ ] Upload utility (if using Cloudinary)

### Configuration
- [ ] Environment variables added to .env.local
- [ ] Import paths updated in all files
- [ ] Path aliases configured in tsconfig.json/jsconfig.json
- [ ] Database schema created
- [ ] NPM packages installed

### Testing
- [ ] Dev server starts without errors
- [ ] Can access /admin/products page
- [ ] Database connection works
- [ ] Can add product manually
- [ ] Scraper works (if implemented)
- [ ] Can edit products
- [ ] Can delete products
- [ ] Template import works
- [ ] File upload works

---

## 🚨 Common Issues

### "Module not found" errors
- Check import paths match your project structure
- Verify path aliases in tsconfig.json/jsconfig.json
- Ensure all files are in correct locations

### "auth is not defined"
- Remove `auth()` calls from API routes if not using authentication
- Or implement your own auth function

### "ProductDB is not defined"
- Create the database connection file (src/lib/supabase.js or similar)
- Implement the ProductDB class with all required methods

### Database field name mismatches
- Supabase uses snake_case (is_pinned, pinned_order, qc_images)
- Frontend uses camelCase (isPinned, pinnedOrder, qcImages)
- Use the conversion functions shown above

### Scraper not working
- Implement your own scraper or use an existing one
- API routes expect a function that returns: { name, price, image, qcImages }

---

## 📚 File Dependencies Graph

```
admin-products-page.jsx
├── Admin.module.css
├── categoryHelper.js
└── TemplateImportModal.jsx
    └── template-helpers.js

products-route.js
├── lib/supabase.js (ProductDB)
└── auth.js (optional)

scrape-route.js
├── lib/supabase.js (ProductDB)
├── auth.js (optional)
├── categoryHelper.js
├── axios (npm)
└── cheerio (npm)

scrape-bulk-route.js
├── lib/supabase.js (ProductDB, supabaseAdmin)
├── auth.js (optional)
├── categoryHelper.js
├── axios (npm)
└── cheerio (npm)

scrape-template-route.js
├── lib/supabase.js (ProductDB, supabaseAdmin)
├── auth.js (optional)
├── categoryHelper.js
├── axios (npm)
└── cheerio (npm)

scrape-sheets-route.js
└── axios (npm)

fix-categories-route.js
├── lib/supabase.js (ProductDB, supabaseAdmin)
├── auth.js (optional)
└── categoryHelper.js

upload-route.js
├── auth.js (optional)
└── fs, path (Node.js built-in)
    OR cloudinary (npm)
```

---

**Use this document as a reference during integration to ensure all files and dependencies are properly set up.**
