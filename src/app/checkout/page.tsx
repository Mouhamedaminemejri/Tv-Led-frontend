"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Truck, Smartphone, AlertCircle, Loader2, CheckCircle2, Lock, ArrowLeft, ArrowRight, Home, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/cart-context";
import { ProductService, type LedProduct } from "@/services/product-service";
import { getUserId } from "@/utils/user-id";
import { TokenManager } from "@/services/auth-service";
import AuthService from "@/services/auth-service";
import { GuestSession } from "@/utils/guest-session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Tunisia cities/governorates
const TUNISIA_CITIES = [
    "Tunis", "Ariana", "Ben Arous", "Manouba", "Bizerte", "Nabeul", "Béja", "Jendouba",
    "Kef", "Siliana", "Kairouan", "Kasserine", "Sidi Bouzid", "Sousse", "Monastir",
    "Mahdia", "Sfax", "Gafsa", "Tozeur", "Kebili", "Gabès", "Medenine", "Tataouine"
];

// Payment method types — all redirect-based, no raw card data on our site
type PaymentMethod = "cash_on_delivery" | "mobile" | "card_gateway";

interface CheckoutFormData {
    // Personal Information
    fullName: string;
    cin: string; // Carte d'Identité Nationale (8 digits)
    email: string;
    phone: string; // 8 digits
    dateOfBirth: string;
    
    // Billing Address
    streetAddress: string;
    city: string;
    postalCode: string;
    
    // Shipping Address (if different)
    useDifferentShipping: boolean;
    shippingStreetAddress: string;
    shippingCity: string;
    shippingPostalCode: string;
    
    // Payment Information
    paymentMethod: PaymentMethod;
}

interface CheckoutItem {
    id: string;
    title: string;
    quantity: number;
    price: number;
    image?: string;
    brand?: string;
}

export default function CheckoutPage() {
    return (
        <React.Suspense
            fallback={
                <main className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                        <p className="text-gray-600 dark:text-gray-400">Loading checkout...</p>
                    </div>
                </main>
            }
        >
            <CheckoutInner />
        </React.Suspense>
    );
}

function CheckoutInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { cart, clearCart, addToCart } = useCart();
    
    // Check if this is a single product checkout or cart checkout
    const productId = searchParams.get("productId");
    const quantity = searchParams.get("quantity");
    const isCartCheckout = !productId && cart.length > 0;
    
    const [checkoutItems, setCheckoutItems] = React.useState<CheckoutItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [formData, setFormData] = React.useState<CheckoutFormData>({
        fullName: "",
        cin: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        streetAddress: "",
        city: "",
        postalCode: "",
        useDifferentShipping: false,
        shippingStreetAddress: "",
        shippingCity: "",
        shippingPostalCode: "",
        paymentMethod: "cash_on_delivery",
    });

    const [errors, setErrors] = React.useState<Partial<Record<keyof CheckoutFormData, string>>>({});
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [currentStep, setCurrentStep] = React.useState<"info" | "payment" | "review">("info");
    
    // Track if we've already added product to cart to prevent infinite loop
    const productAddedToCartRef = React.useRef<string | null>(null);

    // Auto-fill form from logged-in user data
    React.useEffect(() => {
        const prefill = async () => {
            try {
                // First try stored user (instant, no API call)
                let user = TokenManager.getStoredUser();

                // If logged in but no stored user, fetch from API
                if (!user && AuthService.isAuthenticated()) {
                    try {
                        user = await AuthService.getCurrentUser();
                    } catch {
                        // Not logged in or token expired — skip
                    }
                }

                if (user) {
                    setFormData(prev => ({
                        ...prev,
                        fullName: prev.fullName || [user!.firstName, user!.lastName].filter(Boolean).join(" "),
                        email: prev.email || user!.email || "",
                        phone: prev.phone || (user!.phone ? user!.phone.replace(/\s/g, "") : ""),
                    }));
                }
            } catch {
                // Silently fail — user can fill manually
            }
        };
        prefill();
    }, []);

    // Load checkout items based on source
    React.useEffect(() => {
        const loadCheckoutItems = async () => {
            setLoading(true);
            try {
                if (isCartCheckout) {
                    // Use cart items
                    const items: CheckoutItem[] = cart.map(item => ({
                        id: item.id,
                        title: item.title,
                        quantity: item.quantity,
                        price: item.price,
                        image: item.image,
                        brand: item.brand
                    }));
                    setCheckoutItems(items);
                } else if (productId && quantity) {
                    // Load single product and add to cart for direct purchase
                    const product = await ProductService.getProductById(productId);
                    if (product) {
                        const qty = parseInt(quantity, 10);
                        const productKey = `${productId}-${qty}`;
                        
                        // Only add to cart once (prevent infinite loop)
                        if (productAddedToCartRef.current !== productKey) {
                            productAddedToCartRef.current = productKey;
                            
                            // Add product to cart first (backend expects items in cart)
                            try {
                                await addToCart({
                                    id: product.id,
                                    title: product.title,
                                    brand: product.brand,
                                    reference: product.reference,
                                    price: product.price,
                                    image: product.images?.[0] || '/led-product.png',
                                    quantity: qty,
                                    stock: product.stock
                                });
                            } catch (cartError) {
                                console.error("Failed to add to cart:", cartError);
                                // Continue anyway - cart might already have the item
                            }
                        }
                        
                        setCheckoutItems([{
                            id: product.id,
                            title: product.title,
                            quantity: qty,
                            price: product.price,
                            image: product.images?.[0],
                            brand: product.brand
                        }]);
                    } else {
                        toast.error("Product not found");
                        router.push("/leds");
                    }
                } else {
                    // No valid checkout source, redirect
                    router.push("/leds");
                }
            } catch (error) {
                console.error("Failed to load checkout items:", error);
                toast.error("Failed to load checkout information");
                router.push("/leds");
            } finally {
                setLoading(false);
            }
        };

        loadCheckoutItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId, quantity, isCartCheckout]); // Removed cart, router, addToCart from dependencies

    const totalAmount = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Validation functions
    const validateCIN = (cin: string): boolean => {
        return /^\d{8}$/.test(cin);
    };

    const validatePhone = (phone: string): boolean => {
        const cleaned = phone.replace(/\s/g, "");
        return /^[259]\d{7}$/.test(cleaned) || /^\d{8}$/.test(cleaned);
    };

    const validateEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validatePostalCode = (code: string): boolean => {
        return /^\d{4}$/.test(code);
    };

    const validateStep = (step: "info" | "payment" | "review"): boolean => {
        const newErrors: Partial<Record<keyof CheckoutFormData, string>> = {};

        if (step === "info") {
            if (!formData.fullName.trim()) {
                newErrors.fullName = "Full name is required";
            } else if (formData.fullName.trim().length < 3) {
                newErrors.fullName = "Full name must be at least 3 characters";
            }

            if (!formData.cin) {
                newErrors.cin = "CIN is required";
            } else if (!validateCIN(formData.cin)) {
                newErrors.cin = "CIN must be 8 digits";
            }

            if (!formData.email) {
                newErrors.email = "Email is required";
            } else if (!validateEmail(formData.email)) {
                newErrors.email = "Invalid email format";
            }

            if (!formData.phone) {
                newErrors.phone = "Phone number is required";
            } else if (!validatePhone(formData.phone)) {
                newErrors.phone = "Phone must be 8 digits (can start with 2, 5, or 9)";
            }

            if (formData.dateOfBirth) {
                const birthDate = new Date(formData.dateOfBirth);
                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();
                if (age < 18) {
                    newErrors.dateOfBirth = "You must be at least 18 years old";
                }
            }

            if (!formData.streetAddress.trim()) {
                newErrors.streetAddress = "Street address is required";
            }

            if (!formData.city) {
                newErrors.city = "City is required";
            }

            if (!formData.postalCode) {
                newErrors.postalCode = "Postal code is required";
            } else if (!validatePostalCode(formData.postalCode)) {
                newErrors.postalCode = "Postal code must be 4 digits";
            }

            if (formData.useDifferentShipping) {
                if (!formData.shippingStreetAddress.trim()) {
                    newErrors.shippingStreetAddress = "Shipping address is required";
                }
                if (!formData.shippingCity) {
                    newErrors.shippingCity = "Shipping city is required";
                }
                if (!formData.shippingPostalCode) {
                    newErrors.shippingPostalCode = "Shipping postal code is required";
                } else if (!validatePostalCode(formData.shippingPostalCode)) {
                    newErrors.shippingPostalCode = "Postal code must be 4 digits";
                }
            }
        }

        if (step === "payment") {
            // All payment methods are redirect-based or COD — no client-side card validation needed
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof CheckoutFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const formatPhone = (value: string): string => {
        const cleaned = value.replace(/\s/g, "");
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 4) return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)}`;
    };

    const handlePhoneChange = (value: string) => {
        const formatted = formatPhone(value);
        handleInputChange("phone", formatted);
    };

    const handleNext = () => {
        if (currentStep === "info") {
            if (validateStep("info")) {
                setCurrentStep("payment");
            }
        } else if (currentStep === "payment") {
            if (validateStep("payment")) {
                setCurrentStep("review");
            }
        }
    };

    const handleBack = () => {
        if (currentStep === "payment") {
            setCurrentStep("info");
        } else if (currentStep === "review") {
            setCurrentStep("payment");
        }
    };

    const handleSubmit = async () => {
        if (!validateStep("review")) {
            setCurrentStep("payment");
            return;
        }

        setIsSubmitting(true);
        try {
            const userId = getUserId();

            // Map payment method to backend enum — all online methods redirect to gateway
            const mapPaymentMethod = (method: PaymentMethod): string => {
                if (method === "mobile") return "MOBILE_PAYMENT";
                if (method === "card_gateway") return "CREDIT_DEBIT_CARD";
                return "CASH_ON_DELIVERY";
            };

            // Prepare order data according to CreateOrderDto
            const orderData = {
               // userId: userId,
                paymentMethod: mapPaymentMethod(formData.paymentMethod),
                fullName: formData.fullName,
                cin: formData.cin,
                ...(formData.dateOfBirth ? { dateOfBirth: formData.dateOfBirth } : {}),
                email: formData.email,
                phoneNumber: formData.phone,
                billingAddress: {
                    streetAddress: formData.streetAddress,
                    city: formData.city,
                    postalCode: formData.postalCode,
                },
                shippingAddress: formData.useDifferentShipping ? {
                    streetAddress: formData.shippingStreetAddress,
                    city: formData.shippingCity,
                    postalCode: formData.shippingPostalCode,
                } : {
                    streetAddress: formData.streetAddress,
                    city: formData.city,
                    postalCode: formData.postalCode,
                },
            };

            // Backend requires JWT or X-Guest-Token
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
            };
            const jwt = TokenManager.getAccessToken();
            if (jwt && !TokenManager.isTokenExpired(jwt)) {
                headers["Authorization"] = `Bearer ${jwt}`;
            } else {
                const guestToken = await GuestSession.ensureToken();
                headers["X-Guest-Token"] = guestToken;
            }

            // Call the payment initiation API
            const response = await fetch(`${API_BASE_URL}/checkout/initiate-payment`, {
                method: "POST",
                headers,
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Failed to initiate payment" }));
                throw new Error(errorData.message || `Failed to initiate payment: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const { order, paymentUrl, message } = result;

            // If payment URL is provided (Konnect / gateway redirect)
            if (paymentUrl) {
                // Persist order context so success/fail pages can use it
                try {
                    sessionStorage.setItem("checkout_order_id", order?.id || "");
                    sessionStorage.setItem("checkout_order_number", order?.orderNumber || "");
                    sessionStorage.setItem("checkout_payment_method", formData.paymentMethod);
                    sessionStorage.setItem("checkout_total", String(totalAmount));
                } catch { /* sessionStorage might be unavailable */ }

                toast.info("Redirecting to payment gateway...", {
                    description: message || "Please complete your payment on the secure Konnect page.",
                });

                // Clear cart before redirect (items are reserved in the order)
                if (isCartCheckout) {
                    try { await clearCart(); } catch { /* best effort */ }
                }
                
                // Redirect to Konnect payment page
                setTimeout(() => {
                    window.location.href = paymentUrl;
                }, 400);
                return; // Don't clear submitting state as we're redirecting
            }

            // Order created successfully (Cash on Delivery — no redirect needed)
            toast.success("Order placed successfully!", {
                description: message || `Order #${order.orderNumber} has been created. You will receive a confirmation email shortly.`,
            });

            // Clear cart
            if (isCartCheckout) {
                try { await clearCart(); } catch { /* best effort */ }
            }

            // Redirect to success page
            router.push(`/checkout/success?orderId=${order.id}&orderNumber=${order.orderNumber}&method=cod`);
        } catch (error: any) {
            console.error("Checkout error:", error);
            const errorMessage = error.message || "Failed to process order";
            toast.error("Failed to process order", {
                description: errorMessage.includes("stock") 
                    ? "Some items are out of stock. Please update your cart."
                    : errorMessage,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="text-gray-600 dark:text-gray-400">Loading checkout...</p>
                </div>
            </main>
        );
    }

    if (checkoutItems.length === 0) {
        return (
            <main className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No items to checkout</p>
                    <Link href="/leds">
                        <Button>Continue Shopping</Button>
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Breadcrumb Navigation */}
                <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <Link href="/" className="hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1">
                        <Home className="h-4 w-4" />
                        <span className="hidden sm:inline">Home</span>
                    </Link>
                    <span>/</span>
                    <Link href="/leds" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                        Products
                    </Link>
                    {productId && checkoutItems.length > 0 && (
                        <>
                            <span>/</span>
                            <span className="text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-none">
                                {checkoutItems[0].title}
                            </span>
                        </>
                    )}
                    {isCartCheckout && (
                        <>
                            <span>/</span>
                            <span className="text-gray-900 dark:text-white">Checkout</span>
                        </>
                    )}
                </nav>

                {/* Page Title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-2 mb-2 text-gray-900 dark:text-white">
                        <Lock className="h-6 w-6 text-blue-500" />
                        Secure Checkout
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">Complete your purchase securely. All information is encrypted.</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8">
                    <div className={`flex items-center gap-2 ${currentStep === "info" ? "text-blue-500" : currentStep === "payment" || currentStep === "review" ? "text-green-500" : "text-gray-500"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "info" ? "bg-blue-500 text-white" : "bg-green-500 text-white"}`}>
                            {currentStep === "info" ? "1" : <CheckCircle2 className="h-4 w-4" />}
                        </div>
                        <span className="text-sm font-medium hidden sm:inline">Personal Info</span>
                    </div>
                    <div className={`flex-1 h-0.5 mx-4 ${currentStep === "payment" || currentStep === "review" ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"}`} />
                    <div className={`flex items-center gap-2 ${currentStep === "payment" ? "text-blue-500" : currentStep === "review" ? "text-green-500" : "text-gray-500"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "payment" ? "bg-blue-500 text-white" : currentStep === "review" ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                            {currentStep === "review" ? <CheckCircle2 className="h-4 w-4" /> : "2"}
                        </div>
                        <span className="text-sm font-medium hidden sm:inline">Payment</span>
                    </div>
                    <div className={`flex-1 h-0.5 mx-4 ${currentStep === "review" ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"}`} />
                    <div className={`flex items-center gap-2 ${currentStep === "review" ? "text-blue-500" : "text-gray-500"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "review" ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                            3
                        </div>
                        <span className="text-sm font-medium hidden sm:inline">Review</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Step 1: Personal Information */}
                        {currentStep === "info" && (
                            <div className="space-y-6 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm dark:shadow-none">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Personal Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <Label htmlFor="fullName">Full Name *</Label>
                                        <Input
                                            id="fullName"
                                            value={formData.fullName}
                                            onChange={(e) => handleInputChange("fullName", e.target.value)}
                                            placeholder="John Doe"
                                            className={errors.fullName ? "border-red-500" : ""}
                                        />
                                        {errors.fullName && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.fullName}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="cin">CIN (Carte d'Identité Nationale) *</Label>
                                        <Input
                                            id="cin"
                                            value={formData.cin}
                                            onChange={(e) => handleInputChange("cin", e.target.value.replace(/\D/g, "").slice(0, 8))}
                                            placeholder="12345678"
                                            maxLength={8}
                                            className={errors.cin ? "border-red-500" : ""}
                                        />
                                        {errors.cin && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.cin}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                        <Input
                                            id="dateOfBirth"
                                            type="date"
                                            value={formData.dateOfBirth}
                                            onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                                            className={`${errors.dateOfBirth ? "border-red-500" : ""} text-gray-900 dark:text-white bg-gray-50 dark:bg-zinc-900 [color-scheme:light] dark:[color-scheme:dark]`}
                                        />
                                        {errors.dateOfBirth && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.dateOfBirth}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="email">Email Address *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange("email", e.target.value)}
                                            placeholder="john@example.com"
                                            className={errors.email ? "border-red-500" : ""}
                                        />
                                        {errors.email && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="phone">Phone Number *</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => handlePhoneChange(e.target.value.replace(/\D/g, ""))}
                                            placeholder="12 34 56 78"
                                            maxLength={11}
                                            className={errors.phone ? "border-red-500" : ""}
                                        />
                                        {errors.phone && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.phone}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-lg font-semibold mt-6 text-gray-900 dark:text-white">Billing Address</h3>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="streetAddress">Street Address *</Label>
                                        <Input
                                            id="streetAddress"
                                            value={formData.streetAddress}
                                            onChange={(e) => handleInputChange("streetAddress", e.target.value)}
                                            placeholder="123 Main Street"
                                            className={errors.streetAddress ? "border-red-500" : ""}
                                        />
                                        {errors.streetAddress && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.streetAddress}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="city">City *</Label>
                                            <select
                                                id="city"
                                                value={formData.city}
                                                onChange={(e) => handleInputChange("city", e.target.value)}
                                                className={`flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&>option]:bg-white [&>option]:dark:bg-gray-900 [&>option]:text-gray-900 [&>option]:dark:text-white ${errors.city ? "border-red-500" : ""}`}
                                            >
                                                <option value="">Select a city</option>
                                                {TUNISIA_CITIES.map(city => (
                                                    <option key={city} value={city}>{city}</option>
                                                ))}
                                            </select>
                                            {errors.city && (
                                                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.city}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="postalCode">Postal Code *</Label>
                                            <Input
                                                id="postalCode"
                                                value={formData.postalCode}
                                                onChange={(e) => handleInputChange("postalCode", e.target.value.replace(/\D/g, "").slice(0, 4))}
                                                placeholder="1000"
                                                maxLength={4}
                                                className={errors.postalCode ? "border-red-500" : ""}
                                            />
                                            {errors.postalCode && (
                                                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.postalCode}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.useDifferentShipping}
                                            onChange={(e) => handleInputChange("useDifferentShipping", e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-zinc-800 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Use different address for shipping</span>
                                    </label>

                                    {formData.useDifferentShipping && (
                                        <div className="mt-4 space-y-4 pl-6 border-l-2 border-blue-500">
                                            <h4 className="font-medium text-gray-900 dark:text-white">Shipping Address</h4>
                                            <div>
                                                <Label htmlFor="shippingStreetAddress">Street Address *</Label>
                                                <Input
                                                    id="shippingStreetAddress"
                                                    value={formData.shippingStreetAddress}
                                                    onChange={(e) => handleInputChange("shippingStreetAddress", e.target.value)}
                                                    placeholder="123 Main Street"
                                                    className={errors.shippingStreetAddress ? "border-red-500" : ""}
                                                />
                                                {errors.shippingStreetAddress && (
                                                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {errors.shippingStreetAddress}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="shippingCity">City *</Label>
                                                    <select
                                                        id="shippingCity"
                                                        value={formData.shippingCity}
                                                        onChange={(e) => handleInputChange("shippingCity", e.target.value)}
                                                        className={`flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&>option]:bg-white [&>option]:dark:bg-gray-900 [&>option]:text-gray-900 [&>option]:dark:text-white ${errors.shippingCity ? "border-red-500" : ""}`}
                                                    >
                                                        <option value="">Select a city</option>
                                                        {TUNISIA_CITIES.map(city => (
                                                            <option key={city} value={city}>{city}</option>
                                                        ))}
                                                    </select>
                                                    {errors.shippingCity && (
                                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            {errors.shippingCity}
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <Label htmlFor="shippingPostalCode">Postal Code *</Label>
                                                    <Input
                                                        id="shippingPostalCode"
                                                        value={formData.shippingPostalCode}
                                                        onChange={(e) => handleInputChange("shippingPostalCode", e.target.value.replace(/\D/g, "").slice(0, 4))}
                                                        placeholder="1000"
                                                        maxLength={4}
                                                        className={errors.shippingPostalCode ? "border-red-500" : ""}
                                                    />
                                                    {errors.shippingPostalCode && (
                                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            {errors.shippingPostalCode}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Payment Method */}
                        {currentStep === "payment" && (
                            <div className="space-y-6 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm dark:shadow-none">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payment Method</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose how you&apos;d like to pay. All online payments are processed on the gateway&apos;s secure page.</p>
                                </div>
                                
                                <div className="space-y-3">
                                    {/* Mobile Payment — Konnect (Recommended) */}
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange("paymentMethod", "mobile")}
                                        className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                                            formData.paymentMethod === "mobile"
                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 ring-1 ring-blue-500/30"
                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-white/5"
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                formData.paymentMethod === "mobile" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                                            }`}>
                                                <Smartphone className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-900 dark:text-white">Mobile Payment</span>
                                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Recommended</span>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">D17, Flouci, e-DINAR SMART</p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Powered by</span>
                                                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Konnect</span>
                                                </div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                                                formData.paymentMethod === "mobile" ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600"
                                            }`}>
                                                {formData.paymentMethod === "mobile" && (
                                                    <div className="w-2 h-2 rounded-full bg-white" />
                                                )}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Card Payment — via Konnect gateway */}
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange("paymentMethod", "card_gateway")}
                                        className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                                            formData.paymentMethod === "card_gateway"
                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 ring-1 ring-blue-500/30"
                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-white/5"
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                formData.paymentMethod === "card_gateway" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                                            }`}>
                                                <CreditCard className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="font-semibold text-gray-900 dark:text-white">Credit / Debit Card</span>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Visa, Mastercard, e-DINAR</p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Secure redirect via</span>
                                                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Konnect</span>
                                                </div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                                                formData.paymentMethod === "card_gateway" ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600"
                                            }`}>
                                                {formData.paymentMethod === "card_gateway" && (
                                                    <div className="w-2 h-2 rounded-full bg-white" />
                                                )}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Cash on Delivery */}
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange("paymentMethod", "cash_on_delivery")}
                                        className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                                            formData.paymentMethod === "cash_on_delivery"
                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 ring-1 ring-blue-500/30"
                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-white/5"
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                formData.paymentMethod === "cash_on_delivery" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                                            }`}>
                                                <Truck className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="font-semibold text-gray-900 dark:text-white">Cash on Delivery</span>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Pay in cash when your order arrives</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">No online payment required</p>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                                                formData.paymentMethod === "cash_on_delivery" ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600"
                                            }`}>
                                                {formData.paymentMethod === "cash_on_delivery" && (
                                                    <div className="w-2 h-2 rounded-full bg-white" />
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                {/* Info box for selected payment method */}
                                {formData.paymentMethod !== "cash_on_delivery" && (
                                    <div className="mt-2 p-4 rounded-xl border border-blue-200 dark:border-blue-800/30 bg-blue-50 dark:bg-blue-900/10 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                                How it works
                                            </p>
                                        </div>
                                        <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside">
                                            <li>You click <strong>&ldquo;Complete Purchase&rdquo;</strong> on the next step</li>
                                            <li>You&apos;re securely redirected to <strong>Konnect</strong> payment page</li>
                                            <li>Enter your {formData.paymentMethod === "mobile" ? "mobile payment PIN" : "card details"} on <strong>their secure page</strong></li>
                                            <li>After payment, you&apos;re redirected back here with confirmation</li>
                                        </ol>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t border-blue-200 dark:border-blue-800/30">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                <Lock className="h-3 w-3" />
                                                <span>256-bit SSL</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                <CheckCircle2 className="h-3 w-3" />
                                                <span>PCI DSS compliant</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                <CheckCircle2 className="h-3 w-3" />
                                                <span>We never see your card data</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Review */}
                        {currentStep === "review" && (
                            <div className="space-y-6 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm dark:shadow-none">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Review Your Order</h2>
                                
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-black/30">
                                    <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Order Summary</h4>
                                    <div className="space-y-2">
                                        {checkoutItems.map(item => (
                                            <div key={item.id} className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">{item.title} x{item.quantity}</span>
                                                <span className="text-gray-900 dark:text-white">{(item.price * item.quantity).toFixed(2)} TND</span>
                                            </div>
                                        ))}
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 flex justify-between font-semibold">
                                            <span className="text-gray-900 dark:text-white">Total</span>
                                            <span className="text-gray-900 dark:text-white">{totalAmount.toFixed(2)} TND</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-black/30">
                                    <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Shipping Address</h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {formData.useDifferentShipping ? formData.shippingStreetAddress : formData.streetAddress}<br />
                                        {formData.useDifferentShipping ? formData.shippingCity : formData.city}, {formData.useDifferentShipping ? formData.shippingPostalCode : formData.postalCode}
                                    </p>
                                </div>

                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-black/30">
                                    <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Payment Method</h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {formData.paymentMethod === "cash_on_delivery" && "Cash on Delivery"}
                                        {formData.paymentMethod === "card_gateway" && "Credit / Debit Card (via Konnect)"}
                                        {formData.paymentMethod === "mobile" && "Mobile Payment — D17, Flouci (via Konnect)"}
                                    </p>
                                    {formData.paymentMethod !== "cash_on_delivery" && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                            <Lock className="h-3 w-3" />
                                            You&apos;ll be redirected to Konnect&apos;s secure payment page
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-xl p-6 sticky top-24 shadow-sm dark:shadow-none">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Order Summary</h3>
                            <div className="space-y-4">
                                {checkoutItems.map(item => (
                                    <div key={item.id} className="flex gap-3">
                                        {item.image && (
                                            <div className="relative h-16 w-16 bg-gray-100 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 flex-shrink-0 overflow-hidden">
                                                <Image
                                                    src={item.image}
                                                    alt={item.title}
                                                    fill
                                                    className="object-contain p-1"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{item.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                                            <p className="text-sm font-bold mt-1 text-gray-900 dark:text-white">{(item.price * item.quantity).toFixed(2)} TND</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                        <span>Subtotal</span>
                                        <span>{totalAmount.toFixed(2)} TND</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                        <span>Shipping</span>
                                        <span>Calculated at checkout</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <span>Total</span>
                                        <span className="text-blue-600 dark:text-blue-400">{totalAmount.toFixed(2)} TND</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-white/10 mt-8">
                    {/* Left side */}
                    <div className="flex items-center gap-3">
                        {currentStep === "info" ? (
                            <Link href="/leds">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <ShoppingBag className="h-4 w-4 mr-2" />
                                    Back to Shop
                                </Button>
                            </Link>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                disabled={isSubmitting}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Previous
                            </Button>
                        )}
                    </div>

                    {/* Right side */}
                    <div>
                        {currentStep !== "review" ? (
                            <Button
                                type="button"
                                onClick={handleNext}
                                disabled={isSubmitting}
                            >
                                Next
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Complete Purchase
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

