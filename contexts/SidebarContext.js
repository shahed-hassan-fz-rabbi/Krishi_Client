"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "km_sidebar_collapsed";

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

export function SidebarProvider({ children }) {
  const [isCollapsed, setIsCollapsedState] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Restore collapsed state from URL or localStorage once after mount (hydration-safe)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlSidebar = params.get("sidebar");
      if (params.get("drawer") === "open") {
        setIsMobileOpen(true);
      }
      if (urlSidebar === "collapsed") {
        setIsCollapsedState(true);
      } else if (urlSidebar === "expanded") {
        setIsCollapsedState(false);
      } else {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          setIsCollapsedState(stored === "true");
        }
      }
    } catch {
      // Ignore private browsing storage errors
    }
    setMounted(true);
  }, []);

  const setIsCollapsed = useCallback((val) => {
    setIsCollapsedState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      try {
        localStorage.setItem(STORAGE_KEY, String(Boolean(next)));
      } catch {
        // Ignore
      }
      return Boolean(next);
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const openMobile = useCallback(() => {
    setIsMobileOpen(true);
  }, []);

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
