"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowLeft, ShoppingCart, Star, CheckCircle2, AlertCircle, Package, Loader2, Home, CreditCard, Plus, Minus, ZoomIn } from "lucide-react";
import { AddToCartDialog } from "@/components/add-to-cart-dialog";
import { useCart } from "@/context/cart-context";
import { ProductService, type LedProduct } from "@/services/product-service";
import { Footer } from "@/components/footer";
import { ProductsTreeView } from "@/components/products-tree-view";

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

// Sub-components for Header
function CartPrice() {
    const { cartTotal } = useCart();
    return <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{cartTotal.toFixed(2)} TND</span>;
}

function CartTriggerBtn() {
    const { cartCount, openCart } = useCart();
    return (
        <Button size="icon" className="rounded-full bg-blue-600 hover:bg-blue-500 relative" onClick={openCart}>
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                    {cartCount}
                </span>
            )}
        </Button>
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
    const imageContainerRef = React.useRef<HTMLDivElement>(null);
    
    const { cart, addToCart, openCart } = useCart();
    
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
    
    const goToPreviousImage = React.useCallback(() => {
        setCurrentImageIndex((prev) => (prev === 0 ? (images.length > 0 ? images.length - 1 : 0) : prev - 1));
    }, [images.length]);
    
    const goToNextImage = React.useCallback(() => {
        setCurrentImageIndex((prev) => (prev === (images.length > 0 ? images.length - 1 : 0) ? 0 : prev + 1));
    }, [images.length]);

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
    
    const description = generateProductDescription(product);
    const subDescription = generateSubDescription(product);
    
    // Check existing quantity in cart
    const existingProduct = cart.find(item => item.id === product.id);
    const existingQuantity = existingProduct ? existingProduct.quantity : 0;
    const remainingStock = Math.max(0, product.stock - existingQuantity);
    
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
    
    // Direct add to cart function (uses selected quantity)
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
        }
    };
    
    // Direct purchase function - navigates to checkout page
    const handleDirectPurchase = () => {
        if (remainingStock > 0 && quantity > 0) {
            router.push(`/checkout?productId=${product.id}&quantity=${quantity}`);
        }
    };
    
    return (
        <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-8">
                    {/* Breadcrumb Navigation */}
                    {product && (
                        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Link href="/" className="hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1">
                                <Home className="h-4 w-4" />
                                <span className="hidden sm:inline">Home</span>
                            </Link>
                            <span>/</span>
                            <Link href="/leds" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                                Products
                            </Link>
                            <span>/</span>
                            <span 
                                className="text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-[200px] cursor-default"
                                title={product.title}
                            >
                                {product.title}
                            </span>
                        </nav>
                    )}
                    
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end mr-2 hidden sm:flex">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Your Basket</span>
                            <CartPrice />
                        </div>
                        <CartTriggerBtn />
                    </div>
                </div>
            </header>
            
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Side - Image Gallery */}
                    <div className="lg:w-1/2 flex flex-col">
                        {/* Main Image */}
                        <div 
                            ref={imageContainerRef}
                            className="relative w-full aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black rounded-2xl overflow-hidden mb-4"
                            style={{ cursor: isZooming ? 'crosshair' : 'zoom-in' }}
                            onMouseMove={handleMouseMove}
                            onMouseEnter={handleMouseEnter}
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
                                        variant="ghost"
                                        size="icon"
                                        className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/50 dark:bg-black/50 hover:bg-white/70 dark:hover:bg-black/70 backdrop-blur-sm border border-gray-200 dark:border-white/10"
                                        onClick={goToPreviousImage}
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </Button>
                                    <Button
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
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/70 dark:bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-gray-900 dark:text-white">
                                    {currentImageIndex + 1} / {images.length}
                                </div>
                            )}
                            
                            {/* Zoom Hint */}
                            {!isZooming && (
                                <div className="absolute top-4 right-4 bg-white/70 dark:bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 pointer-events-none z-20">
                                    <ZoomIn className="h-4 w-4" />
                                    <span>Hover to zoom</span>
                                </div>
                            )}
                        </div>
                        
                        {/* Thumbnail Strip - Only show if multiple images */}
                        {images.length > 1 && (
                            <div className="bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-4">
                                <div className="flex gap-3 justify-center overflow-x-auto pb-2 pt-2">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentImageIndex(idx)}
                                            className={`relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${idx === currentImageIndex
                                                ? "border-blue-500 scale-110 shadow-lg shadow-blue-500/30"
                                                : "border-gray-300 dark:border-white/20 hover:border-gray-400 dark:hover:border-white/40 opacity-60 hover:opacity-100"
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
                    <div className="lg:w-1/2 flex flex-col">
                        <div className="space-y-6">
                            {/* Header */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                                        {product.brand} • {product.reference}
                                    </span>
                                    {product.tags.includes("Best Seller") && (
                                        <span className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 border border-yellow-500/50 px-2 py-1 rounded text-xs font-bold">
                                            Best Seller
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-4xl font-bold mb-3">{product.title}</h1>
                                
                                {/* Rating */}
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex text-yellow-500">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`h-5 w-5 ${i < product.rating ? 'fill-current' : 'text-gray-300 dark:text-gray-700'}`} />
                                        ))}
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        ({product.id.charCodeAt(0) * 2 + 5} reviews)
                                    </span>
                                </div>
                            </div>
                            
                            {/* Price and Stock */}
                            <div className="flex items-start justify-between pb-6 border-b border-gray-200 dark:border-white/10">
                                <div>
                                    <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                                        {product.price.toFixed(2)} <span className="text-xl font-normal text-gray-500 dark:text-gray-400">TND</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {product.stock > 0 ? (
                                            <>
                                                {product.stock < 5 ? (
                                                    <span className="text-sm text-orange-500 font-medium flex items-center gap-1">
                                                        <AlertCircle className="h-4 w-4" />
                                                        Only {product.stock} left in stock
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-green-600 dark:text-green-500 font-medium flex items-center gap-1">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        In Stock ({product.stock} available)
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-sm text-red-500 font-medium flex items-center gap-1">
                                                <AlertCircle className="h-4 w-4" />
                                                Out of Stock
                                            </span>
                                        )}
                                    </div>
                                    {existingQuantity > 0 && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {existingQuantity} already in your cart
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Description */}
                            <div>
                                <h2 className="text-2xl font-bold mb-3">Description</h2>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">{description}</p>
                            </div>
                            
                            {/* Technical Details */}
                            <div>
                                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                                    <Package className="h-6 w-6" />
                                    Technical Specifications
                                </h2>
                                <div className="space-y-3">
                                    {subDescription.map((detail, idx) => (
                                        <div key={idx} className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-lg">
                                            <div className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400"></div>
                                            <span>{detail}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Tags */}
                            {product.tags.length > 0 && (
                                <div>
                                    <h2 className="text-2xl font-bold mb-3">Features</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {product.tags.map((tag, idx) => (
                                            <span
                                                key={idx}
                                                className="px-4 py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full text-sm text-gray-600 dark:text-gray-300"
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
                                        <div className="flex items-center justify-between bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4">
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Quantity</span>
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={decrementQuantity}
                                                    disabled={quantity <= 1}
                                                    className="h-10 w-10 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                                >
                                                    <Minus className="h-4 w-4 text-gray-900 dark:text-white" />
                                                </button>
                                                <span className="text-xl font-bold text-gray-900 dark:text-white min-w-[2rem] text-center">
                                                    {quantity}
                                                </span>
                                                <button
                                                    onClick={incrementQuantity}
                                                    disabled={quantity >= remainingStock}
                                                    className="h-10 w-10 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                                >
                                                    <Plus className="h-4 w-4 text-gray-900 dark:text-white" />
                                                </button>
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                Max: {remainingStock}
                                            </span>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="flex gap-3">
                                            <Button 
                                                onClick={handleDirectAddToCart}
                                                disabled={remainingStock === 0 || quantity === 0}
                                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold h-16 rounded-xl text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ShoppingCart className="mr-2 h-6 w-6" />
                                                Add to Cart
                                            </Button>
                                            <Button 
                                                onClick={handleDirectPurchase}
                                                disabled={remainingStock === 0 || quantity === 0}
                                                className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold h-16 rounded-xl text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <CreditCard className="mr-2 h-6 w-6" />
                                                Direct Purchase
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <Button disabled className="w-full bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 font-bold h-16 rounded-xl text-xl cursor-not-allowed">
                                        Out of Stock
                                    </Button>
                                )}
                            </div>
                            
                            {/* Space for future ads or additional content */}
                            <div className="pt-8 border-t border-gray-200 dark:border-white/10">
                                {/* Future: Add ads, related products, reviews, etc. */}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Products Tree View */}
                {allProducts.length > 0 && (
                    <div className="mt-12">
                        <ProductsTreeView products={allProducts} currentProductId={product.id} />
                    </div>
                )}
            </div>
            
            <Footer />
        </main>
    );
}

