"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Bot,
  CalendarRange,
  ChevronRight,
  CloudRain,
  Database,
  Droplets,
  History,
  Leaf,
  LogOut,
  Map as MapIcon,
  Menu,
  MessageSquare,
  Plus,
  ScanLine,
  Settings,
  Sprout,
  Tractor,
  Trash2,
  User as UserIcon,
  Wheat,
  X,
} from "lucide-react";

import { BrandMark } from "@/components/layout/BrandMark.js";
import { appNav } from "@/lib/nav.js";
import { LanguageSwitcher, ThemeSwitcher } from "@/components/layout/Switchers.js";
import { NotificationCenter } from "@/components/NotificationCenter.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { useAuth } from "@/contexts/AuthContext.js";
import {
  fetchAssistantConversations,
  deleteAssistantConversation,
} from "@/services/api.js";

const icons = {
  "/dashboard": Sprout,
  "/my-farm": Tractor,
  "/assistant": Bot,
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
    <nav className="space-y-1 px-3 py-3" aria-label="Application">
      {appNav.map(({ href, key }) => {
        const Icon = icons[href] || ScanLine;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              active
                ? "bg-white font-semibold text-forest shadow-sm ring-1 ring-white/15"
                : "text-sidebar-text/80 hover:bg-sidebar-hover hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarInner({ onNavigate, showClose = false, onCloseMobile = null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeChatId = searchParams.get("id");
  const { t, locale } = useLang();
  const { user, isAuthenticated, logout } = useAuth();
  const isBn = locale === "bn";

  const [conversations, setConversations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadConversations = useCallback(async (isCurrent = () => true) => {
    if (!isAuthenticated) {
      if (isCurrent()) setConversations([]);
      return;
    }
    setLoadingHistory(true);
    try {
      const res = await fetchAssistantConversations();
      if (isCurrent() && res.success && res.data?.conversations) {
        setConversations(res.data.conversations);
      }
    } catch {
      // Ignore network errors in sidebar
    } finally {
      if (isCurrent()) setLoadingHistory(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let isActive = true;
    Promise.resolve().then(() => {
      if (isActive) loadConversations(() => isActive);
    });
    return () => {
      isActive = false;
    };
  }, [loadConversations]);

  // Listen for chat updates from Assistant page
  useEffect(() => {
    const handleUpdate = () => loadConversations();
    window.addEventListener("krishi:chat-updated", handleUpdate);
    return () => {
      window.removeEventListener("krishi:chat-updated", handleUpdate);
    };
  }, [loadConversations]);

  const handleDeleteConversation = async (e, convId) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmText = isBn
      ? "আপনি কি নিশ্চিত যে এই আলোচনা মুছে ফেলতে চান?"
      : "Are you sure you want to delete this conversation?";

    if (typeof window !== "undefined" && !window.confirm(confirmText)) {
      return;
    }

    try {
      const res = await deleteAssistantConversation(convId);
      if (res.success) {
        setConversations((prev) => prev.filter((c) => c._id !== convId));
        window.dispatchEvent(
          new CustomEvent("krishi:chat-deleted", { detail: { id: convId } })
        );
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-text">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-white/5">
        <BrandMark />
        <div className="flex items-center gap-1.5">
          <NotificationCenter variant="dark" />
          {showClose ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label={isBn ? "মেনু বন্ধ করুন" : "Close menu"}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Scrollable Center: Navigation + Chat History */}
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
        <NavList onNavigate={onNavigate} />

        {/* Chat History Section */}
        <div className="px-3 py-3 border-t border-white/10">
          <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-semibold text-sidebar-muted uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              <span>{isBn ? "চ্যাট হিস্ট্রি" : "Chat History"}</span>
            </span>
            {isAuthenticated && (
              <Link
                href="/assistant"
                onClick={() => {
                  onNavigate?.();
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("krishi:new-chat"));
                  }
                }}
                title={isBn ? "নতুন চ্যাট" : "New Chat"}
                aria-label={isBn ? "নতুন চ্যাট" : "New Chat"}
                className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {isAuthenticated ? (
            <div className="space-y-1">
              {loadingHistory && conversations.length === 0 ? (
                <div className="px-2 py-2 text-[11px] text-sidebar-muted animate-pulse">
                  {isBn ? "লোড হচ্ছে..." : "Loading history..."}
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-2 py-2 text-[11px] text-sidebar-muted/70">
                  {isBn ? "কোনো সংরক্ষিত আলোচনা নেই" : "No saved chats yet"}
                </div>
              ) : (
                conversations.slice(0, 8).map((c) => {
                  const isActive = pathname === "/assistant" && activeChatId === c._id;
                  return (
                    <div
                      key={c._id}
                      className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                        isActive
                          ? "bg-white/15 font-semibold text-white shadow-2xs"
                          : "text-sidebar-text/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Link
                        href={`/assistant?id=${c._id}`}
                        onClick={onNavigate}
                        className="min-w-0 flex-1 truncate pr-1"
                        title={c.title}
                      >
                        {c.title}
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteConversation(e, c._id)}
                        title={isBn ? "মুছে ফেলুন" : "Delete"}
                        aria-label={isBn ? "মুছে ফেলুন" : "Delete"}
                        className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-rose-400 transition-opacity cursor-pointer shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-sidebar-muted">
              <p className="leading-snug">
                {isBn
                  ? "স্থায়ীভাবে চ্যাট সংরক্ষণ ও আগের আলোচনা দেখতে লগইন করুন।"
                  : "Sign in to save chat history permanently across sessions."}
              </p>
              <Link
                href="/login"
                onClick={onNavigate}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <span>{isBn ? "লগইন করুন" : "Sign In"}</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      </div>


      {/* User Profile & Account Footer */}
      <div className="border-t border-white/10 px-3 py-3">
        {isAuthenticated && user ? (
          <div className="mb-2.5 rounded-xl bg-white/5 p-2.5 border border-white/10">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald text-white text-xs font-bold shadow-2xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="min-w-0 truncate">
                  <p className="truncate text-xs font-semibold text-white">{user.name}</p>
                  <p className="truncate text-[10px] text-sidebar-muted">{user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                title={t("auth.logout")}
                aria-label={t("auth.logout")}
                className="shrink-0 rounded p-1 text-white/60 hover:bg-white/10 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-sidebar-muted pt-1.5 border-t border-white/5">
              <span className="rounded bg-white/10 px-1.5 py-0.5 uppercase tracking-wide text-white/80 font-medium">
                {user.role || "farmer"}
              </span>
              <span className="capitalize">{user.preferredDistrict || "cumilla"}</span>
            </div>
          </div>
        ) : (
          <div className="mb-2.5">
            <Link
              href="/login"
              onClick={onNavigate}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2 text-xs font-semibold text-white transition-all shadow-2xs"
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span>{t("auth.login")} / {t("auth.register")}</span>
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 px-1">
          <LanguageSwitcher variant="dark" />
          <ThemeSwitcher variant="dark" />
        </div>
      </div>
    </div>
  );
}

/** Desktop-fixed sidebar */
export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
      <SidebarInner />
    </aside>
  );
}

/** Mobile top bar with hamburger overlay sidebar */
export function MobileTopbar() {
  const { t, locale } = useLang();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    const menuButton = menuButtonRef.current;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector('button[aria-label="Close menu"], button[aria-label="মেনু বন্ধ করুন"]')?.focus();
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab" && drawerRef.current) {
        const focusable = [...drawerRef.current.querySelectorAll('a[href], button:not([disabled])')];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      (menuButton || previousFocus)?.focus?.();
    };
  }, [open]);

  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <BrandMark compact />
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <LanguageSwitcher />
          <ThemeSwitcher />
          <button
            type="button"
            ref={menuButtonRef}
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-content hover:bg-surface-hover cursor-pointer"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={locale === "bn" ? "নেভিগেশন মেনু" : "Navigation menu"}>
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div ref={drawerRef} className="absolute inset-y-0 left-0 w-[min(18rem,calc(100vw-2.5rem))] shadow-xl">
            <SidebarInner
              showClose
              onNavigate={() => setOpen(false)}
              onCloseMobile={() => setOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="sr-only">{t("common.defaultDistrict")}</div>
    </>
  );
}
