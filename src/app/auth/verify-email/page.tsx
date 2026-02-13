"use client";

// ============================================================================
// VERIFY EMAIL PAGE - Email Verification Handler
// ============================================================================

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/services/auth-service";
import { cn } from "@/lib/utils";

// ============================================================================
// Verification Status Types
// ============================================================================

type VerificationStatus = "verifying" | "success" | "error" | "expired";

// ============================================================================
// Success View
// ============================================================================

function VerificationSuccess() {
    return (
        <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 mb-6">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Email verified!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your email has been successfully verified. You can now access all features of your account.
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
// Error View
// ============================================================================

function VerificationError({ message, onResend }: { message: string; onResend: () => void }) {
    const [isResending, setIsResending] = React.useState(false);
    const [resendSuccess, setResendSuccess] = React.useState(false);

    const handleResend = async () => {
        setIsResending(true);
        try {
            await onResend();
            setResendSuccess(true);
        } catch {
            // Silently fail
        } finally {
            setIsResending(false);
        }
    };

    if (resendSuccess) {
        return (
            <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-500/20 mb-6">
                    <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    New link sent!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    We&apos;ve sent a new verification link to your email address. Please check your inbox.
                </p>
                <Link href="/auth/login">
                    <Button
                        variant="outline"
                        className="w-full h-11 border-gray-300 dark:border-white/20"
                    >
                        Back to Login
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 mb-6">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Verification failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                {message}
            </p>
            <div className="space-y-3">
                <Button
                    onClick={handleResend}
                    disabled={isResending}
                    className={cn(
                        "w-full h-12 text-base font-semibold",
                        "bg-gray-900 dark:bg-white text-white dark:text-black",
                        "hover:bg-gray-800 dark:hover:bg-gray-100"
                    )}
                >
                    {isResending ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Sending...
                        </>
                    ) : (
                        "Resend verification email"
                    )}
                </Button>
                <Link href="/auth/login">
                    <Button
                        variant="outline"
                        className="w-full h-11 border-gray-300 dark:border-white/20"
                    >
                        Back to Login
                    </Button>
                </Link>
            </div>
        </div>
    );
}

// ============================================================================
// Verifying View (Loading)
// ============================================================================

function VerifyingView() {
    return (
        <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-6" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Verifying your email...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
                Please wait while we verify your email address.
            </p>
        </div>
    );
}

// ============================================================================
// Verify Email Page Component
// ============================================================================

function VerifyEmailInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const [status, setStatus] = React.useState<VerificationStatus>("verifying");
    const [errorMessage, setErrorMessage] = React.useState("");
    const hasVerified = React.useRef(false);

    // Verify email on mount
    React.useEffect(() => {
        if (hasVerified.current) return;

        const verifyEmail = async () => {
            if (!token) {
                setStatus("error");
                setErrorMessage("Invalid verification link. Please request a new one.");
                return;
            }

            try {
                await AuthService.verifyEmail({ token });
                setStatus("success");
            } catch (err: any) {
                setStatus("error");
                if (err?.code === "TOKEN_EXPIRED") {
                    setErrorMessage("This verification link has expired. Please request a new one.");
                } else if (err?.code === "ALREADY_VERIFIED") {
                    setStatus("success");
                } else {
                    setErrorMessage(err?.message || "Failed to verify email. Please try again.");
                }
            }
        };

        hasVerified.current = true;
        verifyEmail();
    }, [token]);

    // Handle resend verification
    const handleResend = async () => {
        if (!email) return;
        await AuthService.resendVerification({ email });
    };

    // Get the appropriate view based on status
    const getView = () => {
        switch (status) {
            case "verifying":
                return <VerifyingView />;
            case "success":
                return <VerificationSuccess />;
            case "error":
            case "expired":
                return <VerificationError message={errorMessage} onResend={handleResend} />;
            default:
                return <VerifyingView />;
        }
    };

    return (
        <AuthLayout
            title="Email Verification"
            subtitle=""
            showBackLink={false}
        >
            {getView()}
        </AuthLayout>
    );
}

export default function VerifyEmailPage() {
    return (
        <React.Suspense
            fallback={
                <AuthLayout title="Verifying your email..." subtitle="" showBackLink={false}>
                    <div className="text-center py-12">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-6" />
                        <p className="text-gray-600 dark:text-gray-400">Please wait...</p>
                    </div>
                </AuthLayout>
            }
        >
            <VerifyEmailInner />
        </React.Suspense>
    );
}
