"use client";
import { Leaf } from "lucide-react";

import { PlaceholderScreen } from "@/components/ui/States.js";

export default function VegetationPage() {
  return (
    <PlaceholderScreen
      icon={Leaf}
      title="Vegetation Intelligence"
      message="MODIS MOD13Q1 NDVI / EVI trends with quality masking — vegetation indices inform context, they are not yield or disease measurements."
      phaseTag="Phase 7"
    />
  );
}
