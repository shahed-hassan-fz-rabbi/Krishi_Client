"use client";

import { AppSidebar, MobileTopbar } from "@/components/layout/AppSidebar.js";
import { BottomNav } from "@/components/layout/BottomNav.js";

/**
 * Application layout: deep-green sidebar on desktop, hamburger drawer
 * and touch bottom navigation on mobile.
 * The app is open-access for now — no login is provided and none is implied.
 */
export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg">
      <AppSidebar />
      <MobileTopbar />
      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:pl-64 lg:pb-8">
        <div className="lg:px-0">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
