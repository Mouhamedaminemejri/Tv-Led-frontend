"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductService } from "@/services/product-service";
import { cn } from "@/lib/utils";

interface SearchSuggestion {
    type: 'brand' | 'reference' | 'title';
    value: string;
    display: string;
}

interface SearchAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect?: (value: string, type?: 'brand' | 'reference' | 'title') => void;
    placeholder?: string;
    className?: string;
}

export function SearchAutocomplete({ 
    value, 
    onChange, 
    onSelect,
    placeholder = "Search by TV Model (e.g. UE43...), Part Number, or Brand...",
    className 
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
                const data = await ProductService.getSearchSuggestions(value.trim(), 8);
                
                const allSuggestions: SearchSuggestion[] = [
                    ...data.brands.map(brand => ({ type: 'brand' as const, value: brand, display: brand })),
                    ...data.references.map(ref => ({ type: 'reference' as const, value: ref, display: ref })),
                    ...data.titles.slice(0, 3).map(title => ({ type: 'title' as const, value: title, display: title.length > 60 ? title.substring(0, 60) + '...' : title }))
                ];

                setSuggestions(allSuggestions.slice(0, 10)); // Limit to 10 total suggestions
                // Keep dropdown open if we have suggestions or if user is still typing
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
        onChange(suggestion.value);
        setIsOpen(false);
        if (onSelect) {
            onSelect(suggestion.value, suggestion.type);
        }
        inputRef.current?.blur();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen || suggestions.length === 0) {
            if (e.key === 'Enter' && value.trim()) {
                // Submit search
                setIsOpen(false);
                inputRef.current?.blur();
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
                    // Submit current search
                    setIsOpen(false);
                    inputRef.current?.blur();
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
            case 'title':
                return '📦';
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
                                    key={`${suggestion.type}-${index}`}
                                    onClick={() => handleSelect(suggestion)}
                                    className={cn(
                                        "w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center gap-3",
                                        index === selectedIndex && "bg-gray-100 dark:bg-white/10"
                                    )}
                                >
                                    <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {suggestion.display}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                                            {suggestion.type}
                                        </div>
                                    </div>
                                </button>
                            ))}
                            <div className="border-t border-gray-200 dark:border-white/10 px-4 py-2">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        inputRef.current?.blur();
                                    }}
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
                                onClick={() => {
                                    setIsOpen(false);
                                    inputRef.current?.blur();
                                }}
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

