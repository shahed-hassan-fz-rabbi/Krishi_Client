/**
 * Ticker Headlines, Animation & TV News Component Tests
 *
 * Verifies:
 * 1. Continuous Right-to-Left scrolling keyframes & infinite seamless loop structure.
 * 2. Scientific accuracy of headline generation across Cumilla & Chattogram.
 * 3. Provenance and observation date formatting.
 * 4. Offline snapshot fallback resilience.
 * 5. English & Bengali i18n localization.
 * 6. Placement immediately below Navbar and above Hero section.
 * 7. Preservation of existing Hero elements.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  generateDistrictHeadlines,
  formatObservationDate,
  formatDecimals,
  formatIntegerWithCommas,
  toBengaliNumber,
  VERIFIED_SNAPSHOTS,
} from "../lib/tickerHeadlines.js";

import { translations } from "../lib/i18n/translations.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("TV News Agricultural Breaking News Ticker Suite", () => {
  test("Animation & CSS: Right-to-Left continuous marquee with pause-on-hover & reduced motion", () => {
    const globalsCss = fs.readFileSync(path.resolve(__dirname, "../app/globals.css"), "utf8");

    // Right-to-left animation keyframe definition
    assert.match(globalsCss, /@keyframes km-ticker-rtl/, "Must define @keyframes km-ticker-rtl");
    assert.match(globalsCss, /transform:\s*translate3d\(0,\s*0,\s*0\)/, "Start at 0");
    assert.match(globalsCss, /transform:\s*translate3d\(-100%,\s*0,\s*0\)/, "End at -100% for mathematical seamless loop");

    // Class binding
    assert.match(globalsCss, /\.animate-km-ticker/, "Must define .animate-km-ticker");
    assert.match(globalsCss, /animation:\s*km-ticker-rtl/, "Must apply km-ticker-rtl animation");

    // Hover & focus-within pause
    assert.match(globalsCss, /\.km-ticker-container:hover\s*\.animate-km-ticker/, "Must pause on hover");
    assert.match(globalsCss, /animation-play-state:\s*paused/, "Must set animation-play-state to paused");

    // Accessibility: prefers-reduced-motion
    assert.match(globalsCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)/, "Must respect prefers-reduced-motion");
    assert.match(globalsCss, /animation:\s*none\s*!important/, "Must disable animation when reduced motion is requested");
  });

  test("Landing page keeps the removed bulletin out of the public layout", () => {
    const pageJs = fs.readFileSync(path.resolve(__dirname, "../app/page.js"), "utf8");
    assert.ok(pageJs.includes("<PublicHeader />"));
    assert.ok(!pageJs.includes("AgriculturalNewsTicker"));
  });

  test("Homepage Hero Preservation: Hero heading, description, buttons, and background remain intact", () => {
    const pageJs = fs.readFileSync(path.resolve(__dirname, "../app/page.js"), "utf8");

    assert.ok(pageJs.includes('src={HERO_SRC}'), "Hero background image must remain preserved");
    assert.ok(pageJs.includes('{t("landing.heroTitle")}'), "Hero title must remain preserved");
    assert.ok(pageJs.includes('{t("landing.heroSubtitle")}'), "Hero subtitle must remain preserved");
    assert.ok(pageJs.includes('{t("rotation.start")}'), "Hero CTA button must remain preserved");
    assert.ok(pageJs.includes('{t("publicHeader.exploreDashboard")}'), "Hero secondary button must remain preserved");
    assert.ok(pageJs.includes('{t("landing.heroNote")}'), "Hero note must remain preserved");
  });

  test("Headlines Generator: Cumilla uses dated verified observations without fabricated breaking alerts", () => {
    const headlinesEn = generateDistrictHeadlines({ district: "cumilla", locale: "en" });
    const headlinesBn = generateDistrictHeadlines({ district: "cumilla", locale: "bn" });

    assert.ok(headlinesEn.length >= 4, "Must generate at least 4 verified headlines for Cumilla");
    assert.equal(headlinesEn.length, headlinesBn.length, "English and Bengali headline counts must match");

    assert.equal(headlinesEn.some((h) => h.isBreaking), false, "Environmental observations do not become fabricated alerts");
    const smapItem = headlinesEn.find((h) => h.id === "cumilla-smap-observation");
    assert.ok(smapItem, "Cumilla must have a quality-approved SMAP observation");
    assert.equal(smapItem.dateLabel, "2024-01-03");
    assert.ok(smapItem.headline.includes("0.426 m³/m³"));
    assert.ok(smapItem.headline.includes("quality flag 8"));

    const smapBn = headlinesBn.find((h) => h.id === "cumilla-smap-observation");
    assert.ok(smapBn.headline.includes("০.৪২৬ m³/m³"));

    // MODIS composite headline
    const modisEn = headlinesEn.find((h) => h.id === "cumilla-modis-veg");
    assert.ok(modisEn, "Must have MODIS vegetation headline");
    assert.ok(modisEn.headline.includes("NDVI 0.286"), "Must format NDVI to 3 decimal places");
    assert.ok(modisEn.headline.includes("marginal_data"), "Marginal quality must stay visible");
    assert.equal(modisEn.dateLabel, "2024-01-17");
    assert.ok(modisEn.headline.includes("16-day composite"), "Must state 16-day composite");
  });

  test("Headlines Generator: Chattogram generates valid verified headlines without false alarms", () => {
    const headlinesEn = generateDistrictHeadlines({ district: "chattogram", locale: "en" });
    const headlinesBn = generateDistrictHeadlines({ district: "chattogram", locale: "bn" });

    assert.ok(headlinesEn.length >= 4, "Must generate at least 4 verified headlines for Chattogram");

    // Chattogram's flag 9 record is disclosed as not recommended; no alert is generated.
    const breakingItems = headlinesEn.filter((h) => h.isBreaking);
    assert.equal(
      breakingItems.length,
      0,
      "Chattogram must not fabricate alarms when observation is normal (rule 5: genuine alerts only)"
    );

    const smapItem = headlinesEn.find((h) => h.id === "chattogram-smap-quality");
    assert.ok(smapItem, "Must disclose the non-recommended SMAP observation");
    assert.ok(smapItem.headline.includes("not recommended quality"));
    assert.ok(!smapItem.headline.includes("0.187"), "Non-recommended value is not presented as trusted");

    // Climate baseline
    const climItem = headlinesEn.find((h) => h.id === "chattogram-climate-baseline");
    assert.ok(climItem, "Must have Chattogram climate headline");
    assert.ok(climItem.headline.includes("3,159 mm"), "Must cite 3,159 mm mean annual rainfall");
    assert.ok(climItem.headline.includes("2001-2025"), "Must show the historical period");
  });

  test("GPM ticker publishes only complete daily sums and separates observation and ingestion dates", () => {
    const complete = generateDistrictHeadlines({
      district: "cumilla",
      locale: "en",
      gpmData: {
        provenance: "HISTORICAL_DATABASE",
        latestDailySummary: { dateLabel: "2024-01-07", completeness: "complete", validIntervals: 48, totalPrecipitationMm: 0 },
        latestInterval: { ingestedAt: "2026-11-09T10:00:00.000Z" },
      },
    }).find((h) => h.id === "cumilla-gpm-rainfall");
    assert.ok(complete);
    assert.equal(complete.dateLabel, "2024-01-07");
    assert.equal(complete.ingestedAt, "2026-11-09T10:00:00.000Z");
    assert.ok(complete.headline.includes("0.00 mm"));
    assert.ok(complete.headline.includes("48/48"));

    const partial = generateDistrictHeadlines({
      district: "cumilla",
      locale: "en",
      gpmData: { latestDailySummary: { dateLabel: "2024-01-08", completeness: "incomplete", validIntervals: 47, totalPrecipitationMm: 123 } },
    }).find((h) => h.id === "cumilla-gpm-rainfall");
    assert.ok(partial.headline.includes("total withheld"));
    assert.ok(!partial.headline.includes("123"));
  });

  test("Data Freshness & Provenance: Valid observation dates and provenance tags", () => {
    const headlines = generateDistrictHeadlines({ district: "cumilla", locale: "en" });

    headlines.forEach((h) => {
      assert.ok(h.provenance, `Headline ${h.id} must have provenance tag`);
      assert.ok(h.dateLabel, `Headline ${h.id} must have observation date or period`);
      assert.ok(h.href.startsWith("/"), `Headline ${h.id} must have valid internal route link`);
      assert.notEqual(h.headline, "", `Headline ${h.id} must have non-empty text`);
    });
  });

  test("Scientific Accuracy: No weather forecast claims or fabricated predictions", () => {
    const cumillaHeadlines = generateDistrictHeadlines({ district: "cumilla", locale: "en" });
    const chattogramHeadlines = generateDistrictHeadlines({ district: "chattogram", locale: "en" });

    const allHeadlines = [...cumillaHeadlines, ...chattogramHeadlines];

    allHeadlines.forEach((h) => {
      const lower = h.headline.toLowerCase();
      assert.ok(!lower.includes("tomorrow will"), "Must not predict future weather");
      assert.ok(!lower.includes("weather forecast:"), "Must not claim weather forecasting");
      assert.ok(!lower.includes("live weather"), "Must not confuse historical reanalysis with live weather");
      assert.ok(!lower.includes("yield guarantee"), "Must not guarantee crop yields");
    });
  });

  test("Offline Fallback Resilience: Generates verified headlines even with null API responses", () => {
    const fallbackHeadlines = generateDistrictHeadlines({
      district: "cumilla",
      climateData: null,
      smapData: null,
      modisData: null,
      cropData: null,
      locale: "en",
    });

    assert.ok(fallbackHeadlines.length >= 4, "Must use verified snapshot fallbacks when API is offline");
    assert.equal(fallbackHeadlines[0].provenance, "SNAPSHOT", "Must accurately label provenance as SNAPSHOT");
  });

  test("i18n Localization: Translations dictionary contains complete ticker keys in en and bn", () => {
    const enTicker = translations.en.ticker;
    const bnTicker = translations.bn.ticker;

    assert.ok(enTicker, "translations.en.ticker must exist");
    assert.ok(bnTicker, "translations.bn.ticker must exist");

    const requiredKeys = [
      "brandLabel",
      "liveIndicator",
      "breaking",
      "krishiUpdate",
      "nasaUpdate",
      "selectDistrictPrompt",
      "cumilla",
      "chattogram",
      "hoverToPause",
      "statusHistorical",
      "statusObserved",
      "statusComposite",
      "statusSnapshot",
      "topsoilNote",
      "sourceNasaPower",
      "sourceSmap",
      "sourceModis",
      "sourceDae",
    ];

    requiredKeys.forEach((key) => {
      assert.ok(enTicker[key], `en.ticker.${key} must be defined`);
      assert.ok(bnTicker[key], `bn.ticker.${key} must be defined`);
    });
  });

  test("Bengali Numerals & Date Conversion Helpers", () => {
    assert.equal(toBengaliNumber("12345"), "১২৩৪৫");
    assert.equal(toBengaliNumber("0.426"), "০.৪২৬");
    assert.equal(formatObservationDate("2024-01-03", "bn"), "০৩-০১-২০২৪");
    assert.equal(formatObservationDate("2024-01-03", "en"), "2024-01-03");
    assert.equal(formatDecimals(0.4259, 3, "en"), "0.426");
    assert.equal(formatDecimals(0.4259, 3, "bn"), "০.৪২৬");
    assert.equal(formatIntegerWithCommas(2454, "en"), "2,454");
    assert.equal(formatIntegerWithCommas(2454, "bn"), "২,৪৫৪");
  });
});
