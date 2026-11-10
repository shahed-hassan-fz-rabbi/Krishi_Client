import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("sidebar and mobile navigation mark nested routes active", () => {
  const sidebar = read("../components/layout/AppSidebar.js");
  const bottomNav = read("../components/layout/BottomNav.js");
  assert.match(sidebar, /pathname === href \|\| pathname\.startsWith\(`\$\{href\}\/`\)/);
  assert.match(sidebar, /bg-white font-semibold text-forest/);
  assert.match(bottomNav, /pathname === href \|\| pathname\.startsWith\(`\$\{href\}\/`\)/);
  assert.match(bottomNav, /bg-forest text-white/);
});

test("mobile drawer locks background scroll and supports keyboard dismissal and focus return", () => {
  const source = read("../components/layout/AppSidebar.js");
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /document\.body\.style\.overflow = "hidden"/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /event\.key === "Tab"/);
  assert.match(source, /\(menuButton \|\| previousFocus\).*focus/);
});

test("desktop content max-width is measured after reserving sidebar width", () => {
  const layout = read("../app/(app)/layout.js");
  assert.match(
    layout,
    /isCollapsed \? "lg:pl-\[72px\]" : "lg:pl-\[250px\]"[\s\S]*?<main className="mx-auto w-full max-w-\[1440px\]/
  );
  assert.match(layout, /transition-\[padding\] duration-200/);
});

test("sidebar supports 250px expanded and 72px collapsed states with 200ms width transition", () => {
  const sidebar = read("../components/layout/AppSidebar.js");
  assert.match(sidebar, /isCollapsed \? "w-\[72px\]" : "w-\[250px\]"/);
  assert.match(sidebar, /transition-\[width\] duration-200/);
  assert.match(sidebar, /PanelLeftClose/);
  assert.match(sidebar, /PanelLeftOpen/);
  assert.match(sidebar, /role="tooltip"/);
  assert.match(sidebar, /LayoutDashboard/);
  assert.match(sidebar, /ChartNoAxesCombined/);
  assert.match(sidebar, /CalendarDays/);
});

test("authenticated app layout mounts one persistent utility header before page content", () => {
  const layout = read("../app/(app)/layout.js");
  const shell = read("../components/layout/AppSidebar.js");
  const assistant = read("../app/(app)/assistant/page.js");
  assert.match(layout, /<GlobalAppHeader\s*\/>[\s\S]*?<main/);
  assert.match(shell, /export function GlobalAppHeader\(\)/);
  assert.match(shell, /className="sticky top-0 z-30/);
  assert.equal((shell.match(/<NotificationCenter(?:\s+[^>]*)?\s*\/>/g) || []).length, 1);
  assert.equal((shell.match(/<LanguageSwitcher\s*\/>/g) || []).length, 1);
  assert.equal((shell.match(/<ThemeSwitcher(?:\s+[^>]*)?\s*\/>/g) || []).length, 1);
  assert.match(shell, /function ProfileMenu\(\)/);
  assert.match(shell, /aria-haspopup="menu"/);
  assert.match(shell, /function DistrictContext\(\)/);
  assert.doesNotMatch(assistant, /setLocale\(|toggleTheme\(/);
});
