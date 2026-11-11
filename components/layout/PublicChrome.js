"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bookmark,
  ChevronDown,
  LogOut,
  Menu,
  MessageSquareText,
  Settings2,
  SlidersHorizontal,
  Sprout,
  UserRound,
  X,
} from "lucide-react";


import { BrandMark } from "@/components/layout/BrandMark.js";
import { NotificationCenter } from "@/components/NotificationCenter.js";
import { LanguageSwitcher, ThemeSwitcher } from "@/components/layout/Switchers.js";
import { Button } from "@/components/ui/Button.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { useAuth } from "@/contexts/AuthContext.js";

const links = [
  { href: "/", key: "common.home" },
  { href: "/crop-rotation", key: "publicHeader.cropRotation" },
  { href: "/climate", key: "publicHeader.climateData" },
  { href: "/#how-it-works", key: "common.howItWorks" },
  { href: "/#about", key: "common.about" },
];

const authLinks = [
  { href: "/login", key: "auth.login" },
];

function subscribeHash(callback) {
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
  };
}
const getHash = () => window.location.hash;
const getServerHash = () => "";

/** Public navigation with one guest sign-in action and an authenticated account menu. */
export function PublicHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const hash = useSyncExternalStore(subscribeHash, getHash, getServerHash);
  const isActive = (href) => {
    if (href.includes("#")) return pathname === "/" && hash === href.slice(1);
    if (href === "/") return pathname === "/" && !["#about", "#how-it-works"].includes(hash);
    if (href === "/climate") return ["/climate", "/rainfall", "/soil-moisture", "/vegetation", "/map", "/crop-calendar", "/data-sources"].includes(pathname);
    return pathname === href || pathname?.startsWith(`${href}/`);
  };
  const navClass = (href) => `rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald ${isActive(href) ? "bg-[#14532d] text-white hover:bg-[#14532d]" : "text-content hover:bg-surface-2"}`;
  const handleNavClick = (event, href) => {
    setOpen(false);
    if (pathname === "/" && href.startsWith("/#") && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      window.location.assign(href);
    }
  };
  const { t, locale } = useLang();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!profileOpen) return;
    const closeOnOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen]);

  const handleLogout = async () => {
    setProfileOpen(false);
    setOpen(false);
    await logout();
    router.push("/");
  };

  const displayName = user?.name?.trim() || user?.email || t("publicHeader.account");
  const avatarInitial = displayName.charAt(0).toLocaleUpperCase(locale === "bn" ? "bn-BD" : "en-US");
  const profileItems = [
    { href: "/settings", label: t("publicHeader.myProfile"), Icon: UserRound },
    { href: "/my-farm", label: t("nav.myFarm"), Icon: Sprout },
    { href: "/assistant", label: t("publicHeader.chatHistory"), Icon: MessageSquareText },
    { disabled: true, label: t("publicHeader.savedAdvisories"), Icon: Bookmark },
    { href: "/settings", label: t("publicHeader.alertPreferences"), Icon: SlidersHorizontal },
    { href: "/settings", label: t("publicHeader.accountSettings"), Icon: Settings2 },
  ];

  const dashboardLabel = isAuthenticated
    ? t("publicHeader.myDashboard")
    : t("publicHeader.exploreDashboard");

  const renderProfileItems = (onNavigate = () => {}) => (
    <>
      {profileItems.map(({ href, label, Icon, disabled }) => (
        disabled ? (
          <span
            key={label}
            role="menuitem"
            aria-disabled="true"
            title={t("publicHeader.unavailable")}
            className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted/70"
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
            <span className="min-w-0 flex-1">{label}</span>
            <span className="text-[10px]">{t("publicHeader.soon")}</span>
          </span>
        ) : (
          <Link
            key={label}
            href={href}
            role="menuitem"
            onClick={onNavigate}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-content transition-colors hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald"
          >
            <Icon className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        )
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur-sm shadow-km-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandMark tone="light" />

        <nav className="hidden items-center gap-1 whitespace-nowrap text-sm font-medium text-muted xl:flex" aria-label="Primary">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={(event) => handleNavClick(event, l.href)} aria-current={isActive(l.href) ? (l.href.includes("#") ? "location" : "page") : undefined} className={navClass(l.href)}>
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 lg:gap-3">
          <div className="hidden items-center gap-3 xl:flex">
            <LanguageSwitcher />
            <ThemeSwitcher />
            <div className="h-6 w-px bg-line" />
            <div className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <>
                  <Button href="/dashboard" size="sm" variant="primary" className="whitespace-nowrap">
                    {dashboardLabel}
                  </Button>
                  <div className="relative" ref={profileRef}>
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={profileOpen}
                      aria-label={t("publicHeader.profileMenu")}
                      onClick={() => setProfileOpen((value) => !value)}
                      className="inline-flex h-10 max-w-48 items-center gap-2 rounded-full border border-line bg-surface px-1.5 pr-2.5 text-sm text-content shadow-km-sm transition-colors hover:border-emerald/40 hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-semibold text-white">
                        {avatarInitial}
                      </span>
                      <span className="max-w-28 truncate text-xs font-medium">{displayName}</span>
                      <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform ${profileOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                    </button>
                    {profileOpen ? (
                      <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-line bg-surface p-2 shadow-xl">
                        <div className="mb-2 border-b border-line px-3 py-2">
                          <p className="truncate text-sm font-semibold text-content">{displayName}</p>
                          {user.email ? <p className="truncate text-xs text-muted">{user.email}</p> : null}
                        </div>
                        {renderProfileItems(() => setProfileOpen(false))}
                        <div className="my-1 border-t border-line" />
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald"
                        >
                          <LogOut className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                          {t("auth.logout")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : !isLoading ? (
                  <Button href="/login" size="sm" variant="primary">
                    {t("auth.login")}
                  </Button>
              ) : null}
            </div>
          </div>
          {isAuthenticated && user ? <NotificationCenter /> : null}
          <div className="flex items-center gap-2 xl:hidden">
            <button
              type="button"
              aria-expanded={open}
              aria-controls="public-mobile-navigation"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface"
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
        </div>
      </div>

      {open ? (
        <div className="border-t border-line bg-surface px-4 py-4 xl:hidden">
          <nav id="public-mobile-navigation" className="flex flex-col gap-1" aria-label="Mobile">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={(event) => handleNavClick(event, l.href)}
                aria-current={isActive(l.href) ? (l.href.includes("#") ? "location" : "page") : undefined}
                className={navClass(l.href)}
              >
                {t(l.key)}
              </Link>
            ))}
            {isAuthenticated && user ? (
              <div className="my-2 rounded-xl border border-line bg-surface-2 p-3">
                <div className="mb-2 flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white">{avatarInitial}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-content">{displayName}</p>
                    {user.email ? <p className="truncate text-xs text-muted">{user.email}</p> : null}
                  </div>
                </div>
                <div className="grid gap-0.5">{renderProfileItems(() => setOpen(false))}</div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-danger/5"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {t("auth.logout")}
                </button>
              </div>
            ) : !isLoading ? (
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
            ) : null}
          </nav>
          <div className="mt-6 flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
          {isAuthenticated && user ? <div className="mt-4 flex flex-col gap-2">
            <Button href="/dashboard" size="sm" className="w-full">
              {dashboardLabel}
            </Button>
          </div> : null}
        </div>
      ) : null}
    </header>
  );
}

/** Public footer. */
export function PublicFooter() {
  const { t } = useLang();

  return (
    <footer className="relative isolate overflow-hidden border-t border-emerald-900/35 bg-gradient-to-b from-[#03261a] via-[#021f15] to-[#01140e] text-sidebar-text">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(52,211,153,0.12),transparent_60%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.08),transparent_50%)]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 sm:pb-28 lg:px-8 lg:pt-14">
        <div className="grid gap-10 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-16 lg:gap-24 items-start">
          <div className="space-y-4">
            <BrandMark tone="dark" />
            <p className="max-w-md text-sm leading-relaxed text-[#c0d2c5] font-normal">{t("footer.description")}</p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/50 px-3 py-1.5 text-xs text-emerald-200/90 shadow-2xs backdrop-blur-xs">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="font-medium">{t("footer.dataFromNasa")}</span>
                <span className="text-emerald-500/40">•</span>
                <span className="text-emerald-300/80">{t("footer.planningNote")}</span>
              </div>
            </div>
          </div>

          <div className="sm:min-w-44 sm:justify-self-end">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-300/90">{t("footer.explore")}</h3>
            <div aria-hidden="true" className="mb-4 h-0.5 w-10 rounded-full bg-gradient-to-r from-emerald-400 to-[#a3cb70]" />
            <ul className="space-y-2.5 text-sm text-[#c0d2c5]">
              {links.map(({ href, key }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-2 rounded-md transition-all duration-200 hover:translate-x-1 hover:text-[#c2e994] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2e994]"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/40 transition-colors group-hover:bg-[#c2e994]" aria-hidden="true" />
                    <span>{t(key)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-[url('/images/footer-landscape.svg')] bg-[length:100%_100%] bg-no-repeat opacity-40 sm:h-20" />
      </div>
      <div className="border-t border-emerald-900/40 bg-black/30 px-4 py-4 text-xs leading-relaxed text-[#c0d2c5] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p>{t("footer.copyright")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-[#a4bba9]">
            <span>{t("footer.dataFromNasa")}</span>
            <span>•</span>
            <span>BARC & BMD Data Integration</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
