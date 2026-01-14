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
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

// Mock order data - In a real app, this would come from an API
interface Order {
    id: string;
    orderNumber: string;
    status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    totalAmount: number;
    createdAt: string;
    items: Array<{
        id: string;
        title: string;
        quantity: number;
        price: number;
        image: string;
    }>;
}

const getStatusConfig = (status: Order['status']) => {
    switch (status) {
        case 'PENDING':
            return { icon: Clock, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Pending' };
        case 'CONFIRMED':
            return { icon: CheckCircle, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Confirmed' };
        case 'PROCESSING':
            return { icon: Package, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', label: 'Processing' };
        case 'SHIPPED':
            return { icon: Truck, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30', label: 'Shipped' };
        case 'DELIVERED':
            return { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Delivered' };
        case 'CANCELLED':
            return { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Cancelled' };
        default:
            return { icon: Clock, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-900/30', label: 'Unknown' };
    }
};

export default function AccountOrdersPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading } = useAuth();
    const [orders, setOrders] = React.useState<Order[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState("");

    // Redirect if not authenticated
    React.useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/auth/login?redirect=/account/orders");
        }
    }, [isLoading, isAuthenticated, router]);

    // Fetch orders - In a real app, this would be an API call
    React.useEffect(() => {
        if (user) {
            // Simulate API call
            setTimeout(() => {
                // Mock data - replace with actual API call
                setOrders([]);
                setLoading(false);
            }, 500);
        }
    }, [user]);

    // Filter orders by search
    const filteredOrders = orders.filter(order =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Loading state
    if (isLoading) {
        return (
            <main className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                    <p className="text-gray-500 dark:text-gray-400">Loading orders...</p>
                </div>
            </main>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-black">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-16 flex items-center gap-4">
                    <Link
                        href="/account"
                        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span className="hidden sm:inline">Back to Account</span>
                    </Link>
                    <div className="h-6 w-px bg-gray-200 dark:bg-white/10" />
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Orders</h1>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Search */}
                {orders.length > 0 && (
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search orders..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10"
                            />
                        </div>
                    </div>
                )}

                {/* Orders List */}
                {loading ? (
                    <div className="text-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Loading your orders...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                        <ShoppingBag className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {searchQuery ? "No orders found" : "No orders yet"}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {searchQuery 
                                ? "Try a different search term" 
                                : "When you make a purchase, your orders will appear here"}
                        </p>
                        <Link href="/leds">
                            <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                                Start Shopping
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => {
                            const statusConfig = getStatusConfig(order.status);
                            const StatusIcon = statusConfig.icon;
                            
                            return (
                                <div
                                    key={order.id}
                                    className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden"
                                >
                                    {/* Order Header */}
                                    <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/10">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                                                        {order.orderNumber}
                                                    </span>
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                                                        statusConfig.bg,
                                                        statusConfig.color
                                                    )}>
                                                        <StatusIcon className="h-3.5 w-3.5" />
                                                        {statusConfig.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {order.totalAmount.toFixed(2)} TND
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {order.items.length} item(s)
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Items Preview */}
                                    <div className="p-4 sm:p-6">
                                        <div className="flex items-center gap-4">
                                            {/* Item Images */}
                                            <div className="flex -space-x-3">
                                                {order.items.slice(0, 3).map((item, index) => (
                                                    <div
                                                        key={item.id}
                                                        className="relative w-12 h-12 rounded-lg border-2 border-white dark:border-gray-900 overflow-hidden bg-gray-100 dark:bg-white/10"
                                                        style={{ zIndex: 3 - index }}
                                                    >
                                                        <Image
                                                            src={item.image || '/led-product.png'}
                                                            alt={item.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ))}
                                                {order.items.length > 3 && (
                                                    <div className="relative w-12 h-12 rounded-lg border-2 border-white dark:border-gray-900 bg-gray-200 dark:bg-white/20 flex items-center justify-center">
                                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                            +{order.items.length - 3}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Item Names */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                                    {order.items.map(item => item.title).join(', ')}
                                                </p>
                                            </div>

                                            {/* View Details Button */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                            >
                                                View Details
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
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
