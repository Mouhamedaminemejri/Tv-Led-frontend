"use client";

// ============================================================================
// SOCIAL LOGIN BUTTONS - OAuth Integration Components
// ============================================================================

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// SVG Icons for Social Providers
// ============================================================================

function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </svg>
    );
}

function FacebookIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    );
}

function AppleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
    );
}

// ============================================================================
// Social Button Props
// ============================================================================

interface SocialButtonProps {
    provider: "google" | "facebook";
    onClick: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    variant?: "default" | "outline";
    size?: "default" | "lg";
    className?: string;
    label?: string;
}

// ============================================================================
// Individual Social Buttons
// ============================================================================

export function GoogleLoginButton({
    onClick,
    isLoading = false,
    disabled = false,
    variant = "outline",
    size = "default",
    className,
    label = "Continue with Google",
}: Omit<SocialButtonProps, "provider">) {
    return (
        <Button
            type="button"
            variant="outline"
            onClick={onClick}
            disabled={isLoading || disabled}
            className={cn(
                "w-full relative",
                "bg-white dark:bg-white hover:bg-gray-50 dark:hover:bg-gray-100",
                "border-gray-300 dark:border-gray-300",
                "text-gray-700 dark:text-gray-700",
                "transition-all duration-200",
                size === "lg" && "h-12 text-base",
                className
            )}
        >
            {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
                <>
                    <GoogleIcon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{label}</span>
                </>
            )}
        </Button>
    );
}

export function FacebookLoginButton({
    onClick,
    isLoading = false,
    disabled = false,
    variant = "default",
    size = "default",
    className,
    label = "Continue with Facebook",
}: Omit<SocialButtonProps, "provider">) {
    return (
        <Button
            type="button"
            onClick={onClick}
            disabled={isLoading || disabled}
            className={cn(
                "w-full relative",
                "bg-[#1877F2] hover:bg-[#166FE5]",
                "text-white",
                "border-transparent",
                "transition-all duration-200",
                size === "lg" && "h-12 text-base",
                className
            )}
        >
            {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
                <>
                    <FacebookIcon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{label}</span>
                </>
            )}
        </Button>
    );
}

export function AppleLoginButton({
    onClick,
    isLoading = false,
    disabled = false,
    size = "default",
    className,
    label = "Continue with Apple",
}: Omit<SocialButtonProps, "provider" | "variant">) {
    return (
        <Button
            type="button"
            onClick={onClick}
            disabled={isLoading || disabled}
            className={cn(
                "w-full relative",
                "bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-gray-100",
                "text-white dark:text-black",
                "border-transparent",
                "transition-all duration-200",
                size === "lg" && "h-12 text-base",
                className
            )}
        >
            {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
                <>
                    <AppleIcon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{label}</span>
                </>
            )}
        </Button>
    );
}

// ============================================================================
// Combined Social Login Section
// ============================================================================

interface SocialLoginSectionProps {
    onGoogleClick: () => void;
    onFacebookClick: () => void;
    onAppleClick?: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    size?: "default" | "lg";
    showDivider?: boolean;
    dividerText?: string;
    showApple?: boolean;
}

export function SocialLoginSection({
    onGoogleClick,
    onFacebookClick,
    onAppleClick,
    isLoading = false,
    disabled = false,
    size = "default",
    showDivider = true,
    dividerText = "or continue with email",
    showApple = false,
}: SocialLoginSectionProps) {
    return (
        <div className="space-y-3">
            <GoogleLoginButton
                onClick={onGoogleClick}
                isLoading={isLoading}
                disabled={disabled}
                size={size}
            />
            <FacebookLoginButton
                onClick={onFacebookClick}
                isLoading={isLoading}
                disabled={disabled}
                size={size}
            />
            {showApple && onAppleClick && (
                <AppleLoginButton
                    onClick={onAppleClick}
                    isLoading={isLoading}
                    disabled={disabled}
                    size={size}
                />
            )}
            
            {showDivider && (
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">
                            {dividerText}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SocialLoginSection;
