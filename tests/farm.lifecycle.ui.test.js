import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  fetchFarmLifecycle,
  refreshFarmLifecycle,
  fetchCropLifecycleTemplates,
  fetchCropLifecycleTemplate,
} from "../services/api.js";
import { translations } from "../lib/i18n/translations.js";

test("My Farm Lifecycle: Client API Contracts & Translations Suite", async (t) => {
  await t.test("fetchFarmLifecycle requests /farms/:id/lifecycle with credentials", async () => {
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
            farmId: "test-farm-123",
            timelineOverview: { daysSincePlanting: 15 },
            stages: [],
          },
        }),
      };
    };

    try {
      const res = await fetchFarmLifecycle("test-farm-123", { asOfDate: "2026-08-05" });
      assert.equal(res.success, true);
      assert.ok(captured.url.includes("/farms/test-farm-123/lifecycle?asOfDate=2026-08-05"));
      assert.equal(captured.options.credentials, "include");
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test("refreshFarmLifecycle issues POST request", async () => {
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
            farmId: "test-farm-123",
            timelineOverview: { currentStage: { stageCode: "tillering" } },
          },
        }),
      };
    };

    try {
      const res = await refreshFarmLifecycle("test-farm-123");
      assert.equal(res.success, true);
      assert.ok(captured.url.includes("/farms/test-farm-123/lifecycle/refresh"));
      assert.equal(captured.options.method, "POST");
      assert.equal(captured.options.credentials, "include");
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test("fetchCropLifecycleTemplates requests /crop-lifecycle/templates", async () => {
    let captured = null;
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      captured = { url, options };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { templates: [] },
        }),
      };
    };

    try {
      const res = await fetchCropLifecycleTemplates();
      assert.equal(res.success, true);
      assert.ok(captured.url.endsWith("/crop-lifecycle/templates"));
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test("fetchCropLifecycleTemplate includes cropCode and district query", async () => {
    let captured = null;
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      captured = { url, options };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { cropCode: "mustard", districtCode: "cumilla" },
        }),
      };
    };

    try {
      const res = await fetchCropLifecycleTemplate("mustard", "cumilla");
      assert.equal(res.success, true);
      assert.ok(captured.url.includes("/crop-lifecycle/templates/mustard?district=cumilla"));
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test("Translations include complete lifecycle dictionary in English and Bangla", () => {
    assert.ok(translations.en.myFarm.lifecycle);
    assert.ok(translations.bn.myFarm.lifecycle);

    assert.equal(translations.en.myFarm.lifecycle.title, "Crop Lifecycle Timeline");
    assert.equal(translations.bn.myFarm.lifecycle.title, "ফসল জীবনচক্র সময়রেখা");

    assert.ok(translations.en.myFarm.lifecycle.statusBadge.current);
    assert.ok(translations.bn.myFarm.lifecycle.statusBadge.current);

    assert.ok(translations.en.myFarm.lifecycle.estimateDisclaimer);
    assert.ok(translations.bn.myFarm.lifecycle.estimateDisclaimer);

    assert.ok(translations.en.myFarm.lifecycle.nutrientsNotice);
    assert.ok(translations.bn.myFarm.lifecycle.nutrientsNotice);
  });

  await t.test("Lifecycle UI keeps estimated dates and task actions without repeated pending badges", () => {
    const source = readFileSync(new URL("../app/(app)/my-farm/[id]/page.js", import.meta.url), "utf8");
    assert.match(source, /farmUi\.stageTime/);
    assert.match(source, /stg\.estimatedStartDate/);
    assert.match(source, /handleQuickStatus\(act, "IN_PROGRESS"\)/);
    assert.doesNotMatch(source, /myFarm\.activities\.taskStatus\.pending/);
    assert.match(source, /handleQuickStatus\(act, "COMPLETED"\)/);
    assert.doesNotMatch(source, /animate-ping/);
  });
});
