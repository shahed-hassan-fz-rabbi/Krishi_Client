"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Map as MapIcon,
  Sprout,
  Wheat,
  Settings,
} from "lucide-react";

import { useLang } from "@/lib/i18n/LanguageContext.js";
import { useAuth } from "@/contexts/AuthContext.js";

const items = [
  { href: "/dashboard", icon: Sprout, key: "nav.dashboard" },
  { href: "/handoff", icon: Wheat, key: "nav.handoff" },
  { href: "/climate", icon: BarChart3, key: "nav.climate" },
  { href: "/map", icon: MapIcon, key: "nav.map" },
  { href: "/settings", icon: Settings, key: "nav.settings" },
];

/**
 * Touch-friendly bottom navigation for small screens only (lg:screens use the sidebar).
 * Lists the five most-used destinations; the full menu stays in the drawer.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLang();
  const { user } = useAuth();
  const navigation = items.map((item) => {
    if (item.href === "/handoff") return { href: user ? "/rotation-planner" : "/crop-rotation", icon: Wheat, key: "publicHeader.cropRotation" };
    if (item.href === "/settings" && !user) return { ...item, href: "/login", key: "auth.login" };
    return item;
  });

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {navigation.map(({ href, icon: Icon, key }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 pb-1 pt-1.5 text-[10px] font-medium leading-tight transition-colors ${
                  active ? "bg-forest text-white" : "text-muted hover:text-content"
                }`}
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={active ? 2.0 : 1.75}
                  aria-hidden="true"
                />
                <span className="max-w-[9ch] truncate">{t(key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
