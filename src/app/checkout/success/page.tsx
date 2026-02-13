"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    Loader2,
    Clock,
    ShieldCheck,
    Package,
    ArrowRight,
    Home,
    Copy,
    Check,
} from "lucide-react";
import { TokenManager } from "@/services/auth-service";
import { GuestSession } from "@/utils/guest-session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED" | "UNKNOWN";
type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface StatusData {
    paymentStatus: PaymentStatus;
    orderStatus: OrderStatus;
    paymentUrl?: string;
    orderNumber?: string;
}

export default function CheckoutSuccessPage() {
    return (
        <React.Suspense
            fallback={
                <main className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                        <p className="text-gray-600 dark:text-gray-400">Verifying payment...</p>
                    </div>
                </main>
            }
        >
            <SuccessInner />
        </React.Suspense>
    );
}

function SuccessInner() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const orderId = searchParams.get("orderId") || "";
    const gateway = searchParams.get("gateway") || "";
    const method = searchParams.get("method") || "";
    const orderNumberParam = searchParams.get("orderNumber") || "";

    // Recover from sessionStorage if URL params are missing
    const resolvedOrderId = orderId || (typeof window !== "undefined" ? sessionStorage.getItem("checkout_order_id") || "" : "");
    const resolvedOrderNumber = orderNumberParam || (typeof window !== "undefined" ? sessionStorage.getItem("checkout_order_number") || "" : "");

    const [status, setStatus] = React.useState<StatusData | null>(null);
    const [polling, setPolling] = React.useState(true);
    const [pollCount, setPollCount] = React.useState(0);
    const [copied, setCopied] = React.useState(false);

    const isCOD = method === "cod";
    const isKonnect = gateway === "konnect" || (!isCOD && !method);

    const MAX_POLLS = 30; // ~60 seconds at 2s intervals
    const POLL_INTERVAL = 2000;

    // Build auth headers
    const getHeaders = React.useCallback(async (): Promise<Record<string, string>> => {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        const jwt = TokenManager.getAccessToken();
        if (jwt && !TokenManager.isTokenExpired(jwt)) {
            headers["Authorization"] = `Bearer ${jwt}`;
        } else {
            try {
                const guestToken = await GuestSession.ensureToken();
                headers["X-Guest-Token"] = guestToken;
            } catch { /* fallback: no auth */ }
        }
        return headers;
    }, []);

    // Poll payment status
    React.useEffect(() => {
        if (isCOD) {
            // Cash on delivery — no polling needed, it's confirmed
            setStatus({
                paymentStatus: "SUCCESS",
                orderStatus: "CONFIRMED",
                orderNumber: resolvedOrderNumber,
            });
            setPolling(false);
            return;
        }

        if (!resolvedOrderId) {
            setPolling(false);
            return;
        }

        let timeoutId: ReturnType<typeof setTimeout>;
        let cancelled = false;

        const poll = async () => {
            if (cancelled) return;

            try {
                const headers = await getHeaders();
                const res = await fetch(
                    `${API_BASE_URL}/checkout/payment/status?orderId=${encodeURIComponent(resolvedOrderId)}`,
                    { headers }
                );

                if (!res.ok) {
                    throw new Error(`Status check failed: ${res.status}`);
                }

                const data: StatusData = await res.json();
                setStatus(data);

                const isFinal = data.paymentStatus === "SUCCESS" || data.paymentStatus === "FAILED" || data.paymentStatus === "EXPIRED";

                if (isFinal) {
                    setPolling(false);
                    // If payment failed, redirect to fail page
                    if (data.paymentStatus === "FAILED" || data.paymentStatus === "EXPIRED") {
                        router.replace(`/checkout/fail?orderId=${resolvedOrderId}&gateway=${gateway}&reason=${data.paymentStatus.toLowerCase()}`);
                    }
                    // Clean up sessionStorage
                    try {
                        sessionStorage.removeItem("checkout_order_id");
                        sessionStorage.removeItem("checkout_order_number");
                        sessionStorage.removeItem("checkout_payment_method");
                        sessionStorage.removeItem("checkout_total");
                    } catch { /* ignore */ }
                    return;
                }

                setPollCount(prev => {
                    const next = prev + 1;
                    if (next >= MAX_POLLS) {
                        setPolling(false);
                        return next;
                    }
                    return next;
                });

            } catch (err) {
                console.error("Payment status poll error:", err);
                setPollCount(prev => prev + 1);
            }

            if (!cancelled && pollCount < MAX_POLLS) {
                timeoutId = setTimeout(poll, POLL_INTERVAL);
            }
        };

        // Start polling after a short delay (webhook might already have processed)
        timeoutId = setTimeout(poll, 1000);

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resolvedOrderId, isCOD, gateway]);

    const handleCopyOrderNumber = () => {
        const num = status?.orderNumber || resolvedOrderNumber;
        if (num) {
            navigator.clipboard.writeText(num);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const displayOrderNumber = status?.orderNumber || resolvedOrderNumber;
    const paymentConfirmed = status?.paymentStatus === "SUCCESS";
    const stillPending = polling || status?.paymentStatus === "PENDING";

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
            <div className="container mx-auto px-4 py-12 max-w-2xl">
                {/* Success Animation / Status */}
                <div className="text-center mb-8">
                    {paymentConfirmed ? (
                        <>
                            <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
                                <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
                                <div className="relative w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
                                    <CheckCircle2 className="h-10 w-10 text-white" />
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                                Payment Successful!
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Your order has been confirmed and is being processed.
                            </p>
                        </>
                    ) : stillPending ? (
                        <>
                            <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
                                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse" />
                                <div className="relative w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center">
                                    <Clock className="h-10 w-10 text-white animate-pulse" />
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                                Verifying Payment...
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                We&apos;re confirming your payment with the gateway. This usually takes a few seconds.
                            </p>
                            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Checking status ({pollCount}/{MAX_POLLS})...</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
                                <div className="relative w-20 h-20 rounded-full bg-yellow-500 flex items-center justify-center">
                                    <Clock className="h-10 w-10 text-white" />
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                                Payment Processing
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Your payment is still being processed. You&apos;ll receive a confirmation email once it&apos;s complete.
                            </p>
                        </>
                    )}
                </div>

                {/* Order Details Card */}
                <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-xl p-6 mb-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-500" />
                        Order Details
                    </h2>

                    <div className="space-y-3">
                        {displayOrderNumber && (
                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/5">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Order Number</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-mono font-semibold">{displayOrderNumber}</span>
                                    <button
                                        onClick={handleCopyOrderNumber}
                                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                        title="Copy order number"
                                    >
                                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-400" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/5">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Payment Status</span>
                            <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${
                                paymentConfirmed
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                    : stillPending
                                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                            }`}>
                                {paymentConfirmed ? "Confirmed" : stillPending ? "Verifying..." : "Processing"}
                            </span>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/5">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Order Status</span>
                            <span className="text-sm font-medium">
                                {status?.orderStatus === "CONFIRMED" ? "Confirmed" : status?.orderStatus || "Pending"}
                            </span>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Payment Method</span>
                            <span className="text-sm font-medium">
                                {isCOD ? "Cash on Delivery" : isKonnect ? "Konnect (Mobile)" : "Online Payment"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Security Badge */}
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">Secure Transaction</p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                            This transaction was processed with 256-bit SSL encryption.
                            {isKonnect && " Payment verified by Konnect payment gateway."}
                        </p>
                    </div>
                </div>

                {/* What's Next */}
                {paymentConfirmed && (
                    <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-xl p-6 mb-6 shadow-sm">
                        <h3 className="font-semibold mb-3">What happens next?</h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">1</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Confirmation Email</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">You&apos;ll receive an email with your order details shortly.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">2</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Order Processing</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Our team will prepare your order for shipping.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">3</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Delivery</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Your order will be delivered to your shipping address.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/account/orders" className="flex-1">
                        <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                            <Package className="h-4 w-4 mr-2" />
                            View My Orders
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                    <Link href="/" className="flex-1">
                        <Button variant="outline" className="w-full border-gray-200 dark:border-white/10">
                            <Home className="h-4 w-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </main>
    );
}
