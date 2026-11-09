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
  assert.match(layout, /<div className="lg:pl-64">\s*<main className="mx-auto w-full max-w-\[1440px\]/);
});
