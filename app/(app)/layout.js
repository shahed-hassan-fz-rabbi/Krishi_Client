"use client";

import { MobileTopbar, AppSidebar } from "@/components/layout/AppSidebar.js";

/**
 * Application layout: deep-green sidebar on desktop, hamburger drawer on mobile.
 * The app is open-access for now â€” no login is provided and none is implied.
 */
export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg">
      <AppSidebar />
      <MobileTopbar />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
