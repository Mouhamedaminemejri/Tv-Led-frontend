"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductService } from "@/services/product-service";
import { ProductForm } from "@/components/product-form";

export default function NewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleSubmit = async (formData: any) => {
        setLoading(true);
        setError(null);

        try {
            await ProductService.createProduct(formData);
            router.push('/admin/products');
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create product");
            throw err; // Re-throw to prevent form submission
        } finally {
            setLoading(false);
        }
    };

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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Product</h1>
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

                <ProductForm 
                    onSubmit={handleSubmit} 
                    isLoading={loading}
                    submitButton={
                        <>
                            <Link href="/admin/products">
                                <Button type="button" variant="outline" className="border-gray-300 dark:border-white/10">
                                    Cancel
                                </Button>
                            </Link>
                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-500 text-white"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Product
                                    </>
                                )}
                            </Button>
                        </>
                    }
                />
            </div>
        </main>
    );
}

