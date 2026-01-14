"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Lock,
    Bell,
    Eye,
    EyeOff,
    Shield,
    Loader2,
    AlertCircle,
    CheckCircle,
    X,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function AccountSettingsPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, changePassword, logout } = useAuth();
    
    // Password change state
    const [passwordData, setPasswordData] = React.useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
    const [showNewPassword, setShowNewPassword] = React.useState(false);
    const [isChangingPassword, setIsChangingPassword] = React.useState(false);
    
    // Notification preferences
    const [notifications, setNotifications] = React.useState({
        orderUpdates: true,
        promotions: false,
        newsletter: false,
    });
    
    // UI state
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

    // Redirect if not authenticated
    React.useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/auth/login?redirect=/account/settings");
        }
    }, [isLoading, isAuthenticated, router]);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validation
        if (!passwordData.currentPassword) {
            setError("Current password is required");
            return;
        }
        if (!passwordData.newPassword) {
            setError("New password is required");
            return;
        }
        if (passwordData.newPassword.length < 8) {
            setError("New password must be at least 8 characters");
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsChangingPassword(true);
        try {
            await changePassword(passwordData.currentPassword, passwordData.newPassword);
            setSuccess("Password changed successfully!");
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err?.message || "Failed to change password");
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        // In a real app, you would call an API to delete the account
        // For now, we'll just log out
        await logout();
        router.push("/");
    };

    // Loading state
    if (isLoading) {
        return (
            <main className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                    <p className="text-gray-500 dark:text-gray-400">Loading settings...</p>
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
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
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

                {/* Success Message */}
                {success && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
                    </div>
                )}

                {/* Change Password */}
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Change Password
                    </h3>
                    
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <Label className="text-gray-700 dark:text-gray-300">Current Password</Label>
                            <div className="relative mt-1">
                                <Input
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="pr-10 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <Label className="text-gray-700 dark:text-gray-300">New Password</Label>
                            <div className="relative mt-1">
                                <Input
                                    type={showNewPassword ? "text" : "password"}
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="pr-10 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                At least 8 characters with a mix of letters, numbers, and symbols
                            </p>
                        </div>
                        
                        <div>
                            <Label className="text-gray-700 dark:text-gray-300">Confirm New Password</Label>
                            <Input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                            />
                        </div>
                        
                        <Button
                            type="submit"
                            disabled={isChangingPassword}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white"
                        >
                            {isChangingPassword ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Changing...
                                </>
                            ) : (
                                "Change Password"
                            )}
                        </Button>
                    </form>
                </div>

                {/* Notification Preferences */}
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Notification Preferences
                    </h3>
                    
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <Checkbox
                                checked={notifications.orderUpdates}
                                onCheckedChange={(checked) => setNotifications({ ...notifications, orderUpdates: !!checked })}
                            />
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Order Updates</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Get notified about your order status</p>
                            </div>
                        </label>
                        
                        <label className="flex items-center gap-3 cursor-pointer">
                            <Checkbox
                                checked={notifications.promotions}
                                onCheckedChange={(checked) => setNotifications({ ...notifications, promotions: !!checked })}
                            />
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Promotions & Deals</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Receive exclusive offers and discounts</p>
                            </div>
                        </label>
                        
                        <label className="flex items-center gap-3 cursor-pointer">
                            <Checkbox
                                checked={notifications.newsletter}
                                onCheckedChange={(checked) => setNotifications({ ...notifications, newsletter: !!checked })}
                            />
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Newsletter</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Stay updated with our latest news</p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Privacy & Security */}
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Privacy & Security
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
                            </div>
                            <Button variant="outline" size="sm" className="border-gray-200 dark:border-white/10" disabled>
                                Coming Soon
                            </Button>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Download My Data</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Get a copy of your account data</p>
                            </div>
                            <Button variant="outline" size="sm" className="border-gray-200 dark:border-white/10" disabled>
                                Coming Soon
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-red-200 dark:border-red-800/50 p-6">
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                        <Trash2 className="h-5 w-5" />
                        Danger Zone
                    </h3>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    
                    <Button
                        variant="outline"
                        onClick={() => setDeleteDialogOpen(true)}
                        className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        Delete Account
                    </Button>
                </div>
            </div>

            {/* Delete Account Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-white">Delete Account</DialogTitle>
                        <DialogDescription className="text-gray-500 dark:text-gray-400">
                            Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            className="border-gray-200 dark:border-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                        >
                            Delete Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}
