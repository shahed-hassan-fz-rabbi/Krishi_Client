import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { resolveThemePreference } from "../lib/theme.js";

test("root layout does not render script tags through the React component tree", () => {
  const source = readFileSync(new URL("../app/layout.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /next\/script/);
  assert.doesNotMatch(source, /<Script\b|<script\b/);
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
