"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { resolveThemePreference } from "../lib/theme.js";

const STORAGE_KEY = "km-theme";

const ThemeContext = createContext({ theme: "light", setTheme: () => {}, toggleTheme: () => {} });

/**
 * Light/Dark theme provider.
 * - The saved preference is applied during the one-time client hydration sync.
 * - The preference is only written when the user changes the theme.
 * - The root class is reconciled from storage once after hydration.
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("light");

  // One-time hydration sync: server HTML cannot know the stored preference.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const nextTheme = resolveThemePreference(
        stored,
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeState(nextTheme);
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
    } catch {
      /* private mode — keep default */
    }
  }, []);

  const setTheme = useCallback((next) => {
    const value = next === "dark" ? "dark" : "light";
    setThemeState(value);
    document.documentElement.classList.toggle("dark", value === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
