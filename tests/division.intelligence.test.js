import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const project = process.cwd();
const config = fs.readFileSync(path.join(project, "../server/src/config/division.config.js"), "utf8");
const service = fs.readFileSync(path.join(project, "../server/src/services/regional-intelligence.service.js"), "utf8");
const panel = fs.readFileSync(path.join(project, "components/dashboard/DivisionIntelligencePanel.js"), "utf8");
const dashboard = fs.readFileSync(path.join(project, "app/(app)/dashboard/page.js"), "utf8");

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
