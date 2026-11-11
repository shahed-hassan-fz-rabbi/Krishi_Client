import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { translations } from "../lib/i18n/translations.js";

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");

test("public header provides separate guest and authenticated dashboard actions", () => {
  const header = read("../components/layout/PublicChrome.js");
  assert.match(header, /isAuthenticated\s*\?\s*t\("publicHeader\.myDashboard"\)/);
  assert.match(header, /:\s*t\("publicHeader\.exploreDashboard"\)/);
  assert.match(header, /t\("auth\.login"\)/);
  assert.doesNotMatch(header, /t\("auth\.register"\)/);
  assert.match(header, /isAuthenticated\s*&&\s*user\s*\?/);
  assert.match(header, /<NotificationCenter\s*\/>/);
  assert.match(header, /aria-haspopup="menu"/);
  assert.match(header, /await logout\(\);\s*router\.push\("\/"\)/);
});

test("authenticated profile menu links supported workflows and labels unavailable advisories honestly", () => {
  const header = read("../components/layout/PublicChrome.js");
  for (const route of ["/settings", "/my-farm", "/assistant"]) assert.ok(header.includes(`href: "${route}"`));
  assert.match(header, /disabled: true, label: t\("publicHeader\.savedAdvisories"\)/);
  assert.match(header, /aria-disabled="true"/);
  assert.match(header, /renderProfileItems/);
});

test("homepage dashboard remains public and auth forms keep their existing redirects", () => {
  const appLayout = read("../app/(app)/layout.js");
  const login = read("../app/login/page.js");
  const register = read("../app/register/page.js");
  assert.ok(read("../app/(app)/dashboard/page.js").length > 0);
  assert.doesNotMatch(appLayout, /useAuth|redirect\(/);
  assert.match(login, /router\.push\(returnTo\)/);
  assert.match(register, /router\.push\(safeReturnTo/);
  assert.match(register, /Step 2 = Location/);
});

test("public header labels are translated in English and Bangla", () => {
  for (const locale of ["en", "bn"]) {
    const labels = translations[locale].publicHeader;
    for (const key of ["exploreDashboard", "myDashboard", "myProfile", "chatHistory", "savedAdvisories", "alertPreferences", "accountSettings"]) {
      assert.equal(typeof labels[key], "string", `${locale}.publicHeader.${key}`);
      assert.ok(labels[key].length > 0);
    }
  }
  assert.equal(translations.en.publicHeader.exploreDashboard, "Explore Dashboard");
  assert.equal(translations.en.publicHeader.myDashboard, "My Dashboard");
});
