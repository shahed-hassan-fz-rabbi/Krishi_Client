"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext.js";
import { useLang } from "../../lib/i18n/LanguageContext.js";

/** Theme toggle with persistent preference (see ThemeContext). */
export function ThemeSwitcher({ variant = "light", className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLang();
  const isDark = theme === "dark";

  const chrome =
    variant === "dark"
      ? "border-white/20 text-white/80 hover:bg-white/10"
      : "border-line text-content hover:bg-surface-2";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t("theme.light") : t("theme.dark")}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${chrome} ${className}`}
    >
      {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}

/** EN / BN switcher, persisted across sessions. */
export function LanguageSwitcher({ variant = "light", className = "" }) {
  const { locale, setLocale } = useLang();

  const base = "inline-flex h-9 items-center overflow-hidden rounded-lg border text-xs font-semibold";
  const border = variant === "dark" ? "border-white/20" : "border-line";
  const idle = variant === "dark" ? "text-white/70" : "text-muted";
  const active = variant === "dark" ? "bg-white/15 text-white" : "bg-surface text-content";

  return (
    <div className={`${base} ${border} ${className}`}>
      {["en", "bn"].map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          className={`h-full px-3 transition-colors ${locale === code ? active : idle}`}
        >
          {code === "en" ? "EN" : "বাং"}
        </button>
      ))}
    </div>
  );
}
