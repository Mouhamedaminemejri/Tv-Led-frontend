"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Upload, Plus } from "lucide-react";
import Image from "next/image";

interface ProductFormData {
    number: string;
    reference: string;
    brand: string;
    title: string;
    summary: string;
    purchasePrice: string;
    supplier: string;
    salePrice: string;
    price: string;
    description: string;
    size: string;
    stock: string;
    rating: string;
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
        summary: initialData?.summary || "",
        purchasePrice: initialData?.purchasePrice || "",
        supplier: initialData?.supplier || "",
        salePrice: initialData?.salePrice || "",
        price: initialData?.price || "",
        description: initialData?.description || "",
        size: initialData?.size || "",
        stock: initialData?.stock || "",
        rating: initialData?.rating || "0",
        images: initialData?.images || [],
        tags: initialData?.tags || [],
    });

    const [newTag, setNewTag] = React.useState("");
    const [imageUrls, setImageUrls] = React.useState<string[]>(formData.images);
    const [uploadingImages, setUploadingImages] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Update imageUrls when formData.images changes
    React.useEffect(() => {
        setImageUrls(formData.images);
    }, [formData.images]);

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
        
        // Convert form data to API format
        const apiData = {
            number: formData.number || null,
            reference: formData.reference,
            brand: formData.brand,
            title: formData.title,
            summary: formData.summary || null,
            purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
            supplier: formData.supplier || null,
            salePrice: parseFloat(formData.salePrice) || 0,
            price: parseFloat(formData.price) || 0,
            description: formData.description || null,
            size: formData.size ? parseFloat(formData.size) : null,
            stock: parseInt(formData.stock) || 0,
            rating: parseInt(formData.rating) || 0,
            images: formData.images.filter(img => img.trim() !== ""),
            tags: formData.tags,
        };

        await onSubmit(apiData as any);
    };

    return (
        <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
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
                        <Input
                            id="brand"
                            value={formData.brand}
                            onChange={(e) => handleInputChange("brand", e.target.value)}
                            className="mt-1 bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                            placeholder="e.g., Samsung"
                            required
                        />
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
                    <div className="md:col-span-2">
                        <Label htmlFor="summary" className="text-gray-900 dark:text-white">Summary</Label>
                        <Textarea
                            id="summary"
                            value={formData.summary}
                            onChange={(e) => handleInputChange("summary", e.target.value)}
                            className="mt-1 bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                            placeholder="Short product summary"
                            rows={2}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="description" className="text-gray-900 dark:text-white">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleInputChange("description", e.target.value)}
                            className="mt-1 bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                            placeholder="Full product description"
                            rows={4}
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
                        <Label htmlFor="size" className="text-gray-900 dark:text-white">Size (inches)</Label>
                        <Input
                            id="size"
                            type="number"
                            value={formData.size}
                            onChange={(e) => handleInputChange("size", e.target.value)}
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
                        <Input
                            id="supplier"
                            value={formData.supplier}
                            onChange={(e) => handleInputChange("supplier", e.target.value)}
                            className="mt-1 bg-white dark:bg-black border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                            placeholder="Supplier name"
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
                            <div className="relative w-24 h-24 bg-gray-100 dark:bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                    src={image || '/led-product.png'}
                                    alt={`Product image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
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

