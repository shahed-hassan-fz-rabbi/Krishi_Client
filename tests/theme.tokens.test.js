import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

import { resolveThemePreference } from "../lib/theme.js";

test("pre-hydration theme script preserves preferences without a raw React script tag", () => {
  const source = readFileSync(new URL("../app/layout.js", import.meta.url), "utf8");
  assert.match(source, /import Script from "next\/script"/);
  assert.match(source, /<Script id="km-theme-init" strategy="beforeInteractive">/);
  assert.doesNotMatch(source, /<script\b/);
  const script = source.match(/const themeInitScript = `([^`]+)`/)[1];
  for (const [saved, systemDark] of [["dark", false], ["light", true], [null, true], [null, false], ["invalid", true]]) {
    let active;
    runInNewContext(script, {
      localStorage: { getItem: () => saved },
      window: { matchMedia: () => ({ matches: systemDark }) },
      document: { documentElement: { classList: { toggle: (name, value) => { assert.equal(name, "dark"); active = value; } } } },
    });
    assert.equal(active, resolveThemePreference(saved, systemDark) === "dark");
  }
  assert.doesNotThrow(() => runInNewContext(script, { localStorage: { getItem: () => { throw new Error("Storage blocked"); } } }));
});

test("saved theme preference wins over system mode and survives initialization", () => {
  assert.equal(resolveThemePreference("dark", false), "dark");
  assert.equal(resolveThemePreference("light", true), "light");
  assert.equal(resolveThemePreference(null, true), "dark");
  assert.equal(resolveThemePreference(null, false), "light");
});

test("design tokens include legacy text aliases and the forest action scale", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /--color-ink:\s*var\(--km-text\)/);
  assert.match(css, /--color-ink-muted:\s*var\(--km-text-muted\)/);
  for (const shade of ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"]) {
    assert.match(css, new RegExp(`--color-forest-${shade}:\\s*var\\(--km-forest-${shade}\\)`));
  }
});

test("theme changes update the root class immediately and storage is read once on mount", () => {
  const source = readFileSync(new URL("../contexts/ThemeContext.js", import.meta.url), "utf8");
  assert.match(source, /document\.documentElement\.classList\.toggle\("dark", nextTheme === "dark"\)/);
  assert.match(source, /document\.documentElement\.classList\.toggle\("dark", value === "dark"\)/);
  assert.match(source, /localStorage\.setItem\(STORAGE_KEY, value\)/);
  assert.equal((source.match(/localStorage\.getItem\(STORAGE_KEY\)/g) || []).length, 1);
});
