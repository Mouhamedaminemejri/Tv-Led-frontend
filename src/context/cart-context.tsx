"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CartService, type CartItem } from "@/services/cart-service";
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
    openCart: () => void; // To open the sheet from anywhere
    isCartOpen: boolean;
    setCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setCartOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch cart from backend on mount
    useEffect(() => {
        setIsMounted(true);
        const loadCart = async () => {
            try {
                setLoading(true);
                const cartData = await CartService.getCart();
                setCart(cartData);
            } catch (error) {
                console.error("Failed to load cart:", error);
                // Don't show error toast on initial load - backend might not be ready
                // Just use empty cart as fallback
                setCart([]);
            } finally {
                setLoading(false);
            }
        };
        loadCart();
    }, []);

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
            addToCart, removeFromCart, updateQuantity, clearCart,
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
