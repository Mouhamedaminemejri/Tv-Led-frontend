"use client";

// ============================================================================
// OAUTH CALLBACK PAGE - Handle OAuth Provider Redirects
// ============================================================================

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, XCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ============================================================================
// OAuth Callback Page Component
// ============================================================================

export default function OAuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { handleOAuthCallback } = useAuth();

    const [status, setStatus] = React.useState<"processing" | "error">("processing");
    const [errorMessage, setErrorMessage] = React.useState("");
    const hasProcessed = React.useRef(false);

    React.useEffect(() => {
        if (hasProcessed.current) return;

        const processCallback = async () => {
            // Check for error first
            const error = searchParams.get("error");
            if (error) {
                setStatus("error");
                setErrorMessage(
                    error === "access_denied"
                        ? "You cancelled the login process."
                        : searchParams.get("error_description") || "Authentication failed. Please try again."
                );
                return;
            }

            // Also check hash params (some OAuth providers return tokens in hash)
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const allParams = new URLSearchParams([
                ...searchParams.entries(),
                ...hashParams.entries(),
            ]);

            // Check for access token (direct token response)
            const hasToken = allParams.get("access_token") || allParams.get("token");
            
            if (!hasToken) {
                setStatus("error");
                setErrorMessage("Invalid callback parameters. Please try again.");
                return;
            }

            try {
                await handleOAuthCallback(allParams);
                // The auth context will redirect to home on success
            } catch (err: any) {
                setStatus("error");
                setErrorMessage(err?.message || "Authentication failed. Please try again.");
            }
        };

        hasProcessed.current = true;
        processCallback();
    }, [searchParams, handleOAuthCallback, router]);

    if (status === "error") {
        return (
            <AuthLayout
                title="Authentication Error"
                subtitle=""
                showBackLink={false}
            >
                <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 mb-6">
                        <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Authentication failed
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {errorMessage}
                    </p>
                    <div className="space-y-3">
                        <Link href="/auth/login">
                            <Button
                                className={cn(
                                    "w-full h-12 text-base font-semibold",
                                    "bg-gray-900 dark:bg-white text-white dark:text-black",
                                    "hover:bg-gray-800 dark:hover:bg-gray-100"
                                )}
                            >
                                Try again
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button
                                variant="outline"
                                className="w-full h-11 border-gray-300 dark:border-white/20"
                            >
                                Go to Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Signing you in..."
            subtitle=""
            showBackLink={false}
        >
            <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-6" />
                <p className="text-gray-600 dark:text-gray-400">
                    Please wait while we complete your sign in...
                </p>
            </div>
        </AuthLayout>
    );
}
