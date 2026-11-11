import test from "node:test";
import assert from "node:assert/strict";
import { observedTemperature, summarizeMonthlyTemperature, rotationLinkForDistrict, resolveRotationDistrict, fillClimateText } from "../lib/climatePlanning.js";
import { translations } from "../lib/i18n/translations.js";

const row = (mean, years = 25) => ({ stats: { mean }, years_used: years });
test("monthly summary uses recorded averages, preserves zero and reports partial coverage", () => {
  const result = summarizeMonthlyTemperature({ 1: row(0), 4: row(30), 5: row(30), 6: row(null), 7: row(-999), 8: row(23, 0), 9: row("26") });
  assert.equal(result.monthsAvailable, 3);
  assert.equal(result.complete, false);
  assert.deepEqual(result.warmest, { value: 30, months: [4, 5] });
  assert.deepEqual(result.coolest, { value: 0, months: [1] });
});
test("no observations produce no invented extremes or completeness", () => {
  assert.deepEqual(summarizeMonthlyTemperature(), { monthsAvailable: 0, complete: false, warmest: null, coolest: null });
  for (const value of [null, undefined, NaN, Infinity, -999, 100, "25", false]) assert.equal(observedTemperature(value), null);
  assert.equal(summarizeMonthlyTemperature(Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, row(i)]))).complete, true);
});
test("rotation handoff preserves only supported district identifiers", () => {
  assert.equal(rotationLinkForDistrict("chattogram"), "/crop-rotation?district=chattogram");
  assert.equal(rotationLinkForDistrict("cumilla"), "/crop-rotation?district=cumilla");
  assert.equal(rotationLinkForDistrict("https://example.test"), "/crop-rotation");
  assert.equal(resolveRotationDistrict("chattogram", "cumilla"), "chattogram");
  assert.equal(resolveRotationDistrict("bogus", "chattogram"), "chattogram");
  assert.equal(resolveRotationDistrict(null, null), "cumilla");
});
test("farmer-facing summaries and actions are available in both languages", () => {
  assert.deepEqual(Object.keys(translations.en.climatePlanning).sort(), Object.keys(translations.bn.climatePlanning).sort());
  for (const locale of ["en", "bn"]) {
    const result = fillClimateText(translations[locale].climatePlanning.summary, { district: "TEST", warmMonths: "APR", coolMonths: "JAN", warmValue: "30.1", coolValue: "19.2" });
    assert.ok(result.includes("TEST") && result.includes("30.1") && result.includes("19.2"));
    assert.doesNotMatch(result, /\{\w+\}/);
  }
});
