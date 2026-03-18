"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2, X, FileCode } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminSoftwareService } from "@/services/admin-software-service";
import { SoftwareProductForm } from "@/components/software-product-form";

export default function NewSoftwarePage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      await AdminSoftwareService.createProduct(formData as Parameters<typeof AdminSoftwareService.createProduct>[0]);
      router.push("/admin/software");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create software");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-black/80 backdrop-blur-xl">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/software"
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="h-6 w-px bg-gray-200 dark:bg-white/10" />
            <FileCode className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Add Software Product</h1>
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

        <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
          <SoftwareProductForm
            onSubmit={handleSubmit}
            isLoading={loading}
            submitButton={
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
                <Link href="/admin/software" className="flex-1 sm:flex-none">
                  <Button type="button" variant="outline" className="w-full sm:w-auto border-gray-200 dark:border-white/10">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Software Product
                    </>
                  )}
                </Button>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
