"use client";

import * as React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
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
    // Show all manufacturers/diagonals (no need to limit since we show all from filter-data)
    const displayedManufacturers = facets.manufacturers;
    const displayedDiagonals = facets.diagonals;

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
        <div className="w-full lg:w-64 space-y-6 flex-shrink-0 bg-gray-50 dark:bg-transparent p-4 rounded-lg">
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-gray-200 dark:border-white/10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Parameters</h2>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="h-8 px-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                        title="Clear all filters"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <Accordion type="multiple" defaultValue={["manufacturer", "diagonal", "backlight", "guide", "availability"]} className="space-y-4">

                {/* Manufacturer */}
                <AccordionItem value="manufacturer" className="border-none">
                    <AccordionTrigger className="py-2 hover:no-underline group">
                        <span className="font-bold text-base text-gray-900 dark:text-white transition-colors">Manufacturer</span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                        <div className="space-y-3">
                            {displayedManufacturers.length === 0 && <div className="text-sm text-gray-700 dark:text-gray-400">No manufacturers found</div>}
                            {displayedManufacturers.map((item) => {
                                const isDisabled = item.count === 0;
                                const isChecked = filters.manufacturers.includes(item.label);
                                return (
                                    <div key={item.id} className={cn("flex items-center space-x-3", isDisabled && "opacity-50")}>
                                        <Checkbox
                                            id={`mfg-${item.id}`}
                                            checked={isChecked}
                                            disabled={isDisabled}
                                            onCheckedChange={(checked) => !isDisabled && handleCheckboxChange('manufacturers', item.label, checked as boolean)}
                                        />
                                        <Label 
                                            htmlFor={`mfg-${item.id}`} 
                                            className={cn(
                                                "font-normal flex-1 flex justify-between",
                                                isDisabled ? "cursor-not-allowed text-gray-400 dark:text-gray-600" : "cursor-pointer text-gray-900 dark:text-gray-300"
                                            )}
                                        >
                                            <span>{item.label}</span>
                                            <span className={cn(isDisabled ? "text-gray-400 dark:text-gray-600" : "text-gray-700 dark:text-gray-400")}>({item.count})</span>
                                        </Label>
                                    </div>
                                );
                            })}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Diagonal */}
                <AccordionItem value="diagonal" className="border-none">
                    <AccordionTrigger className="py-2 hover:no-underline group">
                        <span className="font-bold text-base text-gray-900 dark:text-white transition-colors">Diagonal</span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                        <div className="space-y-3">
                            {displayedDiagonals.length === 0 && <div className="text-sm text-gray-700 dark:text-gray-400">No sizes found</div>}
                            {displayedDiagonals.map((item) => {
                                const isDisabled = item.count === 0;
                                const isChecked = filters.diagonals.includes(item.id);
                                return (
                                    <div key={item.id} className={cn("flex items-center space-x-3", isDisabled && "opacity-50")}>
                                        <Checkbox
                                            id={`diag-${item.id}`}
                                            checked={isChecked}
                                            disabled={isDisabled}
                                            onCheckedChange={(checked) => !isDisabled && handleCheckboxChange('diagonals', item.id, checked as boolean)}
                                        />
                                        <Label 
                                            htmlFor={`diag-${item.id}`} 
                                            className={cn(
                                                "font-normal flex-1 flex justify-between",
                                                isDisabled ? "cursor-not-allowed text-gray-400 dark:text-gray-600" : "cursor-pointer text-gray-900 dark:text-gray-300"
                                            )}
                                        >
                                            <span>{item.label}</span>
                                            <span className={cn(isDisabled ? "text-gray-400 dark:text-gray-600" : "text-gray-700 dark:text-gray-400")}>({item.count})</span>
                                        </Label>
                                    </div>
                                );
                            })}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* TV Backlight */}
                <AccordionItem value="backlight" className="border-none">
                    <AccordionTrigger className="py-2 hover:no-underline group">
                        <span className="font-bold text-base text-gray-900 dark:text-white transition-colors">TV backlight</span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                        <div className="space-y-3">
                            {facets.backlightTypes.length === 0 && <div className="text-sm text-gray-700 dark:text-gray-400">No types found</div>}
                            {facets.backlightTypes.map((item) => {
                                const isDisabled = item.count === 0;
                                const isChecked = filters.backlightTypes.includes(item.id);
                                return (
                                    <div key={item.id} className={cn("flex items-center space-x-3", isDisabled && "opacity-50")}>
                                        <Checkbox
                                            id={`type-${item.id}`}
                                            checked={isChecked}
                                            disabled={isDisabled}
                                            onCheckedChange={(checked) => !isDisabled && handleCheckboxChange('backlightTypes', item.id, checked as boolean)}
                                        />
                                        <Label 
                                            htmlFor={`type-${item.id}`} 
                                            className={cn(
                                                "font-normal flex-1 flex justify-between",
                                                isDisabled ? "cursor-not-allowed text-gray-400 dark:text-gray-600" : "cursor-pointer text-gray-900 dark:text-gray-300"
                                            )}
                                        >
                                            <span>{item.label}</span>
                                            <span className={cn(isDisabled ? "text-gray-400 dark:text-gray-600" : "text-gray-700 dark:text-gray-400")}>({item.count})</span>
                                        </Label>
                                    </div>
                                );
                            })}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Video Guide */}
                <AccordionItem value="guide" className="border-none">
                    <AccordionTrigger className="py-2 hover:no-underline group">
                        <span className="font-bold text-base text-gray-900 dark:text-white transition-colors">Video guide</span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="guide-yes"
                                    checked={filters.videoGuide}
                                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, videoGuide: checked as boolean }))}
                                />
                                <Label htmlFor="guide-yes" className="font-normal cursor-pointer flex-1 flex justify-between text-gray-900 dark:text-gray-300">
                                    <span>Yes</span>
                                    <span className="text-gray-700 dark:text-gray-400">({facets.videoGuide ?? 0})</span>
                                </Label>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Availability */}
                <AccordionItem value="availability" className="border-none">
                    <AccordionTrigger className="py-2 hover:no-underline group">
                        <span className="font-bold text-base text-gray-900 dark:text-white transition-colors">Availability</span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                        <RadioGroup
                            value={filters.availability}
                            onValueChange={handleAvailabilityChange}
                        >
                            <div className="flex items-center space-x-3">
                                <RadioGroupItem value="all" id="avail-all" />
                                <Label htmlFor="avail-all" className="font-normal cursor-pointer text-gray-900 dark:text-gray-300">All products</Label>
                            </div>
                            <div className="flex items-center space-x-3">
                                <RadioGroupItem value="instock" id="avail-instock" />
                                <Label htmlFor="avail-instock" className="font-normal cursor-pointer text-gray-900 dark:text-gray-300">Only in stock</Label>
                            </div>
                        </RadioGroup>
                    </AccordionContent>
                </AccordionItem>

            </Accordion>
        </div>
    );
}

