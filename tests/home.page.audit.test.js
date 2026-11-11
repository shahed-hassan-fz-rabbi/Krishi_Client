import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { translations } from "../lib/i18n/translations.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("public footer explores existing pages and localizes the new project content", () => {
  const chrome = read("../components/layout/PublicChrome.js");
  const footer = chrome.slice(chrome.indexOf("export function PublicFooter"));
  for (const [href, key, page] of [
    ["/", "common.home", "../app/page.js"],
    ["/crop-rotation", "publicHeader.cropRotation", "../app/crop-rotation/page.js"],
    ["/climate", "publicHeader.climateData", "../app/(public-data)/climate/page.js"],
    ["/#how-it-works", "common.howItWorks", "../app/page.js"],
    ["/#about", "common.about", "../app/page.js"],
  ]) {
    assert.ok(chrome.includes(`{ href: "${href}", key: "${key}" }`));
    assert.ok(read(page).length > 0);
    for (const lang of ["en", "bn"]) assert.ok(key.split(".").reduce((value, part) => value[part], translations[lang]));
  }
  assert.ok(read("../app/page.js").includes('id="about"'));
  assert.ok(footer.includes('<BrandMark tone="dark" />'));
  assert.ok(footer.includes('sm:grid-cols-[minmax(0,1fr)_auto]'));
  assert.doesNotMatch(footer, /footer\.(features|account|platform)|landing\.footerRights|t\("tagline"\)/);
  assert.doesNotMatch(footer, /GITHUB_REPO_URL|footer\.(team|github|githubPlaceholder)/);
  assert.ok(read("../lib/config.js").includes('GITHUB_REPO_URL = ""'));
  for (const lang of ["en", "bn"]) {
    for (const key of ["tagline", "explore", "project", "team", "github", "githubPlaceholder", "dataFromNasa", "planningNote", "copyright"]) {
      assert.ok(translations[lang].footer[key], `${lang} footer ${key}`);
    }
  }
});

test("home page claims and process descriptions exist in both locales", () => {
  for (const locale of ["en", "bn"]) {
    const landing = translations[locale].landing;
    for (const key of ["featureEvidenceDesc", "step2Desc", "step3Desc", "step4Desc", "sectionData", "sectionAboutBody"]) {
      assert.equal(typeof landing[key], "string", `${locale}.landing.${key}`);
      assert.ok(landing[key].length > 0, `${locale}.landing.${key}`);
    }
  }
  assert.match(translations.en.landing.featureEvidenceDesc, /Signed-in farmers/);
  assert.match(translations.bn.landing.featureEvidenceDesc, /লগইন/);
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

test("homepage POWER coverage is sourced and disclosed as historical data", () => {
  const page = read("../app/page.js");
  assert.match(page, /datasetKey === "nasa:power:daily:point"/);
  assert.match(page, /Number\.isFinite\(powerApiSource\?\.validObservationCount\)/);
  assert.match(page, /firstObservationDate/);
  assert.match(page, /lastObservationDate/);
  assert.match(page, /Historical climate reference/);
  assert.match(page, /Historical daily observations/);
  assert.match(page, /Historical data unavailable/);
  assert.doesNotMatch(page, /109\s*,?\s*572|Live daily observations|Live & Available|25-Year NASA baseline/);
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
