// ============================================================================
// ADMIN SERVICE - API Communication Layer for Admin Operations
// ============================================================================

import { TokenManager } from './auth-service';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const toFiniteNumberOr = (value: unknown, fallback: number): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

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
    supplier?: string;
    tvBacklightType?: string;
    tvPanelType?: string;
    tvSizeInch?: number;
    stripCount?: string;
    ledCount?: string;
    voltage?: number;
    length?: string;
    rating: number;
    tags: string[];
    images: string[];
    config?: string;
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
    supplier?: string;
    tvBacklightType?: string;
    tvPanelType?: string;
    tvSizeInch?: number;
    stripCount?: string;
    ledCount?: string;
    voltage?: number;
    length?: string;
    rating?: number;
    tags?: string[];
    images?: string[];
    config?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {}

function normalizeAdminProduct(product: AdminProduct): AdminProduct {
    return {
        ...product,
        price: toFiniteNumberOr(product.price, 0),
        salePrice: product.salePrice == null ? undefined : toFiniteNumberOr(product.salePrice, 0),
        purchasePrice: product.purchasePrice == null ? undefined : toFiniteNumberOr(product.purchasePrice, 0),
        stock: toFiniteNumberOr(product.stock, 0),
        tvSizeInch: product.tvSizeInch == null ? undefined : toFiniteNumberOr(product.tvSizeInch, 0),
        voltage: product.voltage == null ? undefined : toFiniteNumberOr(product.voltage, 0),
        rating: toFiniteNumberOr(product.rating, 0),
    };
}

// Order Types
// Allow known statuses + any legacy/unknown statuses from backend.
export type OrderStatus =
    | 'PENDING'
    | 'PICKUP'
    | 'DELIVERED'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'SHIPPED'
    | 'CANCELLED'
    | (string & {});

export type PickupMethod = 'CUSTOMER_PICKUP' | 'COURIER_PICKUP' | (string & {});

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
    pickupMethod?: PickupMethod | null;
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

// Dashboard Overview
export interface DashboardOverviewResponse {
    sales: { day: number; month: number; year: number };
    orderVolume: { successfulDeliveries: number; pendingPickups: number };
    inventoryHealth: {
        lowStockProducts: Array<{
            id?: string;
            title?: string;
            modelName?: string;
            reference?: string;
            stock?: number;
        }>;
    };
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
            modelName?: string;
            reference?: string;
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
        if (filters?.modelName) params.append('modelName', filters.modelName);
        if (filters?.reference) params.append('reference', filters.reference);
        if (filters?.brands?.length) params.append('brands', filters.brands.join(','));
        if (filters?.sizes?.length) params.append('sizes', filters.sizes.join(','));
        if (filters?.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
        if (filters?.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
        if (filters?.inStock !== undefined) params.append('inStock', filters.inStock.toString());

        const raw = await adminFetch<Record<string, unknown>>(`/products?${params.toString()}`);
        // API nests pagination inside a `pagination` object
        const pag = (raw.pagination ?? raw) as Record<string, unknown>;
        return {
            data: (Array.isArray(raw.data) ? raw.data : []).map(normalizeAdminProduct),
            total: Number(pag.total ?? 0) || 0,
            page: Number(pag.page ?? page) || page,
            limit: Number(pag.limit ?? limit) || limit,
            totalPages: Number(pag.totalPages ?? 1) || 1,
        };
    },

    async getProduct(id: string): Promise<AdminProduct> {
        const product = await adminFetch<AdminProduct>(`/products/${id}`);
        return normalizeAdminProduct(product);
    },

    async createProduct(data: CreateProductData): Promise<AdminProduct> {
        const product = await adminFetch<AdminProduct>('/products', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return normalizeAdminProduct(product);
    },

    async updateProduct(id: string, data: UpdateProductData): Promise<AdminProduct> {
        const product = await adminFetch<AdminProduct>(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return normalizeAdminProduct(product);
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
            clientName?: string;
            email?: string;
            phoneNumber?: string;
        }
    ): Promise<PaginatedResponse<AdminOrder>> {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (filters?.status) params.append('status', filters.status);
        if (filters?.userId) params.append('userId', filters.userId);
        if (filters?.clientName) params.append('clientName', filters.clientName);
        if (filters?.email) params.append('email', filters.email);
        if (filters?.phoneNumber) params.append('phoneNumber', filters.phoneNumber);

        return adminFetch<PaginatedResponse<AdminOrder>>(`/orders/admin/all?${params.toString()}`);
    },

    async getOrder(id: string): Promise<AdminOrder> {
        return adminFetch<AdminOrder>(`/orders/admin/${id}`);
    },

    async getOrdersByUser(userId: string): Promise<AdminOrder[]> {
        return adminFetch<AdminOrder[]>(`/orders/admin/user/${userId}`);
    },

    async updateOrderStatus(
        id: string,
        input: { status: OrderStatus; pickupMethod?: PickupMethod | null }
    ): Promise<AdminOrder> {
        return adminFetch<AdminOrder>(`/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify(input),
        });
    },

    // =========================================================================
    // Dashboard
    // =========================================================================

    async getDashboardOverview(filters?: { lowStockThreshold?: number }): Promise<DashboardOverviewResponse> {
        const params = new URLSearchParams();
        if (filters?.lowStockThreshold !== undefined) {
            params.append('lowStockThreshold', String(filters.lowStockThreshold));
        }
        const qs = params.toString();
        return adminFetch<DashboardOverviewResponse>(`/dashboard/overview${qs ? `?${qs}` : ""}`);
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
