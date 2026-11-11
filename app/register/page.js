"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Navigation,
  RefreshCw,
  User,
  X,
} from "lucide-react";

import { BrandMark } from "@/components/layout/BrandMark.js";
import { Button } from "@/components/ui/Button.js";
import { AuthHeroPanel } from "@/components/auth/AuthHeroPanel.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { useAuth } from "@/contexts/AuthContext.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { fetchGoogleAuthStatus, getGoogleAuthEndpoint } from "@/services/api.js";
import { safeReturnTo, AUTH_RETURN_KEY } from "@/lib/access.js";

export default function RegisterPage() {
  const router = useRouter();
  const { t, locale } = useLang();
  const {
    selectedDistrict,
    districts,
    detectLocation,
    resetDetectionState,
    detectionStatus,
    detectionMessage,
  } = useLocation();

  const { register } = useAuth();

  // Multi-step registration state: Step 1 = Account, Step 2 = Location
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [chosenDistrict, setChosenDistrict] = useState(selectedDistrict || "chattogram");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleNotice, setGoogleNotice] = useState("");

  // Passive live status check on mount to ensure warning is suppressed when configured
  useEffect(() => {
    let active = true;
    fetchGoogleAuthStatus()
      .then((res) => {
        if (active && res?.success && res?.data?.configured) {
          setGoogleNotice("");
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Handle browser back button: return from Step 2 to Step 1 without losing entered state
  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state?.step === 1 && step === 2) {
        setStep(1);
        setError("");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [step]);

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setError("");
    setGoogleNotice("");

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError(t("auth.fillAllFields"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError(t("auth.invalidEmail"));
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

    // Push browser history state so browser Back returns to Step 1 cleanly
    if (typeof window !== "undefined") {
      window.history.pushState({ step: 2 }, "");
    }
    setStep(2);
  };

  const handleBackToStep1 = useCallback(() => {
    setError("");
    resetDetectionState();
    setStep(1);
  }, [resetDetectionState]);

  const handleGpsDetect = async () => {
    setError("");
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
        router.push(safeReturnTo(new URLSearchParams(window.location.search).get("redirect")));
      } else {
        setError(res.error || "Registration failed");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleClick = async () => {
    setError("");
    setGoogleNotice("");
    setIsGoogleLoading(true);

    try {
      const statusRes = await fetchGoogleAuthStatus();
      if (statusRes.success && statusRes.data?.configured) {
        try { sessionStorage.setItem(AUTH_RETURN_KEY, safeReturnTo(new URLSearchParams(window.location.search).get("redirect"))); } catch { /* Storage is optional. */ }
        window.location.href = getGoogleAuthEndpoint();
      } else {
        setIsGoogleLoading(false);
        setGoogleNotice(t("auth.googleNotConfigured"));
      }
    } catch {
      setIsGoogleLoading(false);
      setGoogleNotice(t("auth.googleNotConfigured"));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60">
      <header className="border-b border-line bg-surface/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandMark />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:py-12">
        <div className="w-full max-w-5xl">
          {/* Shared responsive grid: Equal visual height on desktop with items-stretch */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
            {/* Left Promotional Panel */}
            <div className="hidden lg:flex lg:flex-col h-full">
              <AuthHeroPanel mode="register" />
            </div>

            {/* Right Registration Panel */}
            <div className="flex flex-col h-full w-full max-w-md mx-auto lg:max-w-none">
              <div className="h-full w-full rounded-2xl border border-line bg-surface p-6 sm:p-8 lg:p-10 shadow-sm flex flex-col justify-between">
                {/* Top Section: Back Navigation & Integrated Step Progress Indicator */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    {step === 1 ? (
                      <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-emerald transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>{t("auth.backToHome")}</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={handleBackToStep1}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-emerald transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to Step 1</span>
                      </button>
                    )}

                    {/* Minimal, Integrated 2-Segment Progress Bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-muted">
                        {step === 1 ? "Step 1 of 2: Account" : "Step 2 of 2: Location"}
                      </span>
                      <div className="flex items-center gap-1.5" aria-hidden="true">
                        <div
                          className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                            step >= 1 ? "bg-emerald" : "bg-line"
                          }`}
                        />
                        <div
                          className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                            step >= 2 ? "bg-emerald" : "bg-line"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Header Title & Subtitle */}
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
                      {step === 1 ? t("auth.registerTitle") : t("location.title")}
                    </h1>
                    <p className="mt-1.5 text-sm text-muted">
                      {step === 1 ? t("auth.registerSubtitle") : t("location.subtitle")}
                    </p>
                  </div>

                  {/* Common Error Banner */}
                  {error && (
                    <div
                      className="mb-5 flex items-start gap-3 rounded-xl bg-danger/10 border border-danger/20 p-3.5 text-xs text-danger"
                      role="alert"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span className="flex-1 leading-relaxed">{error}</span>
                    </div>
                  )}

                  {/* Google Configuration Notice (Non-alarming informational helper) */}
                  {step === 1 && googleNotice && (
                    <div
                      className="mb-5 flex items-start gap-3 rounded-xl bg-surface-2 border border-line p-3.5 text-xs text-muted"
                      role="status"
                    >
                      <Info className="h-4 w-4 shrink-0 mt-0.5 text-emerald" />
                      <div className="flex-1 leading-relaxed">
                        <p className="font-semibold text-content text-xs mb-0.5">Google Sign-In Notice</p>
                        <p className="text-[11px]">{googleNotice}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGoogleNotice("")}
                        className="text-muted hover:text-content p-0.5 transition-colors"
                        aria-label="Dismiss notice"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* STEP 1: Account Information */}
                  {step === 1 ? (
                    <div>
                      {/* Google Sign-up Button */}
                      <button
                        type="button"
                        onClick={handleGoogleClick}
                        disabled={isGoogleLoading || isSubmitting}
                        className="w-full flex items-center justify-center gap-3 rounded-xl border border-line bg-surface hover:bg-surface-2 transition-colors px-4 py-2.5 text-sm font-medium text-content focus:outline-none focus:ring-2 focus:ring-emerald/40 disabled:opacity-60 disabled:cursor-not-allowed shadow-xs min-h-[44px]"
                      >
                        {isGoogleLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-emerald" />
                            <span>Connecting to Google...</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              />
                            </svg>
                            <span>{t("auth.continueWithGoogle")}</span>
                          </>
                        )}
                      </button>

                      {/* Divider */}
                      <div className="relative my-5">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-line" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-surface px-2.5 text-muted tracking-wider text-[11px]">
                            {t("auth.orContinueWith")}
                          </span>
                        </div>
                      </div>

                      {/* Step 1 Form */}
                      <form onSubmit={handleStep1Submit} className="space-y-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-content mb-1">
                            {t("auth.fullNameLabel")}
                          </label>
                          <div className="relative flex items-center">
                            <User className="absolute left-3.5 h-4 w-4 text-muted pointer-events-none" />
                            <input
                              type="text"
                              required
                              placeholder={t("auth.fullNamePlaceholder")}
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="w-full rounded-xl border border-line bg-surface pl-10 pr-3 py-2 text-sm text-content placeholder:text-muted/60 focus:border-emerald focus:outline-none focus:ring-1 focus:ring-emerald min-h-[42px]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-content mb-1">
                            {t("auth.emailLabel")}
                          </label>
                          <div className="relative flex items-center">
                            <Mail className="absolute left-3.5 h-4 w-4 text-muted pointer-events-none" />
                            <input
                              type="email"
                              required
                              placeholder={t("auth.emailPlaceholder")}
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full rounded-xl border border-line bg-surface pl-10 pr-3 py-2 text-sm text-content placeholder:text-muted/60 focus:border-emerald focus:outline-none focus:ring-1 focus:ring-emerald min-h-[42px]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-content mb-1">
                              {t("auth.passwordLabel")}
                            </label>
                            <div className="relative flex items-center">
                              <Lock className="absolute left-3.5 h-4 w-4 text-muted pointer-events-none" />
                              <input
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="8+ characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border border-line bg-surface pl-10 pr-9 py-2 text-sm text-content placeholder:text-muted/60 focus:border-emerald focus:outline-none focus:ring-1 focus:ring-emerald min-h-[42px]"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-2.5 text-muted hover:text-content p-1"
                                aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-content mb-1">
                              {t("auth.confirmPasswordLabel")}
                            </label>
                            <div className="relative flex items-center">
                              <Lock className="absolute left-3.5 h-4 w-4 text-muted pointer-events-none" />
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                placeholder="Repeat password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full rounded-xl border border-line bg-surface pl-10 pr-9 py-2 text-sm text-content placeholder:text-muted/60 focus:border-emerald focus:outline-none focus:ring-1 focus:ring-emerald min-h-[42px]"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                className="absolute right-2.5 text-muted hover:text-content p-1"
                                aria-label={showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          size="lg"
                          className="w-full mt-2 bg-emerald hover:bg-emerald-600 text-white font-medium shadow-xs min-h-[44px]"
                        >
                          <span>Continue to Location</span>
                          <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
                        </Button>
                      </form>
                    </div>
                  ) : (
                    /* STEP 2: Farm Location Onboarding */
                    <div className="space-y-4">
                      {/* GPS Detection Box */}
                      <div className="rounded-xl border border-line bg-surface-2 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald/15 text-emerald mt-0.5">
                            <Navigation className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-content">
                              {t("location.useMyLocation")}
                            </h3>
                            <p className="text-xs text-muted mt-0.5 leading-relaxed">
                              {t("location.useMyLocationDesc")}
                            </p>

                            <div className="mt-3 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleGpsDetect}
                                disabled={detectionStatus === "detecting"}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                              >
                                {detectionStatus === "detecting" ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>{t("location.detecting")}</span>
                                  </>
                                ) : (
                                  <>
                                    <Navigation className="h-3.5 w-3.5" />
                                    <span>{t("location.detectLocation")}</span>
                                  </>
                                )}
                              </button>

                              {detectionStatus === "error" && (
                                <button
                                  type="button"
                                  onClick={handleGpsDetect}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-muted hover:text-content transition-colors"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                  <span>{t("auth.locationRetry")}</span>
                                </button>
                              )}
                            </div>

                            {/* GPS Result Message */}
                            {detectionStatus === "success" && detectionMessage?.district && (
                              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald bg-emerald/10 border border-emerald/20 rounded-lg p-2.5">
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
                              <div className="mt-3 text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg p-2.5 space-y-1">
                                <p className="font-medium">
                                  {t(`location.${detectionMessage}`) || t("location.unknownError")}
                                </p>
                                <p className="text-muted text-[11px]">
                                  {t("location.selectManual")}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Manual District Selection Cards */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-content block">
                          {t("auth.selectDistrictPrompt")}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {districts.map((d) => {
                            const isSelected = chosenDistrict === d.code;
                            return (
                              <button
                                key={d.code}
                                type="button"
                                onClick={() => setChosenDistrict(d.code)}
                                className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                                  isSelected
                                    ? "border-emerald bg-emerald/5 ring-1 ring-emerald shadow-xs"
                                    : "border-line bg-surface hover:bg-surface-2"
                                }`}
                              >
                                <div className="flex items-center justify-between w-full mb-1">
                                  <span className="text-xs font-bold text-content">
                                    {locale === "bn" ? d.nameBn || d.nameEn : d.nameEn}
                                  </span>
                                  {isSelected ? (
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald text-white">
                                      <Check className="h-3 w-3" />
                                    </span>
                                  ) : (
                                    <span className="h-4 w-4 rounded-full border border-line" />
                                  )}
                                </div>
                                <span className="text-[11px] text-muted">
                                  {d.code === "chattogram" ? "Chittagong Region" : "Cumilla Region"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Complete Registration Button */}
                      <Button
                        type="button"
                        size="lg"
                        className="w-full bg-emerald hover:bg-emerald-600 text-white font-medium shadow-xs min-h-[44px]"
                        disabled={isSubmitting || !chosenDistrict}
                        onClick={handleCompleteRegistration}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                            <span>{t("auth.registering")}</span>
                          </>
                        ) : (
                          <>
                            <span>{t("auth.registerButton")}</span>
                            <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Bottom Footer Section */}
                <div className="pt-4 mt-6 border-t border-line/60">
                  {step === 1 ? (
                    <p className="text-center text-xs text-muted">
                      {t("auth.alreadyHaveAccount")}{" "}
                      <Link
                        href="/login"
                        onClick={(event) => { event.preventDefault(); router.push(`/login?redirect=${encodeURIComponent(safeReturnTo(new URLSearchParams(window.location.search).get("redirect")))}`); }}
                        className="font-semibold text-emerald hover:text-emerald-700 underline-offset-2 hover:underline"
                      >
                        {t("auth.login")}
                      </Link>
                    </p>
                  ) : (
                    <div className="rounded-lg bg-surface-2 p-2.5 text-[11px] text-muted flex items-start gap-2">
                      <Info className="h-3.5 w-3.5 text-emerald shrink-0 mt-0.5" />
                      <span>{t("location.privacyNote")}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
