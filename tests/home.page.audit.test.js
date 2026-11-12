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

test("homepage About scope and NASA claims are accurate in English and Bangla", () => {
  const page = read("../app/page.js");
  const layout = read("../app/layout.js");
  assert.ok(page.includes('id="about"'));
  assert.match(page, /Evidence-Based Decision Support|প্রমাণভিত্তিক সিদ্ধান্ত গ্রহণ/);
  assert.match(page, /Our current work focuses on Cumilla and Chattogram/);
  assert.match(page, /বর্তমানে আমাদের কাজ কুমিল্লা ও চট্টগ্রামকে কেন্দ্র করে/);
  assert.match(layout, /currently focused on Cumilla and Chattogram/);
  assert.doesNotMatch(layout, /starting with Chattogram/);

  for (const locale of ["en", "bn"]) {
    const landing = translations[locale].landing;
    assert.match(landing.aboutSubtitle, /Cumilla.*Chattogram|কুমিল্লা.*চট্টগ্রাম/);
    assert.match(landing.sectionAboutBody, /Cumilla.*Chattogram|কুমিল্লা.*চট্টগ্রাম/);
    assert.match(landing.aboutPillar1Desc, /POWER|পাওয়ার/);
    assert.match(landing.aboutPillar1Desc, /GPM|জিপিএম/);
    assert.match(landing.aboutPillar1Desc, /SMAP|স্ম্যাপ/);
    assert.match(landing.aboutPillar1Desc, /MODIS|মডিস/);
    assert.match(landing.aboutPillar3Desc, /quality|missing|গুণমান|অনুপস্থিত/i);
    const aboutCopy = Object.entries(landing)
      .filter(([key]) => key.startsWith("about") || key === "sectionAboutBody")
      .map(([, value]) => value)
      .filter((value) => typeof value === "string")
      .join(" ");
    assert.doesNotMatch(aboutCopy, /25\+|২৫\+|9,131\+|৯,১৩১\+|100%|১০০%/);
  }
});

test("How Krishi Mama Works presents an accurate 4-step decision support path", () => {
  const page = read("../app/page.js");
  const start = page.indexOf('id="how-it-works"');
  const end = page.indexOf('id="data"', start);
  assert.ok(start >= 0 && end > start, "How section is present before the NASA data section");
  const section = page.slice(start, end);
  assert.match(section, /aria-labelledby="how-it-works-title"/);
  assert.match(section, /<ol className=.*sm:grid-cols-2.*lg:grid-cols-4/);
  assert.match(section, /href="\/climate"/);
  assert.match(section, /href="\/crop-rotation"/);

  for (const locale of ["en", "bn"]) {
    const landing = translations[locale].landing;
    for (const key of [
      "howKicker",
      "howStepLabel",
      "sectionHow",
      "sectionHowSub",
      "step1Title",
      "step1Desc",
      "step2Title",
      "step2Desc",
      "step3Title",
      "step3Desc",
      "step4Title",
      "step4Desc",
      "step5Title",
      "step5Desc",
      "howClimateCta",
      "howCtaPlan",
    ]) {
      assert.equal(typeof landing[key], "string", `${locale}.landing.${key}`);
      assert.ok(landing[key].length > 0, `${locale}.landing.${key}`);
    }
  }

  assert.match(translations.en.landing.step1Desc, /Cumilla and Chattogram|Cumilla or Chattogram/);
  assert.match(translations.en.landing.step2Desc, /POWER/);
  assert.match(translations.en.landing.step2Desc, /GPM/);
  assert.match(translations.en.landing.step2Desc, /SMAP/);
  assert.match(translations.en.landing.step2Desc, /MODIS/);
  assert.match(translations.en.landing.step3Desc, /crop calendar|DAE/i);
  assert.match(translations.en.landing.step4Desc, /Crop Rotation|Sowing|Assistant/i);
  assert.match(translations.en.landing.step5Desc, /never false promises|guaranteed crop yields|decision-support/i);
  assert.match(translations.en.landing.step1Desc, /without signing in/);
  assert.match(translations.en.landing.step2Desc, /quality checks/);
  assert.match(translations.en.landing.step2Desc, /stays unavailable/);
  assert.doesNotMatch(translations.en.landing.step1Desc, /ground-verified/i);
  assert.doesNotMatch(translations.en.landing.step3Desc, /calibrated|guaranteed/i);

  assert.match(translations.bn.landing.step1Desc, /কুমিল্লা ও চট্টগ্রাম|কুমিল্লা বা চট্টগ্রাম/);
  assert.match(translations.bn.landing.step1Desc, /লগইন ছাড়াই/);
  assert.match(translations.bn.landing.step2Desc, /POWER|জিপিএম|স্ম্যাপ|মডিস/);
  assert.match(translations.bn.landing.step2Desc, /গুণমান যাচাই/);
  assert.match(translations.bn.landing.step2Desc, /অনুপলব্ধ থাকে/);
  assert.doesNotMatch(translations.bn.landing.step2Desc, /নাসার অনুমোদিত/);
  assert.match(translations.bn.landing.step5Desc, /ফলন নিশ্চয়তা|গ্যারান্টি/);
});
