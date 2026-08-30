# 🔧 Admin Panel Integration Guide

## Step-by-Step Integration Instructions

This guide will help you integrate the complete Admin Panel into your Next.js application.

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Next.js 13+ project (App Router)
- ✅ Database (Supabase/MongoDB/PostgreSQL)
- ✅ Node.js 18+ installed
- ✅ Basic understanding of React and Next.js

---

## 🚀 Integration Steps

### Step 1: Copy Files to Your Project

Copy files from this package to your project:

```
ADMIN_PANEL_PACKAGE/admin-products-page.jsx
  → YOUR_PROJECT/src/app/admin/products/page.jsx

ADMIN_PANEL_PACKAGE/Admin.module.css
  → YOUR_PROJECT/src/styles/Admin.module.css

ADMIN_PANEL_PACKAGE/TemplateImportModal.jsx
  → YOUR_PROJECT/src/components/admin/TemplateImportModal.jsx

ADMIN_PANEL_PACKAGE/categoryHelper.js
  → YOUR_PROJECT/src/utils/categoryHelper.js

ADMIN_PANEL_PACKAGE/template-helpers.js
  → YOUR_PROJECT/src/utils/template-helpers.js

ADMIN_PANEL_PACKAGE/api-routes/products-route.js
  → YOUR_PROJECT/src/app/api/products/route.js

ADMIN_PANEL_PACKAGE/api-routes/scrape-route.js
  → YOUR_PROJECT/src/app/api/admin/scrape/route.js

ADMIN_PANEL_PACKAGE/api-routes/scrape-bulk-route.js
  → YOUR_PROJECT/src/app/api/admin/scrape/bulk/route.js

ADMIN_PANEL_PACKAGE/api-routes/scrape-template-route.js
  → YOUR_PROJECT/src/app/api/admin/scrape/template/route.js

ADMIN_PANEL_PACKAGE/api-routes/scrape-sheets-route.js
  → YOUR_PROJECT/src/app/api/admin/scrape/sheets/route.js

ADMIN_PANEL_PACKAGE/api-routes/fix-categories-route.js
  → YOUR_PROJECT/src/app/api/admin/fix-categories/route.js

ADMIN_PANEL_PACKAGE/api-routes/upload-route.js
  → YOUR_PROJECT/src/app/api/admin/upload/route.js
```

---

### Step 2: Set Up Database Schema

#### Option A: Supabase (SQL)

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  image TEXT NOT NULL,
  category TEXT NOT NULL,
  batch TEXT NOT NULL,
  link TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  pinned_order INTEGER DEFAULT 999999,
  clicks INTEGER DEFAULT 0,
  qc_images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_batch ON products(batch);
CREATE INDEX idx_products_is_pinned ON products(is_pinned);
CREATE INDEX idx_products_pinned_order ON products(pinned_order);
```

#### Option B: MongoDB (Schema)

```javascript
{
  _id: ObjectId,
  name: String,
  price: Number,
  image: String,
  category: String,
  batch: String,
  link: String,
  isPinned: Boolean,
  pinnedOrder: Number,
  clicks: Number,
  qcImages: [
    {
      url: String,
      colorway: String,
      addedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.products.createIndex({ category: 1 });
db.products.createIndex({ batch: 1 });
db.products.createIndex({ isPinned: 1 });
db.products.createIndex({ pinnedOrder: 1 });
```

---

### Step 3: Configure Environment Variables

Add to your `.env.local`:

```env
# Database - Choose ONE
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
# OR
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_service_role_key

# File Upload - Optional
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

### Step 4: Adapt Database Connections

#### For Supabase:

In all API route files, ensure you have:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
```

**Field Name Mapping:**
- Frontend uses: `isPinned`, `pinnedOrder`, `qcImages`
- Supabase uses: `is_pinned`, `pinned_order`, `qc_images`

Create helper functions:

```javascript
// Convert from DB to Frontend
function fromDB(row) {
  return {
    ...row,
    isPinned: row.is_pinned,
    pinnedOrder: row.pinned_order,
    qcImages: row.qc_images || [],
  };
}

// Convert from Frontend to DB
function toDB(product) {
  return {
    ...product,
    is_pinned: product.isPinned,
    pinned_order: product.pinnedOrder,
    qc_images: product.qcImages || [],
  };
}
```

#### For MongoDB:

```javascript
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db('your_database_name');
const products = db.collection('products');
```

No field mapping needed - use camelCase directly.

---

### Step 5: Implement Weidian Scraper

The API routes expect a scraper function. Create `src/utils/weidianScraper.js`:

```javascript
export async function scrapeWeidianProduct(url) {
  try {
    // Your scraper implementation
    // Can use Puppeteer, Playwright, or API service
    
    const response = await fetch(url);
    const html = await response.text();
    
    // Parse HTML and extract:
    return {
      name: extractedName,
      price: extractedPrice,
      image: extractedImage,
      qcImages: extractedQcImages // array of URLs
    };
  } catch (error) {
    throw new Error('Failed to scrape product');
  }
}
```

Then import in API routes:

```javascript
import { scrapeWeidianProduct } from '@/utils/weidianScraper';
```

---

### Step 6: Set Up File Upload

#### Option A: Cloudinary

```javascript
// src/utils/uploadImage.js
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(file) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'qc-photos' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    ).end(buffer);
  });
}
```

#### Option B: Local Storage

```javascript
// src/utils/uploadImage.js
import fs from 'fs/promises';
import path from 'path';

export async function uploadImage(file) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${file.name}`;
  const filepath = path.join(process.cwd(), 'public', 'uploads', filename);
  
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  await fs.writeFile(filepath, buffer);
  
  return `/uploads/${filename}`;
}
```

Update `api-routes/upload-route.js` to use your upload function.

---

### Step 7: Fix Import Paths

In `admin-products-page.jsx`, update imports to match your project structure:

```javascript
// Change from:
import styles from '@/styles/Admin.module.css';
import { detectCategory } from '@/utils/categoryHelper';
import TemplateImportModal from '@/components/admin/TemplateImportModal';

// To your actual paths:
import styles from '../../../styles/Admin.module.css'; // if different
import { detectCategory } from '../../../utils/categoryHelper';
import TemplateImportModal from '../../../components/admin/TemplateImportModal';
```

---

### Step 8: Add Authentication (Recommended)

Protect admin routes with middleware:

```javascript
// src/middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  // Check if user is admin
  const isAdmin = checkAdminAuth(request); // your auth logic
  
  if (!isAdmin && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
```

---

### Step 9: Install Dependencies

```bash
npm install @supabase/supabase-js
# OR
npm install mongodb

# For file upload (optional)
npm install cloudinary

# If scraper uses these
npm install cheerio axios
```

---

### Step 10: Test the Integration

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Visit admin page:**
   ```
   http://localhost:3000/admin/products
   ```

3. **Test features in order:**
   - ✅ View empty product list
   - ✅ Add single product (manual)
   - ✅ Add product via Weidian URL
   - ✅ Edit product name (double-click)
   - ✅ Edit product (full modal)
   - ✅ Delete product
   - ✅ Pin/unpin product
   - ✅ Template import (paste text)
   - ✅ Template import (upload CSV)
   - ✅ Bulk scraper
   - ✅ Search products
   - ✅ Filter by category
   - ✅ Pagination
   - ✅ Upload QC photos
   - ✅ Bulk operations

---

## 🔧 Customization

### Change Categories

Edit `categoryHelper.js`:

```javascript
export const PRODUCT_CATEGORIES = [
  'shoes',
  'hoodies',
  'your-new-category', // add here
  // ...
];

// Add detection patterns
export const CATEGORY_MAP = {
  'your-new-category': ['keyword1', 'keyword2'],
  // ...
};
```

### Change Admin Path

Rename the page folder:
```
src/app/admin/products/page.jsx
  → src/app/your-custom-path/page.jsx
```

Update links in your navigation.

### Modify Batch Options

In `admin-products-page.jsx`, find:

```javascript
const batchOptions = ['best', 'budget', 'random', 'popular'];
```

Change to your options:

```javascript
const batchOptions = ['premium', 'standard', 'economy', 'featured'];
```

### Adjust Pagination

In `admin-products-page.jsx`, find:

```javascript
const itemsPerPage = 50;
```

Change to your preferred number.

---

## 🐛 Troubleshooting

### Database Connection Issues

**Error:** `Connection timeout` or `Unable to connect`

**Solution:**
1. Check environment variables
2. Verify database URL
3. Check firewall/network rules
4. Test connection with a simple script

### Scraper Not Working

**Error:** `Failed to scrape product`

**Solution:**
1. Test scraper function separately
2. Check if Weidian URL is valid
3. Add error logging to scraper
4. Consider rate limiting

### File Upload Fails

**Error:** `Failed to upload image`

**Solution:**
1. Check upload service credentials
2. Verify folder permissions (local storage)
3. Check file size limits
4. Ensure buffer conversion is correct

### Products Not Showing

**Error:** Empty list or loading forever

**Solution:**
1. Check browser console for errors
2. Verify API route `/api/products` returns data
3. Check database has products
4. Verify field name mapping (camelCase vs snake_case)

### Import Paths Not Found

**Error:** `Module not found` or `Cannot find module`

**Solution:**
1. Check if files exist at specified paths
2. Update import paths in all files
3. Verify `tsconfig.json` or `jsconfig.json` path aliases
4. Restart dev server

---

## 📚 Additional Resources

### API Endpoints Documentation

All endpoints are documented in comments within each route file.

### Component Props

`TemplateImportModal.jsx` accepts:
```javascript
<TemplateImportModal 
  isOpen={boolean}
  onClose={() => void}
  onImportComplete={() => void}
/>
```

### Helper Functions

`categoryHelper.js`:
- `detectCategory(productName)` - Auto-detect category from name
- `PRODUCT_CATEGORIES` - Array of all categories
- `CATEGORY_MAP` - Keyword mapping for detection

`template-helpers.js`:
- `parseTabSeparated(text)` - Parse pasted text
- `parseCSV(text)` - Parse CSV content
- `parseSheetsData(data)` - Parse Google Sheets JSON

---

## ✅ Post-Integration Checklist

- [ ] All files copied to correct locations
- [ ] Database schema created
- [ ] Environment variables configured
- [ ] Database connection working
- [ ] Weidian scraper implemented
- [ ] File upload configured
- [ ] Import paths updated
- [ ] Dependencies installed
- [ ] Dev server starts without errors
- [ ] Can view admin page
- [ ] Can add product manually
- [ ] Can scrape product from URL
- [ ] Can edit/delete products
- [ ] Can pin/unpin products
- [ ] Template import works
- [ ] Bulk scraper works
- [ ] Search and filters work
- [ ] QC photos upload works
- [ ] Authentication added (if needed)
- [ ] Tested all features
- [ ] Ready for production

---

## 🚀 Going to Production

Before deploying:

1. **Enable authentication** - Protect admin routes
2. **Add rate limiting** - Prevent scraper abuse
3. **Set up error monitoring** - Track issues (Sentry, LogRocket)
4. **Configure CORS** - If API used from different domain
5. **Optimize images** - Use Next.js Image component
6. **Add logging** - Track admin actions
7. **Backup database** - Before any bulk operations
8. **Test on staging** - Full workflow testing
9. **Set up CI/CD** - Automated deployments
10. **Monitor performance** - Database queries, API response times

---

## 💡 Best Practices

1. **Always test with small datasets first**
2. **Use "Add/Refresh" mode for template imports** (safest)
3. **Backup before bulk delete operations**
4. **Monitor API rate limits** when scraping
5. **Validate product data** before saving to database
6. **Use transactions** for bulk operations (if supported)
7. **Add admin action logging** for audit trails
8. **Implement role-based access** if multiple admins
9. **Cache category detection results** for performance
10. **Set up alerts** for failed scrapes or errors

---

## 📞 Need Help?

If you encounter issues:

1. Check browser console for errors
2. Check server logs
3. Review this guide again
4. Test API endpoints with Postman
5. Verify database schema matches
6. Check import paths are correct
7. Ensure all dependencies are installed
8. Review error messages carefully

---

**Integration complete! Your admin panel is ready to use. 🎉**
