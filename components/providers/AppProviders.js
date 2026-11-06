"use client";

import { ThemeProvider } from "../../contexts/ThemeContext.js";
import { LanguageProvider } from "../../lib/i18n/LanguageContext.js";

/** Single wrapper around all client-side UI providers. */
export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </ThemeProvider>
  );
}
