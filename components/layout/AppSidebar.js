"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarRange,
  CloudRain,
  Database,
  Droplets,
  Leaf,
  Map as MapIcon,
  Menu,
  ScanLine,
  Settings,
  Sprout,
  Wheat,
  X,
} from "lucide-react";

import { BrandMark } from "@/components/layout/BrandMark.js";
import { appNav } from "@/lib/nav.js";
import { LanguageSwitcher, ThemeSwitcher } from "@/components/layout/Switchers.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";

const icons = {
  "/dashboard": Sprout,
  "/handoff": Wheat,
  "/climate": BarChart3,
  "/rainfall": CloudRain,
  "/soil-moisture": Droplets,
  "/vegetation": Leaf,
  "/map": MapIcon,
  "/crop-calendar": CalendarRange,
  "/data-sources": Database,
  "/settings": Settings,
};

function NavList({ onNavigate }) {
  const pathname = usePathname();
  const { t } = useLang();

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Application">
      {appNav.map(({ href, key }) => {
        const Icon = icons[href] || ScanLine;
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              active
                ? "bg-sidebar-hover font-medium text-white"
                : "text-sidebar-text/80 hover:bg-sidebar-hover hover:text-white"
            }`}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarInner({ onNavigate, showClose = false, onCloseMobile = null }) {
  const { t } = useLang();
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-text">
      <div className="flex items-center justify-between px-4 pt-5 pb-2">
        <BrandMark />
        {showClose ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <NavList onNavigate={onNavigate} />
      <div className="border-t border-white/10 px-3 py-3">
        <p className="px-2 pb-2 text-[10px] tracking-wide text-sidebar-muted uppercase">
          {t("common.defaultDistrict")}
        </p>
        <div className="flex items-center gap-2 px-2">
          <LanguageSwitcher variant="dark" />
          <ThemeSwitcher variant="dark" />
        </div>
      </div>
    </div>
  );
}

/** Desktop-fixed + mobile-overlay sidebar. Chattogram is the fixed default target. */
export function AppSidebar() {
  return <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{<SidebarInner />}</aside>;
}

/** Mobile top bar with hamburger overlay sidebar. */
export function MobileTopbar() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <BrandMark compact />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-content"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-km-md">
            <SidebarInner showClose onNavigate={() => setOpen(false)} onCloseMobile={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="sr-only">{t("common.defaultDistrict")}</div>
    </>
  );
}
