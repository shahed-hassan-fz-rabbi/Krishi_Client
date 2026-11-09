import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.resolve(__dirname, "..");

describe("Auth UI Alignment & Google OAuth UX Suite", () => {
  it("Home hero asset remains scoped to the landing page and is not reused on auth screens", () => {
    const publicImagesDir = path.join(clientDir, "public", "images");
    const imageFiles = fs.readdirSync(publicImagesDir);
    const homeSrc = fs.readFileSync(path.join(clientDir, "app", "page.js"), "utf8");

    assert.strictEqual(imageFiles.includes("hero.jpeg"), true);
    assert.strictEqual(homeSrc.includes('const HERO_SRC = "/images/hero.jpeg"'), true);

    // Verify login and register pages have NO reference to hero.jpeg
    const loginSrc = fs.readFileSync(path.join(clientDir, "app", "login", "page.js"), "utf8");
    const registerSrc = fs.readFileSync(path.join(clientDir, "app", "register", "page.js"), "utf8");
    const heroPanelSrc = fs.readFileSync(
      path.join(clientDir, "components", "auth", "AuthHeroPanel.js"),
      "utf8"
    );

    assert.strictEqual(loginSrc.includes("hero.jpeg"), false);
    assert.strictEqual(registerSrc.includes("hero.jpeg"), false);
    assert.strictEqual(heroPanelSrc.includes("hero.jpeg"), false);

    assert.strictEqual(loginSrc.toLowerCase().includes("vecteezy"), false);
    assert.strictEqual(registerSrc.toLowerCase().includes("vecteezy"), false);
    assert.strictEqual(heroPanelSrc.toLowerCase().includes("vecteezy"), false);
  });

  it("AuthHeroPanel: 100% Vector SVG Agricultural Pattern and deep forest-green gradient", () => {
    const heroPanelSrc = fs.readFileSync(
      path.join(clientDir, "components", "auth", "AuthHeroPanel.js"),
      "utf8"
    );

    // Verify SVG contour lines
    assert.ok(heroPanelSrc.includes("<svg"), "AuthHeroPanel must contain SVG vector overlay");
    assert.ok(heroPanelSrc.includes("agro-grid-pattern"), "AuthHeroPanel must define agricultural pattern");
    assert.ok(heroPanelSrc.includes("from-[#062415]"), "Must use deep forest green gradient palette");
    assert.ok(heroPanelSrc.includes("NASA Earthdata"), "Must cite official NASA Earthdata & BARC");
    assert.ok(heroPanelSrc.includes("h-full"), "Must use h-full to support equal-height grid stretch");
  });

  it("Layout Alignment: items-stretch responsive grid on /login and /register", () => {
    const loginSrc = fs.readFileSync(path.join(clientDir, "app", "login", "page.js"), "utf8");
    const registerSrc = fs.readFileSync(path.join(clientDir, "app", "register", "page.js"), "utf8");

    // Both pages must use items-stretch grid to ensure equal column height
    assert.ok(
      loginSrc.includes("items-stretch"),
      "Login page must use items-stretch for equal panel heights"
    );
    assert.ok(
      registerSrc.includes("items-stretch"),
      "Register page must use items-stretch for equal panel heights"
    );

    // Both pages must embed AuthHeroPanel
    assert.ok(loginSrc.includes("<AuthHeroPanel"), "Login page must embed AuthHeroPanel");
    assert.ok(registerSrc.includes("<AuthHeroPanel"), "Register page must embed AuthHeroPanel");
  });

  it("Refined Step Indicator: Clean 2-segment progress embedded in form header", () => {
    const registerSrc = fs.readFileSync(path.join(clientDir, "app", "register", "page.js"), "utf8");

    // Verify step indicator is inside the form header, not in global <header>
    assert.ok(
      registerSrc.includes("Step 1 of 2: Account"),
      "Must clearly show Step 1 of 2: Account"
    );
    assert.ok(
      registerSrc.includes("Step 2 of 2: Location"),
      "Must clearly show Step 2 of 2: Location"
    );
    assert.ok(
      registerSrc.includes("step >= 1 ? \"bg-emerald\" : \"bg-line\""),
      "Must use 2-segment visual progress treatment"
    );

    // Verify back navigation preserved
    assert.ok(registerSrc.includes("handleBackToStep1"), "Must support back navigation to Step 1");
    assert.ok(registerSrc.includes("popstate"), "Must support browser back button via popstate");
  });

  it("Google OAuth UX: Non-alarming helper notice & official Google mark", () => {
    const loginSrc = fs.readFileSync(path.join(clientDir, "app", "login", "page.js"), "utf8");
    const registerSrc = fs.readFileSync(path.join(clientDir, "app", "register", "page.js"), "utf8");

    // Verify official Google G icon paths
    assert.ok(loginSrc.includes("#4285F4"), "Login must render official Google blue mark");
    assert.ok(loginSrc.includes("#34A853"), "Login must render official Google green mark");
    assert.ok(registerSrc.includes("#4285F4"), "Register must render official Google blue mark");

    // Verify non-alarming status banner instead of jarring red alert
    assert.ok(
      loginSrc.includes("googleNotice"),
      "Login must render informational Google notice"
    );
    assert.ok(
      registerSrc.includes("googleNotice"),
      "Register must render informational Google notice"
    );
  });
});
