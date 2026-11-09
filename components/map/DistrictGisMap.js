"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  Circle,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Helper component to smoothly pan/zoom to district center
function MapController({ center, zoom, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 11 });
    } else if (center) {
      map.flyTo(center, zoom || 10, { duration: 1.2 });
    }
  }, [center, zoom, bounds, map]);
  return null;
}

// Custom DivIcons using Lucide-inspired SVG shapes (avoids Leaflet PNG 404s)
function createSensorIcon(type, quality = "good") {
  let bgColor = "#16865a"; // Emerald default
  let iconSvg = "";

  if (type === "climate") {
    bgColor = "#2878c8"; // Climate Blue
    iconSvg = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
      </svg>`;
  } else if (type === "smap") {
    bgColor = quality === "recommended" ? "#0f6c49" : "#e6a23c"; // Dark Green or Amber
    iconSvg = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
        <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
        <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
      </svg>`;
  } else if (type === "modis") {
    bgColor = quality === "good_data" ? "#16865a" : "#b45309"; // Emerald or Amber
    iconSvg = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
      </svg>`;
  }

  const html = `
    <div style="
      background-color: ${bgColor};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    ">
      ${iconSvg}
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-gis-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

export default function DistrictGisMap({
  boundaryData,
  layersData,
  activeLayers = {
    boundary: true,
    gpm: true,
    smap: true,
    modis: true,
    climate: true,
    footprints: true,
  },
  isBn = false,
}) {
  const geoJsonRef = useRef(null);
  const [isOfflineBasemap, setIsOfflineBasemap] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!navigator.onLine) {
        setIsOfflineBasemap(true);
      }
      const handleOffline = () => setIsOfflineBasemap(true);
      const handleOnline = () => setIsOfflineBasemap(false);
      window.addEventListener("offline", handleOffline);
      window.addEventListener("online", handleOnline);
      return () => {
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("online", handleOnline);
      };
    }
  }, []);

  const districtMeta = layersData?.district;
  const sensors = layersData?.sensors;
  const center = districtMeta?.center || [23.46186, 91.18503];
  const zoom = districtMeta?.zoom || 10;

  // Calculate GeoJSON bounds
  let mapBounds = null;
  if (districtMeta?.bbox) {
    const [minLon, minLat, maxLon, maxLat] = districtMeta.bbox;
    mapBounds = [
      [minLat, minLon],
      [maxLat, maxLon],
    ];
  }

  // Boundary styling
  const boundaryStyle = {
    color: "#123d2b",
    weight: 2.5,
    opacity: 0.9,
    fillColor: "#16865a",
    fillOpacity: 0.12,
    dashArray: "4, 4",
  };

  const smapObs = sensors?.soilMoisture?.observation;
  const smapLoc = sensors?.soilMoisture?.extractedPixelLocation;
  const smapPos = smapLoc ? [smapLoc.latitude, smapLoc.longitude] : null;

  const modisObs = sensors?.vegetation?.observation;
  const modisLoc = sensors?.vegetation?.extractedPixelLocation;
  const modisPos = modisLoc ? [modisLoc.latitude, modisLoc.longitude] : null;

  const climateLoc = sensors?.climate?.location;
  const climatePos = climateLoc ? [climateLoc.latitude, climateLoc.longitude] : null;
  const gpm = sensors?.precipitation;
  const gpmPos = gpm?.location ? [gpm.location.latitude, gpm.location.longitude] : null;

  return (
    <div className="relative h-[620px] w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
      {/* Offline Vector Mode Banner */}
      {isOfflineBasemap && (
        <div className="pointer-events-auto absolute top-4 right-4 z-[1000] flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50/95 px-3 py-2 text-xs font-medium text-amber-900 shadow-md backdrop-blur-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <div>
            <span className="font-bold block">
              {isBn ? "অফলাইন ভেক্টর মোড (টাইলস ব্যতিরেকে)" : "Offline Vector Mode"}
            </span>
            <span className="text-[11px] text-amber-800">
              {isBn
                ? "BBS সীমানা ও সেন্সর স্তর সম্পূর্ণ সক্রিয়"
                : "BBS 2020 boundaries & sensor overlays active"}
            </span>
          </div>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{
          background: isOfflineBasemap
            ? "radial-gradient(#d3e3d1 1.2px, #f4f8f3 1.2px)"
            : "#eef4ec",
          backgroundSize: isOfflineBasemap ? "20px 20px" : "auto",
        }}
      >
        <MapController center={center} zoom={zoom} bounds={mapBounds} />

        {/* High-quality CartoDB Voyager Tile Layer with graceful error recovery */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
          eventHandlers={{
            tileerror: () => {
              setIsOfflineBasemap(true);
            },
          }}
        />

        {/* Official BBS 2020 Admin-2 Boundary Polygon */}
        {activeLayers.boundary && boundaryData && (
          <GeoJSON
            key={districtMeta?.code || "boundary"}
            ref={geoJsonRef}
            data={boundaryData}
            style={boundaryStyle}
            onEachFeature={(feature, layer) => {
              const props = feature.properties || {};
              const pCode = props.adm2_pcode || districtMeta?.pCode;
              const name = props.adm2_en || districtMeta?.nameEn;
              layer.bindTooltip(
                `<strong>${name}</strong> (${pCode})<br/><span style="font-size: 11px; color: #5c6b62;">BBS 2020 Official Admin-2 Boundary</span>`,
                { sticky: true }
              );
            }}
          />
        )}

        {/* Spatial Footprints (Circles showing physical pixel resolution and antenna footprints) */}
        {activeLayers.footprints && (
          <>
            {/* SMAP ~36 km native radiometer footprint */}
            {activeLayers.smap && smapPos && (
              <Circle
                center={smapPos}
                radius={18000}
                pathOptions={{
                  color: "#d97706",
                  weight: 1.5,
                  fillColor: "#fbbf24",
                  fillOpacity: 0.05,
                  dashArray: "6, 6",
                }}
              />
            )}

            {/* SMAP 9 km EASE-Grid posting */}
            {activeLayers.smap && smapPos && (
              <Circle
                center={smapPos}
                radius={4500}
                pathOptions={{
                  color: "#d97706",
                  weight: 2,
                  fillColor: "#f59e0b",
                  fillOpacity: 0.15,
                }}
              />
            )}

            {/* MODIS 250 m nominal pixel footprint */}
            {activeLayers.modis && modisPos && (
              <Circle
                center={modisPos}
                radius={250}
                pathOptions={{
                  color: "#16865a",
                  weight: 2,
                  fillColor: "#34d399",
                  fillOpacity: 0.25,
                }}
              />
            )}
          </>
        )}

        {/* NASA POWER Climate Reference Pin */}
        {activeLayers.climate && climatePos && (
          <Marker position={climatePos} icon={createSensorIcon("climate")}>
            <Popup className="km-gis-popup">
              <div className="p-1 space-y-1 text-xs">
                <div className="font-bold text-sm text-ink flex items-center justify-between gap-2 border-b pb-1">
                  <span>NASA POWER Climate Reference</span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-mono">0.5° Grid</span>
                </div>
                <div className="text-ink-muted">
                  <strong>{isBn ? "স্থানাঙ্ক:" : "Coordinates:"}</strong> {climateLoc.latitude.toFixed(5)}° N, {climateLoc.longitude.toFixed(5)}° E
                </div>
                <div className="text-ink-muted">
                  <strong>{isBn ? "সময়মান:" : "Time Standard:"}</strong> LST (Local Solar Time)
                </div>
                {Object.keys(sensors.climate.observations || {}).length > 0 && <div className="border-t pt-1 text-[11px] text-ink-muted">
                  {Object.entries(sensors.climate.observations).map(([key, item]) => <div key={key}>{key}: {item.value} {item.unit} · {isBn ? "পর্যবেক্ষণ" : "observed"} {item.observationDate}</div>)}
                </div>}
                <div className="text-[11px] text-ink-muted/90 bg-surface-2 p-1.5 rounded mt-1">
                  {sensors.climate.limitation || sensors.climate.description}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {activeLayers.gpm && gpmPos && gpm && <CircleMarker center={gpmPos} radius={10} pathOptions={{ color: "#075985", weight: 2, fillColor: "#38bdf8", fillOpacity: 0.8 }}>
          <Popup className="km-gis-popup"><div className="p-1 space-y-1.5 text-xs">
            <div className="font-bold text-sm border-b pb-1">NASA GPM IMERG Final V07</div>
            <div>{isBn ? "পর্যবেক্ষণের তারিখ:" : "Observation date:"} {gpm.observation.dailySummary.dateLabel}</div>
            <div>{isBn ? "দৈনিক বৃষ্টিপাত:" : "Daily rainfall:"} {gpm.observation.dailySummary.completeness === "complete" ? `${gpm.observation.dailySummary.totalPrecipitationMm} mm` : (isBn ? "উপলব্ধ নয় — অসম্পূর্ণ দিন" : "Unavailable — incomplete day")}</div>
            <div>{gpm.observation.dailySummary.validIntervals}/48 {isBn ? "বৈধ অর্ধঘণ্টা ব্যবধান" : "valid half-hour intervals"} · {gpm.nativeResolution}</div>
            <div className="border-t pt-1 text-[10px] text-ink-muted">{gpm.spatialDisclosure}</div>
          </div></Popup>
        </CircleMarker>}

        {/* NASA SMAP Soil Moisture Observation Pin */}
        {activeLayers.smap && smapPos && smapObs && (
          <Marker position={smapPos} icon={createSensorIcon("smap", smapObs.qualityClassification)}>
            <Popup className="km-gis-popup">
              <div className="p-1 space-y-1.5 text-xs">
                <div className="font-bold text-sm text-ink flex items-center justify-between gap-2 border-b pb-1">
                  <span>NASA SMAP SPL3SMP_E</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      smapObs.isRecommendedQuality ? "bg-emerald/20 text-emerald-strong" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {smapObs.qualityClassification}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 py-1">
                  <div className="bg-surface-2 p-1.5 rounded">
                    <span className="text-[10px] text-ink-muted block">{isBn ? "মাটির আর্দ্রতা" : "Soil Moisture"}</span>
                    <span className="font-bold text-sm text-ink font-mono">{smapObs.soilMoisture} m³/m³</span>
                  </div>
                  <div className="bg-surface-2 p-1.5 rounded">
                    <span className="text-[10px] text-ink-muted block">{isBn ? "অরবিট / তারিখ" : "Orbit / Date"}</span>
                    <span className="font-medium text-xs text-ink font-mono">{smapObs.orbit} ({smapObs.dateLabel})</span>
                  </div>
                </div>
                <div className="text-[11px] text-ink-muted">
                  <strong>{isBn ? "পিক্সেল স্থানাঙ্ক:" : "Pixel Coord:"}</strong> {smapLoc.latitude.toFixed(5)}° N, {smapLoc.longitude.toFixed(5)}° E ({sensors.soilMoisture.geodesicDistanceKm} km from ref)
                </div>
                <div className="text-[10px] text-ink-muted/80 border-t pt-1">
                  {sensors.soilMoisture.spatialDisclosure}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* NASA MODIS Vegetation Observation Pin */}
        {activeLayers.modis && modisPos && modisObs && (
          <Marker position={modisPos} icon={createSensorIcon("modis", modisObs.qualityClassification)}>
            <Popup className="km-gis-popup">
              <div className="p-1 space-y-1.5 text-xs">
                <div className="font-bold text-sm text-ink flex items-center justify-between gap-2 border-b pb-1">
                  <span>NASA MODIS MOD13Q1</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      modisObs.isReliableQuality ? "bg-emerald/20 text-emerald-strong" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {modisObs.qualityClassification}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 py-1">
                  <div className="bg-surface-2 p-1.5 rounded">
                    <span className="text-[10px] text-ink-muted block">NDVI (Greenness)</span>
                    <span className="font-bold text-sm text-ink font-mono">{modisObs.ndvi}</span>
                  </div>
                  <div className="bg-surface-2 p-1.5 rounded">
                    <span className="text-[10px] text-ink-muted block">EVI (Canopy)</span>
                    <span className="font-bold text-sm text-ink font-mono">{modisObs.evi}</span>
                  </div>
                </div>
                <div className="text-[11px] text-ink-muted">
                  <strong>{isBn ? "তারিখ (DOY):" : "Date (DOY):"}</strong> {modisObs.dateLabel} (DOY {modisObs.compositeDayOfYear}) | Tile {modisObs.modisTile}
                </div>
                <div className="text-[10px] text-ink-muted/80 border-t pt-1">
                  {sensors.vegetation.spatialDisclosure}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Floating Legend */}
      <div className="pointer-events-auto absolute bottom-4 left-4 z-[1000] max-w-[280px] rounded-xl border border-line/80 bg-surface/95 p-3 text-xs shadow-md backdrop-blur-xs">
        <span className="font-bold text-ink block mb-1.5">{isBn ? "মানচিত্র নির্দেশিকা (Legend)" : "Map Legend & Provenance"}</span>
        <div className="space-y-1.5 text-[11px] text-ink-muted">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-5 rounded border border-emerald-900 border-dashed bg-emerald-500/20"></span>
            <span>BBS 2020 Admin-2 Boundary</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-[#0f6c49] border border-white"></span>
            <span>SMAP Soil Moisture (9 km cell)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-[#16865a] border border-white"></span>
            <span>MODIS Vegetation (250m pixel)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-[#2878c8] border border-white"></span>
            <span>NASA POWER Climate Reference</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-[#2f8fd3] border border-white"></span>
            <span>GPM IMERG precipitation grid</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-5 rounded border border-amber-500 border-dashed bg-amber-400/10"></span>
            <span>~36 km Radiometer Footprint</span>
          </div>
        </div>
      </div>
    </div>
  );
}
