"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    ArrowLeft, 
    Loader2, 
    AlertCircle,
    User,
    Mail,
    Phone,
    Shield,
    ShieldCheck,
    CheckCircle,
    XCircle,
    Calendar,
    ShoppingCart,
    Save,
    Package,
    Edit,
    X
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { AdminService, type AdminUser, type UserRole, type AdminOrder } from "@/services/admin-service";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function UserDetailPage() {
    const params = useParams();
    const userId = params.id as string;

    const [user, setUser] = React.useState<AdminUser | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    
    // Edit mode
    const [editing, setEditing] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [editForm, setEditForm] = React.useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'CUSTOMER' as UserRole,
    });
    
    // Status dialog
    const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);
    const [updating, setUpdating] = React.useState(false);

    // Load user
    React.useEffect(() => {
        const loadUser = async () => {
            try {
                setLoading(true);
                const userData = await AdminService.getUser(userId);
                setUser(userData);
                setEditForm({
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    email: userData.email,
                    phone: userData.phone || '',
                    role: userData.role,
                });
            } catch (err) {
                console.error("Error loading user:", err);
                setError(err instanceof Error ? err.message : "Failed to load user");
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            loadUser();
        }
    }, [userId]);

    const handleSave = async () => {
        if (!user) return;

        try {
            setSaving(true);
            setError(null);
            const updated = await AdminService.updateUser(userId, editForm);
            setUser(prev => prev ? { ...prev, ...updated } : null);
            setEditing(false);
        } catch (err) {
            console.error("Error updating user:", err);
            setError(err instanceof Error ? err.message : "Failed to update user");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!user) return;

        try {
            setUpdating(true);
            const updated = await AdminService.updateUserStatus(userId, !user.isActive);
            setUser(prev => prev ? { ...prev, ...updated } : null);
            setStatusDialogOpen(false);
        } catch (err) {
            console.error("Error updating user status:", err);
            setError(err instanceof Error ? err.message : "Failed to update user status");
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

    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case 'GOOGLE': return '🔵';
            case 'FACEBOOK': return '🔷';
            case 'APPLE': return '🍎';
            default: return '📧';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                    <p className="text-gray-500 dark:text-gray-400">Loading user...</p>
                </div>
            </div>
        );
    }

    if (error && !user) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">User Not Found</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
                    <Link href="/admin/users">
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Users
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            {/* Page Header */}
            <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-black/80 backdrop-blur-xl">
                <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link 
                            href="/admin/users" 
                            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span className="hidden sm:inline">Back</span>
                        </Link>
                        <div className="h-6 w-px bg-gray-200 dark:bg-white/10" />
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                            {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}` 
                                : user.email}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {!editing ? (
                            <Button
                                onClick={() => setEditing(true)}
                                variant="outline"
                                className="border-gray-200 dark:border-white/10"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        ) : (
                            <>
                                <Button
                                    onClick={() => {
                                        setEditing(false);
                                        setEditForm({
                                            firstName: user.firstName || '',
                                            lastName: user.lastName || '',
                                            email: user.email,
                                            phone: user.phone || '',
                                            role: user.role,
                                        });
                                    }}
                                    variant="outline"
                                    className="border-gray-200 dark:border-white/10"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-500 text-white"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save
                                        </>
                                    )}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl">
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="relative w-20 h-20 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden flex-shrink-0">
                                    {user.avatar ? (
                                        <Image
                                            src={user.avatar}
                                            alt={user.firstName || 'User'}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-2xl">
                                            {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {user.firstName && user.lastName 
                                            ? `${user.firstName} ${user.lastName}` 
                                            : user.email.split('@')[0]}
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                                            user.role === "ADMIN"
                                                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                        )}>
                                            {user.role === "ADMIN" ? (
                                                <ShieldCheck className="h-3.5 w-3.5" />
                                            ) : (
                                                <Shield className="h-3.5 w-3.5" />
                                            )}
                                            {user.role}
                                        </span>
                                        <button
                                            onClick={() => setStatusDialogOpen(true)}
                                            className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors",
                                                user.isActive
                                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200"
                                                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200"
                                            )}
                                        >
                                            {user.isActive ? (
                                                <>
                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                    Active
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="h-3.5 w-3.5" />
                                                    Inactive
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Edit Form or Details */}
                            {editing ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-gray-700 dark:text-gray-300">First Name</Label>
                                            <Input
                                                value={editForm.firstName}
                                                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                                className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-gray-700 dark:text-gray-300">Last Name</Label>
                                            <Input
                                                value={editForm.lastName}
                                                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                                className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-gray-700 dark:text-gray-300">Email</Label>
                                        <Input
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-gray-700 dark:text-gray-300">Phone</Label>
                                        <Input
                                            value={editForm.phone}
                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                            className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-gray-700 dark:text-gray-300">Role</Label>
                                        <select
                                            value={editForm.role}
                                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                                            className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-white [&>option]:dark:bg-gray-900 [&>option]:text-gray-900 [&>option]:dark:text-white"
                                        >
                                            <option value="CUSTOMER">Customer</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Email</div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</div>
                                        </div>
                                    </div>
                                    {user.phone && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                                            <Phone className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Phone</div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{user.phone}</div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                                        <span className="text-lg">{getProviderIcon(user.provider)}</span>
                                        <div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Auth Provider</div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.provider}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                                        {user.emailVerified ? (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-yellow-500" />
                                        )}
                                        <div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Email Status</div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {user.emailVerified ? 'Verified' : 'Not Verified'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Recent Orders */}
                        {user.orders && user.orders.length > 0 && (
                            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5" />
                                    Recent Orders ({user.orders.length})
                                </h3>
                                <div className="space-y-3">
                                    {user.orders.slice(0, 5).map((order) => (
                                        <Link
                                            key={order.id}
                                            href={`/admin/orders/${order.id}`}
                                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                        >
                                            <div>
                                                <div className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                                                    {order.orderNumber}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {order.orderItems?.length || 0} items
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {order.totalAmount.toFixed(2)} TND
                                                </div>
                                                <div className={cn(
                                                    "text-xs font-medium",
                                                    order.status === 'DELIVERED' && "text-green-600 dark:text-green-400",
                                                    order.status === 'CANCELLED' && "text-red-600 dark:text-red-400",
                                                    order.status === 'PENDING' && "text-yellow-600 dark:text-yellow-400",
                                                    !['DELIVERED', 'CANCELLED', 'PENDING'].includes(order.status) && "text-blue-600 dark:text-blue-400"
                                                )}>
                                                    {order.status}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statistics</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Orders</span>
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                                        {user._count?.orders || 0}
                                    </span>
                                </div>
                                {user.cart && user.cart.items && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Cart Items</span>
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                                            {user.cart.items.length}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Timeline
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Joined</span>
                                    <span className="text-gray-900 dark:text-white">{formatDate(user.createdAt)}</span>
                                </div>
                                {user.updatedAt !== user.createdAt && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Updated</span>
                                        <span className="text-gray-900 dark:text-white">{formatDate(user.updatedAt)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Current Cart */}
                        {user.cart && user.cart.items && user.cart.items.length > 0 && (
                            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Current Cart
                                </h3>
                                <div className="space-y-2">
                                    {user.cart.items.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-white/5 rounded">
                                            <span className="text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                                                {item.productId}
                                            </span>
                                            <span className="text-gray-900 dark:text-white font-medium">
                                                × {item.quantity}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Toggle Status Dialog */}
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-white">
                            {user?.isActive ? 'Deactivate User' : 'Activate User'}
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 dark:text-gray-400">
                            {user?.isActive
                                ? `Are you sure you want to deactivate ${user?.email}? They will no longer be able to log in.`
                                : `Are you sure you want to activate ${user?.email}? They will be able to log in and use the platform.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setStatusDialogOpen(false)}
                            className="border-gray-200 dark:border-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleToggleStatus}
                            disabled={updating}
                            className={user?.isActive 
                                ? "bg-red-600 hover:bg-red-500 text-white"
                                : "bg-green-600 hover:bg-green-500 text-white"
                            }
                        >
                            {updating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : user?.isActive ? (
                                'Deactivate'
                            ) : (
                                'Activate'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
