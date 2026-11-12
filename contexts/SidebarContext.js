"use client";

import { createContext, useContext, useSyncExternalStore, useCallback } from "react";

const STORAGE_KEY = "km_sidebar_collapsed";
const GUEST_STORAGE_KEY = `${STORAGE_KEY}_guest`;
const subscribers = new Set();

let collapsedOverride = null;
let collapsedOverrideKey = null;
let mobileOpenOverride = null;

function notifySubscribers() {
  subscribers.forEach((subscriber) => subscriber());
}

function subscribe(subscriber) {
  if (typeof window === "undefined") return () => {};

  subscribers.add(subscriber);
  const handleStorage = (event) => {
    if (!event.key || event.key === STORAGE_KEY || event.key === GUEST_STORAGE_KEY) {
      collapsedOverride = null;
      collapsedOverrideKey = null;
      notifySubscribers();
    }
  };
  const handleNavigation = () => {
    collapsedOverride = null;
    mobileOpenOverride = null;
    notifySubscribers();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener("popstate", handleNavigation);

  return () => {
    subscribers.delete(subscriber);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("popstate", handleNavigation);
  };
}

function getCollapsedSnapshot(defaultCollapsed = false) {
  const storageKey = defaultCollapsed ? GUEST_STORAGE_KEY : STORAGE_KEY;
  if (collapsedOverrideKey === storageKey && collapsedOverride !== null) return collapsedOverride;
  if (typeof window === "undefined") return false;

  try {
    const urlValue = new URLSearchParams(window.location.search).get("sidebar");
    if (urlValue === "collapsed") return true;
    if (urlValue === "expanded") return false;

    const saved = window.localStorage.getItem(storageKey);
    return saved === null ? defaultCollapsed : saved === "true";
  } catch {
    return false;
  }
}

function getMobileOpenSnapshot() {
  if (mobileOpenOverride !== null) return mobileOpenOverride;
  if (typeof window === "undefined") return false;

  try {
    return new URLSearchParams(window.location.search).get("drawer") === "open";
  } catch {
    return false;
  }
}

function getServerSnapshot() {
  return false;
}

function getMountedSnapshot() {
  return true;
}

const SidebarContext = createContext({
  isCollapsed: false,
  toggleSidebar: () => {},
  setIsCollapsed: () => {},
  isMobileOpen: false,
  toggleMobile: () => {},
  closeMobile: () => {},
  openMobile: () => {},
  mounted: false,
});

export function SidebarProvider({ children, defaultCollapsed = false }) {
  const isCollapsed = useSyncExternalStore(
    subscribe,
    () => getCollapsedSnapshot(defaultCollapsed),
    getServerSnapshot
  );
  const isMobileOpen = useSyncExternalStore(subscribe, getMobileOpenSnapshot, getServerSnapshot);
  const mounted = useSyncExternalStore(subscribe, getMountedSnapshot, getServerSnapshot);

  const setIsCollapsed = useCallback((val) => {
    const next = Boolean(typeof val === "function" ? val(getCollapsedSnapshot(defaultCollapsed)) : val);
    collapsedOverride = next;
    collapsedOverrideKey = defaultCollapsed ? GUEST_STORAGE_KEY : STORAGE_KEY;
    try {
      window.localStorage.setItem(collapsedOverrideKey, String(next));
    } catch {
      // Ignore private browsing storage errors
    }
    notifySubscribers();
  }, [defaultCollapsed]);

  const toggleSidebar = useCallback(() => setIsCollapsed((prev) => !prev), [setIsCollapsed]);

  const setMobileOpen = useCallback((next) => {
    mobileOpenOverride = Boolean(next);
    notifySubscribers();
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen(!getMobileOpenSnapshot());
  }, [setMobileOpen]);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, [setMobileOpen]);

  const openMobile = useCallback(() => {
    setMobileOpen(true);
  }, [setMobileOpen]);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        toggleSidebar,
        isMobileOpen,
        toggleMobile,
        closeMobile,
        openMobile,
        mounted,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
