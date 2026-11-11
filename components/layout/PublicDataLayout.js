"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PublicHeader, PublicFooter } from "@/components/layout/PublicChrome.js";
import { AppShell } from "@/components/layout/AppShell.js";
import { useAuth } from "@/contexts/AuthContext.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";

const dataLinks = [
  { href: "/climate", key: "publicData.temperature" },
  { href: "/rainfall", key: "publicData.rainfall" },
  { href: "/soil-moisture", key: "publicData.soil" },
  { href: "/vegetation", key: "publicData.vegetation" },
  { href: "/map", key: "publicData.map" },
  { href: "/crop-calendar", key: "publicData.calendar" },
  { href: "/data-sources", key: "publicData.sources" },
];

function PublicRecordsShell({ children }) {
  const pathname = usePathname();
  const { t } = useLang();
  return <div className="flex min-h-screen flex-col bg-bg">
    <PublicHeader />
    <div className="border-b border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <p className="text-2xl font-semibold text-content">{t("publicHeader.climateData")}</p>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{t("publicData.intro")}</p>
        <nav aria-label={t("publicHeader.climateData")} className="mt-6 flex gap-5 overflow-x-auto">
          {dataLinks.map(({ href, key }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={`shrink-0 border-b-2 pb-3 text-sm font-medium transition-colors ${pathname === href ? "border-emerald text-emerald-strong" : "border-transparent text-muted hover:text-content"}`}>{t(key)}</Link>)}
        </nav>
      </div>
    </div>
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    <PublicFooter />
  </div>;
}

/** Keep records public, with workspace navigation for signed-in farmers. */
export function PublicDataLayout({ children }) {
  const { user } = useAuth();
  const Shell = user ? AppShell : PublicRecordsShell;
  return <Shell>{children}</Shell>;
}
