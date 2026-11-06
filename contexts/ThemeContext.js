"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "km-theme";

const ThemeContext = createContext({ theme: "light", setTheme: () => {}, toggleTheme: () => {} });

/**
 * Light/Dark theme provider.
 * - Initial appearance is applied pre-paint by the inline script in app/layout.js,
 *   so there is no flash of the wrong theme.
 * - The stored preference is ONLY written when the user actually changes the theme
 *   (never on mount) — otherwise a mount-time write would clobber the saved value
 *   under React Strict Mode's double-invoked effects.
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("light");

  // One-time hydration sync: server HTML cannot know the stored preference.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "dark" || stored === "light")
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setThemeState(stored);
      else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setThemeState("dark");
    } catch {
      /* private mode — keep default */
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setTheme = useCallback((next) => {
    const value = next === "dark" ? "dark" : "light";
    setThemeState(value);
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
