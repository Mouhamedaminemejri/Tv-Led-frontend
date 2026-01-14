"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { CartService, type CartItem } from "@/services/cart-service";
import { GuestSession } from "@/utils/guest-session";
import { toast } from "sonner";

interface CartContextType {
    cart: CartItem[];
    cartCount: number;
    cartTotal: number;
    loading: boolean;
    addToCart: (item: CartItem) => Promise<void>;
    removeFromCart: (cartItemId: string) => Promise<void>;
    updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>; // Refresh cart after auth changes
    openCart: () => void;
    isCartOpen: boolean;
    setCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setCartOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load cart function (reusable)
    const loadCart = useCallback(async () => {
        try {
            setLoading(true);
            const cartData = await CartService.getCart();
            setCart(cartData);
        } catch (error) {
            console.error("Failed to load cart:", error);
            setCart([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initialize guest session and fetch cart on mount
    useEffect(() => {
        setIsMounted(true);
        const initialize = async () => {
            // Ensure guest token exists (for non-authenticated users)
            await GuestSession.initialize();
            // Load cart
            await loadCart();
        };
        initialize();
    }, [loadCart]);

    // Listen for auth state changes to refresh cart
    useEffect(() => {
        const handleAuthChange = () => {
            loadCart();
        };

        // Listen for custom auth events
        window.addEventListener('auth:login', handleAuthChange);
        window.addEventListener('auth:logout', handleAuthChange);
        window.addEventListener('auth:register', handleAuthChange);

        return () => {
            window.removeEventListener('auth:login', handleAuthChange);
            window.removeEventListener('auth:logout', handleAuthChange);
            window.removeEventListener('auth:register', handleAuthChange);
        };
    }, [loadCart]);

    // Refresh cart (called after login/logout)
    const refreshCart = useCallback(async () => {
        await loadCart();
    }, [loadCart]);

    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const addToCart = async (item: CartItem) => {
        try {
            const newCart = await CartService.addToCart(item);
            setCart(newCart);
            toast.success(`Added ${item.title} to cart`);
        } catch (error) {
            console.error("Failed to add to cart:", error);
            toast.error("Failed to add item to cart");
        }
    };

    const removeFromCart = async (cartItemId: string) => {
        try {
            const newCart = await CartService.removeFromCart(cartItemId);
            setCart(newCart);
            toast.info("Item removed from cart");
        } catch (error) {
            console.error("Failed to remove from cart:", error);
            toast.error("Failed to remove item from cart");
        }
    };

    const updateQuantity = async (cartItemId: string, quantity: number) => {
        try {
            const newCart = await CartService.updateQuantity(cartItemId, quantity);
            setCart(newCart);
        } catch (error) {
            console.error("Failed to update quantity:", error);
            toast.error("Failed to update quantity");
        }
    };

    const clearCart = async () => {
        try {
            await CartService.clearCart();
            setCart([]);
            toast.info("Cart cleared");
        } catch (error) {
            console.error("Failed to clear cart:", error);
            toast.error("Failed to clear cart");
        }
    };

    const openCart = () => setCartOpen(true);

    // Prevent hydration mismatch by returning null until mounted, or just rendering children (but Context needs state)
    // Actually Context provider doesn't render blocking UI, so it's fine.
    // However, if we used localStorage immediately in initial state, it would cause hydration error.
    // We used useEffect to set initial state, so initial render matched server (empty).

    return (
        <CartContext.Provider value={{
            cart, cartCount, cartTotal, loading,
            addToCart, removeFromCart, updateQuantity, clearCart, refreshCart,
            openCart, isCartOpen, setCartOpen
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
