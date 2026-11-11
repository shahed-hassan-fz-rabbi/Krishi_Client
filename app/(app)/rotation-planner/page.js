"use client";
import { PrivateAccess } from "@/components/auth/PrivateAccess.js";
import { RotationPlanner } from "@/components/RotationPlanner.js";
import { useAuth } from "@/contexts/AuthContext.js";

function RotationPlannerPage() {
  const { user } = useAuth();
  return user ? <RotationPlanner key={String(user._id || user.id)} /> : null;
}

export default function ProtectedRotationPlannerPage() {
  return <PrivateAccess><RotationPlannerPage /></PrivateAccess>;
}
