import test from "node:test";
import assert from "node:assert/strict";
import { isPrivatePath, isPublicDataPath, safeReturnTo } from "../lib/access.js";
import { translations } from "../lib/i18n/translations.js";
import { compareCropRotations, previewCropRotations, saveRotationPlan } from "../services/api.js";

test("only personal workflows require sign-in and redirects cannot escape the app", () => {
  for (const path of ["/my-farm", "/my-farm/new", "/assistant", "/settings", "/rotation-planner"]) assert.ok(isPrivatePath(path));
  for (const path of ["/", "/crop-rotation", "/climate", "/data-sources", "/dashboard"]) assert.equal(isPrivatePath(path), false);
  for (const path of ["/climate", "/rainfall", "/soil-moisture", "/vegetation", "/map", "/data-sources"]) assert.equal(isPublicDataPath(path), true);
  assert.equal(isPublicDataPath("/dashboard"), false);
  assert.equal(safeReturnTo("/rotation-planner"), "/rotation-planner");
  for (const path of [null, "https://evil.test", "//evil.test", "/my-farm/../evil", "/my-farm/%2f%2fevil", "/assistant?next=evil", "/my-farm\\evil"]) assert.equal(safeReturnTo(path), "/dashboard");
});

test("all new nested comparison labels have both languages", () => {
  function compare(a, b, path = "") {
    for (const key of Object.keys(a)) {
      assert.ok(key in b, path + key);
      if (a[key] && typeof a[key] === "object") compare(a[key], b[key], `${path}${key}.`);
      else assert.equal(typeof b[key], "string", path + key);
    }
  }
  compare(translations.en.rotation, translations.bn.rotation);
  compare(translations.bn.rotation, translations.en.rotation);
  compare(translations.en.rotationGuide, translations.bn.rotationGuide);
  compare(translations.bn.rotationGuide, translations.en.rotationGuide);
});

test("comparison and saving call separate private endpoints with session credentials", async () => {
  const original = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => { calls.push({ url, options }); return { ok: true, status: 200, json: async () => ({ success: true, data: {} }) }; };
  try {
    const input = { districtCode: "cumilla", baseline: ["monsoon_aman"] };
    await compareCropRotations(input);
    await saveRotationPlan({ input, selectedStrategyId: "baseline" });
    await previewCropRotations(input);
    assert.ok(calls[0].url.endsWith("/rotations/compare"));
    assert.ok(calls[1].url.endsWith("/rotations/plans"));
    assert.ok(calls[2].url.endsWith("/rotations/preview"));
    assert.equal(calls[0].options.credentials, "include");
    assert.deepEqual(JSON.parse(calls[0].options.body), input);
  } finally { global.fetch = original; }
});
