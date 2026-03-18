"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, MonitorPlay, Usb, ExternalLink, Tag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { SoftwareSidebar, type SoftwareFilterState, type SoftwareFacetGroups } from "@/components/software-sidebar";
import { Footer } from "@/components/footer";
import { LedsBreadcrumb, type BreadcrumbItem } from "@/components/leds/leds-breadcrumb";
import {
  SoftwareProductService,
  type SoftwareProduct,
  type SoftwareFilterData,
  type FirmwareType,
} from "@/services/software-product-service";
import { AddToCartDialog } from "@/components/add-to-cart-dialog";

const FIRMWARE_LABELS: Record<string, string> = {
  update: "Update",
  usb: "USB",
  recovery: "Recovery",
  chassis_pack: "Chassis Pack",
};

function formatSoftwarePrice(product: SoftwareProduct): string {
  const isBoth = (product.fulfillmentMethod || "").toUpperCase() === "BOTH";
  const usb = product.physicalUsbPrice;
  const email = product.emailLinksPrice;
  if (isBoth && usb != null && email != null && usb !== email) {
    const min = Math.min(usb, email);
    const max = usb + email;
    return `${min.toFixed(2)}–${max.toFixed(2)}`;
  }
  if (isBoth && (usb != null || email != null)) {
    const min = usb != null && email != null ? Math.min(usb, email) : (usb ?? email ?? product.price);
    return `From ${min.toFixed(2)}`;
  }
  return product.price.toFixed(2);
}

export default function SoftwarePage() {
  return (
    <React.Suspense
      fallback={
        <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
          <div className="container mx-auto px-4 py-12 text-center text-gray-600 dark:text-gray-400">
            Loading software...
          </div>
        </main>
      }
    >
      <SoftwarePageInner />
    </React.Suspense>
  );
}

function SoftwarePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [products, setProducts] = React.useState<SoftwareProduct[]>([]);
  const [filterData, setFilterData] = React.useState<SoftwareFilterData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pagination, setPagination] = React.useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);

  const [filters, setFilters] = React.useState<SoftwareFilterState>({
    manufacturers: [],
    firmwareTypes: [],
    availability: "all",
    search: "",
  });

  const q = searchParams.get("q") ?? "";
  const brandToAdd = searchParams.get("brand");
  const modelParam = searchParams.get("model");

  React.useEffect(() => {
    setFilters((prev) => (prev.search === q ? prev : { ...prev, search: q }));
  }, [q]);

  React.useEffect(() => {
    if (!brandToAdd) return;
    const canonical = filterData.find((x) => (x.brand || "").trim().toLowerCase() === brandToAdd.trim().toLowerCase());
    const brand = canonical?.brand ?? brandToAdd;
    setFilters((prev) => ({
      ...prev,
      manufacturers: prev.manufacturers.includes(brand) ? prev.manufacturers : [...prev.manufacturers, brand],
      search: "",
    }));
  }, [brandToAdd, filterData]);

  React.useEffect(() => {
    if (modelParam) setFilters((prev) => ({ ...prev, search: modelParam }));
  }, [modelParam]);

  const [sortOption, setSortOption] = React.useState("relevance");
  const loadingRef = React.useRef(false);
  const ITEMS_PER_PAGE = 10;

  React.useEffect(() => {
    SoftwareProductService.getFilterData()
      .then((data) => {
        setFilterData(data);
      })
      .catch(() => {});
  }, []);

  // If filter-data endpoint is unavailable, derive from products when they load
  React.useEffect(() => {
    if (filterData.length > 0) return;
    if (products.length === 0) return;
    const derived: SoftwareFilterData[] = products.map((p) => ({
      id: p.id,
      brand: p.brand,
      price: p.price,
      stock: p.stock,
      tags: p.tags ?? [],
      firmwareType: p.firmwareType,
      compatibleModels: p.compatibleModels ?? [],
    }));
    setFilterData(derived);
  }, [products, filterData.length]);

  React.useEffect(() => {
    if (loadingRef.current) return;
    let isMounted = true;
    loadingRef.current = true;

    const load = async () => {
      setLoading(true);
      try {
        const filterParams: Parameters<typeof SoftwareProductService.getPaginated>[2] = {};
        if (filters.manufacturers.length) filterParams.brands = filters.manufacturers;
        if (filters.firmwareTypes.length) filterParams.type = filters.firmwareTypes[0]; // API accepts single type
        if (filters.availability === "instock") filterParams.inStock = true;
        if (filters.search) filterParams.search = filters.search;

        const res = await SoftwareProductService.getPaginated(
          currentPage,
          ITEMS_PER_PAGE,
          filterParams
        );
        if (!isMounted) return;
        setProducts(res.data);
        setPagination(res.pagination);
        setError(null);
      } catch (err) {
        console.error("Error loading software:", err);
        if (!isMounted) return;
        setError("Failed to load software. Please try again.");
        setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
        loadingRef.current = false;
      }
    };

    load();
    return () => {
      isMounted = false;
      loadingRef.current = false;
    };
  }, [
    currentPage,
    filters.manufacturers,
    filters.firmwareTypes,
    filters.availability,
    filters.search,
  ]);

  const facets = React.useMemo((): SoftwareFacetGroups => {
    if (!filterData.length)
      return { manufacturers: [], firmwareTypes: [] };

    const allBrands = new Set(filterData.map((x) => x.brand));

    const manufacturerCounts: Record<string, number> = {};
    allBrands.forEach((brand) => {
      const count = filterData.filter((x) => {
        if (filters.firmwareTypes.length && !filters.firmwareTypes.includes(x.firmwareType)) return false;
        if (filters.availability === "instock" && x.stock === 0) return false;
        return x.brand === brand;
      }).length;
      manufacturerCounts[brand] = count;
    });

    const typeCounts: Record<string, number> = {};
    (["update", "usb", "recovery", "chassis_pack"] as const).forEach((ft) => {
      const count = filterData.filter((x) => {
        if (filters.manufacturers.length && !filters.manufacturers.includes(x.brand)) return false;
        if (filters.availability === "instock" && x.stock === 0) return false;
        return x.firmwareType === ft;
      }).length;
      typeCounts[ft] = count;
    });

    const manufacturers = Array.from(allBrands).map((b) => ({
      id: b.toLowerCase().replace(/\s+/g, "-"),
      label: b,
      count: manufacturerCounts[b] ?? 0,
    }));

    const firmwareTypes = (["update", "usb", "recovery", "chassis_pack"] as const).map((id) => ({
      id,
      label: FIRMWARE_LABELS[id],
      count: typeCounts[id] ?? 0,
    }));

    return { manufacturers, firmwareTypes };
  }, [filterData, filters]);

  const sortedProducts = React.useMemo(() => {
    const list = [...products];
    if (sortOption === "price-asc") return list.sort((a, b) => a.price - b.price);
    if (sortOption === "price-desc") return list.sort((a, b) => b.price - a.price);
    return list;
  }, [products, sortOption]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters.manufacturers, filters.firmwareTypes, filters.availability, filters.search]);

  const totalCount = pagination?.total ?? sortedProducts.length;

  const filterLabel = React.useMemo(() => {
    const parts: string[] = [];
    if (filters.manufacturers.length)
      parts.push(filters.manufacturers.length <= 2 ? filters.manufacturers.join(" & ") : `${filters.manufacturers[0]} +${filters.manufacturers.length - 1}`);
    if (filters.firmwareTypes.length)
      parts.push(filters.firmwareTypes.map((t) => FIRMWARE_LABELS[t]).join(", "));
    if (filters.search) parts.push(`"${filters.search}"`);
    const hasActive = parts.length > 0 || filters.availability === "instock";
    const suffix = [parts.join(" "), "TV Software & Firmware"].filter(Boolean).join(" ");
    const full = filters.availability === "instock" ? `${suffix} (In stock)` : suffix;
    return { fullLabel: full, hasActiveFilter: hasActive };
  }, [filters]);

  const breadcrumbItems = React.useMemo<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = [{ label: "Home", href: "/" }];
    if (filterLabel.hasActiveFilter) {
      items.push({ label: "Software", href: "/software" });
      items.push({ label: `${filterLabel.fullLabel} (${totalCount})` });
    } else {
      items.push({ label: `TV Software & Firmware (${totalCount})` });
    }
    return items;
  }, [filterLabel, totalCount]);

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="container mx-auto px-4 pt-2 pb-8">
        <LedsBreadcrumb items={breadcrumbItems} />

        <div className="flex flex-col lg:flex-row gap-8">
          {!loading && products.length > 0 && (
            <SoftwareSidebar filters={filters} setFilters={setFilters} facets={facets} />
          )}

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {filterLabel.fullLabel}{" "}
                <span className="text-gray-600 dark:text-gray-400 text-lg font-normal">
                  ({pagination?.total ?? sortedProducts.length} Products)
                </span>
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                Sort by:
                <select
                  className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium cursor-pointer border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Loading software...</p>
              </div>
            ) : sortedProducts.length === 0 && pagination?.total === 0 ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                <MonitorPlay className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg">No software found.</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  No products match your filters.
                </p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => {
                    setFilters({
                      manufacturers: [],
                      firmwareTypes: [],
                      availability: "all",
                      search: "",
                    });
                    router.replace(pathname, { scroll: false });
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                <p className="text-gray-600 dark:text-gray-400">No products available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedProducts.map((product) => {
                  const hasUsb = product.includesPhysicalDelivery || (product.physicalUsbPrice != null && product.physicalUsbPrice > 0);
                  const hasVersion = product.version?.trim();
                  const hasVolume = product.volume?.trim();
                  const hasDirectLink = !!product.downloadUrl?.trim();
                  return (
                    <div
                      key={product.id}
                      className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-none overflow-hidden hover-draw-border hover-draw-border-gray transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <Link href={`/software/${product.id}`} className="block">
                        <div className="relative aspect-square bg-gray-100 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                          <Image
                            src={product.images?.[0] || "/file.svg"}
                            alt={product.title}
                            fill
                            className="object-contain p-4"
                          />
                          <div className="absolute top-2 left-2">
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm w-fit">
                              {FIRMWARE_LABELS[product.firmwareType] || product.firmwareType}
                            </span>
                          </div>
                          {product.stock === 0 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white font-bold uppercase text-xs">Out of stock</span>
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="p-3 text-center">
                        <Link href={`/software/${product.id}`} className="block">
                          <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-snug line-clamp-2 min-h-[2.5rem]">
                            {product.title}
                          </h3>
                        </Link>
                        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 bg-gray-50/50 dark:bg-white/5">
                            {product.brand} • {product.reference}
                          </span>
                          {hasVersion && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-900/10">
                              <Tag className="h-3 w-3" />
                              v{product.version}
                            </span>
                          )}
                          {hasUsb && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-300 bg-green-50/50 dark:bg-green-900/10">
                              <Usb className="h-3 w-3" />
                              {(product.storageCapacityGb ?? 64)}GB USB
                            </span>
                          )}
                          {hasVolume && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-900/10">
                              Vol. {product.volume}
                            </span>
                          )}
                          {hasDirectLink && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border border-violet-200 dark:border-violet-800/50 text-violet-700 dark:text-violet-300 bg-violet-50/50 dark:bg-violet-900/10">
                              <ExternalLink className="h-3 w-3" />
                              Direct link
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-lg font-extrabold text-gray-900 dark:text-white">
                          {formatSoftwarePrice(product)}{" "}
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">TND</span>
                        </div>
                        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                          {product.stock > 0 ? (
                            <AddToCartDialog product={product}>
                              <Button className="w-full rounded-none bg-green-700 hover:bg-green-600 text-white font-semibold">
                                Add to cart
                              </Button>
                            </AddToCartDialog>
                          ) : (
                            <Button disabled className="w-full rounded-none bg-green-700 text-white font-semibold opacity-50">
                              Add to cart
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={!pagination.hasNext || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
