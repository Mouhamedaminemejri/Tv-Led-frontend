"use client";

import * as React from "react";
import { toast } from "sonner";
import type { LedProduct, ProductDeliveryMethod } from "@/services/product-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: LedProduct;
};

export function ProductQuestionDialog({ open, onOpenChange, product }: BaseDialogProps) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [question, setQuestion] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setSubmitting(false);
    }
  }, [open]);

  const canSend = name.trim() && email.trim() && question.trim();

  const submit = async () => {
    if (!canSend) return;
    setSubmitting(true);
    try {
      // TODO: wire to backend endpoint when available
      await new Promise((r) => setTimeout(r, 350));
      toast.success("Question sent", {
        description: `We received your question about "${product.title}".`,
      });
      onOpenChange(false);
      setQuestion("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-black/90 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">Product question</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Ask us anything about this LED backlight. We’ll reply as soon as possible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-gray-700 dark:text-gray-300">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-700 dark:text-gray-300">Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-gray-700 dark:text-gray-300">Your question</Label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question here..."
              rows={5}
            />
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Product: <span className="font-semibold text-gray-900 dark:text-white">{product.reference}</span> •{" "}
            <span className="font-semibold text-gray-900 dark:text-white">{product.brand}</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-200 dark:border-white/10"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!canSend || submitting}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            {submitting ? "Sending..." : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function WatchdogDialog({ open, onOpenChange, product }: BaseDialogProps) {
  const [email, setEmail] = React.useState("");
  const [notifyStock, setNotifyStock] = React.useState(true);
  const [notifyPrice, setNotifyPrice] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const canSave = email.trim() && (notifyStock || notifyPrice);

  const save = async () => {
    if (!canSave) return;
    setSubmitting(true);
    try {
      // TODO: wire to backend endpoint when available
      await new Promise((r) => setTimeout(r, 350));
      toast.success("Watchdog enabled", {
        description: "We’ll notify you based on your preferences.",
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-black/90 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">Watchdog</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Get notified when this product is back in stock or when the price drops.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-gray-700 dark:text-gray-300">Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
          </div>

          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyStock}
                onChange={(e) => setNotifyStock(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-gray-800 dark:text-gray-200">Back in stock</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyPrice}
                onChange={(e) => setNotifyPrice(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-gray-800 dark:text-gray-200">Price drop</span>
            </label>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Product: <span className="font-semibold text-gray-900 dark:text-white">{product.reference}</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-200 dark:border-white/10"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave || submitting} className="bg-blue-600 hover:bg-blue-500 text-white">
            {submitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeliveryMethodDialog({
  open,
  onOpenChange,
  product,
  methods,
}: BaseDialogProps & { methods?: ProductDeliveryMethod[] }) {
  const fallbackMethods = React.useMemo<ProductDeliveryMethod[]>(
    () => [
      { name: "Standard delivery", detail: "24–48 hours (Tunis, nearby cities)", price: "From 7 TND" },
      { name: "Express delivery", detail: "Same day / next day (where available)", price: "From 15 TND" },
      { name: "Pickup", detail: "Pick up from our store", price: "Free" },
    ],
    []
  );
  const methodsToRender = methods ?? fallbackMethods;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-black/90 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">Delivery method</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Available delivery methods for this product.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {methodsToRender.length === 0 ? (
            <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-600 dark:text-gray-400">
              No delivery methods available for this product.
            </div>
          ) : (
            methodsToRender.map((m, index) => (
              <div
                key={`${m.name || "delivery-method"}-${index}`}
                className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{m.name || "Delivery"}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{m.detail || "Details not provided."}</div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{m.price ?? "—"}</div>
                </div>
              </div>
            ))
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Product: <span className="font-semibold text-gray-900 dark:text-white">{product.reference}</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-200 dark:border-white/10"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

