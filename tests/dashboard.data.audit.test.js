import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  getCompleteGpmDailyTotal,
  getDistrictValidCoverage,
  getRecommendedSmapValue,
  getReliableModisIndices,
  isSupportedPowerProvenance,
  responseBelongsToDistrict,
} from "../lib/dashboardData.js";

test("GPM publishes a daily total only for 48 complete, observed, valid intervals", () => {
  const complete = { completeness: "complete", expectedIntervals: 48, observedIntervals: 48, validIntervals: 48, totalPrecipitationMm: 12.5 };
  assert.equal(getCompleteGpmDailyTotal(complete), 12.5);
  assert.equal(getCompleteGpmDailyTotal({ ...complete, validIntervals: 47 }), null);
  assert.equal(getCompleteGpmDailyTotal({ ...complete, observedIntervals: 47 }), null);
  assert.equal(getCompleteGpmDailyTotal({ ...complete, completeness: "incomplete" }), null);
  assert.equal(getCompleteGpmDailyTotal({ ...complete, totalPrecipitationMm: null }), null);
  assert.equal(getCompleteGpmDailyTotal(null), null);
});

test("SMAP requires recommended quality flag 0 or 8 and a physical non-fill value", () => {
  assert.equal(getRecommendedSmapValue({ isRecommendedQuality: true, retrievalQualityFlag: 0, soilMoisture: 0.31 }), 0.31);
  assert.equal(getRecommendedSmapValue({ isRecommendedQuality: true, retrievalQualityFlag: 8, soilMoisture: 0.31 }), 0.31);
  assert.equal(getRecommendedSmapValue({ isRecommendedQuality: false, retrievalQualityFlag: 9, soilMoisture: 0.31 }), null);
  assert.equal(getRecommendedSmapValue({ isRecommendedQuality: true, retrievalQualityFlag: 0, soilMoisture: -9999 }), null);
  assert.equal(getRecommendedSmapValue({ isRecommendedQuality: true, retrievalQualityFlag: 0, soilMoisture: null }), null);
  assert.equal(getRecommendedSmapValue(undefined), null);
});

test("MODIS shows only reliability-rank-zero values within scaled index bounds", () => {
  assert.deepEqual(getReliableModisIndices({ isReliableQuality: true, pixelReliability: 0, ndvi: 0.6, evi: 0.4 }), { ndvi: 0.6, evi: 0.4 });
  assert.equal(getReliableModisIndices({ isReliableQuality: false, pixelReliability: 1, ndvi: 0.6, evi: 0.4 }), null);
  assert.equal(getReliableModisIndices({ isReliableQuality: true, pixelReliability: 1, ndvi: 0.6, evi: 0.4 }), null);
  assert.deepEqual(getReliableModisIndices({ isReliableQuality: true, pixelReliability: 0, ndvi: -3000, evi: 0.4 }), { ndvi: null, evi: 0.4 });
  assert.equal(getReliableModisIndices(undefined), null);
});

test("district coverage is selected by exact district with no global fallback", () => {
  const source = { districtValidCoverage: {
    cumilla: { count: 3, firstObservationDate: "2024-01-02", lastObservationDate: "2024-01-08" },
    chattogram: { count: 7, firstObservationDate: "2024-02-18", lastObservationDate: "2024-03-05" },
  }, observationCount: 10 };
  assert.deepEqual(getDistrictValidCoverage(source, "cumilla"), { count: 3, firstObservationDate: "2024-01-02", lastObservationDate: "2024-01-08" });
  assert.deepEqual(getDistrictValidCoverage(source, "chattogram"), { count: 7, firstObservationDate: "2024-02-18", lastObservationDate: "2024-03-05" });
  assert.equal(getDistrictValidCoverage(source, "unknown"), null);
  assert.equal(getDistrictValidCoverage({ observationCount: 10 }, "cumilla"), null);
});

test("responses from a different district are rejected", () => {
  assert.equal(responseBelongsToDistrict({ districtCode: "cumilla" }, "cumilla"), true);
  assert.equal(responseBelongsToDistrict({ districtCode: "cumilla" }, "chattogram"), false);
  assert.equal(responseBelongsToDistrict({}, "cumilla"), false);
});

test("POWER accepts only explicit database, cache, or documented snapshot provenance", () => {
  for (const provenance of ["HISTORICAL_DATABASE", "CACHED", "SNAPSHOT"]) assert.equal(isSupportedPowerProvenance(provenance), true);
  for (const provenance of [undefined, "LIVE_WEATHER", "DEMO", "UNAVAILABLE"]) assert.equal(isSupportedPowerProvenance(provenance), false);
});

test("Dashboard cards use API values, district-valid coverage and no fixed historical range", async () => {
  const source = await readFile(new URL("../app/(app)/dashboard/page.js", import.meta.url), "utf8");
  assert.match(source, /fetchClimateSummary\(districtCode\)/);
  assert.match(source, /fetchPrecipitationLatest\(selectedDistrict\)/);
  assert.match(source, /fetchSoilMoistureLatest\(selectedDistrict\)/);
  assert.match(source, /fetchVegetationLatest\(selectedDistrict\)/);
  const cards = await readFile(new URL("../components/dashboard/EnvironmentalIntelligenceCards.js", import.meta.url), "utf8");
  assert.match(source, /getDistrictValidCoverage\(powerSource, selectedDistrict\)/);
  assert.doesNotMatch(source, /2001\s*[–-]\s*2025/);
  assert.doesNotMatch(source, /observationCount\s*:\s*\d+/);
  assert.match(source, /powerCoverageLabel/);
  assert.match(cards, /districtValidCoverage/);
  assert.match(cards, /provenanceLabel/);
  assert.match(cards, /Unavailable/);
});

test("district changes hide prior-district summary and environmental responses until the new district loads", async () => {
  const source = await readFile(new URL("../app/(app)/dashboard/page.js", import.meta.url), "utf8");
  assert.match(source, /const currentEnvironmental = latestEnvironmental\.district === selectedDistrict \? latestEnvironmental : null/);
  assert.match(source, /const currentClimateSummary = summaryDistrict === selectedDistrict \? summaryData : null/);
  assert.match(source, /const currentClimateMeta = summaryDistrict === selectedDistrict \? metaData : null/);
  assert.match(source, /climateSummary=\{currentClimateSummary\}/);
  assert.match(source, /climateMeta=\{currentClimateMeta\}/);
  assert.match(source, /gpmData=\{currentEnvironmental\?\.gpm\}/);
  assert.match(source, /smapData=\{currentEnvironmental\?\.smap\}/);
  assert.match(source, /modisData=\{currentEnvironmental\?\.modis\}/);
});

test("missing GPM observations never render zero rainfall or fabricated complete intervals", async () => {
  const source = await readFile(new URL("../components/dashboard/EnvironmentalIntelligenceCards.js", import.meta.url), "utf8");
  assert.match(source, /primaryValue: isGpmDayComplete \? .* : "—"/);
  assert.match(source, /gpmLatestSummary \? `\$\{isBn \? toBengaliNumber\(gpmLatestSummary\.validIntervals\) : gpmLatestSummary\.validIntervals\}\/48` : "—"/);
  assert.match(source, /Observation unavailable/);
  assert.doesNotMatch(source, /isGpmDayComplete \?[^\n]+:\s*\(isBn \? "০\.০" : "0\.0"\)/);
  assert.doesNotMatch(source, /gpmLatestSummary \?[^\n]+:\s*"48\/48"/);
});

test("four NASA cards use the live summary shape, district coverage, quality counts, and provenance", async () => {
  const source = await readFile(new URL("../components/dashboard/EnvironmentalIntelligenceCards.js", import.meta.url), "utf8");
  assert.match(source, /climateSummary\?\.temperature\?\.annual_historical\?\.mean/);
  assert.match(source, /climateSummary\?\.rh2m\?\.annual_historical\?\.mean/);
  assert.match(source, /climateSummary\?\.rainfall\?\.annual_historical\?\.mean/);
  assert.match(source, /districtValidCoverage\?\.\[selectedDistrict\]/);
  assert.doesNotMatch(source, /\|\|\s*(?:powerSource|gpmSource|smapSource|modisSource)\?\.firstObservationDate/);
  assert.doesNotMatch(source, /\|\|\s*(?:powerSource|gpmSource|smapSource|modisSource)\?\.lastObservationDate/);
  assert.match(source, /smapDistrictStatus\?\.validRecordCount/);
  assert.match(source, /smapDistrictStatus\?\.storedRecordCount/);
  assert.match(source, /modisDistrictValid\?\.qualityCounts\?\.marginal_data/);
  assert.match(source, /sourceMetadata\("NASA POWER", "Point", climateMeta\?\.provenance, locale\)/);
  assert.match(source, /sourceMetadata\("NASA GES DISC", "10 km", gpmData\?\.meta\?\.provenance, locale\)/);
  assert.match(source, /sourceMetadata\("NASA NSIDC", "9 km", smapData\?\.meta\?\.provenance, locale\)/);
  assert.match(source, /sourceMetadata\("NASA LP DAAC", "250 m", modisData\?\.meta\?\.provenance, locale\)/);
  assert.doesNotMatch(source, /25-Yr Normal|২৫ বছরের গড়|intervals \(7d\)/);
});

test("dataset cards keep the responsive multi-column and wide-desktop layout restrained", async () => {
  const source = await readFile(new URL("../components/dashboard/EnvironmentalIntelligenceCards.js", import.meta.url), "utf8");
  assert.match(source, /grid.*items-stretch.*(?:sm|md):grid-cols-2/);
  assert.match(source, /flex.*h-full.*flex-col.*justify-between/);
});
