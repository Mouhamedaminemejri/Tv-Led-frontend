"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Upload, Plus, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import Image from "next/image";
import { ProductService } from "@/services/product-service";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";

interface ProductFormData {
    number: string;
    reference: string;
    brand: string;
    title: string;
    purchasePrice: string;
    supplier: string;
    salePrice: string;
    price: string;
    tvBacklightType: string;
    tvPanelType: string;
    tvSizeInch: string;
    stripCount: string;
    ledCount: string;
    voltage: string;
    length: string;
    stock: string;
    rating: string;
    config: string;
    images: string[];
    tags: string[];
}

interface ProductFormProps {
    initialData?: Partial<ProductFormData>;
    onSubmit: (data: any) => Promise<void>;
    isLoading?: boolean;
    submitButton?: React.ReactNode;
}

export function ProductForm({ initialData, onSubmit, isLoading = false, submitButton }: ProductFormProps) {
    const [formData, setFormData] = React.useState<ProductFormData>({
        number: initialData?.number || "",
        reference: initialData?.reference || "",
        brand: initialData?.brand || "",
        title: initialData?.title || "",
        purchasePrice: initialData?.purchasePrice || "",
        supplier: initialData?.supplier || "",
        salePrice: initialData?.salePrice || "",
        price: initialData?.price || "",
        tvBacklightType: initialData?.tvBacklightType || "",
        tvPanelType: initialData?.tvPanelType || "",
        tvSizeInch: initialData?.tvSizeInch || "",
        stripCount: initialData?.stripCount || "",
        ledCount: initialData?.ledCount || "",
        voltage: initialData?.voltage || "",
        length: initialData?.length || "",
        stock: initialData?.stock || "",
        rating: initialData?.rating || "0",
        config: initialData?.config || "",
        images: initialData?.images || [],
        tags: initialData?.tags || [],
    });

    const [newTag, setNewTag] = React.useState("");
    const [uploadingImages, setUploadingImages] = React.useState(false);
    const [validationError, setValidationError] = React.useState<string | null>(null);
    const [brandOptions, setBrandOptions] = React.useState<string[]>([]);
    const [backlightTypeOptions, setBacklightTypeOptions] = React.useState<string[]>(["Direct LED", "Edge LED"]);
    const [supplierOptions, setSupplierOptions] = React.useState<string[]>([]);
    const [showAddSupplier, setShowAddSupplier] = React.useState(false);
    const [newSupplierName, setNewSupplierName] = React.useState("");
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Image preview dialog
    const [previewOpen, setPreviewOpen] = React.useState(false);
    const [previewIndex, setPreviewIndex] = React.useState(0);

    const openPreview = (index: number) => {
        setPreviewIndex(index);
        setPreviewOpen(true);
    };

    const prevImage = () => {
        setPreviewIndex(prev => (prev - 1 + formData.images.length) % formData.images.length);
    };

    const nextImage = () => {
        setPreviewIndex(prev => (prev + 1) % formData.images.length);
    };

    // Load dropdown options from API
    React.useEffect(() => {
        ProductService.getAllBrands()
            .then((brands) => setBrandOptions(brands.sort()))
            .catch(() => {});
        ProductService.getFilterData()
            .then((items) => {
                const types = new Set<string>(["Direct LED", "Edge LED"]);
                for (const item of items) {
                    const t = (item as Record<string, unknown>).tvBacklightType;
                    if (typeof t === "string" && t.trim()) types.add(t.trim());
                }
                setBacklightTypeOptions(Array.from(types).sort());
            })
            .catch(() => {});
        // Load unique suppliers from products
        ProductService.getPaginatedProducts(1, 500, {})
            .then((res) => {
                const suppliers = new Set<string>();
                for (const p of res.products) {
                    const s = (p as Record<string, unknown>).supplier;
                    if (typeof s === "string" && s.trim()) suppliers.add(s.trim());
                }
                // Also load from localStorage (user-added suppliers)
                try {
                    const saved = JSON.parse(localStorage.getItem("custom_suppliers") || "[]") as string[];
                    for (const s of saved) if (s.trim()) suppliers.add(s.trim());
                } catch { /* ignore */ }
                setSupplierOptions(Array.from(suppliers).sort());
            })
            .catch(() => {
                // At least load custom suppliers from localStorage
                try {
                    const saved = JSON.parse(localStorage.getItem("custom_suppliers") || "[]") as string[];
                    setSupplierOptions(saved.sort());
                } catch { /* ignore */ }
            });
    }, []);

    const handleAddSupplier = () => {
        const name = newSupplierName.trim();
        if (!name) return;
        if (supplierOptions.includes(name)) {
            // Already exists — just select it
            handleInputChange("supplier", name);
            setShowAddSupplier(false);
            setNewSupplierName("");
            return;
        }
        const updated = [...supplierOptions, name].sort();
        setSupplierOptions(updated);
        handleInputChange("supplier", name);
        // Persist to localStorage so it appears next time
        try {
            const saved = JSON.parse(localStorage.getItem("custom_suppliers") || "[]") as string[];
            if (!saved.includes(name)) {
                localStorage.setItem("custom_suppliers", JSON.stringify([...saved, name]));
            }
        } catch { /* ignore */ }
        setShowAddSupplier(false);
        setNewSupplierName("");
    };

    const handleDeleteSupplier = (name: string) => {
        const updated = supplierOptions.filter(s => s !== name);
        setSupplierOptions(updated);
        if (formData.supplier === name) handleInputChange("supplier", "");
        // Remove from localStorage
        try {
            const saved = JSON.parse(localStorage.getItem("custom_suppliers") || "[]") as string[];
            localStorage.setItem("custom_suppliers", JSON.stringify(saved.filter(s => s !== name)));
        } catch { /* ignore */ }
    };

    const handleInputChange = (field: keyof ProductFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
            setNewTag("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
    };

    const handleAddImageUrl = () => {
        const url = prompt("Enter image URL:");
        if (url && url.trim()) {
            setFormData(prev => ({ ...prev, images: [...prev.images, url.trim()] }));
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingImages(true);
        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch('http://localhost:3001/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`Failed to upload ${file.name}`);
                }

                const data = await response.json();
                return data.url || data.path || data.imageUrl; // Handle different response formats
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
        } catch (error) {
            console.error("Error uploading images:", error);
            alert(`Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setUploadingImages(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveImage = (index: number) => {
        setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    };

    const handleImageUrlChange = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.map((img, i) => i === index ? value : img)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        const priceValue = Number(formData.price);
        if (!Number.isFinite(priceValue) || priceValue <= 0) {
            setValidationError("Price must be greater than 0.");
            return;
        }

        const ratingValue = formData.rating === "" ? 0 : Number(formData.rating);
        if (!Number.isFinite(ratingValue) || ratingValue < 0 || ratingValue > 5) {
            setValidationError("Rating must be between 0 and 5.");
            return;
        }

        if (formData.config.trim()) {
            try {
                JSON.parse(formData.config);
            } catch {
                setValidationError("Config must be a valid JSON string.");
                return;
            }
        }

        // Convert form data to API format
        const apiData = {
            number: formData.number || null,
            reference: formData.reference,
            brand: formData.brand,
            title: formData.title,
            purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : undefined,
            supplier: formData.supplier,
            salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
            price: priceValue,
            tvBacklightType: formData.tvBacklightType || undefined,
            tvPanelType: formData.tvPanelType || undefined,
            tvSizeInch: formData.tvSizeInch ? Number(formData.tvSizeInch) : undefined,
            stripCount: formData.stripCount || undefined,
            ledCount: formData.ledCount || undefined,
            voltage: formData.voltage ? Number(formData.voltage) : undefined,
            length: formData.length || undefined,
            stock: parseInt(formData.stock) || 0,
            rating: ratingValue,
            config: formData.config.trim() || undefined,
            images: formData.images.filter(img => img.trim() !== ""),
            tags: formData.tags,
        };

        await onSubmit(apiData as any);
    };

    return (
        <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            {validationError && (
                <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    {validationError}
                </div>
            )}
            {/* Basic Information */}
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="reference" className="text-gray-900 dark:text-white">Reference *</Label>
                        <Input
                            id="reference"
                            value={formData.reference}
                            onChange={(e) => handleInputChange("reference", e.target.value)}
                            className="mt-1 bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                            placeholder="e.g., 3HI43DB"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="brand" className="text-gray-900 dark:text-white">Brand *</Label>
                        <select
                            id="brand"
                            value={formData.brand}
                            onChange={(e) => handleInputChange("brand", e.target.value)}
                            className="mt-1 flex h-10 w-full rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-black px-3 py-2 text-sm text-gray-900 dark:text-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            required
                        >
                            <option value="">Select brand...</option>
                            {brandOptions.map((brand) => (
                                <option key={brand} value={brand}>{brand}</option>
                            ))}
                            {formData.brand && !brandOptions.includes(formData.brand) && (
                                <option value={formData.brand}>{formData.brand}</option>
                            )}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="title" className="text-gray-900 dark:text-white">Title *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => handleInputChange("title", e.target.value)}
                            className="mt-1 bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                            placeholder="Product title"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pricing & Inventory</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="purchasePrice" className="text-gray-900 dark:text-white">Purchase Price</Label>
                        <Input
                            id="purchasePrice"
                            type="number"
                            step="0.01"
                            value={formData.purchasePrice}
                            onChange={(e) => handleInputChange("purchasePrice", e.target.value)}
                            className="mt-1 bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <Label htmlFor="salePrice" className="text-gray-900 dark:text-white">Sale Price</Label>
                        <Input
                            id="salePrice"
                            type="number"
                            step="0.01"
                            value={formData.salePrice}
                            onChange={(e) => handleInputChange("salePrice", e.target.value)}
                            className="mt-1 bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <Label htmlFor="price" className="text-gray-900 dark:text-white">Price *</Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={formData.price}
                            onChange={(e) => handleInputChange("price", e.target.value)}
                            className="mt-1 bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                            placeholder="0.00"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="stock" className="text-gray-900 dark:text-white">Stock *</Label>
                        <Input
                            id="stock"
                            type="number"
                            value={formData.stock}
                            onChange={(e) => handleInputChange("stock", e.target.value)}
                            className="mt-1 bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                            placeholder="0"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="tvSizeInch" className="text-gray-900 dark:text-white">TV Size (inches)</Label>
                        <Input
                            id="tvSizeInch"
                            type="number"
                            value={formData.tvSizeInch}
                            onChange={(e) => handleInputChange("tvSizeInch", e.target.value)}
                            className="mt-1 bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                            placeholder="e.g., 43"
                        />
                    </div>
                    <div>
                        <Label htmlFor="rating" className="text-gray-900 dark:text-white">Rating</Label>
                        <Input
                            id="rating"
                            type="number"
                            min="0"
                            max="5"
                            value={formData.rating}
                            onChange={(e) => handleInputChange("rating", e.target.value)}
                            className="mt-1 bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                            placeholder="0-5"
                        />
                    </div>
                </div>
            </div>

            {/* Additional Information */}
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="number" className="text-gray-900 dark:text-white">Product Number</Label>
                        <Input
                            id="number"
                            value={formData.number}
                            onChange={(e) => handleInputChange("number", e.target.value)}
                            className="mt-1 bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                            placeholder="e.g., 101A"
                        />
                    </div>
                    <div>
                        <Label htmlFor="supplier" className="text-gray-900 dark:text-white">Supplier</Label>
                        {!showAddSupplier ? (
                            <div className="flex gap-1.5 mt-1">
                                <select
                                    id="supplier"
                                    value={formData.supplier}
                                    onChange={(e) => {
                                        if (e.target.value === "__add_new__") {
                                            setShowAddSupplier(true);
                                        } else {
                                            handleInputChange("supplier", e.target.value);
                                        }
                                    }}
                                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-black px-3 py-2 text-sm text-gray-900 dark:text-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value="">Select supplier...</option>
                                    {supplierOptions.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                    {formData.supplier && !supplierOptions.includes(formData.supplier) && (
                                        <option value={formData.supplier}>{formData.supplier}</option>
                                    )}
                                    <option value="__add_new__">+ Add new supplier...</option>
                                </select>
                                {formData.supplier && (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteSupplier(formData.supplier)}
                                        className="flex-shrink-0 h-10 w-10 rounded-md border border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors"
                                        title="Remove this supplier from the list"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex gap-1.5 mt-1">
                                <Input
                                    value={newSupplierName}
                                    onChange={(e) => setNewSupplierName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSupplier(); } }}
                                    className="bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                                    placeholder="New supplier name..."
                                    autoFocus
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleAddSupplier}
                                    className="h-10 px-3 bg-blue-600 hover:bg-blue-500 text-white flex-shrink-0"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => { setShowAddSupplier(false); setNewSupplierName(""); }}
                                    className="h-10 px-3 flex-shrink-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="tvBacklightType" className="text-gray-900 dark:text-white">TV Backlight Type</Label>
                        <select
                            id="tvBacklightType"
                            value={formData.tvBacklightType}
                            onChange={(e) => handleInputChange("tvBacklightType", e.target.value)}
                            className="mt-1 flex h-10 w-full rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-black px-3 py-2 text-sm text-gray-900 dark:text-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="">Select type...</option>
                            {backlightTypeOptions.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                            {formData.tvBacklightType && !backlightTypeOptions.includes(formData.tvBacklightType) && (
                                <option value={formData.tvBacklightType}>{formData.tvBacklightType}</option>
                            )}
                        </select>
                    </div>
                    <div>
                        <Label htmlFor="tvPanelType" className="text-gray-900 dark:text-white">TV Panel Type</Label>
                        <Input
                            id="tvPanelType"
                            value={formData.tvPanelType}
                            onChange={(e) => handleInputChange("tvPanelType", e.target.value)}
                            className="mt-1 bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                            placeholder="e.g., IPS"
                        />
                    </div>
                    <div>
                        <Label htmlFor="stripCount" className="text-gray-900 dark:text-white">Strip Count</Label>
                        <Input
                            id="stripCount"
                            value={formData.stripCount}
                            onChange={(e) => handleInputChange("stripCount", e.target.value)}
                            className="mt-1 bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                            placeholder="e.g., 8"
                        />
                    </div>
                    <div>
                        <Label htmlFor="ledCount" className="text-gray-900 dark:text-white">LED Count</Label>
                        <Input
                            id="ledCount"
                            value={formData.ledCount}
                            onChange={(e) => handleInputChange("ledCount", e.target.value)}
                            className="mt-1 bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                            placeholder="e.g., 96"
                        />
                    </div>
                    <div>
                        <Label htmlFor="voltage" className="text-gray-900 dark:text-white">Voltage</Label>
                        <Input
                            id="voltage"
                            type="number"
                            step="0.01"
                            value={formData.voltage}
                            onChange={(e) => handleInputChange("voltage", e.target.value)}
                            className="mt-1 bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                            placeholder="e.g., 12"
                        />
                    </div>
                    <div>
                        <Label htmlFor="length" className="text-gray-900 dark:text-white">Length</Label>
                        <Input
                            id="length"
                            value={formData.length}
                            onChange={(e) => handleInputChange("length", e.target.value)}
                            className="mt-1 bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                            placeholder="e.g., 1200mm"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="config" className="text-gray-900 dark:text-white">Config (JSON string)</Label>
                            <select
                                value=""
                                onChange={(e) => {
                                    if (e.target.value) {
                                        handleInputChange("config", e.target.value);
                                    }
                                }}
                                className="text-xs border border-gray-300 dark:border-white/10 bg-white dark:bg-black text-gray-600 dark:text-gray-400 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Load template...</option>
                                <option value='{"discountedPrice":0,"deliveryMethods":[],"estimatedDeliveryGapHours":48}'>
                                    Standard (delivery + discount)
                                </option>
                                <option value='{"discountedPrice":0,"deliveryMethods":["express","standard"],"estimatedDeliveryGapHours":24}'>
                                    Express delivery
                                </option>
                                <option value='{"discountedPrice":0,"deliveryMethods":[],"estimatedDeliveryGapHours":0}'>
                                    Minimal (empty)
                                </option>
                            </select>
                        </div>
                        <Textarea
                            id="config"
                            value={formData.config}
                            onChange={(e) => handleInputChange("config", e.target.value)}
                            className="mt-1 bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white font-mono text-xs"
                            placeholder='e.g., {"discountedPrice":79.9,"deliveryMethods":[]}'
                            rows={4}
                        />
                    </div>
                </div>
            </div>

            {/* Images */}
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Images</h2>
                    <div className="flex items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                            id="image-upload"
                            disabled={uploadingImages}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            className="border-gray-300 dark:border-white/10"
                            disabled={uploadingImages}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadingImages ? "Uploading..." : "Upload Images"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddImageUrl}
                            className="border-gray-300 dark:border-white/10"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Image URL
                        </Button>
                    </div>
                </div>
                <div className="space-y-4">
                    {formData.images.map((image, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => openPreview(index)}
                                className="relative w-24 h-24 bg-gray-100 dark:bg-white/10 rounded-lg overflow-hidden flex-shrink-0 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                <Image
                                    src={image || '/led-product.png'}
                                    alt={`Product image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                    <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </button>
                            <div className="flex-1">
                                <Input
                                    value={image}
                                    onChange={(e) => handleImageUrlChange(index, e.target.value)}
                                    className="bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                                    placeholder="Image URL"
                                />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveImage(index)}
                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {formData.images.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                            No images added. Click "Add Image URL" to add images.
                        </p>
                    )}
                </div>

                {/* Image Preview Dialog */}
                <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                    <DialogContent className="max-w-4xl w-[95vw] p-0 bg-black/95 border-white/10 overflow-hidden">
                        <DialogTitle className="sr-only">Image Preview</DialogTitle>
                        <div className="relative flex flex-col items-center">
                            {/* Close button */}
                            <button
                                type="button"
                                onClick={() => setPreviewOpen(false)}
                                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <X className="h-5 w-5 text-white" />
                            </button>

                            {/* Image counter */}
                            <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full bg-white/10 text-white text-sm">
                                {previewIndex + 1} / {formData.images.length}
                            </div>

                            {/* Main image */}
                            <div className="relative w-full" style={{ minHeight: "60vh" }}>
                                {formData.images[previewIndex] && (
                                    <Image
                                        src={formData.images[previewIndex]}
                                        alt={`Preview ${previewIndex + 1}`}
                                        fill
                                        className="object-contain"
                                        sizes="95vw"
                                    />
                                )}
                            </div>

                            {/* Navigation arrows */}
                            {formData.images.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={prevImage}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/25 transition-colors"
                                    >
                                        <ChevronLeft className="h-6 w-6 text-white" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={nextImage}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/25 transition-colors"
                                    >
                                        <ChevronRight className="h-6 w-6 text-white" />
                                    </button>
                                </>
                            )}

                            {/* Thumbnail strip */}
                            {formData.images.length > 1 && (
                                <div className="flex items-center gap-2 p-3 overflow-x-auto w-full justify-center bg-black/50">
                                    {formData.images.map((img, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setPreviewIndex(i)}
                                            className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                                                i === previewIndex
                                                    ? "border-blue-500 ring-2 ring-blue-500/30"
                                                    : "border-transparent opacity-60 hover:opacity-100"
                                            }`}
                                        >
                                            <Image
                                                src={img || '/led-product.png'}
                                                alt={`Thumb ${i + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Tags */}
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tags</h2>
                <div className="flex gap-2 mb-4">
                    <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag();
                            }
                        }}
                        className="bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                        placeholder="Add a tag"
                    />
                    <Button
                        type="button"
                        onClick={handleAddTag}
                        className="bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-500 text-white"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-gray-200 dark:bg-white/10 rounded-full text-sm text-gray-900 dark:text-white"
                        >
                            {tag}
                            <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:text-red-600 dark:hover:text-red-400"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                    {formData.tags.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No tags added yet.</p>
                    )}
                </div>
            </div>

            {submitButton && (
                <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-white/10">
                    {submitButton}
                </div>
            )}
        </form>
    );
}

