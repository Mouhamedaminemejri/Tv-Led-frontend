// TV Software & Firmware product types and service
// Backend API: GET /api/software/*

export type FirmwareType = "update" | "usb" | "recovery" | "chassis_pack";

export type FulfillmentMethod =
  | "PHYSICAL_USB_WITH_LINKS"
  | "EMAIL_DOWNLOAD_LINKS"
  | "BOTH";

export type SoftwareFulfillmentChoice =
  | "PHYSICAL_USB_WITH_LINKS"
  | "EMAIL_DOWNLOAD_LINKS"
  | "BOTH";

export interface SoftwareProduct {
  id: string;
  title: string;
  brand: string;
  reference: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  images?: string[];
  tags: string[];
  firmwareType: FirmwareType;
  compatibleModels: string[];
  fileSize?: string | null;
  version?: string | null;
  summary?: string | null;
  description?: string | null;
  rating?: number;
  // Chassis-pack schema
  chassis?: string | null;
  chipset?: string | null;
  volume?: string | null;
  downloadUrl?: string | null;
  isBundle?: boolean | null;
  bundleChassisCount?: number | null;
  includesPhysicalDelivery?: boolean | null;
  includesYearlyUpdates?: boolean | null;
  sources?: string[] | null;
  // Fulfillment & dual pricing
  fulfillmentMethod?: FulfillmentMethod | null;
  physicalUsbPrice?: number | null;
  emailLinksPrice?: number | null;
  storageCapacityGb?: number | null;
  numberOfLinks?: number | null;
  totalFiles?: number | null;
  productNumber?: string | null;
  hasFreeShipping?: boolean;
  /** SKU (backend may use suk or productNumber) */
  suk?: string | null;
}

export interface SoftwareFilterData {
  id: string;
  brand: string;
  price: number;
  stock: number;
  tags: string[];
  firmwareType: FirmwareType;
  compatibleModels: string[];
}

export interface PaginatedSoftwareResponse {
  data: SoftwareProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SoftwareSearchSuggestionsResponse {
  brands: string[];
  references: string[];
  models: string[];
  products?: Array<{
    id: string;
    title: string;
    reference: string;
    brand: string;
    price: number | string;
    salePrice?: number | string | null;
    stock: number | string;
    image?: string | null;
    matchedBy?: string[] | null;
  }>;
}

// Use relative path so Next.js rewrites proxy to backend (avoids CORS)
const API_BASE = typeof window !== "undefined" ? "/api" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api");

const toFiniteNumberOr = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

function normalizeProduct(p: SoftwareProduct): SoftwareProduct {
  return {
    ...p,
    price: toFiniteNumberOr(p.price, 0),
    salePrice: p.salePrice == null ? null : toFiniteNumberOr(p.salePrice, 0),
    stock: toFiniteNumberOr(p.stock, 0),
    compatibleModels: Array.isArray(p.compatibleModels) ? p.compatibleModels : [],
    tags: Array.isArray(p.tags) ? p.tags : [],
    sources: Array.isArray(p.sources) ? p.sources : p.sources ?? null,
    bundleChassisCount: p.bundleChassisCount == null ? null : toFiniteNumberOr(p.bundleChassisCount, 0),
    physicalUsbPrice: p.physicalUsbPrice == null ? null : toFiniteNumberOr(p.physicalUsbPrice, 0),
    emailLinksPrice: p.emailLinksPrice == null ? null : toFiniteNumberOr(p.emailLinksPrice, 0),
    storageCapacityGb: p.storageCapacityGb == null ? null : toFiniteNumberOr(p.storageCapacityGb, 0),
    numberOfLinks: p.numberOfLinks == null ? null : toFiniteNumberOr(p.numberOfLinks, 0),
  };
}

export interface FulfillmentOption {
  value: SoftwareFulfillmentChoice;
  label: string;
}

export interface FulfillmentOptionsResponse {
  options: FulfillmentOption[];
}

export const SoftwareProductService = {
  async getFilterData(): Promise<SoftwareFilterData[]> {
    try {
      const res = await fetch(`${API_BASE}/software/filter-data`);
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error(`Failed to fetch filter data: ${res.status}`);
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn("SoftwareProductService.getFilterData:", err);
      return [];
    }
  },

  async getPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: {
      brands?: string[];
      models?: string;
      reference?: string;
      type?: FirmwareType | string;
      inStock?: boolean;
      search?: string;
    }
  ): Promise<PaginatedSoftwareResponse> {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (filters?.brands?.length) params.set("brands", filters.brands.join(","));
    if (filters?.models) params.set("models", filters.models);
    if (filters?.reference) params.set("reference", filters.reference);
    if (filters?.type) params.set("type", filters.type);
    if (filters?.inStock !== undefined) params.set("inStock", String(filters.inStock));
    if (filters?.search) params.set("search", filters.search);

    const res = await fetch(`${API_BASE}/software?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch software: ${res.status}`);
    }
    const data = await res.json();

    const items = Array.isArray(data.data) ? data.data : Array.isArray(data.products) ? data.products : [];
    return {
      data: items.map((p: SoftwareProduct) => normalizeProduct(p)),
      pagination: data.pagination ?? {
        page,
        limit,
        total: items.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: page > 1,
      },
    };
  },

  async getById(id: string): Promise<SoftwareProduct> {
    const res = await fetch(`${API_BASE}/software/${id}`);
    if (!res.ok) {
      throw new Error(`Software not found: ${res.status}`);
    }
    const data = await res.json();
    return normalizeProduct(data);
  },

  async getFulfillmentOptions(): Promise<FulfillmentOptionsResponse> {
    try {
      const res = await fetch(`${API_BASE}/software/fulfillment-options`);
      if (!res.ok) {
        if (res.status === 404) {
          return {
            options: [
              { value: "PHYSICAL_USB_WITH_LINKS", label: "64GB USB stick with download links" },
              { value: "EMAIL_DOWNLOAD_LINKS", label: "Links sent by email after payment" },
              { value: "BOTH", label: "Both (2 separate items: USB + email links, each at its own price)" },
            ],
          };
        }
        throw new Error(`Failed to fetch fulfillment options: ${res.status}`);
      }
      const data = await res.json();
      return {
        options: Array.isArray(data.options) ? data.options : [],
      };
    } catch (err) {
      console.warn("SoftwareProductService.getFulfillmentOptions:", err);
      return {
        options: [
          { value: "PHYSICAL_USB_WITH_LINKS", label: "64GB USB stick with download links" },
          { value: "EMAIL_DOWNLOAD_LINKS", label: "Links sent by email after payment" },
          { value: "BOTH", label: "Both (2 separate items: USB + email links, each at its own price)" },
        ],
      };
    }
  },

  async getSearchSuggestions(query: string, limit: number = 10): Promise<SoftwareSearchSuggestionsResponse> {
    try {
      const res = await fetch(
        `${API_BASE}/software/search-suggestions?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      if (!res.ok) {
        if (res.status === 404) return { brands: [], references: [], models: [], products: [] };
        throw new Error(`Search failed: ${res.status}`);
      }
      const data = await res.json();
      return {
        brands: Array.isArray(data.brands) ? data.brands : [],
        references: Array.isArray(data.references) ? data.references : [],
        models: Array.isArray(data.models) ? data.models : [],
        products: Array.isArray(data.products) ? data.products : [],
      };
    } catch (err) {
      console.warn("SoftwareProductService.getSearchSuggestions:", err);
      return { brands: [], references: [], models: [], products: [] };
    }
  },
};
