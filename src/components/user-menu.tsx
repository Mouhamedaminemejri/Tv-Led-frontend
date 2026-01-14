"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
    User, 
    LogOut, 
    Settings, 
    ShoppingBag, 
    ChevronDown,
    Shield,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

interface UserMenuProps {
    className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const [isOpen, setIsOpen] = React.useState(false);
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close menu on escape key
    React.useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, []);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            setIsOpen(false);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleLogin = () => {
        router.push("/auth/login");
    };

    // Loading state
    if (isLoading) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse" />
            </div>
        );
    }

    // Not authenticated - show login button
    if (!isAuthenticated || !user) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogin}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                >
                    <User className="h-4 w-4 mr-2" />
                    Login
                </Button>
                <Link href="/auth/register">
                    <Button 
                        size="sm" 
                        className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                    >
                        Get Started
                    </Button>
                </Link>
            </div>
        );
    }

    // Authenticated - show user menu
    const isAdmin = user.role?.toLowerCase() === 'admin';
    const userInitial = (user.firstName?.[0] || user.email[0]).toUpperCase();

    return (
        <div className={cn("relative", className)} ref={menuRef}>
            {/* User Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-full transition-all",
                    "hover:bg-gray-100 dark:hover:bg-white/10",
                    isOpen && "bg-gray-100 dark:bg-white/10"
                )}
            >
                {/* Avatar */}
                <div className="relative h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    {user.avatar ? (
                        <Image
                            src={user.avatar}
                            alt={user.firstName || 'User'}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <span className="text-white text-sm font-semibold">{userInitial}</span>
                    )}
                </div>
                
                {/* Name (hidden on mobile) */}
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                    {user.firstName || user.email.split('@')[0]}
                </span>
                
                {/* Dropdown Arrow */}
                <ChevronDown className={cn(
                    "h-4 w-4 text-gray-400 transition-transform",
                    isOpen && "rotate-180"
                )} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 py-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-white/10 shadow-xl shadow-black/10 dark:shadow-black/50 z-50">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                {user.avatar ? (
                                    <Image
                                        src={user.avatar}
                                        alt={user.firstName || 'User'}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <span className="text-white text-base font-semibold">{userInitial}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {user.firstName && user.lastName 
                                        ? `${user.firstName} ${user.lastName}` 
                                        : user.email.split('@')[0]}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {user.email}
                                </p>
                                {isAdmin && (
                                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-purple-600 dark:text-purple-400 font-medium">
                                        <Shield className="h-3 w-3" />
                                        Administrator
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                        <Link
                            href="/account"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                            <User className="h-4 w-4 text-gray-400" />
                            <span>My Account</span>
                        </Link>
                        
                        <Link
                            href="/account/orders"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                            <ShoppingBag className="h-4 w-4 text-gray-400" />
                            <span>My Orders</span>
                        </Link>

                        <Link
                            href="/account/settings"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                            <Settings className="h-4 w-4 text-gray-400" />
                            <span>Settings</span>
                        </Link>

                        {/* Admin Link */}
                        {isAdmin && (
                            <Link
                                href="/admin"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                            >
                                <Shield className="h-4 w-4" />
                                <span>Admin Panel</span>
                            </Link>
                        )}
                    </div>

                    {/* Logout */}
                    <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        >
                            {isLoggingOut ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <LogOut className="h-4 w-4" />
                            )}
                            <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserMenu;
