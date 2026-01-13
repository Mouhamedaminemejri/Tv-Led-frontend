"use client";

// ============================================================================
// AUTH LAYOUT - Shared Layout for Authentication Pages
// ============================================================================

import * as React from "react";
import Link from "next/link";
import { Tv, Sun, Moon, Monitor, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/theme-context";
import { cn } from "@/lib/utils";

// ============================================================================
// Layout Props
// ============================================================================

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    showBackLink?: boolean;
    backLinkHref?: string;
    backLinkText?: string;
    maxWidth?: "sm" | "md" | "lg";
}

// ============================================================================
// Auth Layout Component
// ============================================================================

export function AuthLayout({
    children,
    title,
    subtitle,
    showBackLink = true,
    backLinkHref = "/",
    backLinkText = "Back to Home",
    maxWidth = "md",
}: AuthLayoutProps) {
    const { theme, setTheme } = useTheme();

    const cycleTheme = () => {
        if (theme === "system") setTheme("light");
        else if (theme === "light") setTheme("dark");
        else setTheme("system");
    };

    const getThemeIcon = () => {
        if (theme === "light") return <Sun className="h-4 w-4" />;
        if (theme === "dark") return <Moon className="h-4 w-4" />;
        return <Monitor className="h-4 w-4" />;
    };

    const maxWidthClass = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
    }[maxWidth];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[url('/hero-bg.png')] bg-cover bg-center opacity-5 dark:opacity-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10" />
            </div>

            {/* Header */}
            <header className="relative z-10 w-full border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/50 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                        <div className="h-8 w-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Tv className="h-5 w-5 text-white" />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                            TunisiaTVRepair
                        </span>
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={cycleTheme}
                            className="h-8 px-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        >
                            {getThemeIcon()}
                        </Button>
                        {showBackLink && (
                            <Link href={backLinkHref}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    {backLinkText}
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex flex-col items-center justify-center px-4 py-12 sm:py-16 lg:py-20">
                <div className={cn("w-full", maxWidthClass)}>
                    {/* Card Container */}
                    <div className="bg-white dark:bg-gray-900/50 rounded-2xl shadow-xl dark:shadow-2xl border border-gray-200 dark:border-white/10 backdrop-blur-sm p-6 sm:p-8 lg:p-10">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {/* Content */}
                        {children}
                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-8">
                        By continuing, you agree to our{" "}
                        <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </main>

            {/* Decorative Elements */}
            <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>
    );
}

// ============================================================================
// Auth Form Input Component
// ============================================================================

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    icon?: React.ReactNode;
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
    ({ label, error, icon, className, ...props }, ref) => {
        const id = props.id || props.name || label.toLowerCase().replace(/\s+/g, "-");

        return (
            <div className="space-y-1.5">
                <label
                    htmlFor={id}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                    {label}
                </label>
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={id}
                        className={cn(
                            "flex h-11 w-full rounded-lg border px-3 py-2 text-sm",
                            "bg-gray-50 dark:bg-white/5",
                            "border-gray-300 dark:border-white/20",
                            "text-gray-900 dark:text-white",
                            "placeholder:text-gray-500",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            "transition-colors duration-200",
                            icon && "pl-10",
                            error && "border-red-500 focus:ring-red-500",
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-xs text-red-500 mt-1">{error}</p>
                )}
            </div>
        );
    }
);

AuthInput.displayName = "AuthInput";

// ============================================================================
// Auth Link Component
// ============================================================================

interface AuthLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string;
}

export function AuthLink({ href, children, className }: AuthLinkProps) {
    return (
        <Link
            href={href}
            className={cn(
                "text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors",
                className
            )}
        >
            {children}
        </Link>
    );
}

export default AuthLayout;
