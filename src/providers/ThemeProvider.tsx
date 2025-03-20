"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type ThemeType = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>("light");
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage or user settings
  useEffect(() => {
    // Initially set to light to avoid flash of unstyled content
    setMounted(true);
    
    const fetchUserTheme = async () => {
      try {
        const response = await fetch("/api/user/settings");
        if (response.ok) {
          const data = await response.json();
          if (data?.settings?.theme) {
            handleThemeChange(data.settings.theme as ThemeType);
          } else {
            // Fallback to localStorage
            const savedTheme = localStorage.getItem("theme") as ThemeType;
            if (savedTheme) {
              handleThemeChange(savedTheme);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user theme:", error);
        // Fallback to localStorage
        const savedTheme = localStorage.getItem("theme") as ThemeType;
        if (savedTheme) {
          handleThemeChange(savedTheme);
        }
      }
    };

    fetchUserTheme();
  }, []);

  // Apply theme changes to HTML element and localStorage
  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    // Apply theme to document
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    
    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
  };

  // Listen for changes in system theme when using "system" setting
  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      
      const handleChange = () => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(mediaQuery.matches ? "dark" : "light");
      };
      
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  // To avoid hydration mismatch, only render children when mounted
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleThemeChange }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
