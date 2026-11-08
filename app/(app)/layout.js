"use client";

import { Suspense } from "react";
import { AppSidebar, MobileTopbar } from "@/components/layout/AppSidebar.js";
import { BottomNav } from "@/components/layout/BottomNav.js";

/**
 * Application layout: deep-green sidebar on desktop, hamburger drawer
 * and touch bottom navigation on mobile.
 */
export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg">
      <Suspense fallback={<aside className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-64 lg:flex-col bg-sidebar border-r border-line" />}>
        <AppSidebar />
      </Suspense>
      <Suspense fallback={null}>
        <MobileTopbar />
      </Suspense>
      <main className="mx-auto max-w-[1440px] px-3 py-4 pb-24 sm:px-6 sm:py-6 lg:pl-64 lg:pb-8">
        <div className="lg:px-0">
          <Suspense fallback={null}>{children}</Suspense>
        </div>
      </main>
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
