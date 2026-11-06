"use client";
import { Wheat } from "lucide-react";

import { PlaceholderScreen } from "@/components/ui/States.js";

export default function HandoffPage() {
  return (
    <PlaceholderScreen
      icon={Wheat}
      title="Handoff Window Intelligence"
      message="Deterministic scenario comparison (0 / 7 / 14-day sowing delays) powered by stored NASA POWER history, verified crop calendars and documented thresholds."
      phaseTag="Phase 4"
    />
  );
}
