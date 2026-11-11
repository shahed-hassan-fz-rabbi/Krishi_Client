"use client";
import { PrivateAccess } from "@/components/auth/PrivateAccess.js";
import { Settings } from "lucide-react";

import { PlaceholderScreen } from "@/components/ui/States.js";

function SettingsPage() {
  return (
    <PlaceholderScreen
      icon={Settings}
      title="Settings"
      message="Language, theme and default district preferences. Functional converters arrive with the data phases; the switchers already work in the sidebar."
      phaseTag="Phase 3"
    />
  );
}

export default function ProtectedSettingsPage() {
  return <PrivateAccess><SettingsPage /></PrivateAccess>;
}
