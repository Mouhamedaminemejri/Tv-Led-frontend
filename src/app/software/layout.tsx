import * as React from "react";
import { LedsSubNavbar } from "@/components/leds/leds-sub-navbar";
import { LedsStickyActionsProvider } from "@/components/leds/leds-sticky-actions-context";

export default function SoftwareLayout({ children }: { children: React.ReactNode }) {
  return (
    <LedsStickyActionsProvider>
      <React.Suspense
        fallback={
          <div className="sticky top-16 z-40 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/70 backdrop-blur-xl">
            <div className="container mx-auto px-4 h-16" />
          </div>
        }
      >
        <LedsSubNavbar />
      </React.Suspense>
      {children}
    </LedsStickyActionsProvider>
  );
}
