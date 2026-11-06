"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Sprout, X } from "lucide-react";

import { BrandMark } from "./BrandMark.js";
import { LanguageSwitcher, ThemeSwitcher } from "./Switchers.js";
import { Button } from "../ui/Button.js";
import { useLang } from "../../lib/i18n/LanguageContext.js";

const links = [
  { href: "/#features", key: "landing.sectionFeatures" },
  { href: "/#how-it-works", key: "landing.sectionHow" },
  { href: "/#data", key: "landing.sectionData" },
  { href: "/#about", key: "landing.sectionAbout" },
];

/** Public website header (landing). Not authentication — app is open-access for now. */
export function PublicHeader() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2 text-content">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald text-white">
            <Sprout className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <span className="block text-base font-semibold">Krishi Mama</span>
            <span className="block text-[11px] text-muted">Climate Intelligence</span>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-muted md:flex" aria-label="Primary">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-content">
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <ThemeSwitcher />
          <Button href="/dashboard" size="sm" variant="primary">
            {t("landing.heroCta")}
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-line bg-surface px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-content hover:bg-surface-2"
              >
                {t(l.key)}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
            <Button href="/dashboard" size="sm" className="ml-auto">
              {t("landing.heroCta")}
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

/** Public footer. No fabricated stats, no testimonials. */
export function PublicFooter() {
  const { t } = useLang();
  return (
    <footer className="mt-20 bg-forest text-sidebar-text">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="text-lg font-semibold">{t("brand")}</p>
          <p className="mt-2 text-sm text-sidebar-muted">{t("tagline")}</p>
        </div>
        <div className="text-sm">
          <p className="font-medium">{t("landing.poweredByLabel")}</p>
          <ul className="mt-2 space-y-1 text-sidebar-muted">
            <li>NASA POWER · Agroclimatology Daily</li>
            <li>SMAP SPL3SMP_E · Soil Moisture</li>
            <li>GPM IMERG · Precipitation</li>
            <li>MODIS MOD13Q1 · Vegetation Indices</li>
          </ul>
        </div>
        <p className="max-w-xs text-xs text-sidebar-muted">{t("landing.footerRights")}</p>
      </div>
    </footer>
  );
}
