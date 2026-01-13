"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "tv_partner_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = React.useState<Theme>("system");
    const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>("dark");
    const [mounted, setMounted] = React.useState(false);

    // Get system preference
    const getSystemTheme = (): ResolvedTheme => {
        if (typeof window === "undefined") return "dark";
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    };

    // Resolve theme based on current theme setting
    const resolveTheme = (currentTheme: Theme): ResolvedTheme => {
        if (currentTheme === "system") {
            return getSystemTheme();
        }
        return currentTheme;
    };

    // Apply theme to document
    const applyTheme = (resolved: ResolvedTheme) => {
        if (typeof document === "undefined") return;
        
        const root = document.documentElement;
        if (resolved === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    };

    // Initialize theme on mount
    React.useEffect(() => {
        setMounted(true);
        
        // Load theme from localStorage
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
        const initialTheme = storedTheme || "system";
        
        setThemeState(initialTheme);
        const resolved = resolveTheme(initialTheme);
        setResolvedTheme(resolved);
        applyTheme(resolved);

        // Listen for system theme changes
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            if (theme === "system") {
                const newResolved = getSystemTheme();
                setResolvedTheme(newResolved);
                applyTheme(newResolved);
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    // Update resolved theme when theme changes
    React.useEffect(() => {
        if (!mounted) return;
        
        const resolved = resolveTheme(theme);
        setResolvedTheme(resolved);
        applyTheme(resolved);
        
        // Save to localStorage
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme, mounted]);

    const setTheme = React.useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
    }, []);

    // Always provide context, even during SSR (use default values)
    // This prevents "useTheme must be used within a ThemeProvider" errors
    const contextValue = React.useMemo(() => ({
        theme: mounted ? theme : "system" as Theme,
        resolvedTheme: mounted ? resolvedTheme : "dark" as ResolvedTheme,
        setTheme
    }), [theme, resolvedTheme, setTheme, mounted]);

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = React.useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}


