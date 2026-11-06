"use client";
import { CloudRain } from "lucide-react";

import { PlaceholderScreen } from "@/components/ui/States.js";

export default function RainfallPage() {
  return (
    <PlaceholderScreen
      icon={CloudRain}
      title="Rainfall Intelligence"
      message="Monthly and seasonal rainfall aggregations, dry spell detection and historical trends from NASA POWER (later: GPM IMERG)."
      phaseTag="Phase 3"
    />
  );
}
