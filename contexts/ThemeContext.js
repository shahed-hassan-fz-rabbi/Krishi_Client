"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { resolveThemePreference } from "../lib/theme.js";

const STORAGE_KEY = "km-theme";

const ThemeContext = createContext({ theme: "light", setTheme: () => {}, toggleTheme: () => {} });

/**
 * Light/Dark theme provider.
 * - Initial appearance is applied pre-paint by the inline script in app/layout.js,
 *   so there is no flash of the wrong theme.
 * - The preference is only written when the user changes the theme.
 * - The initial class is reconciled from storage once; it is not briefly removed
 *   by an effect running with the default light state after the pre-paint script.
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
