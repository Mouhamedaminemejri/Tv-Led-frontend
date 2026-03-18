"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
    Package, 
    ShoppingCart, 
    Users, 
    LayoutDashboard,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    Sun,
    Moon,
    ShieldAlert,
    Loader2,
    LogIn,
    FileCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/theme-context";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

interface NavItem {
    href: string;
    label: string;
    icon: React.ElementType;
}

const navItems: NavItem[] = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/software", label: "Software", icon: FileCode },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/users", label: "Users", icon: Users },
];

// ============================================================================
// Admin Guard Component
// ============================================================================

function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
                    <p className="text-gray-500 dark:text-gray-400">Verifying access...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - show login prompt
    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <LogIn className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Authentication Required
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Please log in to access the admin panel.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/auth/login?redirect=/admin">
                            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white">
                                <LogIn className="h-4 w-4 mr-2" />
                                Log In
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button variant="outline" className="w-full sm:w-auto border-gray-200 dark:border-white/10">
                                Back to Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Check if user has admin role (handle both lowercase and uppercase)
    const isAdmin = user.role?.toLowerCase() === 'admin';

    // Authenticated but not admin - show access denied
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="h-10 w-10 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Access Denied
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                        You don't have permission to access the admin panel.
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
                        This area is restricted to administrators only.
                        <br />
                        Current role: <span className="font-medium text-gray-600 dark:text-gray-300">{user.role || 'Unknown'}</span>
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/">
                            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white">
                                Back to Home
                            </Button>
                        </Link>
                        <Link href="/leds">
                            <Button variant="outline" className="w-full sm:w-auto border-gray-200 dark:border-white/10">
                                Browse Products
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Admin user - render children
    return <>{children}</>;
}

// ============================================================================
// Admin Layout Component
// ============================================================================

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { theme, resolvedTheme, setTheme } = useTheme();
    const isDarkMode = resolvedTheme === "dark";
    const toggleTheme = () => {
        // Toggle between explicit light/dark (avoid getting "stuck" on system)
        setTheme(isDarkMode ? "light" : "dark");
    };
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = React.useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    // Close mobile menu on route change
    React.useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    return (
        <AdminGuard>
            <div className="min-h-screen bg-gray-100 dark:bg-black">
                {/* Mobile Header */}
                <header className="lg:hidden sticky top-0 z-50 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-black">
                    <div className="flex items-center justify-between h-16 px-4">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2"
                            >
                                {mobileMenuOpen ? (
                                    <X className="h-5 w-5" />
                                ) : (
                                    <Menu className="h-5 w-5" />
                                )}
                            </Button>
                            <Link href="/admin/dashboard" className="flex items-center gap-2">
                                <LayoutDashboard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                <span className="font-bold text-gray-900 dark:text-white">Admin Panel</span>
                            </Link>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleTheme}
                                className="p-2"
                            >
                                {isDarkMode ? (
                                    <Sun className="h-5 w-5" />
                                ) : (
                                    <Moon className="h-5 w-5" />
                                )}
                            </Button>
                            <Link href="/">
                                <Button variant="outline" size="sm" className="text-xs">
                                    Exit Admin
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Navigation Dropdown */}
                    {mobileMenuOpen && (
                        <nav className="border-t border-gray-200 dark:border-white/10 bg-white dark:bg-black p-4 space-y-2">
                            {/* User Info */}
                            {user && (
                                <div className="px-4 py-3 mb-2 bg-gray-50 dark:bg-white/5 rounded-lg">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {user.firstName} {user.lastName}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                                </div>
                            )}
                            {navItems.map((item) => {
                                const isActive = pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                            isActive
                                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    )}
                </header>

                <div className="flex">
                    {/* Desktop Sidebar */}
                    <aside
                        className={cn(
                            "hidden lg:flex flex-col fixed left-0 top-0 h-screen border-r border-gray-200 dark:border-white/10 bg-white dark:bg-black transition-all duration-300 z-40",
                            sidebarOpen ? "w-64" : "w-20"
                        )}
                    >
                        {/* Sidebar Header */}
                        <div className="flex items-center justify-between h-20 px-4 border-b border-gray-200 dark:border-white/10">
                            <Link 
                                href="/admin/dashboard" 
                                className={cn(
                                    "flex items-center gap-3 transition-all",
                                    !sidebarOpen && "justify-center w-full"
                                )}
                            >
                                <LayoutDashboard className="h-8 w-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                {sidebarOpen && (
                                    <span className="font-bold text-xl text-gray-900 dark:text-white">Admin</span>
                                )}
                            </Link>
                            {sidebarOpen && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                            )}
                        </div>

                        {/* User Info */}
                        {sidebarOpen && user && (
                            <div className="px-4 py-3 border-b border-gray-200 dark:border-white/10">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {user.firstName} {user.lastName}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                                    Administrator
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                            {navItems.map((item) => {
                                const isActive = pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                                            isActive
                                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm"
                                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white",
                                            !sidebarOpen && "justify-center px-3"
                                        )}
                                        title={!sidebarOpen ? item.label : undefined}
                                    >
                                        <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-blue-600 dark:text-blue-400")} />
                                        {sidebarOpen && (
                                            <span className="font-medium">{item.label}</span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Sidebar Footer */}
                        <div className="p-4 border-t border-gray-200 dark:border-white/10 space-y-2">
                            {/* Theme Toggle */}
                            <Button
                                variant="ghost"
                                onClick={toggleTheme}
                                className={cn(
                                    "w-full justify-start gap-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white",
                                    !sidebarOpen && "justify-center px-3"
                                )}
                                title={!sidebarOpen ? (isDarkMode ? "Light Mode" : "Dark Mode") : undefined}
                            >
                                {isDarkMode ? (
                                    <Sun className="h-5 w-5 flex-shrink-0" />
                                ) : (
                                    <Moon className="h-5 w-5 flex-shrink-0" />
                                )}
                                {sidebarOpen && (
                                    <span className="font-medium">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
                                )}
                            </Button>

                            {/* Exit Admin */}
                            <Link href="/" className="block">
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start gap-3 px-4 py-3 border-gray-300 dark:border-white/10",
                                        !sidebarOpen && "justify-center px-3"
                                    )}
                                    title={!sidebarOpen ? "Exit Admin" : undefined}
                                >
                                    <ChevronLeft className="h-5 w-5 flex-shrink-0" />
                                    {sidebarOpen && (
                                        <span className="font-medium">Exit Admin</span>
                                    )}
                                </Button>
                            </Link>

                            {/* Collapse Toggle */}
                            {!sidebarOpen && (
                                <Button
                                    variant="ghost"
                                    onClick={() => setSidebarOpen(true)}
                                    className="w-full justify-center px-3 py-3 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main
                        className={cn(
                            "flex-1 min-h-screen transition-all duration-300",
                            "lg:ml-64",
                            !sidebarOpen && "lg:ml-20"
                        )}
                    >
                        {children}
                    </main>
                </div>
            </div>
        </AdminGuard>
    );
}
