// ============================================================================
// ADMIN SERVICE - API Communication Layer for Admin Operations
// ============================================================================

import { TokenManager } from './auth-service';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// ============================================================================
// Types
// ============================================================================

// Product Types
export interface AdminProduct {
    id: string;
    title: string;
    reference: string;
    brand: string;
    price: number;
    salePrice?: number;
    purchasePrice?: number;
    stock: number;
    description?: string;
    summary?: string;
    supplier?: string;
    size?: number;
    rating: number;
    tags: string[];
    images: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateProductData {
    title: string;
    reference: string;
    brand: string;
    price: number;
    salePrice?: number;
    purchasePrice?: number;
    stock: number;
    description?: string;
    summary?: string;
    supplier?: string;
    size?: number;
    rating?: number;
    tags?: string[];
    images?: string[];
}

export interface UpdateProductData extends Partial<CreateProductData> {}

// Order Types
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: {
        id: string;
        title: string;
        reference: string;
        brand?: string;
        images?: string[];
    };
}

export interface OrderUser {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
}

export interface AdminOrder {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    totalAmount: number;
    paymentMethod: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    billingStreetAddress?: string;
    billingCity?: string;
    billingPostalCode?: string;
    shippingStreetAddress?: string;
    shippingCity?: string;
    shippingPostalCode?: string;
    user?: OrderUser;
    orderItems: OrderItem[];
    createdAt: string;
    updatedAt: string;
}

// User Types
export type UserRole = 'CUSTOMER' | 'ADMIN';
export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'FACEBOOK' | 'APPLE';

export interface AdminUser {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    role: UserRole;
    provider: AuthProvider;
    isActive: boolean;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
    _count?: {
        orders: number;
    };
    cart?: {
        id: string;
        items: Array<{ productId: string; quantity: number }>;
    };
    orders?: AdminOrder[];
}

export interface UpdateUserData {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: UserRole;
    isActive?: boolean;
}

// Pagination
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ============================================================================
// Helper: Admin Auth Fetch
// ============================================================================

async function adminFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = TokenManager.getAccessToken();
    
    if (!token) {
        throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        },
    });

    if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
    }

    if (response.status === 403) {
        throw new Error('Access denied. Admin privileges required.');
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(error.message || `Request failed with status ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return undefined as T;
    }

    return response.json();
}

// ============================================================================
// Admin Service
// ============================================================================

export const AdminService = {
    // =========================================================================
    // Products
    // =========================================================================

    async getProducts(
        page = 1,
        limit = 20,
        filters?: {
            search?: string;
            brands?: string[];
            sizes?: number[];
            minPrice?: number;
            maxPrice?: number;
            inStock?: boolean;
        }
    ): Promise<PaginatedResponse<AdminProduct>> {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (filters?.search) params.append('search', filters.search);
        if (filters?.brands?.length) params.append('brands', filters.brands.join(','));
        if (filters?.sizes?.length) params.append('sizes', filters.sizes.join(','));
        if (filters?.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
        if (filters?.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
        if (filters?.inStock !== undefined) params.append('inStock', filters.inStock.toString());

        return adminFetch<PaginatedResponse<AdminProduct>>(`/products?${params.toString()}`);
    },

    async getProduct(id: string): Promise<AdminProduct> {
        return adminFetch<AdminProduct>(`/products/${id}`);
    },

    async createProduct(data: CreateProductData): Promise<AdminProduct> {
        return adminFetch<AdminProduct>('/products', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateProduct(id: string, data: UpdateProductData): Promise<AdminProduct> {
        return adminFetch<AdminProduct>(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteProduct(id: string): Promise<void> {
        return adminFetch<void>(`/products/${id}`, {
            method: 'DELETE',
        });
    },

    async bulkDeleteProducts(ids: string[]): Promise<{ deletedCount: number; failedIds: string[]; message: string }> {
        return adminFetch('/products/bulk', {
            method: 'DELETE',
            body: JSON.stringify({ ids }),
        });
    },

    // =========================================================================
    // Orders
    // =========================================================================

    async getOrders(
        page = 1,
        limit = 20,
        filters?: {
            status?: OrderStatus;
            userId?: string;
        }
    ): Promise<PaginatedResponse<AdminOrder>> {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (filters?.status) params.append('status', filters.status);
        if (filters?.userId) params.append('userId', filters.userId);

        return adminFetch<PaginatedResponse<AdminOrder>>(`/orders/admin/all?${params.toString()}`);
    },

    async getOrder(id: string): Promise<AdminOrder> {
        return adminFetch<AdminOrder>(`/orders/admin/${id}`);
    },

    async getOrdersByUser(userId: string): Promise<AdminOrder[]> {
        return adminFetch<AdminOrder[]>(`/orders/admin/user/${userId}`);
    },

    async updateOrderStatus(id: string, status: OrderStatus): Promise<AdminOrder> {
        return adminFetch<AdminOrder>(`/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    },

    // =========================================================================
    // Users
    // =========================================================================

    async getUsers(
        page = 1,
        limit = 20,
        filters?: {
            role?: UserRole;
            isActive?: boolean;
        }
    ): Promise<PaginatedResponse<AdminUser>> {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (filters?.role) params.append('role', filters.role);
        if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

        return adminFetch<PaginatedResponse<AdminUser>>(`/auth/admin/users?${params.toString()}`);
    },

    async getUser(id: string): Promise<AdminUser> {
        return adminFetch<AdminUser>(`/auth/admin/users/${id}`);
    },

    async updateUser(id: string, data: UpdateUserData): Promise<AdminUser> {
        return adminFetch<AdminUser>(`/auth/admin/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async updateUserStatus(id: string, isActive: boolean): Promise<AdminUser> {
        return adminFetch<AdminUser>(`/auth/admin/users/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ isActive }),
        });
    },

    // =========================================================================
    // Admin Check
    // =========================================================================

    async verifyAdminAccess(): Promise<{ message: string; user: { id: string; email: string; role: string } }> {
        return adminFetch('/auth/admin');
    },
};

export default AdminService;
