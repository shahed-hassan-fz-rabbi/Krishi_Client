import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.resolve(__dirname, "..");

describe("Auth UI Alignment & Google OAuth UX Suite", () => {
  it("Authentication uses its own farmer image instead of the home hero", () => {
    const publicImagesDir = path.join(clientDir, "public", "images");
    const imageFiles = fs.readdirSync(publicImagesDir);
    const homeSrc = fs.readFileSync(path.join(clientDir, "app", "page.js"), "utf8");

    assert.strictEqual(imageFiles.includes("hero.png"), true);
    assert.strictEqual(homeSrc.includes('const HERO_SRC = "/images/hero.png"'), true);

    // Verify login and register pages have NO reference to hero assets
    const loginSrc = fs.readFileSync(path.join(clientDir, "app", "login", "page.js"), "utf8");
    const registerSrc = fs.readFileSync(path.join(clientDir, "app", "register", "page.js"), "utf8");
    const heroPanelSrc = fs.readFileSync(
      path.join(clientDir, "components", "auth", "AuthHeroPanel.js"),
      "utf8"
    );

    assert.strictEqual(loginSrc.includes("hero.png"), false);
    assert.strictEqual(registerSrc.includes("hero.png"), false);
    assert.strictEqual(heroPanelSrc.includes("hero.png"), false);
    assert.strictEqual(loginSrc.includes("hero.jpeg"), false);
    assert.strictEqual(registerSrc.includes("hero.jpeg"), false);
    assert.strictEqual(heroPanelSrc.includes("hero.jpeg"), false);

    assert.strictEqual(loginSrc.toLowerCase().includes("vecteezy"), false);
    assert.strictEqual(registerSrc.toLowerCase().includes("vecteezy"), false);
    assert.strictEqual(heroPanelSrc.toLowerCase().includes("vecteezy"), false);
  });

  it("Auth panel uses farmer artwork and simple localized text without promotional badges", () => {
    const source = fs.readFileSync(path.join(clientDir, "components", "auth", "AuthHeroPanel.js"), "utf8");
    assert.ok(source.includes('/images/auth-farmer.png'));
    assert.ok(source.includes('t("auth.authPanelTitle")'));
    assert.ok(source.includes('t("auth.authPanelBody")'));
    assert.doesNotMatch(source, /secureSession|NASA Earthdata|BARC|ShieldCheck|agro-grid-pattern|GitHub/);
  });

  it("Login is centered and registration retains its responsive layout", () => {
    const loginSrc = fs.readFileSync(path.join(clientDir, "app", "login", "page.js"), "utf8");
    const registerSrc = fs.readFileSync(path.join(clientDir, "app", "register", "page.js"), "utf8");

    // Both pages must use items-stretch grid to ensure equal column height
    assert.ok(
      loginSrc.includes('className="w-full max-w-lg"'),
      "Login form uses a centered bounded width"
    );
    assert.ok(
      registerSrc.includes('className="w-full max-w-lg"'),
      "Registration uses the same centered width as login"
    );

    // Both pages must embed AuthHeroPanel
    assert.ok(loginSrc.includes('sizes="100vw"'), "Login photo fills its background");
    assert.ok(!loginSrc.includes('t("auth.loginSceneLine1")'));
    assert.ok(!loginSrc.includes('t("auth.loginSceneLine2")'));
    assert.ok(registerSrc.includes('sizes="100vw"'), "Registration uses full background photo");
  });

  it("Registration removes promotional subtitle and progress badges while preserving back navigation", () => {
    const source = fs.readFileSync(path.join(clientDir, "app", "register", "page.js"), "utf8");
    assert.doesNotMatch(source, /t\("auth\.(accountStep|locationStep|registerSubtitle)"\)/);
    assert.ok(source.includes("handleBackToStep1"));
    assert.ok(source.includes("popstate"));
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
