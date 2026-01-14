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
    Users as UsersIcon,
    Shield,
    ShieldCheck,
    Mail,
    Phone,
    CheckCircle,
    XCircle,
    MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AdminService, type AdminUser, type UserRole } from "@/services/admin-service";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const USER_ROLES: { value: UserRole | ""; label: string }[] = [
    { value: "", label: "All Roles" },
    { value: "CUSTOMER", label: "Customer" },
    { value: "ADMIN", label: "Admin" },
];

const USER_STATUSES = [
    { value: "", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
];

export default function AdminUsersPage() {
    const [users, setUsers] = React.useState<AdminUser[]>([]);
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
    const [roleFilter, setRoleFilter] = React.useState<UserRole | "">("");
    const [statusFilter, setStatusFilter] = React.useState<string>("");
    
    // Status update dialog
    const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState<AdminUser | null>(null);
    const [updating, setUpdating] = React.useState(false);
    
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

    // Load users
    const loadUsers = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await AdminService.getUsers(currentPage, ITEMS_PER_PAGE, {
                role: roleFilter || undefined,
                isActive: statusFilter === "" ? undefined : statusFilter === "active",
            });
            
            // Filter by search locally
            let filteredUsers = response.data;
            if (debouncedSearch) {
                const search = debouncedSearch.toLowerCase();
                filteredUsers = filteredUsers.filter(user =>
                    user.email.toLowerCase().includes(search) ||
                    user.firstName?.toLowerCase().includes(search) ||
                    user.lastName?.toLowerCase().includes(search) ||
                    user.phone?.includes(search)
                );
            }
            
            setUsers(filteredUsers);
            setPagination({
                total: response.total,
                page: response.page,
                limit: response.limit,
                totalPages: response.totalPages,
            });
        } catch (err) {
            console.error("Error loading users:", err);
            setError(err instanceof Error ? err.message : "Failed to load users");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearch, roleFilter, statusFilter]);

    React.useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // Handle status update
    const handleToggleStatus = async () => {
        if (!selectedUser) return;

        try {
            setUpdating(true);
            await AdminService.updateUserStatus(selectedUser.id, !selectedUser.isActive);
            loadUsers();
            setStatusDialogOpen(false);
            setSelectedUser(null);
        } catch (err) {
            console.error("Error updating user status:", err);
            setError(err instanceof Error ? err.message : "Failed to update user status");
        } finally {
            setUpdating(false);
        }
    };

    // Reset filters
    const resetFilters = () => {
        setSearchQuery("");
        setRoleFilter("");
        setStatusFilter("");
        setCurrentPage(1);
    };

    const hasActiveFilters = searchQuery || roleFilter || statusFilter;

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case 'GOOGLE':
                return '🔵';
            case 'FACEBOOK':
                return '🔷';
            case 'APPLE':
                return '🍎';
            default:
                return '📧';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            {/* Page Header */}
            <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-black/80 backdrop-blur-xl">
                <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Users</h1>
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
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                            />
                        </div>
                        <select
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value as UserRole | "");
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-white [&>option]:dark:bg-gray-900 [&>option]:text-gray-900 [&>option]:dark:text-white"
                        >
                            {USER_ROLES.map(role => (
                                <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-white [&>option]:dark:bg-gray-900 [&>option]:text-gray-900 [&>option]:dark:text-white"
                        >
                            {USER_STATUSES.map(status => (
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

                {/* Users Table */}
                {loading ? (
                    <div className="text-center py-20 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Loading users...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                        <UsersIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                            {hasActiveFilters ? "No users match your filters" : "No users found"}
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
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">User</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Provider</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Orders</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                        {users.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden flex-shrink-0">
                                                            {user.avatar ? (
                                                                <Image
                                                                    src={user.avatar}
                                                                    alt={user.firstName || 'User'}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-semibold text-sm">
                                                                    {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:text-white">
                                                                {user.firstName && user.lastName
                                                                    ? `${user.firstName} ${user.lastName}`
                                                                    : user.email.split('@')[0]}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                                {user.emailVerified ? (
                                                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                                                ) : (
                                                                    <XCircle className="h-3 w-3 text-yellow-500" />
                                                                )}
                                                                {user.emailVerified ? 'Verified' : 'Unverified'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                            <Mail className="h-3.5 w-3.5" />
                                                            <span className="truncate max-w-[150px]">{user.email}</span>
                                                        </div>
                                                        {user.phone && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                                <Phone className="h-3.5 w-3.5" />
                                                                <span>{user.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
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
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-sm" title={user.provider}>
                                                        {getProviderIcon(user.provider)} {user.provider}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setStatusDialogOpen(true);
                                                        }}
                                                        className={cn(
                                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors",
                                                            user.isActive
                                                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                                                                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
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
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-sm text-gray-900 dark:text-white font-medium">
                                                        {user._count?.orders || 0}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {formatDate(user.createdAt)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Link href={`/admin/users/${user.id}`}>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Details">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
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

            {/* Toggle Status Dialog */}
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-white">
                            {selectedUser?.isActive ? 'Deactivate User' : 'Activate User'}
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 dark:text-gray-400">
                            {selectedUser?.isActive
                                ? `Are you sure you want to deactivate ${selectedUser?.email}? They will no longer be able to log in.`
                                : `Are you sure you want to activate ${selectedUser?.email}? They will be able to log in and use the platform.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setStatusDialogOpen(false);
                                setSelectedUser(null);
                            }}
                            className="border-gray-200 dark:border-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleToggleStatus}
                            disabled={updating}
                            className={selectedUser?.isActive 
                                ? "bg-red-600 hover:bg-red-500 text-white"
                                : "bg-green-600 hover:bg-green-500 text-white"
                            }
                        >
                            {updating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : selectedUser?.isActive ? (
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
