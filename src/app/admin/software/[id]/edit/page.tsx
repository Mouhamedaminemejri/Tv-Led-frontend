"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2, X, FileCode } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { AdminSoftwareService } from "@/services/admin-software-service";
import { SoftwareProductForm } from "@/components/software-product-form";
import type { SoftwareProduct } from "@/services/software-product-service";

function toFormData(p: SoftwareProduct): Partial<import("@/components/software-product-form").SoftwareProductFormData> {
  return {
    title: p.title || "",
    brand: p.brand || "",
    reference: p.reference || "",
    price: String(p.price ?? ""),
    salePrice: p.salePrice != null ? String(p.salePrice) : "",
    stock: String(p.stock ?? 999),
    firmwareType: p.firmwareType || "usb",
    compatibleModels: Array.isArray(p.compatibleModels) ? p.compatibleModels.join(", ") : "",
    fileSize: p.fileSize || "",
    version: p.version || "",
    summary: p.summary || "",
    description: p.description || "",
    chassis: p.chassis || "",
    chipset: p.chipset || "",
    volume: p.volume || "",
    downloadUrl: p.downloadUrl || "",
    isBundle: p.isBundle ? "true" : "false",
    bundleChassisCount: p.bundleChassisCount != null ? String(p.bundleChassisCount) : "",
    includesPhysicalDelivery: p.includesPhysicalDelivery ? "true" : "false",
    includesYearlyUpdates: p.includesYearlyUpdates ? "true" : "false",
    sources: Array.isArray(p.sources) ? p.sources.join(", ") : "",
    fulfillmentMethod: p.fulfillmentMethod || "EMAIL_DOWNLOAD_LINKS",
    physicalUsbPrice: p.physicalUsbPrice != null ? String(p.physicalUsbPrice) : "",
    emailLinksPrice: p.emailLinksPrice != null ? String(p.emailLinksPrice) : "",
    storageCapacityGb: p.storageCapacityGb != null ? String(p.storageCapacityGb) : "64",
    numberOfLinks: p.numberOfLinks != null ? String(p.numberOfLinks) : "",
    productNumber: p.productNumber || "",
    hasFreeShipping: p.hasFreeShipping ? "true" : "false",
    images: p.images || [],
    tags: p.tags || [],
  };
}

export default function EditSoftwarePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [product, setProduct] = React.useState<SoftwareProduct | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await AdminSoftwareService.getProduct(id);
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    setSaving(true);
    setError(null);
    try {
      await AdminSoftwareService.updateProduct(id, formData as Parameters<typeof AdminSoftwareService.updateProduct>[1]);
      router.push("/admin/software");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
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
          <p className="text-gray-500 dark:text-gray-400">Loading software...</p>
        </div>
      </div>
    );
  }

  if ((error && !product) || !product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Software Not Found</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error || "Product not found"}</p>
          <Link href="/admin/software">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Software
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Software</h1>
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
            initialData={toFormData(product)}
            onSubmit={handleSubmit}
            isLoading={saving}
            submitButton={
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
                <Link href="/admin/software" className="flex-1 sm:flex-none">
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
                      Update Software
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
