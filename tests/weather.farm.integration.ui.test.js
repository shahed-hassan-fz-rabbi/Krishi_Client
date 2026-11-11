import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const clientRoot = resolve(__dirname, "..");

const weatherPanel = readFileSync(resolve(clientRoot, "components/dashboard/WeatherIntelligenceSection.js"), "utf8");
const cropPlanning = readFileSync(resolve(clientRoot, "app/(app)/my-farm/plan/page.js"), "utf8");
const farmDetails = readFileSync(resolve(clientRoot, "app/(app)/my-farm/[id]/page.js"), "utf8");

test("weather panel rejects out-of-order farm and district responses and identifies stale cache", () => {
  assert.match(weatherPanel, /activeRequest = useRef\(0\)/);
  assert.match(weatherPanel, /requestId !== activeRequest\.current/);
  assert.match(weatherPanel, /activeRequest\.current \+= 1/);
  assert.match(weatherPanel, /Stale cache/);
  assert.match(weatherPanel, /previously cached result/);
  assert.match(weatherPanel, /officialWarningsStatus === "UNAVAILABLE"/);
  assert.match(weatherPanel, /officialWarningsCheckedAt/);
});

test("crop planning and lifecycle views request weather for the selected owned farm", () => {
  assert.match(cropPlanning, /selectedFarm && \(/);
  assert.match(cropPlanning, /farmId=\{String\(selectedFarm\._id\)\}/);
  assert.match(cropPlanning, /crop=\{formData\.preferredCrop \|\| selectedFarm\.crop\?\.cropCode/);
  assert.match(cropPlanning, /districtCode \|\| selectedFarm\.location\?\.district/);
  assert.match(farmDetails, /farmId=\{String\(farm\._id\)\}/);
  assert.match(farmDetails, /crop=\{farm\.crop\?\.cropCode/);
});
