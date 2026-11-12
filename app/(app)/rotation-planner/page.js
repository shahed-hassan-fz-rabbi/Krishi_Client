"use client";
import { PrivateAccess } from "@/components/auth/PrivateAccess.js";
import { RotationPlanner } from "@/components/RotationPlanner.js";
import { useAuth } from "@/contexts/AuthContext.js";
import { useLocation } from "@/contexts/LocationContext.js";

function RotationPlannerPage() {
  const { user } = useAuth();
  const { selectedDistrict } = useLocation();
  return user ? <RotationPlanner key={`${String(user._id || user.id)}:${selectedDistrict}`} /> : null;
}

export default function ProtectedRotationPlannerPage() {
  return <PrivateAccess><RotationPlannerPage /></PrivateAccess>;
}
