"use client";
import { PrivateAccess } from "@/components/auth/PrivateAccess.js";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Check,
  AlertCircle,
  Tractor,
  Layers,
  Droplets,
  Sprout,
  ShieldAlert,
  MapPin,
  Calendar,
} from "lucide-react";

import { useLang } from "@/lib/i18n/LanguageContext.js";
import { useAuth } from "@/contexts/AuthContext.js";
import { createFarm } from "@/services/api.js";
import { getBangladeshDateKey } from "@/lib/bangladeshDate.js";
import { dispatchFarmNotificationUpdate } from "@/lib/farmNotificationEvents.js";
import {
  DISTRICT_UPAZILAS,
  SUPPORTED_CROPS,
  LAND_UNITS,
  getUpazilasForDistrict,
} from "@/lib/upazilas.js";

const DISTRICTS = [
  { code: "cumilla", nameEn: "Cumilla", nameBn: "কুমিল্লা" },
  { code: "chattogram", nameEn: "Chattogram", nameBn: "চট্টগ্রাম" },
];

function NewFarmWizardPage() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { user, isLoading: authLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [customVariety, setCustomVariety] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Farm Info
    farmName: "",
    districtCode: "cumilla",
    upazila: "Burichang",
    village: "",
    area: "",
    unit: "decimal",
    landType: "medium_high",

    // Step 2: Soil & Water
    soilType: "loam",
    drainage: "good",
    irrigationAvailability: "available",
    waterSource: "",

    // Step 3: Crop Info
    cropCode: "monsoon_aman",
    variety: "",
    cultivationMethod: "Transplanting",
    plantingDate: getBangladeshDateKey(),
    notes: "",
  });

  // Dynamic Upazilas based on chosen district
  const availableUpazilas = useMemo(() => {
    return getUpazilasForDistrict(formData.districtCode);
  }, [formData.districtCode]);

  const updateField = (field, value) => {
    if (field === "cropCode") setCustomVariety(false);
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "cropCode") next.variety = "";
      // If district changed, auto-select first available upazila
      if (field === "districtCode") {
        const upz = getUpazilasForDistrict(value);
        if (upz.length > 0) {
          next.upazila = upz[0].nameEn;
        }
      }
      return next;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Step Validation
  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!formData.farmName.trim()) {
        errs.farmName = lang === "bn" ? "খামারের নাম আবশ্যক" : "Farm name is required";
      } else if (formData.farmName.trim().length < 2) {
        errs.farmName = lang === "bn" ? "কমপক্ষে ২ অক্ষর হতে হবে" : "Must be at least 2 characters";
      }
      if (!formData.districtCode) {
        errs.districtCode = lang === "bn" ? "জেলা নির্বাচন করুন" : "District is required";
      }
      if (!formData.upazila) {
        errs.upazila = lang === "bn" ? "উপজেলা নির্বাচন করুন" : "Upazila is required";
      }
      const areaNum = parseFloat(formData.area);
      if (!formData.area || isNaN(areaNum) || areaNum <= 0) {
        errs.area = lang === "bn" ? "সঠিক জমির পরিমাণ লিখুন" : "Valid positive area is required";
      }
    } else if (step === 2) {
      if (!formData.irrigationAvailability) {
        errs.irrigationAvailability = lang === "bn" ? "সেচ সুবিধা নির্বাচন করুন" : "Irrigation info required";
      }
    } else if (step === 3) {
      if (!formData.cropCode) {
        errs.cropCode = lang === "bn" ? "ফসল নির্বাচন করুন" : "Crop selection is required";
      }
      if (!formData.plantingDate) {
        errs.plantingDate = lang === "bn" ? "তারিখ আবশ্যক" : "Date is required";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (authLoading) return;
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      setCurrentStep(1);
      return;
    }

    if (!user) {
      setSubmitError(
        lang === "bn"
          ? "খামার স্থায়ীভাবে সংরক্ষণ করতে দয়া করে লগইন করুন।"
          : "Please log in to save your farm plot permanently."
      );
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    const payload = {
      farmName: formData.farmName.trim(),
      location: {
        districtCode: formData.districtCode,
        upazila: formData.upazila,
        village: formData.village.trim(),
      },
      land: {
        area: parseFloat(formData.area),
        unit: formData.unit,
        landType: formData.landType,
      },
      soil: {
        type: formData.soilType,
        drainage: formData.drainage,
      },
      water: {
        irrigationAvailability: formData.irrigationAvailability,
        waterSource: formData.waterSource.trim(),
      },
      crop: {
        cropCode: formData.cropCode,
        variety: formData.variety.trim(),
        cultivationMethod: formData.cultivationMethod.trim(),
        plantingDate: formData.plantingDate,
      },
      notes: formData.notes.trim(),
    };

    try {
      const res = await createFarm(payload);
      if (res.success && res.data) {
        dispatchFarmNotificationUpdate();
        router.push(`/my-farm/${res.data._id}`);
      } else {
        setSubmitError(res.error?.message || "Failed to create farm.");
      }
    } catch {
      setSubmitError("A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCrop = SUPPORTED_CROPS.find((c) => c.code === formData.cropCode);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-2 sm:space-y-7">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/my-farm"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 transition hover:text-stone-900 dark:text-muted dark:hover:text-stone-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("myFarm.backToList")}
        </Link>
        <span className="text-xs font-semibold uppercase tracking-wider text-forest-700 dark:text-forest-400">
          {lang === "bn" ? `ধাপ ${currentStep} / ৪` : `Step ${currentStep} of 4`}
        </span>
      </div>

      <div className="rounded-[24px] border border-line bg-surface p-5 shadow-km-sm sm:p-7">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-forest/5 px-3 py-1 text-xs font-semibold text-forest dark:bg-forest/20 dark:text-emerald-300">
          <Tractor className="h-3.5 w-3.5" />
          {lang === "bn" ? "নতুন প্লট নিবন্ধন" : "NEW PLOT REGISTRATION"}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
          {t("myFarm.addNewFarm")}
        </h1>
        <p className="mt-1 text-sm leading-6 text-muted">
          {t("myFarm.subtitle")}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="grid grid-cols-4 gap-2 rounded-2xl border border-line bg-surface p-4 shadow-km-sm sm:gap-4 sm:p-5">
        {[1, 2, 3, 4].map((step) => {
          const isDone = currentStep > step;
          const isCurrent = currentStep === step;
          return (
            <div key={step} className="flex flex-col gap-1.5">
              <div
                className={`h-2 rounded-full transition-all ${
                  isDone
                    ? "bg-forest-600"
                    : isCurrent
                    ? "bg-forest-500"
                    : "bg-stone-200 dark:bg-surface-2"
                }`}
              />
              <span className="truncate text-xs font-medium text-stone-500 dark:text-muted">
                {step === 1 && (lang === "bn" ? "১. তথ্য" : "1. Info")}
                {step === 2 && (lang === "bn" ? "২. মাটি/পানি" : "2. Soil/Water")}
                {step === 3 && (lang === "bn" ? "৩. ফসল" : "3. Crop")}
                {step === 4 && (lang === "bn" ? "৪. পর্যালোচনা" : "4. Review")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Unauthenticated Notice */}
      {!user && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="font-medium">{t("myFarm.guestNotice")}</p>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
              {lang === "bn"
                ? "আপনি ফর্মটি পূরণ করতে পারেন, তবে চূড়ান্ত সংরক্ষণের জন্য অ্যাকাউন্ট লগইন প্রয়োজন হবে।"
                : "You can preview the wizard, but an account is required to persist farm records."}
            </p>
          </div>
          <Link
            href="/login?redirect=/my-farm/new"
            className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          >
            {t("myFarm.loginCta")}
          </Link>
        </div>
      )}

      {/* Step Content Card */}
      <div className="rounded-[24px] border border-line bg-surface p-4 shadow-km-sm sm:p-6">
        {/* STEP 1: Farm Information */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="border-b border-stone-100 pb-3 dark:border-line">
              <h2 className="text-lg font-bold text-stone-900 dark:text-content">
                {t("myFarm.wizard.step1Title")}
              </h2>
              <p className="text-xs text-stone-500 dark:text-muted">
                {t("myFarm.wizard.step1Desc")}
              </p>
            </div>

            {/* Farm Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-muted">
                {t("myFarm.fields.farmName")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.farmName}
                onChange={(e) => updateField("farmName", e.target.value)}
                placeholder={t("myFarm.fields.farmNamePlaceholder")}
                className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
              />
              {errors.farmName && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.farmName}</p>
              )}
            </div>

            {/* District & Upazila */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-muted">
                  {t("myFarm.fields.district")} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.districtCode}
                  onChange={(e) => updateField("districtCode", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
                >
                  {DISTRICTS.map((d) => (
                    <option key={d.code} value={d.code}>
                      {lang === "bn" ? d.nameBn : d.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-muted">
                  {t("myFarm.fields.upazila")} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.upazila}
                  onChange={(e) => updateField("upazila", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
                >
                  {availableUpazilas.map((u) => (
                    <option key={u.code} value={u.nameEn}>
                      {lang === "bn" ? u.nameBn : u.nameEn}
                    </option>
                  ))}
                </select>
                {errors.upazila && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.upazila}</p>
                )}
              </div>
            </div>

            {/* Village / Union */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-muted">
                {t("myFarm.fields.village")}
              </label>
              <input
                type="text"
                value={formData.village}
                onChange={(e) => updateField("village", e.target.value)}
                placeholder={t("myFarm.fields.villagePlaceholder")}
                className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
              />
            </div>

            {/* Land Area and Unit */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-muted">
                  {t("myFarm.fields.landArea")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.area}
                  onChange={(e) => updateField("area", e.target.value)}
                  placeholder="e.g., 45"
                  className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
                />
                {errors.area && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.area}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-muted">
                  {t("myFarm.fields.landUnit")} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => updateField("unit", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
                >
                  {LAND_UNITS.map((u) => (
                    <option key={u.code} value={u.code}>
                      {u.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Land Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-muted">
                {t("myFarm.fields.landType")}
              </label>
              <select
                value={formData.landType}
                onChange={(e) => updateField("landType", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
              >
                <option value="high">{t("myFarm.landTypes.high")}</option>
                <option value="medium_high">{t("myFarm.landTypes.medium_high")}</option>
                <option value="medium_low">{t("myFarm.landTypes.medium_low")}</option>
                <option value="low">{t("myFarm.landTypes.low")}</option>
                <option value="unspecified">{t("myFarm.landTypes.unspecified")}</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 2: Soil & Water Information */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="border-b border-stone-100 pb-3 dark:border-line">
              <h2 className="text-lg font-bold text-stone-900 dark:text-content">
                {t("myFarm.wizard.step2Title")}
              </h2>
              <p className="text-xs text-stone-500 dark:text-muted">
                {t("myFarm.wizard.step2Desc")}
              </p>
            </div>

            {/* Soil Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-muted">
                {t("myFarm.fields.soilType")}
              </label>
              <select
                value={formData.soilType}
                onChange={(e) => updateField("soilType", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
              >
                <option value="loam">{t("myFarm.soilTypes.loam")}</option>
                <option value="clay">{t("myFarm.soilTypes.clay")}</option>
                <option value="sandy">{t("myFarm.soilTypes.sandy")}</option>
                <option value="silt">{t("myFarm.soilTypes.silt")}</option>
                <option value="other">{t("myFarm.soilTypes.other")}</option>
                <option value="unknown">{t("myFarm.soilTypes.unknown")}</option>
              </select>
            </div>

            {/* Drainage Condition */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-muted">
                {t("myFarm.fields.drainage")}
              </label>
              <select
                value={formData.drainage}
                onChange={(e) => updateField("drainage", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
              >
                <option value="good">{t("myFarm.drainageTypes.good")}</option>
                <option value="moderate">{t("myFarm.drainageTypes.moderate")}</option>
                <option value="poor">{t("myFarm.drainageTypes.poor")}</option>
                <option value="waterlogged">{t("myFarm.drainageTypes.waterlogged")}</option>
                <option value="unknown">{t("myFarm.drainageTypes.unknown")}</option>
              </select>
            </div>

            {/* Irrigation Availability */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-muted">
                {t("myFarm.fields.irrigationAvailability")} <span className="text-red-500">*</span>
              </label>
              <div className="mt-2 space-y-2">
                {[
                  { value: "available", label: t("myFarm.irrigationOptions.available") },
                  { value: "limited", label: t("myFarm.irrigationOptions.limited") },
                  { value: "unavailable", label: t("myFarm.irrigationOptions.unavailable") },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${
                      formData.irrigationAvailability === opt.value
                        ? "border-forest-600 bg-forest-50/50 dark:border-forest-500 dark:bg-forest-950/30"
                        : "border-stone-200 hover:bg-stone-50 dark:border-line dark:hover:bg-surface-2"
                    }`}
                  >
                    <input
                      type="radio"
                      name="irrigationAvailability"
                      value={opt.value}
                      checked={formData.irrigationAvailability === opt.value}
                      onChange={(e) => updateField("irrigationAvailability", e.target.value)}
                      className="h-4 w-4 text-forest-600 focus:ring-forest-500"
                    />
                    <span className="font-medium text-stone-900 dark:text-content">
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Water Source */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-muted">
                {t("myFarm.fields.waterSource")}
              </label>
              <input
                type="text"
                value={formData.waterSource}
                onChange={(e) => updateField("waterSource", e.target.value)}
                placeholder={t("myFarm.fields.waterSourcePlaceholder")}
                className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Crop Setup */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="border-b border-stone-100 pb-3 dark:border-line">
              <h2 className="text-lg font-bold text-stone-900 dark:text-content">
                {t("myFarm.wizard.step3Title")}
              </h2>
              <p className="text-xs text-stone-500 dark:text-muted">
                {t("myFarm.wizard.step3Desc")}
              </p>
            </div>

            {/* Verified Crop Selector Cards */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-muted">
                {t("myFarm.fields.cropCode")} <span className="text-red-500">*</span>
              </label>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SUPPORTED_CROPS.map((crop) => {
                  const isSelected = formData.cropCode === crop.code;
                  return (
                    <button
                      key={crop.code}
                      type="button"
                      onClick={() => updateField("cropCode", crop.code)}
                      className={`flex flex-col items-start rounded-xl border p-4 text-left transition ${
                        isSelected
                          ? "border-forest-600 bg-forest-50/60 ring-2 ring-forest-500/20 dark:border-forest-500 dark:bg-forest-950/40"
                          : "border-stone-200 hover:bg-stone-50 dark:border-line dark:hover:bg-surface-2"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-bold text-stone-900 dark:text-content">
                          {lang === "bn" ? crop.nameBn : crop.nameEn}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-forest-700 dark:text-forest-400" />
                        )}
                      </div>
                      <span className="mt-1 text-xs text-stone-500 dark:text-muted">
                        {lang === "bn" ? crop.seasonBn : crop.seasonEn} • ~{crop.durationDays} days
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Variety: existing crop catalog options, or a farmer-entered name. */}
            <div>
              <label htmlFor="farm-crop-variety" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-muted">{t("myFarm.fields.variety")}</label>
              <select id="farm-crop-variety" value={customVariety ? "__other__" : formData.variety} onChange={(event) => {
                const other = event.target.value === "__other__";
                setCustomVariety(other);
                updateField("variety", other ? "" : event.target.value);
              }} className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content">
                <option value="">{t("myFarm.fields.varietyChoose")}</option>
                {(selectedCrop?.typicalVarieties || []).map((variety) => <option key={variety} value={variety}>{variety}</option>)}
                <option value="__other__">{t("myFarm.fields.varietyOther")}</option>
              </select>
              {customVariety && <div className="mt-3"><label htmlFor="farm-custom-variety" className="block text-xs font-medium text-content">{t("myFarm.fields.varietyCustom")}</label><input id="farm-custom-variety" type="text" value={formData.variety} onChange={(event) => updateField("variety", event.target.value)} placeholder={t("myFarm.fields.varietyCustom")} className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content" /></div>}
            </div>

            {/* Planting Date & Cultivation Method */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-muted">
                  {t("myFarm.fields.plantingDate")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.plantingDate}
                  onChange={(e) => updateField("plantingDate", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
                />
                {errors.plantingDate && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.plantingDate}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-muted">
                  {t("myFarm.fields.cultivationMethod")}
                </label>
                <input
                  type="text"
                  value={formData.cultivationMethod}
                  onChange={(e) => updateField("cultivationMethod", e.target.value)}
                  placeholder={t("myFarm.fields.cultivationMethodPlaceholder")}
                  className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-muted">
                {t("myFarm.fields.notes")}
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder={t("myFarm.fields.notesPlaceholder")}
                className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Review & Confirm */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 pb-3 dark:border-line">
              <h2 className="text-lg font-bold text-stone-900 dark:text-content">
                {t("myFarm.wizard.step4Title")}
              </h2>
              <p className="text-xs text-stone-500 dark:text-muted">
                {t("myFarm.wizard.step4Desc")}
              </p>
            </div>

            {submitError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Summary Review Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Card 1: Farm & Location */}
              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 dark:border-line dark:bg-bg">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-muted">
                  {t("myFarm.details.locationLand")}
                </span>
                <div className="mt-2 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">{t("myFarm.fields.farmName")}:</span>
                    <span className="font-bold text-stone-900 dark:text-content">
                      {formData.farmName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">{t("myFarm.fields.district")}:</span>
                    <span className="font-medium text-stone-900 dark:text-content">
                      {formData.districtCode === "cumilla" ? "Cumilla" : "Chattogram"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">{t("myFarm.fields.upazila")}:</span>
                    <span className="font-medium text-stone-900 dark:text-content">
                      {formData.upazila}
                    </span>
                  </div>
                  {formData.village && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">{t("myFarm.fields.village")}:</span>
                      <span className="text-stone-700 dark:text-muted">{formData.village}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-stone-500">{t("myFarm.fields.landArea")}:</span>
                    <span className="font-bold text-forest-700 dark:text-forest-400">
                      {formData.area} {formData.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Soil & Water */}
              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 dark:border-line dark:bg-bg">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-muted">
                  {t("myFarm.details.soilWater")}
                </span>
                <div className="mt-2 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">{t("myFarm.fields.soilType")}:</span>
                    <span className="capitalize font-medium text-stone-900 dark:text-content">
                      {formData.soilType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">{t("myFarm.fields.drainage")}:</span>
                    <span className="capitalize font-medium text-stone-900 dark:text-content">
                      {formData.drainage}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">{t("myFarm.fields.irrigationAvailability")}:</span>
                    <span className="capitalize font-bold text-emerald-700 dark:text-emerald-400">
                      {formData.irrigationAvailability}
                    </span>
                  </div>
                  {formData.waterSource && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">{t("myFarm.fields.waterSource")}:</span>
                      <span className="text-stone-700 dark:text-muted">{formData.waterSource}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card 3: Crop Details */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 dark:border-line dark:bg-bg">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-muted">
                {t("myFarm.details.cropProfile")}
              </span>
              <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                <div className="flex justify-between">
                  <span className="text-stone-500">{t("myFarm.fields.cropCode")}:</span>
                  <span className="font-bold text-stone-900 dark:text-content">
                    {lang === "bn" ? selectedCrop?.nameBn : selectedCrop?.nameEn}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{t("myFarm.fields.variety")}:</span>
                  <span className="font-medium text-stone-900 dark:text-content">
                    {formData.variety || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{t("myFarm.fields.plantingDate")}:</span>
                  <span className="font-medium text-stone-900 dark:text-content">
                    {formData.plantingDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{t("myFarm.fields.cultivationMethod")}:</span>
                  <span className="text-stone-700 dark:text-muted">
                    {formData.cultivationMethod || "Standard"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="mt-8 flex items-center justify-between border-t border-stone-100 pt-5 dark:border-line">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting || authLoading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50 dark:border-line dark:bg-surface-2 dark:text-muted dark:hover:bg-surface-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("myFarm.wizard.back")}
              </button>
            )}
          </div>

          <div>
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-xl bg-forest-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-forest-800 dark:bg-forest-600 dark:hover:bg-forest-500"
              >
                {t("myFarm.wizard.next")}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || authLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-forest-700 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-forest-800 disabled:opacity-50 dark:bg-forest-600 dark:hover:bg-forest-500"
              >
                {submitting ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t("myFarm.wizard.saving")}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {t("myFarm.wizard.save")}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedNewFarmWizardPage() {
  return <PrivateAccess><NewFarmWizardPage /></PrivateAccess>;
}
