"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2, X, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ProductService } from "@/services/product-service";
import { ProductForm } from "@/components/product-form";

interface AdminProduct {
    id: string;
    number?: string | null;
    reference: string;
    brand: string;
    title: string;
    summary?: string | null;
    purchasePrice?: number | null;
    supplier?: string | null;
    salePrice: number;
    price: number;
    description?: string | null;
    size?: number | null;
    stock: number;
    rating: number;
    images: string[];
    tags: string[];
    createdAt?: string;
    updatedAt?: string;
}

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
                const productData = await ProductService.getProductById(productId) as any;
                setProduct(productData as AdminProduct);
            } catch (err) {
                console.error("Error loading product:", err);
                setError("Failed to load product. Please try again.");
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
            await ProductService.updateProduct(productId, formData);
            router.push('/admin/products');
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update product");
            throw err; // Re-throw to prevent form submission
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
                <div className="container mx-auto px-4 py-20 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400">Loading product...</p>
                    </div>
                </div>
            </main>
        );
    }

    if (error && !product) {
        return (
            <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
                <div className="container mx-auto px-4 py-20">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                        <Link href="/admin/products">
                            <Button className="bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-500 text-white">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Products
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/products" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="hidden sm:inline">Back to Products</span>
                        </Link>
                        <div className="h-6 w-px bg-gray-300 dark:bg-white/10" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Product</h1>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                        <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto"
                        >
                            <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </button>
                    </div>
                )}

                {product && (
                    <ProductForm 
                        initialData={{
                            number: product.number || "",
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
                            <>
                                <Link href="/admin/products">
                                    <Button type="button" variant="outline" className="border-gray-300 dark:border-white/10">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button 
                                    type="submit" 
                                    disabled={saving}
                                    className="bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-500 text-white"
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
                            </>
                        }
                    />
                )}
            </div>
        </main>
    );
}

