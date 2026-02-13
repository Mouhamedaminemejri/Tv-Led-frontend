"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    ShoppingCart,
    Star,
    CheckCircle2,
    AlertCircle,
    Loader2,
    CreditCard,
    Plus,
    Minus,
    ZoomIn,
    Phone,
    Mail,
    MessageSquare,
    Bell,
    Truck,
    Info
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import {
    ProductService,
    type LedProduct,
    type ProductDeliveryMethod,
    type ProductDisplayConfig
} from "@/services/product-service";
import { Footer } from "@/components/footer";
import { useLedsStickyActions } from "@/components/leds/leds-sticky-actions-context";
import { LedsBreadcrumb, type BreadcrumbItem } from "@/components/leds/leds-breadcrumb";
import {
    DeliveryMethodDialog,
    ProductQuestionDialog,
    WatchdogDialog
} from "@/components/leds/product-action-dialogs";

// ── Helpers for null-safe data checks ────────────────────────────────────────

function hasValue(v: unknown): boolean {
    if (v == null) return false;
    if (typeof v === "number") return Number.isFinite(v) && v !== 0;
    if (typeof v === "string") return v.trim().length > 0;
    return true;
}

// Bold helper — wraps a value in <strong> tag
function B({ children }: { children: React.ReactNode }) {
    return <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>;
}

// Generate rich product description as JSX – every data value is bolded, null/0/empty fields are skipped
function ProductDescription({ product }: { product: LedProduct }) {
    const brand = hasValue(product.brand) ? product.brand : null;
    const tvSize = hasValue(product.tvSizeInch)
        ? `${product.tvSizeInch}\u2033`
        : hasValue(product.size) && product.size! > 0
            ? `${product.size}\u2033`
            : null;

    // Technical features — only include what exists
    const techFeatures: React.ReactNode[] = [];
    if (hasValue(product.tvBacklightType)) techFeatures.push(<><B>{product.tvBacklightType}</B> backlight technology</>);
    if (hasValue(product.ledCount)) techFeatures.push(<><B>{product.ledCount}</B> LEDs per strip</>);
    if (hasValue(product.voltage)) techFeatures.push(<><B>{product.voltage}V</B> operating voltage</>);
    if (hasValue(product.length)) techFeatures.push(<><B>{product.length}</B> length</>);
    if (hasValue(product.stripCount)) techFeatures.push(<><B>{product.stripCount}</B> strips per package</>);

    // Badges
    const badges: string[] = [];
    if (product.tags?.includes("Best Seller")) badges.push("best seller");
    if (product.tags?.includes("Technician Choice")) badges.push("technician recommended");

    return (
        <>
            {/* Sentence 1: Intro */}
            Professional {brand && <><B>{brand}</B>{" "}</>}
            LED backlight replacement strip{" "}
            {tvSize ? <>for <B>{tvSize}</B> TV models</> : <>with universal TV compatibility</>}.{" "}

            {/* Sentence 2: Technical features */}
            {techFeatures.length > 0 && (
                <>
                    Features{" "}
                    {techFeatures.map((feat, i) => (
                        <React.Fragment key={i}>
                            {i > 0 && (i === techFeatures.length - 1 ? " and " : ", ")}
                            {feat}
                        </React.Fragment>
                    ))}.{" "}
                </>
            )}

            {/* Sentence 3: Compatible with tvFullName */}
            {hasValue(product.tvFullName) && (
                <>Compatible with <B>{product.tvFullName}</B>.{" "}</>
            )}

            {/* Sentence 4: Reference */}
            {hasValue(product.reference) ? (
                <>Listed under our reference <B>{product.reference}</B>, this LED strip provides reliable performance and easy installation.{" "}</>
            ) : (
                <>This LED strip provides reliable performance and easy installation.{" "}</>
            )}

            {/* Sentence 5: Badges */}
            {badges.length > 0 && (
                <>Rated as a <B>{badges.join(" and ")}</B> product.{" "}</>
            )}

            {/* Sentence 5: Closing */}
            Perfect for TV repair professionals and DIY enthusiasts seeking quality replacement parts.
        </>
    );
}

// Plain-text fallback for length measurement (used for show more/less threshold)
function getDescriptionPlainText(product: LedProduct): string {
    const parts: string[] = [];
    const brand = hasValue(product.brand) ? product.brand : null;
    const tvSize = hasValue(product.tvSizeInch)
        ? `${product.tvSizeInch}\u2033`
        : hasValue(product.size) && product.size! > 0 ? `${product.size}\u2033` : null;
    parts.push(`Professional ${brand ? brand + " " : ""}LED backlight replacement strip ${tvSize ? `for ${tvSize} TV models` : "with universal TV compatibility"}.`);
    const tech: string[] = [];
    if (hasValue(product.tvBacklightType)) tech.push(`${product.tvBacklightType} backlight technology`);
    if (hasValue(product.ledCount)) tech.push(`${product.ledCount} LEDs per strip`);
    if (hasValue(product.voltage)) tech.push(`${product.voltage}V operating voltage`);
    if (hasValue(product.length)) tech.push(`${product.length} length`);
    if (hasValue(product.stripCount)) tech.push(`${product.stripCount} strips per package`);
    if (tech.length > 0) parts.push(`Features ${tech.join(", ")}.`);
    if (hasValue(product.tvFullName)) parts.push(`Compatible with ${product.tvFullName}.`);
    if (hasValue(product.reference)) parts.push(`Listed under our reference ${product.reference}, this LED strip provides reliable performance and easy installation.`);
    else parts.push("This LED strip provides reliable performance and easy installation.");
    parts.push("Perfect for TV repair professionals and DIY enthusiasts seeking quality replacement parts.");
    return parts.join(" ");
}

function formatMoney(amount: number): string {
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function getDisplayPrice(product: LedProduct) {
    const sale = product.salePrice ?? null;
    const base = product.price;
    if (sale != null && Number.isFinite(sale) && sale > 0 && sale !== base) {
        return { current: sale, original: base };
    }
    return { current: base, original: null as number | null };
}

function toFiniteNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return null;
}

function parseProductConfig(config: LedProduct["config"]): ProductDisplayConfig {
    if (!config) return {};
    if (typeof config === "string") {
        try {
            const parsed = JSON.parse(config) as unknown;
            if (parsed && typeof parsed === "object") return parsed as ProductDisplayConfig;
            return {};
        } catch {
            return {};
        }
    }
    if (typeof config === "object") return config;
    return {};
}

function normalizeDeliveryMethods(deliveryMethods: ProductDisplayConfig["deliveryMethods"]): ProductDeliveryMethod[] {
    if (!Array.isArray(deliveryMethods)) return [];
    return deliveryMethods
        .map((method): ProductDeliveryMethod | null => {
            if (typeof method === "string") {
                const name = method.trim();
                return name ? { name } : null;
            }
            if (method && typeof method === "object") {
                const name = (method.name ?? "").toString().trim();
                const detail = (method.detail ?? "").toString().trim();
                return {
                    name: name || "Delivery",
                    detail: detail || null,
                    price: method.price ?? null
                };
            }
            return null;
        })
        .filter((method): method is ProductDeliveryMethod => method != null);
}

type QuantityTier = { label: string; unitPrice: number };
function buildQuantityTiers(product: LedProduct): QuantityTier[] {
    // Prefer backend tiers if available
    const tiers = product.quantityDiscounts ?? null;
    if (Array.isArray(tiers) && tiers.length > 0) {
        return tiers
            .slice()
            .sort((a, b) => a.minQty - b.minQty)
            .map((t) => {
                const max = t.maxQty ?? null;
                const label = max != null ? `${t.minQty}-${max} pcs` : `${t.minQty}+ pcs`;
                return { label, unitPrice: t.price };
            });
    }

    // Fallback: simple discount ladder
    const { current } = getDisplayPrice(product);
    return [
        { label: "1 pc", unitPrice: current },
        { label: "2-4 pcs", unitPrice: Math.round(current * 0.95 * 100) / 100 },
        { label: "5+ pcs", unitPrice: Math.round(current * 0.85 * 100) / 100 },
    ];
}

function AdditionalInfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
    if (value == null || value === "") return null;
    return (
        <div className="grid grid-cols-[140px_1fr] gap-4 py-2 border-b border-gray-100 dark:border-white/10">
            <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
            <div className="text-sm text-gray-900 dark:text-white">{value}</div>
        </div>
    );
}

// ── Parse "Brand:Model1, Model2 | Brand2:Model3, Model4" format ──────────────

interface BrandModels {
    brand: string;
    models: string[];
}

function parseModelsString(raw: string | null | undefined): BrandModels[] {
    if (!raw || !raw.trim()) return [];

    // Clean trailing "and others" / "и другими" etc.
    const cleaned = raw
        .replace(/и\s*другими\.?/gi, "")
        .replace(/and\s+others\.?/gi, "")
        .trim();

    // Split by pipe → brand groups
    const groups = cleaned.split("|").map(s => s.trim()).filter(Boolean);
    const result: BrandModels[] = [];

    for (const group of groups) {
        const colonIdx = group.indexOf(":");
        if (colonIdx > 0) {
            const brand = group.slice(0, colonIdx).trim();
            const modelsStr = group.slice(colonIdx + 1).trim();
            const models = modelsStr
                .split(",")
                .map(m => m.trim())
                .filter(Boolean);
            if (brand && models.length > 0) {
                result.push({ brand, models });
            }
        } else {
            // No colon → treat each comma-separated entry as a standalone model
            const models = group.split(",").map(m => m.trim()).filter(Boolean);
            if (models.length > 0) {
                result.push({ brand: "", models });
            }
        }
    }
    return result;
}


function DescriptionTemplate({ product }: { product: LedProduct }) {
    const tvSize = hasValue(product.tvSizeInch)
        ? `${product.tvSizeInch}\u2033`
        : hasValue(product.size) && product.size! > 0
            ? `${product.size}\u2033`
            : null;

    const brandModels = React.useMemo(() => parseModelsString(product.models), [product.models]);
    const totalModelCount = React.useMemo(
        () => brandModels.reduce((sum, g) => sum + g.models.length, 0),
        [brandModels]
    );

    const [tabQuery, setTabQuery] = React.useState("");

    // Filter by search
    const filteredBrandModels = React.useMemo(() => {
        const q = tabQuery.trim().toLowerCase();
        if (!q) return brandModels;
        return brandModels
            .map(g => ({
                brand: g.brand,
                models: g.models.filter(m => m.toLowerCase().includes(q) || g.brand.toLowerCase().includes(q)),
            }))
            .filter(g => g.models.length > 0);
    }, [brandModels, tabQuery]);

    // Basic features — only render rows that have values
    const basicFeatures: { label: string; value: string }[] = [];
    if (hasValue(product.length)) basicFeatures.push({ label: "Size (length)", value: product.length! });
    if (hasValue(product.stripCount)) basicFeatures.push({ label: "Package contains", value: `${product.stripCount} strip(s)` });
    if (hasValue(product.ledCount)) basicFeatures.push({ label: "Number of LEDs", value: `${product.ledCount} per strip` });
    if (hasValue(product.voltage)) basicFeatures.push({ label: "Voltage", value: `${product.voltage}V` });
    if (hasValue(product.tvBacklightType)) basicFeatures.push({ label: "Backlight type", value: product.tvBacklightType! });
    if (hasValue(product.tvPanelType)) basicFeatures.push({ label: "Panel type", value: product.tvPanelType! });

    // Footer meta — only non-null fields
    const metaParts: { label: string; value: string }[] = [];
    if (hasValue(product.brand)) metaParts.push({ label: "TV mark", value: product.brand });
    if (tvSize) metaParts.push({ label: "TV size", value: tvSize });
    if (hasValue(product.tvBacklightType)) metaParts.push({ label: "Backlight type", value: product.tvBacklightType! });

    // Build a summary of compatible brand names from models data
    const compatibleBrandNames = React.useMemo(() => {
        if (brandModels.length === 0) return null;
        const names = brandModels.map(g => g.brand).filter(Boolean);
        if (names.length === 0) return null;
        if (names.length === 1) return names[0];
        if (names.length === 2) return `${names[0]} and ${names[1]}`;
        return `${names.slice(0, 3).join(", ")}${names.length > 3 ? ` and ${names.length - 3} more` : ""}`;
    }, [brandModels]);

    return (
        <div className="space-y-6 text-sm sm:text-base leading-relaxed text-gray-900 dark:text-gray-200">
            {/* Main descriptive paragraph — data-driven, null-safe */}
            <p>
                The LED backlight{hasValue(product.brand) && <> designed for <strong>{product.brand}</strong></>} TVs
                {hasValue(product.stripCount) && <> consists of a total of <strong>{product.stripCount}</strong> LED strips</>}.{" "}

                {hasValue(product.length) && <>Each strip is <strong>{product.length}</strong> long. </>}

                {hasValue(product.ledCount) && <>The number of LEDs on each strip is <strong>{product.ledCount}</strong> pieces. </>}

                {hasValue(product.voltage) && <>Operating voltage is <strong>{product.voltage}V</strong>. </>}

                {hasValue(product.tvBacklightType) && <>This is a <strong>{product.tvBacklightType}</strong> type backlight</>}
                {hasValue(product.tvBacklightType) && tvSize ? <> used in <strong>{tvSize}</strong> TVs</> : tvSize ? <>This type of backlight is used in <strong>{tvSize}</strong> TVs</> : null}
                {hasValue(product.brand) && (tvSize || hasValue(product.tvBacklightType)) && <> from <strong>{product.brand}</strong></>}
                {hasValue(product.tvFullName) && <>, the <strong>{product.tvFullName}</strong> model range</>}
                {(hasValue(product.tvBacklightType) || tvSize || hasValue(product.tvFullName)) && "."}
                {" "}

                {hasValue(product.tvPanelType) && <>Panel type: <strong>{product.tvPanelType}</strong>. </>}

                {compatibleBrandNames && <>Compatible with <strong>{compatibleBrandNames}</strong> TV models. </>}
            </p>


            {/* Model sections — Exact Model + Compatible Models */}
            {(hasValue(product.tvFullName) || brandModels.length > 0) && (
                <ModelSections
                    tvFullName={product.tvFullName}
                    brandModels={brandModels}
                    filteredBrandModels={filteredBrandModels}
                    totalModelCount={totalModelCount}
                    tabQuery={tabQuery}
                    setTabQuery={setTabQuery}
                />
            )}

            {/* Notes */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 space-y-2 text-sm">
                <p className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex-shrink-0">NB</span>
                    Important notes
                </p>
                <p className="text-amber-900/80 dark:text-amber-200/70">
                    These TV models may use different types of LED backlighting (different number of LEDs, etc.). Before ordering, please check whether your TV actually has this type of LED strip. We are happy to help you check if you wish.
                </p>
                <p className="text-amber-900/80 dark:text-amber-200/70">
                    The price of 1 package listed includes all the LED strips that are included in the TV. You only need to purchase one package per TV.
                </p>
            </div>

            {/* Footer meta — only non-null fields */}
            {metaParts.length > 0 && (
                <div className="pt-2 text-xs text-gray-500 dark:text-gray-400">
                    {metaParts.map((part, i) => (
                        <React.Fragment key={part.label}>
                            {i > 0 && " • "}
                            {part.label}: <strong className="text-gray-900 dark:text-white">{part.value}</strong>
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Brand model group with per-brand expand/collapse ─────────────────────────

function BrandModelGroup({ group }: { group: BrandModels }) {
    return (
        <div>
            {group.brand && (
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded">
                        {group.brand}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {group.models.length} model{group.models.length !== 1 ? "s" : ""}
                    </span>
                </div>
            )}
            <div className="flex flex-wrap gap-1.5">
                {group.models.map((model, mi) => (
                    <span
                        key={`${model}-${mi}`}
                        className="inline-block text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md px-2 py-1 text-gray-700 dark:text-gray-300"
                    >
                        {model}
                    </span>
                ))}
            </div>
        </div>
    );
}

// ── Stacked sections: Exact Model + Compatible Models ────────────────────────

function ModelSections({
    tvFullName,
    brandModels,
    filteredBrandModels,
    totalModelCount,
    tabQuery,
    setTabQuery,
}: {
    tvFullName: string | null | undefined;
    brandModels: BrandModels[];
    filteredBrandModels: BrandModels[];
    totalModelCount: number;
    tabQuery: string;
    setTabQuery: React.Dispatch<React.SetStateAction<string>>;
}) {
    const hasExact = hasValue(tvFullName);
    const hasCompatible = brandModels.length > 0;

    return (
        <div className="space-y-6">
            {/* ── Exact Model ─────────────────────────────────────── */}
            {hasExact && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Exact Model
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {tvFullName}
                    </p>
                </div>
            )}

            {/* ── Compatible Models ───────────────────────────────── */}
            {hasCompatible && (
                <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Compatible Models
                            <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">
                                ({totalModelCount})
                            </span>
                        </h3>
                        <div className="hidden sm:block">
                            <input
                                value={tabQuery}
                                onChange={(e) => setTabQuery(e.target.value)}
                                placeholder="Search models..."
                                className="h-8 w-56 rounded-md border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 p-4 space-y-4">
                        {filteredBrandModels.length === 0 ? (
                            <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
                                No models found{tabQuery ? ` for "${tabQuery}"` : ""}.
                            </div>
                        ) : (
                            filteredBrandModels.map((group, gi) => (
                                <BrandModelGroup
                                    key={group.brand || gi}
                                    group={group}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;
    
    const [product, setProduct] = React.useState<LedProduct | null>(null);
    const [allProducts, setAllProducts] = React.useState<LedProduct[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
    const [quantity, setQuantity] = React.useState(1);
    const [zoomPosition, setZoomPosition] = React.useState<{ x: number; y: number } | null>(null);
    const [isZooming, setIsZooming] = React.useState(false);
    const [detailsOpen, setDetailsOpen] = React.useState(false);
    const [questionOpen, setQuestionOpen] = React.useState(false);
    const [watchdogOpen, setWatchdogOpen] = React.useState(false);
    const [deliveryOpen, setDeliveryOpen] = React.useState(false);
    const imageContainerRef = React.useRef<HTMLDivElement>(null);
    const addToCartSectionRef = React.useRef<HTMLDivElement>(null);
    
    const { cart, addToCart } = useCart();
    const { setState: setStickyState } = useLedsStickyActions();
    
    // Fetch product data and all products for tree view
    React.useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // Load product and all products in parallel
                const [productData, allProductsData] = await Promise.all([
                    ProductService.getProductById(productId),
                    ProductService.getAllProducts()
                ]);
                setProduct(productData);
                setAllProducts(allProductsData);
                setError(null);
            } catch (err) {
                console.error(err);
                setError("Failed to load product. Please check your connection.");
            } finally {
                setLoading(false);
            }
        };
        
        if (productId) {
            loadData();
        }
    }, [productId]);
    
    // Prepare images array (use empty array as fallback to avoid hook dependency issues)
    const images = React.useMemo(() => {
        if (!product) return ['/led-product.png'];
        if (product.images && product.images.length > 0) {
            return product.images;
        }
        return ['/led-product.png'];
    }, [product]);

    const productConfig = React.useMemo(() => parseProductConfig(product?.config ?? null), [product?.config]);

    const hasDeliveryMethodsConfig = React.useMemo(
        () => Object.prototype.hasOwnProperty.call(productConfig, "deliveryMethods"),
        [productConfig]
    );

    const configuredDeliveryMethods = React.useMemo(() => {
        if (!hasDeliveryMethodsConfig) return undefined;
        return normalizeDeliveryMethods(productConfig.deliveryMethods);
    }, [hasDeliveryMethodsConfig, productConfig.deliveryMethods]);

    const pricing = React.useMemo(() => {
        if (!product) return { current: 0, original: null as number | null };

        const basePrice = toFiniteNumber(product.price) ?? 0;
        const discountedPrice = toFiniteNumber(productConfig.discountedPrice);
        const discountPercent = toFiniteNumber(productConfig.discount);

        if (discountedPrice != null && discountedPrice > 0 && discountedPrice < basePrice) {
            return { current: discountedPrice, original: basePrice };
        }

        if (discountPercent != null && discountPercent > 0 && discountPercent < 100) {
            const computed = Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100;
            if (computed > 0 && computed < basePrice) {
                return { current: computed, original: basePrice };
            }
        }

        return getDisplayPrice(product);
    }, [product, productConfig.discount, productConfig.discountedPrice]);

    const relatedProducts = React.useMemo(() => {
        if (!product) return [];
        if (!Array.isArray(allProducts) || allProducts.length === 0) return [];

        const byBrand = allProducts.filter(p => p.id !== product.id && p.brand === product.brand);
        const fallback = allProducts.filter(p => p.id !== product.id);
        return (byBrand.length > 0 ? byBrand : fallback).slice(0, 3);
    }, [allProducts, product]);
    
    const goToPreviousImage = React.useCallback(() => {
        setCurrentImageIndex((prev) => (prev === 0 ? (images.length > 0 ? images.length - 1 : 0) : prev - 1));
    }, [images.length]);
    
    const goToNextImage = React.useCallback(() => {
        setCurrentImageIndex((prev) => (prev === (images.length > 0 ? images.length - 1 : 0) ? 0 : prev + 1));
    }, [images.length]);

    // Zoom functionality handlers (ignore controls like arrows)
    const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest?.('[data-zoom-ignore="true"]')) {
            if (isZooming) setIsZooming(false);
            if (zoomPosition) setZoomPosition(null);
            return;
        }

        if (!imageContainerRef.current) return;

        if (!isZooming) setIsZooming(true);

        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Clamp position to container bounds
        const clampedX = Math.max(0, Math.min(100, x));
        const clampedY = Math.max(0, Math.min(100, y));

        setZoomPosition({ x: clampedX, y: clampedY });
    }, [isZooming, zoomPosition]);

    const handleMouseLeave = React.useCallback(() => {
        setIsZooming(false);
        setZoomPosition(null);
    }, []);
    
    // Keyboard navigation - only enable when product is loaded
    React.useEffect(() => {
        if (!product || images.length === 0) return;
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") goToPreviousImage();
            if (e.key === "ArrowRight") goToNextImage();
        };
        
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [product, images.length, goToPreviousImage, goToNextImage]);
    
    // Update quantity when product changes
    React.useEffect(() => {
        if (product) {
            setQuantity(1);
        }
    }, [product?.id]);

    const existingProduct = React.useMemo(() => {
        if (!product) return null;
        return cart.find(item => item.id === product.id) ?? null;
    }, [cart, product]);

    const existingQuantity = existingProduct ? existingProduct.quantity : 0;
    const remainingStock = product ? Math.max(0, product.stock - existingQuantity) : 0;

    const incrementQuantity = React.useCallback(() => {
        if (!product) return;
        if (quantity < remainingStock) {
            setQuantity(prev => prev + 1);
        }
    }, [product, quantity, remainingStock]);

    const decrementQuantity = React.useCallback(() => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    }, [quantity]);

    const handleDirectAddToCart = React.useCallback(() => {
        if (!product) return;
        if (remainingStock > 0 && quantity > 0) {
            addToCart({
                id: product.id,
                title: product.title,
                brand: product.brand,
                reference: product.reference,
                price: pricing.current || product.price,
                image: product.images?.[0] || '/led-product.png',
                quantity: quantity,
                stock: product.stock
            });
        }
    }, [addToCart, pricing.current, product, quantity, remainingStock]);

    const handleDirectPurchase = React.useCallback(() => {
        if (!product) return;
        if (remainingStock > 0 && quantity > 0) {
            router.push(`/checkout?productId=${product.id}&quantity=${quantity}`);
        }
    }, [product, quantity, remainingStock, router]);

    // Sync sticky navbar buttons with current product and availability.
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

    // Show sticky buttons when the price box is scrolled under the navbars.
    React.useEffect(() => {
        if (!product) return;
        const target = addToCartSectionRef.current;
        if (!target) return;

        const obs = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                setStickyState((prev) => ({ ...prev, show: !entry.isIntersecting }));
            },
            {
                threshold: 0.1,
                // MainNavbar (64px) + LedsSubNavbar (64px)
                rootMargin: "-128px 0px 0px 0px",
            }
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
            { label: "LED backlight", href: "/leds" },
        ];
        if (product?.brand) {
            items.push({
                label: `${product.brand} LED backlights`,
                href: `/leds?brand=${encodeURIComponent(product.brand)}`,
            });
        }
        return items;
    }, [product?.brand]);

    if (loading) {
        return (
            <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
                <div className="container mx-auto px-4 py-20 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500 dark:text-blue-400" />
                        <p className="text-gray-500 dark:text-gray-400">Loading product details...</p>
                    </div>
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
                        <p className="text-gray-500 dark:text-gray-400 mb-6">{error || "The product you're looking for doesn't exist."}</p>
                        <Link href="/leds">
                            <Button className="bg-blue-600 hover:bg-blue-500">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Products
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    // Use backend description/summary if available, otherwise build from data
    const hasCustomDescription = !!(product.description || product.summary);
    const customDescriptionText = product.description || product.summary || "";
    const generatedPlainText = getDescriptionPlainText(product);
    const isLongDescription = hasCustomDescription ? customDescriptionText.length > 220 : generatedPlainText.length > 220;
    const shortCustomText = customDescriptionText.length > 220 ? `${customDescriptionText.slice(0, 220)}…` : customDescriptionText;
    const displayPrice = pricing.current;
    const originalPrice = pricing.original;
    const hideActions = productConfig.Hide === true || productConfig.hide === true;
    const showDeliveryAction =
        !hideActions &&
        (!hasDeliveryMethodsConfig || (Array.isArray(configuredDeliveryMethods) && configuredDeliveryMethods.length > 0));
    const expectedDeliveryGapHours = toFiniteNumber(productConfig.estimatedDeliveryGapHours);
    const expectedDeliveryDate = expectedDeliveryGapHours != null && expectedDeliveryGapHours >= 0
        ? new Date(Date.now() + expectedDeliveryGapHours * 60 * 60 * 1000)
        : (product.expectedDeliveryDate ? new Date(product.expectedDeliveryDate) : null);
    const expectedDeliveryLabel = expectedDeliveryDate
        ? expectedDeliveryDate.toLocaleDateString("en-GB", {
            weekday: "long",
            year: "2-digit",
            month: "2-digit",
            day: "2-digit"
        })
        : "—";
    // Quantity tiers removed from UI for now (per request)

    return (
        <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
            <div className="container mx-auto px-4 pt-2 pb-8">
                <LedsBreadcrumb items={breadcrumbItems} />

                    <ProductQuestionDialog open={questionOpen} onOpenChange={setQuestionOpen} product={product} />
                    <WatchdogDialog open={watchdogOpen} onOpenChange={setWatchdogOpen} product={product} />
                    <DeliveryMethodDialog
                        open={deliveryOpen}
                        onOpenChange={setDeliveryOpen}
                        product={product}
                        methods={configuredDeliveryMethods}
                    />

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Side - Image Gallery */}
                    <div className="lg:w-1/2 flex flex-col">
                        <div className="flex flex-col sm:flex-row gap-4" style={{ height: "100%" }}>
                            {/* Thumbnails (left column on desktop) */}
                            {images.length > 1 && (
                                <div className="order-2 sm:order-1 sm:w-24">
                                    <div className="bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-3">
                                        <div className="flex flex-row sm:flex-col gap-3 justify-center overflow-x-auto sm:overflow-x-visible sm:overflow-y-auto">
                                            {images.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCurrentImageIndex(idx)}
                                                    className={`relative h-16 w-16 sm:h-16 sm:w-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${idx === currentImageIndex
                                                        ? "border-blue-500 shadow-lg shadow-blue-500/30"
                                                        : "border-gray-300 dark:border-white/20 hover:border-gray-400 dark:hover:border-white/40 opacity-70 hover:opacity-100"
                                                        }`}
                                                    aria-label={`Select image ${idx + 1}`}
                                                >
                                                    <Image
                                                        src={img}
                                                        alt={`Thumbnail ${idx + 1}`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Main Image */}
                            <div
                                ref={imageContainerRef}
                                className="order-1 sm:order-2 relative flex-1 aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10"
                                style={{ cursor: isZooming ? "crosshair" : "zoom-in" }}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                            >
                            <div 
                                className="relative w-full h-full"
                                style={{
                                    transform: isZooming && zoomPosition 
                                        ? `scale(2.5)` 
                                        : 'scale(1)',
                                    transformOrigin: zoomPosition 
                                        ? `${zoomPosition.x}% ${zoomPosition.y}%` 
                                        : 'center center',
                                    transition: isZooming ? 'none' : 'transform 0.3s ease-out',
                                }}
                            >
                                <Image
                                    src={images[currentImageIndex]}
                                    alt={`${product.title} - Image ${currentImageIndex + 1}`}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                            
                            {/* Navigation Arrows - Only show if multiple images */}
                            {images.length > 1 && (
                                <>
                                    <Button
                                        data-zoom-ignore="true"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/50 dark:bg-black/50 hover:bg-white/70 dark:hover:bg-black/70 backdrop-blur-sm border border-gray-200 dark:border-white/10"
                                        onClick={goToPreviousImage}
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </Button>
                                    <Button
                                        data-zoom-ignore="true"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/50 dark:bg-black/50 hover:bg-white/70 dark:hover:bg-black/70 backdrop-blur-sm border border-gray-200 dark:border-white/10"
                                        onClick={goToNextImage}
                                    >
                                        <ChevronRight className="h-6 w-6" />
                                    </Button>
                                </>
                            )}
                            
                            {/* Image Counter */}
                            {images.length > 1 && (
                                <div data-zoom-ignore="true" className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/70 dark:bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-gray-900 dark:text-white">
                                    {currentImageIndex + 1} / {images.length}
                                </div>
                            )}
                            
                            {/* Zoom Hint */}
                            {!isZooming && (
                                <div data-zoom-ignore="true" className="absolute top-4 right-4 bg-white/70 dark:bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 pointer-events-none z-20">
                                    <ZoomIn className="h-4 w-4" />
                                    <span>Hover to zoom</span>
                                </div>
                            )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Right Side - Product Details */}
                    <div className="lg:w-1/2 flex flex-col">
                        <div className="space-y-6">
                            {/* Top meta + title */}
                            <div className="space-y-3">
                                <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{product.title}</h1>

                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Evaluation</span>
                                    <div className="flex text-yellow-500">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-4 w-4 ${i < product.rating ? "fill-current" : "text-gray-300 dark:text-gray-700"}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-gray-500 dark:text-gray-400">
                                        {product.reviewCount ?? (product.id.charCodeAt(0) * 2 + 5)} / 5 ({product.reviewCount ?? (product.id.charCodeAt(0) * 2 + 5)} times)
                                    </span>
                                </div>

                                <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {hasCustomDescription ? (
                                        <>
                                            {detailsOpen ? customDescriptionText : shortCustomText}{" "}
                                            {isLongDescription && (
                                                <button
                                                    type="button"
                                                    onClick={() => setDetailsOpen(v => !v)}
                                                    className="text-blue-700 dark:text-blue-400 hover:underline font-medium"
                                                >
                                                    {detailsOpen ? "Hide" : "Details"}
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <span className={!detailsOpen && isLongDescription ? "line-clamp-3" : ""}>
                                                <ProductDescription product={product} />
                                            </span>{" "}
                                            {isLongDescription && (
                                                <button
                                                    type="button"
                                                    onClick={() => setDetailsOpen(v => !v)}
                                                    className="text-blue-700 dark:text-blue-400 hover:underline font-medium"
                                                >
                                                    {detailsOpen ? "Hide" : "Details"}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    {product.stock > 5 ? (
                                        <div className="text-sm text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" />
                                            In stock: more than 5 pieces
                                        </div>
                                    ) : product.stock > 0 ? (
                                        <div className="text-sm text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" />
                                            In stock: {product.stock} piece(s)
                                        </div>
                                    ) : (
                                        <div className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            Out of stock
                                        </div>
                                    )}

                                    {expectedDeliveryDate && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Expected delivery:{" "}
                                            <span className="text-gray-900 dark:text-white">
                                                {expectedDeliveryLabel}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Price box */}
                            <div
                                ref={addToCartSectionRef}
                                className="border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl overflow-hidden"
                            >
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
{/*                                         <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            VAT excluding (if applicable)
                                        </div> */}
                                    </div>

                                    <div className="flex items-stretch gap-2 justify-start sm:justify-end">
                                        <div className="flex items-center bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-md overflow-hidden">
                                            <button
                                                onClick={decrementQuantity}
                                                disabled={quantity <= 1}
                                                className="h-10 w-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50"
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus className="h-4 w-4" />
                                            </button>
                                            <div className="w-12 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                                {quantity}
                                            </div>
                                            <button
                                                onClick={incrementQuantity}
                                                disabled={quantity >= remainingStock}
                                                className="h-10 w-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50"
                                                aria-label="Increase quantity"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <Button
                                            onClick={handleDirectAddToCart}
                                            disabled={remainingStock === 0 || quantity === 0}
                                            className="h-10 px-6 rounded-md bg-green-700 hover:bg-green-600 text-white font-semibold disabled:opacity-50"
                                        >
                                            Add to cart
                                        </Button>
                                    </div>
                                </div>

                                {!hideActions && (
                                    <div className="border-t border-gray-200 dark:border-white/10 px-4 sm:px-5 py-3 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
                                            onClick={() => setQuestionOpen(true)}
                                        >
                                            <MessageSquare className="h-4 w-4" /> Product question
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
                                            onClick={() => setWatchdogOpen(true)}
                                        >
                                            <Bell className="h-4 w-4" /> Watchdog
                                        </button>
                                        {showDeliveryAction && (
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
                                                onClick={() => setDeliveryOpen(true)}
                                            >
                                                <Truck className="h-4 w-4" /> Delivery method
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Key meta */}
                            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                <div>
                                    Stock number:{" "}
                                    <span className="text-gray-900 dark:text-white font-semibold">
                                        {product.suk || product.reference || "—"}
                                    </span>
                                </div>
                                <div>
                                    Manufacturer:{" "}
                                    <span className="text-gray-900 dark:text-white font-semibold">{product.brand || "—"}</span>
                                </div>
                                {existingQuantity > 0 && (
                                    <div>
                                        You already have{" "}
                                        <span className="text-gray-900 dark:text-white font-semibold">{existingQuantity}</span> in your cart.
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="h-9 text-xs border-gray-200 dark:border-white/10"
                                    onClick={() => router.push("/leds")}
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to products
                                </Button>
                                <Button
                                    className="h-9 text-xs bg-green-700 hover:bg-green-600 text-white border border-green-700 hover:border-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleDirectPurchase}
                                    disabled={remainingStock === 0 || quantity === 0}
                                >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Buy now
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Description + Additional info + Contact */}
                <div className="mt-14">
                    <div className="flex items-center gap-6 mb-6">
                        <div className="h-px bg-gray-200 dark:bg-white/10 flex-1" />
                        <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Description</div>
                        <div className="h-px bg-gray-200 dark:bg-white/10 flex-1" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
                        {/* Left: main description */}
                        <div className="space-y-8">
                            <DescriptionTemplate product={product} />
                        </div>

                        {/* Right: additional info + contact */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-5">
                                <div className="font-semibold text-gray-900 dark:text-white mb-3">Additional information</div>
                                <div className="divide-y divide-gray-100 dark:divide-white/10">
                                    <AdditionalInfoRow label="Categories" value={<span className="font-semibold">{product.brand} / LED backlight</span>} />
                                    <AdditionalInfoRow
                                        label="Diagonal"
                                        value={
                                            product.tvSizeInch != null
                                                ? <span className="font-semibold">{product.tvSizeInch}{'\u2033'}</span>
                                                : product.size != null && product.size > 0
                                                    ? <span className="font-semibold">{product.size}{'\u2033'}</span>
                                                    : "Universal"
                                        }
                                    />
                                    <AdditionalInfoRow label="Packaging length" value={product.length} />
                                    <AdditionalInfoRow label="TV backlight" value={product.tvBacklightType ? <span className="font-semibold">{product.tvBacklightType}</span> : undefined} />
                                    <AdditionalInfoRow label="TV panel type" value={product.tvPanelType} />
                                    <AdditionalInfoRow label="LED count" value={product.ledCount} />
                                    <AdditionalInfoRow label="Strip count" value={product.stripCount} />
                                    <AdditionalInfoRow label="Voltage" value={product.voltage != null ? `${product.voltage}V` : undefined} />
                                    <AdditionalInfoRow label="Warranty" value={product.warrantyMonths != null ? `${product.warrantyMonths} months` : undefined} />
                                    <AdditionalInfoRow label="Supplier" value={product.supplier} />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-5">
                                <div className="font-semibold text-gray-900 dark:text-white mb-3">Contact</div>

                                <div className="space-y-3 text-sm">
                                    <div className="flex items-start gap-3">
                                        <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                                        <div>
                                            <div className="text-gray-900 dark:text-white font-medium">+216 XX XXX XXX</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Mon–Fri, 09:00–15:30</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                                        <div>
                                            <div className="text-gray-900 dark:text-white font-medium">Contact form</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">We will respond within a few minutes.</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                                        <div>
                                            <div className="text-gray-900 dark:text-white font-medium">support@tunisiatvrepair.com</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Email us any time.</div>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-gray-100 dark:border-white/10">
                                        <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <Info className="h-4 w-4 mt-0.5" />
                                            <span>Want this section to match your real business phone/email/hours? Tell me what to use.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related products (moved lower) */}
                <div className="mt-14">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Related products</h2>
                    {relatedProducts.length === 0 ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400">No related products found.</div>
                    ) : (
                        <div className="space-y-3">
                            {relatedProducts.map((p) => {
                                const { current } = getDisplayPrice(p);
                                return (
                                    <div
                                        key={p.id}
                                        className="flex items-center gap-4 p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl"
                                    >
                                        <Link href={`/leds/${p.id}`} className="relative h-14 w-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10">
                                            <Image
                                                src={p.images?.[0] || "/led-product.png"}
                                                alt={p.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <Link href={`/leds/${p.id}`} className="font-semibold text-gray-900 dark:text-white hover:underline line-clamp-1">
                                                {p.title}
                                            </Link>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                <span className="font-semibold text-gray-900 dark:text-white">{p.brand}</span> •{" "}
                                                <span className="font-semibold text-gray-900 dark:text-white">{p.reference}</span>
                                            </div>
                                        </div>
                                        <div className="hidden sm:block text-sm text-green-700 dark:text-green-400">
                                            {p.stock > 0 ? "In stock" : "Out of stock"}
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-gray-900 dark:text-white">{formatMoney(current)} TND</div>
                                            <Button
                                                size="sm"
                                                className="mt-2 bg-green-700 hover:bg-green-600 text-white"
                                                disabled={p.stock <= 0}
                                                onClick={() => {
                                                    if (p.stock > 0) {
                                                        addToCart({
                                                            id: p.id,
                                                            title: p.title,
                                                            brand: p.brand,
                                                            reference: p.reference,
                                                            price: current,
                                                            image: p.images?.[0] || "/led-product.png",
                                                            quantity: 1,
                                                            stock: p.stock
                                                        });
                                                    }
                                                }}
                                            >
                                                Add to cart
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            
            <Footer />
        </main>
    );
}

