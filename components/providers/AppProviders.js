"use client";

import { ThemeProvider } from "../../contexts/ThemeContext.js";
import { LanguageProvider } from "../../lib/i18n/LanguageContext.js";
import { AuthProvider } from "../../contexts/AuthContext.js";
import { LocationProvider } from "../../contexts/LocationContext.js";

/** Single wrapper around all client-side UI providers. */
export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <LocationProvider>{children}</LocationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
