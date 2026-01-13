export interface CartItem {
    cartItemId?: string; // Backend cart item ID (for updates/deletes) - might be same as productId
    id: string; // Product ID
    quantity: number;
    price: number;
    title: string;
    image: string;
    brand: string;
    reference: string;
    stock: number;
}

// Backend response structure
interface BackendCartResponse {
    id: string;
    userId: string;
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

const API_BASE_URL = "http://localhost:3001/api";
import { getUserId } from "@/utils/user-id";

// Backend Cart Service
export const CartService = {
    // Get user's cart from backend
    async getCart(): Promise<CartItem[]> {
        try {
            const userId = getUserId();
            const response = await fetch(`${API_BASE_URL}/cart?userId=${userId}`);

            if (!response.ok) {
                // If cart doesn't exist yet (404) or server error (500), return empty array
                // This allows the app to work even if backend cart endpoint isn't ready
                if (response.status === 404 || response.status === 500) {
                    console.warn(`Cart endpoint returned ${response.status}, returning empty cart`);
                    return [];
                }
                throw new Error(`Failed to fetch cart: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as BackendCartResponse;
            
            // Map backend response to CartItem format
            if (data.itemsWithProducts && Array.isArray(data.itemsWithProducts)) {
                return data.itemsWithProducts.map(item => ({
                    cartItemId: item.productId, // Use productId as cartItemId for now (backend might need to provide separate ID)
                    id: item.product.id,
                    quantity: item.quantity,
                    price: item.product.price,
                    title: item.product.title,
                    image: item.product.images && item.product.images.length > 0 
                        ? item.product.images[0] 
                        : '/led-product.png',
                    brand: item.product.brand,
                    reference: item.product.reference,
                    stock: item.product.stock
                }));
            }
            
            // Fallback: handle array response (if backend returns array directly)
            if (Array.isArray(data)) {
                return (data as any[]).map(item => ({
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
        } catch (error) {
            console.error("CartService.getCart error:", error);
            // Return empty array on error (fallback) - allows app to work offline
            return [];
        }
    },

    // Add item to cart via backend
    async addToCart(item: CartItem): Promise<CartItem[]> {
        try {
            const userId = getUserId();
            
            // Check if item already exists in cart
            const currentCart = await CartService.getCart();
            const existingItem = currentCart.find(cartItem => cartItem.id === item.id);
            
            if (existingItem && existingItem.cartItemId) {
                // Item exists, update quantity instead
                const newQuantity = existingItem.quantity + item.quantity;
                return await CartService.updateQuantity(existingItem.cartItemId, newQuantity);
            } else {
                // New item, add to cart
                const response = await fetch(`${API_BASE_URL}/cart`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: userId,
                        productId: item.id,
                        quantity: item.quantity
                    })
                });

                if (!response.ok) {
                    // Throw error so context can show toast
                    throw new Error(`Failed to add to cart: ${response.status} ${response.statusText}`);
                }

                // After adding, fetch updated cart
                return await CartService.getCart();
            }
        } catch (error) {
            console.error("CartService.addToCart error:", error);
            // Re-throw so context can handle it and show error toast
            throw error;
        }
    },

    // Update cart item quantity via backend
    async updateQuantity(cartItemId: string, quantity: number): Promise<CartItem[]> {
        try {
            const userId = getUserId();
            const response = await fetch(`${API_BASE_URL}/cart/item/${cartItemId}?userId=${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    quantity: quantity
                })
            });

            if (!response.ok) {
                // Throw error so context can show toast
                throw new Error(`Failed to update quantity: ${response.status} ${response.statusText}`);
            }

            // After updating, fetch updated cart
            return await CartService.getCart();
        } catch (error) {
            console.error("CartService.updateQuantity error:", error);
            // Re-throw so context can handle it and show error toast
            throw error;
        }
    },

    // Remove item from cart via backend
    async removeFromCart(cartItemId: string): Promise<CartItem[]> {
        try {
            const userId = getUserId();
            const response = await fetch(`${API_BASE_URL}/cart/item/${cartItemId}?userId=${userId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                // Throw error so context can show toast
                throw new Error(`Failed to remove from cart: ${response.status} ${response.statusText}`);
            }

            // After removing, fetch updated cart
            return await CartService.getCart();
        } catch (error) {
            console.error("CartService.removeFromCart error:", error);
            // Re-throw so context can handle it and show error toast
            throw error;
        }
    },

    // Clear cart (remove all items)
    async clearCart(): Promise<CartItem[]> {
        try {
            const cart = await CartService.getCart();
            // Remove all items one by one
            await Promise.all(
                cart.map(item => {
                    if (item.cartItemId) {
                        return CartService.removeFromCart(item.cartItemId);
                    }
                    return Promise.resolve();
                })
            );
            return [];
        } catch (error) {
            console.error("CartService.clearCart error:", error);
            throw error;
        }
    }
};
