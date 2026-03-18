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
  FileCode,
  Columns3,
  Check,
  Download,
  Upload,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  AdminSoftwareService,
  type PaginatedSoftwareResponse,
} from "@/services/admin-software-service";
import type { SoftwareProduct } from "@/services/software-product-service";
import { SoftwareProductService } from "@/services/software-product-service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FIRMWARE_LABELS: Record<string, string> = {
  update: "Update",
  usb: "USB",
  recovery: "Recovery",
  chassis_pack: "Chassis Pack",
};

type ColumnKey =
  | "image"
  | "brand"
  | "reference"
  | "title"
  | "firmwareType"
  | "price"
  | "salePrice"
  | "stock"
  | "version"
  | "fileSize"
  | "actions";

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "image", label: "Image" },
  { key: "brand", label: "Brand" },
  { key: "reference", label: "Reference" },
  { key: "title", label: "Title" },
  { key: "firmwareType", label: "Type" },
  { key: "price", label: "Price" },
  { key: "salePrice", label: "Sale Price" },
  { key: "stock", label: "Stock" },
  { key: "version", label: "Version" },
  { key: "fileSize", label: "File Size" },
  { key: "actions", label: "Actions" },
];

const DEFAULT_COLUMNS: ColumnKey[] = ["image", "brand", "reference", "title", "firmwareType", "price", "stock", "actions"];

export default function AdminSoftwarePage() {
  const [products, setProducts] = React.useState<SoftwareProduct[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = React.useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [productToDelete, setProductToDelete] = React.useState<string | null>(null);
  const [bulkDeleteLoading, setBulkDeleteLoading] = React.useState(false);
  const [brands, setBrands] = React.useState<string[]>([]);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [pagination, setPagination] = React.useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [modelsQuery, setModelsQuery] = React.useState("");
  const [referenceQuery, setReferenceQuery] = React.useState("");
  const [selectedBrand, setSelectedBrand] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("");
  const [inStockFilter, setInStockFilter] = React.useState<boolean | undefined>(undefined);

  const [visibleColumns, setVisibleColumns] = React.useState<Set<ColumnKey>>(
    () => new Set(DEFAULT_COLUMNS)
  );
  const [columnPickerOpen, setColumnPickerOpen] = React.useState(false);
  const columnPickerRef = React.useRef<HTMLDivElement>(null);

  const ITEMS_PER_PAGE = 20;

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (columnPickerRef.current && !columnPickerRef.current.contains(e.target as Node)) {
        setColumnPickerOpen(false);
      }
    };
    if (columnPickerOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [columnPickerOpen]);

  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [debouncedModels, setDebouncedModels] = React.useState("");
  const [debouncedReference, setDebouncedReference] = React.useState("");
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setDebouncedModels(modelsQuery);
      setDebouncedReference(referenceQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, modelsQuery, referenceQuery]);

  React.useEffect(() => {
    SoftwareProductService.getFilterData().then((items) => {
      const b = [...new Set(items.map((p) => p.brand))].filter(Boolean).sort();
      setBrands(b);
    });
  }, []);

  const loadProducts = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AdminSoftwareService.getProducts(currentPage, ITEMS_PER_PAGE, {
        search: debouncedSearch || undefined,
        brands: selectedBrand ? [selectedBrand] : undefined,
        models: debouncedModels || undefined,
        reference: debouncedReference || undefined,
        type: typeFilter || undefined,
        inStock: inStockFilter,
      });
      setProducts(response.data);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
    } catch (err) {
      console.error("Error loading software:", err);
      setError(err instanceof Error ? err.message : "Failed to load software");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, debouncedModels, debouncedReference, selectedBrand, typeFilter, inStockFilter]);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleDelete = async (productId: string) => {
    try {
      await AdminSoftwareService.deleteProduct(productId);
      loadProducts();
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    try {
      setBulkDeleteLoading(true);
      const result = await AdminSoftwareService.bulkDeleteProducts(Array.from(selectedProducts));
      loadProducts();
      setSelectedProducts(new Set());
      setDeleteDialogOpen(false);
      if (result.deletedCount > 0) {
        alert(`Deleted ${result.deletedCount} product(s).${result.failedIds?.length ? ` ${result.failedIds.length} failed.` : ""}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderCellValue = (product: SoftwareProduct, key: ColumnKey) => {
    switch (key) {
      case "image":
        return (
          <div className="relative w-12 h-12 bg-gray-100 dark:bg-white/10 rounded-lg overflow-hidden">
            <Image
              src={product.images?.[0] || "/file.svg"}
              alt={product.title}
              fill
              className="object-cover"
            />
          </div>
        );
      case "brand":
        return <span className="text-sm font-medium text-gray-900 dark:text-white">{product.brand}</span>;
      case "reference":
        return <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{product.reference}</span>;
      case "title":
        return (
          <div className="text-sm text-gray-900 dark:text-white max-w-[200px] truncate" title={product.title}>
            {product.title}
          </div>
        );
      case "firmwareType":
        return (
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {FIRMWARE_LABELS[product.firmwareType] || product.firmwareType}
          </span>
        );
      case "price":
        return <span className="text-sm font-semibold text-gray-900 dark:text-white">{(product.price ?? 0).toFixed(2)} TND</span>;
      case "salePrice":
        return (
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {product.salePrice != null ? `${product.salePrice.toFixed(2)} TND` : "—"}
          </span>
        );
      case "stock":
        return (
          <span
            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
              product.stock > 0 ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            }`}
          >
            {product.stock}
          </span>
        );
      case "version":
        return <span className="text-sm text-gray-600 dark:text-gray-300">{product.version || "—"}</span>;
      case "fileSize":
        return <span className="text-sm text-gray-600 dark:text-gray-300">{product.fileSize || "—"}</span>;
      case "actions":
        return (
          <div className="flex items-center gap-1">
            <Link href={`/software/${product.id}`} target="_blank">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/admin/software/${product.id}/edit`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-700"
              onClick={() => {
                setProductToDelete(product.id);
                setDeleteDialogOpen(true);
              }}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      default:
        return "—";
    }
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllSelection = () => {
    if (selectedProducts.size === products.length) setSelectedProducts(new Set());
    else setSelectedProducts(new Set(products.map((p) => p.id)));
  };

  const resetFilters = () => {
    setSearchQuery("");
    setModelsQuery("");
    setReferenceQuery("");
    setSelectedBrand("");
    setTypeFilter("");
    setInStockFilter(undefined);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery || modelsQuery || referenceQuery || selectedBrand || typeFilter || inStockFilter !== undefined;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-black/80 backdrop-blur-xl lg:top-0">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileCode className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Software</h1>
            {pagination && (
              <span className="text-sm text-gray-500 dark:text-gray-400">({pagination.total} total)</span>
            )}
          </div>
          <Link href="/admin/software/new">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Software</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </Link>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Filters */}
        <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search (title, brand)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="TV Model filter"
                value={modelsQuery}
                onChange={(e) => setModelsQuery(e.target.value)}
                className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
              />
              <Input
                placeholder="Reference filter"
                value={referenceQuery}
                onChange={(e) => setReferenceQuery(e.target.value)}
                className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="">All Brands</option>
                {brands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="update">Update</option>
                <option value="usb">USB</option>
                <option value="recovery">Recovery</option>
                <option value="chassis_pack">Chassis Pack</option>
              </select>
              <select
                value={inStockFilter === undefined ? "all" : inStockFilter ? "instock" : "outofstock"}
                onChange={(e) => {
                  setInStockFilter(e.target.value === "all" ? undefined : e.target.value === "instock");
                  setCurrentPage(1);
                }}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
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
        </div>

        {/* Column Picker */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {visibleColumns.size} of {ALL_COLUMNS.length} columns
          </div>
          <div className="relative" ref={columnPickerRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setColumnPickerOpen((p) => !p)}
              className="border-gray-200 dark:border-white/10 gap-2"
            >
              <Columns3 className="h-4 w-4" />
              Columns
            </Button>
            {columnPickerOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-200 dark:border-white/10">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Columns</span>
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {ALL_COLUMNS.map((col) => (
                    <button
                      key={col.key}
                      onClick={() => toggleColumn(col.key)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <span
                        className={`flex items-center justify-center w-5 h-5 rounded border ${
                          visibleColumns.has(col.key) ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 dark:border-white/20"
                        }`}
                      >
                        {visibleColumns.has(col.key) && <Check className="h-3 w-3" />}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">{col.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.size > 0 && (
          <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              {selectedProducts.size} selected
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

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</span>
            <button onClick={() => setError(null)}>
              <X className="h-4 w-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading software...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
            <FileCode className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
              {hasActiveFilters ? "No software matches your filters" : "No software found"}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button>
            ) : (
              <Link href="/admin/software/new">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Software Product
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
                          checked={products.length > 0 && selectedProducts.size === products.length}
                          onChange={toggleAllSelection}
                          className="w-4 h-4 rounded border-gray-300 dark:border-white/20"
                        />
                      </th>
                      {ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)).map((col) => (
                        <th
                          key={col.key}
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="w-4 h-4 rounded border-gray-300 dark:border-white/20"
                          />
                        </td>
                        {ALL_COLUMNS.filter((c) => visibleColumns.has(c.key)).map((col) => (
                          <td key={col.key} className="px-4 py-3">
                            {renderCellValue(product, col.key)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {pagination && pagination.totalPages > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Page {currentPage} of {pagination.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || loading}
                    className="border-gray-200 dark:border-white/10"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {productToDelete ? "Delete Software Product" : `Delete ${selectedProducts.size} Product(s)`}
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              {productToDelete
                ? "Are you sure? This cannot be undone."
                : `Are you sure you want to delete ${selectedProducts.size} selected product(s)?`
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
                if (productToDelete) handleDelete(productToDelete);
                else handleBulkDelete();
              }}
              disabled={bulkDeleteLoading}
            >
              {bulkDeleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
