"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PublicHeader, PublicFooter } from "@/components/layout/PublicChrome.js";
import { RotationPlanner } from "@/components/RotationPlanner.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { resolveRotationDistrict } from "@/lib/climatePlanning.js";

function PublicRotationForm() {
  const searchParams = useSearchParams();
  const { selectedDistrict } = useLocation();
  const district = resolveRotationDistrict(searchParams.get("district"), selectedDistrict);
  return <RotationPlanner publicMode initialDistrict={district} key={district} />;
}

export default function CropRotationPage() {
  const { t } = useLang();
  return <div className="flex min-h-screen flex-col bg-bg">
    <PublicHeader />
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <Suspense fallback={<p role="status">{t("common.loading")}</p>}><PublicRotationForm /></Suspense>
    </main>
    <PublicFooter />
  </div>;
}
