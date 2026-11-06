"use client";
import { BarChart3 } from "lucide-react";

import { PlaceholderScreen } from "@/components/ui/States.js";

export default function ClimatePage() {
  return (
    <PlaceholderScreen
      icon={BarChart3}
      title="Climate Intelligence"
      message="Long-term daily temperature and humidity statistics from NASA POWER, with trend analysis and documented evidence coverage."
      phaseTag="Phase 3"
    />
  );
}
