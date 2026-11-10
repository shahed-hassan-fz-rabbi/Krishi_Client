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
      : variant === "toolbar"
        ? "border-transparent bg-transparent text-muted shadow-none hover:bg-surface-2 hover:text-content"
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

  const base = "inline-flex h-9 items-center overflow-hidden rounded-xl border text-xs font-semibold";
  const border = variant === "dark" ? "border-white/20" : "border-line/80";
  const idle = variant === "dark" ? "text-white/65 hover:bg-white/10 hover:text-white" : "text-muted hover:bg-surface hover:text-content";
  const active = variant === "dark"
    ? "bg-white text-forest shadow-sm ring-1 ring-black/5"
    : "bg-forest text-white shadow-sm ring-1 ring-forest/10";
  const track = variant === "dark" ? "bg-white/5" : "bg-forest/5";

  return (
    <div className={`${base} ${border} ${track} p-0.5 ${className}`}>
      {["en", "bn"].map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          aria-label={code === "en" ? "English" : "বাংলা"}
          className={`h-full min-w-10 rounded-lg px-2.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald ${locale === code ? active : idle}`}
        >
          {code === "en" ? "EN" : "বাং"}
        </button>
      ))}
    </div>
  );
}
