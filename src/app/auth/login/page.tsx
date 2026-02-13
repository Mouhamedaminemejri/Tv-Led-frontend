"use client";

// ============================================================================
// LOGIN PAGE - User Authentication
// ============================================================================

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { AuthLayout, AuthInput, AuthLink } from "@/components/auth/auth-layout";
import { SocialLoginSection } from "@/components/auth/social-login-buttons";
import { PasswordInput } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

// ============================================================================
// Form State Types
// ============================================================================

interface LoginFormData {
    email: string;
    password: string;
    rememberMe: boolean;
}

interface FormErrors {
    email?: string;
    password?: string;
    general?: string;
}

// ============================================================================
// Login Page Component
// ============================================================================

function LoginInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, loginWithGoogle, loginWithFacebook, isLoading, error, clearError } = useAuth();

    // Form state
    const [formData, setFormData] = React.useState<LoginFormData>({
        email: "",
        password: "",
        rememberMe: false,
    });
    const [errors, setErrors] = React.useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Get redirect URL from query params
    const redirectUrl = searchParams.get("redirect") || "/";

    // Clear auth context error on unmount
    React.useEffect(() => {
        return () => clearError();
    }, [clearError]);

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear field error on change
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await login({
                email: formData.email,
                password: formData.password,
                rememberMe: formData.rememberMe,
            });
            router.push(redirectUrl);
        } catch (err: any) {
            setErrors({ general: err?.message || "Login failed. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = () => {
        clearError();
        loginWithGoogle();
    };

    const handleFacebookLogin = () => {
        clearError();
        loginWithFacebook();
    };

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Sign in to your account to continue"
        >
            {/* Error Alert */}
            {(errors.general || error) && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.general || error}
                    </p>
                </div>
            )}

            {/* Social Login */}
            <SocialLoginSection
                onGoogleClick={handleGoogleLogin}
                onFacebookClick={handleFacebookLogin}
                isLoading={isLoading || isSubmitting}
                size="lg"
            />

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <AuthInput
                    label="Email address"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    icon={<Mail className="h-4 w-4" />}
                    autoComplete="email"
                    disabled={isSubmitting}
                />

                {/* Password */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Password
                        </label>
                        <AuthLink href="/auth/forgot-password">
                            Forgot password?
                        </AuthLink>
                    </div>
                    <PasswordInput
                        id="password"
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                        autoComplete="current-password"
                        disabled={isSubmitting}
                    />
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="rememberMe"
                        checked={formData.rememberMe}
                        onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, rememberMe: checked as boolean }))
                        }
                        disabled={isSubmitting}
                    />
                    <Label
                        htmlFor="rememberMe"
                        className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                    >
                        Remember me for 30 days
                    </Label>
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    disabled={isSubmitting || isLoading}
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
                            Signing in...
                        </>
                    ) : (
                        "Sign in"
                    )}
                </Button>
            </form>

            {/* Register Link */}
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
                Don&apos;t have an account?{" "}
                <AuthLink href="/auth/register">
                    Create one now
                </AuthLink>
            </p>
        </AuthLayout>
    );
}

export default function LoginPage() {
    return (
        <React.Suspense
            fallback={
                <AuthLayout title="Welcome back" subtitle="Sign in to continue." showBackLink>
                    <div className="text-center py-12">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-6" />
                        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                    </div>
                </AuthLayout>
            }
        >
            <LoginInner />
        </React.Suspense>
    );
}
