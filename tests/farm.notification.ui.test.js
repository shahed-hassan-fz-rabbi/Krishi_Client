import { test } from "node:test";
import assert from "node:assert/strict";

import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  sendAssistantMessage,
} from "../services/api.js";
import { translations } from "../lib/i18n/translations.js";

test("▶ Smart Farm Notifications & Farm-Aware AI: Client API Contracts & Translations Suite (Phase 9.6)", async (t) => {
  await t.test("API: fetchNotifications structures URL with query params", async () => {
    let capturedUrl = "";
    let capturedOptions = {};

    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: { notifications: [], pagination: { total: 0, unreadCount: 0 } },
        }),
      };
    };

    const res = await fetchNotifications({
      unreadOnly: true,
      farmId: "farm-abc",
      limit: 25,
      offset: 0,
    });

    assert.equal(res.success, true);
    assert.ok(capturedUrl.includes("/notifications?"));
    assert.ok(capturedUrl.includes("unreadOnly=true"));
    assert.ok(capturedUrl.includes("farmId=farm-abc"));
    assert.ok(capturedUrl.includes("limit=25"));
    assert.equal(capturedOptions.credentials, "include");
  });

  await t.test("API: fetchUnreadNotificationCount queries unread-count endpoint", async () => {
    let capturedUrl = "";

    globalThis.fetch = async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: { unreadCount: 4 },
        }),
      };
    };

    const res = await fetchUnreadNotificationCount();
    assert.equal(res.success, true);
    assert.ok(capturedUrl.endsWith("/notifications/unread-count"));
    assert.equal(res.data.unreadCount, 4);
  });

  await t.test("API: markNotificationRead sends PATCH to mark single notification", async () => {
    let capturedUrl = "";
    let capturedMethod = "";

    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedMethod = options.method;
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: { _id: "notif-1", isRead: true },
        }),
      };
    };

    const res = await markNotificationRead("notif-1");
    assert.equal(res.success, true);
    assert.ok(capturedUrl.endsWith("/notifications/notif-1/read"));
    assert.equal(capturedMethod, "PATCH");
  });

  await t.test("API: markAllNotificationsRead sends PATCH with farmId", async () => {
    let capturedUrl = "";
    let capturedBody = {};

    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: { modifiedCount: 3 },
        }),
      };
    };

    const res = await markAllNotificationsRead("farm-123");
    assert.equal(res.success, true);
    assert.ok(capturedUrl.endsWith("/notifications/read-all"));
    assert.equal(capturedBody.farmId, "farm-123");
  });

  await t.test("API: deleteNotification sends DELETE", async () => {
    let capturedUrl = "";
    let capturedMethod = "";

    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedMethod = options.method;
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: null,
        }),
      };
    };

    const res = await deleteNotification("notif-999");
    assert.equal(res.success, true);
    assert.ok(capturedUrl.endsWith("/notifications/notif-999"));
    assert.equal(capturedMethod, "DELETE");
  });

  await t.test("API: sendAssistantMessage forwards farmId parameter", async () => {
    let capturedUrl = "";
    let capturedBody = {};

    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            answer: "Farm response",
            farmId: capturedBody.farmId,
          },
        }),
      };
    };

    const res = await sendAssistantMessage({
      message: "আমার খামারে কী কাজ বাকি আছে?",
      district: "cumilla",
      crop: "monsoon_aman",
      farmId: "farm-test-123",
    });

    assert.equal(res.success, true);
    assert.ok(capturedUrl.endsWith("/assistant/chat"));
    assert.equal(capturedBody.farmId, "farm-test-123");
    assert.equal(capturedBody.district, "cumilla");
    assert.equal(capturedBody.crop, "monsoon_aman");
  });

  await t.test("i18n: bilingual parity for notifications & farmAssistant dictionary", () => {
    const enNotif = translations.en.myFarm?.notifications;
    const bnNotif = translations.bn.myFarm?.notifications;
    assert.ok(enNotif, "en.myFarm.notifications must exist");
    assert.ok(bnNotif, "bn.myFarm.notifications must exist");

    assert.equal(typeof enNotif.title, "string");
    assert.equal(typeof bnNotif.title, "string");
    assert.ok(enNotif.types.ACTIVITY_DUE_TODAY);
    assert.ok(bnNotif.types.ACTIVITY_DUE_TODAY);
    assert.ok(enNotif.types.ACTIVITY_OVERDUE);
    assert.ok(bnNotif.types.ACTIVITY_OVERDUE);
    assert.ok(enNotif.types.LIFECYCLE_STAGE_UPCOMING);
    assert.ok(bnNotif.types.LIFECYCLE_STAGE_UPCOMING);

    const enAssist = translations.en.myFarm?.farmAssistant;
    const bnAssist = translations.bn.myFarm?.farmAssistant;
    assert.ok(enAssist, "en.myFarm.farmAssistant must exist");
    assert.ok(bnAssist, "bn.myFarm.farmAssistant must exist");
    assert.equal(typeof enAssist.bannerTitle, "string");
    assert.equal(typeof bnAssist.bannerTitle, "string");
    assert.ok(enAssist.quickPrompts.activities);
    assert.ok(bnAssist.quickPrompts.activities);
  });
});
