"use client";

// ============================================================================
// REGISTER PAGE - New Account Creation
// ============================================================================

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, User, Phone, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { AuthLayout, AuthInput, AuthLink } from "@/components/auth/auth-layout";
import { SocialLoginSection } from "@/components/auth/social-login-buttons";
import { PasswordInput, PasswordStrengthBar, calculatePasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

// ============================================================================
// Form State Types
// ============================================================================

interface RegisterFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
    subscribeNewsletter: boolean;
}

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    acceptTerms?: string;
    general?: string;
}

// ============================================================================
// Success View Component
// ============================================================================

function RegistrationSuccess({ email }: { email: string }) {
    return (
        <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 mb-6">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Check your email
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                We&apos;ve sent a verification link to{" "}
                <span className="font-medium text-gray-900 dark:text-white">{email}</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Click the link in the email to verify your account and complete registration.
            </p>
            <div className="space-y-3">
                <Link href="/auth/login">
                    <Button
                        variant="outline"
                        className="w-full h-11 border-gray-300 dark:border-white/20"
                    >
                        Back to Login
                    </Button>
                </Link>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Didn&apos;t receive the email?{" "}
                    <button
                        type="button"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={() => {
                            // TODO: Implement resend verification
                        }}
                    >
                        Click to resend
                    </button>
                </p>
            </div>
        </div>
    );
}

// ============================================================================
// Register Page Component
// ============================================================================

export default function RegisterPage() {
    const router = useRouter();
    const { register, loginWithGoogle, loginWithFacebook, isLoading, error, clearError } = useAuth();

    // Form state
    const [formData, setFormData] = React.useState<RegisterFormData>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        acceptTerms: false,
        subscribeNewsletter: false,
    });
    const [errors, setErrors] = React.useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);

    // Clear auth context error on unmount
    React.useEffect(() => {
        return () => clearError();
    }, [clearError]);

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = "First name is required";
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = "Last name is required";
        }

        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (formData.phone && !/^\+?[\d\s-]{8,}$/.test(formData.phone)) {
            newErrors.phone = "Please enter a valid phone number";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else {
            const strength = calculatePasswordStrength(formData.password);
            if (strength.score < 2) {
                newErrors.password = "Password is too weak";
            }
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        if (!formData.acceptTerms) {
            newErrors.acceptTerms = "You must accept the terms and conditions";
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
            const result = await register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone || undefined,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                acceptTerms: formData.acceptTerms,
                subscribeNewsletter: formData.subscribeNewsletter,
            });

            if (result.requiresVerification) {
                setShowSuccess(true);
            } else {
                router.push("/");
            }
        } catch (err: any) {
            setErrors({ general: err?.message || "Registration failed. Please try again." });
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

    // Show success view after registration
    if (showSuccess) {
        return (
            <AuthLayout
                title="Registration Successful"
                subtitle=""
                showBackLink={false}
            >
                <RegistrationSuccess email={formData.email} />
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Create an account"
            subtitle="Join thousands of TV repair professionals"
            maxWidth="lg"
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

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AuthInput
                        label="First name"
                        type="text"
                        name="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleChange}
                        error={errors.firstName}
                        icon={<User className="h-4 w-4" />}
                        autoComplete="given-name"
                        disabled={isSubmitting}
                    />
                    <AuthInput
                        label="Last name"
                        type="text"
                        name="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleChange}
                        error={errors.lastName}
                        autoComplete="family-name"
                        disabled={isSubmitting}
                    />
                </div>

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

                {/* Phone (Optional) */}
                <AuthInput
                    label="Phone number (optional)"
                    type="tel"
                    name="phone"
                    placeholder="+216 XX XXX XXX"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    icon={<Phone className="h-4 w-4" />}
                    autoComplete="tel"
                    disabled={isSubmitting}
                />

                {/* Password */}
                <div className="space-y-1.5">
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Password
                    </label>
                    <PasswordInput
                        id="password"
                        name="password"
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                        showStrength
                        autoComplete="new-password"
                        disabled={isSubmitting}
                    />
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                    <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Confirm password
                    </label>
                    <PasswordInput
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        error={errors.confirmPassword}
                        autoComplete="new-password"
                        disabled={isSubmitting}
                    />
                </div>

                {/* Terms & Newsletter */}
                <div className="space-y-3">
                    <div className="flex items-start gap-2">
                        <Checkbox
                            id="acceptTerms"
                            checked={formData.acceptTerms}
                            onCheckedChange={(checked) =>
                                setFormData((prev) => ({ ...prev, acceptTerms: checked as boolean }))
                            }
                            disabled={isSubmitting}
                            className="mt-0.5"
                        />
                        <div>
                            <Label
                                htmlFor="acceptTerms"
                                className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                            >
                                I agree to the{" "}
                                <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                                    Terms of Service
                                </Link>{" "}
                                and{" "}
                                <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                                    Privacy Policy
                                </Link>
                            </Label>
                            {errors.acceptTerms && (
                                <p className="text-xs text-red-500 mt-1">{errors.acceptTerms}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="subscribeNewsletter"
                            checked={formData.subscribeNewsletter}
                            onCheckedChange={(checked) =>
                                setFormData((prev) => ({ ...prev, subscribeNewsletter: checked as boolean }))
                            }
                            disabled={isSubmitting}
                        />
                        <Label
                            htmlFor="subscribeNewsletter"
                            className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                        >
                            Send me news, offers, and product updates
                        </Label>
                    </div>
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
                            Creating account...
                        </>
                    ) : (
                        "Create account"
                    )}
                </Button>
            </form>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
                Already have an account?{" "}
                <AuthLink href="/auth/login">
                    Sign in
                </AuthLink>
            </p>
        </AuthLayout>
    );
}
