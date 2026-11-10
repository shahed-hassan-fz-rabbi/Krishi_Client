import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const project = process.cwd();
const config = fs.readFileSync(path.join(project, "../server/src/config/division.config.js"), "utf8");
const service = fs.readFileSync(path.join(project, "../server/src/services/regional-intelligence.service.js"), "utf8");
const panel = fs.readFileSync(path.join(project, "components/dashboard/DivisionIntelligencePanel.js"), "utf8");
const dashboard = fs.readFileSync(path.join(project, "app/(app)/dashboard/page.js"), "utf8");
const pointMap = fs.readFileSync(path.join(project, "components/dashboard/DivisionPointMap.js"), "utf8");

test("division dashboard wires all eight backend points to a selected division fetch", () => {
  for (const name of ["dhaka", "chattogram", "rajshahi", "khulna", "barishal", "sylhet", "rangpur", "mymensingh"]) {
    assert.ok(config.includes('code: "' + name + '"'), "missing point: " + name);
  }
  assert.match(dashboard, /fetchDivisionIntelligence\(selectedDivision\)/);
  assert.match(dashboard, /response\.data\?\.division\?\.code === selectedDivision/);
});

test("all NASA product cards are API-backed and preserve explicit satellite unavailable states", () => {
  for (const key of ["power", "gpm", "smap", "modis"]) assert.ok(panel.includes('key: "' + key + '"'));
  assert.match(service, /fetchPowerChunk\(/);
  assert.match(service, /No validated GPM sample/);
  assert.match(service, /No quality-approved SMAP sample/);
  assert.match(service, /No quality-validated MODIS composite/);
  assert.match(panel, /available \? value : "—"/);
});

test("division point map follows the selected response coordinates", () => {
  assert.match(panel, /<DivisionPointMap division=\{division\}/);
  assert.match(dashboard, /setDivisionData\(null\)/);
  assert.match(dashboard, /response\.data\?\.division\?\.code === selectedDivision/);
});

test("division point map owns Leaflet lifecycle and guards remount/center updates", () => {
  assert.match(pointMap, /L\.map\(container/);
  assert.match(pointMap, /container\.dataset\.latitude/);
  assert.match(pointMap, /Number\.isFinite\(latitude\).*Number\.isFinite\(longitude\)/);
  assert.match(pointMap, /map\.whenReady\(/);
  assert.match(pointMap, /map\.getPane\("mapPane"\)/);
  assert.match(pointMap, /map\.remove\(\)/);
  assert.match(pointMap, /map\.setView\(\[point\.latitude, point\.longitude\]/);
  assert.match(pointMap, /marker\.setLatLng\(\[point\.latitude, point\.longitude\]\)/);
  assert.doesNotMatch(pointMap, /MapContainer|TileLayer|useMap/);
});

test("division representative point validation rejects missing and out-of-range coordinates", async () => {
  const { getDivisionPoint } = await import("../lib/divisionPoint.js");
  assert.deepEqual(getDivisionPoint({ representativePoint: { latitude: 23.7, longitude: 90.4 } })?.center, [23.7, 90.4]);
  assert.equal(getDivisionPoint(null), null);
  assert.equal(getDivisionPoint({ representativePoint: { latitude: Number.NaN, longitude: 90.4 } }), null);
  assert.equal(getDivisionPoint({ representativePoint: { latitude: 91, longitude: 90.4 } }), null);
  assert.equal(getDivisionPoint({ representativePoint: { latitude: 23.7, longitude: 181 } }), null);
  assert.equal(getDivisionPoint({ representativePoint: { latitude: "23.7", longitude: 90.4 } }), null);
});
