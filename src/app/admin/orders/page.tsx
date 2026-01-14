"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Search, 
    Eye, 
    ChevronLeft, 
    ChevronRight,
    Loader2,
    AlertCircle,
    X,
    ShoppingCart,
    Package,
    Clock,
    CheckCircle,
    Truck,
    XCircle
} from "lucide-react";
import Link from "next/link";
import { AdminService, type AdminOrder, type OrderStatus } from "@/services/admin-service";
import { cn } from "@/lib/utils";

const ORDER_STATUSES: { value: OrderStatus | ""; label: string }[] = [
    { value: "", label: "All Status" },
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "PROCESSING", label: "Processing" },
    { value: "SHIPPED", label: "Shipped" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELLED", label: "Cancelled" },
];

const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
        case "PENDING":
            return { icon: Clock, color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" };
        case "CONFIRMED":
            return { icon: CheckCircle, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" };
        case "PROCESSING":
            return { icon: Package, color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" };
        case "SHIPPED":
            return { icon: Truck, color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" };
        case "DELIVERED":
            return { icon: CheckCircle, color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" };
        case "CANCELLED":
            return { icon: XCircle, color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" };
        default:
            return { icon: Clock, color: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400" };
    }
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = React.useState<AdminOrder[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    
    // Pagination
    const [currentPage, setCurrentPage] = React.useState(1);
    const [pagination, setPagination] = React.useState<{
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    } | null>(null);
    
    // Filters
    const [searchQuery, setSearchQuery] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState<OrderStatus | "">("");
    
    const ITEMS_PER_PAGE = 20;

    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = React.useState("");
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Load orders
    const loadOrders = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await AdminService.getOrders(currentPage, ITEMS_PER_PAGE, {
                status: statusFilter || undefined,
            });
            
            // Filter by search locally (backend might not support search)
            let filteredOrders = response.data;
            if (debouncedSearch) {
                const search = debouncedSearch.toLowerCase();
                filteredOrders = filteredOrders.filter(order =>
                    order.orderNumber.toLowerCase().includes(search) ||
                    order.fullName.toLowerCase().includes(search) ||
                    order.email.toLowerCase().includes(search) ||
                    order.phoneNumber?.includes(search)
                );
            }
            
            setOrders(filteredOrders);
            setPagination({
                total: response.total,
                page: response.page,
                limit: response.limit,
                totalPages: response.totalPages,
            });
        } catch (err) {
            console.error("Error loading orders:", err);
            setError(err instanceof Error ? err.message : "Failed to load orders");
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearch, statusFilter]);

    React.useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    // Reset filters
    const resetFilters = () => {
        setSearchQuery("");
        setStatusFilter("");
        setCurrentPage(1);
    };

    const hasActiveFilters = searchQuery || statusFilter;

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            {/* Page Header */}
            <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-black/80 backdrop-blur-xl">
                <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Orders</h1>
                        {pagination && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                ({pagination.total} total)
                            </span>
                        )}
                    </div>
                </div>
            </header>

            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Filters */}
                <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search orders, customers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value as OrderStatus | "");
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-white [&>option]:dark:bg-gray-900 [&>option]:text-gray-900 [&>option]:dark:text-white"
                        >
                            {ORDER_STATUSES.map(status => (
                                <option key={status.value} value={status.value}>{status.label}</option>
                            ))}
                        </select>
                        {hasActiveFilters && (
                            <Button variant="outline" onClick={resetFilters} className="border-gray-200 dark:border-white/10">
                                <X className="h-4 w-4 mr-2" />
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                        <span className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</span>
                        <button onClick={() => setError(null)}>
                            <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </button>
                    </div>
                )}

                {/* Orders Table */}
                {loading ? (
                    <div className="text-center py-20 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Loading orders...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                        <ShoppingCart className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                            {hasActiveFilters ? "No orders match your filters" : "No orders found"}
                        </p>
                        {hasActiveFilters && (
                            <Button variant="outline" onClick={resetFilters}>
                                Clear Filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Order</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Items</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Total</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                        {orders.map((order) => {
                                            const statusConfig = getStatusConfig(order.status);
                                            const StatusIcon = statusConfig.icon;
                                            return (
                                                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="px-4 py-4">
                                                        <div className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                                                            {order.orderNumber}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {order.paymentMethod.replace(/_/g, ' ')}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {order.fullName}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {order.email}
                                                        </div>
                                                        {order.phoneNumber && (
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {order.phoneNumber}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="text-sm text-gray-900 dark:text-white">
                                                            {order.orderItems.length} item(s)
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[150px] truncate">
                                                            {order.orderItems.map(item => item.product?.title).filter(Boolean).join(', ')}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            {order.totalAmount.toFixed(2)} TND
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className={cn(
                                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                                                            statusConfig.color
                                                        )}>
                                                            <StatusIcon className="h-3.5 w-3.5" />
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {formatDate(order.createdAt)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <Link href={`/admin/orders/${order.id}`}>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Details">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, pagination.total)} of {pagination.total}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1 || loading}
                                        className="border-gray-200 dark:border-white/10"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Previous
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                            let pageNum: number;
                                            if (pagination.totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= pagination.totalPages - 2) {
                                                pageNum = pagination.totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    disabled={loading}
                                                    className={currentPage === pageNum ? "bg-blue-600 hover:bg-blue-500 text-white" : "border-gray-200 dark:border-white/10"}
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                                        disabled={currentPage === pagination.totalPages || loading}
                                        className="border-gray-200 dark:border-white/10"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
