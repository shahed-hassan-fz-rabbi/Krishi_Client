import { test } from "node:test";
import assert from "node:assert/strict";

import {
  fetchCropPlanningRecommendations,
  createFarm,
} from "../services/api.js";
import { translations } from "../lib/i18n/translations.js";

test("My Farm Planning: Client API Contracts & Translations Suite", async (t) => {
  await t.test("fetchCropPlanningRecommendations issues POST request to /crop-planning/recommendations", async () => {
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
            crops: [{ cropCode: "boro_rice", suitabilityCategory: "supported" }],
            satelliteContext: {},
            aiExplanation: "Crop recommendations based on BAMIS.",
          },
        }),
      };
    };

    try {
      const payload = {
        districtCode: "cumilla",
        upazila: "Burichang",
        land: { area: 50, unit: "decimal", landType: "medium_high" },
        water: { irrigationAvailability: "available" },
      };

      const res = await fetchCropPlanningRecommendations(payload);
      assert.equal(res.success, true);
      assert.ok(captured.url.includes("/crop-planning/recommendations"));
      assert.equal(captured.options.method, "POST");
      assert.equal(captured.options.credentials, "include");
      const sentBody = JSON.parse(captured.options.body);
      assert.equal(sentBody.districtCode, "cumilla");
      assert.equal(sentBody.land.area, 50);
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test("translations: English and Bengali planning keys are complete", () => {
    const enPlan = translations.en?.myFarm?.planning;
    const bnPlan = translations.bn?.myFarm?.planning;

    assert.ok(enPlan, "English planning dictionary must exist");
    assert.ok(bnPlan, "Bengali planning dictionary must exist");

    const requiredKeys = [
      "planWithAi",
      "planButton",
      "pageTitle",
      "pageSubtitle",
      "questionnaireTitle",
      "districtLabel",
      "upazilaLabel",
      "landAreaLabel",
      "landTypeLabel",
      "soilTypeLabel",
      "drainageLabel",
      "irrigationLabel",
      "analyzeButton",
      "analyzing",
      "resultsTitle",
      "aiSummaryTitle",
      "aiDisclaimer",
      "plantingWindow",
      "duration",
      "waterDemand",
      "reasonsTitle",
      "constraintsTitle",
      "varietiesTitle",
      "selectCrop",
      "selectModalTitle",
      "farmName",
      "plantingDate",
      "confirmCreate",
      "satelliteContextTitle",
    ];

    for (const key of requiredKeys) {
      assert.ok(
        enPlan[key],
        `Missing English translation key in myFarm.planning: ${key}`
      );
      assert.ok(
        bnPlan[key],
        `Missing Bengali translation key in myFarm.planning: ${key}`
      );
    }

    // Verify suitability categories dictionary
    assert.ok(enPlan.suitability?.supported);
    assert.ok(enPlan.suitability?.potential);
    assert.ok(bnPlan.suitability?.supported);
    assert.ok(bnPlan.suitability?.potential);
  });
});
