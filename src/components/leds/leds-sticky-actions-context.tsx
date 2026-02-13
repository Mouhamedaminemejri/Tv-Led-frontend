"use client";

import * as React from "react";
import type { LedProduct } from "@/services/product-service";

type StickyActionState = {
  product: LedProduct | null;
  show: boolean;
  onAddToCart: (() => void) | null;
  onBuyNow: (() => void) | null;
};

const StickyActionsContext = React.createContext<{
  state: StickyActionState;
  setState: React.Dispatch<React.SetStateAction<StickyActionState>>;
} | null>(null);

const initialState: StickyActionState = {
  product: null,
  show: false,
  onAddToCart: null,
  onBuyNow: null,
};

export function LedsStickyActionsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<StickyActionState>(initialState);
  return <StickyActionsContext.Provider value={{ state, setState }}>{children}</StickyActionsContext.Provider>;
}

export function useLedsStickyActions() {
  const ctx = React.useContext(StickyActionsContext);
  if (!ctx) throw new Error("useLedsStickyActions must be used within LedsStickyActionsProvider");
  return ctx;
}

