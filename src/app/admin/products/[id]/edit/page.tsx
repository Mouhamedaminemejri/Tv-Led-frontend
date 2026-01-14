"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2, X, AlertCircle, Package } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { AdminService, type AdminProduct } from "@/services/admin-service";
import { ProductForm } from "@/components/product-form";

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;
    
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [product, setProduct] = React.useState<AdminProduct | null>(null);

    // Load product data
    React.useEffect(() => {
        const loadProduct = async () => {
            try {
                setLoading(true);
                const productData = await AdminService.getProduct(productId);
                setProduct(productData);
            } catch (err) {
                console.error("Error loading product:", err);
                setError(err instanceof Error ? err.message : "Failed to load product");
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            loadProduct();
        }
    }, [productId]);

    const handleSubmit = async (formData: any) => {
        setSaving(true);
        setError(null);

        try {
            // Transform form data to match API
            const productData = {
                title: formData.title,
                reference: formData.reference,
                brand: formData.brand,
                price: parseFloat(formData.price) || 0,
                salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
                purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
                stock: parseInt(formData.stock) || 0,
                description: formData.description || undefined,
                summary: formData.summary || undefined,
                supplier: formData.supplier || undefined,
                size: formData.size ? parseInt(formData.size) : undefined,
                rating: formData.rating ? parseFloat(formData.rating) : 0,
                tags: formData.tags || [],
                images: formData.images || [],
            };

            await AdminService.updateProduct(productId, productData);
            router.push('/admin/products');
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update product");
            throw err;
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                    <p className="text-gray-500 dark:text-gray-400">Loading product...</p>
                </div>
            </div>
        );
    }

    if (error && !product) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Product Not Found</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
                    <Link href="/admin/products">
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Products
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            {/* Page Header */}
            <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-black/80 backdrop-blur-xl">
                <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link 
                            href="/admin/products" 
                            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span className="hidden sm:inline">Back</span>
                        </Link>
                        <div className="h-6 w-px bg-gray-200 dark:bg-white/10" />
                        <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Product</h1>
                    </div>
                </div>
            </header>

            <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                        <span className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</span>
                        <button onClick={() => setError(null)}>
                            <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </button>
                    </div>
                )}

                {product && (
                    <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                        <ProductForm 
                            initialData={{
                                number: "",
                                reference: product.reference,
                                brand: product.brand,
                                title: product.title,
                                summary: product.summary || "",
                                purchasePrice: product.purchasePrice?.toString() || "",
                                supplier: product.supplier || "",
                                salePrice: product.salePrice?.toString() || "",
                                price: product.price?.toString() || "",
                                description: product.description || "",
                                size: product.size?.toString() || "",
                                stock: product.stock?.toString() || "",
                                rating: product.rating?.toString() || "0",
                                images: product.images || [],
                                tags: product.tags || [],
                            }}
                            onSubmit={handleSubmit} 
                            isLoading={saving}
                            submitButton={
                                <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
                                    <Link href="/admin/products" className="flex-1 sm:flex-none">
                                        <Button type="button" variant="outline" className="w-full sm:w-auto border-gray-200 dark:border-white/10">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button 
                                        type="submit" 
                                        disabled={saving}
                                        className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Update Product
                                            </>
                                        )}
                                    </Button>
                                </div>
                            }
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
