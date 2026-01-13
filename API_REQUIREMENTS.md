# API Requirements for LED Products Filtering & Pagination

## Overview
The frontend needs two main API endpoints to support filtering and pagination:
1. **Filter Data Endpoint** - Get lightweight data for all products to calculate accurate facet counts
2. **Filtered Pagination Endpoint** - Get paginated products with server-side filtering

---

## 1. Filter Data Endpoint

### Endpoint
```
GET /api/products/filter-data
```

### Purpose
Returns lightweight product data (no images, descriptions) for ALL products. Used to calculate accurate facet counts (manufacturers, sizes, etc.) across the entire catalog.

### Response Format
```json
[
  {
    "id": "string",
    "brand": "string",
    "size": number | null,
    "price": number,
    "stock": number,
    "tags": string[]
  },
  ...
]
```

### Example Response
```json
[
  {
    "id": "c0e83920-1a7f-42e5-9318-e8fd3109c6a4",
    "brand": "Altele",
    "size": 75,
    "price": 100,
    "stock": 10,
    "tags": ["Best Seller"]
  },
  {
    "id": "141cce55-09c8-4701-b382-e26370ab9345",
    "brand": "Samsung",
    "size": 50,
    "price": 150,
    "stock": 5,
    "tags": ["Technician Choice"]
  }
]
```

### Notes
- Should return ALL products (no pagination)
- Exclude: `title`, `reference`, `description`, `images`, `rating`, `summary`
- Include only: `id`, `brand`, `size`, `price`, `stock`, `tags`
- This endpoint is called once on page load

---

## 2. Filtered Pagination Endpoint

### Endpoint
```
GET /api/products
```

### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number (1-indexed) | `1` |
| `limit` | number | Items per page (max 100) | `10` |
| `brands` | string | Comma-separated brand names | `LG,Samsung` |
| `sizes` | string | Comma-separated sizes (as strings) | `32,43,55` |
| `minPrice` | number | Minimum price filter | `50` |
| `maxPrice` | number | Maximum price filter | `200` |
| `inStock` | boolean | Filter by stock availability | `true` |
| `search` | string | Search in title/reference | `LED strip` |

### Example Requests

**Basic pagination:**
```
GET /api/products?page=1&limit=10
```

**With brand filter:**
```
GET /api/products?page=1&limit=10&brands=Samsung,LG
```

**With multiple filters:**
```
GET /api/products?page=1&limit=10&brands=Samsung&sizes=32,43&minPrice=50&maxPrice=200&inStock=true
```

**With search:**
```
GET /api/products?page=1&limit=10&search=LED%20strip
```

### Response Format
```json
{
  "data": [
    {
      "id": "string",
      "title": "string",
      "brand": "string",
      "reference": "string",
      "size": number | null,
      "price": number,
      "stock": number,
      "rating": number,
      "images": string[],
      "tags": string[]
    },
    ...
  ],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number,
    "hasNext": boolean,
    "hasPrev": boolean
  }
}
```

### Example Response
```json
{
  "data": [
    {
      "id": "c0e83920-1a7f-42e5-9318-e8fd3109c6a4",
      "title": "LED strip set alte marci / TCL 75 inch",
      "brand": "Altele",
      "reference": "3AL75LU",
      "size": 75,
      "price": 100,
      "stock": 10,
      "rating": 4,
      "images": ["http://localhost:3001/uploads/..."],
      "tags": ["Best Seller"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 510,
    "totalPages": 51,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Filter Logic

1. **Brands Filter (`brands`)**
   - Comma-separated list: `LG,Samsung`
   - Match products where `brand` is in the list
   - Case-insensitive matching recommended

2. **Sizes Filter (`sizes`)**
   - Comma-separated list: `32,43,55`
   - Match products where `size` (as string) is in the list
   - Handle `null` sizes (treat as "Universal" or "0")

3. **Price Range (`minPrice`, `maxPrice`)**
   - `minPrice`: Products with `price >= minPrice`
   - `maxPrice`: Products with `price <= maxPrice`
   - Both can be used together

4. **Stock Filter (`inStock`)**
   - `inStock=true`: Only products with `stock > 0`
   - `inStock=false`: Only products with `stock === 0`
   - If not provided, show all products

5. **Search (`search`)**
   - Search in `title` and `reference` fields
   - Case-insensitive partial matching
   - Example: `search=LED` matches "LED strip set..."

### Important Notes

- **Filter Combination**: All filters should be combined with AND logic
  - Example: `brands=Samsung&sizes=32` = Samsung AND size 32

- **Pagination**: Pagination should happen AFTER filtering
  - Total count should reflect filtered results
  - Example: If 510 total products, but 50 match filters, `total` should be 50

- **Empty Results**: If no products match filters, return:
  ```json
  {
    "data": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 0,
      "totalPages": 0,
      "hasNext": false,
      "hasPrev": false
    }
  }
  ```

---

## Current Implementation Status

✅ **Already Working:**
- Basic pagination endpoint: `GET /api/products?page=1&limit=10`
- Response format: `{ data: [...], pagination: {...} }`

❌ **Needs Implementation:**
- Filter data endpoint: `GET /api/products/filter-data`
- Filter query parameters on pagination endpoint

---

## Testing Examples

### Test Filter Data Endpoint
```bash
curl http://localhost:3001/api/products/filter-data
```

### Test Filtered Pagination
```bash
# Basic pagination
curl "http://localhost:3001/api/products?page=1&limit=10"

# With brand filter
curl "http://localhost:3001/api/products?page=1&limit=10&brands=Samsung"

# With multiple filters
curl "http://localhost:3001/api/products?page=1&limit=10&brands=Samsung,LG&sizes=32,43&minPrice=50&maxPrice=200"
```

---

## Frontend Integration Plan

1. **On Page Load:**
   - Call `/api/products/filter-data` → Calculate facets (manufacturers, sizes, etc.)
   - Call `/api/products?page=1&limit=10` → Load first page of products

2. **When User Applies Filters:**
   - Call `/api/products?page=1&limit=10&brands=...&sizes=...` → Get filtered products
   - Recalculate facets from filter-data (excluding current filter category)

3. **When User Changes Page:**
   - Call `/api/products?page=2&limit=10&brands=...&sizes=...` → Get next page with same filters

This approach ensures:
- ✅ Accurate facet counts from ALL products
- ✅ Server-side filtering for better performance
- ✅ Pagination works with filters
- ✅ Fast initial page load
