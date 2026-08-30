# 🎛️ Complete Admin Panel Package

## 📦 What's Included

This package contains the complete admin products management panel with all features:

### ✨ Features:
- ➕ Add single products (manual + scraper)
- 📋 Template Import (paste/file/Google Sheets)
- 🔄 Bulk scraper (multiple Weidian URLs)
- ✏️ Edit products (inline name editing, full edit modal)
- 🗑️ Delete products (single + bulk)
- 📌 Pin/unpin products (with drag & drop reordering)
- 🏷️ Bulk category change
- 🎯 Bulk batch change
- 🔍 Search & filters (category, batch, pinned status)
- 📄 Pagination (50 per page)
- 📸 QC photos management (upload + scrape)
- 🖼️ Image lightbox
- 🔢 Product statistics
- ✅ Custom confirmations
- 🎨 Toast notifications

---

## 📁 Package Contents

```
ADMIN_PANEL_PACKAGE/
├── README.md (this file)
├── INTEGRATION_GUIDE.md (how to integrate)
├── PROMPT_FOR_AI.txt (copy/paste for AI)
│
├── FRONTEND/
│   ├── admin-products-page.jsx (main page component)
│   ├── TemplateImportModal.jsx (template import modal)
│   ├── Admin.module.css (styles)
│   ├── categoryHelper.js (category detection)
│   └── template-helpers.js (parsing utilities)
│
└── API_ROUTES/
    ├── products-route.js (GET /api/products)
    ├── scrape-route.js (POST /api/admin/scrape)
    ├── scrape-bulk-route.js (POST /api/admin/scrape/bulk)
    ├── scrape-template-route.js (POST /api/admin/scrape/template)
    ├── scrape-sheets-route.js (GET /api/admin/scrape/sheets)
    ├── fix-categories-route.js (POST /api/admin/fix-categories)
    └── upload-route.js (POST /api/admin/upload)
```

---

## 🚀 Quick Start

### For Your Friend:
1. Get this package folder
2. Open `PROMPT_FOR_AI.txt`
3. Copy the prompt
4. Send to AI on her site
5. AI will integrate everything

### For AI:
1. Read `INTEGRATION_GUIDE.md`
2. Copy files to correct locations
3. Adapt to project structure
4. Connect to database (Supabase/MongoDB/etc)
5. Test all features

---

## 🎯 Core Functions

### 1. Add Products
- **Manual**: Fill form, auto-detect category
- **Scraper**: Paste Weidian URL, auto-fetch data
- **QC Photos**: Upload or scrape from Weidian

### 2. Template Import
- **Paste Text**: Copy from Excel/Sheets (Tab-separated)
- **Upload File**: CSV/TXT files
- **Google Sheets**: Direct URL import
- **Modes**: Add/Refresh, Replace Pinned, Replace All

### 3. Bulk Scraper
- Paste multiple Weidian URLs
- Auto pin & order
- Replace modes available

### 4. Edit Products
- **Quick Edit**: Double-click name to edit inline
- **Full Edit**: Modal with all fields + QC photos
- **Bulk Edit**: Select multiple → change category/batch/pin

### 5. Product Management
- Drag & drop reorder (pinned products)
- Inline pin order editing
- Bulk delete with confirmation
- Search by name
- Filter by category/batch/pinned

### 6. QC Photos
- Upload images
- Scrape from Weidian
- Assign colorways
- Bulk colorway assignment
- Reorder photos

---

## 🔧 Database Schema

### Products Table:
```javascript
{
  _id: string,
  name: string,
  price: number,
  image: string,
  category: string, // shoes, hoodies, t-shirts, pants, shorts, jackets, longsleeve, sets, electronics, headwear, bags-backpacks, belts, accessories
  batch: string, // best, budget, random, popular
  link: string, // Weidian URL
  isPinned: boolean,
  pinnedOrder: number, // 1, 2, 3... or 999999 for unpinned
  clicks: number,
  qcImages: [
    {
      url: string,
      colorway: string,
      addedAt: Date
    }
  ]
}
```

---

## 📋 Categories

Auto-detected categories:
- `shoes` - Sneakers, boots, sandals
- `hoodies` - Hoodies, sweaters, crewnecks
- `t-shirts` - T-shirts, polos, jerseys
- `pants` - Jeans, joggers, trousers
- `shorts` - All types of shorts
- `jackets` - Jackets, coats, windbreakers
- `longsleeve` - Long sleeve shirts
- `sets` - Tracksuits, matching sets
- `electronics` - AirPods, speakers, gadgets
- `headwear` - Hats, caps, beanies
- `bags-backpacks` - Bags, backpacks, totes
- `belts` - All types of belts
- `accessories` - Watches, jewelry, socks, etc.

---

## 🎨 UI Features

### Toasts
Custom toast notifications for:
- Success messages
- Error messages
- Info messages

### Confirmations
Custom confirmation modals for:
- Delete actions
- Bulk operations
- Replace modes

### Lightbox
Click any image to view full size with dark overlay.

### Loading States
- Skeleton loaders
- Progress bars (for bulk operations)
- Spinner animations

---

## 🔗 API Endpoints

### Products API
- `GET /api/products` - List products (with pagination, search, filters)
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PATCH /api/products` - Bulk update or reorder

### Admin Scraper API
- `POST /api/admin/scrape` - Scrape single product
- `POST /api/admin/scrape/bulk` - Scrape multiple products
- `POST /api/admin/scrape/template` - Template import
- `GET /api/admin/scrape/sheets` - Google Sheets proxy

### Admin Utilities
- `POST /api/admin/fix-categories` - Auto-fix all categories
- `POST /api/admin/upload` - Upload QC images

---

## ⚙️ Configuration

### Environment Variables Needed:
```env
# Database (choose one)
MONGODB_URI=your_mongodb_uri
# OR
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# File Upload (optional)
CLOUDINARY_URL=your_cloudinary_url
# OR use local storage
```

### Admin Access:
The page is at `/admin-99x-hsd/products` (or your custom path).

---

## 🛠️ Customization

### Change Admin Path:
Rename folder from `admin-99x-hsd` to your desired path.

### Add More Categories:
Edit `categoryHelper.js`:
```javascript
export const PRODUCT_CATEGORIES = [
  'shoes',
  'hoodies',
  // ... add your categories
];
```

### Modify Batch Options:
In `admin-products-page.jsx`, search for batch options and add yours.

### Styling:
Edit `Admin.module.css` for custom colors/layout.

---

## 📊 Features Matrix

| Feature | Included | Configurable |
|---------|----------|--------------|
| Single Product Add | ✅ | ✅ |
| Template Import | ✅ | ✅ |
| Bulk Scraper | ✅ | ✅ |
| Edit Products | ✅ | ✅ |
| Delete Products | ✅ | ❌ |
| Pin/Unpin | ✅ | ❌ |
| Drag & Drop Reorder | ✅ | ❌ |
| Search | ✅ | ✅ |
| Filters | ✅ | ✅ |
| Pagination | ✅ | ✅ (limit per page) |
| QC Photos | ✅ | ✅ |
| Category Auto-detect | ✅ | ✅ (add patterns) |
| Bulk Operations | ✅ | ✅ |

---

## 🚨 Important Notes

### Database:
- The code uses Supabase by default
- Easy to adapt to MongoDB/PostgreSQL/etc
- Field names might need mapping (isPinned vs is_pinned)

### Weidian Scraper:
- You MUST have a working Weidian scraper
- Or integrate an existing one
- API routes call the scraper functions

### File Upload:
- QC photos need storage solution
- Can use Cloudinary, AWS S3, or local storage
- `upload-route.js` needs customization

### Authentication:
- No auth included in this package
- Add your own auth middleware
- Protect `/admin-*` routes

---

## 🎓 Learning Path

1. **Start with README.md** (this file) - Overview
2. **Read INTEGRATION_GUIDE.md** - Step-by-step integration
3. **Check PROMPT_FOR_AI.txt** - Quick AI prompt
4. **Explore code files** - Understand structure
5. **Test locally** - Before deploying

---

## 💡 Pro Tips

1. Test with 1-2 products first
2. Set up database schema correctly
3. Ensure Weidian scraper works
4. Configure file upload early
5. Add authentication before production
6. Backup database before bulk operations
7. Use "Add/Refresh" mode for safety
8. Monitor API rate limits for scraping

---

## 📞 Support

If something doesn't work:
1. Check console for errors
2. Verify database connection
3. Test API endpoints separately
4. Ensure scraper is working
5. Check file upload configuration

---

**Package Location:**
`C:\Users\Adam\Desktop\repfinder-main\ADMIN_PANEL_PACKAGE\`

**Ready to integrate! 🚀**
