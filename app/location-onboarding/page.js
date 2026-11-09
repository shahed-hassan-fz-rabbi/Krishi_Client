"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Navigation, ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

import { BrandMark } from "@/components/layout/BrandMark.js";
import { Button } from "@/components/ui/Button.js";
import { Card, CardBody } from "@/components/ui/Card.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";

export default function LocationOnboardingPage() {
  const router = useRouter();
  const { t, locale } = useLang();
  const {
    selectedDistrict,
    setSelectedDistrict,
    districts,
    detectLocation,
    detectionStatus,
    detectionMessage,
  } = useLocation();

  const [chosenDistrict, setChosenDistrict] = useState(selectedDistrict || "chattogram");

  const handleUseMyLocation = async () => {
    const res = await detectLocation();
    if (res.success && res.district) {
      setChosenDistrict(res.district.code);
    }
  };

  const handleContinue = () => {
    if (!chosenDistrict) return;
    setSelectedDistrict(chosenDistrict);
    router.push("/dashboard");
  };

  const getDistrictName = (district) => {
    return locale === "bn" ? district.nameBn || district.nameEn : district.nameEn;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandMark />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:py-12">
        <div className="w-full max-w-2xl">
          <div className="mb-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-emerald transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 px-3 py-1 text-xs font-medium text-emerald mb-3">
              <MapPin className="h-3.5 w-3.5" />
              Location Setup
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-content sm:text-4xl">
              {t("location.title")}
            </h1>
            <p className="mt-3 text-base text-muted max-w-lg mx-auto">
              {t("location.subtitle")}
            </p>
          </div>

          <Card>
            <CardBody className="space-y-6">
              {/* Option 1: Use GPS */}
              <div className="rounded-xl border border-line bg-surface-2 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald/15 text-emerald">
                    <Navigation className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-content">
                      {t("location.useMyLocation")}
                    </h3>
                    <p className="text-xs text-muted mt-1 leading-relaxed">
                      {t("location.useMyLocationDesc")}
                    </p>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={handleUseMyLocation}
                      disabled={detectionStatus === "detecting"}
                    >
                      {detectionStatus === "detecting" ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {t("location.detecting")}
                        </>
                      ) : (
                        <>
                          <Navigation className="h-3.5 w-3.5" />
                          {t("location.detectLocation")}
                        </>
                      )}
                    </Button>

                    {detectionStatus === "success" && detectionMessage?.district && (
                      <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>
                          Closest supported district: <strong>{getDistrictName(detectionMessage.district)}</strong> (~{detectionMessage.distanceKm} km away)
                        </span>
                      </div>
                    )}

                    {detectionStatus === "error" && (
                      <div className="mt-3 flex items-start gap-2 text-xs text-danger">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{t(`location.${detectionMessage}`) || t("location.unknownError")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Option 2: Select manually */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-content">
                  {t("location.selectManually")}
                </h3>
                <p className="text-xs text-muted">
                  {t("location.selectManuallyDesc")}
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {districts.map((district) => {
                    const isSelected = chosenDistrict === district.code;
                    return (
                      <button
                        key={district.code}
                        type="button"
                        onClick={() => setChosenDistrict(district.code)}
                        className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                          isSelected
                            ? "border-emerald bg-emerald/5 shadow-sm"
                            : "border-line bg-surface hover:border-line-hover hover:bg-surface-2"
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            isSelected ? "bg-emerald text-white" : "bg-surface-2 text-muted"
                          }`}
                        >
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-content">
                            {getDistrictName(district)}
                          </p>
                          <p className="text-xs text-muted mt-0.5">
                            {district.latitude.toFixed(4)}°N, {district.longitude.toFixed(4)}°E
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3 pt-4 border-t border-line">
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  onClick={handleContinue}
                  disabled={!chosenDistrict}
                >
                  {t("location.continue")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>

                <div className="text-center">
                  <Link
                    href="/dashboard"
                    className="text-xs text-muted hover:text-content hover:underline"
                  >
                    {t("location.skipPre")} {t("location.skip")}
                  </Link>
                </div>
              </div>

              {/* Privacy note */}
              <div className="rounded-lg bg-surface-2 p-3 text-xs text-muted">
                <p className="leading-relaxed">{t("location.privacyNote")}</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  );
}
