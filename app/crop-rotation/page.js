"use client";
import { Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext.js";
import { AppShell } from "@/components/layout/AppShell.js";
import { useSearchParams } from "next/navigation";
import { PublicHeader, PublicFooter } from "@/components/layout/PublicChrome.js";
import { RotationPlanner } from "@/components/RotationPlanner.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { resolveRotationDistrict, resolveRotationPriority } from "@/lib/climatePlanning.js";

function PublicRotationForm() {
  const searchParams = useSearchParams();
  const { selectedDistrict } = useLocation();
  const district = resolveRotationDistrict(searchParams.get("district"), selectedDistrict);
  const priority = resolveRotationPriority(searchParams.get("priority"));
  return <RotationPlanner publicMode initialDistrict={district} initialPriority={priority} key={`${district}:${priority}`} />;
}

export default function CropRotationPage() {
  const { t } = useLang();
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-bg p-6 text-muted" role="status">{t("common.loading")}</div>;
  if (user) return <AppShell><Suspense fallback={<p role="status">{t("common.loading")}</p>}><PublicRotationForm /></Suspense></AppShell>;
  return <div className="flex min-h-screen flex-col bg-bg">
    <PublicHeader />
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <Suspense fallback={<p role="status">{t("common.loading")}</p>}><PublicRotationForm /></Suspense>
    </main>
    <PublicFooter />
  </div>;
}
