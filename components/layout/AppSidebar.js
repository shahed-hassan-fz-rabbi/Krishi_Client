"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  Database,
  History,
  Layers,
  LogOut,
  MapPin,
  Map as MapIcon,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ScanLine,
  Settings,
  Sprout,
  Trash2,
  UserRound,
  X,
  LayoutDashboard,
} from "lucide-react";

import { BrandMark } from "@/components/layout/BrandMark.js";
import { appNav } from "@/lib/nav.js";
import { isPrivatePath } from "@/lib/access.js";
import { LanguageSwitcher, ThemeSwitcher } from "@/components/layout/Switchers.js";
import { GlobalSearch } from "@/components/layout/GlobalSearch.js";
import { NotificationCenter } from "@/components/NotificationCenter.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { useAuth } from "@/contexts/AuthContext.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { useSidebar } from "@/contexts/SidebarContext.js";
import {
  fetchAssistantConversations,
  deleteAssistantConversation,
} from "@/services/api.js";

const icons = {
  "/dashboard": LayoutDashboard,
  "/my-farm": Sprout,
  "/rotation-planner": Sprout,
  "/crop-rotation": Sprout,
  "/assistant": MessageCircle,
  "/handoff": Layers,
  "/climate": ChartNoAxesCombined,
  "/map": MapIcon,
  "/crop-calendar": CalendarDays,
  "/data-sources": Database,
  "/settings": Settings,
};

function NavList({ onNavigate, isCollapsed = false }) {
  const pathname = usePathname();
  const { t } = useLang();
  const { user } = useAuth();
  const navigation = appNav
    .map((item) => !user && item.href === "/rotation-planner" ? { ...item, href: "/crop-rotation" } : item)
    .filter((item) => user || !isPrivatePath(item.href));

  return (
    <nav className={`space-y-1 ${isCollapsed ? "px-2 py-2" : "px-3 py-3"}`} aria-label="Application">
      {navigation.map(({ href, key }) => {
        const Icon = icons[href] || ScanLine;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        const label = t(key);

        if (isCollapsed) {
          return (
            <div key={href} className="group relative flex justify-center">
              <Link
                href={href}
                onClick={onNavigate}
                aria-label={label}
                title={label}
                aria-current={active ? "page" : undefined}
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                  active
                    ? "bg-white font-semibold text-forest shadow-sm ring-1 ring-white/15"
                    : "text-sidebar-text/80 hover:bg-sidebar-hover hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              </Link>
              {/* Tooltip on hover/focus in collapsed mode */}
              <div
                role="tooltip"
                className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex group-focus-within:flex items-center rounded-md bg-[#0d3122] px-2.5 py-1 text-xs font-medium text-white shadow-lg ring-1 ring-white/10 whitespace-nowrap"
              >
                {label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-[1px] border-4 border-transparent border-r-[#0d3122]" />
              </div>
            </div>
          );
        }

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
            <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarInner({
  onNavigate,
  showClose = false,
  onCloseMobile = null,
  isCollapsed = false,
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeChatId = searchParams.get("id");
  const { locale } = useLang();
  const { user, isAuthenticated, logout } = useAuth();
  const { toggleSidebar } = useSidebar();
  const isBn = locale === "bn";

  const [conversations, setConversations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(false);

  const loadConversations = useCallback(async (isCurrent = () => true) => {
    if (!isAuthenticated) {
      if (isCurrent()) {
        setConversations([]);
        setHistoryError(false);
      }
      return;
    }
    setLoadingHistory(true);
    if (isCurrent()) setHistoryError(false);
    try {
      const res = await fetchAssistantConversations();
      if (isCurrent() && res.success && res.data?.conversations) {
        setConversations(res.data.conversations);
      } else if (isCurrent()) {
        setHistoryError(true);
      }
    } catch {
      if (isCurrent()) setHistoryError(true);
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

  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-text select-none">
      {/* Brand Header & Toggle Button */}
      <div
        className={`border-b border-white/5 transition-all duration-200 ${
          isCollapsed
            ? "flex flex-col items-center justify-center py-2.5 px-2 gap-1.5"
            : "flex items-center justify-between px-4 py-3"
        }`}
      >
        {isCollapsed ? (
          <>
            <BrandMark compact />
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={isBn ? "সাইডবার প্রসারিত করুন" : "Expand sidebar"}
              title={isBn ? "সাইডবার প্রসারিত করুন" : "Expand sidebar"}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <BrandMark tone="dark" subtitleWrap />
            <div className="flex items-center gap-1">
              {showClose ? (
                <button
                  type="button"
                  onClick={onCloseMobile}
                  aria-label={isBn ? "মেনু বন্ধ করুন" : "Close menu"}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={toggleSidebar}
                  aria-label={isBn ? "সাইডবার ছোট করুন" : "Collapse sidebar"}
                  title={isBn ? "সাইডবার ছোট করুন" : "Collapse sidebar"}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Scrollable Center: Navigation + Chat History */}
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
        <NavList onNavigate={onNavigate} isCollapsed={isCollapsed} />

        {/* Chat History Section */}
        {isCollapsed ? (
          <div className="border-t border-white/10 pt-2 pb-1">
            <div className="group relative flex justify-center py-1">
              <Link
                href="/assistant"
                onClick={onNavigate}
                aria-label={isBn ? "চ্যাট হিস্ট্রি" : "Chat History"}
                title={isBn ? "চ্যাট হিস্ট্রি" : "Chat History"}
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                  pathname === "/assistant"
                    ? "bg-white font-semibold text-forest shadow-sm ring-1 ring-white/15"
                    : "text-sidebar-text/80 hover:bg-sidebar-hover hover:text-white"
                }`}
              >
                <History className="h-5 w-5 shrink-0" aria-hidden="true" />
              </Link>
              <div
                role="tooltip"
                className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex group-focus-within:flex items-center rounded-md bg-[#0d3122] px-2.5 py-1 text-xs font-medium text-white shadow-lg ring-1 ring-white/10 whitespace-nowrap"
              >
                {isBn ? "চ্যাট হিস্ট্রি" : "Chat History"}
                <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-[1px] border-4 border-transparent border-r-[#0d3122]" />
              </div>
            </div>
            {isAuthenticated && (
              <div className="group relative flex justify-center py-0.5">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.();
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("krishi:new-chat"));
                    }
                  }}
                  aria-label={isBn ? "নতুন চ্যাট" : "New Chat"}
                  title={isBn ? "নতুন চ্যাট" : "New Chat"}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                </button>
                <div
                  role="tooltip"
                  className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex group-focus-within:flex items-center rounded-md bg-[#0d3122] px-2.5 py-1 text-xs font-medium text-white shadow-lg ring-1 ring-white/10 whitespace-nowrap"
                >
                  {isBn ? "নতুন চ্যাট" : "New Chat"}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-[1px] border-4 border-transparent border-r-[#0d3122]" />
                </div>
              </div>
            )}
          </div>
        ) : (
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
                ) : historyError ? (
                  <div className="px-2 py-2 text-[11px] text-sidebar-muted">
                    <p>{isBn ? "আলোচনার ইতিহাস লোড করা যায়নি।" : "Chat history could not be loaded."}</p>
                    <button
                      type="button"
                      onClick={() => loadConversations()}
                      className="mt-1 font-semibold text-emerald-300 hover:text-white underline underline-offset-2"
                    >
                      {isBn ? "আবার চেষ্টা" : "Try again"}
                    </button>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="px-2 py-2 text-[11px] text-sidebar-muted/70">
                    {isBn ? "কোনো সংরক্ষিত আলোচনা নেই" : "No saved chats yet"}
                  </div>
                ) : (
                  conversations.slice(0, 8).map((c) => {
                    const isActive = pathname === "/assistant" && activeChatId === c._id;
                    const updatedAt = c.updatedAt && !Number.isNaN(new Date(c.updatedAt).getTime())
                      ? new Date(c.updatedAt)
                      : null;
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
                          <span className="block truncate">{c.title}</span>
                          {updatedAt ? (
                            <span className="block text-[10px] font-normal text-sidebar-muted/80">
                              {isBn ? "হালনাগাদ" : "Updated"} · {new Intl.DateTimeFormat(isBn ? "bn-BD" : "en", { dateStyle: "medium" }).format(updatedAt)}
                            </span>
                          ) : null}
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
        )}
      </div>

      {/* User Profile Section at Bottom */}
      {isCollapsed ? (
        <div className="border-t border-white/10 p-2 flex flex-col items-center gap-2">
          {isAuthenticated && user ? (
            <>
              <div className="group relative flex justify-center">
                <Link
                  href="/settings"
                  onClick={onNavigate}
                  aria-label={user.name || "User profile"}
                  title={user.name || "User profile"}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-xs font-semibold text-white ring-1 ring-emerald/30 hover:ring-emerald/60 transition-all cursor-pointer"
                >
                  {userInitial}
                </Link>
                <div
                  role="tooltip"
                  className="pointer-events-none absolute left-full ml-3 bottom-0 z-50 hidden group-hover:flex group-focus-within:flex flex-col rounded-md bg-[#0d3122] px-2.5 py-1.5 text-xs text-white shadow-lg ring-1 ring-white/10 whitespace-nowrap"
                >
                  <span className="font-semibold">{user.name}</span>
                  <span className="text-[11px] text-sidebar-muted">{user.email}</span>
                  <div className="absolute right-full bottom-2 -mr-[1px] border-4 border-transparent border-r-[#0d3122]" />
                </div>
              </div>
              <div className="group relative flex justify-center">
                <button
                  type="button"
                  onClick={logout}
                  aria-label={isBn ? "লগআউট" : "Log out"}
                  title={isBn ? "লগআউট" : "Log out"}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
                <div
                  role="tooltip"
                  className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex group-focus-within:flex items-center rounded-md bg-[#0d3122] px-2.5 py-1 text-xs font-medium text-white shadow-lg ring-1 ring-white/10 whitespace-nowrap"
                >
                  {isBn ? "লগআউট" : "Log out"}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-[1px] border-4 border-transparent border-r-[#0d3122]" />
                </div>
              </div>
            </>
          ) : (
            <div className="group relative flex justify-center">
              <Link
                href="/login"
                onClick={onNavigate}
                aria-label={isBn ? "লগইন করুন" : "Sign In"}
                title={isBn ? "লগইন করুন" : "Sign In"}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <UserRound className="h-4.5 w-4.5" />
              </Link>
              <div
                role="tooltip"
                className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex group-focus-within:flex items-center rounded-md bg-[#0d3122] px-2.5 py-1 text-xs font-medium text-white shadow-lg ring-1 ring-white/10 whitespace-nowrap"
              >
                {isBn ? "লগইন করুন" : "Sign In"}
                <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-[1px] border-4 border-transparent border-r-[#0d3122]" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border-t border-white/10 p-3">
          {isAuthenticated && user ? (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-white/5 p-2">
              <Link
                href="/settings"
                onClick={onNavigate}
                className="flex min-w-0 flex-1 items-center gap-2.5 hover:opacity-90 transition-opacity"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-semibold text-white ring-1 ring-emerald/30">
                  {userInitial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white">{user.name}</p>
                  <p className="truncate text-[11px] text-sidebar-muted">
                    {user.email || user.role || "Farmer"}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={logout}
                title={isBn ? "লগআউট" : "Log out"}
                aria-label={isBn ? "লগআউট" : "Log out"}
                className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={onNavigate}
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald/20 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald/30 transition-colors"
            >
              <UserRound className="h-4 w-4" />
              <span>{isBn ? "লগইন করুন" : "Sign In"}</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function DistrictContext() {
  const { currentDistrictObj, selectedDistrict } = useLocation();
  const { locale } = useLang();
  const districtName =
    locale === "bn"
      ? currentDistrictObj?.nameBn || currentDistrictObj?.nameEn || selectedDistrict
      : currentDistrictObj?.nameEn || selectedDistrict;

  return (
    <div className="hidden items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-sm font-medium text-content sm:flex">
      <MapPin className="h-4 w-4 shrink-0 text-emerald" aria-hidden="true" />
      <span className="max-w-36 truncate">{districtName}</span>
    </div>
  );
}

function ProfileMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t, locale } = useLang();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const closeFromOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!isAuthenticated || !user) {
    return (
      <Link
        href="/login"
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-line px-3 text-sm font-medium text-content transition-colors hover:bg-surface-2"
      >
        <UserRound className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t("auth.login")}</span>
      </Link>
    );
  }

  const initial = user.name?.trim()?.charAt(0)?.toUpperCase() || "U";
  const shortName = user.name?.trim()?.split(/\s+/).slice(0, 2).join(" ") || "User";
  const profileLabel =
    locale === "bn"
      ? `প্রোফাইল মেনু: ${user.name || "ব্যবহারকারী"}`
      : `Profile menu: ${user.name || "User"}`;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={profileLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        title={profileLabel}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-line/80 bg-surface pl-1 pr-2.5 text-content shadow-sm transition-all hover:border-emerald/25 hover:bg-surface-2 hover:shadow-km-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-xs font-semibold text-white ring-1 ring-emerald/25">
          {initial}
        </span>
        <span className="hidden max-w-20 truncate text-xs font-semibold sm:block">{shortName}</span>
        <ChevronRight className="h-3.5 w-3.5 rotate-90 text-muted" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={profileLabel}
          className="absolute right-0 top-full z-[60] mt-2 w-64 rounded-xl border border-line bg-surface p-2 text-content shadow-km-md"
        >
          <div className="border-b border-line px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <p className="mt-1 text-[11px] capitalize text-muted">{user.role || "farmer"}</p>
          </div>
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm hover:bg-surface-2 focus-visible:outline"
          >
            <Settings className="h-4 w-4 text-muted" aria-hidden="true" />
            {t("nav.settings")}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-danger-strong hover:bg-danger/10 focus-visible:outline"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t("auth.logout")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Desktop expandable and collapsible application sidebar */
export function AppSidebar() {
  const { isCollapsed } = useSidebar();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 hidden lg:block transition-[width] duration-200 ease-in-out ${
        isCollapsed ? "w-[72px]" : "w-[250px]"
      }`}
    >
      <SidebarInner isCollapsed={isCollapsed} />
    </aside>
  );
}

/** Persistent utility header and the mobile navigation drawer */
export function GlobalAppHeader() {
  const { locale } = useLang();
  const { isMobileOpen, openMobile, closeMobile } = useSidebar();
  const menuButtonRef = useRef(null);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!isMobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    const menuButton = menuButtonRef.current;
    document.body.style.overflow = "hidden";
    drawerRef.current
      ?.querySelector('button[aria-label="Close menu"], button[aria-label="মেনু বন্ধ করুন"]')
      ?.focus();
    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeMobile();
      if (event.key === "Tab" && drawerRef.current) {
        const focusable = [
          ...drawerRef.current.querySelectorAll("a[href], button:not([disabled])"),
        ];
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
  }, [isMobileOpen, closeMobile]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line/80 bg-surface/90 shadow-[0_4px_18px_-14px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-2 px-2 sm:h-[4.25rem] sm:gap-4 sm:px-6">
          <div className="flex min-w-0 shrink-0 items-center gap-3">
            <div className="lg:hidden">
              <BrandMark compact />
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <DistrictContext />
              <span className="hidden 2xl:block text-xs text-muted">
                {locale === "bn" ? "কৃষি জলবায়ু বুদ্ধিমত্তা" : "Agricultural climate intelligence"}
              </span>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 justify-center px-0.5 sm:px-2">
            <GlobalSearch />
          </div>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
            <NotificationCenter variant="toolbar" />
            <span className="mx-0.5 hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
            <LanguageSwitcher />
            <ThemeSwitcher variant="toolbar" className="rounded-xl" />
            <span className="mx-0.5 hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
            <ProfileMenu />
            <button
              type="button"
              ref={menuButtonRef}
              onClick={openMobile}
              aria-label={locale === "bn" ? "মেনু খুলুন" : "Open menu"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-content shadow-sm transition hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald lg:hidden"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {isMobileOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={locale === "bn" ? "নেভিগেশন মেনু" : "Navigation menu"}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={closeMobile}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            className="absolute inset-y-0 left-0 w-[min(18rem,calc(100vw-2.5rem))] shadow-xl"
          >
            <SidebarInner
              showClose
              onNavigate={closeMobile}
              onCloseMobile={closeMobile}
              isCollapsed={false}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
