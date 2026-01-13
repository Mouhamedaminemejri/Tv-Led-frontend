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
    CheckCircle2,
    X
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ProductService, type LedProduct } from "@/services/product-service";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface AdminProduct extends LedProduct {
    number?: string;
    summary?: string;
    purchasePrice?: number;
    supplier?: string;
    salePrice?: number;
    createdAt?: string;
    updatedAt?: string;
}

export default function AdminProductsPage() {
    const router = useRouter();
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
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    } | null>(null);
    
    // Filters
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedBrand, setSelectedBrand] = React.useState("");
    const [inStockFilter, setInStockFilter] = React.useState<boolean | null>(null);
    
    const ITEMS_PER_PAGE = 20;

    // Load products
    const loadProducts = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const filterParams: Parameters<typeof ProductService.getPaginatedProducts>[2] = {};
            
            if (searchQuery.trim()) {
                filterParams.search = searchQuery.trim();
            }
            if (selectedBrand) {
                filterParams.brands = [selectedBrand];
            }
            if (inStockFilter !== null) {
                filterParams.inStock = inStockFilter;
            }
            
            const response = await ProductService.getPaginatedProducts(
                currentPage,
                ITEMS_PER_PAGE,
                filterParams
            );
            
            setProducts(response.products as AdminProduct[]);
            setPagination(response.pagination);
        } catch (err) {
            console.error("Error loading products:", err);
            setError("Failed to load products. Please try again.");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery, selectedBrand, inStockFilter]);

    // Load brands for filter
    React.useEffect(() => {
        const loadBrands = async () => {
            try {
                const brandsList = await ProductService.getAllBrands();
                setBrands(brandsList);
            } catch (err) {
                console.error("Error loading brands:", err);
            }
        };
        loadBrands();
    }, []);

    React.useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    // Handle single product delete
    const handleDelete = async (productId: string) => {
        try {
            await ProductService.deleteProduct(productId);
            // Reload products after deletion
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
            const result = await ProductService.bulkDeleteProducts(Array.from(selectedProducts));
            
            // Reload products
            loadProducts();
            setSelectedProducts(new Set());
            setDeleteDialogOpen(false);
            
            // Show success message
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
        setInStockFilter(null);
        setCurrentPage(1);
    };

    return (
        <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-8">
                    <div className="flex items-center gap-4">
                        <Link href="/leds" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <ChevronLeft className="h-5 w-5" />
                            <span className="hidden sm:inline">Back to Products</span>
                        </Link>
                        <div className="h-6 w-px bg-gray-300 dark:bg-white/10" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin - Products</h1>
                    </div>
                    <Link href="/admin/products/new">
                        <Button className="bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-500 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Product
                        </Button>
                    </Link>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                {/* Filters and Actions */}
                <div className="mb-6 space-y-4">
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <Input
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full bg-gray-100 dark:bg-white/5 border-gray-300 dark:border-white/10 pl-10 focus:bg-gray-200 dark:focus:bg-white/10 transition-colors h-10 rounded-full text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500"
                            />
                        </div>
                        <select
                            value={selectedBrand}
                            onChange={(e) => {
                                setSelectedBrand(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-blue-500"
                        >
                            <option value="">All Brands</option>
                            {brands.map(brand => (
                                <option key={brand} value={brand}>{brand}</option>
                            ))}
                        </select>
                        <select
                            value={inStockFilter === null ? "all" : inStockFilter ? "instock" : "outofstock"}
                            onChange={(e) => {
                                const value = e.target.value;
                                setInStockFilter(value === "all" ? null : value === "instock");
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-blue-500"
                        >
                            <option value="all">All Stock</option>
                            <option value="instock">In Stock</option>
                            <option value="outofstock">Out of Stock</option>
                        </select>
                        {(searchQuery || selectedBrand || inStockFilter !== null) && (
                            <Button
                                variant="outline"
                                onClick={resetFilters}
                                className="border-gray-300 dark:border-white/10"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Clear
                            </Button>
                        )}
                    </div>

                    {/* Bulk Actions */}
                    {selectedProducts.size > 0 && (
                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                {selectedProducts.size} product(s) selected
                            </span>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    setProductToDelete(null);
                                    setDeleteDialogOpen(true);
                                }}
                                disabled={bulkDeleteLoading}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Selected
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setSelectedProducts(new Set())}
                            >
                                Clear Selection
                            </Button>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto"
                        >
                            <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </button>
                    </div>
                )}

                {/* Products Table */}
                {loading ? (
                    <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">No products found</p>
                        <Link href="/admin/products/new">
                            <Button className="bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-500 text-white">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Product
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100 dark:bg-white/10 border-b border-gray-200 dark:border-white/10">
                                        <tr>
                                            <th className="px-4 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProducts.size === products.length && products.length > 0}
                                                    onChange={toggleAllSelection}
                                                    className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 dark:focus:ring-blue-500"
                                                />
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Image</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Brand</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Reference</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Title</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Price</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Stock</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                                        {products.map((product) => (
                                            <tr 
                                                key={product.id} 
                                                className="hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProducts.has(product.id)}
                                                        onChange={() => toggleProductSelection(product.id)}
                                                        className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 dark:focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="relative w-16 h-16 bg-gray-200 dark:bg-white/10 rounded-lg overflow-hidden">
                                                        <Image
                                                            src={product.images?.[0] || '/led-product.png'}
                                                            alt={product.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{product.brand}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">{product.reference}</td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate" title={product.title}>
                                                        {product.title}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                                    {product.price.toFixed(2)} TND
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-sm font-medium ${
                                                        product.stock > 0 
                                                            ? 'text-green-600 dark:text-green-400' 
                                                            : 'text-red-600 dark:text-red-400'
                                                    }`}>
                                                        {product.stock}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Link href={`/leds/${product.id}`} target="_blank">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                title="View"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/admin/products/${product.id}/edit`}>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                title="Edit"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
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
                            <div className="flex items-center justify-between mt-6">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, pagination.total)} of {pagination.total} products
                                </div>
                                <div className="flex items-center gap-2">
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
                                                    className={
                                                        currentPage === pageNum
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
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="bg-white dark:bg-black border-gray-200 dark:border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-white">
                            {productToDelete ? 'Delete Product' : `Delete ${selectedProducts.size} Product(s)`}
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-400">
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
                            className="border-gray-300 dark:border-white/10"
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
        </main>
    );
}

