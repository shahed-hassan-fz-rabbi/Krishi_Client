"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  CloudRain,
  Compass,
  Info,
  Loader2,
  MapPin,
  Navigation,
  ShieldCheck,
} from "lucide-react";

import { BrandMark } from "@/components/layout/BrandMark.js";
import { Input } from "@/components/forms/Input.js";
import { Button } from "@/components/ui/Button.js";
import { Card, CardBody } from "@/components/ui/Card.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { useAuth } from "@/contexts/AuthContext.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";

const HERO_SRC = "/images/hero.jpeg";

export default function RegisterPage() {
  const router = useRouter();
  const { t, locale } = useLang();
  const {
    selectedDistrict,
    districts,
    detectLocation,
    detectionStatus,
    detectionMessage,
  } = useLocation();

  const { register } = useAuth();

  // Step 1: Account Information, Step 2: Farm Location Onboarding
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [chosenDistrict, setChosenDistrict] = useState(selectedDistrict || "chattogram");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError(t("auth.fillAllFields"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    if (password.length < 8) {
      setError(t("auth.passwordTooShort"));
      return;
    }

    // Proceed to Step 2: Location Onboarding
    setStep(2);
  };

  const handleGpsDetect = async () => {
    const res = await detectLocation();
    if (res.success && res.district) {
      setChosenDistrict(res.district.code);
    }
  };

  const handleCompleteRegistration = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      const res = await register({
        name: fullName.trim(),
        email: email.trim(),
        password,
        preferredDistrict: chosenDistrict,
      });

      if (res.success) {
        router.push("/dashboard");
      } else {
        setError(res.error || "Registration failed");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandMark />
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">
              {step === 1 ? "Step 1 of 2: Account" : "Step 2 of 2: Farm Location"}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:py-12">
        <div className="w-full max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left side - Brand intro */}
            <div className="hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-forest/90 via-forest/75 to-emerald/85" />
                <img
                  src={HERO_SRC}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <div className="relative p-8 lg:p-12">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    {t("auth.registerBrandTitle")}
                  </h2>
                  <p className="text-white/90 text-lg leading-relaxed mb-8">
                    {t("auth.registerBrandDesc")}
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                        <CloudRain className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{t("auth.registerFeature1")}</p>
                        <p className="text-sm text-white/80">{t("auth.registerFeature1Desc")}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{t("auth.registerFeature2")}</p>
                        <p className="text-sm text-white/80">{t("auth.registerFeature2Desc")}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                        <ShieldCheck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{t("auth.registerFeature3")}</p>
                        <p className="text-sm text-white/80">{t("auth.registerFeature3Desc")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Forms */}
            <div className="w-full max-w-md mx-auto">
              {step === 1 ? (
                /* Step 1: Account details */
                <div>
                  <div className="mb-8 text-center lg:text-left">
                    <h1 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
                      {t("auth.registerTitle")}
                    </h1>
                    <p className="mt-2 text-sm text-muted">{t("auth.registerSubtitle")}</p>
                  </div>

                  <Card>
                    <CardBody>
                      {error && (
                        <div className="mb-4 rounded-lg bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger">
                          {error}
                        </div>
                      )}
                      <form onSubmit={handleStep1Submit} className="space-y-4">
                        <Input
                          label={t("auth.fullNameLabel")}
                          type="text"
                          placeholder={t("auth.fullNamePlaceholder")}
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />

                        <Input
                          label={t("auth.emailLabel")}
                          type="email"
                          placeholder={t("auth.emailPlaceholder")}
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />

                        <Input
                          label={t("auth.passwordLabel")}
                          type="password"
                          placeholder={t("auth.passwordPlaceholder")}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />

                        <Input
                          label={t("auth.confirmPasswordLabel")}
                          type="password"
                          placeholder={t("auth.confirmPasswordPlaceholder")}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />

                        <Button type="submit" size="lg" className="w-full">
                          Continue to Location
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </form>

                      <p className="mt-6 text-center text-sm text-muted">
                        {t("auth.alreadyHaveAccount")}{" "}
                        <Link href="/login" className="font-medium text-climate hover:text-climate-strong">
                          {t("auth.login")}
                        </Link>
                      </p>
                    </CardBody>
                  </Card>

                  <p className="mt-6 text-center text-xs text-muted">
                    {t("auth.backendNote")}
                  </p>
                </div>
              ) : (
                /* Step 2: Farm Location Onboarding */
                <div>
                  <div className="mb-8 text-center lg:text-left">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 px-3 py-1 text-xs font-medium text-emerald mb-3">
                      <Compass className="h-3.5 w-3.5" />
                      Step 2: Farm Location
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
                      {t("location.title")}
                    </h1>
                    <p className="mt-2 text-sm text-muted">{t("location.subtitle")}</p>
                  </div>

                  <Card>
                    <CardBody className="space-y-6">
                      {error && (
                        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="status">
                          {error}
                        </div>
                      )}
                      {/* GPS Detection Option */}
                      <div className="rounded-xl border border-line bg-surface-2 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald/15 text-emerald">
                            <Navigation className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-content">
                              {t("location.useMyLocation")}
                            </h3>
                            <p className="text-xs text-muted mt-1 leading-relaxed">
                              {t("location.useMyLocationDesc")}
                            </p>

                            <button
                              type="button"
                              onClick={handleGpsDetect}
                              disabled={detectionStatus === "detecting"}
                              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald/90 transition-colors disabled:opacity-50"
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
                            </button>

                            {/* Detection status message */}
                            {detectionStatus === "success" && detectionMessage?.district && (
                              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                <span>
                                  Closest district:{" "}
                                  <strong>
                                    {locale === "bn"
                                      ? detectionMessage.district.nameBn || detectionMessage.district.nameEn
                                      : detectionMessage.district.nameEn}
                                  </strong>{" "}
                                  (~{detectionMessage.distanceKm} km away)
                                </span>
                              </div>
                            )}

                            {detectionStatus === "error" && (
                              <p className="mt-3 text-xs text-danger">
                                {t(`location.${detectionMessage}`) || t("location.unknownError")}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Manual District Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-content block">
                          {t("location.selectManually")}
                        </label>
                        <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2.5">
                          <MapPin className="h-4 w-4 text-emerald shrink-0" aria-hidden="true" />
                          <select
                            value={chosenDistrict}
                            onChange={(e) => setChosenDistrict(e.target.value)}
                            className="w-full bg-transparent text-sm font-medium text-content focus:outline-none cursor-pointer"
                          >
                            {districts.map((d) => (
                              <option key={d.code} value={d.code} className="bg-surface text-content">
                                {locale === "bn" ? d.nameBn || d.nameEn : d.nameEn} (Lat {d.latitude.toFixed(2)}, Lon {d.longitude.toFixed(2)})
                              </option>
                            ))}
                          </select>
                        </div>
                        <p className="text-xs text-muted">{t("location.selectManuallyDesc")}</p>
                      </div>

                      {/* Save and Continue Button */}
                      <div className="pt-2">
                        <Button
                          type="button"
                          size="lg"
                          className="w-full"
                          disabled={isSubmitting}
                          onClick={handleCompleteRegistration}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                              {t("auth.registering")}
                            </>
                          ) : (
                            <>
                              {t("auth.registerButton")}
                              <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Skip option */}
                      <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-line">
                        <span>{t("location.skipPre")}</span>
                        <button
                          type="button"
                          onClick={() => router.push("/dashboard")}
                          className="font-medium text-emerald hover:underline"
                        >
                          {t("location.skip")}
                        </button>
                      </div>

                      {/* Privacy notice */}
                      <div className="rounded-lg bg-surface-2 p-3 text-xs text-muted space-y-1">
                        <p className="flex items-center gap-1.5 font-medium text-content">
                          <Info className="h-3.5 w-3.5 text-emerald" />
                          Privacy & Storage Notice
                        </p>
                        <p>{t("location.privacyNote")}</p>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
