"use client";
import { Map as MapIcon } from "lucide-react";

import { PlaceholderScreen } from "@/components/ui/States.js";

export default function MapPage() {
  return (
    <PlaceholderScreen
      icon={MapIcon}
      title="Interactive Map"
      message="Leaflet map with district boundaries and selectable environmental layers, using verified administrative geometry."
      phaseTag="Phase 8"
    />
  );
}
