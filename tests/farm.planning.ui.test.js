import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  fetchCropPlanningRecommendations,
  createFarm,
} from "../services/api.js";
import { translations } from "../lib/i18n/translations.js";
import { LAND_UNITS } from "../lib/upazilas.js";
import {
  buildCropPlanningPayload,
  getCropPlanningErrorMessage,
  validateCropPlanningForm,
} from "../lib/cropPlanningForm.js";
import { getBangladeshDateKey } from "../lib/bangladeshDate.js";

const validForm = {
  districtCode: "cumilla",
  upazila: "Burichang",
  village: "Sujanagar",
  area: "37.5",
  unit: "decimal",
  landType: "medium_high",
  soilType: "clay_loam",
  drainage: "good",
  irrigationAvailability: "available",
  waterSource: "deep_tubewell",
  seasonPreference: "Robi",
  preferredCrop: "mustard",
};
const validUpazilas = [{ nameEn: "Burichang" }];

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
      "districtRequired",
      "upazilaRequired",
      "invalidUpazila",
      "areaRequired",
      "networkError",
      "unauthorized",
      "serverError",
      "evaluationFailed",
      "noRecommendations",
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
      "satelliteContextDescription",
      "officialCalendarBasis",
      "aiGeneratedLabel",
      "observationUnavailable",
      "observedOn",
      "dateUnavailable",
      "estimatedDateLabel",
      "sourceDetails",
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

  await t.test("form validation rejects missing, invalid, and non-positive fields", () => {
    assert.equal(validateCropPlanningForm(validForm, validUpazilas), null);
    assert.equal(validateCropPlanningForm({ ...validForm, districtCode: "" }, validUpazilas), "districtRequired");
    assert.equal(validateCropPlanningForm({ ...validForm, upazila: "" }, validUpazilas), "upazilaRequired");
    assert.equal(validateCropPlanningForm({ ...validForm, upazila: "Other District" }, validUpazilas), "invalidUpazila");
    assert.equal(validateCropPlanningForm({ ...validForm, area: "" }, validUpazilas), "areaRequired");
    assert.equal(validateCropPlanningForm({ ...validForm, area: "-3" }, validUpazilas), "areaRequired");
  });

  await t.test("land unit options include Bengali labels for the localized selector", () => {
    assert.ok(LAND_UNITS.length > 0);
    assert.ok(LAND_UNITS.every((unit) => unit.nameEn && unit.nameBn));
  });

  await t.test("request payload preserves entered profile and uses numeric area", () => {
    const payload = buildCropPlanningPayload(validForm, "bn");
    assert.equal(payload.districtCode, "cumilla");
    assert.equal(payload.upazila, "Burichang");
    assert.equal(payload.land.area, 37.5);
    assert.equal(payload.water.waterSource, "deep_tubewell");
    assert.equal(payload.preferences.preferredCrop, "mustard");
    assert.equal(payload.language, "bn");
  });

  await t.test("request payload binds an optional saved farm identifier", () => {
    const payload = buildCropPlanningPayload(validForm, "en", "farm-123");
    assert.equal(payload.farmId, "farm-123");
    assert.equal(buildCropPlanningPayload(validForm, "en").farmId, undefined);
  });

  await t.test("farm form date uses the Bangladesh civil day across UTC midnight", () => {
    assert.equal(getBangladeshDateKey(new Date("2025-01-01T20:00:00.000Z")), "2025-01-02");
  });

  await t.test("planning page wires the button to one guarded submit state", () => {
    const source = readFileSync(new URL("../app/(app)/my-farm/plan/page.js", import.meta.url), "utf8");
    assert.match(source, /<form noValidate onSubmit=\{handleEvaluate\}/);
    assert.match(source, /type="submit"\s+disabled=\{loading\}/);
    assert.match(source, /if \(evaluationInFlight\.current\) return/);
    assert.match(source, /evaluationInFlight\.current = true/);
    assert.match(source, /evaluationInFlight\.current = false/);
    assert.match(source, /fetchFarms\(\)/);
    assert.match(source, /buildCropPlanningPayload\(formData, lang, activeSelectedFarmId \|\| null\)/);
    assert.match(source, /Editing profile fields detaches the plan from the farm/);
    assert.match(source, /<CropPlanningPageContent key=\{identityKey\} \/>/);
  });

  await t.test("planning results never substitute example satellite values or dates", () => {
    const source = readFileSync(new URL("../app/(app)/my-farm/plan/page.js", import.meta.url), "utf8");
    assert.doesNotMatch(source, /0\.22|0\.580|\|\|\s*["']Latest["']/);
    assert.match(source, /observationUnavailable/);
    assert.match(source, /smapObservation\?\.dateLabel/);
    assert.match(source, /modisObservation\?\.dateLabel/);
  });

  await t.test("request failures map to useful localized UI messages", () => {
    const translate = (key) => key;
    assert.equal(getCropPlanningErrorMessage({ error: { code: "NETWORK_ERROR" } }, translate), "myFarm.planning.networkError");
    assert.equal(getCropPlanningErrorMessage({ status: 401 }, translate), "myFarm.planning.unauthorized");
    assert.equal(getCropPlanningErrorMessage({ status: 503 }, translate), "myFarm.planning.serverError");
    assert.equal(getCropPlanningErrorMessage({ status: 400, error: { message: "Invalid district" } }, translate), "Invalid district");
  });
});
