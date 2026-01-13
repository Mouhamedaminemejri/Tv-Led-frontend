import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart, ZoomIn } from "lucide-react";
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

interface AddToCartDialogProps {
    product: LedProduct;
    children: React.ReactNode;
}

export function AddToCartDialog({ product, children }: AddToCartDialogProps) {
    const [quantity, setQuantity] = React.useState(1);
    const [open, setOpen] = React.useState(false);
    const [zoomPosition, setZoomPosition] = React.useState<{ x: number; y: number } | null>(null);
    const [isZooming, setIsZooming] = React.useState(false);
    const imageContainerRef = React.useRef<HTMLDivElement>(null);
    const { addToCart, cart } = useCart();

    const existingProduct = cart.find(item => item.id === product.id);
    const existingQuantity = existingProduct ? existingProduct.quantity : 0;
    const remainingStock = Math.max(0, product.stock - existingQuantity);
    
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
        addToCart({
            id: product.id,
            title: product.title,
            brand: product.brand,
            reference: product.reference,
            price: product.price,
            image: product.images?.[0] || '/led-product.png',
            quantity: quantity,
            stock: product.stock
        });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white p-0 overflow-hidden gap-0">
                <div 
                    ref={imageContainerRef}
                    className="relative h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black overflow-hidden"
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
                                src={product.images?.[0] || '/led-product.png'}
                                alt={product.title}
                                fill
                                className="object-cover"
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

                <div className="p-6">
                    <DialogHeader>
                        <div className="text-xs text-gray-600 dark:text-gray-400 font-bold mb-1 uppercase tracking-wider">{product.brand} • {product.reference}</div>
                        <DialogTitle className="text-xl text-gray-900 dark:text-white">{product.title}</DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-400 mt-2">
                            Professional grade LED backlight replacement. Verified for quality and longevity.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Price per unit</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{product.price.toFixed(2)} TND</span>
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
                        <div className="flex justify-end mt-2 text-xs text-gray-600 dark:text-gray-500">
                            Max available: {product.stock}
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:justify-between gap-4 border-t border-gray-200 dark:border-white/10 pt-4">
                        <div className="flex items-center justify-between w-full mb-4 sm:mb-0">
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-600 dark:text-gray-400">Total Price</span>
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{(product.price * quantity).toFixed(2)} <span className="text-sm text-gray-600 dark:text-gray-500">TND</span></span>
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
