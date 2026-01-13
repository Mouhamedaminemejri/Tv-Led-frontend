"use client";

// ============================================================================
// FORGOT PASSWORD PAGE - Password Recovery Request
// ============================================================================

import * as React from "react";
import Link from "next/link";
import { Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { AuthLayout, AuthInput, AuthLink } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/services/auth-service";
import { cn } from "@/lib/utils";

// ============================================================================
// Success View Component
// ============================================================================

function EmailSentSuccess({ email, onResend }: { email: string; onResend: () => void }) {
    const [countdown, setCountdown] = React.useState(60);
    const [canResend, setCanResend] = React.useState(false);

    React.useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    const handleResend = () => {
        setCanResend(false);
        setCountdown(60);
        onResend();
    };

    return (
        <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 mb-6">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Check your email
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                We&apos;ve sent password reset instructions to{" "}
                <span className="font-medium text-gray-900 dark:text-white">{email}</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                The link will expire in 1 hour. If you don&apos;t see the email, check your spam folder.
            </p>
            <div className="space-y-3">
                <Link href="/auth/login">
                    <Button
                        variant="outline"
                        className="w-full h-11 border-gray-300 dark:border-white/20"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Login
                    </Button>
                </Link>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Didn&apos;t receive the email?{" "}
                    {canResend ? (
                        <button
                            type="button"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                            onClick={handleResend}
                        >
                            Click to resend
                        </button>
                    ) : (
                        <span className="text-gray-400">
                            Resend in {countdown}s
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
}

// ============================================================================
// Forgot Password Page Component
// ============================================================================

export default function ForgotPasswordPage() {
    const [email, setEmail] = React.useState("");
    const [error, setError] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);

    // Validate email
    const validateEmail = (): boolean => {
        if (!email) {
            setError("Email is required");
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Please enter a valid email address");
            return false;
        }
        return true;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!validateEmail()) return;

        setIsSubmitting(true);
        try {
            await AuthService.forgotPassword({ email });
            setShowSuccess(true);
        } catch (err: any) {
            // Don't reveal if email exists or not for security
            setShowSuccess(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle resend
    const handleResend = async () => {
        try {
            await AuthService.forgotPassword({ email });
        } catch {
            // Silently fail
        }
    };

    // Show success view
    if (showSuccess) {
        return (
            <AuthLayout
                title="Email Sent"
                subtitle=""
                showBackLink={false}
            >
                <EmailSentSuccess email={email} onResend={handleResend} />
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Forgot password?"
            subtitle="No worries, we'll send you reset instructions"
            backLinkHref="/auth/login"
            backLinkText="Back to Login"
        >
            {/* Error Alert */}
            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                <AuthInput
                    label="Email address"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                    }}
                    error={error ? undefined : undefined}
                    icon={<Mail className="h-4 w-4" />}
                    autoComplete="email"
                    disabled={isSubmitting}
                    autoFocus
                />

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
                            Sending...
                        </>
                    ) : (
                        "Send reset link"
                    )}
                </Button>
            </form>

            {/* Back to Login */}
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
                Remember your password?{" "}
                <AuthLink href="/auth/login">Sign in</AuthLink>
            </p>
        </AuthLayout>
    );
}
