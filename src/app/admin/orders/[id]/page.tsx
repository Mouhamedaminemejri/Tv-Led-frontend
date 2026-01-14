"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, 
    Loader2, 
    AlertCircle,
    ShoppingCart,
    Package,
    Clock,
    CheckCircle,
    Truck,
    XCircle,
    User,
    MapPin,
    Phone,
    Mail,
    CreditCard,
    Calendar
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { AdminService, type AdminOrder, type OrderStatus } from "@/services/admin-service";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const ORDER_STATUSES: { value: OrderStatus; label: string; description: string }[] = [
    { value: "PENDING", label: "Pending", description: "Order received, awaiting confirmation" },
    { value: "CONFIRMED", label: "Confirmed", description: "Order confirmed, preparing for processing" },
    { value: "PROCESSING", label: "Processing", description: "Order is being prepared" },
    { value: "SHIPPED", label: "Shipped", description: "Order has been shipped" },
    { value: "DELIVERED", label: "Delivered", description: "Order has been delivered" },
    { value: "CANCELLED", label: "Cancelled", description: "Order has been cancelled" },
];

const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
        case "PENDING":
            return { icon: Clock, color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400", ring: "ring-yellow-500" };
        case "CONFIRMED":
            return { icon: CheckCircle, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400", ring: "ring-blue-500" };
        case "PROCESSING":
            return { icon: Package, color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400", ring: "ring-purple-500" };
        case "SHIPPED":
            return { icon: Truck, color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400", ring: "ring-indigo-500" };
        case "DELIVERED":
            return { icon: CheckCircle, color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400", ring: "ring-green-500" };
        case "CANCELLED":
            return { icon: XCircle, color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400", ring: "ring-red-500" };
        default:
            return { icon: Clock, color: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400", ring: "ring-gray-500" };
    }
};

export default function OrderDetailPage() {
    const params = useParams();
    const orderId = params.id as string;

    const [order, setOrder] = React.useState<AdminOrder | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);
    const [newStatus, setNewStatus] = React.useState<OrderStatus | null>(null);
    const [updating, setUpdating] = React.useState(false);

    // Load order
    React.useEffect(() => {
        const loadOrder = async () => {
            try {
                setLoading(true);
                const orderData = await AdminService.getOrder(orderId);
                setOrder(orderData);
            } catch (err) {
                console.error("Error loading order:", err);
                setError(err instanceof Error ? err.message : "Failed to load order");
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            loadOrder();
        }
    }, [orderId]);

    const handleUpdateStatus = async () => {
        if (!newStatus || !order) return;

        try {
            setUpdating(true);
            const updated = await AdminService.updateOrderStatus(orderId, newStatus);
            setOrder(updated);
            setStatusDialogOpen(false);
            setNewStatus(null);
        } catch (err) {
            console.error("Error updating status:", err);
            setError(err instanceof Error ? err.message : "Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                    <p className="text-gray-500 dark:text-gray-400">Loading order...</p>
                </div>
            </div>
        );
    }

    if (error && !order) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Order Not Found</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
                    <Link href="/admin/orders">
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Orders
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (!order) return null;

    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            {/* Page Header */}
            <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-black/80 backdrop-blur-xl">
                <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link 
                            href="/admin/orders" 
                            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span className="hidden sm:inline">Back</span>
                        </Link>
                        <div className="h-6 w-px bg-gray-200 dark:bg-white/10" />
                        <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{order.orderNumber}</h1>
                    </div>
                    <Button
                        onClick={() => setStatusDialogOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                        Update Status
                    </Button>
                </div>
            </header>

            <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl">
                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                        <span className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</span>
                    </div>
                )}

                {/* Order Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Card */}
                        <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Order Status</h2>
                                <span className={cn(
                                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                                    statusConfig.color
                                )}>
                                    <StatusIcon className="h-4 w-4" />
                                    {order.status}
                                </span>
                            </div>
                            
                            {/* Status Timeline */}
                            <div className="flex items-center justify-between overflow-x-auto pb-2">
                                {ORDER_STATUSES.filter(s => s.value !== "CANCELLED").map((status, index) => {
                                    const isActive = order.status === status.value;
                                    const isPast = ORDER_STATUSES.findIndex(s => s.value === order.status) >= index && order.status !== "CANCELLED";
                                    const config = getStatusConfig(status.value);
                                    const Icon = config.icon;
                                    
                                    return (
                                        <React.Fragment key={status.value}>
                                            <div className="flex flex-col items-center gap-2 min-w-[80px]">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                                    isPast ? config.color : "bg-gray-100 dark:bg-white/10 text-gray-400",
                                                    isActive && `ring-2 ${config.ring} ring-offset-2 dark:ring-offset-black`
                                                )}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <span className={cn(
                                                    "text-xs font-medium text-center",
                                                    isPast ? "text-gray-900 dark:text-white" : "text-gray-400"
                                                )}>
                                                    {status.label}
                                                </span>
                                            </div>
                                            {index < ORDER_STATUSES.filter(s => s.value !== "CANCELLED").length - 1 && (
                                                <div className={cn(
                                                    "flex-1 h-0.5 mx-2",
                                                    ORDER_STATUSES.findIndex(s => s.value === order.status) > index && order.status !== "CANCELLED"
                                                        ? "bg-blue-500"
                                                        : "bg-gray-200 dark:bg-white/10"
                                                )} />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Order Items ({order.orderItems.length})
                            </h2>
                            <div className="space-y-4">
                                {order.orderItems.map((item) => (
                                    <div key={item.id} className="flex gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                                        <div className="relative w-16 h-16 bg-gray-200 dark:bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                                            <Image
                                                src={item.product?.images?.[0] || '/led-product.png'}
                                                alt={item.product?.title || 'Product'}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                                {item.product?.title || 'Unknown Product'}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Ref: {item.product?.reference}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    Qty: {item.quantity}
                                                </span>
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    @ {item.unitPrice.toFixed(2)} TND
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {item.totalPrice.toFixed(2)} TND
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Order Total */}
                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {order.totalAmount.toFixed(2)} TND
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Customer Info */}
                        <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Customer
                            </h2>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-900 dark:text-white font-medium">{order.fullName}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600 dark:text-gray-400">{order.email}</span>
                                </div>
                                {order.phoneNumber && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600 dark:text-gray-400">{order.phoneNumber}</span>
                                    </div>
                                )}
                                {order.user && (
                                    <div className="pt-3 border-t border-gray-200 dark:border-white/10">
                                        <Link href={`/admin/users/${order.user.id}`}>
                                            <Button variant="outline" size="sm" className="w-full border-gray-200 dark:border-white/10">
                                                View Customer Profile
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Payment
                            </h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Method</span>
                                    <span className="text-gray-900 dark:text-white font-medium">
                                        {order.paymentMethod.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Amount</span>
                                    <span className="text-gray-900 dark:text-white font-medium">
                                        {order.totalAmount.toFixed(2)} TND
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        {order.shippingStreetAddress && (
                            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Shipping Address
                                </h2>
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <p>{order.shippingStreetAddress}</p>
                                    <p>{order.shippingCity} {order.shippingPostalCode}</p>
                                </div>
                            </div>
                        )}

                        {/* Order Date */}
                        <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Timeline
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Created</span>
                                    <span className="text-gray-900 dark:text-white">{formatDate(order.createdAt)}</span>
                                </div>
                                {order.updatedAt !== order.createdAt && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Updated</span>
                                        <span className="text-gray-900 dark:text-white">{formatDate(order.updatedAt)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Update Status Dialog */}
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-white">Update Order Status</DialogTitle>
                        <DialogDescription className="text-gray-500 dark:text-gray-400">
                            Select a new status for order {order.orderNumber}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-2 py-4">
                        {ORDER_STATUSES.map((status) => {
                            const config = getStatusConfig(status.value);
                            const Icon = config.icon;
                            const isSelected = newStatus === status.value;
                            const isCurrent = order.status === status.value;
                            
                            return (
                                <button
                                    key={status.value}
                                    onClick={() => setNewStatus(status.value)}
                                    disabled={isCurrent}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                                        isSelected
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                            : "border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5",
                                        isCurrent && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", config.color)}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                            {status.label}
                                            {isCurrent && (
                                                <span className="text-xs bg-gray-200 dark:bg-white/10 px-2 py-0.5 rounded">Current</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{status.description}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setStatusDialogOpen(false);
                                setNewStatus(null);
                            }}
                            className="border-gray-200 dark:border-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateStatus}
                            disabled={!newStatus || updating}
                            className="bg-blue-600 hover:bg-blue-500 text-white"
                        >
                            {updating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Status'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
