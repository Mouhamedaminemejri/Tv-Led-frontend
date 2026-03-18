"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Minus,
  Star,
  Download,
  ExternalLink,
  Usb,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { SoftwareProductService, type SoftwareProduct, type FirmwareType } from "@/services/software-product-service";
import { Footer } from "@/components/footer";
import { useLedsStickyActions } from "@/components/leds/leds-sticky-actions-context";
import { LedsBreadcrumb, type BreadcrumbItem } from "@/components/leds/leds-breadcrumb";

const FIRMWARE_LABELS: Record<string, string> = {
  update: "Official Update",
  usb: "USB Firmware",
  recovery: "System Recovery",
  chassis_pack: "Chassis Pack",
};

function hasValue(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "number") return Number.isFinite(v) && v !== 0;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function B({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>;
}

// Rich storytelling description – dynamic content in bold, skips null/empty
// Show more / Show less under "Our reference"
function SoftwareDescription({ product }: { product: SoftwareProduct }) {
  const [expanded, setExpanded] = React.useState(false);
  const firmwareIsChassisPack = (product.firmwareType || "").toLowerCase().replace(/-/g, "_") === "chassis_pack";
  const hasFlash = product.includesPhysicalDelivery || product.physicalUsbPrice != null;
  const suk = (product as { suk?: string | null }).suk ?? product.productNumber ?? product.reference;
  const chassisCount = (product.isBundle && (product.bundleChassisCount ?? 0) > 0)
    ? product.bundleChassisCount!
    : (product.compatibleModels?.length ?? 0) || (product.chassis ? 1 : 0);
  const totalFiles = (product as { totalFiles?: number | null }).totalFiles ?? product.numberOfLinks;

  const visibleParts: React.ReactNode[] = [];
  const expandableParts: React.ReactNode[] = [];

  // Expandable (after total files): folders, database, volume, yearly, chassis-intro
  expandableParts.push(
    <p key="folders">
      Each chassis has a folder where I put all the software and information found for that chassis.{" "}
      In each folder there is a picture of the chassis.{" "}
      I put a download link for each folder on <B>WeTransfer</B> – very high speed.
    </p>
  );

  expandableParts.push(
    <p key="database">
      The links don&apos;t disappear – consider it a <B>software database kept online</B>, from where you can use any file at any time.{" "}
      I didn&apos;t stop to check if the software has duplicates and which ones there are, I&apos;m sure they are, I put everything there – it&apos;s safer to have duplicates than to have something missing.{" "}
      The chassis are in alphabetical order.{" "}
      You can quickly search for a chassis with <B>Ctrl+F</B> in this PDF.
    </p>
  );

  if (firmwareIsChassisPack && (product.volume === "1" || product.volume === "2")) {
    expandableParts.push(
      <p key="volume2">
        Volume 2 with the next <B>1002</B> chassis will probably be released at the end of spring – beginning of summer (May / June).{" "}
        {product.includesYearlyUpdates && (
          <>Whoever purchases the two volumes will receive a <B>free link by email at the end of the year</B> with the new software for the <B>2000</B> chassis.</>
        )}
      </p>
    );
  } else if (product.includesYearlyUpdates) {
    expandableParts.push(
      <p key="yearly">
        Whoever purchases {product.volume ? <>volume <B>{product.volume}</B></> : "this package"} will receive a <B>free link by email at the end of the year</B> with the new software collected during the year.
      </p>
    );
  }

  if (chassisCount > 0 && product.compatibleModels?.length && firmwareIsChassisPack) {
    expandableParts.push(
      <p key="chassis-intro">
        The <B>{chassisCount}</B> chassis on this {product.volume ? <>volume <B>{product.volume}</B></> : "package"} are the following:
      </p>
    );
  }

  const hasExpandable = expandableParts.length > 0;

  // Always visible: opening, Our reference, file size, total files; Show more after Total files
  if (!firmwareIsChassisPack) {
    const deliveryText = hasFlash ? "Flash with software" : "Only software by mail";
    visibleParts.push(
      <p key="opening">
        {deliveryText}
        {hasValue(product.brand) && <> for <B>{product.brand}</B></>}.
      </p>
    );
    if (hasValue(suk)) {
      visibleParts.push(
        <p key="our-ref">Our reference: <B>{String(suk)}</B></p>
      );
    }
  }

  if (product.fileSize && product.fileSize.trim()) {
    visibleParts.push(<p key="space"><B>{product.fileSize}</B> – total space occupied.</p>);
  }

  if (totalFiles != null && Number(totalFiles) > 0) {
    visibleParts.push(
      <p key="files">
        Total files (including duplicates) – <B>{Number(totalFiles).toLocaleString()}</B>.
        {hasExpandable && (
          <>
            {" "}
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="inline text-blue-600 hover:text-blue-700 hover:underline font-bold text-xs focus:outline-none focus:ring-0"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          </>
        )}
      </p>
    );
  }

  // Chassis pack: put Show more after first visible content (file size / total files)
  if (firmwareIsChassisPack && hasExpandable) {
    visibleParts.push(
      <button
        key="show-more"
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="inline text-blue-600 hover:text-blue-700 hover:underline font-bold text-xs focus:outline-none focus:ring-0"
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    );
  }

  return (
    <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-900 dark:text-gray-200">
      {visibleParts}
      {hasExpandable && expanded && <div className="space-y-4">{expandableParts}</div>}
    </div>
  );
}

// Scrollable compatible chassis/models section (like LED ModelSections)
function CompatibleChassisSection({
  models,
  label = "Compatible Chassis",
}: {
  models: string[];
  label?: string;
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return models;
    return models.filter((m) => m.toLowerCase().includes(q));
  }, [models, searchQuery]);

  if (!models.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {label}
          <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">({models.length})</span>
        </h3>
        <div className="hidden sm:block">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chassis..."
            className="h-8 w-56 rounded-md border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 p-4 max-h-64 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
            No chassis found{searchQuery ? ` for "${searchQuery}"` : ""}.
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {filtered.map((m, i) => (
              <span
                key={`${m}-${i}`}
                className="inline-block text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md px-2 py-1 text-gray-700 dark:text-gray-300 font-mono"
              >
                {m}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export default function SoftwareDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = React.useState<SoftwareProduct | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [quantity, setQuantity] = React.useState(1);
  const [selectedFulfillment, setSelectedFulfillment] = React.useState<"PHYSICAL_USB_WITH_LINKS" | "EMAIL_DOWNLOAD_LINKS" | "BOTH">("PHYSICAL_USB_WITH_LINKS");
  const addToCartSectionRef = React.useRef<HTMLDivElement>(null);

  const { cart, addToCart } = useCart();
  const { setState: setStickyState } = useLedsStickyActions();

  React.useEffect(() => {
    if (!productId) return;
    SoftwareProductService.getById(productId)
      .then(setProduct)
      .catch((err) => {
        console.error(err);
        setError("Failed to load product.");
      })
      .finally(() => setLoading(false));
  }, [productId]);

  React.useEffect(() => {
    if (product) {
      setQuantity(1);
      const isBoth = (product.fulfillmentMethod || "").toUpperCase() === "BOTH";
      if (isBoth) {
        const hasUsb = product.physicalUsbPrice != null && product.physicalUsbPrice > 0;
        const hasEmail = product.emailLinksPrice != null && product.emailLinksPrice > 0;
        if (hasUsb) setSelectedFulfillment("PHYSICAL_USB_WITH_LINKS");
        else if (hasEmail) setSelectedFulfillment("EMAIL_DOWNLOAD_LINKS");
        else setSelectedFulfillment("PHYSICAL_USB_WITH_LINKS");
      }
    }
  }, [product?.id]);

  const images = React.useMemo(() => {
    if (!product) return ["/file.svg"];
    return product.images?.length ? product.images : ["/file.svg"];
  }, [product]);

  const goToPreviousImage = React.useCallback(() => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNextImage = React.useCallback(() => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const existingProduct = cart.find((item) => item.id === product?.id) ?? null;
  const existingQuantity = existingProduct ? existingProduct.quantity : 0;
  const remainingStock = product ? Math.max(0, product.stock - existingQuantity) : 0;

  const incrementQuantity = () => {
    if (quantity < remainingStock) setQuantity((p) => p + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity((p) => p - 1);
  };

  const handleDirectAddToCart = React.useCallback(() => {
    if (!product) return;
    if (remainingStock > 0 && quantity > 0) {
      const isBoth = (product.fulfillmentMethod || "").toUpperCase() === "BOTH";
      let price: number;
      if (isBoth) {
        if (selectedFulfillment === "BOTH") price = (product.physicalUsbPrice ?? product.price) + (product.emailLinksPrice ?? product.price);
        else if (selectedFulfillment === "PHYSICAL_USB_WITH_LINKS") price = product.physicalUsbPrice ?? product.price;
        else price = product.emailLinksPrice ?? product.price;
      } else {
        price = product.salePrice && product.salePrice > 0 && product.salePrice < product.price ? product.salePrice : product.price;
      }
      addToCart({
        id: product.id,
        title: product.title,
        brand: product.brand,
        reference: product.reference,
        price,
        image: product.images?.[0] || "/file.svg",
        quantity,
        stock: product.stock,
        itemType: "software",
        selectedFulfillment,
        fulfillmentMethod: product.fulfillmentMethod,
        physicalUsbPrice: product.physicalUsbPrice,
        emailLinksPrice: product.emailLinksPrice,
      });
    }
  }, [addToCart, product, quantity, remainingStock, selectedFulfillment]);

  const handleDirectPurchase = React.useCallback(() => {
    if (!product) return;
    if (remainingStock > 0 && quantity > 0) {
      router.push(`/checkout?productId=${product.id}&quantity=${quantity}&itemType=software`);
    }
  }, [product, quantity, remainingStock, router]);

  React.useEffect(() => {
    if (!product) {
      setStickyState((prev) => ({ ...prev, product: null, onAddToCart: null, onBuyNow: null, show: false }));
      return;
    }
    setStickyState((prev) => ({
      ...prev,
      product,
      onAddToCart: remainingStock > 0 ? handleDirectAddToCart : null,
      onBuyNow: remainingStock > 0 ? handleDirectPurchase : null,
    }));
  }, [handleDirectAddToCart, handleDirectPurchase, product, remainingStock, setStickyState]);

  React.useEffect(() => {
    if (!product) return;
    const target = addToCartSectionRef.current;
    if (!target) return;
    const obs = new IntersectionObserver(
      (entries) => setStickyState((prev) => ({ ...prev, show: !entries[0].isIntersecting })),
      { threshold: 0.1, rootMargin: "-128px 0px 0px 0px" }
    );
    obs.observe(target);
    return () => {
      obs.disconnect();
      setStickyState((prev) => ({ ...prev, show: false }));
    };
  }, [product, setStickyState]);

  const breadcrumbItems = React.useMemo<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = [
      { label: "Home", href: "/" },
      { label: "TV Software & Firmware", href: "/software" },
    ];
    if (product?.brand) {
      items.push({ label: `${product.brand}`, href: `/software?brand=${encodeURIComponent(product.brand)}` });
    }
    items.push({ label: product?.title ?? "Product" });
    return items;
  }, [product?.brand, product?.title]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 dark:text-blue-400" />
          <p className="ml-3 text-gray-500 dark:text-gray-400">Loading product...</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {error || "The software you're looking for doesn't exist."}
            </p>
            <Link href="/software">
              <Button className="bg-blue-600 hover:bg-blue-500">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Software
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isBothFulfillment = (product.fulfillmentMethod || "").toUpperCase() === "BOTH";
  const usbPrice = (product.physicalUsbPrice ?? product.price);
  const emailPrice = (product.emailLinksPrice ?? product.price);
  const bothPrice = usbPrice + emailPrice;
  const storageGb = product.storageCapacityGb ?? 64;

  const displayPrice = product.salePrice && product.salePrice > 0 && product.salePrice < product.price
    ? product.salePrice
    : product.price;
  const originalPrice = product.salePrice && product.salePrice > 0 && product.salePrice < product.price
    ? product.price
    : null;

  // Compatible models/chassis list (compatibleModels or single chassis)
  const chassisList = product.compatibleModels?.length
    ? product.compatibleModels
    : product.chassis
      ? [product.chassis]
      : [];

  return (
    <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      <div className="container mx-auto px-4 pt-2 pb-8">
        <LedsBreadcrumb items={breadcrumbItems} />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left - Image Gallery (same as LED) */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="flex flex-col sm:flex-row gap-4">
              {images.length > 1 && (
                <div className="order-2 sm:order-1 sm:w-24">
                  <div className="bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-3">
                    <div className="flex flex-row sm:flex-col gap-3 justify-center overflow-x-auto sm:overflow-y-auto">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                            idx === currentImageIndex
                              ? "border-blue-500 shadow-lg shadow-blue-500/30"
                              : "border-gray-300 dark:border-white/20 hover:border-gray-400 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <Image src={img} alt="" fill className="object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="order-1 sm:order-2 relative flex-1 aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10">
                <div className="relative w-full h-full">
                  <Image
                    src={images[currentImageIndex]}
                    alt={product.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                {images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/50 dark:bg-black/50 hover:bg-white/70 backdrop-blur-sm border"
                      onClick={goToPreviousImage}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/50 dark:bg-black/50 hover:bg-white/70 backdrop-blur-sm border"
                      onClick={goToNextImage}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-md">
                    {FIRMWARE_LABELS[product.firmwareType] || product.firmwareType}
                  </span>
                  {product.hasFreeShipping && (
                    <span className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-md">
                      Free shipping
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Below image: Stock, Additional info, Download link */}
            <div className="mt-6 space-y-4">
              <div className="space-y-1">
                {product.stock > 0 ? (
                  <div className="text-sm text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    In stock — Instant digital download after purchase
                  </div>
                ) : (
                  <div className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Out of stock
                  </div>
                )}
              </div>

              <div className="border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-white/5 p-4 space-y-2">
                <div className="text-base font-semibold text-gray-900 dark:text-white mb-3">Additional information</div>
                <div className="divide-y divide-gray-200 dark:divide-white/10 text-sm">
                  {/* Identification */}
                  <div className="flex justify-between gap-3 py-2">
                    <span className="text-gray-600 dark:text-gray-400">Brand</span>
                    <span className="font-medium text-gray-900 dark:text-white">{product.brand}</span>
                  </div>
                  <div className="flex justify-between gap-3 py-2">
                    <span className="text-gray-600 dark:text-gray-400">Reference</span>
                    <span className="font-mono font-medium text-gray-900 dark:text-white">{product.reference}</span>
                  </div>
                  {((product as { suk?: string | null }).suk ?? product.productNumber) != null && (
                    <div className="flex justify-between gap-3 py-2">
                      <span className="text-gray-600 dark:text-gray-400">Our reference</span>
                      <span className="font-medium text-gray-900 dark:text-white">{(product as { suk?: string | null }).suk ?? product.productNumber}</span>
                    </div>
                  )}
                  {/* Type & Software specs */}
                  <div className="flex justify-between gap-3 py-2">
                    <span className="text-gray-600 dark:text-gray-400">Firmware type</span>
                    <span className="font-medium text-gray-900 dark:text-white">{FIRMWARE_LABELS[product.firmwareType] || product.firmwareType}</span>
                  </div>
                  {product.version && (
                    <div className="flex justify-between gap-3 py-2">
                      <span className="text-gray-600 dark:text-gray-400">Version</span>
                      <span className="font-mono font-medium text-gray-900 dark:text-white">{product.version}</span>
                    </div>
                  )}
                  {(product.compatibleModels?.length ?? 0) > 0 && (
                    <div className="flex justify-between gap-3 py-2">
                      <span className="text-gray-600 dark:text-gray-400">Chassis number</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {product.isBundle && (product.bundleChassisCount ?? 0) > 0
                          ? product.bundleChassisCount
                          : product.compatibleModels!.length}
                      </span>
                    </div>
                  )}
                  {product.volume && String(product.volume) !== "0" && (
                    <div className="flex justify-between gap-3 py-2">
                      <span className="text-gray-600 dark:text-gray-400">Volume</span>
                      <span className="font-medium text-gray-900 dark:text-white">{product.volume}</span>
                    </div>
                  )}
                  {product.fileSize && (
                    <div className="flex justify-between gap-3 py-2">
                      <span className="text-gray-600 dark:text-gray-400">File size</span>
                      <span className="font-medium text-gray-900 dark:text-white">{product.fileSize}</span>
                    </div>
                  )}
                  {/* Compatibility */}
                  {product.chassis && (
                    <div className="flex justify-between gap-3 py-2">
                      <span className="text-gray-600 dark:text-gray-400">Chassis</span>
                      <span className="font-mono font-medium text-gray-900 dark:text-white text-right break-words">{product.chassis}</span>
                    </div>
                  )}
                  {product.chipset && (
                    <div className="flex justify-between gap-3 py-2">
                      <span className="text-gray-600 dark:text-gray-400">Chipset / PCB</span>
                      <span className="font-medium text-gray-900 dark:text-white text-right break-words">{product.chipset}</span>
                    </div>
                  )}
                  {product.compatibleModels && product.compatibleModels.length > 0 && (
                    <div className="flex justify-between gap-3 py-2">
                      <span className="text-gray-600 dark:text-gray-400">Compatible models</span>
                      <span className="font-medium text-gray-900 dark:text-white text-right break-words max-w-[60%]">
                        {product.compatibleModels.length <= 5
                          ? product.compatibleModels.join(", ")
                          : `${product.compatibleModels.slice(0, 3).join(", ")} +${product.compatibleModels.length - 3} more`}
                      </span>
                    </div>
                  )}
                  {/* Bundle & delivery */}
                  {product.isBundle && (
                    <div className="flex justify-between gap-3 py-2">
                      <span className="text-gray-600 dark:text-gray-400">Bundle</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        Yes{(product.bundleChassisCount ?? 0) > 0 ? ` (${product.bundleChassisCount} chassis)` : ""}
                      </span>
                    </div>
                  )}
                  {(product.includesPhysicalDelivery || product.physicalUsbPrice != null) && (
                    <div className="flex justify-between gap-3 py-2">
                      <span className="text-gray-600 dark:text-gray-400">Physical delivery</span>
                      <span className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                        <Usb className="h-4 w-4 flex-shrink-0" />
                        {(product.storageCapacityGb ?? 64)}GB USB{product.physicalUsbPrice != null ? ` — ${formatMoney(product.physicalUsbPrice)} TND` : " included"}
                      </span>
                    </div>
                  )}
                  {product.includesYearlyUpdates && (
                    <div className="flex justify-between gap-3 py-2">
                      <span className="text-gray-600 dark:text-gray-400">Yearly updates</span>
                      <span className="font-medium text-green-700 dark:text-green-400">Free link at end of year</span>
                    </div>
                  )}
                  {/* Fulfillment & pricing */}
                  {product.fulfillmentMethod && (
                    <div className="flex justify-between gap-3 py-2">
                      <span className="text-gray-600 dark:text-gray-400">Fulfillment</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {product.fulfillmentMethod === "BOTH" ? "USB or Email" : product.fulfillmentMethod === "PHYSICAL_USB_WITH_LINKS" ? "Physical USB" : "Email links"}
                      </span>
                    </div>
                  )}
                  {product.hasFreeShipping && (
                    <div className="flex justify-between gap-3 py-2">
                      <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                      <span className="font-medium text-green-700 dark:text-green-400">Free shipping</span>
                    </div>
                  )}
                  {/* Sources */}
                  {product.sources && product.sources.length > 0 && (
                    <div className="flex justify-between gap-3 py-2">
                      <span className="text-gray-600 dark:text-gray-400">Sources</span>
                      <span className="font-medium text-gray-900 dark:text-white text-right break-words">{product.sources.join(", ")}</span>
                    </div>
                  )}
                  {/* Direct download */}
                  {product.downloadUrl && (
                    <div className="flex justify-between gap-3 py-2">
                      <span className="text-gray-600 dark:text-gray-400">Direct download</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">Link available</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 space-y-2 text-sm">
                <p className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold">NB</span>
                  Important notes
                </p>
                <p className="text-amber-900/80 dark:text-amber-200/70">
                  The software is provided as a digital download. Links are hosted on WeTransfer or our servers and remain accessible. For chassis packs, use Ctrl+F in the provided PDF to quickly find your chassis code.
                </p>
              </div>

              {product.downloadUrl && (
                <a
                  href={product.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Download link (WeTransfer)
                </a>
              )}
            </div>
          </div>

          {/* Right - Details */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{product.title}</h1>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Evaluation</span>
                  <div className="flex text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < (product.rating ?? 0) ? "fill-current" : "text-gray-300 dark:text-gray-700"}`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    {product.rating ?? 5} / 5
                  </span>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  <SoftwareDescription product={product} />
                </div>

              </div>

              {/* Price box - single option or BOTH (3 options) */}
              <div
                ref={addToCartSectionRef}
                className="border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl overflow-hidden"
              >
                {isBothFulfillment ? (
                  <div className="p-4 sm:p-5 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Choose your delivery method. Add to cart or Buy now with your selection.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(product.physicalUsbPrice != null || product.physicalUsbPrice === 0) && (
                        <button
                          type="button"
                          onClick={() => setSelectedFulfillment("PHYSICAL_USB_WITH_LINKS")}
                          className={`text-left rounded-lg p-3 space-y-2 border-2 transition-all ${
                            selectedFulfillment === "PHYSICAL_USB_WITH_LINKS"
                              ? "border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                              : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                            <Usb className="h-4 w-4 text-blue-500" />
                            USB stick ({storageGb}GB)
                          </div>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatMoney(usbPrice)} TND
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">64GB USB with download links</p>
                        </button>
                      )}
                      {(product.emailLinksPrice != null || product.emailLinksPrice === 0) && (
                        <button
                          type="button"
                          onClick={() => setSelectedFulfillment("EMAIL_DOWNLOAD_LINKS")}
                          className={`text-left rounded-lg p-3 space-y-2 border-2 transition-all ${
                            selectedFulfillment === "EMAIL_DOWNLOAD_LINKS"
                              ? "border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                              : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                            <Download className="h-4 w-4 text-blue-500" />
                            Email links
                          </div>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatMoney(emailPrice)} TND
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Links sent by email after payment</p>
                        </button>
                      )}
                      {(product.physicalUsbPrice != null || product.physicalUsbPrice === 0) && (product.emailLinksPrice != null || product.emailLinksPrice === 0) && (
                        <button
                          type="button"
                          onClick={() => setSelectedFulfillment("BOTH")}
                          className={`text-left rounded-lg p-3 space-y-2 border-2 transition-all ${
                            selectedFulfillment === "BOTH"
                              ? "border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                              : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                          }`}
                        >
                          <div className="text-sm font-medium text-gray-900 dark:text-white">Both</div>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatMoney(bothPrice)} TND
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">2 items: USB + email links</p>
                        </button>
                      )}
                    </div>
                    <div className="flex items-stretch gap-2 pt-2">
                      <div className="flex items-center bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-md overflow-hidden">
                        <button
                          onClick={decrementQuantity}
                          disabled={quantity <= 1}
                          className="h-10 w-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <div className="w-12 text-center text-sm font-semibold text-gray-900 dark:text-white">{quantity}</div>
                        <button
                          onClick={incrementQuantity}
                          disabled={quantity >= remainingStock}
                          className="h-10 w-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      {product.stock > 0 ? (
                        <>
                          <Button
                            className="h-10 px-6 rounded-md bg-green-700 hover:bg-green-600 text-white font-semibold"
                            onClick={handleDirectAddToCart}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to cart
                          </Button>
                          <Button
                            className="h-10 px-6 rounded-md bg-green-700 hover:bg-green-600 text-white font-semibold"
                            onClick={handleDirectPurchase}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Buy now
                          </Button>
                        </>
                      ) : (
                        <Button disabled className="h-10 px-6 opacity-50">Out of stock</Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-center">
                    <div>
                      <div className="flex items-end gap-3">
                        <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                          {formatMoney(displayPrice)}{" "}
                          <span className="text-base font-medium text-gray-500 dark:text-gray-400">TND</span>
                        </div>
                        {originalPrice != null && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 line-through pb-1">
                            {formatMoney(originalPrice)} TND
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <Download className="h-3.5 w-3.5" />
                        Digital download
                      </div>
                    </div>
                    <div className="flex items-stretch gap-2">
                      <div className="flex items-center bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-md overflow-hidden">
                        <button
                          onClick={decrementQuantity}
                          disabled={quantity <= 1}
                          className="h-10 w-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <div className="w-12 text-center text-sm font-semibold text-gray-900 dark:text-white">{quantity}</div>
                        <button
                          onClick={incrementQuantity}
                          disabled={quantity >= remainingStock}
                          className="h-10 w-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      {product.stock > 0 ? (
                        <>
                          <Button
                            className="h-10 px-6 rounded-md bg-green-700 hover:bg-green-600 text-white font-semibold"
                            onClick={handleDirectAddToCart}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to cart
                          </Button>
                          <Button
                            className="h-10 px-6 rounded-md bg-green-700 hover:bg-green-600 text-white font-semibold"
                            onClick={handleDirectPurchase}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Buy now
                          </Button>
                        </>
                      ) : (
                        <Button disabled className="h-10 px-6 opacity-50">Out of stock</Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Compatible chassis/models - under payment/buy section */}
              {chassisList.length > 0 && (
                <CompatibleChassisSection
                  models={chassisList}
                  label={product.firmwareType === "chassis_pack" ? "Included Chassis" : "Compatible Models"}
                />
              )}

            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
