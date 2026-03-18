"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CartItem } from "@/services/cart-service";

function formatSoftwarePriceLabel(item: CartItem): string {
  const isBoth = item.fulfillmentMethod === "BOTH";
  const usb = item.physicalUsbPrice;
  const email = item.emailLinksPrice;
  if (isBoth && usb != null && email != null && usb !== email) {
    const min = Math.min(usb, email);
    const max = usb + email;
    return `${min}–${max} TND`;
  }
  if (isBoth && (usb != null || email != null)) {
    const min = usb != null && email != null ? Math.min(usb, email) : (usb ?? email ?? item.price);
    return `From ${min.toFixed(2)} TND`;
  }
  return `${item.price.toFixed(2)} TND`;
}

const FULFILLMENT_LABELS: Record<string, string> = {
  PHYSICAL_USB_WITH_LINKS: "USB stick (64GB)",
  EMAIL_DOWNLOAD_LINKS: "Email links",
  BOTH: "USB + Email (both)",
};

function getSoftwareFulfillmentLabel(item: CartItem): string | null {
  if (item.itemType !== "software") return null;
  if (item.selectedFulfillment && FULFILLMENT_LABELS[item.selectedFulfillment]) {
    return FULFILLMENT_LABELS[item.selectedFulfillment];
  }
  const usb = item.physicalUsbPrice;
  const email = item.emailLinksPrice;
  const eps = 0.01;
  if (usb != null && Math.abs(item.price - usb) < eps && (email == null || Math.abs(item.price - email) >= eps)) {
    return FULFILLMENT_LABELS.PHYSICAL_USB_WITH_LINKS;
  }
  if (email != null && Math.abs(item.price - email) < eps) {
    return FULFILLMENT_LABELS.EMAIL_DOWNLOAD_LINKS;
  }
  if (usb != null && email != null && Math.abs(item.price - (usb + email)) < eps) {
    return FULFILLMENT_LABELS.BOTH;
  }
  if (item.fulfillmentMethod === "PHYSICAL_USB_WITH_LINKS") return FULFILLMENT_LABELS.PHYSICAL_USB_WITH_LINKS;
  if (item.fulfillmentMethod === "EMAIL_DOWNLOAD_LINKS") return FULFILLMENT_LABELS.EMAIL_DOWNLOAD_LINKS;
  if (item.fulfillmentMethod === "BOTH") return formatSoftwarePriceLabel(item);
  if (usb != null || email != null) return formatSoftwarePriceLabel(item);
  return null;
}

export function CartSheet() {
    const router = useRouter();
    const { cart, isCartOpen, setCartOpen, removeFromCart, updateQuantity, cartTotal } = useCart();
    
    const handleProceedToCheckout = () => {
        setCartOpen(false);
        router.push("/checkout");
    };

    return (
        <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
            <SheetContent className="w-full sm:max-w-md bg-white dark:bg-black border-l border-gray-200 dark:border-white/10 text-gray-900 dark:text-white flex flex-col h-full">
                <SheetHeader className="border-b border-gray-200 dark:border-white/10 pb-4">
                    <SheetTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" /> Your Cart
                    </SheetTitle>
                    <SheetDescription className="text-gray-500 dark:text-gray-400">
                        Review your selected items before checkout.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 min-h-0 overflow-y-auto py-4 -mr-2 pr-2">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 space-y-4">
                            <ShoppingBag className="h-16 w-16 opacity-20" />
                            <p>Your cart is empty</p>
                            <Button
                                variant="outline"
                                className="border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                                onClick={() => setCartOpen(false)}
                            >
                                Continue Shopping
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-white/10 space-y-0">
                            {cart.map((item) => {
                                const isSoftware = item.itemType === "software";
                                return (
                                <div key={item.cartItemId || item.id} className={`flex gap-4 py-4 ${isSoftware ? "items-start" : ""}`}>
                                    {!isSoftware && (
                                        <div className="relative h-20 w-20 bg-gray-100 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 flex-shrink-0 overflow-hidden">
                                            <Image
                                                src={item.image}
                                                alt={item.title}
                                                fill
                                                className="object-contain p-2"
                                            />
                                        </div>
                                    )}
                                    <div className={`flex-1 flex flex-col justify-between min-w-0 ${isSoftware ? "space-y-2" : ""}`}>
                                        <div>
                                            <h4 className="font-bold text-sm line-clamp-2 text-gray-900 dark:text-white">{item.title}</h4>
                                            <p className="text-xs font-mono mt-1 text-blue-600 dark:text-blue-400">{item.brand}</p>
                                            {getSoftwareFulfillmentLabel(item) && (
                                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 font-medium">
                                                {getSoftwareFulfillmentLabel(item)}
                                              </p>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 rounded-md border border-gray-200 dark:border-white/10 p-1">
                                                <button
                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded disabled:opacity-30 text-gray-900 dark:text-white"
                                                    onClick={() => {
                                                        if (item.cartItemId) {
                                                            updateQuantity(item.cartItemId, item.quantity - 1);
                                                        }
                                                    }}
                                                    disabled={item.quantity <= 1 || !item.cartItemId}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="text-xs font-bold w-4 text-center text-gray-900 dark:text-white">{item.quantity}</span>
                                                <button
                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded disabled:opacity-30 text-gray-900 dark:text-white"
                                                    onClick={() => {
                                                        if (item.cartItemId) {
                                                            updateQuantity(item.cartItemId, item.quantity + 1);
                                                        }
                                                    }}
                                                    disabled={item.quantity >= item.stock || !item.cartItemId}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                            <div className="text-right flex flex-col items-end justify-between gap-1">
                                                <div className="font-bold text-sm text-gray-900 dark:text-white">{(item.price * item.quantity).toFixed(2)} TND</div>
                                                <button
                                                    className="text-[10px] text-red-500 hover:text-red-400 flex items-center gap-1 mt-1"
                                                    onClick={() => {
                                                        if (item.cartItemId) {
                                                            removeFromCart(item.cartItemId);
                                                        }
                                                    }}
                                                    disabled={!item.cartItemId}
                                                >
                                                    <Trash2 className="h-3 w-3" /> Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-white/10 pt-4 space-y-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                <span>Subtotal</span>
                                <span>{cartTotal.toFixed(2)} TND</span>
                            </div>
                            <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                <span>Shipping</span>
                                <span>Calculated at checkout</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-white/10">
                                <span>Total</span>
                                <span className="text-blue-600 dark:text-blue-400">{cartTotal.toFixed(2)} TND</span>
                            </div>
                        </div>
                        <Button 
                            onClick={handleProceedToCheckout}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 rounded-xl"
                        >
                            Proceed to Checkout
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
