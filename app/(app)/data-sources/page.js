"use client";
import { Database } from "lucide-react";

import { PlaceholderScreen } from "@/components/ui/States.js";

export default function DataSourcesPage() {
  return (
    <PlaceholderScreen
      icon={Database}
      title="Data Sources & Transparency"
      message="Every dataset used by the platform: source, product, version, units, period, processing method and known limitations â€” with ingestion provenance."
      phaseTag="Phase 3+"
    />
  );
}
