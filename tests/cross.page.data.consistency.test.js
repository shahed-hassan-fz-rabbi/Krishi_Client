import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { translations } from "../lib/i18n/translations.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("Dashboard links to the implemented public Crop Calendar in both locales", () => {
  const dashboard = read("app/(app)/dashboard/page.js");
  assert.match(dashboard, /Button href="\/crop-calendar"/);
  assert.doesNotMatch(dashboard, /Crop calendar planning \(planned\)|planned feature/i);
  assert.doesNotMatch(dashboard, /Badge tone="neutral">0 .*Badge tone="neutral">7/);
  for (const locale of ["en", "bn"]) {
    assert.ok(translations[locale].dashboard.handoffTeaserTitle);
    assert.ok(translations[locale].dashboard.handoffTeaserBody);
    assert.ok(translations[locale].dashboard.handoffTeaserCta);
    assert.doesNotMatch(translations[locale].dashboard.handoffTeaserTitle, /planned|পরিকল্পনাধীন/i);
  }
});

test("Dashboard groups NASA POWER metrics and summaries as historical information", () => {
  const dashboard = read("app/(app)/dashboard/page.js");
  assert.match(dashboard, /aria-labelledby="dashboard-power-title"/);
  assert.match(dashboard, /NASA POWER historical observations and calculated climate summaries\. This is not live weather\./);
  assert.match(dashboard, /NASA POWER-এর ঐতিহাসিক পর্যবেক্ষণ ও জলবায়ু সারাংশ; এটি লাইভ আবহাওয়া নয়।/);
  assert.match(dashboard, /dashboard\.metricsTitle/);
  assert.match(dashboard, /dashboard\.summaryTitle/);
  assert.equal(translations.en.dashboard.metricsTitle.includes("2001"), false);
  assert.equal(translations.bn.dashboard.metricsTitle.includes("২০০১"), false);
});

test("Crop Calendar describes stored NASA records accurately and withholds marginal MODIS metrics", () => {
  const page = read("app/(public-data)/crop-calendar/page.js");
  assert.doesNotMatch(page, /real-time physical environmental context/i);
  assert.match(page, /Dated, stored NASA satellite observations/);
  assert.match(page, /তারিখসহ সংরক্ষিত নাসা উপগ্রহ পর্যবেক্ষণ/);
  assert.match(page, /vegetationIndex\?\.available === true/);
  assert.match(page, /No rank-0 value; rank-1 data is withheld/);
  assert.match(page, /গুণমান নীতিমালার কারণে NDVI\/EVI মান দেখানো হয়নি/);
  assert.match(page, /vegetationIndex\.date \|\|/);
  assert.match(page, /soilMoisture\?\.isRecommended === true && Number\.isFinite\(satContext\.soilMoisture\.value\)/);
  assert.match(page, /Values are withheld unless the retrieval quality flag is 0 or 8\./);
  assert.match(page, /satContext\.vegetationIndex\.pixelReliability === 1 && satContext\.vegetationIndex\.quality === "marginal_data"/);
  assert.doesNotMatch(page, /quality \|\| "Recommended"|quality \|\| "Operational"/);
});

test("Map clears old district layers while loading and displays GPM only when its API summary is complete", () => {
  const page = read("app/(public-data)/map/page.js");
  const map = read("components/map/DistrictGisMap.js");
  assert.match(page, /setLayersData\(null\)/);
  assert.match(page, /requestId !== requestIdRef\.current/);
  assert.match(page, /layerRes\.data\?\.district\?\.code !== districtCode/);
  assert.match(map, /dailySummary\.completeness === "complete"/);
  assert.match(map, /dailySummary\.validIntervals}\/48/);
  assert.match(map, /Unavailable — incomplete day/);
  assert.match(map, /Number\.isFinite\(modisLoc\?\.latitude\)/);
});
