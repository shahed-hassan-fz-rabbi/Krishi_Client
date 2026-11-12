import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Climate Data SMAP card shows only selected-district flag 0/8 observations", async () => {
  const page = await readFile(new URL("../app/(public-data)/climate/page.js", import.meta.url), "utf8");
  const section = await readFile(new URL("../components/climate/SoilMoistureSection.js", import.meta.url), "utf8");
  assert.match(page, /datasetOverview\.smap\?\.districtCode === selectedDistrict && datasetOverview\.smap\?\.recommended/);
  assert.match(page, /datasetOverview\.smap\?\.districtCode !== selectedDistrict \|\| datasetOverview\.smap\?\.status === "loading"/);
  assert.match(section, /\[0, 8\]\.includes\(observation\.retrievalQualityFlag\)/);
  assert.match(section, /value: recommended \? observation\.soilMoisture : null/);
  assert.match(section, /recommendedLatest \? latestData\.soilMoisture : "—"/);
  assert.match(section, /setLatestData\(null\)/);
  assert.match(section, /latestDistrictRef\.current !== districtCode/);
  assert.doesNotMatch(section, /soilMoisture\s*\?\?\s*0(?:\.0+)?/);
});

test("Climate Data unavailable SMAP response is distinct from a real zero-valued observation", async () => {
  const overview = await readFile(new URL("../app/(public-data)/climate/page.js", import.meta.url), "utf8");
  const section = await readFile(new URL("../components/climate/SoilMoistureSection.js", import.meta.url), "utf8");
  assert.match(overview, /recommended \? `\$\{number\.format\(datasetOverview\.smap\.value\)\} m³\/m³` : "—"/);
  assert.match(overview, /No recommended-quality value available/);
  assert.match(section, /Number\.isFinite\(observation\?\.soilMoisture\)/);
  assert.match(section, /observation\.soilMoisture >= 0/);
  assert.match(section, /observation\.soilMoisture <= 1/);
});
