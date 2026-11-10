"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  ArrowRight,
  Check,
  CheckCheck,
  Clock,
  Calendar,
  AlertTriangle,
  Sprout,
  Info,
  X,
  Tractor,
  Loader2,
} from "lucide-react";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/services/api.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { useAuth } from "@/contexts/AuthContext.js";

export function NotificationCenter({ variant = "default" }) {
  const { t, lang } = useLang();
  const { isAuthenticated } = useAuth();
  const isBn = lang === "bn";

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const containerRef = useRef(null);

  // Load unread count on mount or auth change
  const refreshUnreadCount = useCallback(async (isCurrent = () => true) => {
    if (!isAuthenticated) return;
    try {
      const res = await fetchUnreadNotificationCount();
      if (isCurrent() && res.success && res.data) {
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // ignore network errors
    }
  }, [isAuthenticated]);

  // Load notification items
  const loadNotifications = useCallback(async (isCurrent = () => true) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await fetchNotifications({ unreadOnly: filterUnread });
      if (!isCurrent()) return;
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        if (typeof res.data.pagination?.unreadCount === "number") {
          setUnreadCount(res.data.pagination.unreadCount);
        }
      }
    } catch (err) {
      if (isCurrent()) console.error("Failed to load notifications:", err);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [isAuthenticated, filterUnread]);

  useEffect(() => {
    let isActive = true;
    Promise.resolve().then(() => {
      if (isActive) refreshUnreadCount(() => isActive);
    });
    const interval = setInterval(() => refreshUnreadCount(() => isActive), 45000); // 45s poll
    const handleUpdate = () => refreshUnreadCount(() => isActive);
    window.addEventListener("krishi:notification-update", handleUpdate);
    return () => {
      isActive = false;
      clearInterval(interval);
      window.removeEventListener("krishi:notification-update", handleUpdate);
    };
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (!isOpen) return;
    let isActive = true;
    Promise.resolve().then(() => {
      if (isActive) loadNotifications(() => isActive);
    });
    return () => {
      isActive = false;
    };
  }, [isOpen, loadNotifications]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await markNotificationRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await deleteNotification(id);
      if (res.success) {
        const item = notifications.find((n) => n._id === id);
        if (item && !item.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  if (!isAuthenticated) return null;

  const isDarkVariant = variant === "dark";

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t("myFarm.notifications.title")}
        aria-expanded={isOpen}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors cursor-pointer ${
          isDarkVariant
            ? "border border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
            : variant === "toolbar"
              ? "border border-transparent text-muted hover:bg-surface-2 hover:text-content"
              : "border border-line text-content hover:bg-surface-hover"
        }`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {/* Popover Dropdown */}
      {isOpen ? (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-2xl border border-line bg-surface p-0 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-content">
                {t("myFarm.notifications.title")}
              </span>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  {unreadCount} {t("myFarm.notifications.unread")}
                </span>
              ) : null}
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover font-medium cursor-pointer transition-colors"
                title={t("myFarm.notifications.markAllRead")}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>{t("myFarm.notifications.markAllRead")}</span>
              </button>
            ) : null}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 border-b border-line/60 px-4 py-2 bg-surface-muted/30">
            <button
              type="button"
              onClick={() => setFilterUnread(false)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                !filterUnread
                  ? "bg-primary text-white shadow-xs"
                  : "text-content-muted hover:text-content hover:bg-surface-hover"
              }`}
            >
              {t("myFarm.notifications.all")}
            </button>
            <button
              type="button"
              onClick={() => setFilterUnread(true)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                filterUnread
                  ? "bg-primary text-white shadow-xs"
                  : "text-content-muted hover:text-content hover:bg-surface-hover"
              }`}
            >
              {t("myFarm.notifications.unread")} ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-line/40">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-content-muted gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-xs">{isBn ? "নোটিফিকেশন লোড হচ্ছে..." : "Loading notifications..."}</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                  <Check className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-content">
                  {t("myFarm.notifications.noNotifications")}
                </p>
                <p className="text-[11px] text-content-muted mt-0.5">
                  {t("myFarm.notifications.allCaughtUp")}
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isOverdue = item.type === "ACTIVITY_OVERDUE";
                const isDueToday = item.type === "ACTIVITY_DUE_TODAY";
                const isStage = item.type === "LIFECYCLE_STAGE_UPCOMING";
                const farmIdStr = item.farmId?._id || item.farmId;
                const farmName = item.farmId?.name || (isBn ? "খামার" : "Farm");

                return (
                  <div
                    key={item._id}
                    className={`p-3.5 transition-colors hover:bg-surface-hover flex gap-3 items-start relative group ${
                      !item.isRead ? "bg-primary/5" : ""
                    }`}
                  >
                    {/* Category Icon */}
                    <div
                      className={`h-8 w-8 rounded-xl flex shrink-0 items-center justify-center mt-0.5 ${
                        isOverdue
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          : isDueToday
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : isStage
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {isOverdue ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : isDueToday ? (
                        <Clock className="h-4 w-4" />
                      ) : isStage ? (
                        <Sprout className="h-4 w-4" />
                      ) : (
                        <Calendar className="h-4 w-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-content-muted">
                          <Tractor className="h-2.5 w-2.5" />
                          <span>{farmName}</span>
                        </span>
                        {item.scheduledFor ? (
                          <span className="text-[10px] text-content-muted">
                            • {item.scheduledFor}
                          </span>
                        ) : null}
                      </div>

                      <p className="text-xs font-semibold text-content mt-1 leading-snug">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-content-muted mt-0.5 leading-relaxed">
                        {item.message}
                      </p>

                      {/* Action Links */}
                      <div className="mt-2 flex items-center gap-3 text-xs">
                        {farmIdStr ? (
                          <Link
                            href={`/my-farm/${farmIdStr}`}
                            onClick={() => setIsOpen(false)}
                            className="font-medium text-primary hover:underline"
                          >
                            {t("myFarm.notifications.viewFarm")}
                            <ArrowRight className="ml-1 inline h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
                          </Link>
                        ) : null}

                        {!item.isRead ? (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(item._id, e)}
                            className="text-[11px] text-content-muted hover:text-content font-medium cursor-pointer"
                          >
                            {isBn ? "পড়া হয়েছে" : "Mark read"}
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Dismiss Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(item._id, e)}
                      title={t("myFarm.notifications.dismiss")}
                      aria-label={t("myFarm.notifications.dismiss")}
                      className="opacity-0 group-hover:opacity-100 p-1 text-content-muted hover:text-rose-500 transition-opacity cursor-pointer shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
