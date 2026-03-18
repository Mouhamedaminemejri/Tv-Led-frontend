"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Plus, Upload } from "lucide-react";
import Image from "next/image";
import type { FirmwareType, FulfillmentMethod } from "@/services/software-product-service";
import { SoftwareProductService } from "@/services/software-product-service";

export interface SoftwareProductFormData {
  title: string;
  brand: string;
  reference: string;
  price: string;
  salePrice: string;
  stock: string;
  firmwareType: string;
  compatibleModels: string;
  fileSize: string;
  version: string;
  summary: string;
  description: string;
  chassis: string;
  chipset: string;
  volume: string;
  downloadUrl: string;
  isBundle: string;
  bundleChassisCount: string;
  includesPhysicalDelivery: string;
  includesYearlyUpdates: string;
  sources: string;
  fulfillmentMethod: string;
  physicalUsbPrice: string;
  emailLinksPrice: string;
  storageCapacityGb: string;
  numberOfLinks: string;
  productNumber: string;
  hasFreeShipping: string;
  images: string[];
  tags: string[];
}

const defaultFormData: SoftwareProductFormData = {
  title: "",
  brand: "",
  reference: "",
  price: "",
  salePrice: "",
  stock: "999",
  firmwareType: "usb",
  compatibleModels: "",
  fileSize: "",
  version: "",
  summary: "",
  description: "",
  chassis: "",
  chipset: "",
  volume: "",
  downloadUrl: "",
  isBundle: "false",
  bundleChassisCount: "",
  includesPhysicalDelivery: "false",
  includesYearlyUpdates: "false",
  sources: "",
  fulfillmentMethod: "EMAIL_DOWNLOAD_LINKS",
  physicalUsbPrice: "",
  emailLinksPrice: "",
  storageCapacityGb: "64",
  numberOfLinks: "",
  productNumber: "",
  hasFreeShipping: "false",
  images: [],
  tags: [],
};

interface SoftwareProductFormProps {
  initialData?: Partial<SoftwareProductFormData>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
  submitButton?: React.ReactNode;
}

export function SoftwareProductForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitButton,
}: SoftwareProductFormProps) {
  const [formData, setFormData] = React.useState<SoftwareProductFormData>({
    ...defaultFormData,
    ...initialData,
  });
  const [newTag, setNewTag] = React.useState("");
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [brandOptions, setBrandOptions] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingImages, setUploadingImages] = React.useState(false);

  React.useEffect(() => {
    SoftwareProductService.getFilterData().then((items) => {
      const b = [...new Set(items.map((p) => p.brand))].filter(Boolean).sort();
      setBrandOptions(b);
    });
  }, []);

  const handleChange = (field: keyof SoftwareProductFormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (tag && !formData.tags.includes(tag)) {
      handleChange("tags", [...formData.tags, tag]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    handleChange("tags", formData.tags.filter((t) => t !== tag));
  };

  const handleAddImageUrl = () => {
    const url = prompt("Enter image URL:");
    if (url?.trim()) handleChange("images", [...formData.images, url.trim()]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fd = new FormData();
        fd.append("image", file);
        const res = await fetch(
          (typeof window !== "undefined" ? "/api" : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api") +
            "/upload",
          { method: "POST", body: fd }
        );
        if (!res.ok) throw new Error(`Upload failed: ${file.name}`);
        const data = await res.json();
        return data.url || data.path || data.imageUrl;
      });
      const urls = await Promise.all(uploadPromises);
      handleChange("images", [...formData.images, ...urls.filter(Boolean)]);
    } catch (err) {
      alert(`Upload failed: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    handleChange(
      "images",
      formData.images.filter((_, i) => i !== index)
    );
  };

  const handleImageUrlChange = (index: number, value: string) => {
    handleChange(
      "images",
      formData.images.map((img, i) => (i === index ? value : img))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const priceVal = Number(formData.price);
    if (!Number.isFinite(priceVal) || priceVal <= 0) {
      setValidationError("Price must be greater than 0.");
      return;
    }

    const stockVal = parseInt(formData.stock, 10) || 0;
    if (stockVal < 0) {
      setValidationError("Stock cannot be negative.");
      return;
    }

    const apiData: Record<string, unknown> = {
      title: formData.title,
      brand: formData.brand,
      reference: formData.reference,
      price: priceVal,
      stock: stockVal,
      firmwareType: formData.firmwareType as FirmwareType,
      compatibleModels: formData.compatibleModels
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
      tags: formData.tags,
      images: formData.images.filter((u) => u?.trim()),
    };

    if (formData.salePrice) {
      const saleVal = Number(formData.salePrice);
      if (Number.isFinite(saleVal) && saleVal >= 0) apiData.salePrice = saleVal;
    }
    if (formData.summary) apiData.summary = formData.summary;
    if (formData.description) apiData.description = formData.description;
    if (formData.fileSize) apiData.fileSize = formData.fileSize;
    if (formData.version) apiData.version = formData.version;
    if (formData.chassis) apiData.chassis = formData.chassis;
    if (formData.chipset) apiData.chipset = formData.chipset;
    if (formData.volume) apiData.volume = formData.volume;
    if (formData.downloadUrl) apiData.downloadUrl = formData.downloadUrl;

    apiData.isBundle = formData.isBundle === "true";
    if (formData.bundleChassisCount) {
      const bc = parseInt(formData.bundleChassisCount, 10);
      if (Number.isFinite(bc)) apiData.bundleChassisCount = bc;
    }
    apiData.includesPhysicalDelivery = formData.includesPhysicalDelivery === "true";
    apiData.includesYearlyUpdates = formData.includesYearlyUpdates === "true";
    if (formData.sources) {
      apiData.sources = formData.sources.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    }

    apiData.fulfillmentMethod = formData.fulfillmentMethod || undefined;
    if (formData.physicalUsbPrice) {
      const v = Number(formData.physicalUsbPrice);
      if (Number.isFinite(v)) apiData.physicalUsbPrice = v;
    }
    if (formData.emailLinksPrice) {
      const v = Number(formData.emailLinksPrice);
      if (Number.isFinite(v)) apiData.emailLinksPrice = v;
    }
    if (formData.storageCapacityGb) {
      const v = parseInt(formData.storageCapacityGb, 10);
      if (Number.isFinite(v)) apiData.storageCapacityGb = v;
    }
    if (formData.numberOfLinks) {
      const v = parseInt(formData.numberOfLinks, 10);
      if (Number.isFinite(v)) apiData.numberOfLinks = v;
    }
    if (formData.productNumber) apiData.productNumber = formData.productNumber;
    apiData.hasFreeShipping = formData.hasFreeShipping === "true";

    await onSubmit(apiData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {validationError && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {validationError}
        </div>
      )}

      {/* Basic */}
      <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-900 dark:text-white">Reference *</Label>
            <Input
              value={formData.reference}
              onChange={(e) => handleChange("reference", e.target.value)}
              className="mt-1 bg-white dark:bg-black border-gray-300 dark:border-white/10"
              placeholder="e.g. UE43AU7100"
              required
            />
          </div>
          <div>
            <Label className="text-gray-900 dark:text-white">Brand *</Label>
            <select
              value={formData.brand}
              onChange={(e) => handleChange("brand", e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-black px-3 py-2 text-sm"
              required
            >
              <option value="">Select brand...</option>
              {brandOptions.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
              {formData.brand && !brandOptions.includes(formData.brand) && (
                <option value={formData.brand}>{formData.brand}</option>
              )}
            </select>
          </div>
          <div className="md:col-span-2">
            <Label className="text-gray-900 dark:text-white">Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="mt-1 bg-white dark:bg-black border-gray-300 dark:border-white/10"
              placeholder="Product title"
              required
            />
          </div>
        </div>
      </div>

      {/* Pricing & Stock */}
      <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pricing & Stock</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-gray-900 dark:text-white">Price (TND) *</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.price}
              onChange={(e) => handleChange("price", e.target.value)}
              className="mt-1 bg-white dark:bg-black"
              required
            />
          </div>
          <div>
            <Label className="text-gray-900 dark:text-white">Sale Price (TND)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.salePrice}
              onChange={(e) => handleChange("salePrice", e.target.value)}
              className="mt-1 bg-white dark:bg-black"
            />
          </div>
          <div>
            <Label className="text-gray-900 dark:text-white">Stock *</Label>
            <Input
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => handleChange("stock", e.target.value)}
              className="mt-1 bg-white dark:bg-black"
              required
            />
          </div>
        </div>
      </div>

      {/* Software Specific */}
      <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Software Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-900 dark:text-white">Firmware Type *</Label>
            <select
              value={formData.firmwareType}
              onChange={(e) => handleChange("firmwareType", e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-black px-3 py-2 text-sm"
            >
              <option value="update">Update</option>
              <option value="usb">USB</option>
              <option value="recovery">Recovery</option>
              <option value="chassis_pack">Chassis Pack</option>
            </select>
          </div>
          <div>
            <Label className="text-gray-900 dark:text-white">Version</Label>
            <Input
              value={formData.version}
              onChange={(e) => handleChange("version", e.target.value)}
              className="mt-1 bg-white dark:bg-black"
              placeholder="e.g. 1304.0"
            />
          </div>
          <div>
            <Label className="text-gray-900 dark:text-white">File Size</Label>
            <Input
              value={formData.fileSize}
              onChange={(e) => handleChange("fileSize", e.target.value)}
              className="mt-1 bg-white dark:bg-black"
              placeholder="e.g. 410 MB"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="text-gray-900 dark:text-white">Compatible Models (comma or newline)</Label>
            <Textarea
              value={formData.compatibleModels}
              onChange={(e) => handleChange("compatibleModels", e.target.value)}
              className="mt-1 bg-white dark:bg-black"
              placeholder="UE43AU7100, UE43AU7090"
              rows={3}
            />
          </div>
          <div className="md:col-span-2">
            <Label className="text-gray-900 dark:text-white">Summary</Label>
            <Input
              value={formData.summary}
              onChange={(e) => handleChange("summary", e.target.value)}
              className="mt-1 bg-white dark:bg-black"
              placeholder="Short description"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="text-gray-900 dark:text-white">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="mt-1 bg-white dark:bg-black"
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Chassis Pack (optional) */}
      <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Chassis Pack (optional)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-900 dark:text-white">Chassis</Label>
            <Input
              value={formData.chassis}
              onChange={(e) => handleChange("chassis", e.target.value)}
              className="mt-1 bg-white dark:bg-black"
            />
          </div>
          <div>
            <Label className="text-gray-900 dark:text-white">Chipset</Label>
            <Input
              value={formData.chipset}
              onChange={(e) => handleChange("chipset", e.target.value)}
              className="mt-1 bg-white dark:bg-black"
            />
          </div>
          <div>
            <Label className="text-gray-900 dark:text-white">Volume</Label>
            <Input
              value={formData.volume}
              onChange={(e) => handleChange("volume", e.target.value)}
              className="mt-1 bg-white dark:bg-black"
            />
          </div>
          <div>
            <Label className="text-gray-900 dark:text-white">Download URL</Label>
            <Input
              value={formData.downloadUrl}
              onChange={(e) => handleChange("downloadUrl", e.target.value)}
              className="mt-1 bg-white dark:bg-black"
              placeholder="https://..."
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isBundle === "true"}
              onChange={(e) => handleChange("isBundle", e.target.checked ? "true" : "false")}
              className="w-4 h-4 rounded"
            />
            <Label>Is Bundle</Label>
          </div>
          {formData.isBundle === "true" && (
            <div>
              <Label className="text-gray-900 dark:text-white">Bundle Chassis Count</Label>
              <Input
                type="number"
                min="0"
                value={formData.bundleChassisCount}
                onChange={(e) => handleChange("bundleChassisCount", e.target.value)}
                className="mt-1 bg-white dark:bg-black"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.includesPhysicalDelivery === "true"}
              onChange={(e) => handleChange("includesPhysicalDelivery", e.target.checked ? "true" : "false")}
              className="w-4 h-4 rounded"
            />
            <Label>Includes Physical Delivery (USB)</Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.includesYearlyUpdates === "true"}
              onChange={(e) => handleChange("includesYearlyUpdates", e.target.checked ? "true" : "false")}
              className="w-4 h-4 rounded"
            />
            <Label>Includes Yearly Updates</Label>
          </div>
          <div className="md:col-span-2">
            <Label className="text-gray-900 dark:text-white">Sources (comma-separated)</Label>
            <Input
              value={formData.sources}
              onChange={(e) => handleChange("sources", e.target.value)}
              className="mt-1 bg-white dark:bg-black"
              placeholder="Russians, Poles, Kazmi"
            />
          </div>
        </div>
      </div>

      {/* Fulfillment & Dual Pricing */}
      <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fulfillment & Dual Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-900 dark:text-white">Fulfillment Method</Label>
            <select
              value={formData.fulfillmentMethod}
              onChange={(e) => handleChange("fulfillmentMethod", e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-black px-3 py-2 text-sm"
            >
              <option value="EMAIL_DOWNLOAD_LINKS">Email Links</option>
              <option value="PHYSICAL_USB_WITH_LINKS">Physical USB</option>
              <option value="BOTH">Both</option>
            </select>
          </div>
          <div>
            <Label className="text-gray-900 dark:text-white">Physical USB Price (TND)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.physicalUsbPrice}
              onChange={(e) => handleChange("physicalUsbPrice", e.target.value)}
              className="mt-1 bg-white dark:bg-black"
            />
          </div>
          <div>
            <Label className="text-gray-900 dark:text-white">Email Links Price (TND)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.emailLinksPrice}
              onChange={(e) => handleChange("emailLinksPrice", e.target.value)}
              className="mt-1 bg-white dark:bg-black"
            />
          </div>
          <div>
            <Label className="text-gray-900 dark:text-white">Storage Capacity (GB)</Label>
            <Input
              type="number"
              value={formData.storageCapacityGb}
              onChange={(e) => handleChange("storageCapacityGb", e.target.value)}
              className="mt-1 bg-white dark:bg-black"
              placeholder="64"
            />
          </div>
          <div>
            <Label className="text-gray-900 dark:text-white">Number of Links</Label>
            <Input
              type="number"
              value={formData.numberOfLinks}
              onChange={(e) => handleChange("numberOfLinks", e.target.value)}
              className="mt-1 bg-white dark:bg-black"
            />
          </div>
          <div>
            <Label className="text-gray-900 dark:text-white">Product Number</Label>
            <Input
              value={formData.productNumber}
              onChange={(e) => handleChange("productNumber", e.target.value)}
              className="mt-1 bg-white dark:bg-black"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.hasFreeShipping === "true"}
              onChange={(e) => handleChange("hasFreeShipping", e.target.checked ? "true" : "false")}
              className="w-4 h-4 rounded"
            />
            <Label>Has Free Shipping</Label>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Images</h2>
        <div className="flex gap-2 mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingImages}>
            <Upload className="h-4 w-4 mr-2" />
            {uploadingImages ? "Uploading..." : "Upload"}
          </Button>
          <Button type="button" variant="outline" onClick={handleAddImageUrl}>
            <Plus className="h-4 w-4 mr-2" />
            Add URL
          </Button>
        </div>
        <div className="space-y-4">
          {formData.images.map((img, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-white dark:bg-black rounded-lg border">
              <div className="relative w-16 h-16 bg-gray-100 dark:bg-white/10 rounded overflow-hidden flex-shrink-0">
                <Image src={img || "/file.svg"} alt="" fill className="object-cover" />
              </div>
              <Input
                value={img}
                onChange={(e) => handleImageUrlChange(i, e.target.value)}
                className="flex-1"
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveImage(i)} className="text-red-600">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tags</h2>
        <div className="flex gap-2 mb-4">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
            placeholder="Add tag"
          />
          <Button type="button" onClick={handleAddTag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-white/10 rounded-full text-sm"
            >
              {tag}
              <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-red-600">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {submitButton && <div className="pt-6 border-t border-gray-200 dark:border-white/10">{submitButton}</div>}
    </form>
  );
}
