"use client";
import { Droplets } from "lucide-react";

import { PlaceholderScreen } from "@/components/ui/States.js";

export default function SoilMoisturePage() {
  return (
    <PlaceholderScreen
      icon={Droplets}
      title="Soil Moisture Intelligence"
      message="SMAP SPL3SMP_E surface soil moisture with quality flags — satellite estimates, clearly not field measurements."
      phaseTag="Phase 5"
    />
  );
}
