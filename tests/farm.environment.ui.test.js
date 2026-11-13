import { test } from "node:test";
import assert from "node:assert/strict";

import { fetchFarmEnvironment } from "../services/api.js";
import { translations } from "../lib/i18n/translations.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));

test("My Farm Environment: Client API Contracts & Translations Suite (Phase 9.4)", async (t) => {
  await t.test("fetchFarmEnvironment requests /farms/:id/environment with credentials", async () => {
    let captured = null;
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      captured = { url, options };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            farm: { id: "farm-xyz", districtCode: "cumilla" },
            rainfallAndClimate: { provenance: "HISTORICAL" },
            soilMoisture: { soilMoisture: 0.4259, unit: "m³/m³", provenance: "HISTORICAL" },
            vegetation: { ndvi: 0.3323, provenance: "HISTORICAL" },
            summary: { en: "Summary text", bn: "সারসংক্ষেপ" },
          },
        }),
      };
    };

    try {
      const res = await fetchFarmEnvironment("farm-xyz");
      assert.equal(res.success, true);
      assert.ok(captured.url.includes("/farms/farm-xyz/environment"));
      assert.equal(captured.options.credentials, "include");
      assert.equal(res.data.soilMoisture.soilMoisture, 0.4259);
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test("translations: English and Bengali environment keys are complete", () => {
    const enEnv = translations.en?.myFarm?.environment;
    const bnEnv = translations.bn?.myFarm?.environment;

    assert.ok(enEnv, "English environment dictionary must exist");
    assert.ok(bnEnv, "Bengali environment dictionary must exist");

    const requiredKeys = [
      "title",
      "subtitle",
      "sectionA",
      "sectionB",
      "sectionC",
      "sectionD",
      "lifecycleIntegration",
      "rainfall",
      "temperature",
      "diurnalRange",
      "relativeHumidity",
      "solarRadiation",
      "soilMoisture",
      "ndvi",
      "evi",
      "observedDate",
      "observationPeriod",
      "retrievalQuality",
      "spatialResolution",
      "measurementDepth",
      "monthlyNormalsTitle",
      "recentTrendTitle",
      "annualMeanTitle",
      "griddedDisclaimer",
      "smapDisclaimer",
      "modisDisclaimer",
      "consultOfficer",
      "regionalProxyNotice",
      "loadingText",
      "errorText",
    ];

    for (const key of requiredKeys) {
      assert.ok(
        enEnv[key],
        `Missing English translation key in myFarm.environment: ${key}`
      );
      assert.ok(
        bnEnv[key],
        `Missing Bengali translation key in myFarm.environment: ${key}`
      );
    }

    // Verify provenance dictionary
    assert.ok(enEnv.provenance?.live);
    assert.ok(enEnv.provenance?.historical);
    assert.ok(enEnv.provenance?.snapshot);
    assert.ok(enEnv.provenance?.cache);
    assert.ok(enEnv.provenance?.unavailable);

    assert.ok(bnEnv.provenance?.live);
    assert.ok(bnEnv.provenance?.historical);
    assert.ok(bnEnv.provenance?.snapshot);
    assert.ok(bnEnv.provenance?.cache);
    assert.ok(bnEnv.provenance?.unavailable);
  });

  await t.test("Land details links to the existing climate page for the farm district", () => {
    const page = fs.readFileSync(path.resolve(here, "../app/(app)/my-farm/[id]/page.js"), "utf8");
    assert.match(page, /href="\/climate"/);
    assert.match(page, /setSelectedDistrict\(farmDistrictCode\)/);
    assert.match(page, /farmUi.areaClimateLink/);
    assert.doesNotMatch(page, /environment\?\.precipitation/);
    assert.doesNotMatch(page, /environment.summary/);
  });
});
