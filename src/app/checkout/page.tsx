"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Truck, Smartphone, AlertCircle, Loader2, CheckCircle2, Lock, ArrowLeft, Home } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/cart-context";
import { ProductService, type LedProduct } from "@/services/product-service";
import { getUserId } from "@/utils/user-id";

// Tunisia cities/governorates
const TUNISIA_CITIES = [
    "Tunis", "Ariana", "Ben Arous", "Manouba", "Bizerte", "Nabeul", "Béja", "Jendouba",
    "Kef", "Siliana", "Kairouan", "Kasserine", "Sidi Bouzid", "Sousse", "Monastir",
    "Mahdia", "Sfax", "Gafsa", "Tozeur", "Kebili", "Gabès", "Medenine", "Tataouine"
];

// Payment method types
type PaymentMethod = "card" | "paykassma" | "cash_on_delivery" | "mobile";
type CardGateway = "monetique" | "redpay" | "orange" | "paykassma_card" | "other";

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
    cardGateway: CardGateway;
    cardNumber: string;
    cardExpiry: string; // MM/YY
    cardCvv: string;
    cardholderName: string;
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
        cardGateway: "monetique",
        cardNumber: "",
        cardExpiry: "",
        cardCvv: "",
        cardholderName: "",
    });

    const [errors, setErrors] = React.useState<Partial<Record<keyof CheckoutFormData, string>>>({});
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [currentStep, setCurrentStep] = React.useState<"info" | "payment" | "review">("info");
    
    // Track if we've already added product to cart to prevent infinite loop
    const productAddedToCartRef = React.useRef<string | null>(null);

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

    const validateCardNumber = (cardNumber: string): boolean => {
        const cleaned = cardNumber.replace(/\s/g, "");
        if (!/^\d{13,19}$/.test(cleaned)) return false;
        
        let sum = 0;
        let shouldDouble = false;
        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned.charAt(i), 10);
            if (shouldDouble) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        return sum % 10 === 0;
    };

    const validateCardExpiry = (expiry: string): boolean => {
        const match = expiry.match(/^(\d{2})\/(\d{2})$/);
        if (!match) return false;
        const month = parseInt(match[1], 10);
        const year = parseInt(match[2], 10);
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        
        if (month < 1 || month > 12) return false;
        if (year < currentYear) return false;
        if (year === currentYear && month < currentMonth) return false;
        return true;
    };

    const validateCVV = (cvv: string): boolean => {
        return /^\d{3,4}$/.test(cvv);
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

            if (!formData.dateOfBirth) {
                newErrors.dateOfBirth = "Date of birth is required";
            } else {
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
            if (formData.paymentMethod === "card" && formData.cardGateway === "other") {
                if (!formData.cardNumber) {
                    newErrors.cardNumber = "Card number is required";
                } else if (!validateCardNumber(formData.cardNumber)) {
                    newErrors.cardNumber = "Invalid card number";
                }

                if (!formData.cardExpiry) {
                    newErrors.cardExpiry = "Expiry date is required";
                } else if (!validateCardExpiry(formData.cardExpiry)) {
                    newErrors.cardExpiry = "Invalid expiry date (MM/YY)";
                }

                if (!formData.cardCvv) {
                    newErrors.cardCvv = "CVV is required";
                } else if (!validateCVV(formData.cardCvv)) {
                    newErrors.cardCvv = "CVV must be 3 or 4 digits";
                }

                if (!formData.cardholderName.trim()) {
                    newErrors.cardholderName = "Cardholder name is required";
                }
            }
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

    const formatCardNumber = (value: string): string => {
        const cleaned = value.replace(/\s/g, "");
        const groups = cleaned.match(/.{1,4}/g);
        return groups ? groups.join(" ") : cleaned;
    };

    const formatPhone = (value: string): string => {
        const cleaned = value.replace(/\s/g, "");
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 4) return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)}`;
    };

    const handleCardNumberChange = (value: string) => {
        const formatted = formatCardNumber(value);
        handleInputChange("cardNumber", formatted);
    };

    const handleCardExpiryChange = (value: string) => {
        const cleaned = value.replace(/\D/g, "");
        if (cleaned.length >= 2) {
            const formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
            handleInputChange("cardExpiry", formatted);
        } else {
            handleInputChange("cardExpiry", cleaned);
        }
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

            // Map payment method to backend enum
            const mapPaymentMethod = (method: PaymentMethod, gateway?: CardGateway): string => {
                if (method === "card") {
                    if (gateway === "monetique") return "CREDIT_DEBIT_CARD"; // e-DINAR
                    if (gateway === "redpay") return "CREDIT_DEBIT_CARD"; // RedPay
                    if (gateway === "orange") return "CREDIT_DEBIT_CARD"; // Orange Money
                    if (gateway === "paykassma_card") return "PAYKASSMA"; // Paykassma Card
                    return "CREDIT_DEBIT_CARD"; // Other (direct card)
                }
                if (method === "paykassma") return "PAYKASSMA";
                if (method === "mobile") return "MOBILE_PAYMENT";
                return "CASH_ON_DELIVERY";
            };

            // Prepare order data according to CreateOrderDto
            const orderData = {
                userId: userId,
                paymentMethod: mapPaymentMethod(formData.paymentMethod, formData.cardGateway),
                fullName: formData.fullName,
                cin: formData.cin,
                dateOfBirth: formData.dateOfBirth,
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

            // Call the payment initiation API
            const response = await fetch("http://localhost:3001/api/checkout/initiate-payment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Failed to initiate payment" }));
                throw new Error(errorData.message || `Failed to initiate payment: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const { order, paymentUrl, message } = result;

            // If payment URL is provided, redirect to payment gateway
            if (paymentUrl) {
                toast.info("Redirecting to payment gateway...", {
                    description: message || "Please complete your payment on the next page.",
                });
                
                // Small delay to show toast before redirect
                setTimeout(() => {
                    window.location.href = paymentUrl;
                }, 500);
                return; // Don't clear submitting state as we're redirecting
            }

            // Order created successfully (Cash on Delivery or direct payment)
            toast.success("Order placed successfully!", {
                description: message || `Order #${order.orderNumber} has been created. You will receive a confirmation email shortly.`,
            });

            // Clear cart if this was a cart checkout
            if (isCartCheckout) {
                await clearCart();
            }

            // Redirect to success page with order details
            router.push(`/?order=success&orderNumber=${order.orderNumber}`);
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
            <main className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="text-gray-400">Loading checkout...</p>
                </div>
            </main>
        );
    }

    if (checkoutItems.length === 0) {
        return (
            <main className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-400 mb-4">No items to checkout</p>
                    <Link href="/leds">
                        <Button>Continue Shopping</Button>
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    {/* Breadcrumb Navigation */}
                    <nav className="flex items-center gap-2 text-sm text-gray-400">
                        <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                            <Home className="h-4 w-4" />
                            <span className="hidden sm:inline">Home</span>
                        </Link>
                        <span>/</span>
                        <Link href="/leds" className="hover:text-white transition-colors">
                            Products
                        </Link>
                        {productId && checkoutItems.length > 0 && (
                            <>
                                <span>/</span>
                                <span className="text-white truncate max-w-[200px] sm:max-w-none">
                                    {checkoutItems[0].title}
                                </span>
                            </>
                        )}
                        {isCartCheckout && (
                            <>
                                <span>/</span>
                                <span className="text-white">Checkout</span>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Page Title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
                        <Lock className="h-6 w-6 text-blue-500" />
                        Secure Checkout
                    </h1>
                    <p className="text-gray-400">Complete your purchase securely. All information is encrypted.</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8">
                    <div className={`flex items-center gap-2 ${currentStep === "info" ? "text-blue-500" : currentStep === "payment" || currentStep === "review" ? "text-green-500" : "text-gray-500"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "info" ? "bg-blue-500 text-white" : "bg-green-500 text-white"}`}>
                            {currentStep === "info" ? "1" : <CheckCircle2 className="h-4 w-4" />}
                        </div>
                        <span className="text-sm font-medium">Personal Info</span>
                    </div>
                    <div className={`flex-1 h-0.5 mx-4 ${currentStep === "payment" || currentStep === "review" ? "bg-green-500" : "bg-gray-700"}`} />
                    <div className={`flex items-center gap-2 ${currentStep === "payment" ? "text-blue-500" : currentStep === "review" ? "text-green-500" : "text-gray-500"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "payment" ? "bg-blue-500 text-white" : currentStep === "review" ? "bg-green-500 text-white" : "bg-gray-700 text-gray-400"}`}>
                            {currentStep === "review" ? <CheckCircle2 className="h-4 w-4" /> : "2"}
                        </div>
                        <span className="text-sm font-medium">Payment</span>
                    </div>
                    <div className={`flex-1 h-0.5 mx-4 ${currentStep === "review" ? "bg-green-500" : "bg-gray-700"}`} />
                    <div className={`flex items-center gap-2 ${currentStep === "review" ? "text-blue-500" : "text-gray-500"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "review" ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-400"}`}>
                            3
                        </div>
                        <span className="text-sm font-medium">Review</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Step 1: Personal Information */}
                        {currentStep === "info" && (
                            <div className="space-y-6 bg-zinc-950 border border-white/10 rounded-xl p-6">
                                <h2 className="text-xl font-semibold">Personal Information</h2>
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
                                        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                                        <Input
                                            id="dateOfBirth"
                                            type="date"
                                            value={formData.dateOfBirth}
                                            onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                                            className={`${errors.dateOfBirth ? "border-red-500" : ""} text-white bg-zinc-900 [color-scheme:dark]`}
                                            style={{ color: 'white' }}
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

                                <h3 className="text-lg font-semibold mt-6">Billing Address</h3>
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
                                                className={`flex h-10 w-full rounded-md border border-input bg-zinc-900 text-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${errors.city ? "border-red-500" : ""}`}
                                            >
                                                <option value="" className="bg-zinc-900 text-white">Select a city</option>
                                                {TUNISIA_CITIES.map(city => (
                                                    <option key={city} value={city} className="bg-zinc-900 text-white">{city}</option>
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
                                            className="w-4 h-4 rounded border-gray-600 bg-zinc-800"
                                        />
                                        <span className="text-sm">Use different address for shipping</span>
                                    </label>

                                    {formData.useDifferentShipping && (
                                        <div className="mt-4 space-y-4 pl-6 border-l-2 border-blue-500">
                                            <h4 className="font-medium">Shipping Address</h4>
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
                                                        className={`flex h-10 w-full rounded-md border border-input bg-zinc-900 text-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${errors.shippingCity ? "border-red-500" : ""}`}
                                                    >
                                                        <option value="" className="bg-zinc-900 text-white">Select a city</option>
                                                        {TUNISIA_CITIES.map(city => (
                                                            <option key={city} value={city} className="bg-zinc-900 text-white">{city}</option>
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
                            <div className="space-y-6 bg-zinc-950 border border-white/10 rounded-xl p-6">
                                <h2 className="text-xl font-semibold">Payment Method</h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange("paymentMethod", "cash_on_delivery")}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            formData.paymentMethod === "cash_on_delivery"
                                                ? "border-blue-500 bg-blue-500/10"
                                                : "border-gray-700 hover:border-gray-600"
                                        }`}
                                    >
                                        <Truck className="h-6 w-6 mb-2 text-blue-500" />
                                        <div className="text-left">
                                            <div className="font-semibold">Cash on Delivery</div>
                                            <div className="text-xs text-gray-400">Pay when you receive</div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleInputChange("paymentMethod", "card")}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            formData.paymentMethod === "card"
                                                ? "border-blue-500 bg-blue-500/10"
                                                : "border-gray-700 hover:border-gray-600"
                                        }`}
                                    >
                                        <CreditCard className="h-6 w-6 mb-2 text-blue-500" />
                                        <div className="text-left">
                                            <div className="font-semibold">Credit/Debit Card</div>
                                            <div className="text-xs text-gray-400">Visa, Mastercard</div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleInputChange("paymentMethod", "paykassma")}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            formData.paymentMethod === "paykassma"
                                                ? "border-blue-500 bg-blue-500/10"
                                                : "border-gray-700 hover:border-gray-600"
                                        }`}
                                    >
                                        <Smartphone className="h-6 w-6 mb-2 text-blue-500" />
                                        <div className="text-left">
                                            <div className="font-semibold">Paykassma</div>
                                            <div className="text-xs text-gray-400">Tunisian payment gateway</div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleInputChange("paymentMethod", "mobile")}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            formData.paymentMethod === "mobile"
                                                ? "border-blue-500 bg-blue-500/10"
                                                : "border-gray-700 hover:border-gray-600"
                                        }`}
                                    >
                                        <Smartphone className="h-6 w-6 mb-2 text-blue-500" />
                                        <div className="text-left">
                                            <div className="font-semibold">Mobile Payment</div>
                                            <div className="text-xs text-gray-400">D17, Flouci</div>
                                        </div>
                                    </button>
                                </div>

                                {formData.paymentMethod === "card" && (
                                    <div className="mt-6 p-4 border border-gray-700 rounded-lg space-y-4">
                                        <h4 className="font-medium">Card Gateway Selection</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                            <button
                                                type="button"
                                                onClick={() => handleInputChange("cardGateway", "monetique")}
                                                className={`p-3 rounded-lg border-2 transition-all text-left ${
                                                    formData.cardGateway === "monetique"
                                                        ? "border-blue-500 bg-blue-500/10"
                                                        : "border-gray-700 hover:border-gray-600"
                                                }`}
                                            >
                                                <div className="font-semibold text-sm">e-DINAR</div>
                                                <div className="text-xs text-gray-400">Monétique Tunisienne</div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleInputChange("cardGateway", "redpay")}
                                                className={`p-3 rounded-lg border-2 transition-all text-left ${
                                                    formData.cardGateway === "redpay"
                                                        ? "border-blue-500 bg-blue-500/10"
                                                        : "border-gray-700 hover:border-gray-600"
                                                }`}
                                            >
                                                <div className="font-semibold text-sm">RedPay</div>
                                                <div className="text-xs text-gray-400">Tunisian gateway</div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleInputChange("cardGateway", "orange")}
                                                className={`p-3 rounded-lg border-2 transition-all text-left ${
                                                    formData.cardGateway === "orange"
                                                        ? "border-blue-500 bg-blue-500/10"
                                                        : "border-gray-700 hover:border-gray-600"
                                                }`}
                                            >
                                                <div className="font-semibold text-sm">Orange Money</div>
                                                <div className="text-xs text-gray-400">Orange Tunisia</div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleInputChange("cardGateway", "paykassma_card")}
                                                className={`p-3 rounded-lg border-2 transition-all text-left ${
                                                    formData.cardGateway === "paykassma_card"
                                                        ? "border-blue-500 bg-blue-500/10"
                                                        : "border-gray-700 hover:border-gray-600"
                                                }`}
                                            >
                                                <div className="font-semibold text-sm">Paykassma</div>
                                                <div className="text-xs text-gray-400">Card payment</div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleInputChange("cardGateway", "other")}
                                                className={`p-3 rounded-lg border-2 transition-all text-left ${
                                                    formData.cardGateway === "other"
                                                        ? "border-blue-500 bg-blue-500/10"
                                                        : "border-gray-700 hover:border-gray-600"
                                                }`}
                                            >
                                                <div className="font-semibold text-sm">Other</div>
                                                <div className="text-xs text-gray-400">Visa, Mastercard</div>
                                            </button>
                                        </div>

                                        {formData.cardGateway === "other" && (
                                            <>
                                                <h4 className="font-medium mt-6">Card Details</h4>
                                                
                                                <div>
                                                    <Label htmlFor="cardholderName">Cardholder Name *</Label>
                                                    <Input
                                                        id="cardholderName"
                                                        value={formData.cardholderName}
                                                        onChange={(e) => handleInputChange("cardholderName", e.target.value)}
                                                        placeholder="John Doe"
                                                        className={errors.cardholderName ? "border-red-500" : ""}
                                                    />
                                                    {errors.cardholderName && (
                                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            {errors.cardholderName}
                                                        </p>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                        
                                        {formData.cardGateway !== "other" && (
                                            <div className="p-4 border border-blue-500/50 rounded-lg bg-blue-500/5">
                                                <p className="text-sm text-gray-300">
                                                    {formData.cardGateway === "monetique" && "You will be redirected to e-DINAR (Monétique Tunisienne) secure payment page to complete your transaction."}
                                                    {formData.cardGateway === "redpay" && "You will be redirected to RedPay secure payment page to complete your transaction."}
                                                    {formData.cardGateway === "orange" && "You will be redirected to Orange Money secure payment page to complete your transaction."}
                                                    {formData.cardGateway === "paykassma_card" && "You will be redirected to Paykassma secure payment page for card payment."}
                                                </p>
                                            </div>
                                        )}

                                        <div>
                                            <Label htmlFor="cardNumber">Card Number *</Label>
                                            <Input
                                                id="cardNumber"
                                                value={formData.cardNumber}
                                                onChange={(e) => handleCardNumberChange(e.target.value.replace(/\D/g, ""))}
                                                placeholder="1234 5678 9012 3456"
                                                maxLength={19}
                                                className={errors.cardNumber ? "border-red-500" : ""}
                                            />
                                            {errors.cardNumber && (
                                                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.cardNumber}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="cardExpiry">Expiry Date (MM/YY) *</Label>
                                                <Input
                                                    id="cardExpiry"
                                                    value={formData.cardExpiry}
                                                    onChange={(e) => handleCardExpiryChange(e.target.value)}
                                                    placeholder="12/25"
                                                    maxLength={5}
                                                    className={errors.cardExpiry ? "border-red-500" : ""}
                                                />
                                                {errors.cardExpiry && (
                                                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {errors.cardExpiry}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor="cardCvv">CVV *</Label>
                                                <Input
                                                    id="cardCvv"
                                                    type="password"
                                                    value={formData.cardCvv}
                                                    onChange={(e) => handleInputChange("cardCvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
                                                    placeholder="123"
                                                    maxLength={4}
                                                    className={errors.cardCvv ? "border-red-500" : ""}
                                                />
                                                {errors.cardCvv && (
                                                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {errors.cardCvv}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <Lock className="h-3 w-3" />
                                            <span>Your card details are encrypted and secure</span>
                                        </div>
                                    </div>
                                )}

                                {formData.paymentMethod === "paykassma" && (
                                    <div className="mt-6 p-4 border border-blue-500/50 rounded-lg bg-blue-500/5">
                                        <p className="text-sm text-gray-300">
                                            You will be redirected to Paykassma's secure payment page to complete your transaction.
                                        </p>
                                    </div>
                                )}

                                {formData.paymentMethod === "mobile" && (
                                    <div className="mt-6 p-4 border border-blue-500/50 rounded-lg bg-blue-500/5">
                                        <p className="text-sm text-gray-300">
                                            Mobile payment options (D17, Flouci) will be available at checkout.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Review */}
                        {currentStep === "review" && (
                            <div className="space-y-6 bg-zinc-950 border border-white/10 rounded-xl p-6">
                                <h2 className="text-xl font-semibold">Review Your Order</h2>
                                
                                <div className="border border-gray-700 rounded-lg p-4">
                                    <h4 className="font-medium mb-3">Order Summary</h4>
                                    <div className="space-y-2">
                                        {checkoutItems.map(item => (
                                            <div key={item.id} className="flex justify-between text-sm">
                                                <span className="text-gray-400">{item.title} x{item.quantity}</span>
                                                <span>{(item.price * item.quantity).toFixed(2)} TND</span>
                                            </div>
                                        ))}
                                        <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between font-semibold">
                                            <span>Total</span>
                                            <span>{totalAmount.toFixed(2)} TND</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border border-gray-700 rounded-lg p-4">
                                    <h4 className="font-medium mb-3">Shipping Address</h4>
                                    <p className="text-sm text-gray-300">
                                        {formData.useDifferentShipping ? formData.shippingStreetAddress : formData.streetAddress}<br />
                                        {formData.useDifferentShipping ? formData.shippingCity : formData.city}, {formData.useDifferentShipping ? formData.shippingPostalCode : formData.postalCode}
                                    </p>
                                </div>

                                <div className="border border-gray-700 rounded-lg p-4">
                                    <h4 className="font-medium mb-3">Payment Method</h4>
                                    <p className="text-sm text-gray-300 capitalize">
                                        {formData.paymentMethod === "cash_on_delivery" && "Cash on Delivery"}
                                        {formData.paymentMethod === "card" && (
                                            <>
                                                {formData.cardGateway === "monetique" && "e-DINAR (Monétique)"}
                                                {formData.cardGateway === "redpay" && "RedPay"}
                                                {formData.cardGateway === "orange" && "Orange Money"}
                                                {formData.cardGateway === "paykassma_card" && "Paykassma Card"}
                                                {formData.cardGateway === "other" && `Card ending in ${formData.cardNumber.slice(-4) || "****"}`}
                                            </>
                                        )}
                                        {formData.paymentMethod === "paykassma" && "Paykassma"}
                                        {formData.paymentMethod === "mobile" && "Mobile Payment"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-zinc-950 border border-white/10 rounded-xl p-6 sticky top-24">
                            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                            <div className="space-y-4">
                                {checkoutItems.map(item => (
                                    <div key={item.id} className="flex gap-3">
                                        {item.image && (
                                            <div className="relative h-16 w-16 bg-white/5 rounded-lg border border-white/10 flex-shrink-0 overflow-hidden">
                                                <Image
                                                    src={item.image}
                                                    alt={item.title}
                                                    fill
                                                    className="object-contain p-1"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{item.title}</p>
                                            <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                                            <p className="text-sm font-bold mt-1">{(item.price * item.quantity).toFixed(2)} TND</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="border-t border-gray-700 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm text-gray-400">
                                        <span>Subtotal</span>
                                        <span>{totalAmount.toFixed(2)} TND</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-400">
                                        <span>Shipping</span>
                                        <span>Calculated at checkout</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-gray-700">
                                        <span>Total</span>
                                        <span className="text-blue-400">{totalAmount.toFixed(2)} TND</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-between items-center pt-8 border-t border-white/10 mt-8">
                   
                    <div className="flex gap-2 justify-between w-full">
                        {currentStep !== "info" && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                className=" text-black"
                                disabled={isSubmitting}
                            >
                                Previous
                            </Button>
                        )}
                        {currentStep !== "review" ? (
                            <Button
                                type="button"
                                onClick={handleNext}
                                disabled={isSubmitting}
                            >
                                Next
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

