"use client";

import { Button } from "@/components/ui/button";

import { Star, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// Import FilterState from sidebar or define here and export
import { LedSidebar, type FilterState } from "@/components/led-sidebar";
import { Footer } from "@/components/footer";
import { AddToCartDialog } from "@/components/add-to-cart-dialog";
import { LedsBreadcrumb, type BreadcrumbItem } from "@/components/leds/leds-breadcrumb";
import { ProductService, type LedProduct, type FilterDataProduct } from "@/services/product-service";
import * as React from "react";

export default function LedPage() {
    return (
        <React.Suspense
            fallback={
                <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
                    <div className="container mx-auto px-4 py-12 text-center text-gray-600 dark:text-gray-400">
                        Loading products...
                    </div>
                </main>
            }
        >
            <LedPageInner />
        </React.Suspense>
    );
}

function LedPageInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

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

    // Sync filters from URL (set by the shop sub-navbar)
    const q = searchParams.get("q") ?? "";
    const brandToAdd = searchParams.get("brand");

    React.useEffect(() => {
        setFilters(prev => (prev.search === q ? prev : { ...prev, search: q }));
    }, [q]);

    React.useEffect(() => {
        if (!brandToAdd) return;

        const canonicalBrand = (() => {
            const target = brandToAdd.trim().toLowerCase();
            if (!target) return brandToAdd;
            const matched = filterData.find((item) => (item.brand || "").trim().toLowerCase() === target);
            return matched?.brand ?? brandToAdd;
        })();

        setFilters(prev => {
            const updatedManufacturers = prev.manufacturers.includes(canonicalBrand)
                ? prev.manufacturers
                : [...prev.manufacturers, canonicalBrand];
            return {
                ...prev,
                manufacturers: updatedManufacturers,
                search: '',
            };
        });

    }, [brandToAdd, filterData]);

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

        const makeFacetId = (value: string) => {
            const slug =
                value
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "") || "item";

            // Stable hash based on original string (case-sensitive)
            let hash = 0;
            for (let i = 0; i < value.length; i++) {
                hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
            }
            return `${slug}-${hash.toString(36)}`;
        };

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
                id: makeFacetId(brand),
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
                const mKey = (m || "").trim().toLowerCase();
                const facet = facets.manufacturers.find(f => (f.label || "").trim().toLowerCase() === mKey);
                // Keep the filter if the facet exists (even with 0 count) — user can uncheck it manually
                return !!facet;
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

    // ── Build a shared smart label from active filters ──────────────────────
    const filterLabel = React.useMemo(() => {
        const parts: string[] = [];

        // Brand names
        if (filters.manufacturers.length > 0) {
            parts.push(filters.manufacturers.length <= 2
                ? filters.manufacturers.join(" & ")
                : `${filters.manufacturers[0]} +${filters.manufacturers.length - 1}`);
        }

        // Diagonal sizes
        if (filters.diagonals.length > 0) {
            const sizeLabels = filters.diagonals.map(d => d === "0" ? "Universal" : `${d}\u2033`);
            parts.push(sizeLabels.length <= 2
                ? sizeLabels.join(", ")
                : `${sizeLabels[0]} +${sizeLabels.length - 1}`);
        }

        // Backlight type
        if (filters.backlightTypes.length > 0) {
            const typeLabels = filters.backlightTypes.map(t => t === "direct" ? "Direct LED" : t);
            parts.push(typeLabels.join(", "));
        }

        // Search query
        if (filters.search) {
            parts.push(`"${filters.search}"`);
        }

        const extras: string[] = [];
        if (filters.availability === "instock") extras.push("In stock");
        if (filters.videoGuide) extras.push("Video guide");

        const hasActiveFilter = parts.length > 0 || extras.length > 0;
        const suffix = [parts.join(" "), "LED Backlights"].filter(Boolean).join(" ");
        const fullLabel = extras.length > 0 ? `${suffix} (${extras.join(", ")})` : suffix;

        return { fullLabel, hasActiveFilter };
    }, [filters.manufacturers, filters.diagonals, filters.backlightTypes, filters.search, filters.availability, filters.videoGuide]);

    const totalCount = pagination?.total ?? filteredProducts.length;

    const breadcrumbItems = React.useMemo<BreadcrumbItem[]>(() => {
        const items: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

        if (filterLabel.hasActiveFilter) {
            items.push({ label: "LED backlight", href: "/leds" });
            items.push({ label: `${filterLabel.fullLabel} (${totalCount})` });
        } else {
            items.push({ label: `LED backlight (${totalCount})` });
        }

        return items;
    }, [filterLabel, totalCount]);

    return (
        <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <div className="container mx-auto px-4 pt-2 pb-8">
                <LedsBreadcrumb items={breadcrumbItems} />

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
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {filterLabel.fullLabel}
                                {" "}<span className="text-gray-600 dark:text-gray-400 text-lg font-normal">({pagination?.total ?? filteredProducts.length} Products)</span>
                            </h1>
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

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
                            </div>
                        )}

                        {loading ? (
                            <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
                                    <p className="text-gray-600 dark:text-gray-400 text-lg">Loading products...</p>
                                </div>
                            </div>
                        ) : filteredProducts.length === 0 && pagination && pagination.total === 0 ? (
                            <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                                <p className="text-gray-600 dark:text-gray-400 text-lg">No products found matching your filters.</p>
                                <Button
                                    variant="link"
                                    className="text-gray-900 dark:text-gray-300 mt-2"
                                    onClick={() => {
                                        setFilters({
                                            manufacturers: [],
                                            diagonals: [],
                                            backlightTypes: [],
                                            videoGuide: false,
                                            availability: 'all',
                                            search: '',
                                        });
                                        router.replace(pathname, { scroll: false });
                                    }}
                                >
                                    Clear all filters
                                </Button>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                                <p className="text-gray-600 dark:text-gray-400 text-lg">No products available.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredProducts.map((product, idx) => {
                                    const sizeLabel =
                                        product.size != null && product.size > 0 ? `${product.size}"` : "Universal";

                                    const showTop = idx < 3;
                                    const showMostWanted = product.tags.includes("Best Seller");
                                    const showVideoGuide = product.tags.includes("Technician Choice");

                                    return (
                                        <div
                                            key={product.id}
                                            className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-none overflow-hidden hover-draw-border hover-draw-border-gray transition-transform duration-200 hover:-translate-y-0.5"
                                        >
                                            {/* Image */}
                                            <Link href={`/leds/${product.id}`} className="block">
                                                <div className="relative aspect-square bg-gray-100 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                                                    <Image
                                                        src={product.images?.[0] || "/led-product.png"}
                                                        alt={product.title}
                                                        fill
                                                        className="object-contain p-4"
                                                    />

                                                    {(showTop || showMostWanted || showVideoGuide) && (
                                                        <div className="absolute top-2 left-2 space-y-1">
                                                            {showTop && (
                                                                <div className="bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded-sm w-fit">
                                                                    TOP #{idx + 1}
                                                                </div>
                                                            )}
                                                            {showMostWanted && (
                                                                <div className="bg-amber-700 text-white text-[10px] font-bold px-2 py-1 rounded-sm w-fit">
                                                                    MOST WANTED
                                                                </div>
                                                            )}
                                                            {showVideoGuide && (
                                                                <div className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-sm w-fit">
                                                                    VIDEO GUIDE
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {product.stock === 0 && (
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                            <span className="text-white font-bold tracking-widest uppercase text-xs">
                                                                Out of stock
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>

                                            {/* Content */}
                                            <div className="p-3 text-center">
                                                {/* Rating */}
                                                <div className="flex justify-center text-yellow-500 mb-2">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`h-4 w-4 ${i < product.rating ? "fill-current" : "text-gray-300 dark:text-gray-700"}`}
                                                        />
                                                    ))}
                                                </div>

                                                <Link href={`/leds/${product.id}`} className="block">
                                                    <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-snug line-clamp-2 min-h-[2.5rem]">
                                                        {product.title}
                                                    </h3>
                                                </Link>

                                                {/* Size pill */}
                                                <div className="mt-2 flex justify-center">
                                                    <span className="text-xs px-2 py-0.5 rounded border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300">
                                                        {sizeLabel}
                                                    </span>
                                                </div>

                                                {/* Stock line */}
                                                <div className="mt-3 text-xs">
                                                    {product.stock > 5 ? (
                                                        <span className="text-green-700 dark:text-green-400 font-medium">
                                                            In stock: more than 5 pieces
                                                        </span>
                                                    ) : product.stock > 0 ? (
                                                        <span className="text-green-700 dark:text-green-400 font-medium">
                                                            In stock: {product.stock}
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-600 dark:text-red-400 font-medium">
                                                            Out of stock
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Price */}
                                                <div className="mt-1 text-lg font-extrabold text-gray-900 dark:text-white">
                                                    {product.price.toFixed(2)}{" "}
                                                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                                                        TND
                                                    </span>
                                                </div>

                                                {/* CTA */}
                                                <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                                                    {product.stock > 0 ? (
                                                        <AddToCartDialog product={product}>
                                                            <Button className="w-full rounded-none bg-green-700 hover:bg-green-600 text-white font-semibold">
                                                                Add to cart
                                                            </Button>
                                                        </AddToCartDialog>
                                                    ) : (
                                                        <Button
                                                            disabled
                                                            className="w-full rounded-none bg-green-700 text-white font-semibold opacity-50"
                                                        >
                                                            Add to cart
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
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
