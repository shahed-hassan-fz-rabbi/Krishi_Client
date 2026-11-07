"use client";
import { CalendarRange } from "lucide-react";

import { PlaceholderScreen } from "@/components/ui/States.js";

export default function CropCalendarPage() {
  return (
    <PlaceholderScreen
      icon={CalendarRange}
      title="Crop Calendar"
      message="Planned feature. Source-verified crop calendars and crop-specific timing guidance are not available yet."
      phaseTag="Phase 8"
    />
  );
}
