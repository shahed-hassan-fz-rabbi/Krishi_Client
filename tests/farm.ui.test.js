import { test } from "node:test";
import assert from "node:assert/strict";

import {
  fetchFarms,
  fetchFarmById,
  createFarm,
  updateFarm,
  deleteFarm,
} from "../services/api.js";
import {
  DISTRICT_UPAZILAS,
  SUPPORTED_CROPS,
  LAND_UNITS,
  getUpazilasForDistrict,
} from "../lib/upazilas.js";
import { translations } from "../lib/i18n/translations.js";

test("My Farm: Client Services & Upazila Registry Suite", async (t) => {
  await t.test("Upazila registry contains official BBS boundaries for Cumilla & Chattogram", () => {
    const cumillaUpazilas = getUpazilasForDistrict("cumilla");
    assert.equal(cumillaUpazilas.length, 17);
    assert.ok(cumillaUpazilas.some((u) => u.code === "burichang" && u.nameEn === "Burichang"));

    const chattogramUpazilas = getUpazilasForDistrict("chattogram");
    assert.equal(chattogramUpazilas.length, 15);
    assert.ok(chattogramUpazilas.some((u) => u.code === "sitakunda" && u.nameEn === "Sitakunda"));

    // Case insensitivity
    const upperCumilla = getUpazilasForDistrict("CUMILLA");
    assert.equal(upperCumilla.length, 17);

    // Unsupported district returns empty
    const unknown = getUpazilasForDistrict("rajshahi");
    assert.equal(unknown.length, 0);
  });

  await t.test("Supported crops align with official BAMIS/BRRI crop calendars", () => {
    assert.equal(SUPPORTED_CROPS.length, 4);
    const codes = SUPPORTED_CROPS.map((c) => c.code);
    assert.deepEqual(codes, ["monsoon_aman", "boro_rice", "aus_rice", "mustard"]);

    const aman = SUPPORTED_CROPS.find((c) => c.code === "monsoon_aman");
    assert.ok(aman.typicalVarieties.includes("BRRI dhan87"));
    assert.equal(aman.durationDays, 135);
  });

  await t.test("Land measurement unit factors to decimal are verified", () => {
    const acre = LAND_UNITS.find((u) => u.code === "acre");
    assert.equal(acre.factorToDecimal, 100);

    const bigha = LAND_UNITS.find((u) => u.code === "bigha");
    assert.equal(bigha.factorToDecimal, 33);
  });

  await t.test("Translations dictionary includes complete myFarm namespace in EN & BN", () => {
    assert.ok(translations.en.myFarm);
    assert.ok(translations.bn.myFarm);

    assert.equal(translations.en.nav.myFarm, "My Farm");
    assert.equal(translations.bn.nav.myFarm, "আমার খামার");

    assert.ok(translations.en.myFarm.title);
    assert.ok(translations.bn.myFarm.title);
    assert.ok(translations.en.myFarm.wizard.step1Title);
    assert.ok(translations.bn.myFarm.wizard.step1Title);
    assert.ok(translations.en.myFarm.fields.farmName);
    assert.ok(translations.bn.myFarm.fields.farmName);
  });

  await t.test("fetchFarms formats query and includes credentials", async () => {
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
            farms: [],
            summary: { totalFarms: 0, totalAreaDecimal: 0 },
          },
        }),
      };
    };

    try {
      const res = await fetchFarms({ status: "active" });
      assert.equal(res.success, true);
      assert.ok(captured.url.includes("/farms?status=active"));
      assert.equal(captured.options.credentials, "include");
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test("createFarm sends correct JSON payload", async () => {
    let captured = null;
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      captured = { url, options, body: JSON.parse(options.body) };
      return {
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          data: { _id: "new-farm-999", farmName: "East Field" },
        }),
      };
    };

    try {
      const payload = {
        farmName: "East Field",
        location: { districtCode: "cumilla", upazila: "Burichang" },
        land: { area: 25, unit: "decimal" },
        crop: { cropCode: "mustard", plantingDate: "2026-11-15" },
      };
      const res = await createFarm(payload);
      assert.equal(res.success, true);
      assert.ok(captured.url.endsWith("/farms"));
      assert.equal(captured.options.method, "POST");
      assert.equal(captured.body.farmName, "East Field");
      assert.equal(captured.body.crop.cropCode, "mustard");
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test("fetchFarmById encodes farm ID into path", async () => {
    let captured = null;
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      captured = { url, options };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { _id: "farm-123", farmName: "Test Farm" },
        }),
      };
    };

    try {
      const res = await fetchFarmById("farm-123");
      assert.equal(res.success, true);
      assert.ok(captured.url.endsWith("/farms/farm-123"));
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test("updateFarm issues PATCH request with partial updates", async () => {
    let captured = null;
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      captured = { url, options, body: JSON.parse(options.body) };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { _id: "farm-123", farmName: "Updated Name" },
        }),
      };
    };

    try {
      const res = await updateFarm("farm-123", { farmName: "Updated Name" });
      assert.equal(res.success, true);
      assert.ok(captured.url.endsWith("/farms/farm-123"));
      assert.equal(captured.options.method, "PATCH");
      assert.equal(captured.body.farmName, "Updated Name");
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test("deleteFarm issues DELETE request", async () => {
    let captured = null;
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      captured = { url, options };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { message: "Farm deleted" },
        }),
      };
    };

    try {
      const res = await deleteFarm("farm-123");
      assert.equal(res.success, true);
      assert.ok(captured.url.endsWith("/farms/farm-123"));
      assert.equal(captured.options.method, "DELETE");
    } finally {
      global.fetch = originalFetch;
    }
  });
});
