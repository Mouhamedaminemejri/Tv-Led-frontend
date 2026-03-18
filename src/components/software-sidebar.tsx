"use client";

import * as React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FirmwareType } from "@/services/software-product-service";

export interface SoftwareFilterState {
  manufacturers: string[];
  firmwareTypes: FirmwareType[];
  availability: "all" | "instock";
  search: string;
}

export interface SoftwareFacet {
  id: string;
  label: string;
  count: number;
}

export interface SoftwareFacetGroups {
  manufacturers: SoftwareFacet[];
  firmwareTypes: SoftwareFacet[];
}

interface SoftwareSidebarProps {
  filters: SoftwareFilterState;
  setFilters: React.Dispatch<React.SetStateAction<SoftwareFilterState>>;
  facets: SoftwareFacetGroups;
}

const FIRMWARE_TYPE_LABELS: Record<string, string> = {
  update: "Official Update",
  usb: "USB Firmware",
  recovery: "System Recovery",
  chassis_pack: "Chassis Pack",
};

export function SoftwareSidebar({ filters, setFilters, facets }: SoftwareSidebarProps) {
  const sortedManufacturers = React.useMemo(
    () =>
      [...facets.manufacturers].sort((a, b) => {
        const aSelected = filters.manufacturers.includes(a.label) ? 1 : 0;
        const bSelected = filters.manufacturers.includes(b.label) ? 1 : 0;
        if (aSelected !== bSelected) return bSelected - aSelected;
        return (b.count > 0 ? 1 : 0) - (a.count > 0 ? 1 : 0);
      }),
    [facets.manufacturers, filters.manufacturers]
  );

  const [showAllManufacturers, setShowAllManufacturers] = React.useState(false);
  const displayedManufacturers = showAllManufacturers ? sortedManufacturers : sortedManufacturers.slice(0, 7);

  const handleCheckboxChange = (category: "manufacturers" | "firmwareTypes", value: string, checked: boolean) => {
    setFilters((prev) => {
      const list = prev[category];
      if (checked) return { ...prev, [category]: [...list, value] };
      return { ...prev, [category]: list.filter((x) => x !== value) };
    });
  };

  const handleAvailabilityChange = (value: string) => {
    setFilters((prev) => ({ ...prev, availability: value as "all" | "instock" }));
  };

  const clearAllFilters = () => {
    setFilters({
      manufacturers: [],
      firmwareTypes: [],
      availability: "all",
      search: "",
    });
  };

  const hasActiveFilters =
    filters.manufacturers.length > 0 ||
    filters.firmwareTypes.length > 0 ||
    filters.availability !== "all" ||
    filters.search !== "";

  return (
    <aside className="w-full lg:w-[280px] flex-shrink-0">
      <div className="rounded-sm border border-gray-300 dark:border-white/10 bg-white dark:bg-black/20 p-4">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-200 dark:border-white/10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Parameters</h2>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-7 w-7 p-0 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
              title="Clear all filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Accordion
          type="multiple"
          defaultValue={["brands", "firmwareType", "availability", "search"]}
          className="pt-1"
        >
          <AccordionItem value="brands" className="border-b border-gray-200 dark:border-white/10">
            <AccordionTrigger className="py-3 hover:no-underline">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">Brand</span>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="space-y-2">
                {displayedManufacturers.length === 0 && (
                  <div className="text-sm text-gray-700 dark:text-gray-400">No brands found</div>
                )}
                {displayedManufacturers.map((item) => {
                  const isDisabled = item.count === 0;
                  const isChecked = filters.manufacturers.includes(item.label);
                  return (
                    <div key={item.id} className={cn("flex items-center gap-2", isDisabled && "opacity-50")}>
                      <Checkbox
                        id={`sw-brand-${item.id}`}
                        checked={isChecked}
                        disabled={isDisabled && !isChecked}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange("manufacturers", item.label, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`sw-brand-${item.id}`}
                        className={cn(
                          "font-normal flex-1 flex justify-between text-sm cursor-pointer",
                          isDisabled && !isChecked ? "text-gray-400 dark:text-gray-600" : "text-gray-900 dark:text-gray-300"
                        )}
                      >
                        <span>{item.label}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">({item.count})</span>
                      </Label>
                    </div>
                  );
                })}
                {sortedManufacturers.length > 7 && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mt-1"
                    onClick={() => setShowAllManufacturers((v) => !v)}
                  >
                    {showAllManufacturers ? "Show less" : "Show all"}
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showAllManufacturers && "rotate-180")} />
                  </button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="firmwareType" className="border-b border-gray-200 dark:border-white/10">
            <AccordionTrigger className="py-3 hover:no-underline">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">Firmware Type</span>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="space-y-2">
                {facets.firmwareTypes.map((item) => {
                  const isDisabled = item.count === 0;
                  const isChecked = filters.firmwareTypes.includes(item.id as FirmwareType);
                  return (
                    <div key={item.id} className={cn("flex items-center gap-2", isDisabled && "opacity-50")}>
                      <Checkbox
                        id={`sw-type-${item.id}`}
                        checked={isChecked}
                        disabled={isDisabled}
                        onCheckedChange={(checked) =>
                          !isDisabled && handleCheckboxChange("firmwareTypes", item.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`sw-type-${item.id}`}
                        className={cn(
                          "font-normal flex-1 flex justify-between text-sm",
                          isDisabled ? "cursor-not-allowed text-gray-400" : "cursor-pointer text-gray-900 dark:text-gray-300"
                        )}
                      >
                        <span>{item.label}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">({item.count})</span>
                      </Label>
                    </div>
                  );
                })}
                {facets.firmwareTypes.length === 0 && (
                  <div className="text-sm text-gray-700 dark:text-gray-400">No types found</div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="availability" className="border-b border-gray-200 dark:border-white/10">
            <AccordionTrigger className="py-3 hover:no-underline">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">Availability</span>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <RadioGroup
                value={filters.availability}
                onValueChange={handleAvailabilityChange}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="all" id="sw-avail-all" />
                  <Label htmlFor="sw-avail-all" className="font-normal text-sm cursor-pointer text-gray-900 dark:text-gray-300">
                    All products
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="instock" id="sw-avail-instock" />
                  <Label htmlFor="sw-avail-instock" className="font-normal text-sm cursor-pointer text-gray-900 dark:text-gray-300">
                    Only in stock
                  </Label>
                </div>
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="search" className="border-none">
            <AccordionTrigger className="py-3 hover:no-underline">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">Model / Reference</span>
            </AccordionTrigger>
            <AccordionContent className="pb-1">
              <Input
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Search TV model or reference..."
                className="h-9 rounded-none bg-white dark:bg-black/30 border-gray-300 dark:border-white/10 text-sm"
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </aside>
  );
}
