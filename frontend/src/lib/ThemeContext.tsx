"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Default to dark, but check storage
    const [theme, setTheme] = useState<Theme>("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // ONLY check localStorage, ignore system preference
        const storedTheme = localStorage.getItem("theme") as Theme | null;
        if (storedTheme) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTheme(storedTheme);
        } else {
            // Default to dark if no storage
            setTheme("dark");
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(theme);
        localStorage.setItem("theme", theme);
    }, [theme, mounted]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    // Prevent hydration mismatch by rendering nothing until mounted, 
    // OR just render children with default light theme (might flicker).
    // Better to render with current state, but we need to know if it matches server.
    // For simplicity in this app, we'll render children. 
    // If we want to avoid flash of wrong theme, we can hide until mounted.
    // But let's just render.

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
