// ============================================================================
// CART SERVICE - Supports both Authenticated and Guest Users
// ============================================================================

import { TokenManager } from './auth-service';
import { GuestSession } from '@/utils/guest-session';

export interface CartItem {
    cartItemId?: string;
    id: string;
    quantity: number;
    price: number;
    title: string;
    image: string;
    brand: string;
    reference: string;
    stock: number;
}

interface BackendCartResponse {
    id: string;
    userId?: string;
    sessionId?: string;
    items: Array<{ quantity: number; productId: string }>;
    itemsWithProducts: Array<{
        quantity: number;
        productId: string;
        product: {
            id: string;
            title: string;
            brand: string;
            reference: string;
            size: number;
            price: number;
            stock: number;
            rating: number;
            images: string[];
            tags: string[];
        };
    }>;
    createdAt: string;
    updatedAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// ============================================================================
// Helper: Get Auth Headers (JWT or Guest Token)
// ============================================================================

async function getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Check for JWT token first (authenticated user)
    const jwtToken = TokenManager.getAccessToken();
    if (jwtToken && !TokenManager.isTokenExpired(jwtToken)) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
        return headers;
    }

    // Fall back to guest token
    const guestToken = await GuestSession.ensureToken();
    if (guestToken) {
        headers['X-Guest-Token'] = guestToken;
    }

    return headers;
}

// ============================================================================
// Helper: Parse Cart Response
// ============================================================================

function parseCartResponse(data: BackendCartResponse | any[]): CartItem[] {
    // Handle itemsWithProducts format
    if (data && !Array.isArray(data) && data.itemsWithProducts && Array.isArray(data.itemsWithProducts)) {
        return data.itemsWithProducts.map(item => ({
            cartItemId: item.productId,
            id: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
            title: item.product.title,
            image: item.product.images?.[0] || '/led-product.png',
            brand: item.product.brand,
            reference: item.product.reference,
            stock: item.product.stock
        }));
    }

    // Handle array response
    if (Array.isArray(data)) {
        return data.map(item => ({
            cartItemId: item.cartItemId || item.productId || item.id,
            id: item.productId || item.id,
            quantity: item.quantity,
            price: item.product?.price || item.price,
            title: item.product?.title || item.title,
            image: item.product?.images?.[0] || item.image || '/led-product.png',
            brand: item.product?.brand || item.brand,
            reference: item.product?.reference || item.reference,
            stock: item.product?.stock || item.stock
        }));
    }

    return [];
}

// ============================================================================
// Cart Service
// ============================================================================

export const CartService = {
    /**
     * Get cart (works for both authenticated and guest users)
     */
    async getCart(): Promise<CartItem[]> {
        try {
            const headers = await getAuthHeaders();
            
            const response = await fetch(`${API_BASE_URL}/cart`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                if (response.status === 404 || response.status === 500) {
                    console.warn(`Cart endpoint returned ${response.status}, returning empty cart`);
                    return [];
                }
                throw new Error(`Failed to fetch cart: ${response.status}`);
            }

            const data = await response.json();
            return parseCartResponse(data);
        } catch (error) {
            console.error("CartService.getCart error:", error);
            return [];
        }
    },

    /**
     * Add item to cart
     */
    async addToCart(item: CartItem): Promise<CartItem[]> {
        try {
            const headers = await getAuthHeaders();
            
            // Check if item already exists
            const currentCart = await CartService.getCart();
            const existingItem = currentCart.find(cartItem => cartItem.id === item.id);

            if (existingItem && existingItem.cartItemId) {
                // Update existing item quantity
                const newQuantity = existingItem.quantity + item.quantity;
                return await CartService.updateQuantity(existingItem.cartItemId, newQuantity);
            }

            // Add new item
            const response = await fetch(`${API_BASE_URL}/cart`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    productId: item.id,
                    quantity: item.quantity
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to add to cart: ${response.status}`);
            }

            return await CartService.getCart();
        } catch (error) {
            console.error("CartService.addToCart error:", error);
            throw error;
        }
    },

    /**
     * Update cart item quantity
     */
    async updateQuantity(cartItemId: string, quantity: number): Promise<CartItem[]> {
        try {
            const headers = await getAuthHeaders();

            const response = await fetch(`${API_BASE_URL}/cart/item/${cartItemId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ quantity })
            });

            if (!response.ok) {
                throw new Error(`Failed to update quantity: ${response.status}`);
            }

            return await CartService.getCart();
        } catch (error) {
            console.error("CartService.updateQuantity error:", error);
            throw error;
        }
    },

    /**
     * Remove item from cart
     */
    async removeFromCart(cartItemId: string): Promise<CartItem[]> {
        try {
            const headers = await getAuthHeaders();

            const response = await fetch(`${API_BASE_URL}/cart/item/${cartItemId}`, {
                method: 'DELETE',
                headers,
            });

            if (!response.ok) {
                throw new Error(`Failed to remove from cart: ${response.status}`);
            }

            return await CartService.getCart();
        } catch (error) {
            console.error("CartService.removeFromCart error:", error);
            throw error;
        }
    },

    /**
     * Clear entire cart
     */
    async clearCart(): Promise<CartItem[]> {
        try {
            const cart = await CartService.getCart();
            await Promise.all(
                cart
                    .filter(item => item.cartItemId)
                    .map(item => CartService.removeFromCart(item.cartItemId!))
            );
            return [];
        } catch (error) {
            console.error("CartService.clearCart error:", error);
            throw error;
        }
    },

    /**
     * Migrate guest cart to user account
     * Called after login/register to merge guest cart with user cart
     */
    async migrateGuestCart(): Promise<void> {
        const guestToken = GuestSession.getToken();
        if (!guestToken) return;

        // The backend handles cart migration during login/register
        // if guestSessionId is provided in the request
        // After successful login, we can clear the guest token
        // The cart context will reload the cart automatically
        
        // Don't clear guest token here - let the auth service handle it
        // during login/register by passing guestSessionId
    },

    /**
     * Get the current guest token (for passing to auth endpoints)
     */
    getGuestToken(): string | null {
        return GuestSession.getToken();
    },

    /**
     * Clear guest token after successful login/register
     */
    clearGuestToken(): void {
        GuestSession.clearToken();
    }
};

export default CartService;
