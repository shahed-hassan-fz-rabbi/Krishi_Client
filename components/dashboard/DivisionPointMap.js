"use client";

import { useCallback, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getDivisionPoint } from "@/lib/divisionPoint.js";

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export default function DivisionPointMap({ division, locale }) {
  const point = getDivisionPoint(division);
  const latitude = point?.latitude;
  const longitude = point?.longitude;
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const attachMap = useCallback((container) => {
    if (!container) {
      const map = mapRef.current;
      if (map) map.remove();
      mapRef.current = null;
      markerRef.current = null;
      return;
    }

    const latitude = Number(container.dataset.latitude);
    const longitude = Number(container.dataset.longitude);
    if (!container.isConnected || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const map = L.map(container, { scrollWheelZoom: false });
    map.setView([latitude, longitude], 7, { animate: false });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION }).addTo(map);
    const marker = L.circleMarker([latitude, longitude], {
      radius: 8,
      color: "#fff",
      weight: 3,
      fillColor: "#087443",
      fillOpacity: 1,
    }).addTo(map);
    marker.bindTooltip(container.dataset.label || "");

    mapRef.current = map;
    markerRef.current = marker;
    map.whenReady(() => {
      if (mapRef.current === map && container.isConnected && map.getPane("mapPane")) {
        map.invalidateSize({ pan: false });
      }
    });
  }, []);

  useEffect(() => () => {
    const map = mapRef.current;
    if (map) map.remove();
    mapRef.current = null;
    markerRef.current = null;
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    const container = containerRef.current;
    if (!map || !marker || !container?.isConnected || !Number.isFinite(latitude) || !Number.isFinite(longitude) || !map.getPane("mapPane")) return;

    const label = locale === "bn" ? division?.nameBn : division?.nameEn;
    map.setView([latitude, longitude], 7, { animate: false });
    marker.setLatLng([latitude, longitude]);
    marker.setTooltipContent(label || "");
  }, [latitude, longitude, division?.nameBn, division?.nameEn, locale]);

  if (!point) return null;

  const label = locale === "bn" ? division?.nameBn : division?.nameEn;
  return <div ref={attachMap} data-latitude={point.latitude} data-longitude={point.longitude} data-label={label || ""} className="h-48 w-full overflow-hidden rounded-xl border border-line" aria-label={locale === "bn" ? `${division?.nameBn} মানচিত্র` : `${division?.nameEn} map`} />;
}
