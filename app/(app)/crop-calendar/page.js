"use client";
import { CalendarRange } from "lucide-react";

import { PlaceholderScreen } from "@/components/ui/States.js";

export default function CropCalendarPage() {
  return (
    <PlaceholderScreen
      icon={CalendarRange}
      title="Crop Calendar"
      message="Configurable, source-verified crop calendars for transitions such as Aman rice to mustard, with citations and applicability notes."
      phaseTag="Phase 8"
    />
  );
}
