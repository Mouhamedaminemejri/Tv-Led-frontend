"use client";

import * as React from "react";
import { AdminService, type DashboardOverviewResponse } from "@/services/admin-service";
import { AlertCircle, BarChart3, Boxes, Loader2, RefreshCw, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function formatMoney(amount: number) {
  // Keep it simple + robust
  if (!Number.isFinite(amount)) return "-";
  return `${amount.toFixed(2)} TND`;
}

export default function AdminDashboardPage() {
  const [data, setData] = React.useState<DashboardOverviewResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [lowStockThreshold, setLowStockThreshold] = React.useState<string>("5");
  const thresholdNumber = React.useMemo(() => {
    const n = Number(lowStockThreshold);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }, [lowStockThreshold]);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await AdminService.getDashboardOverview(
        thresholdNumber === null ? undefined : { lowStockThreshold: thresholdNumber }
      );
      setData(res);
    } catch (err) {
      console.error("Error loading dashboard overview:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard overview");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [thresholdNumber]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-black/80 backdrop-blur-xl">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Low stock threshold</span>
              <Input
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                inputMode="numeric"
                className="w-24 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
              />
            </div>
            <Button
              variant="outline"
              onClick={load}
              disabled={loading}
              className="border-gray-200 dark:border-white/10"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</span>
          </div>
        )}

        {loading && !data ? (
          <div className="text-center py-20 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Sales (Day)</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {formatMoney(data?.sales.day ?? NaN)}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10">
                    <div className="text-gray-500 dark:text-gray-400">Month</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatMoney(data?.sales.month ?? NaN)}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10">
                    <div className="text-gray-500 dark:text-gray-400">Year</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatMoney(data?.sales.year ?? NaN)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Order Volume</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {(data?.orderVolume.successfulDeliveries ?? 0) + (data?.orderVolume.pendingPickups ?? 0)}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-green-700 dark:text-green-400" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10">
                    <div className="text-gray-500 dark:text-gray-400">Successful deliveries</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {data?.orderVolume.successfulDeliveries ?? 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10">
                    <div className="text-gray-500 dark:text-gray-400">Pending pickups</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {data?.orderVolume.pendingPickups ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Inventory health</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {data?.inventoryHealth.lowStockProducts?.length ?? 0} low stock
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                    <Boxes className="h-5 w-5 text-orange-700 dark:text-orange-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                  Shows products with stock below the threshold.
                </p>
              </div>
            </div>

            {/* Low stock list */}
            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between gap-4">
                <div className="font-semibold text-gray-900 dark:text-white">Low stock TV models</div>
                <div className="sm:hidden flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Threshold</span>
                  <Input
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    inputMode="numeric"
                    className="w-20 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Title / Model
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Stock
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                    {(data?.inventoryHealth.lowStockProducts ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                          No low-stock products found for this threshold.
                        </td>
                      </tr>
                    ) : (
                      (data?.inventoryHealth.lowStockProducts ?? []).map((p, idx) => (
                        <tr key={p.id ?? `${p.reference ?? "row"}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-white/5">
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {p.title || p.modelName || "—"}
                            </div>
                            {p.modelName && p.title && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{p.modelName}</div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                              {p.reference ?? "—"}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                              {p.stock ?? 0}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

