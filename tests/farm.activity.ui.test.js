import { test } from "node:test";
import assert from "node:assert/strict";

import {
  fetchFarmActivities,
  createFarmActivity,
  updateFarmActivity,
  deleteFarmActivity,
  generateFarmActivities,
  fetchActivitiesOverview,
  fetchActivitiesNotificationReadiness,
} from "../services/api.js";
import { translations } from "../lib/i18n/translations.js";

test("▶ My Farm Activities: Client API Contracts & Translations Suite (Phase 9.5)", async (t) => {
  await t.test("API: fetchFarmActivities structures URL with query params", async () => {
    let capturedUrl = "";
    let capturedOptions = {};

    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: { activities: [], counts: { TOTAL: 0 } },
        }),
      };
    };

    const res = await fetchFarmActivities("farm-123", {
      status: "PENDING",
      stageCode: "seedbed",
      activityType: "sowing",
    });

    assert.equal(res.success, true);
    assert.ok(capturedUrl.includes("/farms/farm-123/activities?"));
    assert.ok(capturedUrl.includes("status=PENDING"));
    assert.ok(capturedUrl.includes("stageCode=seedbed"));
    assert.ok(capturedUrl.includes("activityType=sowing"));
    assert.equal(capturedOptions.credentials, "include");
  });

  await t.test("API: createFarmActivity sends POST with custom task payload", async () => {
    let capturedUrl = "";
    let capturedBody = {};

    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: { _id: "act-1", title: capturedBody.title },
        }),
      };
    };

    const res = await createFarmActivity("farm-123", {
      title: "Mulching Bed",
      scheduledDate: "2026-03-01",
      activityType: "weeding",
    });

    assert.equal(res.success, true);
    assert.ok(capturedUrl.includes("/farms/farm-123/activities"));
    assert.equal(capturedBody.title, "Mulching Bed");
    assert.equal(capturedBody.activityType, "weeding");
  });

  await t.test("API: updateFarmActivity sends PATCH with status and note", async () => {
    let capturedUrl = "";
    let capturedMethod = "";
    let capturedBody = {};

    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedMethod = options.method;
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({ success: true, data: capturedBody }),
      };
    };

    const res = await updateFarmActivity("farm-123", "act-456", {
      status: "COMPLETED",
      completionNote: "Finished smoothly",
    });

    assert.equal(res.success, true);
    assert.ok(capturedUrl.includes("/farms/farm-123/activities/act-456"));
    assert.equal(capturedMethod, "PATCH");
    assert.equal(capturedBody.status, "COMPLETED");
    assert.equal(capturedBody.completionNote, "Finished smoothly");
  });

  await t.test("API: deleteFarmActivity sends DELETE to farm activity endpoint", async () => {
    let capturedUrl = "";
    let capturedMethod = "";

    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedMethod = options.method;
      return {
        ok: true,
        json: async () => ({ success: true, data: { deletedId: "act-456" } }),
      };
    };

    const res = await deleteFarmActivity("farm-123", "act-456");
    assert.equal(res.success, true);
    assert.ok(capturedUrl.includes("/farms/farm-123/activities/act-456"));
    assert.equal(capturedMethod, "DELETE");
  });

  await t.test("API: generateFarmActivities issues POST to /farms/:id/activities/generate", async () => {
    let capturedUrl = "";
    let capturedMethod = "";

    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedMethod = options.method;
      return {
        ok: true,
        json: async () => ({ success: true, data: { generatedCount: 5 } }),
      };
    };

    const res = await generateFarmActivities("farm-123");
    assert.equal(res.success, true);
    assert.ok(capturedUrl.includes("/farms/farm-123/activities/generate"));
    assert.equal(capturedMethod, "POST");
  });

  await t.test("API: fetchActivitiesOverview requests /farms/activities/overview", async () => {
    let capturedUrl = "";

    globalThis.fetch = async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: { hasFarms: true, todayActivities: [], counts: { pending: 2 } },
        }),
      };
    };

    const res = await fetchActivitiesOverview();
    assert.equal(res.success, true);
    assert.ok(capturedUrl.includes("/farms/activities/overview"));
  });

  await t.test("API: fetchActivitiesNotificationReadiness requests /farms/activities/notifications-readiness", async () => {
    let capturedUrl = "";

    globalThis.fetch = async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: { alertCount: 1, alerts: [] },
        }),
      };
    };

    const res = await fetchActivitiesNotificationReadiness();
    assert.equal(res.success, true);
    assert.ok(capturedUrl.includes("/farms/activities/notifications-readiness"));
  });

  await t.test("Translations: English and Bengali activity keys are complete", () => {
    const enActs = translations.en?.myFarm?.activities;
    const bnActs = translations.bn?.myFarm?.activities;

    assert.ok(enActs, "English activities namespace must exist");
    assert.ok(bnActs, "Bengali activities namespace must exist");

    assert.ok(enActs.title);
    assert.ok(bnActs.title);
    assert.ok(enActs.todayTasks);
    assert.ok(bnActs.todayTasks);
    assert.ok(enActs.upcomingTasks);
    assert.ok(bnActs.upcomingTasks);
    assert.ok(enActs.historyTitle);
    assert.ok(bnActs.historyTitle);

    // Statuses
    assert.ok(enActs.taskStatus?.pending);
    assert.ok(bnActs.taskStatus?.pending);
    assert.ok(enActs.taskStatus?.inProgress);
    assert.ok(bnActs.taskStatus?.inProgress);
    assert.ok(enActs.taskStatus?.completed);
    assert.ok(bnActs.taskStatus?.completed);
    assert.ok(enActs.taskStatus?.skipped);
    assert.ok(bnActs.taskStatus?.skipped);

    // Types
    const requiredTypes = [
      "field_preparation",
      "sowing",
      "transplanting",
      "irrigation_monitoring",
      "weeding",
      "fertilizer_application",
      "pest_scouting",
      "harvesting",
    ];

    for (const tType of requiredTypes) {
      assert.ok(enActs.types?.[tType], `EN type ${tType} must exist`);
      assert.ok(bnActs.types?.[tType], `BN type ${tType} must exist`);
    }

    // Modal
    assert.ok(enActs.modal?.createTitle);
    assert.ok(bnActs.modal?.createTitle);
    assert.ok(enActs.modal?.completeTitle);
    assert.ok(bnActs.modal?.completeTitle);
    assert.ok(enActs.modal?.rescheduleTitle);
    assert.ok(bnActs.modal?.rescheduleTitle);
    assert.ok(enActs.modal?.cannotDeleteOfficial);
    assert.ok(bnActs.modal?.cannotDeleteOfficial);
  });
});
