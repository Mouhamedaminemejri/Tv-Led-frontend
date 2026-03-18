# TV Software & Firmware — Implementation Specification

> **Purpose**: Sell TV software (firmware updates, USB firmware, system recovery tools) based on **TV model** and **TV reference**, mirroring the LED section structure while adapting for digital products.

---

## Executive Summary

The TV Software & Firmware section will follow the same architectural patterns as the LED section: listing page with filters, product detail page, cart, and checkout. Key differentiators:

- **Discovery**: Model & reference are primary (search by TV model, reference, brand)
- **Delivery**: Digital download (link/instructions) instead of physical shipping
- **Filters**: Brand, compatible TV model/reference, firmware type (update/recovery/USB)
- **Post-purchase**: Instant access to download link in success page and account/orders

---

## 1. Frontend Requirements

### 1.1 Routes & Pages

| Route | File | Purpose |
|-------|------|---------|
| `/software` | `src/app/software/page.tsx` | Software listing with filters and pagination |
| `/software/[id]` | `src/app/software/[id]/page.tsx` | Software product detail |
| `/software/layout.tsx` | `src/app/software/layout.tsx` | Shared layout with sub-nav and sticky actions |

### 1.2 Layout & Components (Reuse + Adapt)

- **SoftwareSubNavbar** — Similar to `LedsSubNavbar`, with:
  - LED Backlights → `/leds`
  - **TV Software & Firmware** → `/software` (active when on `/software`)
  - Same tabs: Repair Services, TV Marketplace, TV Components

- **SoftwareSidebar** — Filters specific to software:
  - **Brand** (Samsung, LG, Sony, etc.) — from `brand` field
  - **TV Model** — partial text search; can show suggestions
  - **TV Reference** — partial text search
  - **Firmware Type** — enum: `update` | `usb` | `recovery`
  - **Availability** — in stock / all
  - **Search** — full-text on title, reference, models, brand

- **SoftwareListing** — Product grid (similar to LED listing):
  - Card: image, title, brand, reference, price, “Compatible with: …”
  - Sort: price-asc, price-desc, relevance

- **SoftwareProductDetail** — Similar to LED detail page:
  - Image, title, brand, reference
  - Compatible TV models (list)
  - Description, installation instructions
  - Add to cart / Buy now
  - **Sticky actions** (reuse `LedsStickyActionsProvider`)

- **Shared components** (already product-agnostic):
  - `AddToCartDialog`
  - `CartContext` / `CartService`
  - `CheckoutForm`

### 1.3 Search Autocomplete (Unified or Category-Specific)

**Option A — Unified search (recommended)**  
Extend main search bar to support `category=software`:

- `GET /api/products/search-suggestions?q=...&category=software`
- When user selects a software product → `/software/[id]`
- When user selects brand → `/software?brand=...`
- When user selects model/reference → `/software?model=...&reference=...`

**Option B — Separate software suggestions**  
- `GET /api/software/search-suggestions?q=...`
- Frontend switches endpoint based on current route or a toggle

### 1.4 URL & Filter State

| Query Param | Meaning | Example |
|-------------|---------|---------|
| `q` | Full-text search | `/software?q=UE43` |
| `brand` | Brand filter | `/software?brand=Samsung` |
| `model` | TV model filter | `/software?model=UE43AU7100` |
| `reference` | TV reference filter | `/software?reference=3LG50LS` |
| `type` | Firmware type | `/software?type=usb` |
| `page` | Pagination | `/software?page=2` |

### 1.5 Checkout Success — Digital Products

When order contains **software products**:

- Success page should show a **“Download”** section instead of “Delivery” step
- Each software item: **Download** button with link
- Link can be:
  - Direct file URL (signed, time-limited)
  - Or link to `/account/orders/[id]` where download link is shown

### 1.6 Account / My Orders

- Order detail page should distinguish **physical** vs **digital** items
- For software items: show **Download** button with secure link
- Backend must provide `downloadUrl` (or equivalent) per order line for software products

---

## 2. Backend API Requirements

### 2.1 Software Product Endpoints

| Method | Endpoint | Purpose |
|-------|----------|---------|
| GET | `/api/software/filter-data` | Lightweight data for facet counts |
| GET | `/api/software` | Paginated listing with filters |
| GET | `/api/software/:id` | Single software product |
| GET | `/api/software/search-suggestions?q=&limit=` | Autocomplete for model, reference, brand |

**OR** (alternative: single product table with `category`):

- Reuse `GET /api/products` with `category=software`
- Add software-specific filter params: `model`, `reference`, `type`
- Filter data endpoint returns software products when `category=software`

### 2.2 Filter Data Response

```
GET /api/software/filter-data
```

Returns array of lightweight records:

```json
[
  {
    "id": "uuid",
    "brand": "Samsung",
    "price": 25,
    "stock": 999,
    "tags": ["USB", "Recovery"],
    "firmwareType": "usb",
    "compatibleModels": ["UE43AU7100", "UE43TU7100"]
  }
]
```

### 2.3 Paginated Listing

```
GET /api/software?page=1&limit=10&brands=Samsung,LG&models=UE43&reference=&type=usb&inStock=true&search=recovery
```

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (1-indexed) |
| `limit` | number | Items per page |
| `brands` | string | Comma-separated brands |
| `models` | string | Partial match on compatible models |
| `reference` | string | Partial match on TV reference |
| `type` | string | `update` \| `usb` \| `recovery` |
| `inStock` | boolean | Filter by stock > 0 |
| `search` | string | Full-text on title, reference, models, brand |

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Samsung UE43AU7100 USB Firmware",
      "brand": "Samsung",
      "reference": "UE43AU7100",
      "price": 25,
      "salePrice": null,
      "stock": 999,
      "images": ["..."],
      "tags": ["USB", "Official"],
      "firmwareType": "usb",
      "compatibleModels": ["UE43AU7100", "UE43AU7090"],
      "fileSize": "450 MB",
      "version": "1304.0"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 120,
    "totalPages": 12,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 2.4 Search Suggestions

```
GET /api/software/search-suggestions?q=UE43&limit=5
```

Response:

```json
{
  "brands": ["Samsung"],
  "references": ["UE43AU7100", "UE43TU7100"],
  "models": ["UE43AU7100", "UE43AU7090"],
  "products": [
    {
      "id": "uuid",
      "title": "Samsung UE43AU7100 USB Firmware",
      "reference": "UE43AU7100",
      "brand": "Samsung",
      "price": 25,
      "salePrice": null,
      "stock": 999,
      "image": "...",
      "matchedBy": ["model", "reference"]
    }
  ]
}
```

### 2.5 Cart & Checkout

- **Cart**: Reuse existing `POST /api/cart` with `productId` — backend treats software products like any product.
- **Checkout**: Reuse `POST /api/checkout/initiate-payment`.
- **Order response**: Include `isDigital: true` and `downloadUrl` (when ready) per line item for software products.

### 2.6 Download Link Generation

After payment confirmation:

- `GET /api/orders/:orderId` or `GET /api/orders/:orderId/items`  
- For each software line item: include `downloadUrl` (signed URL, e.g. S3 presigned, valid 24–48h)
- Or dedicated: `GET /api/orders/:orderId/download/:lineItemId` → redirects to signed download URL

---

## 3. Database Schema

### 3.1 Option A — Separate `software_products` Table

```sql
CREATE TABLE software_products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             VARCHAR(500) NOT NULL,
  brand             VARCHAR(100) NOT NULL,
  reference         VARCHAR(100) NOT NULL,        -- e.g. UE43AU7100
  summary           TEXT,
  description       TEXT,
  price             DECIMAL(10,2) NOT NULL,
  sale_price        DECIMAL(10,2),
  stock             INT DEFAULT 999,              -- Digital: can be unlimited
  images            JSONB DEFAULT '[]',           -- or text[] for URLs
  tags              TEXT[] DEFAULT '{}',
  firmware_type     VARCHAR(20) NOT NULL,         -- 'update' | 'usb' | 'recovery'
  compatible_models TEXT[] NOT NULL DEFAULT '{}', -- e.g. ['UE43AU7100','UE43AU7090']
  file_size         VARCHAR(50),                  -- e.g. "450 MB"
  version           VARCHAR(50),                 -- e.g. "1304.0"
  download_path     VARCHAR(500),                 -- Storage path or S3 key
  config            JSONB,                       -- Hide, discount, etc.
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_software_brand ON software_products(brand);
CREATE INDEX idx_software_reference ON software_products(reference);
CREATE INDEX idx_software_firmware_type ON software_products(firmware_type);
CREATE INDEX idx_software_compatible_models ON software_products USING GIN(compatible_models);
CREATE INDEX idx_software_search ON software_products 
  USING GIN(to_tsvector('simple', title || ' ' || reference || ' ' || array_to_string(compatible_models, ' ')));
```

### 3.2 Chassis-Pack Schema (Software Products)

Additional fields for chassis software packs:

| Field | Type | Purpose |
|-------|------|---------|
| `chassis` | String | Chassis code (e.g. 12AT011_V1.0_A, 35014642) |
| `chipset` | String | PCB/chipset (e.g. MST739, MSD286) |
| `volume` | String | Volume identifier ("1", "2") |
| `downloadUrl` | Text | External link (e.g. WeTransfer) when no downloadPath |
| `isBundle` | Boolean | Multi-chassis package |
| `bundleChassisCount` | Int | Chassis count in bundle (e.g. 1001) |
| `includesPhysicalDelivery` | Boolean | 64GB USB3 stick included |
| `includesYearlyUpdates` | Boolean | Free update link at end of year |
| `sources` | String[] | Origin (e.g. Russians, Poles, Kazmi) |
| `firmwareType` | Enum | Add value `CHASSIS_PACK` for chassis packs |

### 3.3 Option B — Single `products` Table with `category`

Extend existing `products` table:

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'led';
-- Values: 'led' | 'software'

ALTER TABLE products ADD COLUMN IF NOT EXISTS firmware_type VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS compatible_models TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS file_size VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS version VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS download_path VARCHAR(500);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_compatible_models ON products USING GIN(compatible_models);
```

- All software items: `category = 'software'`
- Cart/checkout/orders work with same `productId`; backend decides if product is digital and generates download URLs accordingly.

### 3.4 Order Line Items — Digital Flag

```sql
-- If using order_items or similar
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT FALSE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS download_url TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS download_expires_at TIMESTAMPTZ;
```

---

## 4. Software Engineering Best Practices

### 4.1 Architecture

- **Separation of concerns**: `SoftwareProductService` vs `ProductService` (or single service with `category` parameter).
- **Shared cart/checkout**: No duplication; cart and checkout stay product-agnostic.
- **API versioning**: Consider `/api/v1/software` for future-proofing.

### 4.2 Security

- **Download URLs**: Time-limited, signed (e.g. S3 presigned, 24–48h).
- **Access control**: Only purchaser can access download; verify `userId` matches order owner.
- **Rate limiting**: On search and download endpoints.
- **Input sanitization**: For `search`, `model`, `reference` to prevent injection.

### 4.3 Performance

- **Filter data**: Keep response small; avoid sending full product payloads.
- **Search**: Use full-text search (PostgreSQL `tsvector`) or Elasticsearch if scale demands.
- **Caching**: Cache filter-data and popular search suggestions (Redis or CDN).

### 4.4 UX (from e-commerce research)

- **Search-first**: Place search prominently; users often know model/reference.
- **Autocomplete**: Suggestions for model, reference, brand; avoid zero-result queries.
- **Compatibility clarity**: Clearly show “Compatible with: UE43AU7100, UE43AU7090”.
- **Typo tolerance**: Fuzzy or partial match for model/reference.
- **Modular specs**: Use enums for `firmware_type` to enable filtering and comparison.

### 4.5 Consistency with LED Section

- Same layout patterns (sidebar, grid, detail).
- Same cart and checkout flow.
- Same error handling and loading states.
- Reuse `LedsStickyActionsProvider` (or rename to `ProductStickyActionsProvider`) for both.

---

## 5. Implementation Order

| Phase | Task |
|------|------|
| 1 | Database: create `software_products` (or extend `products`) |
| 2 | Backend: `GET /api/software/filter-data`, `GET /api/software`, `GET /api/software/:id` |
| 3 | Backend: `GET /api/software/search-suggestions` |
| 4 | Frontend: `SoftwareProductService`, types (`SoftwareProduct`) |
| 5 | Frontend: `/software` layout, page, sidebar, listing |
| 6 | Frontend: `/software/[id]` detail page, sticky actions |
| 7 | Update homepage card: `href="/software"` instead of `#software` |
| 8 | Update `LedsSubNavbar`: software tab `href="/software"` |
| 9 | Extend main search: support software results and routing |
| 10 | Backend: download URL generation for software orders |
| 11 | Frontend: success page + account orders — show download for software items |

---

## 6. TypeScript Types (Frontend)

```typescript
// services/software-product-service.ts

export type FirmwareType = 'update' | 'usb' | 'recovery';

export interface SoftwareProduct {
  id: string;
  title: string;
  brand: string;
  reference: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  images?: string[];
  tags: string[];
  firmwareType: FirmwareType;
  compatibleModels: string[];
  fileSize?: string | null;
  version?: string | null;
  summary?: string | null;
  description?: string | null;
}

export interface SoftwareFilterData {
  id: string;
  brand: string;
  price: number;
  stock: number;
  tags: string[];
  firmwareType: FirmwareType;
  compatibleModels: string[];
}
```

---

## 7. Summary

| Area | Approach |
|------|----------|
| **Frontend** | Mirror LED: `/software`, `/software/[id]`, sidebar filters, listing grid, detail page, cart, checkout |
| **Backend** | New `/api/software/*` endpoints (or extend `/api/products` with `category=software`) |
| **Database** | New `software_products` table or extend `products` with `category`, `firmware_type`, `compatible_models`, `download_path` |
| **Cart/Checkout** | Reuse existing; no changes for adding software to cart |
| **Post-purchase** | Add download section in success page + account orders for digital items |
| **Search** | Model/reference-centric autocomplete; unified or category-scoped |
