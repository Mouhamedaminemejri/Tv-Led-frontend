import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart, ZoomIn, Usb, Download } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useCart } from "@/context/cart-context";
import type { LedProduct } from "@/services/product-service";
import type { SoftwareProduct } from "@/services/software-product-service";

/** Minimal product shape for cart (LED or Software) */
export interface CartProductBase {
    id: string;
    title: string;
    brand: string;
    reference: string;
    price: number;
    images?: string[];
    stock: number;
}

interface AddToCartDialogProps {
    product: LedProduct | CartProductBase | SoftwareProduct;
    children: React.ReactNode;
    /** When true, clicking adds directly to cart without opening the dialog (for software) */
    directAdd?: boolean;
}

function isSoftwareProduct(p: LedProduct | CartProductBase | SoftwareProduct): p is SoftwareProduct {
    return "firmwareType" in p;
}

const FIRMWARE_LABELS: Record<string, string> = {
    update: "Update",
    usb: "USB",
    recovery: "Recovery",
    chassis_pack: "Chassis Pack",
};

export function AddToCartDialog({ product, children, directAdd = false }: AddToCartDialogProps) {
    const [quantity, setQuantity] = React.useState(1);
    const [selectedFulfillment, setSelectedFulfillment] = React.useState<"PHYSICAL_USB_WITH_LINKS" | "EMAIL_DOWNLOAD_LINKS" | "BOTH">("PHYSICAL_USB_WITH_LINKS");
    const [open, setOpen] = React.useState(false);
    const [zoomPosition, setZoomPosition] = React.useState<{ x: number; y: number } | null>(null);
    const [isZooming, setIsZooming] = React.useState(false);
    const imageContainerRef = React.useRef<HTMLDivElement>(null);
    const { addToCart, cart } = useCart();

    const existingProduct = cart.find(item => item.id === product.id);
    const existingQuantity = existingProduct ? existingProduct.quantity : 0;
    const remainingStock = Math.max(0, product.stock - existingQuantity);
    const diagonal = "tvSizeInch" in product ? product.tvSizeInch : "size" in product ? (product as LedProduct).size : null;
    const isSoftware = isSoftwareProduct(product);

    const sp = isSoftware ? (product as SoftwareProduct) : null;
    const isBothFulfillment = !!(sp?.fulfillmentMethod === "BOTH");
    const usbPrice = sp ? (sp.physicalUsbPrice ?? sp.price) : 0;
    const emailPrice = sp ? (sp.emailLinksPrice ?? sp.price) : 0;
    const bothPrice = usbPrice + emailPrice;
    const effectiveUnitPrice = isBothFulfillment
        ? (selectedFulfillment === "BOTH" ? bothPrice : selectedFulfillment === "PHYSICAL_USB_WITH_LINKS" ? usbPrice : emailPrice)
        : Number("price" in product ? product.price : 0) || 0;
    const unitPrice = effectiveUnitPrice;
    const totalPrice = unitPrice * quantity;
    
    // Zoom functionality handlers
    const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageContainerRef.current || !isZooming) return;
        
        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        // Clamp position to container bounds
        const clampedX = Math.max(0, Math.min(100, x));
        const clampedY = Math.max(0, Math.min(100, y));
        
        setZoomPosition({ x: clampedX, y: clampedY });
    }, [isZooming]);

    const handleMouseEnter = React.useCallback(() => {
        setIsZooming(true);
    }, []);

    const handleMouseLeave = React.useCallback(() => {
        setIsZooming(false);
        setZoomPosition(null);
    }, []);

    // Reset quantity when dialog opens
    React.useEffect(() => {
        if (open) setQuantity(1);
    }, [open]);

    const increment = () => {
        if (quantity < remainingStock) {
            setQuantity(prev => prev + 1);
        }
    };

    const decrement = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    const handleAddToCart = () => {
        const price = isBothFulfillment ? effectiveUnitPrice : ("price" in product ? product.price : 0);
        const isSoftware = isSoftwareProduct(product);
        addToCart({
            id: product.id,
            title: product.title,
            brand: product.brand,
            reference: product.reference,
            price,
            image: product.images?.[0] || (isSoftware ? "/file.svg" : "/led-product.png"),
            quantity,
            stock: product.stock,
            ...(isSoftware && {
                itemType: "software" as const,
                selectedFulfillment,
                fulfillmentMethod: sp?.fulfillmentMethod,
                physicalUsbPrice: sp?.physicalUsbPrice,
                emailLinksPrice: sp?.emailLinksPrice,
            }),
        });
        setOpen(false);
    };

    const handleDirectAdd = () => {
        const price = "price" in product ? product.price : 0;
        const isSoftware = isSoftwareProduct(product);
        addToCart({
            id: product.id,
            title: product.title,
            brand: product.brand,
            reference: product.reference,
            price,
            image: product.images?.[0] || (isSoftware ? "/file.svg" : "/led-product.png"),
            quantity: 1,
            stock: product.stock,
            ...(isSoftware && { itemType: "software" as const }),
        });
    };

    if (directAdd) {
        const wrapped = React.isValidElement(children) ? (
            React.cloneElement(children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>, {
                onClick: (e: React.MouseEvent) => {
                    (children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>).props?.onClick?.(e);
                    handleDirectAdd();
                },
                disabled: product.stock <= 0,
            })
        ) : (
            <Button
                className="w-full rounded-none bg-green-700 hover:bg-green-600 text-white font-semibold"
                onClick={handleDirectAdd}
                disabled={product.stock <= 0}
            >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to cart
            </Button>
        );
        return <div onClick={(e) => e.stopPropagation()}>{wrapped}</div>;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md min-h-[70vh] max-h-[90vh] bg-white dark:bg-zinc-950 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white p-0 overflow-hidden gap-0 flex flex-col">
                <div 
                    ref={imageContainerRef}
                    className="relative h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black overflow-hidden shrink-0"
                    style={{ cursor: isZooming ? 'crosshair' : 'zoom-in' }}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="relative w-full h-full p-6 flex items-center justify-center">
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
                                src={product.images?.[0] || (isSoftware ? "/file.svg" : "/led-product.png")}
                                alt={product.title}
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>
                    {/* Zoom Hint */}
                    {!isZooming && (
                        <div className="absolute top-4 left-4 bg-white/80 dark:bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 pointer-events-none z-20">
                            <ZoomIn className="h-4 w-4" />
                            <span>Hover to zoom</span>
                        </div>
                    )}
                    {product.stock < 5 && (
                        <div className="absolute top-12 left-4 bg-gray-200 dark:bg-red-500/20 text-gray-700 dark:text-red-500 border border-gray-400 dark:border-red-500/50 px-2 py-1 rounded text-xs font-bold z-10">
                            Only {product.stock} left!
                        </div>
                    )}
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-gray-900 dark:text-white">{product.title}</DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-400 mt-2">
                            {isSoftware
                                ? (product.summary || product.description || "Digital download. Links hosted on WeTransfer or our servers.")
                                : "Professional grade LED backlight replacement. Verified for quality and longevity."}
                        </DialogDescription>
                    </DialogHeader>

                    {isBothFulfillment && sp && (
                        <div className="mt-4 space-y-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Choose your delivery method at checkout. Select below.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {(sp.physicalUsbPrice != null || sp.physicalUsbPrice === 0) && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedFulfillment("PHYSICAL_USB_WITH_LINKS")}
                                        className={`text-left rounded-lg p-3 space-y-1 border-2 transition-all ${
                                            selectedFulfillment === "PHYSICAL_USB_WITH_LINKS"
                                                ? "border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                                                : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                                            <Usb className="h-4 w-4 text-blue-500" />
                                            USB ({(sp.storageCapacityGb ?? 0) > 0 ? sp.storageCapacityGb : 64}GB)
                                        </div>
                                        <p className="text-base font-bold text-gray-900 dark:text-white">{usbPrice.toFixed(2)} TND</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">USB with download links</p>
                                    </button>
                                )}
                                {(sp.emailLinksPrice != null || sp.emailLinksPrice === 0) && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedFulfillment("EMAIL_DOWNLOAD_LINKS")}
                                        className={`text-left rounded-lg p-3 space-y-1 border-2 transition-all ${
                                            selectedFulfillment === "EMAIL_DOWNLOAD_LINKS"
                                                ? "border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                                                : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                                            <Download className="h-4 w-4 text-blue-500" />
                                            Email links
                                        </div>
                                        <p className="text-base font-bold text-gray-900 dark:text-white">{emailPrice.toFixed(2)} TND</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Links by email after payment</p>
                                    </button>
                                )}
                                {(sp.physicalUsbPrice != null || sp.physicalUsbPrice === 0) && (sp.emailLinksPrice != null || sp.emailLinksPrice === 0) && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedFulfillment("BOTH")}
                                        className={`text-left rounded-lg p-3 space-y-1 border-2 transition-all ${
                                            selectedFulfillment === "BOTH"
                                                ? "border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                                                : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                                        }`}
                                    >
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">Both</div>
                                        <p className="text-base font-bold text-gray-900 dark:text-white">{bothPrice.toFixed(2)} TND</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">USB + email links</p>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="py-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Price per unit</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{unitPrice.toFixed(2)} TND</span>
                        </div>

                        <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-200 dark:border-white/10 mt-4">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Quantity</span>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-full border-gray-300 dark:border-white/20 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
                                    onClick={decrement}
                                    disabled={quantity <= 1}
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-bold text-lg text-gray-900 dark:text-white">{quantity}</span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-full border-gray-300 dark:border-white/20 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
                                    onClick={increment}
                                    disabled={quantity >= remainingStock || remainingStock === 0}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                        {product.stock > 0 && (
                            <div className="flex justify-end mt-2 text-xs text-gray-600 dark:text-gray-500">
                                Max available: {product.stock}
                            </div>
                        )}

                        <div className="mt-5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4 sm:p-5">
                            <div className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                                Additional information
                            </div>
                            <div className="divide-y divide-gray-200 dark:divide-white/10 text-sm">
                                {isSoftware ? (
                                    <>
                                        <div className="flex items-center justify-between gap-3 py-2">
                                            <span className="text-gray-600 dark:text-gray-400">Brand / Reference</span>
                                            <span className="text-right font-medium text-gray-900 dark:text-white break-words">
                                                {product.brand || "—"} / {(product as SoftwareProduct).reference || "—"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-2">
                                            <span className="text-gray-600 dark:text-gray-400">Firmware type</span>
                                            <span className="text-right font-medium text-gray-900 dark:text-white">
                                                {FIRMWARE_LABELS[(product as SoftwareProduct).firmwareType] || (product as SoftwareProduct).firmwareType || "—"}
                                            </span>
                                        </div>
                                        {(product as SoftwareProduct).version && (
                                            <div className="flex items-center justify-between gap-3 py-2">
                                                <span className="text-gray-600 dark:text-gray-400">Version</span>
                                                <span className="text-right font-medium text-gray-900 dark:text-white">{(product as SoftwareProduct).version}</span>
                                            </div>
                                        )}
                                        {(product as SoftwareProduct).fileSize && (
                                            <div className="flex items-center justify-between gap-3 py-2">
                                                <span className="text-gray-600 dark:text-gray-400">File size</span>
                                                <span className="text-right font-medium text-gray-900 dark:text-white">{(product as SoftwareProduct).fileSize}</span>
                                            </div>
                                        )}
                                        {(product as SoftwareProduct).volume && (
                                            <div className="flex items-center justify-between gap-3 py-2">
                                                <span className="text-gray-600 dark:text-gray-400">Volume</span>
                                                <span className="text-right font-medium text-gray-900 dark:text-white">{(product as SoftwareProduct).volume}</span>
                                            </div>
                                        )}
                                        {((product as SoftwareProduct).includesPhysicalDelivery || (product as SoftwareProduct).physicalUsbPrice != null) && (
                                            <div className="flex items-center justify-between gap-3 py-2">
                                                <span className="text-gray-600 dark:text-gray-400">Physical delivery</span>
                                                <span className="text-right font-medium text-gray-900 dark:text-white">
                                                    {((product as SoftwareProduct).storageCapacityGb ?? 0) > 0 ? (product as SoftwareProduct).storageCapacityGb : 64}GB USB
                                                </span>
                                            </div>
                                        )}
                                        {(product as SoftwareProduct).downloadUrl && (
                                            <div className="flex items-center justify-between gap-3 py-2">
                                                <span className="text-gray-600 dark:text-gray-400">Download</span>
                                                <span className="text-right font-medium text-blue-600 dark:text-blue-400">Direct link available</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between gap-3 py-2">
                                            <span className="text-gray-600 dark:text-gray-400">Categories</span>
                                            <span className="text-right font-medium text-gray-900 dark:text-white break-words">
                                                {product.brand || "—"} / LED backlight
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-2">
                                            <span className="text-gray-600 dark:text-gray-400">Diagonal</span>
                                            <span className="text-right font-medium text-gray-900 dark:text-white">
                                                {diagonal != null ? `${diagonal}″` : "—"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-2">
                                            <span className="text-gray-600 dark:text-gray-400">Packaging length</span>
                                            <span className="text-right font-medium text-gray-900 dark:text-white break-words">
                                                {"length" in product ? (product as LedProduct).length || "—" : "—"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-2">
                                            <span className="text-gray-600 dark:text-gray-400">TV backlight</span>
                                            <span className="text-right font-medium text-gray-900 dark:text-white break-words">
                                                {"tvBacklightType" in product ? (product as LedProduct).tvBacklightType || "—" : "—"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-2">
                                            <span className="text-gray-600 dark:text-gray-400">LED count</span>
                                            <span className="text-right font-medium text-gray-900 dark:text-white">
                                                {"ledCount" in product ? (product as LedProduct).ledCount || "—" : "—"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-2">
                                            <span className="text-gray-600 dark:text-gray-400">Strip count</span>
                                            <span className="text-right font-medium text-gray-900 dark:text-white">
                                                {"stripCount" in product ? (product as LedProduct).stripCount || "—" : "—"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-2">
                                            <span className="text-gray-600 dark:text-gray-400">Voltage</span>
                                            <span className="text-right font-medium text-gray-900 dark:text-white">
                                                {"voltage" in product && (product as LedProduct).voltage != null ? `${(product as LedProduct).voltage}V` : "—"}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:justify-between gap-4 border-t border-gray-200 dark:border-white/10 pt-4">
                        <div className="flex items-center justify-between w-full mb-4 sm:mb-0">
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-600 dark:text-gray-400">Total Price</span>
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalPrice.toFixed(2)} <span className="text-sm text-gray-600 dark:text-gray-500">TND</span></span>
                            </div>
                        </div>
                        <Button className="w-full bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-500 text-white font-bold h-12 rounded-xl" onClick={handleAddToCart}>
                            <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
