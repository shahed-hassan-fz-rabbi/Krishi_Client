import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { translations } from "../lib/i18n/translations.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("public footer feature links target their existing routes", () => {
  const chrome = read("../components/layout/PublicChrome.js");
  for (const [href, key] of [
    ["/climate", "nav.climate"],
    ["/rainfall", "nav.rainfall"],
    ["/soil-moisture", "nav.soilMoisture"],
    ["/vegetation", "nav.vegetation"],
  ]) {
    assert.match(chrome, new RegExp(`<Link href="${href}"[\\s\\S]*?t\\("${key}"\\)`));
  }
  assert.match(chrome, /aria-expanded=\{open\}/);
  assert.match(chrome, /aria-controls="public-mobile-navigation"/);
});

test("home page claims and process descriptions exist in both locales", () => {
  for (const locale of ["en", "bn"]) {
    const landing = translations[locale].landing;
    for (const key of ["featureEvidenceDesc", "step2Desc", "step3Desc", "step4Desc", "sectionData", "sectionAboutBody"]) {
      assert.equal(typeof landing[key], "string", `${locale}.landing.${key}`);
      assert.ok(landing[key].length > 0, `${locale}.landing.${key}`);
    }
  }
  assert.match(translations.en.landing.featureEvidenceDesc, /recommendations are not available yet/i);
  assert.match(translations.bn.landing.featureEvidenceDesc, /সুপারিশ দেওয়া হয় না/);
});

test("homepage satellite availability is read from the environmental data catalog", () => {
  const page = read("../app/page.js");
  assert.match(page, /fetchDataSources\(\)/);
  assert.match(page, /const getSourceStatus = \(datasetKey\)/);
  for (const datasetKey of ["nasa:smap:spl3smp_e:v006", "nasa:gpm:imerg:3imerghh:v07", "nasa:modis:mod13q1:v061"]) {
    assert.ok(page.includes(datasetKey), `${datasetKey} availability is displayed`);
  }
  assert.match(page, /historical observations/);
  assert.doesNotMatch(page, /statusPlanned/);
});

test("hero uses conflict-free theme-specific button variants and keeps its overlay above the image", () => {
  const page = read("../app/page.js");
  const button = read("../components/ui/Button.js");
  assert.match(page, /variant="hero"/);
  assert.match(page, /variant="heroOutline"/);
  assert.ok(page.indexOf("src={HERO_SRC}") < page.indexOf("bg-gradient-to-br from-forest\/85"));
  assert.match(button, /hero: "border border-white\/70 bg-white text-forest/);
  assert.match(button, /heroOutline: "border border-white\/60 bg-transparent text-white/);
});

test("homepage feature and workflow labels resolve in their landing translation namespace", () => {
  const page = read("../app/page.js");
  assert.match(page, /t\(`landing\.\$\{f\.titleKey\}`\)/);
  assert.match(page, /t\(`landing\.\$\{f\.descKey\}`\)/);
  assert.match(page, /t\(`landing\.\$\{s\.titleKey\}`\)/);
  assert.match(page, /t\(`landing\.\$\{s\.descKey\}`\)/);
});
