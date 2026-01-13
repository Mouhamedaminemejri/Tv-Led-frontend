"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Verified import

import { ShoppingCart, Filter, Star, Heart, CheckCircle2, ChevronLeft, ChevronRight, Eye, Home } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Import FilterState from sidebar or define here and export
import { LedSidebar, type FilterState } from "@/components/led-sidebar";
import { Footer } from "@/components/footer";
import { AddToCartDialog } from "@/components/add-to-cart-dialog";
import { ProductDetailDialog } from "@/components/product-detail-dialog";
import { SearchAutocomplete } from "@/components/search-autocomplete";
import { useCart } from "@/context/cart-context"; // Import Hook
import { ProductService, type LedProduct, type FilterDataProduct } from "@/services/product-service";
import * as React from "react";
import { Loader2, AlertCircle } from "lucide-react";

// Sub-components for Header to access Context
function CartPrice() {
    const { cartTotal } = useCart();
    return <span className="text-sm font-bold text-gray-900 dark:text-white">{cartTotal.toFixed(2)} TND</span>;
}

function CartTriggerBtn() {
    const { cartCount, openCart } = useCart();
    return (
        <Button size="icon" className="rounded-full bg-blue-600 hover:bg-blue-500 relative" onClick={openCart}>
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                    {cartCount}
                </span>
            )}
        </Button>
    );
}

export default function LedPage() {
    // Data State
    const [products, setProducts] = React.useState<LedProduct[]>([]);
    const [filterData, setFilterData] = React.useState<FilterDataProduct[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    
    // Pagination State
    const [currentPage, setCurrentPage] = React.useState(1);
    const [pagination, setPagination] = React.useState<{
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    } | null>(null);

    // Filter State
    const [filters, setFilters] = React.useState<FilterState>({
        manufacturers: [],
        diagonals: [],
        backlightTypes: [],
        videoGuide: false,
        availability: 'all',
        search: '',
    });

    const [sortOption, setSortOption] = React.useState('relevance');
    const loadingRef = React.useRef(false);
    const ITEMS_PER_PAGE = 10;

    // Load filter data once on mount (for accurate facet counts)
    React.useEffect(() => {
        const loadFilterData = async () => {
            try {
                const data = await ProductService.getFilterData();
                setFilterData(data);
            } catch (err) {
                console.error("Error loading filter data:", err);
                // Don't show error to user, just log it
            }
        };
        loadFilterData();
    }, []);

    // Load paginated products when filters or page changes
    React.useEffect(() => {
        // Prevent multiple simultaneous calls
        if (loadingRef.current) {
            return;
        }
        
        let isMounted = true;
        const loadProducts = async () => {
            if (loadingRef.current) return;
            loadingRef.current = true;
            
            try {
                setLoading(true);
                
                // Build filter parameters
                const filterParams: Parameters<typeof ProductService.getPaginatedProducts>[2] = {};
                
                if (filters.manufacturers.length > 0) {
                    filterParams.brands = filters.manufacturers;
                }
                if (filters.diagonals.length > 0) {
                    filterParams.sizes = filters.diagonals;
                }
                if (filters.availability === 'instock') {
                    filterParams.inStock = true;
                }
                if (filters.search) {
                    filterParams.search = filters.search;
                }
                
                const response = await ProductService.getPaginatedProducts(
                    currentPage,
                    ITEMS_PER_PAGE,
                    filterParams
                );
                
                if (!isMounted) return;
                
                setProducts(response.products);
                setPagination(response.pagination);
                setError(null);
            } catch (err) {
                console.error("Error loading products:", err);
                if (!isMounted) return;
                setError("Failed to load products. Please check your connection.");
                setProducts([]);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
                loadingRef.current = false;
            }
        };

        loadProducts();
        
        return () => {
            isMounted = false;
            loadingRef.current = false;
        };
    }, [currentPage, filters.manufacturers, filters.diagonals, filters.availability, filters.search]);

    // Helper function to filter filterData excluding a specific filter category (for cross-filtering facets)
    const filterDataExcluding = React.useCallback((excludeCategory: keyof FilterState | null = null) => {
        if (!Array.isArray(filterData) || filterData.length === 0) {
            return [];
        }
        return filterData.filter(item => {
            // Filter by Manufacturer (exclude if calculating manufacturer facets)
            if (excludeCategory !== 'manufacturers' && filters.manufacturers.length > 0 && !filters.manufacturers.includes(item.brand)) {
                return false;
            }

            // Filter by Diagonal (exclude if calculating diagonal facets)
            if (excludeCategory !== 'diagonals' && filters.diagonals.length > 0) {
                const sizeStr = item.size?.toString() ?? '0';
                if (!filters.diagonals.includes(sizeStr)) {
                    return false;
                }
            }

            // Filter by Availability
            if (filters.availability === 'instock' && item.stock === 0) {
                return false;
            }

            // Filter by Video Guide
            if (filters.videoGuide && !item.tags.includes("Technician Choice")) {
                return false;
            }

            return true;
        });
    }, [filters, filterData]);

    // Filtered products (already filtered by server, just apply client-side sorting)
    const filteredProducts = React.useMemo(() => {
        if (!Array.isArray(products)) {
            return [];
        }
        return [...products].sort((a, b) => {
            if (sortOption === 'price-asc') return a.price - b.price;
            if (sortOption === 'price-desc') return b.price - a.price;
            // Add more sort options if needed
            return 0;
        });
    }, [products, sortOption]);
    
    // Reset to page 1 when filters change (except page changes)
    React.useEffect(() => {
        setCurrentPage(1);
    }, [filters.manufacturers, filters.diagonals, filters.availability, filters.search]);

    // Calculate facets: Get ALL options from filter-data, then calculate counts with current filters
    const facets = React.useMemo(() => {
        if (!Array.isArray(filterData) || filterData.length === 0) {
            return {
                manufacturers: [],
                diagonals: [],
                backlightTypes: [],
                videoGuide: 0
            };
        }

        // Get ALL unique brands and sizes from filter-data (complete list)
        const allBrands = new Set(filterData.map(item => item.brand));
        const allSizes = new Set(filterData.map(item => item.size?.toString() ?? '0'));

        // Calculate counts for each manufacturer WITH current filters (excluding manufacturer filter)
        const manufacturerCounts: Record<string, number> = {};
        allBrands.forEach(brand => {
            const filtered = filterData.filter(item => {
                // Apply all filters except manufacturer
                if (filters.diagonals.length > 0) {
                    const sizeStr = item.size?.toString() ?? '0';
                    if (!filters.diagonals.includes(sizeStr)) return false;
                }
                if (filters.availability === 'instock' && item.stock === 0) return false;
                if (filters.videoGuide && !item.tags.includes("Technician Choice")) return false;
                // Check if this brand matches
                return item.brand === brand;
            });
            manufacturerCounts[brand] = filtered.length;
        });

        // Calculate counts for each size WITH current filters (excluding diagonal filter)
        const sizeCounts: Record<string, number> = {};
        allSizes.forEach(size => {
            const filtered = filterData.filter(item => {
                // Apply all filters except diagonal
                if (filters.manufacturers.length > 0 && !filters.manufacturers.includes(item.brand)) return false;
                if (filters.availability === 'instock' && item.stock === 0) return false;
                if (filters.videoGuide && !item.tags.includes("Technician Choice")) return false;
                // Check if this size matches
                const itemSize = item.size?.toString() ?? '0';
                return itemSize === size;
            });
            sizeCounts[size] = filtered.length;
        });

        // Calculate backlight facets (all products are "Direct LED" for now)
        const backlightData = filterDataExcluding('backlightTypes');
        const backlightCounts: Record<string, number> = {};
        backlightData.forEach(() => {
            backlightCounts["direct"] = (backlightCounts["direct"] || 0) + 1;
        });

        // Calculate video guide count
        const videoGuideData = filterDataExcluding(null);
        const videoGuideCount = videoGuideData.filter(item => item.tags.includes("Technician Choice")).length;

        return {
            manufacturers: Array.from(allBrands).map(brand => ({
                id: brand.toLowerCase(),
                label: brand,
                count: manufacturerCounts[brand] || 0
            })).sort((a, b) => b.count - a.count),
            diagonals: Array.from(allSizes).map(size => ({
                id: size,
                label: size === '0' ? 'Universal' : `${size}"`,
                count: sizeCounts[size] || 0
            })).sort((a, b) => Number(a.id) - Number(b.id)),
            backlightTypes: Object.entries(backlightCounts).map(([id, count]) => ({
                id: id,
                label: id === "direct" ? "Direct LED" : id,
                count
            })),
            videoGuide: videoGuideCount
        };
    }, [filterData, filters, filterDataExcluding]);

    // Auto-remove only selected filters that have 0 count (but keep all options visible)
    React.useEffect(() => {
        setFilters(prev => {
            const updated = { ...prev };
            let hasChanges = false;
            
            // Remove selected manufacturers that have 0 count
            const validManufacturers = prev.manufacturers.filter(m => {
                const facet = facets.manufacturers.find(f => f.label === m);
                return facet && facet.count > 0;
            });
            if (validManufacturers.length !== prev.manufacturers.length) {
                updated.manufacturers = validManufacturers;
                hasChanges = true;
            }
            
            // Remove selected diagonals that have 0 count
            const validDiagonals = prev.diagonals.filter(d => {
                const facet = facets.diagonals.find(f => f.id === d);
                return facet && facet.count > 0;
            });
            if (validDiagonals.length !== prev.diagonals.length) {
                updated.diagonals = validDiagonals;
                hasChanges = true;
            }
            
            // Remove selected backlight types that have 0 count
            const validBacklightTypes = prev.backlightTypes.filter(b => {
                const facet = facets.backlightTypes.find(f => f.id === b);
                return facet && facet.count > 0;
            });
            if (validBacklightTypes.length !== prev.backlightTypes.length) {
                updated.backlightTypes = validBacklightTypes;
                hasChanges = true;
            }
            
            // Remove video guide filter if count is 0
            if (prev.videoGuide && (facets.videoGuide ?? 0) === 0) {
                updated.videoGuide = false;
                hasChanges = true;
            }
            
            return hasChanges ? updated : prev;
        });
    }, [facets]);

    return (
        <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            {/* Header for Store Section */}
            <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
                    {/* Breadcrumb Navigation */}
                    <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                        <Link href="/" className="hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1">
                            <Home className="h-4 w-4" />
                            <span className="hidden sm:inline">Home</span>
                        </Link>
                        <span>/</span>
                        <span className="text-gray-900 dark:text-white font-medium">Products</span>
                    </nav>

                    <div className="flex-1 max-w-2xl relative">
                        <SearchAutocomplete
                            value={filters.search}
                            onChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                            onSelect={(value, type) => {
                                if (type === 'brand') {
                                    // If brand is selected, add it to manufacturers filter and clear search
                                    setFilters(prev => {
                                        const updatedManufacturers = prev.manufacturers.includes(value)
                                            ? prev.manufacturers
                                            : [...prev.manufacturers, value];
                                        return {
                                            ...prev,
                                            manufacturers: updatedManufacturers,
                                            search: '' // Clear search when brand is selected
                                        };
                                    });
                                } else {
                                    // For references and titles, use search field
                                    setFilters(prev => ({ ...prev, search: value }));
                                }
                                setCurrentPage(1); // Reset to first page when selecting a suggestion
                            }}
                            placeholder="Search by TV Model (e.g. UE43...), Part Number, or Brand..."
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end mr-2 hidden sm:flex">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Your Basket</span>
                            {/* Dynamically Update Price */}
                            <CartPrice />
                        </div>
                        {/* Cart Trigger */}
                        <CartTriggerBtn />
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters - Only show when we have products */}
                    {!loading && Array.isArray(products) && products.length > 0 && (
                        <LedSidebar
                            filters={filters}
                            setFilters={setFilters}
                            facets={facets}
                        />
                    )}

                    {/* Product Grid */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">LED Backlights <span className="text-gray-600 dark:text-gray-400 text-lg font-normal">({pagination?.total ?? filteredProducts.length} Products)</span></h1>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                Sort by:
                                <select
                                    className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium cursor-pointer border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value)}
                                >
                                    <option value="relevance" className="bg-white dark:bg-gray-900">Relevance</option>
                                    <option value="price-asc" className="bg-white dark:bg-gray-900">Price: Low to High</option>
                                    <option value="price-desc" className="bg-white dark:bg-gray-900">Price: High to Low</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                                <p className="text-gray-600 dark:text-gray-400 text-lg">Loading products...</p>
                            </div>
                        ) : filteredProducts.length === 0 && pagination && pagination.total === 0 ? (
                            <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                                <p className="text-gray-600 dark:text-gray-400 text-lg">No products found matching your filters.</p>
                                <Button
                                    variant="link"
                                    className="text-gray-900 dark:text-gray-300 mt-2"
                                    onClick={() => setFilters({
                                        manufacturers: [],
                                        diagonals: [],
                                        backlightTypes: [],
                                        videoGuide: false,
                                        availability: 'all',
                                        search: '',
                                    })}
                                >
                                    Clear all filters
                                </Button>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                                <p className="text-gray-600 dark:text-gray-400 text-lg">No products available.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredProducts.map(product => (
                                    <div key={product.id} className="group relative bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-2xl transition-all duration-300">
                                        {/* Image Area */}
                                        <Link href={`/leds/${product.id}`} className="block">
                                            <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black relative  flex items-center justify-center">
                                                {/* Badge */}
                                                {product.tags.includes("Best Seller") && (
                                                    <div className="absolute top-4 left-4 z-10 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                                        <Star className="h-3 w-3 fill-black" /> Best Seller
                                                    </div>
                                                )}
                                                {product.stock === 0 && (
                                                    <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/60 z-20 flex items-center justify-center backdrop-blur-sm">
                                                        <span className="text-white dark:text-white font-bold tracking-widest uppercase border-2 border-white px-4 py-2">Out of Stock</span>
                                                    </div>
                                                )}

                                                <div className="relative w-full h-full transform group-hover:scale-105 transition-transform duration-500">
                                                    <Image
                                                        src={product.images?.[0] || '/led-product.png'}
                                                        alt={product.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>

                                                <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
                                                    <button 
                                                        className="p-2 rounded-full bg-white/80 dark:bg-black/50 text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-black transition-colors opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-300" 
                                                        title="Add to Wishlist"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            // Wishlist functionality can be added here
                                                        }}
                                                    >
                                                        <Heart className="h-4 w-4" />
                                                    </button>
                                                    <ProductDetailDialog product={product}>
                                                        <button 
                                                            className="p-2 rounded-full bg-white/80 dark:bg-black/50 text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-black transition-colors opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-300" 
                                                            title="View Details"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                    </ProductDetailDialog>
                                                </div>
                                            </div>
                                        </Link>

                                        {/* Content */}
                                        <div className="p-5">
                                            <Link href={`/leds/${product.id}`} className="block">
                                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">{product.brand} • {product.reference}</div>
                                                <h3 className="font-bold text-lg mb-2 leading-tight text-gray-900 dark:text-white group-hover:text-gray-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 min-h-[3rem]">
                                                    {product.title}
                                                </h3>

                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="flex text-yellow-500 dark:text-yellow-500">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`h-3 w-3 ${i < product.rating ? 'fill-current' : 'text-gray-300 dark:text-gray-700'}`} />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-gray-600 dark:text-gray-400">({product.id.charCodeAt(0) * 2 + 5} reviews)</span>
                                                </div>
                                            </Link>

                                            <div className="flex items-center justify-between mt-auto">
                                                <Link href={`/leds/${product.id}`} className="block">
                                                    <div>
                                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{product.price.toFixed(2)} <span className="text-sm font-normal text-gray-600 dark:text-gray-400">TND</span></div>
                                                        {product.stock > 0 && product.stock < 5 ? (
                                                            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">Only {product.stock} left in stock</span>
                                                        ) : product.stock > 0 ? (
                                                            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> In Stock</span>
                                                        ) : (
                                                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Restocking soon</span>
                                                        )}
                                                    </div>
                                                </Link>

                                                <div onClick={(e) => e.stopPropagation()}>
                                                    {product.stock > 0 ? (
                                                        <AddToCartDialog product={product}>
                                                            <Button className="rounded-xl shadow-lg bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200">
                                                                Add to Cart
                                                            </Button>
                                                        </AddToCartDialog>
                                                    ) : (
                                                        <Button disabled className="rounded-xl shadow-lg opacity-50">
                                                            Add to Cart
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Pagination Controls */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={!pagination.hasPrev || loading}
                                    className="bg-gray-100 dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Button>
                                
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                        let pageNum: number;
                                        if (pagination.totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (pagination.page <= 3) {
                                            pageNum = i + 1;
                                        } else if (pagination.page >= pagination.totalPages - 2) {
                                            pageNum = pagination.totalPages - 4 + i;
                                        } else {
                                            pageNum = pagination.page - 2 + i;
                                        }
                                        
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={pagination.page === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
                                                disabled={loading}
                                                className={
                                                    pagination.page === pageNum
                                                        ? "bg-gray-900 dark:bg-blue-600 text-white hover:bg-gray-800 dark:hover:bg-blue-500"
                                                        : "bg-gray-100 dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10"
                                                }
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                                    disabled={!pagination.hasNext || loading}
                                    className="bg-gray-100 dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                                
                                <span className="text-sm text-gray-600 dark:text-gray-400 ml-4">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </main >
    );
}
