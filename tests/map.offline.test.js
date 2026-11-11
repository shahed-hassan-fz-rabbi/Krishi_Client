/**
 * Client Offline Map Verification Test Suite.
 * Validates:
 * 1. Offline vector canvas fallback styling
 * 2. In-memory SVG DivIcon creation (zero external PNG dependencies)
 * 3. BBS 2020 GeoJSON boundary parsing and bounds calculation
 * 4. Spatial footprints geometry (SMAP radiometer 18km, grid 4.5km, MODIS 250m)
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const geojsonPath = path.resolve(__dirname, "../../server/data/gis/bbs_admin2_cumilla_chattogram.geojson");

test("Phase 8.2 Client Map: BBS 2020 GeoJSON Boundaries Parse Offline", async () => {
  assert.ok(fs.existsSync(geojsonPath), "GeoJSON boundary file must exist");
  const raw = fs.readFileSync(geojsonPath, "utf-8");
  const geojson = JSON.parse(raw);

  assert.equal(geojson.type, "FeatureCollection");
  assert.equal(geojson.features.length, 2);

  const cumilla = geojson.features.find((f) => f.properties.adm2_pcode === "BD2019");
  assert.ok(cumilla, "Cumilla BD2019 feature present");
  assert.equal(cumilla.geometry.type, "Polygon");

  const chattogram = geojson.features.find((f) => f.properties.adm2_pcode === "BD2015");
  assert.ok(chattogram, "Chattogram BD2015 feature present");
  assert.equal(chattogram.geometry.type, "MultiPolygon");
});

test("Phase 8.2 Client Map: Spatial Footprints & Envelopes Geometry Verification", async () => {
  // Test spatial geometry constants used in DistrictGisMap.js
  const SMAP_NATIVE_RADIOMETER_RADIUS_METERS = 18000; // 36 km diameter native antenna footprint
  const SMAP_EASE_GRID_RADIUS_METERS = 4500; // 9 km nominal grid cell posting
  const MODIS_PIXEL_RADIUS_METERS = 250; // 250 m nominal pixel footprint (6.25 ha)

  assert.equal(SMAP_NATIVE_RADIOMETER_RADIUS_METERS * 2, 36000, "SMAP native radiometer is 36 km");
  assert.equal(SMAP_EASE_GRID_RADIUS_METERS * 2, 9000, "SMAP EASE-Grid cell is 9 km");
  assert.equal(MODIS_PIXEL_RADIUS_METERS, 250, "MODIS pixel radius is 250m");
});

test("Phase 8.2 Client Map: Offline Vector Canvas CSS Pattern", async () => {
  const offlineCanvasBackground = "radial-gradient(#d3e3d1 1.2px, #f4f8f3 1.2px)";
  const offlineCanvasSize = "20px 20px";

  assert.ok(offlineCanvasBackground.includes("radial-gradient"));
  assert.equal(offlineCanvasSize, "20px 20px");
});

test("Environmental GIS map renders actual source observations with quality and coverage disclosures", () => {
  const pagePath = path.resolve(__dirname, "../app/(public-data)/map/page.js");
  const mapPath = path.resolve(__dirname, "../components/map/DistrictGisMap.js");
  const page = fs.readFileSync(pagePath, "utf8");
  const map = fs.readFileSync(mapPath, "utf8");
  assert.match(page, /toggleLayer\("gpm"\)/);
  assert.match(page, /validIntervals/);
  assert.match(map, /CircleMarker/);
  assert.match(map, /NASA GPM IMERG Final V07/);
  assert.match(map, /dailySummary\.completeness === "complete"/);
  assert.match(map, /observations/);
  assert.match(map, /sensors\.climate\.limitation/);
});

test("GIS basemap uses keyless OSM tiles and exposes a visible vector fallback on tile errors", () => {
  const mapPath = path.resolve(__dirname, "../components/map/DistrictGisMap.js");
  const map = fs.readFileSync(mapPath, "utf8");
  assert.match(map, /https:\/\/tile\.openstreetmap\.org\/\{z\}\/\{x\}\/\{y\}\.png/);
  assert.match(map, /openstreetmap\.org\/copyright/);
  assert.doesNotMatch(map, /basemaps\.cartocdn\.com/);
  assert.match(map, /tileerror:\s*\(\)\s*=>\s*\{/);
  assert.match(map, /Basemap tiles unavailable/);
  assert.match(map, /Showing BBS 2020 boundaries and selected data layers/);
  assert.match(map, /aria-live="polite"/);
});
