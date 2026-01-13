"use client";

// ============================================================================
// RESET PASSWORD PAGE - Set New Password
// ============================================================================

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { AuthLayout, AuthLink } from "@/components/auth/auth-layout";
import { PasswordInput, PasswordStrengthBar, calculatePasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/services/auth-service";
import { cn } from "@/lib/utils";

// ============================================================================
// Success View Component
// ============================================================================

function ResetSuccess() {
    return (
        <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 mb-6">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Password reset successful
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your password has been successfully changed. You can now sign in with your new password.
            </p>
            <Link href="/auth/login">
                <Button
                    className={cn(
                        "w-full h-12 text-base font-semibold",
                        "bg-gray-900 dark:bg-white text-white dark:text-black",
                        "hover:bg-gray-800 dark:hover:bg-gray-100"
                    )}
                >
                    Sign in to your account
                </Button>
            </Link>
        </div>
    );
}

// ============================================================================
// Invalid Token View
// ============================================================================

function InvalidToken() {
    return (
        <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 mb-6">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Invalid or expired link
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                This password reset link is invalid or has expired. Please request a new one.
            </p>
            <div className="space-y-3">
                <Link href="/auth/forgot-password">
                    <Button
                        className={cn(
                            "w-full h-12 text-base font-semibold",
                            "bg-gray-900 dark:bg-white text-white dark:text-black",
                            "hover:bg-gray-800 dark:hover:bg-gray-100"
                        )}
                    >
                        Request new link
                    </Button>
                </Link>
                <Link href="/auth/login">
                    <Button
                        variant="outline"
                        className="w-full h-11 border-gray-300 dark:border-white/20"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Login
                    </Button>
                </Link>
            </div>
        </div>
    );
}

// ============================================================================
// Reset Password Page Component
// ============================================================================

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [errors, setErrors] = React.useState<{ password?: string; confirmPassword?: string; general?: string }>({});
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [isInvalidToken, setIsInvalidToken] = React.useState(false);

    // Check for token on mount
    React.useEffect(() => {
        if (!token) {
            setIsInvalidToken(true);
        }
    }, [token]);

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};

        if (!password) {
            newErrors.password = "Password is required";
        } else {
            const strength = calculatePasswordStrength(password);
            if (strength.score < 2) {
                newErrors.password = "Password is too weak";
            }
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!validateForm() || !token) return;

        setIsSubmitting(true);
        try {
            await AuthService.resetPassword({
                token,
                password,
                confirmPassword,
            });
            setShowSuccess(true);
        } catch (err: any) {
            if (err?.code === "INVALID_TOKEN" || err?.code === "TOKEN_EXPIRED") {
                setIsInvalidToken(true);
            } else {
                setErrors({ general: err?.message || "Failed to reset password. Please try again." });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show invalid token view
    if (isInvalidToken) {
        return (
            <AuthLayout
                title="Reset Password"
                subtitle=""
                showBackLink={false}
            >
                <InvalidToken />
            </AuthLayout>
        );
    }

    // Show success view
    if (showSuccess) {
        return (
            <AuthLayout
                title="Password Reset"
                subtitle=""
                showBackLink={false}
            >
                <ResetSuccess />
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Set new password"
            subtitle="Create a strong password for your account"
            showBackLink={false}
        >
            {/* Error Alert */}
            {errors.general && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div className="space-y-1.5">
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        New password
                    </label>
                    <PasswordInput
                        id="password"
                        name="password"
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                        }}
                        error={errors.password}
                        showStrength
                        autoComplete="new-password"
                        disabled={isSubmitting}
                        autoFocus
                    />
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                    <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Confirm new password
                    </label>
                    <PasswordInput
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                        }}
                        error={errors.confirmPassword}
                        autoComplete="new-password"
                        disabled={isSubmitting}
                    />
                </div>

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                        "w-full h-12 text-base font-semibold",
                        "bg-gray-900 dark:bg-white text-white dark:text-black",
                        "hover:bg-gray-800 dark:hover:bg-gray-100",
                        "transition-all duration-200"
                    )}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Resetting password...
                        </>
                    ) : (
                        "Reset password"
                    )}
                </Button>
            </form>

            {/* Back to Login */}
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
                <AuthLink href="/auth/login">
                    <span className="flex items-center justify-center gap-1">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Login
                    </span>
                </AuthLink>
            </p>
        </AuthLayout>
    );
}
