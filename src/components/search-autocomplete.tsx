"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductService, type SearchSuggestionProduct } from "@/services/product-service";
import { SoftwareProductService } from "@/services/software-product-service";
import { cn } from "@/lib/utils";

type SearchTarget = "led" | "software";

interface SearchSuggestion {
    type: 'brand' | 'reference' | 'title' | 'model' | 'panel' | 'sku' | 'product';
    value: string;
    display: string;
    product?: SearchSuggestionProduct | { id: string; title: string; brand: string; reference: string; price?: number | string; salePrice?: number | string | null; stock?: number | string };
    searchTarget?: SearchTarget;
}

function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatches(text: string, query: string): React.ReactNode {
    const tokens = query
        .trim()
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2);

    if (!text || tokens.length === 0) return text;

    const uniqueTokens = [...new Set(tokens)];
    const pattern = uniqueTokens.map(escapeRegExp).join("|");
    if (!pattern) return text;

    const regex = new RegExp(`(${pattern})`, "ig");
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, idx) => {
                const isMatch = uniqueTokens.some((t) => t.toLowerCase() === part.toLowerCase());
                return isMatch ? (
                    <mark
                        key={`${part}-${idx}`}
                        className="bg-yellow-200/70 dark:bg-yellow-400/30 text-inherit rounded px-0.5"
                    >
                        {part}
                    </mark>
                ) : (
                    <React.Fragment key={`${part}-${idx}`}>{part}</React.Fragment>
                );
            })}
        </>
    );
}

interface SearchAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect?: (value: string, type?: SearchSuggestion['type'], product?: SearchSuggestion['product'], ctx?: { searchTarget?: SearchTarget }) => void;
    onSubmit?: (value: string) => void;
    placeholder?: string;
    className?: string;
    /** When "software", uses software API and routes apply to /software */
    searchTarget?: SearchTarget;
}

export function SearchAutocomplete({ 
    value, 
    onChange, 
    onSelect,
    onSubmit,
    placeholder = "Search by TV Model (e.g. UE43...), Part Number, or Brand...",
    className,
    searchTarget = "led",
}: SearchAutocompleteProps) {
    const [suggestions, setSuggestions] = React.useState<SearchSuggestion[]>([]);
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedIndex, setSelectedIndex] = React.useState(-1);
    const [isLoading, setIsLoading] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    // Debounced search for suggestions
    React.useEffect(() => {
        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Don't search if query is too short
        if (value.trim().length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        
        // Debounce API call
        debounceTimerRef.current = setTimeout(async () => {
            try {
                if (searchTarget === "software") {
                    const data = await SoftwareProductService.getSearchSuggestions(value.trim(), 8);
                    const productSuggestions: SearchSuggestion[] = (data.products ?? []).slice(0, 5).map((product) => ({
                        type: "product" as const,
                        value: product.id,
                        display: product.title,
                        product: { id: product.id, title: product.title, brand: product.brand, reference: product.reference, price: product.price, salePrice: product.salePrice, stock: product.stock },
                        searchTarget: "software",
                    }));
                    const allSuggestions: SearchSuggestion[] = [
                        ...productSuggestions,
                        ...data.brands.map(brand => ({ type: 'brand' as const, value: brand, display: brand, searchTarget: 'software' as const })),
                        ...data.references.map(ref => ({ type: 'reference' as const, value: ref, display: ref, searchTarget: 'software' as const })),
                        ...data.models.map(model => ({ type: 'model' as const, value: model, display: model, searchTarget: 'software' as const })),
                    ];
                    setSuggestions(allSuggestions.slice(0, 12));
                } else {
                    const data = await ProductService.getSearchSuggestions(value.trim(), 8);
                    const productSuggestions: SearchSuggestion[] = (data.products ?? []).slice(0, 5).map((product) => ({
                        type: "product" as const,
                        value: product.id,
                        display: product.title,
                        product,
                        searchTarget: "led" as const,
                    }));
                    const allSuggestions: SearchSuggestion[] = [
                        ...productSuggestions,
                        ...data.brands.map(brand => ({ type: 'brand' as const, value: brand, display: brand })),
                        ...data.references.map(ref => ({ type: 'reference' as const, value: ref, display: ref })),
                        ...data.suks.map(sku => ({ type: 'sku' as const, value: sku, display: sku })),
                        ...data.tvPanelTypes.map(panel => ({ type: 'panel' as const, value: panel, display: panel })),
                        ...data.models.map(model => ({ type: 'model' as const, value: model, display: model })),
                        ...data.titles.slice(0, 3).map(title => ({ type: 'title' as const, value: title, display: title.length > 60 ? title.substring(0, 60) + '...' : title }))
                    ];
                    setSuggestions(allSuggestions.slice(0, 12));
                }
                setIsOpen(true);
                setSelectedIndex(-1);
            } catch (error) {
                console.error("Error fetching suggestions:", error);
                setSuggestions([]);
                // Still show dropdown even if empty, so user knows search is working
                setIsOpen(true);
            } finally {
                setIsLoading(false);
            }
        }, 300); // 300ms debounce

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [value]);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        setIsOpen(true);
    };

    const handleSelect = (suggestion: SearchSuggestion) => {
        onChange(suggestion.type === "product" ? suggestion.display : suggestion.value);
        setIsOpen(false);
        if (onSelect) {
            onSelect(suggestion.value, suggestion.type, suggestion.product, { searchTarget: suggestion.searchTarget ?? searchTarget });
        }
        inputRef.current?.blur();
    };

    const handleApplySearch = React.useCallback(() => {
        const q = value.trim();
        if (!q) return;
        setIsOpen(false);
        if (onSubmit) {
            onSubmit(q);
        }
        inputRef.current?.blur();
    }, [onSubmit, value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen || suggestions.length === 0) {
            if (e.key === 'Enter' && value.trim()) {
                e.preventDefault();
                handleApplySearch();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleSelect(suggestions[selectedIndex]);
                } else if (value.trim()) {
                    handleApplySearch();
                }
                break;
            case 'Escape':
                setIsOpen(false);
                inputRef.current?.blur();
                break;
        }
    };

    const clearSearch = () => {
        onChange('');
        setSuggestions([]);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    const getSuggestionIcon = (type: SearchSuggestion['type']) => {
        switch (type) {
            case 'brand':
                return '🏷️';
            case 'reference':
                return '🔢';
            case 'sku':
                return '🧾';
            case 'panel':
                return '🧩';
            case 'model':
                return '📺';
            case 'title':
                return '📦';
            case 'product':
                return '🛒';
            default:
                return '🔍';
        }
    };

    return (
        <div ref={containerRef} className={cn("relative w-full", className)}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400 z-10" />
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (suggestions.length > 0) {
                            setIsOpen(true);
                        }
                    }}
                    className="w-full bg-gray-100 dark:bg-white/5 border-gray-300 dark:border-white/10 pl-10 pr-10 focus:bg-gray-200 dark:focus:bg-white/10 transition-colors h-10 rounded-full text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500"
                />
                {value && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 flex items-center justify-center transition-colors z-10"
                        aria-label="Clear search"
                    >
                        <X className="h-3 w-3 text-gray-700 dark:text-gray-300" />
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {isOpen && value.trim().length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl shadow-sm dark:shadow-2xl z-[100] max-h-80 overflow-y-auto backdrop-blur-sm">
                    {isLoading ? (
                        <div className="p-4 text-center text-gray-600 dark:text-gray-400 text-sm">
                            Searching...
                        </div>
                    ) : suggestions.length > 0 ? (
                        <>
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={`${suggestion.type}-${suggestion.product?.id || suggestion.value}-${index}`}
                                    onClick={() => handleSelect(suggestion)}
                                    className={cn(
                                        "w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center gap-3",
                                        index === selectedIndex && "bg-gray-100 dark:bg-white/10"
                                    )}
                                >
                                    <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {highlightMatches(suggestion.display, value)}
                                        </div>
                                        {suggestion.type === "product" && suggestion.product ? (
                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                                    {highlightMatches(`${suggestion.product.brand} • ${suggestion.product.reference}`, value)}
                                                </span>
                                                <span>
                                                    {(Number(suggestion.product.salePrice ?? suggestion.product.price) || 0).toFixed(2)} TND
                                                </span>
                                                <span className={cn(
                                                    "rounded px-1.5 py-0.5",
                                                    Number(suggestion.product.stock) > 0
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                )}>
                                                    {Number(suggestion.product.stock) > 0 ? "In stock" : "Out of stock"}
                                                </span>
                                                {Array.isArray(suggestion.product.matchedBy) && suggestion.product.matchedBy.length > 0 && (
                                                    <span className="truncate">
                                                        Matched by: {suggestion.product.matchedBy.join(", ")}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                                                {suggestion.type}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                            <div className="border-t border-gray-200 dark:border-white/10 px-4 py-2">
                                <button
                                    onClick={handleApplySearch}
                                    className="w-full text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-center py-2"
                                >
                                    Search for "{value}"
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="p-4 text-center">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                No suggestions found
                            </div>
                            <button
                                onClick={handleApplySearch}
                                className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white underline"
                            >
                                Search for "{value}"
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

