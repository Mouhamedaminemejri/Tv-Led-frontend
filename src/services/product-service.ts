export interface ProductDeliveryMethod {
    name?: string | null;
    detail?: string | null;
    price?: string | number | null;
}

export interface ProductDisplayConfig {
    Hide?: boolean | null;
    hide?: boolean | null;
    discount?: number | null;
    discountedPrice?: number | null;
    estimatedDeliveryGapHours?: number | null;
    deliveryMethods?: Array<string | ProductDeliveryMethod> | null;
}

// Define the Product Interface shared across the app
export interface LedProduct {
    id: string;
    title: string;
    brand: string;
    reference: string;
    size: number | null;
    tvSizeInch?: number | null;
    price: number;
    salePrice?: number | null;
    purchasePrice?: number | null;
    stock: number;
    rating: number;
    images?: string[]; // Changed from 'image' to 'images' array
    tags: string[];

    // Extra fields (optional) — available in DB/backend
    number?: string | null; // e.g. stock number / SKU
    suk?: string | null; // SKU (field name in DB)
    tvFullName?: string | null;
    summary?: string | null;
    description?: string | null;
    supplier?: string | null;
    models?: string | null; // compatible TV models (often long text)

    // Technical fields seen in DB screenshot
    ledCount?: string | null;
    length?: string | null;
    stripCount?: string | null;
    voltage?: number | null;
    tvBacklightType?: string | null;
    tvPanelType?: string | null;

    // Optional commerce / UX fields (if backend provides them later)
    warrantyMonths?: number | null;
    reviewCount?: number | null;
    expectedDeliveryDate?: string | null; // ISO date string
    quantityDiscounts?: Array<{
        minQty: number;
        maxQty?: number | null;
        price: number;
    }> | null;
    config?: ProductDisplayConfig | string | null;
}

// Pagination response interface
export interface PaginatedProductsResponse {
    products: LedProduct[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

// Filter data interface (lightweight, no images/descriptions)
export interface FilterDataProduct {
    id: string;
    brand: string;
    size: number | null;
    price: number;
    stock: number;
    tags: string[];
}

export interface SearchSuggestionProduct {
    id: string;
    title: string;
    reference: string;
    brand: string;
    price: number | string;
    salePrice?: number | string | null;
    stock: number | string;
    tvSizeInch?: number | string | null;
    image?: string | null;
    matchedBy?: string[] | null;
}

export interface SearchSuggestionsResponse {
    brands: string[];
    references: string[];
    titles: string[];
    models: string[];
    tvPanelTypes: string[];
    suks: string[];
    products?: SearchSuggestionProduct[];
}

const API_BASE_URL = "http://localhost:3001/api";

const toFiniteNumberOr = (value: unknown, fallback: number): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

function normalizeProduct(product: LedProduct): LedProduct {
    return {
        ...product,
        size: product.size == null ? null : toFiniteNumberOr(product.size, 0),
        tvSizeInch: product.tvSizeInch == null ? null : toFiniteNumberOr(product.tvSizeInch, 0),
        price: toFiniteNumberOr(product.price, 0),
        salePrice: product.salePrice == null ? null : toFiniteNumberOr(product.salePrice, 0),
        purchasePrice: product.purchasePrice == null ? null : toFiniteNumberOr(product.purchasePrice, 0),
        stock: toFiniteNumberOr(product.stock, 0),
        rating: toFiniteNumberOr(product.rating, 0),
        reviewCount: product.reviewCount == null ? null : toFiniteNumberOr(product.reviewCount, 0),
        warrantyMonths: product.warrantyMonths == null ? null : toFiniteNumberOr(product.warrantyMonths, 0),
        voltage: product.voltage == null ? null : toFiniteNumberOr(product.voltage, 0),
        quantityDiscounts: Array.isArray(product.quantityDiscounts)
            ? product.quantityDiscounts.map((tier) => ({
                minQty: toFiniteNumberOr(tier.minQty, 0),
                maxQty: tier.maxQty == null ? null : toFiniteNumberOr(tier.maxQty, 0),
                price: toFiniteNumberOr(tier.price, 0),
            }))
            : product.quantityDiscounts ?? null,
    };
}

export class ProductService {
    static async getAllProducts(): Promise<LedProduct[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/products`);

            if (!response.ok) {
                // Determine if it's a 404, 500, etc.
                throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Handle both array and paginated response formats
            if (Array.isArray(data)) {
                // Legacy format: direct array
                return (data as LedProduct[]).map(normalizeProduct);
            } else if (data && typeof data === 'object') {
                // Paginated format: check for both 'data' and 'products' properties
                if (Array.isArray(data.data)) {
                    // Format: { data: [...], pagination: {...} }
                    return (data.data as LedProduct[]).map(normalizeProduct);
                } else if (Array.isArray(data.products)) {
                    // Format: { products: [...], pagination: {...} }
                    return (data.products as LedProduct[]).map(normalizeProduct);
                }
            }
            
            // If we get here, the format is unexpected
            console.error("Unexpected API response format. Expected array or object with 'data'/'products' property:", data);
            return [];
        } catch (error) {
            console.error("ProductService.getAllProducts error:", error);
            // Re-throw to let the component handle the UI state
            throw error;
        }
    }

    static async getProductById(id: string): Promise<LedProduct> {
        try {
            // Try the individual product endpoint first
            try {
                const response = await fetch(`${API_BASE_URL}/products/${id}`);

                if (response.ok) {
                    const data = await response.json();
                    return normalizeProduct(data as LedProduct);
                }
            } catch (fetchError) {
                // If fetch fails, continue to fallback
                console.warn(`Product endpoint /products/${id} failed, falling back to fetching all products`);
            }

            // If individual endpoint fails (404 or network error), fall back to fetching all products
            // and finding the matching one
            console.warn(`Product endpoint /products/${id} not found, falling back to fetching all products`);
            const allProducts = await this.getAllProducts();
            const product = allProducts.find(p => p.id === id);

            if (!product) {
                throw new Error(`Product with id ${id} not found`);
            }

            return normalizeProduct(product);
        } catch (error) {
            console.error(`ProductService.getProductById(${id}) error:`, error);
            throw error;
        }
    }

    // Get paginated products with optional filters
    static async getPaginatedProducts(
        page: number = 1, 
        limit: number = 10,
        filters?: {
            brands?: string[];
            sizes?: string[];
            minPrice?: number;
            maxPrice?: number;
            inStock?: boolean;
            search?: string;
        }
    ): Promise<PaginatedProductsResponse> {
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', limit.toString());
            
            // Add filter parameters
            if (filters?.brands && filters.brands.length > 0) {
                params.append('brands', filters.brands.join(','));
            }
            if (filters?.sizes && filters.sizes.length > 0) {
                params.append('sizes', filters.sizes.join(','));
            }
            if (filters?.minPrice !== undefined) {
                params.append('minPrice', filters.minPrice.toString());
            }
            if (filters?.maxPrice !== undefined) {
                params.append('maxPrice', filters.maxPrice.toString());
            }
            if (filters?.inStock !== undefined) {
                params.append('inStock', filters.inStock.toString());
            }
            if (filters?.search) {
                params.append('search', filters.search);
            }

            const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch paginated products: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Handle both { data: [...], pagination: {...} } and { products: [...], pagination: {...} } formats
            if (data && typeof data === 'object') {
                if (Array.isArray(data.data)) {
                    return {
                        products: (data.data as LedProduct[]).map(normalizeProduct),
                        pagination: data.pagination
                    } as PaginatedProductsResponse;
                } else if (Array.isArray(data.products)) {
                    return {
                        ...data,
                        products: (data.products as LedProduct[]).map(normalizeProduct),
                    } as PaginatedProductsResponse;
                }
            }
            
            throw new Error("Invalid paginated response format");
        } catch (error) {
            console.error("ProductService.getPaginatedProducts error:", error);
            throw error;
        }
    }

    // Get filter data (lightweight, for Crossfilter)
    static async getFilterData(): Promise<FilterDataProduct[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/products/filter-data`);

            if (!response.ok) {
                throw new Error(`Failed to fetch filter data: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data as FilterDataProduct[];
        } catch (error) {
            console.error("ProductService.getFilterData error:", error);
            throw error;
        }
    }

    // Get autocomplete suggestions for search
    static async getSearchSuggestions(query: string, limit: number = 10): Promise<SearchSuggestionsResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/products/search-suggestions?q=${encodeURIComponent(query)}&limit=${limit}`);

            if (!response.ok) {
                // If endpoint doesn't exist (404) or other errors, return empty suggestions silently
                // This allows the frontend to work even if backend hasn't implemented the endpoint yet
                if (response.status === 404) {
                    console.warn("Search suggestions endpoint not implemented yet. Returning empty suggestions.");
                } else {
                    console.warn(`Failed to fetch search suggestions: ${response.status} ${response.statusText}`);
                }
                return { brands: [], references: [], titles: [], models: [], tvPanelTypes: [], suks: [], products: [] };
            }

            const data = await response.json();
            const responseData = data as SearchSuggestionsResponse;
            return {
                brands: Array.isArray(responseData.brands) ? responseData.brands : [],
                references: Array.isArray(responseData.references) ? responseData.references : [],
                titles: Array.isArray(responseData.titles) ? responseData.titles : [],
                models: Array.isArray(responseData.models) ? responseData.models : [],
                tvPanelTypes: Array.isArray(responseData.tvPanelTypes) ? responseData.tvPanelTypes : [],
                suks: Array.isArray(responseData.suks) ? responseData.suks : [],
                products: Array.isArray(responseData.products) ? responseData.products.map((p) => ({
                    ...p,
                    price: toFiniteNumberOr(p.price, 0),
                    salePrice: p.salePrice == null ? null : toFiniteNumberOr(p.salePrice, 0),
                    stock: toFiniteNumberOr(p.stock, 0),
                    tvSizeInch: p.tvSizeInch == null ? null : toFiniteNumberOr(p.tvSizeInch, 0),
                })) : [],
            };
        } catch (error) {
            // Network errors or other issues - return empty suggestions silently
            console.warn("ProductService.getSearchSuggestions error:", error);
            return { brands: [], references: [], titles: [], models: [], tvPanelTypes: [], suks: [], products: [] };
        }
    }

    // Admin: Delete single product
    static async deleteProduct(id: string): Promise<void> {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}`, {
                method: 'DELETE',
            });

            if (response.status === 204 || response.ok) {
                return;
            }

            const error = await response.json().catch(() => ({ message: 'Failed to delete product' }));
            throw new Error(error.message || `Failed to delete product: ${response.status} ${response.statusText}`);
        } catch (error) {
            console.error("ProductService.deleteProduct error:", error);
            throw error;
        }
    }

    // Admin: Bulk delete products
    static async bulkDeleteProducts(ids: string[]): Promise<{
        deletedCount: number;
        failedIds: string[];
        message: string;
    }> {
        try {
            const response = await fetch(`${API_BASE_URL}/products/bulk`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Failed to delete products' }));
                throw new Error(error.message || `Failed to delete products: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data as { deletedCount: number; failedIds: string[]; message: string };
        } catch (error) {
            console.error("ProductService.bulkDeleteProducts error:", error);
            throw error;
        }
    }

    // Admin: Get all brands
    static async getAllBrands(): Promise<string[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/products/brands`);

            if (!response.ok) {
                throw new Error(`Failed to fetch brands: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data as string[];
        } catch (error) {
            console.error("ProductService.getAllBrands error:", error);
            // Return empty array on error
            return [];
        }
    }

    // Admin: Create new product
    static async createProduct(productData: {
        number?: string | null;
        reference: string;
        brand: string;
        title: string;
        purchasePrice?: number | null;
        supplier?: string | null;
        salePrice: number;
        price: number;
        tvBacklightType?: string | null;
        tvPanelType?: string | null;
        tvSizeInch?: number | null;
        stripCount?: string | null;
        ledCount?: string | null;
        voltage?: number | null;
        length?: string | null;
        stock: number;
        rating?: number;
        images?: string[];
        tags?: string[];
        config?: string | null;
    }): Promise<LedProduct> {
        try {
            const response = await fetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Failed to create product' }));
                throw new Error(error.message || `Failed to create product: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return normalizeProduct(data as LedProduct);
        } catch (error) {
            console.error("ProductService.createProduct error:", error);
            throw error;
        }
    }

    // Admin: Update product
    static async updateProduct(id: string, productData: {
        number?: string | null;
        reference?: string;
        brand?: string;
        title?: string;
        purchasePrice?: number | null;
        supplier?: string | null;
        salePrice?: number;
        price?: number;
        tvBacklightType?: string | null;
        tvPanelType?: string | null;
        tvSizeInch?: number | null;
        stripCount?: string | null;
        ledCount?: string | null;
        voltage?: number | null;
        length?: string | null;
        stock?: number;
        rating?: number;
        images?: string[];
        tags?: string[];
        config?: string | null;
    }): Promise<LedProduct> {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Failed to update product' }));
                throw new Error(error.message || `Failed to update product: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return normalizeProduct(data as LedProduct);
        } catch (error) {
            console.error("ProductService.updateProduct error:", error);
            throw error;
        }
    }
}
