import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
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

test("guest and signed-in rotation routes share the same farmer-facing planner overview", async () => {
  const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  const [planner, publicRoute, privateRoute] = await Promise.all([
    readFile(path.join(root, "components/RotationPlanner.js"), "utf8"),
    readFile(path.join(root, "app/crop-rotation/page.js"), "utf8"),
    readFile(path.join(root, "app/(app)/rotation-planner/page.js"), "utf8"),
  ]);
  assert.match(planner, /<RotationOverview publicMode=\{publicMode\} \/>/);
  assert.match(publicRoute, /<RotationPlanner publicMode initialDistrict=\{district\}/);
  assert.match(privateRoute, /<PrivateAccess>/);
  assert.match(privateRoute, /<RotationPlanner key=/);
  assert.doesNotMatch(publicRoute, /fetchFarms|fetchRotationPlans|saveRotationPlan/);
});

test("public rotation preview never loads private farm data and uses the selected district", async () => {
  const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  const [planner, privateRoute] = await Promise.all([
    readFile(path.join(root, "components/RotationPlanner.js"), "utf8"),
    readFile(path.join(root, "app/(app)/rotation-planner/page.js"), "utf8"),
  ]);
  assert.match(planner, /if \(publicMode\) return;[\s\S]*?Promise\.all\(\[fetchFarms\(\), fetchRotationPlans\(\)\]\)/);
  assert.match(planner, /const \{ selectedDistrict \} = useLocation\(\)/);
  assert.match(planner, /districtCode: startingDistrict/);
  assert.match(privateRoute, /\$\{selectedDistrict\}/);
  assert.match(planner, /publicMode \? previewCropRotations : compareCropRotations/);
});

test("rotation overview uses the existing homepage hero image with a neutral readable overlay", async () => {
  const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  const overview = await readFile(path.join(root, "components/RotationOverview.js"), "utf8");
  assert.match(overview, /from "next\/image"/);
  assert.match(overview, /src="\/images\/hero\.png"/);
  assert.match(overview, /from-slate-950\/75[\s\S]*to-amber-950\/20/);
  assert.match(overview, /dark:bg-slate-950\/85/);
  assert.doesNotMatch(overview, /bg-gradient-to-br from-forest to-forest/);
});


test("auth contact input accepts email and normalized Bangladesh phone numbers", async () => {
  const { parseAuthContact } = await import("../lib/authContact.js");
  assert.deepEqual(parseAuthContact(" USER@Example.com "), { email: "user@example.com" });
  for (const value of ["01712345678", "+8801712345678", "০১৭১২৩৪৫৬৭৮"]) assert.deepEqual(parseAuthContact(value), { phone: "+8801712345678" });
  for (const value of ["01212345678", "bad@email", "0171234567", "", null]) assert.equal(parseAuthContact(value), null);
});


test("account API forwards phone registration and email-or-phone login without dropping fields", async () => {
  const { registerUser, loginUser } = await import("../services/api.js");
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push(JSON.parse(options.body)); return { ok: true, status: 200, json: async () => ({ data: {} }) }; };
  try {
    await registerUser({ name: "Farmer", phone: "+8801712345678", password: "test-password", preferredDistrict: "cumilla" });
    await loginUser({ identifier: "01712345678", password: "test-password" });
    assert.equal(calls[0].phone, "+8801712345678");
    assert.equal(calls[0].email, undefined);
    assert.equal(calls[1].identifier, "01712345678");
  } finally { globalThis.fetch = original; }
});


test("public crop rotation keeps guest navigation and uses the app shell when signed in", async () => {
  const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  const page = await readFile(path.join(root, "app/crop-rotation/page.js"), "utf8");
  assert.match(page, /if \(isLoading\) return/);
  assert.match(page, /if \(user\) return <AppShell>/);
  assert.match(page, /<PublicHeader \/>/);
  assert.match(page, /<PublicFooter \/>/);
  assert.doesNotMatch(page, /router\.(push|replace)/);
});
