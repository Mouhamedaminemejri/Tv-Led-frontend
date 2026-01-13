"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ShoppingCart, Star, CheckCircle2, AlertCircle, Package, Plus, Minus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
    DialogDescription,
    DialogHeader,
} from "@/components/ui/dialog";
import { useCart } from "@/context/cart-context";
import type { LedProduct } from "@/services/product-service";

interface ProductDetailDialogProps {
    product: LedProduct;
    children: React.ReactNode;
}

// Generate product description based on product data
function generateProductDescription(product: LedProduct): string {
    const features = [];
    
    if (product.size != null && product.size > 0) {
        features.push(`${product.size}" screen size`);
    } else {
        features.push("Universal compatibility");
    }
    
    if (product.tags.includes("Best Seller")) {
        features.push("best-selling");
    }
    
    if (product.tags.includes("Technician Choice")) {
        features.push("technician recommended");
    }
    
    const featureText = features.length > 0 ? features.join(", ") : "high-quality";
    
    return `Professional ${product.brand} LED backlight replacement strip for ${product.size != null && product.size > 0 ? `${product.size}"` : "various"} TV models. This ${featureText} component ensures optimal brightness and color accuracy for your television display. Compatible with reference ${product.reference}, this LED strip provides reliable performance and easy installation. Perfect for TV repair professionals and DIY enthusiasts seeking quality replacement parts.`;
}

// Generate sub-description with technical details
function generateSubDescription(product: LedProduct): string[] {
    const details = [];
    
    details.push(`Brand: ${product.brand}`);
    details.push(`Reference Code: ${product.reference}`);
    if (product.size != null && product.size > 0) {
        details.push(`Screen Size: ${product.size}"`);
    } else {
        details.push(`Screen Size: Universal`);
    }
    details.push(`Compatibility: ${product.brand} TV models`);
    
    if (product.tags.includes("Technician Choice")) {
        details.push(`Video Installation Guide: Available`);
    }
    
    return details;
}

export function ProductDetailDialog({ product, children }: ProductDetailDialogProps) {
    const [open, setOpen] = React.useState(false);
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
    const [quantity, setQuantity] = React.useState(1);
    const { cart, addToCart } = useCart();
    
    const images = product.images && product.images.length > 0 ? product.images : [product.images?.[0] || '/led-product.png'];
    const description = generateProductDescription(product);
    const subDescription = generateSubDescription(product);
    
    // Check existing quantity in cart
    const existingProduct = cart.find(item => item.id === product.id);
    const existingQuantity = existingProduct ? existingProduct.quantity : 0;
    const remainingStock = Math.max(0, product.stock - existingQuantity);
    
    // Reset quantity when dialog opens
    React.useEffect(() => {
        if (open) setQuantity(1);
    }, [open]);
    
    // Quantity handlers
    const incrementQuantity = () => {
        if (quantity < remainingStock) {
            setQuantity(prev => prev + 1);
        }
    };
    
    const decrementQuantity = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };
    
    // Direct add to cart function
    const handleDirectAddToCart = () => {
        if (remainingStock > 0 && quantity > 0) {
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
        }
    };
    
    // Reset to first image when dialog opens
    React.useEffect(() => {
        if (open) setCurrentImageIndex(0);
    }, [open]);
    
    const goToPreviousImage = () => {
        setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };
    
    const goToNextImage = () => {
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };
    
    // Keyboard navigation
    React.useEffect(() => {
        if (!open) return;
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") goToPreviousImage();
            if (e.key === "ArrowRight") goToNextImage();
            if (e.key === "Escape") setOpen(false);
        };
        
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, currentImageIndex, images.length]);
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] bg-white dark:bg-zinc-950 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white p-0 overflow-hidden gap-0" hideCloseButton>
                {/* Accessible Title */}
                <DialogHeader className="sr-only">
                    <DialogTitle>{product.title} - Product Details</DialogTitle>
                    <DialogDescription>
                        View detailed information, images, and specifications for {product.title}
                    </DialogDescription>
                </DialogHeader>
                
                {/* Close Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4 z-50 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 bg-white/80 dark:bg-black/50 backdrop-blur-sm text-gray-900 dark:text-white"
                    onClick={() => setOpen(false)}
                >
                    <X className="h-5 w-5" />
                </Button>
                
                <div className="flex flex-col lg:flex-row h-full max-h-[90vh] overflow-hidden">
                    {/* Left Side - Image Gallery */}
                    <div className="lg:w-1/2 flex flex-col bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black">
                        {/* Main Image */}
                        <div className="relative flex-1 min-h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black">
                            <div className="relative w-full h-full">
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
                                        variant="ghost"
                                        size="icon"
                                        className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/80 dark:bg-black/50 hover:bg-gray-200 dark:hover:bg-black/70 backdrop-blur-sm border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                                        onClick={goToPreviousImage}
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/80 dark:bg-black/50 hover:bg-gray-200 dark:hover:bg-black/70 backdrop-blur-sm border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                                        onClick={goToNextImage}
                                    >
                                        <ChevronRight className="h-6 w-6" />
                                    </Button>
                                </>
                            )}
                            
                            {/* Image Counter */}
                            {images.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-gray-900 dark:text-white">
                                    {currentImageIndex + 1} / {images.length}
                                </div>
                            )}
                        </div>
                        
                        {/* Thumbnail Strip - Only show if multiple images */}
                        {images.length > 1 && (
                            <div className="bg-gray-50 dark:bg-black/60 backdrop-blur-sm border-t border-gray-200 dark:border-white/10 px-6 py-4">
                                <div className="flex gap-3 justify-center overflow-x-auto pb-2">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentImageIndex(idx)}
                                            className={`relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${idx === currentImageIndex
                                                ? "border-gray-900 dark:border-blue-500 scale-110 shadow-lg shadow-gray-900/30 dark:shadow-blue-500/30"
                                                : "border-gray-300 dark:border-white/20 hover:border-gray-500 dark:hover:border-white/40 opacity-60 hover:opacity-100"
                                                }`}
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
                        )}
                    </div>
                    
                    {/* Right Side - Product Details */}
                    <div className="lg:w-1/2 flex flex-col overflow-y-auto custom-scrollbar">
                        <div className="p-8 space-y-6">
                            {/* Header */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider">
                                        {product.brand} • {product.reference}
                                    </span>
                                    {product.tags.includes("Best Seller") && (
                                        <span className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 border border-yellow-500/50 px-2 py-1 rounded text-xs font-bold">
                                            Best Seller
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">{product.title}</h2>
                                
                                {/* Rating */}
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex text-yellow-500">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`h-4 w-4 ${i < product.rating ? 'fill-current' : 'text-gray-300 dark:text-gray-700'}`} />
                                        ))}
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        ({product.id.charCodeAt(0) * 2 + 5} reviews)
                                    </span>
                                </div>
                            </div>
                            
                            {/* Price and Stock */}
                            <div className="flex items-start justify-between pb-6 border-b border-gray-200 dark:border-white/10">
                                <div>
                                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                        {product.price.toFixed(2)} <span className="text-lg font-normal text-gray-600 dark:text-gray-400">TND</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {product.stock > 0 ? (
                                            <>
                                                {product.stock < 5 ? (
                                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium flex items-center gap-1">
                                                        <AlertCircle className="h-4 w-4" />
                                                        Only {product.stock} left in stock
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium flex items-center gap-1">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        In Stock ({product.stock} available)
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1">
                                                <AlertCircle className="h-4 w-4" />
                                                Out of Stock
                                            </span>
                                        )}
                                    </div>
                                    {existingQuantity > 0 && (
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {existingQuantity} already in your cart
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Description */}
                            <div>
                                <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Description</h3>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{description}</p>
                            </div>
                            
                            {/* Technical Details */}
                            <div>
                                <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                                    <Package className="h-5 w-5" />
                                    Technical Specifications
                                </h3>
                                <div className="space-y-2">
                                    {subDescription.map((detail, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                            <div className="h-1.5 w-1.5 rounded-full bg-gray-900 dark:bg-gray-400"></div>
                                            <span>{detail}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Tags */}
                            {product.tags.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Features</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {product.tags.map((tag, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-full text-sm text-gray-700 dark:text-gray-300"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Add to Cart Section */}
                            <div className="pt-6 border-t border-gray-200 dark:border-white/10 space-y-4">
                                {product.stock > 0 ? (
                                    <>
                                        {/* Quantity Selector */}
                                        <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">Quantity</span>
                                            <div className="flex items-center gap-4">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-lg border-gray-300 dark:border-white/20 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
                                                    onClick={decrementQuantity}
                                                    disabled={quantity <= 1}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <span className="text-xl font-bold text-gray-900 dark:text-white min-w-[2rem] text-center">
                                                    {quantity}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-lg border-gray-300 dark:border-white/20 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
                                                    onClick={incrementQuantity}
                                                    disabled={quantity >= remainingStock}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                                Max: {remainingStock}
                                            </span>
                                        </div>
                                        
                                        {/* Add to Cart Button */}
                                        <Button 
                                            onClick={handleDirectAddToCart}
                                            disabled={remainingStock === 0 || quantity === 0}
                                            className="w-full bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-500 text-white font-bold h-14 rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ShoppingCart className="mr-2 h-5 w-5" />
                                            Add to Cart
                                        </Button>
                                    </>
                                ) : (
                                    <Button disabled className="w-full bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 font-bold h-14 rounded-xl text-lg cursor-not-allowed">
                                        Out of Stock
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

