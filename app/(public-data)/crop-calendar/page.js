"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  Droplets,
  ExternalLink,
  FileText,
  Info,
  Layers,
  LayoutGrid,
  Leaf,
  List,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  Thermometer,
  Waves,
  Wind,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge.js";
import { Card, CardBody, CardHeader } from "@/components/ui/Card.js";
import { Table, TBody, TD, THead, TR } from "@/components/ui/Table.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import {
  fetchCropCalendarAlignment,
  fetchCropCalendars,
  fetchCropList,
} from "@/services/api.js";

// Helper to render official Lucide SVG icons for crops
function CropIcon({ cropId, isSelected, className = "h-5 w-5" }) {
  if (cropId === "monsoon_aman") {
    return <Sprout className={`${className} ${isSelected ? "text-forest-700 dark:text-forest-300" : "text-forest-600 dark:text-forest-400"}`} />;
  }
  if (cropId === "boro_rice") {
    return <Leaf className={`${className} ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-blue-600 dark:text-blue-400"}`} />;
  }
  if (cropId === "aus_rice") {
    return <Sun className={`${className} ${isSelected ? "text-amber-700 dark:text-amber-300" : "text-amber-600 dark:text-amber-400"}`} />;
  }
  if (cropId === "mustard") {
    return <Sparkles className={`${className} ${isSelected ? "text-yellow-700 dark:text-yellow-300" : "text-yellow-600 dark:text-yellow-400"}`} />;
  }
  return <Leaf className={`${className} text-forest-600 dark:text-forest-400`} />;
}

export default function CropCalendarPage() {
  const { t, locale } = useLang();
  const { selectedDistrict, setSelectedDistrict, districts, currentDistrictObj } =
    useLocation();

  const [cropsList, setCropsList] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState("monsoon_aman");
  const [calendarData, setCalendarData] = useState(null);
  const [alignmentData, setAlignmentData] = useState(null);
  const [selectedStageIdx, setSelectedStageIdx] = useState(0);
  const [viewMode, setViewMode] = useState("interactive"); // "interactive" | "table"
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isBn = locale === "bn";

  const loadData = useCallback(async (districtCode, cropId, isCurrent = () => true) => {
    setIsLoading(true);
    setError(null);
    try {
      const [cropsRes, calRes, alignRes] = await Promise.all([
        fetchCropList(),
        fetchCropCalendars(districtCode, cropId),
        fetchCropCalendarAlignment(districtCode, cropId),
      ]);
      if (!isCurrent()) return;

      if (cropsRes.success && cropsRes.data) {
        setCropsList(cropsRes.data);
      }

      if (calRes.success && calRes.data?.length > 0) {
        const cal = calRes.data[0];
        setCalendarData(cal);

        // Auto-select active stage if alignment data has one
        if (alignRes.success && alignRes.data?.officialCalendar?.currentStage) {
          const currentStageId = alignRes.data.officialCalendar.currentStage.stageId;
          const stages = cal.districtCalendar?.stages || [];
          const idx = stages.findIndex((s) => s.stageId === currentStageId);
          if (idx >= 0) {
            setSelectedStageIdx(idx);
          } else {
            setSelectedStageIdx(0);
          }
        } else {
          setSelectedStageIdx(0);
        }
      } else {
        throw new Error(calRes.error?.message || "No crop calendar found");
      }

      if (alignRes.success && alignRes.data) {
        setAlignmentData(alignRes.data);
      }
    } catch (err) {
      if (isCurrent()) {
        setError(err.message || (isBn ? "ক্যালেন্ডার উপাত্ত লোড করতে ব্যর্থ" : "Failed to load crop calendar data"));
      }
    } finally {
      if (isCurrent()) setIsLoading(false);
    }
  }, [isBn]);

  useEffect(() => {
    if (!selectedDistrict || !selectedCrop) return;
    let isActive = true;
    Promise.resolve().then(() => {
      if (isActive) loadData(selectedDistrict, selectedCrop, () => isActive);
    });
    return () => {
      isActive = false;
    };
  }, [selectedDistrict, selectedCrop, loadData]);

  const districtName = isBn ? currentDistrictObj?.nameBn : currentDistrictObj?.nameEn;
  const distCal = calendarData?.districtCalendar;
  const currentStage = alignmentData?.officialCalendar?.currentStage;
  const isSeasonActive = alignmentData?.isSeasonActive;
  const satContext = alignmentData?.satelliteContext;
  const stages = distCal?.stages || [];
  const selectedStage = stages[selectedStageIdx] || stages[0];

  // Calculate percentage of water for selected stage
  const totalWater = distCal?.waterRequirementMmTotal || 1;
  const stageWaterPct = selectedStage
    ? Math.round(((selectedStage.waterRequirementMm || 0) / totalWater) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* 1. Header with District Selector, Meteorological Week & Refresh */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink font-heading sm:text-3xl">
              {isBn ? "সরকারি ফসল আবহাওয়া পঞ্জিকা" : "Official Crop Agro-Weather Calendar"}
            </h1>
            <Badge variant="neutral" className="border-forest-200 dark:border-forest-800 text-[11px]">
              BAMIS / DAE / BRRI / BARI
            </Badge>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {isBn
              ? "কৃষি সম্প্রসারণ অধিদপ্তর ও বামিস-এর অনুমোদিত কৃষি অঞ্চলভিত্তিক ফসল পঞ্জিকা ও নাসা উপগ্রহ পরিবেশগত বিশ্লেষণ"
              : "Source-verified agro-meteorological crop calendars from BAMIS and DAE with NASA satellite environmental context."}
          </p>
        </div>

        {/* Dual District & Action Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* District Selector */}
          <div className="relative">
            <label htmlFor="crop-district-select" className="sr-only">
              {isBn ? "জেলা নির্বাচন করুন" : "Select District"}
            </label>
            <MapPin
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
              size={15}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <select
              id="crop-district-select"
              aria-label={isBn ? "জেলা নির্বাচন করুন" : "Select District"}
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="appearance-none rounded-xl border border-line bg-surface py-2 pl-9 pr-8 text-sm font-medium text-ink shadow-xs transition hover:border-emerald focus:border-emerald focus:outline-hidden"
            >
              {districts.map((d) => (
                <option key={d.code} value={d.code}>
                  {isBn ? d.nameBn : d.nameEn}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted"
              size={14}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>

          {/* View Toggle (Interactive Cards vs Official Table) */}
          <div className="flex items-center rounded-xl border border-line bg-surface p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("interactive")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                viewMode === "interactive"
                  ? "bg-forest-600 text-white shadow-2xs dark:bg-forest-700"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <LayoutGrid size={13} strokeWidth={2} />
              <span>{isBn ? "ইন্টারেক্টিভ গাইড" : "Visual Guide"}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-forest-600 text-white shadow-2xs dark:bg-forest-700"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <List size={13} strokeWidth={2} />
              <span>{isBn ? "সরকারি গেজেট টেবিল" : "Official Table"}</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => loadData(selectedDistrict, selectedCrop)}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface-2 cursor-pointer"
            title={isBn ? "উপাত্ত রিফ্রেশ করুন" : "Refresh data"}
          >
            <RefreshCw size={14} strokeWidth={1.8} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{isBn ? "রিফ্রেশ" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Crop Selector Cards (৪টি মূল ফসল নির্বাচন কার্ড) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            {isBn ? "ফসল নির্বাচন করুন (Select Crop)" : "Select Crop"}
          </label>
          <span className="text-xs text-ink-muted">
            {isBn ? "অঞ্চল: " + districtName : "Region: " + districtName}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(cropsList.length > 0
            ? cropsList
            : [
                { cropId: "monsoon_aman", nameEn: "Transplanted Aman Rice", nameBn: "রোপা আমন ধান", season: "Kharif-2", seasonBn: "খরিপ-২" },
                { cropId: "boro_rice", nameEn: "Boro Rice", nameBn: "বোরো ধান", season: "Robi", seasonBn: "রবি" },
                { cropId: "aus_rice", nameEn: "Aus Rice", nameBn: "আউশ ধান", season: "Kharif-1", seasonBn: "খরিপ-১" },
                { cropId: "mustard", nameEn: "Mustard", nameBn: "সরিষা", season: "Robi", seasonBn: "রবি" },
              ]
          ).map((crop) => {
            const isSelected = selectedCrop === crop.cropId;
            return (
              <button
                key={crop.cropId}
                type="button"
                onClick={() => setSelectedCrop(crop.cropId)}
                className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-forest-600 bg-forest-50/80 shadow-sm ring-2 ring-forest-500/20 dark:border-forest-500 dark:bg-forest-950/30 dark:ring-forest-500/30"
                    : "border-line bg-surface hover:border-forest-300 dark:hover:border-forest-700 hover:bg-surface-2"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-forest-100/80 dark:bg-forest-950/60">
                    <CropIcon cropId={crop.cropId} isSelected={isSelected} />
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-forest-600 text-white dark:bg-forest-500"
                        : "bg-surface-2 text-ink-muted border border-line"
                    }`}
                  >
                    {isBn ? crop.seasonBn || crop.season : crop.season}
                  </span>
                </div>
                <div className="mt-2.5">
                  <h3
                    className={`text-sm font-bold truncate ${
                      isSelected ? "text-forest-900 dark:text-forest-100" : "text-ink"
                    }`}
                  >
                    {isBn ? crop.nameBn : crop.nameEn}
                  </h3>
                  <p className="text-[11px] text-ink-muted truncate">
                    {crop.scientificName || (isBn ? "সরকারি ক্যালেন্ডার" : "Official Calendar")}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Hero Active Field Advisory Banner (আজকের মাঠ পর্যায় ও জরুরি সতর্কতা) */}
      <div className="overflow-hidden rounded-2xl border border-forest-200 bg-gradient-to-br from-forest-50/90 via-emerald-50/40 to-white p-5 shadow-xs dark:border-forest-900/40 dark:from-forest-950/30 dark:via-surface dark:to-surface">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-forest-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-forest-800 dark:text-forest-300">
                {isSeasonActive
                  ? isBn
                    ? "চলমান মাঠ পর্যায় ও আবহাওয়া পরামর্শ"
                    : "Active Field Stage & Meteorological Advisory"
                  : isBn
                    ? "মৌসুমী অবস্থা ও প্রস্তুতি"
                    : "Seasonal Status & Field Readiness"}
              </span>
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium text-forest-700 border border-forest-200 dark:bg-surface-2 dark:text-forest-300 dark:border-forest-800">
                {isBn ? "জেলা: " + districtName : "District: " + districtName}
              </span>
            </div>

            <h2 className="text-lg font-bold text-ink sm:text-xl">
              {isSeasonActive && currentStage ? (
                <>
                  <span className="text-forest-700 dark:text-forest-300">
                    {isBn ? currentStage.stageNameBn : currentStage.stageNameEn}
                  </span>
                  <span className="text-xs font-normal text-ink-muted ml-2">
                    ({isBn ? `মেয়াদ: ${currentStage.durationDays} দিন` : `Duration: ${currentStage.durationDays} days`})
                  </span>
                </>
              ) : (
                <span>
                  {isBn
                    ? `বর্তমানে ${calendarData?.nameBn || "এই ফসলের"} অফ-সিজন চলছে`
                    : `Currently ${calendarData?.nameEn || "this crop"} is off-season`}
                </span>
              )}
            </h2>

            <p className="text-xs leading-relaxed text-ink-muted max-w-3xl">
              {isSeasonActive && currentStage?.weatherHazards ? (
                <span className="inline-flex items-start gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>{isBn ? "আবহাওয়া ঝুঁকি ও করণীয়: " : "Weather Hazard & Advisory: "}</strong>
                    {currentStage.weatherHazards}
                  </span>
                </span>
              ) : (
                <span>
                  {isBn
                    ? "জমির উর্বরতা বজায় রাখতে জৈব সার প্রয়োগ করুন এবং পরবর্তী মৌসুমের প্রত্যয়িত বীজ সংগ্রহ নিশ্চিত করুন।"
                    : "Maintain soil fertility with organic amendments and secure certified seeds for the upcoming sowing window."}
                </span>
              )}
            </p>
          </div>

          {/* Quick PDF & Publisher attribution */}
          <div className="flex flex-col items-start md:items-end gap-1.5 text-xs text-ink-muted shrink-0">
            {distCal?.sourceDocumentUrl && (
              <a
                href={distCal.sourceDocumentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-forest-300 bg-white/90 px-3.5 py-2 font-semibold text-forest-800 shadow-2xs transition hover:bg-forest-50 dark:border-forest-800 dark:bg-forest-950/40 dark:text-forest-300"
              >
                <FileText size={14} strokeWidth={1.8} />
                <span>{isBn ? "অফিসিয়াল BAMIS গেজেট PDF" : "Official BAMIS Gazette PDF"}</span>
                <ExternalLink size={12} strokeWidth={1.8} />
              </a>
            )}
            <span className="text-[11px] text-ink-muted">
              {distCal?.sourcePublisher || "DAE / BAMIS"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Crop Key Agronomic Windows Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Duration */}
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-ink-muted">
            <Clock size={16} strokeWidth={1.8} className="text-forest-600 dark:text-forest-400" />
            <span className="text-xs font-medium">{isBn ? "মোট জীবনকাল" : "Total Life Cycle"}</span>
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-ink">
            {distCal?.totalDurationDays || "—"} {isBn ? "দিন" : "Days"}
          </div>
          <p className="mt-0.5 text-[11px] text-ink-muted">
            {isBn ? "বীজ বপন থেকে কর্তন" : "Sowing to harvest duration"}
          </p>
        </div>

        {/* Sowing Window */}
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-ink-muted">
            <Calendar size={16} strokeWidth={1.8} className="text-sky-600 dark:text-sky-400" />
            <span className="text-xs font-medium">{isBn ? "বপন / বীজতলা সময়" : "Sowing Period"}</span>
          </div>
          <div className="mt-1 text-sm font-bold text-ink truncate">
            {distCal?.sowingPeriod || "—"}
          </div>
          <p className="mt-0.5 text-[11px] text-ink-muted truncate">
            {distCal?.transplantingPeriod
              ? `${isBn ? "রোপণ:" : "Planting:"} ${distCal.transplantingPeriod}`
              : isBn ? "সরাসরি জমিতে বীজ বপন" : "Direct seeded"}
          </p>
        </div>

        {/* Total Water Requirement */}
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-ink-muted">
            <Droplets size={16} strokeWidth={1.8} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium">{isBn ? "মোট পানির চাহিদা" : "Water Requirement"}</span>
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-ink">
            {distCal?.waterRequirementMmTotal || "—"} mm
          </div>
          <p className="mt-0.5 text-[11px] text-ink-muted">
            {isBn ? "সেচ ও বৃষ্টির মোট প্রয়োজন" : "Total water demand"}
          </p>
        </div>

        {/* Harvesting Period */}
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-ink-muted">
            <CalendarRange size={16} strokeWidth={1.8} className="text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium">{isBn ? "ফসল কর্তন সময়" : "Harvest Window"}</span>
          </div>
          <div className="mt-1 text-sm font-bold text-ink truncate">
            {distCal?.harvestingPeriod || "—"}
          </div>
          <p className="mt-0.5 text-[11px] text-ink-muted">
            {isBn ? "অনুকূল পরিপক্বতা পর্যায়" : "Target maturity window"}
          </p>
        </div>
      </div>

      {/* 5. Interactive Stepper & Stage Deep-Dive Inspector */}
      {viewMode === "interactive" ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs space-y-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Layers size={18} strokeWidth={1.8} className="text-forest-600 dark:text-forest-400" />
                <h2 className="text-base font-bold text-ink">
                  {isBn ? "পর্যায়ক্রমিক বৃদ্ধির ধাপ ও বিশদ নির্দেশিকা" : "Phenological Lifecycle & Stage Guide"}
                </h2>
              </div>
              <span className="text-xs text-ink-muted">
                {isBn ? "যে কোনো ধাপে ক্লিক করে বিস্তারিত দেখুন" : "Click on any stage card to explore details"}
              </span>
            </div>

            {/* Visual Lifecycle Stepper Timeline */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {stages.map((stg, idx) => {
                const isSelected = selectedStageIdx === idx;
                const isCurrent = currentStage?.stageId === stg.stageId;
                return (
                  <button
                    key={stg.stageId}
                    type="button"
                    onClick={() => setSelectedStageIdx(idx)}
                    className={`group relative flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-forest-600 bg-forest-50/70 shadow-sm ring-2 ring-forest-500/20 dark:border-forest-500 dark:bg-forest-950/40"
                        : "border-line bg-surface-2 hover:border-forest-300 dark:hover:border-forest-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          isSelected
                            ? "bg-forest-600 text-white dark:bg-forest-500"
                            : isCurrent
                              ? "bg-forest-200 text-forest-800 dark:bg-forest-900 dark:text-forest-200"
                              : "bg-surface text-ink-muted border border-line"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      {isCurrent && (
                        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {isBn ? "চলমান" : "Active"}
                        </span>
                      )}
                    </div>

                    <h4 className="mt-2 text-xs font-bold text-ink line-clamp-2">
                      {isBn ? stg.stageNameBn : stg.stageNameEn}
                    </h4>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-ink-muted">
                      <span>{stg.durationDays} {isBn ? "দিন" : "days"}</span>
                      <span className="font-mono">{stg.waterRequirementMm} mm</span>
                    </div>

                    {/* Progress indicator bar at bottom */}
                    <div className="mt-2 h-1 w-full rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isSelected ? "bg-forest-600" : "bg-forest-300 dark:bg-forest-700"}`}
                        style={{
                          width: `${Math.min(100, Math.round(((stg.waterRequirementMm || 10) / totalWater) * 100 * 2.5))}%`,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Stage Deep-Dive Detail Card (নির্বাচিত ধাপের বিশদ বিবরণ) */}
            {selectedStage && (
              <div className="rounded-2xl border border-forest-200 bg-forest-50/30 p-5 dark:border-forest-900/40 dark:bg-forest-950/20 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-forest-100 pb-3 dark:border-forest-900/30">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-forest-600 text-white font-bold text-xs dark:bg-forest-500">
                      {selectedStageIdx + 1}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-ink">
                        {isBn ? selectedStage.stageNameBn : selectedStage.stageNameEn}
                      </h3>
                      <p className="text-xs text-ink-muted">
                        {isBn
                          ? `আবহাওয়া সপ্তাহ: SMW ${selectedStage.standardWeeks[0]} – ${selectedStage.standardWeeks[1]} | আনুমানিক মেয়াদ: ${selectedStage.durationDays} দিন`
                          : `Standard Meteorological Weeks: SMW ${selectedStage.standardWeeks[0]} – ${selectedStage.standardWeeks[1]} | Duration: ${selectedStage.durationDays} days`}
                      </p>
                    </div>
                  </div>

                  {currentStage?.stageId === selectedStage.stageId && (
                    <Badge variant="success">
                      {isBn ? "মাঠে বর্তমান সক্রিয় পর্যায়" : "Currently Active on Field"}
                    </Badge>
                  )}
                </div>

                {/* 3 Metric Pillars: Water, Temp, Hazards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {/* Water Demand Card */}
                  <div className="rounded-xl border border-blue-200 bg-white/90 p-4 shadow-2xs dark:border-blue-900/40 dark:bg-surface">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <Droplets size={16} />
                        <span className="text-xs font-semibold">{isBn ? "পানির চাহিদা ও সেচ" : "Irrigation & Water"}</span>
                      </div>
                      <span className="font-mono text-sm font-bold text-blue-800 dark:text-blue-200">
                        {selectedStage.waterRequirementMm} mm
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-[11px] text-ink-muted mb-1">
                        <span>{isBn ? "মোট ফসলের পানির অনুপাত" : "Share of total water"}</span>
                        <span className="font-semibold">{stageWaterPct}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-blue-100 dark:bg-blue-950 overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${stageWaterPct}%` }} />
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-ink-muted leading-relaxed">
                      {isBn
                        ? "এই ধাপে পানির ঘাটতি হলে ফলন মারাত্মকভাবে ব্যাহত হতে পারে। জমিতে পর্যাপ্ত আর্দ্রতা বজায় রাখুন।"
                        : "Moisture stress during this stage significantly affects yield. Maintain adequate field moisture."}
                    </p>
                  </div>

                  {/* Temperature Card */}
                  <div className="rounded-xl border border-amber-200 bg-white/90 p-4 shadow-2xs dark:border-amber-900/40 dark:bg-surface">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                        <Thermometer size={16} />
                        <span className="text-xs font-semibold">{isBn ? "অনুকূল তাপমাত্রা" : "Optimal Temperature"}</span>
                      </div>
                      <span className="font-mono text-sm font-bold text-amber-800 dark:text-amber-200">
                        {selectedStage.optimalTempRange[0]}°C – {selectedStage.optimalTempRange[1]}°C
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-[11px] text-ink-muted">
                      <div className="flex justify-between">
                        <span>{isBn ? "সর্বনিম্ন সহনশীল:" : "Min Tolerance:"}</span>
                        <span className="font-mono font-semibold">{selectedStage.minimumTempC}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{isBn ? "সর্বোচ্চ সহনশীল:" : "Max Tolerance:"}</span>
                        <span className="font-mono font-semibold">{selectedStage.maximumTempC}°C</span>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-ink-muted leading-relaxed">
                      {isBn
                        ? "তাপমাত্রা অনুকূল সীমার বাইরে গেলে পরাগায়ন ও দানার গঠন ব্যাহত হতে পারে।"
                        : "Extreme temperature outside tolerance limits hampers vegetative growth and panicle emergence."}
                    </p>
                  </div>

                  {/* Weather Hazards & Protection */}
                  <div className="rounded-xl border border-rose-200 bg-white/90 p-4 shadow-2xs dark:border-rose-900/40 dark:bg-surface">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                      <ShieldAlert size={16} />
                      <span className="text-xs font-semibold">{isBn ? "আবহাওয়া ঝুঁকি ও রোগবালাই" : "Hazards & Pest Advisory"}</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-ink">
                      {selectedStage.weatherHazards}
                    </p>
                    <p className="mt-2 text-[11px] text-ink-muted">
                      {isBn
                        ? "লক্ষণ দেখা দিলে স্থানীয় উপসহকারী কৃষি কর্মকর্তা (SAAO)-এর সাথে যোগাযোগ করুন।"
                        : "Consult your local Upazila Agriculture Officer (DAE) upon early disease detection."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 5B. Official Gazette Table View */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={16} strokeWidth={1.8} className="text-emerald" />
                <h2 className="text-base font-bold text-ink">
                  {isBn ? "অফিসিয়াল গেজেট টেবিল ভিউ (BAMIS / DAE)" : "Official Phenological Table View (BAMIS / DAE)"}
                </h2>
              </div>
              <span className="text-xs text-ink-muted">
                {stages.length} {isBn ? "টি সুনির্দিষ্ট পর্যায়" : "Stages"}
              </span>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TD className="w-12 font-bold">#</TD>
                    <TD className="font-bold">{isBn ? "ফসল বৃদ্ধির পর্যায়" : "Phenological Stage"}</TD>
                    <TD className="font-bold">{isBn ? "আবহাওয়া সপ্তাহ (SMW)" : "Standard Weeks"}</TD>
                    <TD className="font-bold">{isBn ? "মেয়াদ" : "Days"}</TD>
                    <TD className="font-bold">{isBn ? "পানির চাহিদা" : "Water (mm)"}</TD>
                    <TD className="font-bold">{isBn ? "অনুকূল তাপমাত্রা" : "Optimal Temp"}</TD>
                    <TD className="font-bold">{isBn ? "আবহাওয়া ঝুঁকি ও বিশেষ সতর্কতা" : "Weather Hazards & Advisory"}</TD>
                  </TR>
                </THead>
                <TBody>
                  {stages.map((stage, idx) => {
                    const isCurrent = currentStage?.stageId === stage.stageId;
                    return (
                      <TR key={stage.stageId} className={isCurrent ? "bg-emerald/5" : ""}>
                        <TD className="font-mono text-xs text-ink-muted">{idx + 1}</TD>
                        <TD>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-ink">
                              {isBn ? stage.stageNameBn : stage.stageNameEn}
                            </span>
                            {isCurrent && (
                              <Badge variant="success" className="text-[10px]">
                                {isBn ? "চলমান পর্যায়" : "Active Now"}
                              </Badge>
                            )}
                          </div>
                        </TD>
                        <TD className="font-mono text-xs text-ink-muted">
                          Week {stage.standardWeeks[0]} – {stage.standardWeeks[1]}
                        </TD>
                        <TD className="font-mono text-xs text-ink">
                          {stage.durationDays} {isBn ? "দিন" : "d"}
                        </TD>
                        <TD className="font-mono text-xs text-ink">
                          {stage.waterRequirementMm} mm
                        </TD>
                        <TD className="font-mono text-xs text-ink">
                          {stage.optimalTempRange[0]}°C – {stage.optimalTempRange[1]}°C
                        </TD>
                        <TD className="text-xs text-ink-muted max-w-xs">
                          <div className="flex items-start gap-1.5">
                            <AlertTriangle size={13} strokeWidth={1.8} className="text-amber-600 mt-0.5 shrink-0" />
                            <span>{stage.weatherHazards}</span>
                          </div>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 6. DAE Approved Regional Varieties & Crop Metadata */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-3">
          <div className="space-y-0.5">
            <h3 className="font-bold text-sm text-ink">
              {isBn ? "অনুমোদিত জাতসমূহ ও কৃষি পরিবেশ অঞ্চল" : "DAE Approved Varieties & Agro-Ecological Region"}
            </h3>
            <p className="text-xs text-ink-muted">
              <strong>{isBn ? "অঞ্চল:" : "DAE Region:"}</strong> {distCal?.daeRegion || (isBn ? "চট্টগ্রাম ও কুমিল্লা অঞ্চল" : "Chattogram & Cumilla Regions")}
            </p>
          </div>
          <span className="text-xs font-mono text-ink-muted">
            {calendarData?.scientificName}
          </span>
        </div>

        <div>
          <label className="text-xs font-semibold text-ink-muted">
            {isBn ? "প্রস্তাবিত ও চাষোপযোগী জাত:" : "Recommended Cultivars:"}
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {(calendarData?.typicalVarieties || "")
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
              .map((variety) => (
                <span
                  key={variety}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-forest-200 bg-forest-50/70 px-3 py-1 text-xs font-semibold text-forest-800 dark:border-forest-800 dark:bg-forest-950/40 dark:text-forest-200"
                >
                  <Leaf size={12} className="text-forest-600 dark:text-forest-400" />
                  <span>{variety}</span>
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* 7. NASA Satellite Grounded Environmental Context */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <Compass size={18} strokeWidth={1.8} className="text-[#2878c8]" />
            <h3 className="font-bold text-base text-ink">
              {isBn ? "নাসা উপগ্রহ সমকালীন পরিবেশগত বিশ্লেষণ (NASA Satellite Context)" : "NASA Satellite Environmental Alignment"}
            </h3>
          </div>
          <Badge variant="neutral">NASA Earthdata</Badge>
        </div>

        <p className="text-xs text-ink-muted">
          {isBn
            ? "সরকারি ক্রপ ক্যালেন্ডারের সাথে নাসার বাস্তব উপগ্রহ পর্যবেক্ষণের স্থানিক পরিবেশগত অবস্থা নিচে প্রদর্শন করা হলো। উপগ্রহ পর্যবেক্ষণগুলো কেবল পরিবেশগত অবস্থা নির্দেশ করে, এগুলো সরাসরি সার বা সেচের সরকারি নির্দেশিকা নয়।"
            : "Below is the real-time physical environmental context from NASA satellite missions alongside the official crop calendar. Satellite observations provide regional atmospheric and canopy conditions, NOT direct agronomic mandates."}
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Soil Moisture Alignment */}
          <div className="rounded-xl border border-line bg-surface-2 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Waves size={16} strokeWidth={1.8} className="text-[#0f6c49]" />
                <span className="font-semibold text-xs text-ink">
                  {isBn ? "মাটির আর্দ্রতা অবস্থা (NASA SMAP 9km)" : "Soil Moisture Context (NASA SMAP 9km)"}
                </span>
              </div>
              <Badge variant={satContext?.soilMoisture?.isRecommended ? "success" : "warning"}>
                {satContext?.soilMoisture?.quality || "Recommended"}
              </Badge>
            </div>
            {satContext?.soilMoisture ? (
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-ink-muted">{isBn ? "সর্বশেষ স্যাটেলাইট মান:" : "Latest Satellite Observation:"}</span>
                  <span className="font-bold font-mono text-base text-ink">
                    {satContext.soilMoisture.value} {satContext.soilMoisture.unit}
                  </span>
                </div>
                <div className="flex justify-between text-ink-muted text-[11px]">
                  <span>{isBn ? "তারিখ ও রেজোলিউশন:" : "Date & Resolution:"}</span>
                  <span>{satContext.soilMoisture.date} (9 km grid posting)</span>
                </div>
                <p className="text-[11px] text-ink-muted/90 pt-1.5 border-t border-line/60">
                  {isBn
                    ? "মাটির শীর্ষ ৫ সেমি ভলিউমেট্রিক পানির পরিমাণ। বীজতলা তৈরি ও চারা রোপণ পর্যায়ের মাটির প্রস্তুতিতে অত্যন্ত সহায়ক।"
                    : "Top 5cm volume soil water. Informs seedbed preparation and transplanting field readiness."}
                </p>
              </div>
            ) : (
              <p className="text-xs text-ink-muted">{isBn ? "কোনো পর্যবেক্ষণ পাওয়া যায়নি" : "No observation available"}</p>
            )}
          </div>

          {/* Vegetation Index Alignment */}
          <div className="rounded-xl border border-line bg-surface-2 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf size={16} strokeWidth={1.8} className="text-emerald" />
                <span className="font-semibold text-xs text-ink">
                  {isBn ? "ক্যানোপি সবুজত্ব সূচক (NASA MODIS 250m)" : "Canopy Vigor Index (NASA MODIS 250m)"}
                </span>
              </div>
              <Badge variant={satContext?.vegetationIndex?.isReliable ? "success" : "warning"}>
                {satContext?.vegetationIndex?.quality || "Operational"}
              </Badge>
            </div>
            {satContext?.vegetationIndex ? (
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-ink-muted">{isBn ? "সর্বশেষ এনডিভিআই (NDVI):" : "Latest NDVI Index:"}</span>
                  <span className="font-bold font-mono text-base text-ink">
                    {satContext.vegetationIndex.ndvi}
                  </span>
                </div>
                <div className="flex justify-between text-ink-muted text-[11px]">
                  <span>{isBn ? "তারিখ ও রেজোলিউশন:" : "Date & Resolution:"}</span>
                  <span>{satContext.vegetationIndex.date} (250m sinusoidal)</span>
                </div>
                <p className="text-[11px] text-ink-muted/90 pt-1.5 border-t border-line/60">
                  {isBn
                    ? "২৫০ মিটারে ক্যানোপি ক্লোরোফিল পরিমাপ। বৃদ্ধি পর্যায় ও উদ্ভিদের সামগ্রিক সতেজতা নির্দেশ করে।"
                    : "250m regional chlorophyll absorption indicating vegetative canopy vigor."}
                </p>
              </div>
            ) : (
              <p className="text-xs text-ink-muted">{isBn ? "কোনো পর্যবেক্ষণ পাওয়া যায়নি" : "No observation available"}</p>
            )}
          </div>
        </div>

        {/* Scientific Disclosure */}
        <div className="rounded-xl border border-line bg-surface p-3 text-xs text-ink-muted">
          <div className="flex items-start gap-2">
            <Info size={15} strokeWidth={1.8} className="mt-0.5 shrink-0 text-emerald" />
            <p>
              {alignmentData?.scientificDisclosure ||
                (isBn
                  ? "অফিসিয়াল কৃষি নির্দেশনাসমূহ BAMIS / DAE / BRRI / BARI দ্বারা প্রকাশিত। নাসার স্যাটেলাইট পর্যবেক্ষণ (SMAP, MODIS, POWER) ২৫০ মিটার থেকে ৯ কিমি গ্রিড স্কেলে ভৌত পরিবেশগত পটভূমি তুলে ধরে। এটি স্থানীয় কৃষি কর্মকর্তার সরাসরি মাঠপর্যায়ের মাটির পরীক্ষার বিকল্প নয়।"
                  : "Official agronomic recommendations are published by BAMIS / DAE / BRRI / BARI. Satellite observations (SMAP, MODIS, POWER) provide physical environmental context across 250m to 9km grid scales. They do NOT replace extension advisory or direct farm-level soil testing.")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
