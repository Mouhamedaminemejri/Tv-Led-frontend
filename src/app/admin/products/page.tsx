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
    Package,
    Columns3,
    Check,
    Download,
    Upload,
    FileDown,
    FileUp,
    FileWarning,
    CheckCircle2,
    XCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AdminService, type AdminProduct, type PaginatedResponse } from "@/services/admin-service";
import { ProductService } from "@/services/product-service";
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
    const [allSizes, setAllSizes] = React.useState<string[]>([]);
    
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
    const [modelNameQuery, setModelNameQuery] = React.useState("");
    const [referenceQuery, setReferenceQuery] = React.useState("");
    const [selectedBrand, setSelectedBrand] = React.useState("");
    const [selectedSize, setSelectedSize] = React.useState("");
    const [inStockFilter, setInStockFilter] = React.useState<boolean | undefined>(undefined);
    
    const ITEMS_PER_PAGE = 20;

    // Column visibility
    type ColumnKey = "image" | "brand" | "reference" | "title" | "price" | "salePrice" | "purchasePrice" | "stock" | "supplier" | "tvBacklightType" | "tvPanelType" | "tvSizeInch" | "stripCount" | "ledCount" | "voltage" | "length" | "rating" | "suk" | "createdAt" | "actions";

    const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
        { key: "image", label: "Image" },
        { key: "brand", label: "Brand" },
        { key: "reference", label: "Reference" },
        { key: "suk", label: "SKU" },
        { key: "title", label: "Title" },
        { key: "price", label: "Price" },
        { key: "salePrice", label: "Sale Price" },
        { key: "purchasePrice", label: "Purchase Price" },
        { key: "stock", label: "Stock" },
        { key: "supplier", label: "Supplier" },
        { key: "tvBacklightType", label: "Backlight Type" },
        { key: "tvPanelType", label: "Panel Type" },
        { key: "tvSizeInch", label: "TV Size (in)" },
        { key: "stripCount", label: "Strip Count" },
        { key: "ledCount", label: "LED Count" },
        { key: "voltage", label: "Voltage" },
        { key: "length", label: "Length" },
        { key: "rating", label: "Rating" },
        { key: "createdAt", label: "Created At" },
        { key: "actions", label: "Actions" },
    ];

    const DEFAULT_COLUMNS: ColumnKey[] = ["image", "brand", "reference", "title", "price", "stock", "actions"];

    const [visibleColumns, setVisibleColumns] = React.useState<Set<ColumnKey>>(() => new Set(DEFAULT_COLUMNS));
    const [columnPickerOpen, setColumnPickerOpen] = React.useState(false);
    const columnPickerRef = React.useRef<HTMLDivElement>(null);

    // Close column picker on outside click
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (columnPickerRef.current && !columnPickerRef.current.contains(e.target as Node)) {
                setColumnPickerOpen(false);
            }
        };
        if (columnPickerOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [columnPickerOpen]);

    const toggleColumn = (key: ColumnKey) => {
        setVisibleColumns(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const renderCellValue = (product: AdminProduct, key: ColumnKey) => {
        switch (key) {
            case "image":
                return (
                    <div className="relative w-12 h-12 bg-gray-100 dark:bg-white/10 rounded-lg overflow-hidden">
                        <Image
                            src={product.images?.[0] || '/led-product.png'}
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
            case "suk":
                return <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{(product as unknown as Record<string, unknown>).suk as string ?? "—"}</span>;
            case "title":
                return (
                    <div className="text-sm text-gray-900 dark:text-white max-w-[200px] truncate" title={product.title}>
                        {product.title}
                    </div>
                );
            case "price":
                return <span className="text-sm font-semibold text-gray-900 dark:text-white">{(product.price ?? 0).toFixed(2)} TND</span>;
            case "salePrice":
                return <span className="text-sm text-gray-600 dark:text-gray-300">{product.salePrice != null ? `${product.salePrice.toFixed(2)} TND` : "—"}</span>;
            case "purchasePrice":
                return <span className="text-sm text-gray-600 dark:text-gray-300">{product.purchasePrice != null ? `${Number(product.purchasePrice).toFixed(2)} TND` : "—"}</span>;
            case "stock":
                return (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        product.stock > 0
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                        {product.stock}
                    </span>
                );
            case "supplier":
                return <span className="text-sm text-gray-600 dark:text-gray-300">{product.supplier || "—"}</span>;
            case "tvBacklightType":
                return <span className="text-sm text-gray-600 dark:text-gray-300">{product.tvBacklightType || "—"}</span>;
            case "tvPanelType":
                return <span className="text-sm text-gray-600 dark:text-gray-300">{product.tvPanelType || "—"}</span>;
            case "tvSizeInch":
                return <span className="text-sm text-gray-600 dark:text-gray-300">{product.tvSizeInch != null ? `${product.tvSizeInch}"` : "—"}</span>;
            case "stripCount":
                return <span className="text-sm text-gray-600 dark:text-gray-300">{product.stripCount || "—"}</span>;
            case "ledCount":
                return <span className="text-sm text-gray-600 dark:text-gray-300">{product.ledCount || "—"}</span>;
            case "voltage":
                return <span className="text-sm text-gray-600 dark:text-gray-300">{product.voltage != null ? `${product.voltage}V` : "—"}</span>;
            case "length":
                return <span className="text-sm text-gray-600 dark:text-gray-300">{product.length || "—"}</span>;
            case "rating":
                return <span className="text-sm text-gray-600 dark:text-gray-300">{product.rating ?? "—"}</span>;
            case "createdAt":
                return <span className="text-sm text-gray-500 dark:text-gray-400">{product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "—"}</span>;
            case "actions":
                return (
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
                );
            default:
                return "—";
        }
    };

    // Load all brands + sizes from API on mount
    React.useEffect(() => {
        const loadMeta = async () => {
            try {
                const [brandsData, filterData] = await Promise.all([
                    ProductService.getAllBrands(),
                    ProductService.getFilterData(),
                ]);
                setBrands(brandsData.sort());
                const sizes = [...new Set(
                    filterData
                        .map((p) => p.size)
                        .filter((s): s is number => s != null && s > 0)
                )].sort((a, b) => a - b).map(String);
                setAllSizes(sizes);
            } catch (err) {
                console.error("Failed to load filter metadata:", err);
            }
        };
        loadMeta();
    }, []);

    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = React.useState("");
    const [debouncedModelName, setDebouncedModelName] = React.useState("");
    const [debouncedReference, setDebouncedReference] = React.useState("");
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setDebouncedModelName(modelNameQuery);
            setDebouncedReference(referenceQuery);
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, modelNameQuery, referenceQuery]);

    // Load products
    const loadProducts = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await AdminService.getProducts(currentPage, ITEMS_PER_PAGE, {
                search: debouncedSearch || undefined,
                modelName: debouncedModelName || undefined,
                reference: debouncedReference || undefined,
                brands: selectedBrand ? [selectedBrand] : undefined,
                sizes: selectedSize ? [Number(selectedSize)] : undefined,
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
            console.error("Error loading products:", err);
            setError(err instanceof Error ? err.message : "Failed to load products");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearch, debouncedModelName, debouncedReference, selectedBrand, selectedSize, inStockFilter]);

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
        setModelNameQuery("");
        setReferenceQuery("");
        setSelectedBrand("");
        setSelectedSize("");
        setInStockFilter(undefined);
        setCurrentPage(1);
    };

    const hasActiveFilters = searchQuery || modelNameQuery || referenceQuery || selectedBrand || selectedSize || inStockFilter !== undefined;

    // =========================================================================
    // Import / Export
    // =========================================================================
    const CSV_COLUMNS = [
        "title", "reference", "brand", "price", "salePrice", "purchasePrice",
        "stock", "supplier", "tvBacklightType", "tvPanelType", "tvSizeInch",
        "stripCount", "ledCount", "voltage", "length", "rating", "tags", "images"
    ] as const;

    const CSV_COLUMN_LABELS: Record<string, string> = {
        title: "Title*", reference: "Reference*", brand: "Brand*", price: "Price*",
        salePrice: "Sale Price", purchasePrice: "Purchase Price", stock: "Stock*",
        supplier: "Supplier", tvBacklightType: "TV Backlight Type", tvPanelType: "TV Panel Type",
        tvSizeInch: "TV Size (inch)", stripCount: "Strip Count", ledCount: "LED Count",
        voltage: "Voltage", length: "Length", rating: "Rating", tags: "Tags (comma-sep)",
        images: "Images (comma-sep)"
    };

    const [importDialogOpen, setImportDialogOpen] = React.useState(false);
    const [importFile, setImportFile] = React.useState<File | null>(null);
    const [importParsedRows, setImportParsedRows] = React.useState<Record<string, string>[]>([]);
    const [importHeaderErrors, setImportHeaderErrors] = React.useState<string[]>([]);
    const [importMissingHeaders, setImportMissingHeaders] = React.useState<string[]>([]);
    const [importExtraHeaders, setImportExtraHeaders] = React.useState<string[]>([]);
    const [importFileHeaders, setImportFileHeaders] = React.useState<string[]>([]);
    const [importStep, setImportStep] = React.useState<"upload" | "preview" | "importing" | "done">("upload");
    const [importResult, setImportResult] = React.useState<{ success: number; failed: number; errors: string[] } | null>(null);
    const [exporting, setExporting] = React.useState(false);
    const importFileRef = React.useRef<HTMLInputElement>(null);

    const escapeCsvCell = (value: string): string => {
        if (value.includes(",") || value.includes('"') || value.includes("\n")) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    };

    const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (inQuotes) {
                if (char === '"' && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else if (char === '"') {
                    inQuotes = false;
                } else {
                    current += char;
                }
            } else {
                if (char === '"') {
                    inQuotes = true;
                } else if (char === ",") {
                    result.push(current.trim());
                    current = "";
                } else {
                    current += char;
                }
            }
        }
        result.push(current.trim());
        return result;
    };

    // Download CSV template
    const handleDownloadTemplate = () => {
        const headerLabels = CSV_COLUMNS.map(c => escapeCsvCell(c));
        const exampleRow = CSV_COLUMNS.map(col => {
            switch (col) {
                case "title": return "Direct LED SAMSUNG TV 32 in";
                case "reference": return "1SA3207W";
                case "brand": return "SAMSUNG";
                case "price": return "160.00";
                case "salePrice": return "";
                case "purchasePrice": return "";
                case "stock": return "50";
                case "supplier": return "";
                case "tvBacklightType": return "Direct";
                case "tvPanelType": return "";
                case "tvSizeInch": return "32";
                case "stripCount": return "4";
                case "ledCount": return "7";
                case "voltage": return "3";
                case "length": return "";
                case "rating": return "4";
                case "tags": return "samsung,32inch,direct";
                case "images": return "http://example.com/img1.jpg,http://example.com/img2.jpg";
                default: return "";
            }
        }).map(escapeCsvCell);

        const csv = [headerLabels.join(","), exampleRow.join(",")].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "products_import_template.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    // Export products to CSV
    const handleExport = async () => {
        setExporting(true);
        try {
            // Fetch ALL products matching current filters (up to a large limit)
            const allProducts: AdminProduct[] = [];
            let page = 1;
            const limit = 100;
            let hasMore = true;
            while (hasMore) {
                const response = await AdminService.getProducts(page, limit, {
                    search: debouncedSearch || undefined,
                    modelName: debouncedModelName || undefined,
                    reference: debouncedReference || undefined,
                    brands: selectedBrand ? [selectedBrand] : undefined,
                    sizes: selectedSize ? [Number(selectedSize)] : undefined,
                    inStock: inStockFilter,
                });
                allProducts.push(...response.data);
                hasMore = page < response.totalPages;
                page++;
            }

            const headerRow = CSV_COLUMNS.map(c => escapeCsvCell(c)).join(",");
            const rows = allProducts.map(p => {
                return CSV_COLUMNS.map(col => {
                    let val = "";
                    switch (col) {
                        case "title": val = p.title || ""; break;
                        case "reference": val = p.reference || ""; break;
                        case "brand": val = p.brand || ""; break;
                        case "price": val = String(p.price ?? ""); break;
                        case "salePrice": val = p.salePrice != null ? String(p.salePrice) : ""; break;
                        case "purchasePrice": val = p.purchasePrice != null ? String(p.purchasePrice) : ""; break;
                        case "stock": val = String(p.stock ?? ""); break;
                        case "supplier": val = p.supplier || ""; break;
                        case "tvBacklightType": val = p.tvBacklightType || ""; break;
                        case "tvPanelType": val = p.tvPanelType || ""; break;
                        case "tvSizeInch": val = p.tvSizeInch != null ? String(p.tvSizeInch) : ""; break;
                        case "stripCount": val = p.stripCount || ""; break;
                        case "ledCount": val = p.ledCount || ""; break;
                        case "voltage": val = p.voltage != null ? String(p.voltage) : ""; break;
                        case "length": val = p.length || ""; break;
                        case "rating": val = String(p.rating ?? ""); break;
                        case "tags": val = (p.tags || []).join(","); break;
                        case "images": val = (p.images || []).join(","); break;
                    }
                    return escapeCsvCell(val);
                }).join(",");
            });

            const csv = [headerRow, ...rows].join("\n");
            const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `products_export_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export failed:", err);
            setError(err instanceof Error ? err.message : "Export failed");
        } finally {
            setExporting(false);
        }
    };

    // Parse uploaded CSV file
    const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportFile(file);
        setImportHeaderErrors([]);
        setImportMissingHeaders([]);
        setImportExtraHeaders([]);
        setImportParsedRows([]);
        setImportFileHeaders([]);
        setImportResult(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
            if (lines.length < 1) {
                setImportHeaderErrors(["File is empty."]);
                return;
            }

            const fileHeaders = parseCsvLine(lines[0]).map(h => h.trim());
            setImportFileHeaders(fileHeaders);

            // Validate headers
            const requiredCols = ["title", "reference", "brand", "price", "stock"];
            const missing = requiredCols.filter(r => !fileHeaders.includes(r));
            const known = CSV_COLUMNS as readonly string[];
            const extra = fileHeaders.filter(h => h !== "" && !known.includes(h));

            setImportMissingHeaders(missing);
            setImportExtraHeaders(extra);

            if (missing.length > 0) {
                setImportHeaderErrors([`Missing required columns: ${missing.join(", ")}`]);
                setImportStep("preview");
                return;
            }

            // Parse data rows
            const rows = lines.slice(1).map(line => {
                const values = parseCsvLine(line);
                const row: Record<string, string> = {};
                fileHeaders.forEach((header, i) => {
                    row[header] = values[i] || "";
                });
                return row;
            });

            setImportParsedRows(rows);
            setImportStep("preview");
        };
        reader.readAsText(file);
    };

    // Submit import
    const handleImportSubmit = async () => {
        if (importParsedRows.length === 0 || importMissingHeaders.length > 0) return;
        setImportStep("importing");

        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        for (let i = 0; i < importParsedRows.length; i++) {
            const row = importParsedRows[i];
            try {
                const productData: Record<string, unknown> = {};
                for (const col of CSV_COLUMNS) {
                    const val = row[col];
                    if (val === undefined || val === "") continue;
                    switch (col) {
                        case "price":
                        case "salePrice":
                        case "purchasePrice":
                        case "voltage":
                        case "rating":
                        case "tvSizeInch":
                            productData[col] = parseFloat(val) || 0;
                            break;
                        case "stock":
                            productData[col] = parseInt(val) || 0;
                            break;
                        case "tags":
                            productData[col] = val.split(",").map(t => t.trim()).filter(Boolean);
                            break;
                        case "images":
                            productData[col] = val.split(",").map(u => u.trim()).filter(Boolean);
                            break;
                        default:
                            productData[col] = val;
                    }
                }

                await AdminService.createProduct(productData as unknown as Parameters<typeof AdminService.createProduct>[0]);
                success++;
            } catch (err) {
                failed++;
                errors.push(`Row ${i + 1} (${row.reference || row.title || "?"}): ${err instanceof Error ? err.message : "Unknown error"}`);
            }
        }

        setImportResult({ success, failed, errors });
        setImportStep("done");
        if (success > 0) loadProducts();
    };

    const resetImport = () => {
        setImportFile(null);
        setImportParsedRows([]);
        setImportHeaderErrors([]);
        setImportMissingHeaders([]);
        setImportExtraHeaders([]);
        setImportFileHeaders([]);
        setImportStep("upload");
        setImportResult(null);
        if (importFileRef.current) importFileRef.current.value = "";
    };

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
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadTemplate}
                            className="border-gray-200 dark:border-white/10 hidden lg:inline-flex"
                            title="Download CSV template"
                        >
                            <FileDown className="h-4 w-4 mr-2" />
                            Template
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { resetImport(); setImportDialogOpen(true); }}
                            className="border-gray-200 dark:border-white/10"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Import</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            disabled={exporting}
                            className="border-gray-200 dark:border-white/10"
                        >
                            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                            <span className="hidden sm:inline">Export</span>
                        </Button>
                        <Link href="/admin/products/new">
                            <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                                <Plus className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Add Product</span>
                                <span className="sm:hidden">Add</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Filters */}
                <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search products (title/brand)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                placeholder="Search by model name (e.g. Crystal UHD 55)"
                                value={modelNameQuery}
                                onChange={(e) => setModelNameQuery(e.target.value)}
                                className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                            />
                            <Input
                                placeholder="Search by reference / internal SKU (e.g. 1LG5558)"
                                value={referenceQuery}
                                onChange={(e) => setReferenceQuery(e.target.value)}
                                className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
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
                                value={selectedSize}
                                onChange={(e) => {
                                    setSelectedSize(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-white [&>option]:dark:bg-gray-900 [&>option]:text-gray-900 [&>option]:dark:text-white"
                            >
                                <option value="">All Sizes</option>
                                {allSizes.map(size => (
                                    <option key={size} value={size}>{size}&quot;</option>
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
                </div>

                {/* Column Visibility Picker */}
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {visibleColumns.size} of {ALL_COLUMNS.length} columns visible
                    </div>
                    <div className="relative" ref={columnPickerRef}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setColumnPickerOpen(prev => !prev)}
                            className="border-gray-200 dark:border-white/10 gap-2"
                        >
                            <Columns3 className="h-4 w-4" />
                            Columns
                        </Button>
                        {columnPickerOpen && (
                            <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden">
                                <div className="px-3 py-2 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Toggle Columns</span>
                                    <button
                                        onClick={() => setVisibleColumns(new Set(DEFAULT_COLUMNS))}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Reset
                                    </button>
                                </div>
                                <div className="max-h-80 overflow-y-auto py-1">
                                    {ALL_COLUMNS.map(col => (
                                        <button
                                            key={col.key}
                                            onClick={() => toggleColumn(col.key)}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                        >
                                            <span className={`flex items-center justify-center w-5 h-5 rounded border ${
                                                visibleColumns.has(col.key)
                                                    ? "bg-blue-600 border-blue-600 text-white"
                                                    : "border-gray-300 dark:border-white/20"
                                            }`}>
                                                {visibleColumns.has(col.key) && <Check className="h-3 w-3" />}
                                            </span>
                                            <span className="text-gray-700 dark:text-gray-300">{col.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="px-3 py-2 border-t border-gray-200 dark:border-white/10 flex gap-2">
                                    <button
                                        onClick={() => setVisibleColumns(new Set(ALL_COLUMNS.map(c => c.key)))}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Select All
                                    </button>
                                    <span className="text-gray-300 dark:text-gray-600">|</span>
                                    <button
                                        onClick={() => setVisibleColumns(new Set(["actions"]))}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Deselect All
                                    </button>
                                </div>
                            </div>
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
                                            {ALL_COLUMNS.filter(c => visibleColumns.has(c.key)).map(col => (
                                                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                                    {col.label}
                                                </th>
                                            ))}
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
                                                {ALL_COLUMNS.filter(c => visibleColumns.has(c.key)).map(col => (
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

                        {/* Pagination */}
                        {pagination && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-4">
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Showing <span className="font-medium text-gray-900 dark:text-white">{pagination.total > 0 ? ((currentPage - 1) * ITEMS_PER_PAGE) + 1 : 0}</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, pagination.total)}</span> of <span className="font-medium text-gray-900 dark:text-white">{pagination.total}</span> products
                                    </div>
                                    <div className="text-sm text-gray-400 dark:text-gray-500">
                                        Page {currentPage} of {pagination.totalPages}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1 || loading}
                                        className="border-gray-200 dark:border-white/10 hidden sm:inline-flex"
                                    >
                                        First
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1 || loading}
                                        className="border-gray-200 dark:border-white/10"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Prev
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {(() => {
                                            const pages: number[] = [];
                                            const total = pagination.totalPages;
                                            if (total <= 7) {
                                                for (let i = 1; i <= total; i++) pages.push(i);
                                            } else {
                                                pages.push(1);
                                                if (currentPage > 3) pages.push(-1); // ellipsis
                                                const start = Math.max(2, currentPage - 1);
                                                const end = Math.min(total - 1, currentPage + 1);
                                                for (let i = start; i <= end; i++) pages.push(i);
                                                if (currentPage < total - 2) pages.push(-2); // ellipsis
                                                pages.push(total);
                                            }
                                            return pages.map((pageNum, idx) => {
                                                if (pageNum < 0) {
                                                    return (
                                                        <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 dark:text-gray-500 text-sm select-none">
                                                            ...
                                                        </span>
                                                    );
                                                }
                                                return (
                                                    <Button
                                                        key={`page-${pageNum}`}
                                                        variant={currentPage === pageNum ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        disabled={loading}
                                                        className={`min-w-[36px] ${currentPage === pageNum ? "bg-blue-600 hover:bg-blue-500 text-white" : "border-gray-200 dark:border-white/10"}`}
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                );
                                            });
                                        })()}
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
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(pagination.totalPages)}
                                        disabled={currentPage === pagination.totalPages || loading}
                                        className="border-gray-200 dark:border-white/10 hidden sm:inline-flex"
                                    >
                                        Last
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

            {/* Import Dialog */}
            <Dialog open={importDialogOpen} onOpenChange={(open) => { setImportDialogOpen(open); if (!open) resetImport(); }}>
                <DialogContent className="max-w-3xl w-[95vw] bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10 max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                            <FileUp className="h-5 w-5 text-blue-600" />
                            Import Products from CSV
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 dark:text-gray-400">
                            Upload a CSV file to bulk-import products. Download the template first to see the expected format.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-4 py-2">
                        {/* Step: Upload */}
                        {importStep === "upload" && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="border-gray-200 dark:border-white/10">
                                        <FileDown className="h-4 w-4 mr-2" />
                                        Download Template
                                    </Button>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">CSV with example row</span>
                                </div>

                                <div
                                    className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
                                    onClick={() => importFileRef.current?.click()}
                                >
                                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                                        Click to select a CSV file, or drag &amp; drop
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">Supports .csv files</p>
                                    <input
                                        ref={importFileRef}
                                        type="file"
                                        accept=".csv,text/csv"
                                        onChange={handleImportFileChange}
                                        className="hidden"
                                    />
                                </div>

                                {/* Expected headers reference */}
                                <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4 border border-gray-200 dark:border-white/10">
                                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Expected Headers</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {CSV_COLUMNS.map(col => (
                                            <span
                                                key={col}
                                                className={`text-xs px-2 py-1 rounded-md ${
                                                    ["title", "reference", "brand", "price", "stock"].includes(col)
                                                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                                                        : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400"
                                                }`}
                                            >
                                                {col}{["title", "reference", "brand", "price", "stock"].includes(col) ? "*" : ""}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">* = required columns</p>
                                </div>
                            </div>
                        )}

                        {/* Step: Preview */}
                        {importStep === "preview" && (
                            <div className="space-y-4">
                                {/* File info */}
                                <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 rounded-lg p-3 border border-gray-200 dark:border-white/10">
                                    <FileUp className="h-5 w-5 text-gray-400" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{importFile?.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{importParsedRows.length} row(s) found &middot; {importFileHeaders.length} column(s)</p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={resetImport}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Header validation */}
                                {importMissingHeaders.length > 0 && (
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                            <span className="text-sm font-medium text-red-700 dark:text-red-300">Missing Required Headers</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {importMissingHeaders.map(h => (
                                                <span key={h} className="text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-mono">{h}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {importExtraHeaders.length > 0 && (
                                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileWarning className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Unknown Headers (will be ignored)</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {importExtraHeaders.map(h => (
                                                <span key={h} className="text-xs px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-mono">{h}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {importMissingHeaders.length === 0 && importExtraHeaders.length === 0 && (
                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        <span className="text-sm text-green-700 dark:text-green-300">All headers match perfectly!</span>
                                    </div>
                                )}

                                {/* Matched headers */}
                                <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-3 border border-gray-200 dark:border-white/10">
                                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Column Mapping</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {importFileHeaders.map(h => {
                                            const isKnown = (CSV_COLUMNS as readonly string[]).includes(h);
                                            const isRequired = ["title", "reference", "brand", "price", "stock"].includes(h);
                                            return (
                                                <span
                                                    key={h}
                                                    className={`text-xs px-2 py-1 rounded-md flex items-center gap-1 ${
                                                        !isKnown
                                                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 line-through"
                                                            : isRequired
                                                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                                                                : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                                    }`}
                                                >
                                                    {isKnown && <Check className="h-3 w-3" />}
                                                    {h}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Data preview table */}
                                {importParsedRows.length > 0 && importMissingHeaders.length === 0 && (
                                    <div className="border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
                                        <div className="px-3 py-2 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                                Data Preview (first {Math.min(5, importParsedRows.length)} of {importParsedRows.length} rows)
                                            </span>
                                        </div>
                                        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                                            <table className="w-full text-xs">
                                                <thead className="bg-gray-50 dark:bg-white/5 sticky top-0">
                                                    <tr>
                                                        <th className="px-2 py-1.5 text-left text-gray-500 dark:text-gray-400 font-semibold">#</th>
                                                        {importFileHeaders.filter(h => (CSV_COLUMNS as readonly string[]).includes(h)).map(h => (
                                                            <th key={h} className="px-2 py-1.5 text-left text-gray-500 dark:text-gray-400 font-semibold whitespace-nowrap">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                                    {importParsedRows.slice(0, 5).map((row, i) => (
                                                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                                            <td className="px-2 py-1.5 text-gray-400">{i + 1}</td>
                                                            {importFileHeaders.filter(h => (CSV_COLUMNS as readonly string[]).includes(h)).map(h => (
                                                                <td key={h} className="px-2 py-1.5 text-gray-700 dark:text-gray-300 max-w-[150px] truncate" title={row[h]}>
                                                                    {row[h] || <span className="text-gray-300 dark:text-gray-600">—</span>}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step: Importing */}
                        {importStep === "importing" && (
                            <div className="text-center py-10">
                                <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-300 font-medium">Importing products...</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">This may take a moment for large files</p>
                            </div>
                        )}

                        {/* Step: Done */}
                        {importStep === "done" && importResult && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 justify-center py-4">
                                    {importResult.success > 0 && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            <span className="text-sm font-medium text-green-700 dark:text-green-300">{importResult.success} imported</span>
                                        </div>
                                    )}
                                    {importResult.failed > 0 && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                            <span className="text-sm font-medium text-red-700 dark:text-red-300">{importResult.failed} failed</span>
                                        </div>
                                    )}
                                </div>

                                {importResult.errors.length > 0 && (
                                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-3">
                                        <h4 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">Errors</h4>
                                        <div className="max-h-[200px] overflow-y-auto space-y-1">
                                            {importResult.errors.map((err, i) => (
                                                <p key={i} className="text-xs text-red-600 dark:text-red-400 font-mono">{err}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="border-t border-gray-200 dark:border-white/10 pt-4">
                        {importStep === "upload" && (
                            <Button variant="outline" onClick={() => setImportDialogOpen(false)} className="border-gray-200 dark:border-white/10">
                                Cancel
                            </Button>
                        )}
                        {importStep === "preview" && (
                            <>
                                <Button variant="outline" onClick={resetImport} className="border-gray-200 dark:border-white/10">
                                    Back
                                </Button>
                                <Button
                                    onClick={handleImportSubmit}
                                    disabled={importMissingHeaders.length > 0 || importParsedRows.length === 0}
                                    className="bg-blue-600 hover:bg-blue-500 text-white"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import {importParsedRows.length} Product{importParsedRows.length !== 1 ? "s" : ""}
                                </Button>
                            </>
                        )}
                        {importStep === "done" && (
                            <Button onClick={() => { setImportDialogOpen(false); resetImport(); }} className="bg-blue-600 hover:bg-blue-500 text-white">
                                Done
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
