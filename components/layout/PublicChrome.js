"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { BrandMark } from "@/components/layout/BrandMark.js";
import { LanguageSwitcher, ThemeSwitcher } from "@/components/layout/Switchers.js";
import { Button } from "@/components/ui/Button.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { useAuth } from "@/contexts/AuthContext.js";

const links = [
  { href: "/#features", key: "common.features" },
  { href: "/#how-it-works", key: "common.howItWorks" },
  { href: "/#data", key: "nav.dataSources" },
  { href: "/#about", key: "common.about" },
];

const authLinks = [
  { href: "/login", key: "auth.login" },
  { href: "/register", key: "auth.register" },
];

/** Public website header (landing). Not authentication — app is open-access for now. */
export function PublicHeader() {
  const { t, locale } = useLang();
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur-sm shadow-km-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandMark />

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex lg:gap-10" aria-label="Primary">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-content">
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <ThemeSwitcher />
          <div className="h-6 w-px bg-line" />
          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-2 px-2 text-xs">
                <span className="font-medium text-content">{user.name}</span>
                <span className="rounded bg-emerald/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald uppercase tracking-wider">
                  {user.role}
                </span>
              </div>
              <Button href="/dashboard" size="sm" variant="outline">
                {t("nav.dashboard")}
              </Button>
              <Button onClick={logout} size="sm" variant="ghost">
                {t("auth.logout")}
              </Button>
            </>
          ) : (
            <>
              <Button href="/login" size="sm" variant="ghost">
                {t("auth.login")}
              </Button>
              <Button href="/register" size="sm" variant="primary">
                {t("auth.register")}
              </Button>
              <Button href="/dashboard" size="sm" variant="outline">
                {t("nav.dashboard")}
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="public-mobile-navigation"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface md:hidden"
          aria-label={
            open
              ? locale === "bn" ? "মেনু বন্ধ করুন" : "Close menu"
              : locale === "bn" ? "মেনু খুলুন" : "Open menu"
          }
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-line bg-surface px-4 py-4 md:hidden">
          <nav id="public-mobile-navigation" className="flex flex-col gap-1" aria-label="Mobile">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-content hover:bg-surface-2"
              >
                {t(l.key)}
              </Link>
            ))}
            {isAuthenticated && user ? (
              <div className="my-2 rounded-lg bg-surface-2 p-3 text-xs">
                <p className="font-semibold text-content">{user.name}</p>
                <p className="text-muted">{user.email}</p>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="mt-2 text-xs font-medium text-danger hover:underline"
                >
                  {t("auth.logout")}
                </button>
              </div>
            ) : (
              authLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-content hover:bg-surface-2"
                >
                  {t(l.key)}
                </Link>
              ))
            )}
          </nav>
          <div className="mt-6 flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Button href="/dashboard" size="sm" className="w-full">
              {t("nav.dashboard")}
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
    <footer className="bg-forest text-sidebar-text">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <BrandMark tone="dark" />
            <p className="text-sm text-sidebar-muted leading-relaxed">{t("tagline")}</p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-sidebar-text">{t("footer.platform")}</h3>
            <ul className="space-y-2 text-sm text-sidebar-muted">
              <li>
                <Link href="/#features" className="hover:text-sidebar-text transition-colors">
                  {t("common.features")}
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-sidebar-text transition-colors">
                  {t("common.howItWorks")}
                </Link>
              </li>
              <li>
                <Link href="/#data" className="hover:text-sidebar-text transition-colors">
                  {t("nav.dataSources")}
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-sidebar-text transition-colors">
                  {t("common.about")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-sidebar-text">{t("footer.features")}</h3>
            <ul className="space-y-2 text-sm text-sidebar-muted">
              <li>
                <Link href="/climate" className="hover:text-sidebar-text transition-colors">
                  {t("nav.climate")}
                </Link>
              </li>
              <li>
                <Link href="/rainfall" className="hover:text-sidebar-text transition-colors">
                  {t("nav.rainfall")}
                </Link>
              </li>
              <li>
                <Link href="/soil-moisture" className="hover:text-sidebar-text transition-colors">
                  {t("nav.soilMoisture")}
                </Link>
              </li>
              <li>
                <Link href="/vegetation" className="hover:text-sidebar-text transition-colors">
                  {t("nav.vegetation")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-sidebar-text">{t("footer.account")}</h3>
            <ul className="space-y-2 text-sm text-sidebar-muted">
              <li>
                <Link href="/login" className="hover:text-sidebar-text transition-colors">
                  {t("auth.login")}
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-sidebar-text transition-colors">
                  {t("auth.register")}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-sidebar-text transition-colors">
                  {t("nav.dashboard")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Data sources */}
        <div className="mt-12 border-t border-sidebar-hover pt-8">
          <h3 className="mb-4 text-sm font-semibold text-sidebar-text">{t("landing.poweredByLabel")}</h3>
          <div className="grid gap-2 text-sm text-sidebar-muted sm:grid-cols-2 lg:grid-cols-4">
            <p>NASA POWER · Agroclimatology Daily</p>
            <p>SMAP SPL3SMP_E · historical observations</p>
            <p>GPM IMERG V07 · historical observations</p>
            <p>MODIS MOD13Q1 · 16-day composites</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-sidebar-hover pt-8 text-xs text-sidebar-muted">
          <p>{t("landing.footerRights")}</p>
        </div>
      </div>
    </footer>
  );
}
