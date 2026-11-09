"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Tractor,
  Layers,
  Droplets,
  Calendar,
  Clock,
  ShieldCheck,
  Info,
  MapPin,
  ExternalLink,
  ChevronRight,
  Check,
  X,
  LoaderCircle,
} from "lucide-react";

import { useLang } from "@/lib/i18n/LanguageContext.js";
import { useAuth } from "@/contexts/AuthContext.js";
import { fetchCropPlanningRecommendations, createFarm } from "@/services/api.js";
import {
  buildCropPlanningPayload,
  getCropPlanningErrorMessage,
  validateCropPlanningForm,
} from "@/lib/cropPlanningForm.js";
import {
  DISTRICT_UPAZILAS,
  LAND_UNITS,
  getUpazilasForDistrict,
} from "@/lib/upazilas.js";

const DISTRICTS = [
  { code: "cumilla", nameEn: "Cumilla", nameBn: "কুমিল্লা" },
  { code: "chattogram", nameEn: "Chattogram", nameBn: "চট্টগ্রাম" },
];

const LAND_TYPES = [
  { code: "high", nameEn: "High Land (Flood-free)", nameBn: "উঁচু জমি (বন্যা মুক্ত)" },
  { code: "medium_high", nameEn: "Medium High Land (Occasional shallow flood)", nameBn: "মাঝারি উঁচু জমি (সাময়িক অগভীর প্লাবন)" },
  { code: "medium_low", nameEn: "Medium Low Land (Regular seasonal flood)", nameBn: "মাঝারি নিচু জমি (নিয়মিত প্লাবিত)" },
  { code: "low", nameEn: "Low Land (Deep flood / Beel margin)", nameBn: "নিচু জমি (গভীর প্লাবন / বিল সংলগ্ন)" },
];

const SOIL_TYPES = [
  { code: "alluvial", nameEn: "Alluvial / Silt", nameBn: "পলিমাটি / দোআঁশ" },
  { code: "clay_loam", nameEn: "Clay Loam", nameBn: "এটেল দোআঁশ" },
  { code: "sandy_loam", nameEn: "Sandy Loam", nameBn: "বেলে দোআঁশ" },
  { code: "clay", nameEn: "Clay", nameBn: "এটেল মাটি" },
  { code: "unknown", nameEn: "Unknown / Not Tested", nameBn: "অজানা / পরীক্ষা করা হয়নি" },
];

const DRAINAGE_OPTIONS = [
  { code: "good", nameEn: "Good (Well-drained)", nameBn: "উত্তম (সহজে পানি নিষ্কাশন হয়)" },
  { code: "moderate", nameEn: "Moderate", nameBn: "মাঝারি" },
  { code: "waterlogged", nameEn: "Poor / Waterlogged", nameBn: "ধীর / জলাবদ্ধতা প্রবণ" },
];

const IRRIGATION_OPTIONS = [
  { code: "available", nameEn: "Assured / Fully Available", nameBn: "পর্যাপ্ত / সার্বক্ষণিক সেচ সুবিধা" },
  { code: "limited", nameEn: "Limited / Supplemental Only", nameBn: "সীমিত / সম্পূরক সেচ" },
  { code: "unavailable", nameEn: "Unavailable / Rainfed Only", nameBn: "সেচ সুবিধা নেই / বৃষ্টির ওপর নির্ভরশীল" },
];

const SEASONS = [
  { code: "", nameEn: "Any Season / Flexible", nameBn: "যেকোনো মৌসুম / উন্মুক্ত" },
  { code: "Robi", nameEn: "Robi (Winter: Nov – Mar)", nameBn: "রবি (শীতকালীন: কার্তিক – ফাল্গুন)" },
  { code: "Kharif-1", nameEn: "Kharif-1 (Early Monsoon: Mar – Jul)", nameBn: "খরিপ-১ (আউশ মৌসুম: চৈত্র – আষাঢ়)" },
  { code: "Kharif-2", nameEn: "Kharif-2 (Monsoon: Jul – Nov)", nameBn: "খরিপ-২ (আমন মৌসুম: আষাঢ় – অগ্রহায়ণ)" },
];

export default function CropPlanningPage() {
  const router = useRouter();
  const { t, locale, lang = locale } = useLang();
  const { user } = useAuth();

  // Questionnaire State
  const [formData, setFormData] = useState({
    districtCode: "cumilla",
    upazila: "Burichang",
    village: "",
    area: "50",
    unit: "decimal",
    landType: "medium_high",
    soilType: "clay_loam",
    drainage: "good",
    irrigationAvailability: "available",
    waterSource: "deep_tubewell",
    seasonPreference: "",
    preferredCrop: "",
  });

  const [loading, setLoading] = useState(false);
  const evaluationInFlight = useRef(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);

  // Selection Modal State
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [setupFarmName, setSetupFarmName] = useState("");
  const [setupPlantingDate, setSetupPlantingDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [setupVariety, setSetupVariety] = useState("");
  const [creatingFarm, setCreatingFarm] = useState(false);
  const [createError, setCreateError] = useState("");

  const availableUpazilas = useMemo(() => {
    return getUpazilasForDistrict(formData.districtCode);
  }, [formData.districtCode]);

  const updateField = (field, value) => {
    setError("");
    setResults(null);
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "districtCode") {
        const upzs = getUpazilasForDistrict(value);
        updated.upazila = upzs[0]?.nameEn || "";
      }
      return updated;
    });
  };

  const handleEvaluate = async (e) => {
    if (e) e.preventDefault();
    if (evaluationInFlight.current) return;

    const validationError = validateCropPlanningForm(formData, availableUpazilas);
    if (validationError) {
      setError(t(`myFarm.planning.${validationError}`));
      setResults(null);
      return;
    }

    evaluationInFlight.current = true;
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const res = await fetchCropPlanningRecommendations(buildCropPlanningPayload(formData, lang));
      if (res.success && res.data && Array.isArray(res.data.crops)) {
        setResults(res.data);
      } else {
        setError(getCropPlanningErrorMessage(res, t));
      }
    } catch {
      setError(t("myFarm.planning.networkError"));
    } finally {
      evaluationInFlight.current = false;
      setLoading(false);
    }
  };

  const openSetupModal = (crop) => {
    if (!user) {
      router.push(`/login?redirect=/my-farm/plan`);
      return;
    }
    setSelectedCrop(crop);
    const cropName = lang === "bn" ? crop.cropNameBn : crop.cropNameEn;
    const upz = formData.upazila ? ` - ${formData.upazila}` : "";
    setSetupFarmName(`${cropName}${upz}`);
    setSetupVariety(
      Array.isArray(crop.recommendedVarieties) && crop.recommendedVarieties.length > 0
        ? crop.recommendedVarieties[0]
        : ""
    );
    setCreateError("");
    setSetupModalOpen(true);
  };

  const handleConfirmCreateFarm = async () => {
    if (!setupFarmName.trim()) {
      setCreateError(lang === "bn" ? "খামারের নাম আবশ্যক।" : "Farm name is required.");
      return;
    }

    setCreatingFarm(true);
    setCreateError("");

    const payload = {
      farmName: setupFarmName.trim(),
      name: setupFarmName.trim(),
      location: {
        districtCode: formData.districtCode,
        district: formData.districtCode.toLowerCase() === "chattogram" ? "Chattogram" : "Cumilla",
        upazila: formData.upazila,
        village: formData.village.trim(),
      },
      land: {
        area: parseFloat(formData.area) || 50,
        unit: formData.unit,
        landType: formData.landType,
      },
      soil: {
        type: formData.soilType,
        drainage: formData.drainage,
      },
      water: {
        irrigationAvailability: formData.irrigationAvailability,
        waterSource: formData.waterSource,
      },
      crop: {
        cropCode: selectedCrop.cropCode,
        cropName: selectedCrop.cropNameEn || selectedCrop.cropNameBn || selectedCrop.cropCode,
        variety: setupVariety.trim(),
        cultivationMethod:
          selectedCrop.cropCode === "mustard" ? "Broadcasting / Line" : "Transplanting",
        plantingDate: setupPlantingDate,
      },
      notes: `Created via AI Crop Planning. Evaluated suitability: ${selectedCrop.suitabilityCategory}.`,
    };

    try {
      const res = await createFarm(payload);
      if (res.success && res.data?._id) {
        router.push(`/my-farm/${res.data._id}`);
      } else {
        setCreateError(res.error?.message || "Failed to create farm.");
      }
    } catch {
      setCreateError("A network error occurred while setting up farm.");
    } finally {
      setCreatingFarm(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-2">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/my-farm"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 transition hover:text-stone-900 dark:text-muted dark:hover:text-stone-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("myFarm.backToList")}
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-100 px-3 py-1 text-xs font-semibold text-forest-800 dark:bg-forest-950/60 dark:text-forest-300">
          <Sparkles className="h-3.5 w-3.5 text-forest-600 dark:text-forest-400" />
          BAMIS & NASA Grounded
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-content">
          {t("myFarm.planning.pageTitle")}
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-muted">
          {t("myFarm.planning.pageSubtitle")}
        </p>
      </div>

      {/* Planning Questionnaire Card */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs dark:border-line dark:bg-surface">
        <div className="border-b border-stone-100 pb-4 dark:border-line">
          <h2 className="text-base font-semibold text-stone-900 dark:text-content">
            {t("myFarm.planning.questionnaireTitle")}
          </h2>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-muted">
            {t("myFarm.planning.questionnaireDesc")}
          </p>
        </div>

        <form noValidate onSubmit={handleEvaluate} className="mt-5 space-y-6">
          {/* Section 1: Location & Land */}
          <div>
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-forest-700 dark:text-forest-400">
              <MapPin className="h-4 w-4" />
              {lang === "bn" ? "১. অবস্থান ও জমির বিবরণ" : "1. Location & Land Profile"}
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-muted">
                  {t("myFarm.planning.districtLabel")} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.districtCode}
                  required
                  onChange={(e) => updateField("districtCode", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
                >
                  {DISTRICTS.map((d) => (
                    <option key={d.code} value={d.code}>
                      {lang === "bn" ? d.nameBn : d.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-muted">
                  {t("myFarm.planning.upazilaLabel")} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.upazila}
                  required
                  onChange={(e) => updateField("upazila", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
                >
                  {availableUpazilas.map((u) => (
                    <option key={u.code} value={u.nameEn}>
                      {lang === "bn" ? u.nameBn : u.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-muted">
                  {t("myFarm.planning.villageLabel")}
                </label>
                <input
                  type="text"
                  value={formData.village}
                  onChange={(e) => updateField("village", e.target.value)}
                  placeholder={lang === "bn" ? "উদা: সুজানগর" : "e.g. Sujanagar"}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-muted">
                  {t("myFarm.planning.landAreaLabel")}
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={formData.area}
                    onChange={(e) => updateField("area", e.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
                  />
                  <select
                    value={formData.unit}
                    onChange={(e) => updateField("unit", e.target.value)}
                    className="w-28 shrink-0 rounded-xl border border-stone-200 bg-white px-2 py-2 text-xs text-stone-900 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
                  >
                    {LAND_UNITS.map((u) => (
                      <option key={u.code} value={u.code}>
                        {lang === "bn" ? u.nameBn : u.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-muted">
                  {t("myFarm.planning.landTypeLabel")}
                </label>
                <select
                  value={formData.landType}
                  onChange={(e) => updateField("landType", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
                >
                  {LAND_TYPES.map((lt) => (
                    <option key={lt.code} value={lt.code}>
                      {lang === "bn" ? lt.nameBn : lt.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-muted">
                  {t("myFarm.planning.soilTypeLabel")}
                </label>
                <select
                  value={formData.soilType}
                  onChange={(e) => updateField("soilType", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
                >
                  {SOIL_TYPES.map((st) => (
                    <option key={st.code} value={st.code}>
                      {lang === "bn" ? st.nameBn : st.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Water & Preferences */}
          <div className="border-t border-stone-100 pt-5 dark:border-line">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-forest-700 dark:text-forest-400">
              <Droplets className="h-4 w-4" />
              {lang === "bn" ? "২. পানি ও চাষের পছন্দ" : "2. Water & Preferences"}
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-muted">
                  {t("myFarm.planning.drainageLabel")}
                </label>
                <select
                  value={formData.drainage}
                  onChange={(e) => updateField("drainage", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
                >
                  {DRAINAGE_OPTIONS.map((dr) => (
                    <option key={dr.code} value={dr.code}>
                      {lang === "bn" ? dr.nameBn : dr.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-muted">
                  {t("myFarm.planning.irrigationLabel")}
                </label>
                <select
                  value={formData.irrigationAvailability}
                  onChange={(e) => updateField("irrigationAvailability", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
                >
                  {IRRIGATION_OPTIONS.map((ir) => (
                    <option key={ir.code} value={ir.code}>
                      {lang === "bn" ? ir.nameBn : ir.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-muted">
                  {t("myFarm.planning.seasonLabel")}
                </label>
                <select
                  value={formData.seasonPreference}
                  onChange={(e) => updateField("seasonPreference", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
                >
                  {SEASONS.map((sn) => (
                    <option key={sn.code} value={sn.code}>
                      {lang === "bn" ? sn.nameBn : sn.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div id="crop-planning-error" role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              aria-describedby={error ? "crop-planning-error" : undefined}
              className="inline-flex items-center gap-2 rounded-xl bg-forest-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-800 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2 disabled:opacity-60 dark:bg-forest-600 dark:hover:bg-forest-500"
            >
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading
                ? t("myFarm.planning.analyzing")
                : t("myFarm.planning.analyzeButton")}
            </button>
          </div>
        </form>
      </div>

      {/* Results View */}
      {results && (
        <div className="space-y-6 pt-2">
          {/* Header of results */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-content">
              {t("myFarm.planning.resultsTitle")}
            </h2>
            <span className="text-xs text-stone-500 dark:text-muted">
              {lang === "bn"
                ? `${results.crops?.length || 0} টি বিকল্প পাওয়া গেছে`
                : `${results.crops?.length || 0} options evaluated`}
            </span>
          </div>

          {/* NASA Satellite Environmental Context Strip */}
          {results.satelliteContext && (
            <div className="rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/60 to-emerald-50/40 p-5 dark:border-sky-900/40 dark:from-sky-950/20 dark:to-emerald-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                  {t("myFarm.planning.satelliteContextTitle")}
                </span>
                <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-800 dark:bg-sky-950/80 dark:text-sky-300">
                  NASA Regional Proxy
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-sky-100 bg-white/80 p-3.5 shadow-2xs dark:border-line dark:bg-surface">
                  <div className="flex items-center justify-between text-xs text-stone-500 dark:text-muted">
                    <span>{t("myFarm.planning.surfaceMoisture")}</span>
                    <span>{results.satelliteContext.soilMoistureProxy?.observedDate || "Latest"}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-stone-900 dark:text-content">
                      {results.satelliteContext.soilMoistureProxy?.value ?? "0.22"}
                    </span>
                    <span className="text-xs text-stone-500">
                      {results.satelliteContext.soilMoistureProxy?.unit || "m³/m³"}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-stone-500 dark:text-muted">
                    {results.satelliteContext.soilMoistureProxy?.disclaimer}
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-white/80 p-3.5 shadow-2xs dark:border-line dark:bg-surface">
                  <div className="flex items-center justify-between text-xs text-stone-500 dark:text-muted">
                    <span>{t("myFarm.planning.canopyGreenness")}</span>
                    <span>{results.satelliteContext.vegetationIndexProxy?.observedDate || "Latest"}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-stone-900 dark:text-content">
                      {results.satelliteContext.vegetationIndexProxy?.ndvi !== undefined
                        ? Number(results.satelliteContext.vegetationIndexProxy.ndvi).toFixed(3)
                        : "0.580"}
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">
                      NDVI (0-1)
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-stone-500 dark:text-muted">
                    {results.satelliteContext.vegetationIndexProxy?.disclaimer}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Explanation Callout */}
          {results.aiExplanation && (
            <div className="rounded-2xl border border-forest-200 bg-forest-50/50 p-6 shadow-xs dark:border-forest-900/40 dark:bg-forest-950/20">
              <div className="flex items-center gap-2 text-forest-800 dark:text-forest-300">
                <Sparkles className="h-5 w-5 text-forest-600 dark:text-forest-400" />
                <h3 className="font-semibold">{t("myFarm.planning.aiSummaryTitle")}</h3>
              </div>
              <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-800 dark:text-content">
                {results.aiExplanation}
              </div>
              <p className="mt-4 border-t border-forest-100/80 pt-3 text-xs text-stone-500 dark:border-forest-900/30 dark:text-muted">
                {results.citations?.disclaimer || t("myFarm.planning.aiDisclaimer")}
              </p>
            </div>
          )}

          {/* Recommended Crop Cards Grid */}
          {results.crops?.length === 0 && (
            <div role="status" className="rounded-xl border border-line bg-surface-2 p-5 text-sm text-content">
              {t("myFarm.planning.noRecommendations")}
            </div>
          )}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {results.crops?.map((crop) => {
              const isSupported = crop.suitabilityCategory === "supported";
              return (
                <div
                  key={crop.cropCode}
                  className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-xs transition hover:border-forest-300 dark:border-line dark:bg-surface dark:hover:border-forest-700"
                >
                  <div>
                    {/* Badge and Title */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-block rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700 dark:bg-surface-2 dark:text-muted">
                          {lang === "bn" ? crop.seasonBn : crop.season}
                        </span>
                        <h3 className="mt-1.5 text-lg font-bold text-stone-900 dark:text-content">
                          {lang === "bn" ? crop.cropNameBn : crop.cropNameEn}
                        </h3>
                        <p className="text-xs  text-stone-500 dark:text-muted">
                          {crop.scientificName}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          isSupported
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {isSupported ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        )}
                        {isSupported
                          ? t("myFarm.planning.suitability.supported")
                          : t("myFarm.planning.suitability.potential")}
                      </span>
                    </div>

                    {/* Quick Metrics */}
                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-stone-100 bg-stone-50/70 p-3 text-center dark:border-line dark:bg-surface-2">
                      <div>
                        <span className="block text-[11px] text-stone-500 dark:text-muted">
                          {t("myFarm.planning.plantingWindow")}
                        </span>
                        <span className="mt-0.5 block text-xs font-bold text-stone-900 dark:text-content">
                          {crop.sowingPeriod}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-stone-500 dark:text-muted">
                          {t("myFarm.planning.duration")}
                        </span>
                        <span className="mt-0.5 block text-xs font-bold text-stone-900 dark:text-content">
                          {crop.totalDurationDays} {t("myFarm.planning.days")}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-stone-500 dark:text-muted">
                          {t("myFarm.planning.waterDemand")}
                        </span>
                        <span className="mt-0.5 block text-xs font-bold text-stone-900 dark:text-content">
                          ~{crop.waterRequirementMmTotal} mm
                        </span>
                      </div>
                    </div>

                    {/* Agronomic Alignment Reasons */}
                    {crop.reasons?.length > 0 && (
                      <div className="mt-4 space-y-1.5">
                        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                          {t("myFarm.planning.reasonsTitle")}
                        </span>
                        <ul className="space-y-1">
                          {crop.reasons.map((r, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-1.5 text-xs text-stone-700 dark:text-muted"
                            >
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Constraints / Field Considerations */}
                    {crop.constraints?.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <span className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                          {t("myFarm.planning.constraintsTitle")}
                        </span>
                        <ul className="space-y-1">
                          {crop.constraints.map((c, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-1.5 text-xs text-amber-900 dark:text-amber-200"
                            >
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommended Varieties */}
                    {crop.recommendedVarieties?.length > 0 && (
                      <div className="mt-4">
                        <span className="block text-xs font-medium text-stone-500 dark:text-muted">
                          {t("myFarm.planning.varietiesTitle")}
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {crop.recommendedVarieties.slice(0, 5).map((v, i) => (
                            <span
                              key={i}
                              className="rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs text-stone-700 dark:border-line dark:bg-surface-2 dark:text-muted"
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action CTA */}
                  <div className="mt-6 border-t border-stone-100 pt-4 dark:border-line">
                    <button
                      onClick={() => openSetupModal(crop)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-forest-800 dark:bg-forest-600 dark:hover:bg-forest-500"
                    >
                      <Tractor className="h-4 w-4" />
                      {t("myFarm.planning.selectCrop")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Select Crop Setup Modal */}
      {setupModalOpen && selectedCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-xl dark:border-line dark:bg-surface">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 dark:border-line">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-content">
                  {t("myFarm.planning.selectModalTitle")}
                </h3>
                <p className="text-xs text-stone-500 dark:text-muted">
                  {t("myFarm.planning.selectModalDesc")}
                </p>
              </div>
              <button
                onClick={() => setSetupModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-muted">
                  {t("myFarm.planning.farmName")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={setupFarmName}
                  onChange={(e) => setSetupFarmName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm text-stone-900 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-muted">
                    {t("myFarm.planning.plantingDate")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={setupPlantingDate}
                    onChange={(e) => setSetupPlantingDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-muted">
                    {lang === "bn" ? "বীজের জাত" : "Cultivar / Variety"}
                  </label>
                  <input
                    type="text"
                    value={setupVariety}
                    onChange={(e) => setSetupVariety(e.target.value)}
                    placeholder={lang === "bn" ? "উদা: BRRI dhan89" : "e.g. BRRI dhan89"}
                    className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-line dark:bg-surface-2 dark:text-content"
                  />
                </div>
              </div>

              {/* Pre-filled summary pills */}
              <div className="rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs dark:border-line dark:bg-surface-2">
                <div className="flex flex-wrap gap-2 text-stone-600 dark:text-muted">
                  <span className="font-semibold text-stone-900 dark:text-content">
                    {lang === "bn" ? selectedCrop.cropNameBn : selectedCrop.cropNameEn}
                  </span>
                  <span aria-hidden="true" className="h-1 w-1 rounded-full bg-muted" />
                  <span>{formData.districtCode === "cumilla" ? "Cumilla" : "Chattogram"} ({formData.upazila})</span>
                  <span aria-hidden="true" className="h-1 w-1 rounded-full bg-muted" />
                  <span>{formData.area} {formData.unit}</span>
                  <span aria-hidden="true" className="h-1 w-1 rounded-full bg-muted" />
                  <span>{formData.landType}</span>
                </div>
              </div>

              {createError && (
                <p className="text-xs text-red-600 dark:text-red-400">{createError}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-stone-100 pt-4 dark:border-line">
              <button
                type="button"
                onClick={() => setSetupModalOpen(false)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 dark:border-line dark:text-muted dark:hover:bg-surface-2"
              >
                {lang === "bn" ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={creatingFarm}
                onClick={handleConfirmCreateFarm}
                className="inline-flex items-center gap-2 rounded-xl bg-forest-700 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-forest-800 disabled:opacity-60 dark:bg-forest-600 dark:hover:bg-forest-500"
              >
                <Tractor className="h-4 w-4" />
                {creatingFarm
                  ? t("myFarm.planning.creating")
                  : t("myFarm.planning.confirmCreate")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
