"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { resolveRotationDistrict } from "@/lib/climatePlanning.js";
import { PrivateAccess } from "@/components/auth/PrivateAccess.js";
import { RotationPlanner } from "@/components/RotationPlanner.js";
import { useAuth } from "@/contexts/AuthContext.js";
import { useLocation } from "@/contexts/LocationContext.js";

function RotationPlannerPage() {
  const { user } = useAuth();
  const { selectedDistrict } = useLocation();
  const searchParams = useSearchParams();
  const district = resolveRotationDistrict(searchParams.get("district"), selectedDistrict);
  return user ? <RotationPlanner key={`${String(user._id || user.id)}:${selectedDistrict}:${district}`} initialDistrict={district} /> : null;
}

export default function ProtectedRotationPlannerPage() {
  return <PrivateAccess><Suspense fallback={null}><RotationPlannerPage /></Suspense></PrivateAccess>;
}
