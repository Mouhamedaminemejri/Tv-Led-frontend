"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import {
    ArrowLeft,
    Package,
    Truck,
    CheckCircle,
    Clock,
    XCircle,
    Loader2,
    Copy,
    Check,
    MapPin,
    CreditCard,
    User,
    Phone,
    Mail,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { TokenManager } from "@/services/auth-service";
import { GuestSession } from "@/utils/guest-session";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// ── Types ────────────────────────────────────────────────────────────────────

interface OrderProduct {
    id: string;
    title: string;
    reference: string;
    brand?: string;
    images?: string[];
}

interface OrderItem {
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: OrderProduct;
}

type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface OrderDetail {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus?: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    billingStreetAddress?: string;
    billingCity?: string;
    billingPostalCode?: string;
    shippingStreetAddress?: string;
    shippingCity?: string;
    shippingPostalCode?: string;
    notes?: string;
    orderItems: OrderItem[];
    createdAt: string;
    updatedAt: string;
}

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    PENDING:    { icon: Clock,       color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30", label: "Pending" },
    CONFIRMED:  { icon: CheckCircle, color: "text-blue-600 dark:text-blue-400",     bg: "bg-blue-100 dark:bg-blue-900/30",     label: "Confirmed" },
    PROCESSING: { icon: Package,     color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30", label: "Processing" },
    SHIPPED:    { icon: Truck,       color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 dark:bg-indigo-900/30", label: "Shipped" },
    DELIVERED:  { icon: CheckCircle, color: "text-green-600 dark:text-green-400",   bg: "bg-green-100 dark:bg-green-900/30",   label: "Delivered" },
    CANCELLED:  { icon: XCircle,     color: "text-red-600 dark:text-red-400",       bg: "bg-red-100 dark:bg-red-900/30",       label: "Cancelled" },
};

const getStatusConfig = (status: OrderStatus) => STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;

// ── Status timeline ──────────────────────────────────────────────────────────

const STATUS_FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

function getCompletedSteps(currentStatus: OrderStatus): number {
    if (currentStatus === "CANCELLED") return -1;
    const idx = STATUS_FLOW.indexOf(currentStatus);
    return idx >= 0 ? idx + 1 : 0;
}

// ── Fetch helper ─────────────────────────────────────────────────────────────

async function fetchOrderDetail(orderId: string): Promise<OrderDetail> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    const jwt = TokenManager.getAccessToken();
    if (jwt && !TokenManager.isTokenExpired(jwt)) {
        headers["Authorization"] = `Bearer ${jwt}`;
    } else {
        try {
            const guestToken = await GuestSession.ensureToken();
            headers["X-Guest-Token"] = guestToken;
        } catch { /* no auth */ }
    }

    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, { headers });
    if (!res.ok) {
        throw new Error(`Failed to fetch order: ${res.status}`);
    }
    return res.json();
}

// ── Component ────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params.id as string;
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();

    const [order, setOrder] = React.useState<OrderDetail | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [copied, setCopied] = React.useState(false);

    // Redirect if not authenticated
    React.useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/auth/login?redirect=/account/orders");
        }
    }, [authLoading, isAuthenticated, router]);

    // Fetch order
    React.useEffect(() => {
        if (!user || !orderId) return;
        setLoading(true);
        setError(null);
        fetchOrderDetail(orderId)
            .then(setOrder)
            .catch(err => setError(err instanceof Error ? err.message : "Failed to load order"))
            .finally(() => setLoading(false));
    }, [user, orderId]);

    const handleCopy = () => {
        if (order) {
            navigator.clipboard.writeText(order.orderNumber);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Auth loading
    if (authLoading) {
        return (
            <main className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </main>
        );
    }

    if (!user) return null;

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-black">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Back */}
                <Link
                    href="/account/orders"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Orders
                </Link>

                {loading ? (
                    <div className="text-center py-20 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Loading order details...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed to load order</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            Retry
                        </Button>
                    </div>
                ) : order ? (
                    <div className="space-y-6">
                        {/* Order Header Card */}
                        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                            Order {order.orderNumber}
                                        </h1>
                                        <button
                                            onClick={handleCopy}
                                            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                            title="Copy order number"
                                        >
                                            {copied ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {(() => {
                                            const cfg = getStatusConfig(order.status);
                                            const Icon = cfg.icon;
                                            return (
                                                <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium", cfg.bg, cfg.color)}>
                                                    <Icon className="h-4 w-4" />
                                                    {cfg.label}
                                                </span>
                                            );
                                        })()}
                                        {order.paymentStatus && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-full">
                                                Payment: {order.paymentStatus}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        Placed on {new Date(order.createdAt).toLocaleDateString("en-US", {
                                            year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {Number(order.totalAmount).toFixed(2)} TND
                                    </p>
                                </div>
                            </div>

                            {/* Status Timeline */}
                            {order.status !== "CANCELLED" && (
                                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
                                    <div className="flex items-center justify-between relative">
                                        {STATUS_FLOW.map((step, i) => {
                                            const completed = getCompletedSteps(order.status);
                                            const isActive = i < completed;
                                            const isCurrent = i === completed - 1;
                                            const cfg = getStatusConfig(step);
                                            const Icon = cfg.icon;
                                            return (
                                                <React.Fragment key={step}>
                                                    {i > 0 && (
                                                        <div className={cn(
                                                            "flex-1 h-0.5 mx-1",
                                                            isActive ? "bg-green-500" : "bg-gray-200 dark:bg-white/10"
                                                        )} />
                                                    )}
                                                    <div className="flex flex-col items-center">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-full flex items-center justify-center",
                                                            isCurrent
                                                                ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/30"
                                                                : isActive
                                                                    ? "bg-green-500 text-white"
                                                                    : "bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500"
                                                        )}>
                                                            <Icon className="h-4 w-4" />
                                                        </div>
                                                        <span className={cn(
                                                            "text-[10px] mt-1.5 font-medium",
                                                            isCurrent ? "text-blue-600 dark:text-blue-400" : isActive ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"
                                                        )}>
                                                            {cfg.label}
                                                        </span>
                                                    </div>
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Order Items */}
                        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
                            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/5">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Items ({order.orderItems.reduce((sum, i) => sum + i.quantity, 0)})
                                </h2>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-white/5">
                                {order.orderItems.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 p-4 sm:p-6">
                                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/10 flex-shrink-0">
                                            <Image
                                                src={item.product.images?.[0] || "/led-product.png"}
                                                alt={item.product.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Link href={`/leds/${item.product.id}`} className="hover:underline">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {item.product.title}
                                                </p>
                                            </Link>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                Ref: {item.product.reference}
                                                {item.product.brand && ` · ${item.product.brand}`}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {Number(item.unitPrice).toFixed(2)} TND x {item.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {Number(item.totalPrice).toFixed(2)} TND
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Total */}
                            <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</span>
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                                        {Number(order.totalAmount).toFixed(2)} TND
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Customer & Shipping Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Customer Info */}
                            <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    Customer Information
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                        <User className="h-3.5 w-3.5 text-gray-400" />
                                        {order.fullName}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                                        {order.email}
                                    </div>
                                    {order.phoneNumber && (
                                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                                            {order.phoneNumber}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                        <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                                        {order.paymentMethod.replace(/_/g, " ")}
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            {(order.shippingStreetAddress || order.shippingCity) && (
                                <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        Shipping Address
                                    </h3>
                                    <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                        {order.shippingStreetAddress && <p>{order.shippingStreetAddress}</p>}
                                        {order.shippingCity && (
                                            <p>
                                                {order.shippingCity}
                                                {order.shippingPostalCode && `, ${order.shippingPostalCode}`}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Billing Address */}
                            {(order.billingStreetAddress || order.billingCity) && (
                                <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        Billing Address
                                    </h3>
                                    <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                        {order.billingStreetAddress && <p>{order.billingStreetAddress}</p>}
                                        {order.billingCity && (
                                            <p>
                                                {order.billingCity}
                                                {order.billingPostalCode && `, ${order.billingPostalCode}`}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        {order.notes && (
                            <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Order Notes</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{order.notes}</p>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </main>
    );
}
