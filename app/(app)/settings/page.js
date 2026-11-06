"use client";
import { Settings } from "lucide-react";

import { PlaceholderScreen } from "@/components/ui/States.js";

export default function SettingsPage() {
  return (
    <PlaceholderScreen
      icon={Settings}
      title="Settings"
      message="Language, theme and default district preferences. Functional converters arrive with the data phases; the switchers already work in the sidebar."
      phaseTag="Phase 3"
    />
  );
}
