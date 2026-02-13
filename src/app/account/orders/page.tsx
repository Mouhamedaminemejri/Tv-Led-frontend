"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ShoppingBag,
    Package,
    Truck,
    CheckCircle,
    Clock,
    XCircle,
    Loader2,
    ChevronRight,
    Search,
    RefreshCw,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface Order {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    totalAmount: number;
    paymentMethod: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    shippingCity?: string;
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

// ── Fetch helper ─────────────────────────────────────────────────────────────

async function fetchUserOrders(): Promise<Order[]> {
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

    const res = await fetch(`${API_BASE_URL}/orders`, { headers });

    if (!res.ok) {
        // Try alternate endpoint structure
        const altRes = await fetch(`${API_BASE_URL}/orders/my`, { headers });
        if (!altRes.ok) {
            throw new Error(`Failed to fetch orders: ${res.status}`);
        }
        const altData = await altRes.json();
        return Array.isArray(altData) ? altData : altData.data ?? altData.orders ?? [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data.data ?? data.orders ?? [];
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AccountOrdersPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();

    const [orders, setOrders] = React.useState<Order[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState<OrderStatus | "ALL">("ALL");

    // Redirect if not authenticated
    React.useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/auth/login?redirect=/account/orders");
        }
    }, [authLoading, isAuthenticated, router]);

    // Fetch orders from API
    const loadOrders = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchUserOrders();
            // Sort newest first
            data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setOrders(data);
        } catch (err) {
            console.error("Failed to load orders:", err);
            setError(err instanceof Error ? err.message : "Failed to load orders");
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (user) {
            loadOrders();
        }
    }, [user, loadOrders]);

    // Filter orders
    const filteredOrders = React.useMemo(() => {
        return orders.filter(order => {
            const matchesSearch =
                !searchQuery ||
                order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.orderItems.some(item =>
                    item.product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.product.reference.toLowerCase().includes(searchQuery.toLowerCase())
                );

            const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [orders, searchQuery, statusFilter]);

    // Counts per status
    const statusCounts = React.useMemo(() => {
        const counts: Record<string, number> = { ALL: orders.length };
        for (const o of orders) {
            counts[o.status] = (counts[o.status] || 0) + 1;
        }
        return counts;
    }, [orders]);

    // Auth loading
    if (authLoading) {
        return (
            <main className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                    <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
            </main>
        );
    }

    if (!user) return null;

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-black">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                        <Link
                            href="/account"
                            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Account
                        </Link>
                        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">My Orders</h1>
                        {!loading && orders.length > 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {orders.length} order{orders.length !== 1 ? "s" : ""}
                            </p>
                        )}
                    </div>
                    {!loading && orders.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadOrders}
                            className="border-gray-200 dark:border-white/10"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    )}
                </div>

                {/* Search + Status Tabs */}
                {!loading && orders.length > 0 && (
                    <div className="space-y-4 mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by order number, product name, or reference..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10"
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {(["ALL", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const).map(s => {
                                const count = statusCounts[s] || 0;
                                if (s !== "ALL" && count === 0) return null;
                                const isActive = statusFilter === s;
                                const cfg = s === "ALL" ? null : getStatusConfig(s as OrderStatus);
                                return (
                                    <button
                                        key={s}
                                        onClick={() => setStatusFilter(s)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                                            isActive
                                                ? "bg-blue-600 text-white"
                                                : "bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10"
                                        )}
                                    >
                                        {s === "ALL" ? "All" : cfg?.label}
                                        <span className={cn(
                                            "ml-0.5 px-1.5 py-0.5 rounded-full text-[10px]",
                                            isActive ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                                        )}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={loadOrders} className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
                            Retry
                        </Button>
                    </div>
                )}

                {/* Orders List */}
                {loading ? (
                    <div className="text-center py-20 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Loading your orders...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                        <ShoppingBag className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {searchQuery || statusFilter !== "ALL" ? "No orders found" : "No orders yet"}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {searchQuery || statusFilter !== "ALL"
                                ? "Try a different search or filter"
                                : "When you make a purchase, your orders will appear here"}
                        </p>
                        {searchQuery || statusFilter !== "ALL" ? (
                            <Button
                                variant="outline"
                                onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); }}
                            >
                                Clear Filters
                            </Button>
                        ) : (
                            <Link href="/leds">
                                <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                                    Start Shopping
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => {
                            const statusCfg = getStatusConfig(order.status);
                            const StatusIcon = statusCfg.icon;
                            const itemCount = order.orderItems.reduce((sum, i) => sum + i.quantity, 0);

                            return (
                                <div
                                    key={order.id}
                                    className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden hover:border-gray-300 dark:hover:border-white/20 transition-colors"
                                >
                                    {/* Order Header */}
                                    <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/5">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                                                        {order.orderNumber}
                                                    </span>
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                                                        statusCfg.bg,
                                                        statusCfg.color
                                                    )}>
                                                        <StatusIcon className="h-3.5 w-3.5" />
                                                        {statusCfg.label}
                                                    </span>
                                                    <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                                                        {order.paymentMethod.toLowerCase().replace(/_/g, " ")}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                                                        year: "numeric",
                                                        month: "long",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                            <div className="text-right sm:text-right">
                                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {Number(order.totalAmount).toFixed(2)} TND
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {itemCount} item{itemCount !== 1 ? "s" : ""}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="p-4 sm:p-6">
                                        <div className="flex items-center gap-4">
                                            {/* Product thumbnails */}
                                            <div className="flex -space-x-3">
                                                {order.orderItems.slice(0, 4).map((item, index) => (
                                                    <div
                                                        key={item.id}
                                                        className="relative w-12 h-12 rounded-lg border-2 border-white dark:border-gray-900 overflow-hidden bg-gray-100 dark:bg-white/10"
                                                        style={{ zIndex: 10 - index }}
                                                    >
                                                        <Image
                                                            src={item.product.images?.[0] || "/led-product.png"}
                                                            alt={item.product.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ))}
                                                {order.orderItems.length > 4 && (
                                                    <div className="relative w-12 h-12 rounded-lg border-2 border-white dark:border-gray-900 bg-gray-200 dark:bg-white/20 flex items-center justify-center" style={{ zIndex: 1 }}>
                                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                            +{order.orderItems.length - 4}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Item names */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                                    {order.orderItems.map(i => i.product.title).join(", ")}
                                                </p>
                                                {order.shippingCity && (
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                                        Shipping to {order.shippingCity}
                                                    </p>
                                                )}
                                            </div>

                                            {/* View details */}
                                            <Link href={`/account/orders/${order.id}`}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex-shrink-0"
                                                >
                                                    Details
                                                    <ChevronRight className="h-4 w-4 ml-1" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
