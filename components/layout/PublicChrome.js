"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { BrandMark } from "@/components/layout/BrandMark.js";
import { LanguageSwitcher, ThemeSwitcher } from "@/components/layout/Switchers.js";
import { Button } from "@/components/ui/Button.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";

const links = [
  { href: "/", key: "common.home" },
  { href: "/#features", key: "common.features" },
  { href: "/#data", key: "nav.dataSources" },
  { href: "/#how-it-works", key: "common.howItWorks" },
  { href: "/#about", key: "common.about" },
];

/** Public website header (landing). Not authentication — app is open-access for now. */
export function PublicHeader() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <BrandMark />

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
          <BrandMark tone="dark" />
          <p className="mt-3 text-sm text-sidebar-muted">{t("tagline")}</p>
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
