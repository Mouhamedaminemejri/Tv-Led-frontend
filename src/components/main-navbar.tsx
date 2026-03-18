"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Tv, Sun, Moon, Monitor, ShoppingCart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchAutocomplete } from "@/components/search-autocomplete";
import { UserMenu } from "@/components/user-menu";
import { useTheme } from "@/context/theme-context";
import { useCart } from "@/context/cart-context";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  };

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      className="h-9 px-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
      title={`Theme: ${theme}`}
      aria-label="Toggle theme"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

function CartButton() {
  const { cartCount, cartTotal, openCart } = useCart();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={openCart}
      className="h-9 px-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 relative"
      aria-label="Open cart"
    >
      <ShoppingCart className="h-4 w-4" />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
          {cartCount}
        </span>
      )}
      <span className="hidden lg:inline ml-2 text-sm font-semibold text-gray-900 dark:text-white">
        {cartTotal.toFixed(2)} TND
      </span>
    </Button>
  );
}

export function MainNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Local search state (does not update URL on every keystroke)
  const [searchQuery, setSearchQuery] = React.useState("");

  // Don't show the global navbar on routes that have their own dedicated layout.
  if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/60 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl flex-shrink-0">
          <div className="h-8 w-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Tv className="h-5 w-5 text-white" />
          </div>
          <span className="hidden sm:inline bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
            TunisiaTVRepair
          </span>
        </Link>

        {/* Search Bar — center, takes available space */}
        <div className="flex-1 hidden md:flex justify-center">
          <div className="w-full max-w-xl">
            <SearchAutocomplete
              value={searchQuery}
              searchTarget={pathname.startsWith("/software") ? "software" : "led"}
              onChange={(value) => {
                setSearchQuery(value);
                if (!value.trim()) {
                  if (pathname.startsWith("/leds") || pathname.startsWith("/software")) {
                    router.replace(pathname, { scroll: false });
                  }
                }
              }}
              onSelect={(value, type, product, ctx) => {
                const target = ctx?.searchTarget ?? (pathname.startsWith("/software") ? "software" : "led");
                const basePath = target === "software" ? "/software" : "/leds";
                if (type === "product" && product?.id) {
                  router.push(`${basePath}/${product.id}`);
                  setSearchQuery("");
                  return;
                }
                const p = new URLSearchParams();
                if (type === "brand") {
                  p.set("brand", value);
                } else if (target === "software" && (type === "model" || type === "reference")) {
                  p.set("model", value);
                } else {
                  p.set("q", value);
                }
                router.push(`${basePath}?${p.toString()}`);
                setSearchQuery("");
              }}
              onSubmit={(value) => {
                const target = pathname.startsWith("/software") ? "software" : "led";
                const basePath = target === "software" ? "/software" : "/leds";
                const p = new URLSearchParams();
                p.set("q", value);
                router.push(`${basePath}?${p.toString()}`);
                setSearchQuery("");
              }}
              placeholder="Search by TV Model, Part Number, or Brand..."
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <ThemeToggle />
          <CartButton />
          <UserMenu />

          <Button
            variant="ghost"
            size="sm"
            className="md:hidden h-9 px-2"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile: search + menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-white/10 bg-white/90 dark:bg-black/80 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-3 space-y-3">
            {/* Mobile search */}
            <SearchAutocomplete
              value={searchQuery}
              searchTarget={pathname.startsWith("/software") ? "software" : "led"}
              onChange={setSearchQuery}
              onSelect={(value, type, product, ctx) => {
                const target = ctx?.searchTarget ?? (pathname.startsWith("/software") ? "software" : "led");
                const basePath = target === "software" ? "/software" : "/leds";
                if (type === "product" && product?.id) {
                  router.push(`${basePath}/${product.id}`);
                  setSearchQuery("");
                  setMobileOpen(false);
                  return;
                }
                const p = new URLSearchParams();
                if (type === "brand") p.set("brand", value);
                else if (target === "software" && (type === "model" || type === "reference")) p.set("model", value);
                else p.set("q", value);
                router.push(`${basePath}?${p.toString()}`);
                setSearchQuery("");
                setMobileOpen(false);
              }}
              onSubmit={(value) => {
                const target = pathname.startsWith("/software") ? "software" : "led";
                const basePath = target === "software" ? "/software" : "/leds";
                router.push(`${basePath}?q=${encodeURIComponent(value)}`);
                setSearchQuery("");
                setMobileOpen(false);
              }}
              placeholder="Search..."
            />
            <nav className="flex flex-col gap-1 text-sm font-medium">
              <Link href="/" onClick={() => setMobileOpen(false)} className="py-2 px-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10">
                Home
              </Link>
              <Link href="/leds" onClick={() => setMobileOpen(false)} className="py-2 px-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10">
                LED Shop
              </Link>
              <Link href="/software" onClick={() => setMobileOpen(false)} className="py-2 px-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10">
                TV Software & Firmware
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
