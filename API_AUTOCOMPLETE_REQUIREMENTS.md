# Search Autocomplete API Requirements

## Endpoint: `GET /api/products/search-suggestions`

### Purpose
Provides autocomplete suggestions for the search functionality, returning matching brands, references, and product titles based on a partial query.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query (minimum 2 characters recommended) |
| `limit` | number | No | Maximum number of suggestions per category (default: 10) |

### Response Format

```json
{
  "brands": ["Samsung", "LG", "Sony"],
  "references": ["UE43AU7100", "3LG50LS", "KDL-43WF663"],
  "titles": [
    "LED strip set Samsung 43 inch - 4 strips...",
    "LED strip set LG 50 inch - 6 strips...",
    "LED strip set Sony 55 inch - 8 strips..."
  ]
}
```

### Response Fields

- **brands** (string[]): Array of unique brand names that match the query
- **references** (string[]): Array of product reference codes that match the query
- **titles** (string[]): Array of product titles that match the query (should be truncated to ~60 characters for display)

### Search Logic

1. **Brand Matching**: 
   - Case-insensitive partial match on `brand` field
   - Example: `q=sam` matches "Samsung"

2. **Reference Matching**:
   - Case-insensitive partial match on `reference` field
   - Example: `q=UE43` matches "UE43AU7100", "UE43TU7100", etc.

3. **Title Matching**:
   - Case-insensitive partial match on `title` field
   - Should return most relevant matches first
   - Titles should be truncated to ~60 characters with "..." if longer

### Sorting and Limits

- **Brands**: Return unique brands, sorted alphabetically
- **References**: Return unique references, sorted alphabetically
- **Titles**: Return most relevant matches first (by relevance or alphabetical), limit to 3-5 items

### Performance Considerations

- **Debouncing**: Frontend will debounce requests (300ms delay)
- **Minimum Query Length**: Frontend will only send requests for queries with 2+ characters
- **Caching**: Consider implementing caching for common queries
- **Limit**: Default limit of 10 per category, adjustable via `limit` parameter

### Error Handling

- Return empty arrays if no matches found: `{ brands: [], references: [], titles: [] }`
- Return 400 Bad Request if query is too short (< 1 character)
- Return 500 Internal Server Error for server errors

### Example Requests

```bash
# Basic search
curl "http://localhost:3001/api/products/search-suggestions?q=samsung"

# With limit
curl "http://localhost:3001/api/products/search-suggestions?q=UE43&limit=5"

# Search for reference
curl "http://localhost:3001/api/products/search-suggestions?q=3LG"

# Search for partial title
curl "http://localhost:3001/api/products/search-suggestions?q=LED%20strip"
```

### Example Responses

**Request:** `GET /api/products/search-suggestions?q=sam`

**Response:**
```json
{
  "brands": ["Samsung"],
  "references": [],
  "titles": [
    "LED strip set Samsung 43 inch - 4 strips x 9 LEDs...",
    "LED strip set Samsung 50 inch - 6 strips x 12 LEDs...",
    "LED strip set Samsung 55 inch - 8 strips x 15 LEDs..."
  ]
}
```

**Request:** `GET /api/products/search-suggestions?q=UE43`

**Response:**
```json
{
  "brands": [],
  "references": ["UE43AU7100", "UE43TU7100", "UE43NU7100"],
  "titles": [
    "LED strip set Samsung 43 inch - UE43AU7100...",
    "LED strip set Samsung 43 inch - UE43TU7100..."
  ]
}
```

### Implementation Notes

1. **Database Query Optimization**:
   - Use indexed fields for faster searches
   - Consider using full-text search if available
   - Limit results early in the query

2. **Response Size**:
   - Keep response small (< 10KB)
   - Truncate long titles
   - Limit total suggestions to reasonable number

3. **Security**:
   - Sanitize input to prevent injection attacks
   - Limit query length (e.g., max 100 characters)
   - Rate limiting recommended for production

---

## Frontend Integration

The frontend will:
1. Debounce user input (300ms delay)
2. Only send requests for queries with 2+ characters
3. Display suggestions in a dropdown below the search input
4. Support keyboard navigation (arrow keys, enter, escape)
5. Allow clicking suggestions to select them
6. Show loading state while fetching suggestions
