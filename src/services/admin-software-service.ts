// ============================================================================
// ADMIN SOFTWARE SERVICE - CRUD for Software Products (admin auth required)
// ============================================================================

import { TokenManager } from './auth-service';
import type {
  SoftwareProduct,
  FirmwareType,
  FulfillmentMethod,
} from './software-product-service';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function adminFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = TokenManager.getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please log in.');
  }
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
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
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export interface PaginatedSoftwareResponse {
  data: SoftwareProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateSoftwareData {
  title: string;
  brand: string;
  reference: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  firmwareType: FirmwareType;
  compatibleModels: string[];
  fileSize?: string | null;
  version?: string | null;
  summary?: string | null;
  description?: string | null;
  tags?: string[];
  images?: string[];
  chassis?: string | null;
  chipset?: string | null;
  volume?: string | null;
  downloadUrl?: string | null;
  isBundle?: boolean | null;
  bundleChassisCount?: number | null;
  includesPhysicalDelivery?: boolean | null;
  includesYearlyUpdates?: boolean | null;
  sources?: string[] | null;
  fulfillmentMethod?: FulfillmentMethod | null;
  physicalUsbPrice?: number | null;
  emailLinksPrice?: number | null;
  storageCapacityGb?: number | null;
  numberOfLinks?: number | null;
  productNumber?: string | null;
  hasFreeShipping?: boolean;
}

export type UpdateSoftwareData = Partial<CreateSoftwareData>;

export const AdminSoftwareService = {
  async getProducts(
    page = 1,
    limit = 20,
    filters?: {
      search?: string;
      brands?: string[];
      models?: string;
      reference?: string;
      type?: FirmwareType | string;
      inStock?: boolean;
    }
  ): Promise<PaginatedSoftwareResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filters?.search) params.append('search', filters.search);
    if (filters?.brands?.length) params.append('brands', filters.brands.join(','));
    if (filters?.models) params.append('models', filters.models);
    if (filters?.reference) params.append('reference', filters.reference);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.inStock !== undefined) params.append('inStock', filters.inStock.toString());

    const raw = await adminFetch<Record<string, unknown>>(`/software?${params.toString()}`);
    const items = Array.isArray(raw.data) ? raw.data : Array.isArray((raw as { products?: unknown[] }).products) ? (raw as { products: unknown[] }).products : [];
    const pag = (raw.pagination ?? raw) as Record<string, unknown>;
    return {
      data: items as SoftwareProduct[],
      total: Number(pag.total ?? items.length) || 0,
      page: Number(pag.page ?? page) || page,
      limit: Number(pag.limit ?? limit) || limit,
      totalPages: Number(pag.totalPages ?? 1) || 1,
    };
  },

  async getProduct(id: string): Promise<SoftwareProduct> {
    return adminFetch<SoftwareProduct>(`/software/${id}`);
  },

  async createProduct(data: CreateSoftwareData): Promise<SoftwareProduct> {
    return adminFetch<SoftwareProduct>('/software', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProduct(id: string, data: UpdateSoftwareData): Promise<SoftwareProduct> {
    return adminFetch<SoftwareProduct>(`/software/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteProduct(id: string): Promise<void> {
    return adminFetch<void>(`/software/${id}`, { method: 'DELETE' });
  },

  async bulkDeleteProducts(ids: string[]): Promise<{ deletedCount: number; failedIds: string[]; message: string }> {
    return adminFetch('/software/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
  },
};
