"use client";

import * as React from "react";
import { CartProvider } from "@/context/cart-context";
import { ThemeProvider } from "@/context/theme-context";
import { AuthProvider } from "@/context/auth-context";
import { Toaster } from "sonner";

function ToasterWithTheme() {
    // Get theme from document class or default to dark (safer for SSR)
    const [theme, setTheme] = React.useState<"light" | "dark">("dark");
    
    React.useEffect(() => {
        const updateTheme = () => {
            const isDark = document.documentElement.classList.contains("dark");
            setTheme(isDark ? "dark" : "light");
        };
        
        updateTheme();
        
        // Watch for theme changes
        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });
        
        return () => observer.disconnect();
    }, []);
    
    return <Toaster position="top-center" theme={theme} richColors />;
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <CartProvider>
                    {children}
                    <ToasterWithTheme />
                </CartProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
