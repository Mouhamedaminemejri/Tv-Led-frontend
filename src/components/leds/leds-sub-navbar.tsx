"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingCart, CreditCard, ChevronDown } from "lucide-react";
import { useLedsStickyActions } from "@/components/leds/leds-sticky-actions-context";
import { ProductService } from "@/services/product-service";
import { cn } from "@/lib/utils";

// ── Brand colors for avatar fallback ─────────────────────────────────────────

const BRAND_COLORS: Record<string, string> = {
  SAMSUNG: "from-blue-600 to-blue-800",
  LG: "from-red-600 to-red-800",
  SONY: "from-gray-800 to-black",
  PHILIPS: "from-blue-500 to-indigo-700",
  HISENSE: "from-green-600 to-green-800",
  XIAOMI: "from-orange-500 to-orange-700",
  KIVI: "from-purple-600 to-purple-800",
  TCL: "from-cyan-600 to-cyan-800",
  PANASONIC: "from-blue-700 to-blue-900",
  SHARP: "from-red-700 to-red-900",
};

function getBrandGradient(brand: string) {
  return BRAND_COLORS[brand.toUpperCase()] ?? "from-gray-600 to-gray-800";
}

interface BrandInfo {
  name: string;
  count: number;
  image: string | null;
}

const NAV_TABS = [
  { key: "led", label: "LED Backlights", href: "/leds", hasDropdown: true },
  { key: "software", label: "TV Software & Firmware", href: "/software", hasDropdown: false },
  { key: "repair", label: "Repair Services", href: "#repair", hasDropdown: false },
  { key: "marketplace", label: "TV Marketplace", href: "#marketplace", hasDropdown: false },
  { key: "components", label: "TV Components", href: "#components", hasDropdown: false },
] as const;

export function LedsSubNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state: stickyState } = useLedsStickyActions();

  // Brand data for LED dropdown
  const [brands, setBrands] = React.useState<BrandInfo[]>([]);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const closeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    Promise.all([
      ProductService.getFilterData(),
      ProductService.getPaginatedProducts(1, 100, {}).then(r => r.products).catch(() => []),
    ]).then(([filterData, products]) => {
      const brandCounts: Record<string, number> = {};
      const brandImages: Record<string, string | null> = {};

      for (const item of filterData) {
        const b = item.brand?.trim();
        if (b) brandCounts[b] = (brandCounts[b] || 0) + 1;
      }

      for (const p of products) {
        const b = p.brand?.trim();
        if (b && !brandImages[b] && p.images?.[0]) {
          brandImages[b] = p.images[0];
        }
      }

      const sorted = Object.entries(brandCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([name, count]) => ({ name, count, image: brandImages[name] ?? null }));

      setBrands(sorted);
    }).catch(() => {});
  }, []);

  const handleEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setDropdownOpen(true);
  };

  const handleLeave = () => {
    closeTimerRef.current = setTimeout(() => setDropdownOpen(false), 200);
  };

  const handleBrandClick = (brandName: string) => {
    setDropdownOpen(false);
    router.push(`/leds?brand=${encodeURIComponent(brandName)}`);
  };

  const megaBrands = brands.slice(0, 12);

  return (
    <header className="sticky top-16 z-40 bg-white dark:bg-black border-b border-gray-100 dark:border-white/5">
      <div className="container mx-auto px-4 h-16 flex items-center">
        {/* LED tab with dropdown — sits outside the scrolling nav to avoid overflow clipping */}
        <div
          className="relative flex-shrink-0"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <Link
            href="/leds"
            className={cn(
              "flex items-center gap-1 text-sm whitespace-nowrap py-3 transition-colors",
              pathname.startsWith("/leds")
                ? "text-gray-900 dark:text-white font-semibold"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
            )}
          >
            LED Backlights
            <ChevronDown className={cn(
              "h-3.5 w-3.5 transition-transform",
              dropdownOpen && "rotate-180"
            )} />
          </Link>

          {/* Brand dropdown */}
          {dropdownOpen && megaBrands.length > 0 && (
            <div
              className="absolute top-full left-0 pt-1 z-50"
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
            >
              <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl dark:shadow-2xl p-4 min-w-[560px]">
                <div className="grid grid-cols-3 gap-2.5">
                  {megaBrands.map((brand) => (
                    <button
                      key={brand.name}
                      onClick={() => handleBrandClick(brand.name)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left group"
                    >
                      <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                        {brand.image ? (
                          <Image
                            src={brand.image}
                            alt={brand.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className={cn(
                            "w-full h-full flex items-center justify-center bg-gradient-to-br text-white font-bold text-xs",
                            getBrandGradient(brand.name)
                          )}>
                            {brand.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {brand.name}
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500">
                          {brand.count} products
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {brands.length > 12 && (
                  <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-white/5 text-center">
                    <Link
                      href="/leds"
                      onClick={() => setDropdownOpen(false)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      View all {brands.length} brands →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Other category tabs */}
        <nav className="flex items-center gap-7 ml-7">
          {NAV_TABS.filter(t => !t.hasDropdown).map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                "text-sm whitespace-nowrap py-3 transition-colors font-medium",
                (tab.key === "software" && pathname.startsWith("/software"))
                  ? "text-gray-900 dark:text-white font-semibold"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sticky buttons */}
        {stickyState.show && (stickyState.onAddToCart || stickyState.onBuyNow) && (
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              className="bg-green-700 hover:bg-green-600 text-white h-7 text-xs px-3"
              onClick={stickyState.onAddToCart ?? undefined}
              disabled={!stickyState.onAddToCart}
            >
              <ShoppingCart className="h-3.5 w-3.5 mr-1" />
              Add to cart
            </Button>
            <Button
              size="sm"
              className="bg-green-700 hover:bg-green-600 text-white h-7 text-xs px-3"
              onClick={stickyState.onBuyNow ?? undefined}
              disabled={!stickyState.onBuyNow}
            >
              <CreditCard className="h-3.5 w-3.5 mr-1" />
              Buy now
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
