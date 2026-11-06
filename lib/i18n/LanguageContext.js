"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { translations } from "./translations.js";

const STORAGE_KEY = "km-locale";

const LanguageContext = createContext({ locale: "en", setLocale: () => {}, t: (k) => k });

/**
 * Bengali / English language provider.
 * - Sets <html lang> and exposes t() for all UI strings.
 * - The stored preference is ONLY written when the user actually switches language
 *   (never on mount) — a mount-time write would clobber the saved value,
 *   exposed by React Strict Mode's double-invoked effects.
 */
export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState("en");

  // One-time hydration sync: server HTML always renders English.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "bn" || stored === "en")
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocaleState(stored);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.classList.toggle("km-bn", locale === "bn");
  }, [locale]);

  const setLocale = useCallback((next) => {
    const value = next === "bn" ? "bn" : "en";
    setLocaleState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key) => {
      const dict = translations[locale] || translations.en;
      return key.split(".").reduce((node, part) => (node ? node[part] : undefined), dict) ?? key;
    },
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
