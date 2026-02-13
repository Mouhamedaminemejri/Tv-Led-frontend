"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    XCircle,
    Loader2,
    RefreshCw,
    Home,
    MessageCircle,
    ShieldAlert,
    ArrowLeft,
    AlertTriangle,
} from "lucide-react";
import { TokenManager } from "@/services/auth-service";
import { GuestSession } from "@/utils/guest-session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function CheckoutFailPage() {
    return (
        <React.Suspense
            fallback={
                <main className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                    </div>
                </main>
            }
        >
            <FailInner />
        </React.Suspense>
    );
}

function FailInner() {
    const searchParams = useSearchParams();

    const orderId = searchParams.get("orderId") || "";
    const gateway = searchParams.get("gateway") || "";
    const reason = searchParams.get("reason") || "unknown";

    const [retrying, setRetrying] = React.useState(false);
    const [retryUrl, setRetryUrl] = React.useState<string | null>(null);
    const [retryError, setRetryError] = React.useState<string | null>(null);

    const resolvedOrderId = orderId || (typeof window !== "undefined" ? sessionStorage.getItem("checkout_order_id") || "" : "");

    const reasonMessages: Record<string, { title: string; description: string }> = {
        failed: {
            title: "Payment Failed",
            description: "Your payment could not be processed. This may be due to insufficient funds, card restrictions, or a temporary issue.",
        },
        expired: {
            title: "Payment Expired",
            description: "Your payment session has expired. Please try again to complete your purchase.",
        },
        cancelled: {
            title: "Payment Cancelled",
            description: "You cancelled the payment. Your order has not been charged.",
        },
        unknown: {
            title: "Payment Unsuccessful",
            description: "Something went wrong with your payment. Please try again or contact support.",
        },
    };

    const { title, description } = reasonMessages[reason] || reasonMessages.unknown;

    // Retry payment — re-fetch the payment URL from the status endpoint
    const handleRetry = async () => {
        if (!resolvedOrderId) return;

        setRetrying(true);
        setRetryError(null);

        try {
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            const jwt = TokenManager.getAccessToken();
            if (jwt && !TokenManager.isTokenExpired(jwt)) {
                headers["Authorization"] = `Bearer ${jwt}`;
            } else {
                try {
                    const guestToken = await GuestSession.ensureToken();
                    headers["X-Guest-Token"] = guestToken;
                } catch { /* ignore */ }
            }

            const res = await fetch(
                `${API_BASE_URL}/checkout/payment/status?orderId=${encodeURIComponent(resolvedOrderId)}`,
                { headers }
            );

            if (!res.ok) {
                throw new Error(`Failed to check payment status: ${res.status}`);
            }

            const data = await res.json();

            if (data.paymentUrl) {
                setRetryUrl(data.paymentUrl);
                // Auto-redirect after a brief moment
                setTimeout(() => {
                    window.location.href = data.paymentUrl;
                }, 500);
            } else if (data.paymentStatus === "SUCCESS") {
                // Payment actually succeeded (webhook processed while user was on fail page)
                window.location.href = `/checkout/success?orderId=${resolvedOrderId}&gateway=${gateway}`;
            } else {
                setRetryError("Unable to retrieve a new payment link. Please place a new order.");
            }
        } catch (err) {
            console.error("Retry failed:", err);
            setRetryError(err instanceof Error ? err.message : "Failed to retry payment");
        } finally {
            setRetrying(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
            <div className="container mx-auto px-4 py-12 max-w-2xl">
                {/* Fail Icon */}
                <div className="text-center mb-8">
                    <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
                        <div className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse" style={{ animationDuration: "2s" }} />
                        <div className="relative w-20 h-20 rounded-full bg-red-500 flex items-center justify-center">
                            <XCircle className="h-10 w-10 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                        {title}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        {description}
                    </p>
                </div>

                {/* Error Details */}
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">What happened?</p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {reason === "failed" && "The payment gateway reported a failed transaction. Your account has not been charged."}
                            {reason === "expired" && "The payment session timed out before completion. No charges were made."}
                            {reason === "cancelled" && "The payment was cancelled by user action. No charges were made."}
                            {reason === "unknown" && "An unexpected error occurred during payment processing. If you were charged, it will be automatically refunded."}
                        </p>
                    </div>
                </div>

                {/* Security Notice */}
                <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <ShieldAlert className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        No payment was collected. Your financial information is secure and was not stored.
                        {gateway === "konnect" && " Transaction processed by Konnect payment gateway with PCI DSS compliance."}
                    </p>
                </div>

                {/* Retry Section */}
                {resolvedOrderId && (
                    <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-xl p-6 mb-6 shadow-sm">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-blue-500" />
                            Try Again
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Your order is still reserved. You can retry the payment without having to re-enter your information.
                        </p>

                        {retryError && (
                            <div className="p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                                {retryError}
                            </div>
                        )}

                        {retryUrl && (
                            <div className="p-3 mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Redirecting to payment gateway...
                            </div>
                        )}

                        <Button
                            onClick={handleRetry}
                            disabled={retrying || !!retryUrl}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                        >
                            {retrying ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Retrying...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Retry Payment
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/leds" className="flex-1">
                        <Button variant="outline" className="w-full border-gray-200 dark:border-white/10">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Continue Shopping
                        </Button>
                    </Link>
                    <Link href="/" className="flex-1">
                        <Button variant="outline" className="w-full border-gray-200 dark:border-white/10">
                            <Home className="h-4 w-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>

                {/* Support */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Need help?</p>
                    <Link href="/contact" className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        <MessageCircle className="h-4 w-4" />
                        Contact Support
                    </Link>
                </div>
            </div>
        </main>
    );
}
