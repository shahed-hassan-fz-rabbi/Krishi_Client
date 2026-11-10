"use client";

import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 7, { animate: false });
  }, [center, map]);
  return null;
}

export default function DivisionPointMap({ division, locale }) {
  const point = division?.representativePoint;
  if (!point) return null;
  const center = [point.latitude, point.longitude];
  return (
    <div className="h-48 overflow-hidden rounded-xl border border-line">
      <MapContainer center={center} zoom={7} scrollWheelZoom={false} className="h-full w-full">
        <Recenter center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker center={center} radius={8} pathOptions={{ color: "#fff", weight: 3, fillColor: "#087443", fillOpacity: 1 }}>
          <Tooltip>{locale === "bn" ? division.nameBn : division.nameEn}</Tooltip>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
