"use client";

import { Suspense } from "react";
import { AppSidebar, GlobalAppHeader } from "@/components/layout/AppSidebar.js";
import { BottomNav } from "@/components/layout/BottomNav.js";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext.js";

/**
 * Inner shell that dynamically responds to sidebar collapse state.
 */
function AppLayoutInner({ children }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-bg">
      <Suspense
        fallback={
          <aside className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-[250px] lg:flex-col bg-sidebar border-r border-line" />
        }
      >
        <AppSidebar />
      </Suspense>
      <div
        className={`transition-[padding] duration-200 ease-in-out ${
          isCollapsed ? "lg:pl-[72px]" : "lg:pl-[250px]"
        }`}
      >
        <Suspense fallback={null}>
          <GlobalAppHeader />
        </Suspense>
        <main className="mx-auto w-full max-w-[1440px] px-3 py-4 pb-24 sm:px-6 sm:py-6 lg:pb-8">
          <Suspense fallback={null}>{children}</Suspense>
        </main>
      </div>
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </div>
  );
}

/**
 * Application layout: collapsible deep-green sidebar on desktop, hamburger drawer
 * and touch bottom navigation on mobile.
 */
export function AppShell({ children }) {
  return (
    <SidebarProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </SidebarProvider>
  );
}
