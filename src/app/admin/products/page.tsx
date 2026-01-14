"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Plus, 
    Search, 
    Trash2, 
    Edit, 
    Eye, 
    ChevronLeft, 
    ChevronRight,
    Loader2,
    AlertCircle,
    X,
    Package
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AdminService, type AdminProduct, type PaginatedResponse } from "@/services/admin-service";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function AdminProductsPage() {
    const [products, setProducts] = React.useState<AdminProduct[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [selectedProducts, setSelectedProducts] = React.useState<Set<string>>(new Set());
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [productToDelete, setProductToDelete] = React.useState<string | null>(null);
    const [bulkDeleteLoading, setBulkDeleteLoading] = React.useState(false);
    const [brands, setBrands] = React.useState<string[]>([]);
    
    // Pagination
    const [currentPage, setCurrentPage] = React.useState(1);
    const [pagination, setPagination] = React.useState<{
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    } | null>(null);
    
    // Filters
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedBrand, setSelectedBrand] = React.useState("");
    const [inStockFilter, setInStockFilter] = React.useState<boolean | undefined>(undefined);
    
    const ITEMS_PER_PAGE = 20;

    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = React.useState("");
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Load products
    const loadProducts = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await AdminService.getProducts(currentPage, ITEMS_PER_PAGE, {
                search: debouncedSearch || undefined,
                brands: selectedBrand ? [selectedBrand] : undefined,
                inStock: inStockFilter,
            });
            
            setProducts(response.data);
            setPagination({
                total: response.total,
                page: response.page,
                limit: response.limit,
                totalPages: response.totalPages,
            });

            // Extract unique brands for filter
            const uniqueBrands = [...new Set(response.data.map(p => p.brand))].filter(Boolean);
            if (brands.length === 0 && uniqueBrands.length > 0) {
                setBrands(uniqueBrands);
            }
        } catch (err) {
            console.error("Error loading products:", err);
            setError(err instanceof Error ? err.message : "Failed to load products");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearch, selectedBrand, inStockFilter, brands.length]);

    React.useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    // Handle single product delete
    const handleDelete = async (productId: string) => {
        try {
            await AdminService.deleteProduct(productId);
            loadProducts();
            setDeleteDialogOpen(false);
            setProductToDelete(null);
        } catch (err) {
            console.error("Error deleting product:", err);
            setError(err instanceof Error ? err.message : "Failed to delete product");
        }
    };

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (selectedProducts.size === 0) return;

        try {
            setBulkDeleteLoading(true);
            const result = await AdminService.bulkDeleteProducts(Array.from(selectedProducts));
            
            loadProducts();
            setSelectedProducts(new Set());
            setDeleteDialogOpen(false);
            
            if (result.deletedCount > 0) {
                alert(`Successfully deleted ${result.deletedCount} product(s).${result.failedIds?.length > 0 ? ` ${result.failedIds.length} failed.` : ''}`);
            }
        } catch (err) {
            console.error("Error bulk deleting products:", err);
            setError(err instanceof Error ? err.message : "Failed to delete products");
        } finally {
            setBulkDeleteLoading(false);
        }
    };

    // Toggle product selection
    const toggleProductSelection = (productId: string) => {
        setSelectedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    // Toggle all products selection
    const toggleAllSelection = () => {
        if (selectedProducts.size === products.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(products.map(p => p.id)));
        }
    };

    // Reset filters
    const resetFilters = () => {
        setSearchQuery("");
        setSelectedBrand("");
        setInStockFilter(undefined);
        setCurrentPage(1);
    };

    const hasActiveFilters = searchQuery || selectedBrand || inStockFilter !== undefined;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            {/* Page Header */}
            <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-black/80 backdrop-blur-xl lg:top-0">
                <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Products</h1>
                        {pagination && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                ({pagination.total} total)
                            </span>
                        )}
                    </div>
                    <Link href="/admin/products/new">
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Add Product</span>
                            <span className="sm:hidden">Add</span>
                        </Button>
                    </Link>
                </div>
            </header>

            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Filters */}
                <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                            />
                        </div>
                        <select
                            value={selectedBrand}
                            onChange={(e) => {
                                setSelectedBrand(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-white [&>option]:dark:bg-gray-900 [&>option]:text-gray-900 [&>option]:dark:text-white"
                        >
                            <option value="">All Brands</option>
                            {brands.map(brand => (
                                <option key={brand} value={brand}>{brand}</option>
                            ))}
                        </select>
                        <select
                            value={inStockFilter === undefined ? "all" : inStockFilter ? "instock" : "outofstock"}
                            onChange={(e) => {
                                const value = e.target.value;
                                setInStockFilter(value === "all" ? undefined : value === "instock");
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-white [&>option]:dark:bg-gray-900 [&>option]:text-gray-900 [&>option]:dark:text-white"
                        >
                            <option value="all">All Stock</option>
                            <option value="instock">In Stock</option>
                            <option value="outofstock">Out of Stock</option>
                        </select>
                        {hasActiveFilters && (
                            <Button variant="outline" onClick={resetFilters} className="border-gray-200 dark:border-white/10">
                                <X className="h-4 w-4 mr-2" />
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedProducts.size > 0 && (
                    <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                            {selectedProducts.size} product(s) selected
                        </span>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                setProductToDelete(null);
                                setDeleteDialogOpen(true);
                            }}
                            disabled={bulkDeleteLoading}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Selected
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setSelectedProducts(new Set())}>
                            Clear Selection
                        </Button>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                        <span className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</span>
                        <button onClick={() => setError(null)}>
                            <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </button>
                    </div>
                )}

                {/* Products Table */}
                {loading ? (
                    <div className="text-center py-20 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Loading products...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                        <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                            {hasActiveFilters ? "No products match your filters" : "No products found"}
                        </p>
                        {hasActiveFilters ? (
                            <Button variant="outline" onClick={resetFilters}>
                                Clear Filters
                            </Button>
                        ) : (
                            <Link href="/admin/products/new">
                                <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Your First Product
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                                        <tr>
                                            <th className="px-4 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProducts.size === products.length && products.length > 0}
                                                    onChange={toggleAllSelection}
                                                    className="w-4 h-4 rounded border-gray-300 dark:border-white/20"
                                                />
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Image</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Brand</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Reference</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Title</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Price</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Stock</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                        {products.map((product) => (
                                            <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProducts.has(product.id)}
                                                        onChange={() => toggleProductSelection(product.id)}
                                                        className="w-4 h-4 rounded border-gray-300 dark:border-white/20"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="relative w-12 h-12 bg-gray-100 dark:bg-white/10 rounded-lg overflow-hidden">
                                                        <Image
                                                            src={product.images?.[0] || '/led-product.png'}
                                                            alt={product.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{product.brand}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{product.reference}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm text-gray-900 dark:text-white max-w-[200px] truncate" title={product.title}>
                                                        {product.title}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        {product.price.toFixed(2)} TND
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        product.stock > 0 
                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                    }`}>
                                                        {product.stock}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1">
                                                        <Link href={`/leds/${product.id}`} target="_blank">
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/admin/products/${product.id}/edit`}>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            onClick={() => {
                                                                setProductToDelete(product.id);
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, pagination.total)} of {pagination.total}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1 || loading}
                                        className="border-gray-200 dark:border-white/10"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Previous
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                            let pageNum: number;
                                            if (pagination.totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= pagination.totalPages - 2) {
                                                pageNum = pagination.totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    disabled={loading}
                                                    className={currentPage === pageNum ? "bg-blue-600 hover:bg-blue-500 text-white" : "border-gray-200 dark:border-white/10"}
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
                                        disabled={currentPage === pagination.totalPages || loading}
                                        className="border-gray-200 dark:border-white/10"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-white">
                            {productToDelete ? 'Delete Product' : `Delete ${selectedProducts.size} Product(s)`}
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 dark:text-gray-400">
                            {productToDelete 
                                ? 'Are you sure you want to delete this product? This action cannot be undone.'
                                : `Are you sure you want to delete ${selectedProducts.size} selected product(s)? This action cannot be undone.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setProductToDelete(null);
                            }}
                            className="border-gray-200 dark:border-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (productToDelete) {
                                    handleDelete(productToDelete);
                                } else {
                                    handleBulkDelete();
                                }
                            }}
                            disabled={bulkDeleteLoading}
                        >
                            {bulkDeleteLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
