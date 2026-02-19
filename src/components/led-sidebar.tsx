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

// Filter State Interface (shared with Page)
export interface FilterState {
    manufacturers: string[];
    diagonals: string[];
    backlightTypes: string[];
    videoGuide: boolean;
    availability: 'all' | 'instock';
    search: string;
}

export interface Facet {
    id: string;
    label: string;
    count: number;
}

export interface FacetGroups {
    manufacturers: Facet[];
    diagonals: Facet[];
    backlightTypes: Facet[];
    videoGuide?: number; // Count of products with video guide
}

interface LedSidebarProps {
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    facets: FacetGroups;
}

// VIDEO_GUIDE is now dynamic based on facets.videoGuide

export function LedSidebar({ filters, setFilters, facets }: LedSidebarProps) {
    // Sort facets: selected first, then available (count > 0), then disabled (count === 0)
    const sortedManufacturers = React.useMemo(() => {
        return [...facets.manufacturers].sort((a, b) => {
            const aSelected = filters.manufacturers.includes(a.label) ? 1 : 0;
            const bSelected = filters.manufacturers.includes(b.label) ? 1 : 0;
            if (aSelected !== bSelected) return bSelected - aSelected;
            const aAvailable = a.count > 0 ? 1 : 0;
            const bAvailable = b.count > 0 ? 1 : 0;
            return bAvailable - aAvailable;
        });
    }, [facets.manufacturers, filters.manufacturers]);

    const sortedDiagonals = React.useMemo(() => {
        return [...facets.diagonals].sort((a, b) => {
            const aSelected = filters.diagonals.includes(a.id) ? 1 : 0;
            const bSelected = filters.diagonals.includes(b.id) ? 1 : 0;
            if (aSelected !== bSelected) return bSelected - aSelected;
            const aAvailable = a.count > 0 ? 1 : 0;
            const bAvailable = b.count > 0 ? 1 : 0;
            return bAvailable - aAvailable;
        });
    }, [facets.diagonals, filters.diagonals]);

    const sortedBacklightTypes = React.useMemo(() => {
        return [...facets.backlightTypes].sort((a, b) => {
            const aSelected = filters.backlightTypes.includes(a.id) ? 1 : 0;
            const bSelected = filters.backlightTypes.includes(b.id) ? 1 : 0;
            if (aSelected !== bSelected) return bSelected - aSelected;
            const aAvailable = a.count > 0 ? 1 : 0;
            const bAvailable = b.count > 0 ? 1 : 0;
            return bAvailable - aAvailable;
        });
    }, [facets.backlightTypes, filters.backlightTypes]);

    // Show manufacturers with optional expand
    const [showAllManufacturers, setShowAllManufacturers] = React.useState(false);
    const displayedManufacturers = showAllManufacturers ? sortedManufacturers : sortedManufacturers.slice(0, 7);

    // Show diagonals with optional expand
    const [showAllDiagonals, setShowAllDiagonals] = React.useState(false);
    const displayedDiagonals = showAllDiagonals ? sortedDiagonals : sortedDiagonals.slice(0, 7);

    const handleCheckboxChange = (category: keyof FilterState, value: string, checked: boolean) => {
        setFilters(prev => {
            const currentList = prev[category] as string[];
            if (checked) {
                return { ...prev, [category]: [...currentList, value] };
            } else {
                return { ...prev, [category]: currentList.filter(item => item !== value) };
            }
        });
    };

    const handleAvailabilityChange = (value: string) => {
        setFilters(prev => ({ ...prev, availability: value as 'all' | 'instock' }));
    };

    const clearAllFilters = () => {
        setFilters({
            manufacturers: [],
            diagonals: [],
            backlightTypes: [],
            videoGuide: false,
            availability: 'all',
            search: '',
        });
    };

    // Check if any filters are active
    const hasActiveFilters = filters.manufacturers.length > 0 ||
        filters.diagonals.length > 0 ||
        filters.backlightTypes.length > 0 ||
        filters.videoGuide ||
        filters.availability !== 'all' ||
        filters.search !== '';

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
                defaultValue={["brands", "diagonal", "backlight", "availability", "search"]}
                className="pt-1"
            >

                {/* Brands */}
                <AccordionItem value="brands" className="border-b border-gray-200 dark:border-white/10">
                    <AccordionTrigger className="py-3 hover:no-underline">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">Brand</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                        <div className="space-y-2">
                            {displayedManufacturers.length === 0 && <div className="text-sm text-gray-700 dark:text-gray-400">No brands found</div>}
                            {displayedManufacturers.map((item) => {
                                const isDisabled = item.count === 0;
                                const isChecked = filters.manufacturers.includes(item.label);
                                return (
                                    <div key={item.id} className={cn("flex items-center gap-2", isDisabled && "opacity-50")}>
                                        <Checkbox
                                            id={`brand-${item.id}`}
                                            checked={isChecked}
                                            disabled={isDisabled && !isChecked}
                                            onCheckedChange={(checked) => handleCheckboxChange('manufacturers', item.label, checked as boolean)}
                                        />
                                        <Label 
                                            htmlFor={`brand-${item.id}`} 
                                            className={cn(
                                                "font-normal flex-1 flex justify-between text-sm",
                                                isDisabled && !isChecked ? "cursor-not-allowed text-gray-400 dark:text-gray-600" : "cursor-pointer text-gray-900 dark:text-gray-300"
                                            )}
                                        >
                                            <span>{item.label}</span>
                                            <span className={cn("text-xs", isDisabled && !isChecked ? "text-gray-400 dark:text-gray-600" : "text-gray-600 dark:text-gray-400")}>({item.count})</span>
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

                {/* Diagonal */}
                <AccordionItem value="diagonal" className="border-b border-gray-200 dark:border-white/10">
                    <AccordionTrigger className="py-3 hover:no-underline">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">Diagonal</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                        <div className="space-y-2">
                            {displayedDiagonals.length === 0 && <div className="text-sm text-gray-700 dark:text-gray-400">No sizes found</div>}
                            {displayedDiagonals.map((item) => {
                                const isDisabled = item.count === 0;
                                const isChecked = filters.diagonals.includes(item.id);
                                return (
                                    <div key={item.id} className={cn("flex items-center gap-2", isDisabled && "opacity-50")}>
                                        <Checkbox
                                            id={`diag-${item.id}`}
                                            checked={isChecked}
                                            disabled={isDisabled}
                                            onCheckedChange={(checked) => !isDisabled && handleCheckboxChange('diagonals', item.id, checked as boolean)}
                                        />
                                        <Label 
                                            htmlFor={`diag-${item.id}`} 
                                            className={cn(
                                                "font-normal flex-1 flex justify-between text-sm",
                                                isDisabled ? "cursor-not-allowed text-gray-400 dark:text-gray-600" : "cursor-pointer text-gray-900 dark:text-gray-300"
                                            )}
                                        >
                                            <span>{item.label}</span>
                                            <span className={cn("text-xs", isDisabled ? "text-gray-400 dark:text-gray-600" : "text-gray-600 dark:text-gray-400")}>({item.count})</span>
                                        </Label>
                                    </div>
                                );
                            })}
                            {sortedDiagonals.length > 7 && (
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mt-1"
                                    onClick={() => setShowAllDiagonals((v) => !v)}
                                >
                                    {showAllDiagonals ? "Show less" : "Show all"}
                                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showAllDiagonals && "rotate-180")} />
                                </button>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* TV Backlight */}
                <AccordionItem value="backlight" className="border-b border-gray-200 dark:border-white/10">
                    <AccordionTrigger className="py-3 hover:no-underline">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">TV backlight</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                        <div className="space-y-2">
                            {sortedBacklightTypes.length === 0 && <div className="text-sm text-gray-700 dark:text-gray-400">No types found</div>}
                            {sortedBacklightTypes.map((item) => {
                                const isDisabled = item.count === 0;
                                const isChecked = filters.backlightTypes.includes(item.id);
                                return (
                                    <div key={item.id} className={cn("flex items-center gap-2", isDisabled && "opacity-50")}>
                                        <Checkbox
                                            id={`type-${item.id}`}
                                            checked={isChecked}
                                            disabled={isDisabled}
                                            onCheckedChange={(checked) => !isDisabled && handleCheckboxChange('backlightTypes', item.id, checked as boolean)}
                                        />
                                        <Label 
                                            htmlFor={`type-${item.id}`} 
                                            className={cn(
                                                "font-normal flex-1 flex justify-between text-sm",
                                                isDisabled ? "cursor-not-allowed text-gray-400 dark:text-gray-600" : "cursor-pointer text-gray-900 dark:text-gray-300"
                                            )}
                                        >
                                            <span>{item.label}</span>
                                            <span className={cn("text-xs", isDisabled ? "text-gray-400 dark:text-gray-600" : "text-gray-600 dark:text-gray-400")}>({item.count})</span>
                                        </Label>
                                    </div>
                                );
                            })}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Video Guide */}
                <AccordionItem value="guide" className="border-b border-gray-200 dark:border-white/10">
                    <AccordionTrigger className="py-3 hover:no-underline">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">Video guide</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="guide-yes"
                                    checked={filters.videoGuide}
                                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, videoGuide: checked as boolean }))}
                                />
                                <Label htmlFor="guide-yes" className="font-normal cursor-pointer flex-1 flex justify-between text-sm text-gray-900 dark:text-gray-300">
                                    <span>Yes</span>
                                    <span className="text-xs text-gray-600 dark:text-gray-400">({facets.videoGuide ?? 0})</span>
                                </Label>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Availability */}
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
                                <RadioGroupItem value="all" id="avail-all" />
                                <Label htmlFor="avail-all" className="font-normal text-sm cursor-pointer text-gray-900 dark:text-gray-300">All products</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="instock" id="avail-instock" />
                                <Label htmlFor="avail-instock" className="font-normal text-sm cursor-pointer text-gray-900 dark:text-gray-300">Only in stock</Label>
                            </div>
                        </RadioGroup>
                    </AccordionContent>
                </AccordionItem>

                {/* Search text */}
                <AccordionItem value="search" className="border-none">
                    <AccordionTrigger className="py-3 hover:no-underline">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">Search text</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-1">
                        <Input
                            value={filters.search}
                            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                            placeholder="Search"
                            className="h-9 rounded-none bg-white dark:bg-black/30 border-gray-300 dark:border-white/10 text-sm"
                        />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            </div>
        </aside>
    );
}

