import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getDistrictReferencePoint, getProjectDistricts, isProjectDistrictCode, resolveProjectDistrictCode } from "../lib/districtGeography.js";

const project = process.cwd();
const dashboard = fs.readFileSync(path.join(project, "app/(app)/dashboard/page.js"), "utf8");
const locationPanel = fs.readFileSync(path.join(project, "components/dashboard/DistrictLocationPanel.js"), "utf8");
const locationContext = fs.readFileSync(path.join(project, "contexts/LocationContext.js"), "utf8");
const pointMap = fs.readFileSync(path.join(project, "components/dashboard/DivisionPointMap.js"), "utf8");
const districtConfig = fs.readFileSync(path.join(project, "../server/src/config/climate.config.js"), "utf8");

test("Dashboard is scoped to the configured Cumilla and Chattogram districts", () => {
  assert.match(districtConfig, /code: "chattogram"/);
  assert.match(districtConfig, /code: "cumilla"/);
  assert.deepEqual(["cumilla", "chattogram"].filter(isProjectDistrictCode), ["cumilla", "chattogram"]);
  assert.equal(isProjectDistrictCode("dhaka"), false);
  assert.deepEqual(getProjectDistricts([
    { code: "cumilla", latitude: 23.46, longitude: 91.18 },
    { code: "chattogram", latitude: 22.33, longitude: 91.83 },
    { code: "dhaka", latitude: 23.8, longitude: 90.2 },
    { code: "cumilla", latitude: 95, longitude: 91.18 },
  ]).map((district) => district.code), ["cumilla", "chattogram"]);
  assert.equal(resolveProjectDistrictCode("dhaka", [
    { code: "chattogram", latitude: 22.33, longitude: 91.83, isDefault: true },
    { code: "cumilla", latitude: 23.46, longitude: 91.18 },
  ]), "chattogram");
  assert.match(dashboard, /getProjectDistricts\(districts\)/);
  assert.match(dashboard, /<DistrictLocationPanel district=\{selectedDistrictLocation\}/);
  assert.doesNotMatch(dashboard, /fetchDivisions|fetchDivisionIntelligence|DivisionIntelligencePanel/);
  assert.doesNotMatch(dashboard, /selectedDivision|divisionByDistrict/);
});

test("all NASA Dashboard requests use the same selected district and reject mismatched responses", () => {
  assert.match(dashboard, /fetchClimateSummary\(districtCode\)/);
  assert.match(dashboard, /fetchPrecipitationLatest\(districtCode\)/);
  assert.match(dashboard, /fetchSoilMoistureLatest\(districtCode\)/);
  assert.match(dashboard, /fetchVegetationLatest\(districtCode\)/);
  assert.match(dashboard, /responseBelongsToDistrict\(response\.data, districtCode\)/);
  assert.match(dashboard, /latestDistrictRef\.current !== districtCode/);
  assert.match(dashboard, /latestEnvironmental\.district === selectedDistrict \? latestEnvironmental : null/);
});

test("district location panel explains the reference-point limitation and does not show other divisions", () => {
  assert.match(locationPanel, /Cumilla and Chattogram/);
  assert.match(locationPanel, /not your exact farm location/);
  assert.match(locationPanel, /getDistrictReferencePoint\(district\)/);
  assert.doesNotMatch(locationPanel, /fetchDivisionIntelligence|eight divisions|8 divisions|Dhaka|Rajshahi|Khulna|Barishal|Sylhet|Rangpur|Mymensingh/i);
  assert.match(locationContext, /resolveProjectDistrictCode\(stored, DEFAULT_DISTRICTS\)/);
  assert.match(locationContext, /getProjectDistricts\(res\?\.data\)/);
  assert.match(locationContext, /if \(!getProjectDistricts\(districts\)\.some/);
  assert.match(locationContext, /resolveProjectDistrictCode\(user\?\.preferredDistrict \|\| stored, supportedDistricts\)/);
});

test("district reference coordinates reject missing and out-of-range values", () => {
  assert.deepEqual(getDistrictReferencePoint({ latitude: 23.46, longitude: 91.18 })?.center, [23.46, 91.18]);
  assert.equal(getDistrictReferencePoint(null), null);
  assert.equal(getDistrictReferencePoint({ latitude: Number.NaN, longitude: 91.18 }), null);
  assert.equal(getDistrictReferencePoint({ latitude: 91, longitude: 91.18 }), null);
  assert.equal(getDistrictReferencePoint({ latitude: 23.46, longitude: 181 }), null);
});

test("district reference map guards Leaflet lifecycle and updates the selected coordinate", () => {
  assert.match(pointMap, /L\.map\(container/);
  assert.match(pointMap, /container\.dataset\.latitude/);
  assert.match(pointMap, /map\.whenReady\(/);
  assert.match(pointMap, /map\.remove\(\)/);
  assert.match(pointMap, /map\.setView\(\[latitude, longitude\]/);
  assert.match(pointMap, /marker\.setLatLng\(\[latitude, longitude\]\)/);
});
