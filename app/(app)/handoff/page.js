"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  FileText,
  Filter,
  Info,
  Layers,
  MapPin,
  Printer,
  RefreshCw,
  Thermometer,
  TrendingUp,
  Wheat,
} from "lucide-react";

import { HandoffSowingChart } from "@/components/charts/HandoffSowingChart.js";
import { Badge } from "@/components/ui/Badge.js";
import { Button } from "@/components/ui/Button.js";
import { Card, CardBody, CardHeader } from "@/components/ui/Card.js";
import { MetricCard } from "@/components/ui/MetricCard.js";
import { ErrorState, LoadingState } from "@/components/ui/States.js";
import { Table, TBody, TD, THead, TR } from "@/components/ui/Table.js";
import { Tooltip } from "@/components/ui/Tooltip.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { translations } from "@/lib/i18n/translations.js";
import { fetchHandoffAnalysis } from "@/services/api.js";

function formatFixed(value, digits) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "—";
}

// Sowing-window labels are derived from the backend-provided numeric config
// (sowing_month / sowing_days_start / sowing_days_end) so every transition
// renders its own window in both languages. Nothing is ever invented: when the
// backend config is missing or malformed we fall back to the backend's English
// sowing_window_label, then to a neutral dash.
const EN_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const BN_MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

function toBnDigits(value) {
  return String(value).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

// Numeric values are shown with Bengali digits in Bangla UI (month labels and
// partial disclosures already do this); keeps KPI figures locale-consistent.
function locNum(value, locale) {
  const str = typeof value === "number" && Number.isFinite(value) ? String(value) : value == null ? "" : String(value);
  return locale === "bn" ? toBnDigits(str) : str;
}

function windowNumbersValid(config) {
  const month = Number(config?.sowing_month);
  const start = Number(config?.sowing_days_start);
  const end = Number(config?.sowing_days_end);
  return (
    Number.isInteger(month) && month >= 1 && month <= 12 &&
    Number.isInteger(start) && start >= 1 &&
    Number.isInteger(end) && end >= start && end - start <= 30
  );
}

function sowingWindowLabel(config, locale) {
  if (windowNumbersValid(config)) {
    const month = Number(config.sowing_month);
    const start = Number(config.sowing_days_start);
    const end = Number(config.sowing_days_end);
    if (locale === "bn") {
      const monthName = BN_MONTHS[month - 1];
      return start === end ? `${toBnDigits(start)} ${monthName}` : `${toBnDigits(start)}–${toBnDigits(end)} ${monthName}`;
    }
    const monthName = EN_MONTHS_SHORT[month - 1];
    return start === end ? `${monthName} ${start}` : `${monthName} ${start}–${end}`;
  }
  const backendLabel = config?.sowing_window_label;
  return typeof backendLabel === "string" && backendLabel.trim() ? backendLabel : null;
}

function sowingWindowLengthDays(config) {
  if (!windowNumbersValid(config)) return null;
  return Number(config.sowing_days_end) - Number(config.sowing_days_start) + 1;
}

function generateSmsAdvisory(districtObj, config, sowingOpp, periodComp, locale = "bn") {
  // District documents (MongoDB model + client defaults) use nameEn/nameBn;
  // the snake_case variants are kept as a defensive fallback only.
  const distName = locale === "bn"
    ? (districtObj?.nameBn || districtObj?.name_bn || "কুমিল্লা")
    : (districtObj?.nameEn || districtObj?.name_en || "Cumilla");
  const cropTrans = locale === "bn" ? (config?.name_bn || "রোপা আমন -> সরিষা") : (config?.name_en || "Aman -> Mustard");
  const dryMedian = sowingOpp?.sowing_dry_days_distribution?.median ?? "—";
  const workablePct = sowingOpp?.workable_window_frequency_pct ?? "—";
  const workableYears = sowingOpp?.years_with_workable_window ?? "—";
  const totalYears = sowingOpp?.total_years ?? "—";
  const windowLabel = sowingWindowLabel(config, locale) ?? "—";
  const octLateShift = periodComp?.metrics?.oct_late_rain?.shift?.delta_pct;
  const octLateSign = Number.isFinite(octLateShift)
    ? `${octLateShift > 0 ? "+" : ""}${octLateShift}%`
    : "—";

  if (locale === "bn") {
    return `[কৃষি মামা - ঐতিহাসিক ডেটা সারাংশ · স্বাধীন যাচাই বাকি]
জেলা: ${distName} | রূপান্তর: ${cropTrans}
ঐতিহাসিক সারাংশ, বপন উইন্ডো ${windowLabel}:
১. মধ্যম শুষ্ক দিন: ${toBnDigits(dryMedian)}।
২. প্রকল্পের শুষ্ক-দিন সংজ্ঞা পূরণকারী বছর: ${toBnDigits(workableYears)}/${toBnDigits(totalYears)} (${toBnDigits(workablePct)}%)।
৩. অক্টোবরের শেষভাগের বৃষ্টিপাতের ঐতিহাসিক পরিবর্তন: ${locale === "bn" ? toBnDigits(octLateSign) : octLateSign}।
এগুলো ঐতিহাসিক ফ্রিকোয়েন্সি মাত্র — ভবিষ্যৎ সম্ভাবনা বা কৃষি পরামর্শ নয়। তথ্য ও সূত্রের স্বাধীন যাচাই বাকি।`;
  }

  return `[Krishi Mama - Historical Data Summary · Independent verification pending]
District: ${distName} | Transition: ${cropTrans}
Historical summary, sowing window ${windowLabel}:
1. Median dry days: ${dryMedian}.
2. Years meeting the project dry-day definition: ${workableYears}/${totalYears} (${workablePct}%).
3. Historical late-October rainfall change: ${octLateSign}.
These are historical frequencies only, not future probabilities or agronomic advice. Data and provenance review is pending.`;
}

const METRIC_STRING_KEYS = {
  sowing_dry_days: "metricSowingDryDays",
  oct_late_rain: "metricOctLateRain",
  oct_total_rain: "metricOctTotalRain",
  nov_total_rain: "metricNovTotalRain",
  sowing_mean_tmin: "metricSowingTmin",
};

// Renders the partial-total disclosure for a yearly-table cell from the
// backend rainfall_period_totals block. Legacy rows (or periods) without the
// disclosure render nothing extra; nothing is fabricated. Complete-period
// totals need no annotation. Observed partial sums are disclosed VISIBLY
// (kind, valid/expected days, coverage) so mouse hover, touch, and keyboard
// users all get the same information, and a visually hidden sentence carries
// the full state to screen readers (title tooltips are not keyboard/touch
// accessible). no_observations is stated in words, never rendered as "0".
function PeriodTotalSub({ row, periodKey, locale }) {
  const block = row?.rainfall_period_totals?.[periodKey];
  if (!block || typeof block !== "object") return null;
  if (block.total_kind === "no_observations") {
    const note = locale === "bn"
      ? "এই সময়কালের কোনো বৈধ পর্যবেক্ষণ নেই (সম্পূর্ণ অনুপস্থিত), শূন্য বৃষ্টিপাত নয়।"
      : "No valid observations exist for this period (entirely absent), not zero rainfall.";
    return (
      // `relative` anchors the sr-only note to this line: bare sr-only spans
      // inside wide scroll-clipped tables position against the document root
      // and create horizontal page overflow on small viewports.
      <span className="relative block text-[11px] text-muted">
        {locale === "bn" ? "কোনো পর্যবেক্ষণ নেই" : "No observations"}
        <span className="sr-only">{note}</span>
      </span>
    );
  }
  if (block.total_kind === "observed_partial_sum") {
    const covRaw = typeof block.period_coverage_percent === "number"
      ? `${block.period_coverage_percent}%`
      : "—";
    const cov = locale === "bn" ? (covRaw === "—" ? covRaw : `${toBnDigits(block.period_coverage_percent)}%`) : covRaw;
    const validDays = block.valid_days ?? "—";
    const expectedDays = block.expected_days ?? "—";
    const daysShort = locale === "bn" ? "দিন" : "d";
    const bnValid = locale === "bn" ? toBnDigits(validDays) : validDays;
    const bnExpected = locale === "bn" ? toBnDigits(expectedDays) : expectedDays;
    const note = locale === "bn"
      ? `আংশিক পর্যবেক্ষিত সমষ্টি: সম্পূর্ণ সময়কালের মোট নয়। ${bnValid}/${bnExpected} দিনের পর্যবেক্ষণ, কভারেজ ${cov}। অনুপস্থিত দিন অনুমান করা হয়নি।`
      : `Partial observed sum, not a complete-period total: ${validDays}/${expectedDays} valid days, coverage ${cov}. Missing days are not imputed.`;
    return (
      <span className="relative block text-[11px] leading-snug text-amber-strong">
        {locale === "bn" ? "আংশিক" : "Partial"} · {bnValid}/{bnExpected} {daysShort} · {cov}
        <span className="sr-only">{note}</span>
      </span>
    );
  }
  return null; // complete_period_total: no annotation required
}

export default function HandoffPage() {
  const { locale } = useLang();
  const { selectedDistrict, setSelectedDistrict, districts, currentDistrictObj } = useLocation();

  const [transition, setTransition] = useState("aman-mustard");
  const [forceSnapshot, setForceSnapshot] = useState(false);
  const [sourceMode, setSourceMode] = useState("live");
  const [handoffData, setHandoffData] = useState(null);
  const [handoffDataKey, setHandoffDataKey] = useState(null);
  const [metaData, setMetaData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [smsCopied, setSmsCopied] = useState(false);

  const activeReqRef = useRef(0);

  // useLang() exposes t as a FUNCTION (t("key")); property access t.handoffPlanner
  // was always undefined and silently pinned every dict string below to its
  // English fallback in both locales. Resolve the block from the dictionary
  // with the same en-fallback rule the LanguageContext itself uses.
  const strings = (translations[locale] || translations.en).handoffPlanner || {};

  const loadData = useCallback(
    async (dist, trans, snapshotOnly) => {
      const reqId = ++activeReqRef.current;
      setIsLoading(true);
      setError(null);
      setHandoffData(null);
      setHandoffDataKey(null);
      setMetaData(null);
      setSourceMode(snapshotOnly ? "snapshot-disabled" : "live");

      try {
        const res = await fetchHandoffAnalysis(dist, trans, { forceSnapshot: snapshotOnly });
        if (activeReqRef.current !== reqId) return;

        if (res.success && res.data) {
          setHandoffData(res.data);
          setHandoffDataKey(`${dist}:${trans}:${snapshotOnly ? "snapshot" : "live"}`);
          setMetaData(res.meta);
          setSourceMode(res.sourceMode || (snapshotOnly ? "snapshot" : "live"));
        } else {
          throw new Error(res.error?.message || "Failed to load handoff intelligence");
        }
      } catch (err) {
        if (activeReqRef.current === reqId) {
          setError(err.message || "Failed to retrieve handoff analysis");
          setSourceMode(snapshotOnly ? "snapshot-disabled" : "error");
        }
      } finally {
        if (activeReqRef.current === reqId) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData(selectedDistrict, transition, forceSnapshot);
  }, [selectedDistrict, transition, forceSnapshot, loadData]);

  const handleCopySms = async () => {
    if (!handoffData) return;
    const advisory = generateSmsAdvisory(
      currentDistrictObj,
      handoffData.config,
      handoffData.sowing_opportunity,
      handoffData.period_comparison,
      locale
    );
    try {
      await navigator.clipboard.writeText(advisory);
      setSmsCopied(true);
      setTimeout(() => setSmsCopied(false), 2500);
    } catch {
      /* clipboard fallback */
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Safe data extraction with robust fallbacks
  const currentHandoffKey = `${selectedDistrict}:${transition}:${forceSnapshot ? "snapshot" : "live"}`;
  const hasCurrentHandoff = Boolean(handoffData && handoffDataKey === currentHandoffKey);
  const config = hasCurrentHandoff ? handoffData?.config || {} : {};
  const sowingOpp = hasCurrentHandoff ? handoffData?.sowing_opportunity || {} : {};
  const periodComp = hasCurrentHandoff ? handoffData?.period_comparison || {} : {};
  const yearlySeries = hasCurrentHandoff ? handoffData?.yearly_series || [] : [];
  const visibleSourceMode = hasCurrentHandoff
    ? sourceMode
    : error
      ? sourceMode
      : forceSnapshot
        ? "snapshot-disabled"
        : "loading";

  const workablePct = sowingOpp.workable_window_frequency_pct ?? "—";
  const workableYears = sowingOpp.years_with_workable_window;
  const totalYears = sowingOpp.total_years;
  const sowingWindow = hasCurrentHandoff ? sowingWindowLabel(config, locale) : null;
  const expectedSowingDays = hasCurrentHandoff ? sowingWindowLengthDays(config) : null;
  const minDryDays = hasCurrentHandoff ? config.min_consecutive_dry_days : null;
  const dryMedian = sowingOpp.sowing_dry_days_distribution?.median ?? "—";
  const dryMean = sowingOpp.sowing_dry_days_distribution?.mean?.toFixed(1) ?? "—";
  const lateOctShift = periodComp.metrics?.oct_late_rain?.shift?.delta_pct;
  const lateOctShiftSign = Number.isFinite(lateOctShift)
    ? `${lateOctShift > 0 ? "+" : ""}${lateOctShift}%`
    : "—";
  const lateOctDeltaMean = periodComp.metrics?.oct_late_rain?.shift?.delta_mean;
  const sowingTminMean = sowingOpp.sowing_tmin_distribution?.mean?.toFixed(1) ?? "—";
  const sowingTminMedian = sowingOpp.sowing_tmin_distribution?.median?.toFixed(1) ?? "—";

  return (
    <div className="space-y-6 pb-12 print:space-y-4 print:pb-0">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          {/* flex-wrap: the nowrap status pill otherwise forces horizontal
              page scroll on viewports under ~640 px */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="purple" className="font-semibold tracking-wide uppercase text-[11px]">
              {strings.kicker || "Field Shift Challenge · NASA Space Apps 2026"}
            </Badge>
            <Badge tone={visibleSourceMode === "live" ? "emerald" : "high"}>
              <span
                className={`h-1.5 w-1.5 rounded-full ${visibleSourceMode === "live" ? "bg-emerald" : "bg-amber"}`}
                aria-hidden="true"
              />
              {visibleSourceMode === "live"
                ? locale === "bn" ? "ব্যাকএন্ড ডেটা · স্বাধীন যাচাই বাকি" : "Backend data · independent verification pending"
                : visibleSourceMode === "snapshot-disabled"
                  ? locale === "bn" ? "অযাচাইকৃত স্ন্যাপশট বন্ধ" : "Unverified snapshot disabled"
                  : visibleSourceMode === "error"
                    ? locale === "bn" ? "ব্যাকএন্ড ফলাফল অনুপলব্ধ" : "Backend response unavailable"
                    : locale === "bn" ? "ব্যাকএন্ড অনুরোধ চলছে" : "Backend request pending"}
            </Badge>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-content sm:text-3xl">
            {strings.title || "Handoff Window Intelligence"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {strings.subtitle ||
              "NASA POWER Climate Evidence for Aman Harvest to Rabi Mustard Sowing Transitions"}
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {/* Snapshot toggle */}
          <button
            type="button"
            onClick={() => setForceSnapshot((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              forceSnapshot
                ? "border-amber bg-amber/10 text-amber"
                : "border-line bg-surface text-muted hover:border-emerald/40 hover:text-content"
            }`}
            title={locale === "bn" ? "স্বাধীন যাচাই না হওয়া পর্যন্ত স্ন্যাপশট বন্ধ" : "Snapshot disabled pending independent verification"}
          >
            <Layers className="h-3.5 w-3.5" />
            {forceSnapshot
              ? locale === "bn" ? "অযাচাইকৃত স্ন্যাপশট (বন্ধ)" : "Unverified snapshot (disabled)"
              : locale === "bn" ? "ব্যাকএন্ড অনুরোধ" : "Backend request"}
          </button>

          {/* Print Field Report */}
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
            <Printer className="h-3.5 w-3.5" />
            {strings.printSummary || "Print Report"}
          </Button>

          {/* Refresh */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadData(selectedDistrict, transition, forceSnapshot)}
            disabled={isLoading}
            className="gap-1.5 text-xs"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Filter / Selector Controls */}
      <Card className="p-4 print:hidden">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Crop Transition */}
          <div>
            <label htmlFor="handoff-transition" className="mb-1.5 block text-xs font-medium text-muted">
              {strings.transitionLabel || "Crop Transition"}
            </label>
            <div className="relative">
              <Wheat className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald" aria-hidden="true" />
              <select
                id="handoff-transition"
                value={transition}
                onChange={(e) => setTransition(e.target.value)}
                className="w-full appearance-none rounded-lg border border-line bg-surface pl-9 pr-8 py-2 text-sm text-content transition-colors focus:border-emerald focus:outline-none"
              >
                <option value="aman-mustard">
                  {strings.amanMustard || "T. Aman Rice → Mustard (Rabi Oilseed)"}
                </option>
                <option value="boro-aus">{strings.boroAus || "Boro Rice → Aus Rice"}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" aria-hidden="true" />
            </div>
          </div>

          {/* District Picker */}
          <div>
            <label htmlFor="handoff-district" className="mb-1.5 block text-xs font-medium text-muted">
              {strings.districtLabel || "District"}
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald" aria-hidden="true" />
              <select
                id="handoff-district"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full appearance-none rounded-lg border border-line bg-surface pl-9 pr-8 py-2 text-sm text-content transition-colors focus:border-emerald focus:outline-none"
              >
                {districts && districts.length > 0 ? (
                  districts.map((d) => (
                    <option key={d.code} value={d.code}>
                      {locale === "bn"
                        ? d.nameBn || d.name_bn || d.nameEn || d.name_en
                        : d.nameEn || d.name_en}
                      {d.code === "cumilla" ? " (Field Shift Primary)" : ""}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="cumilla">Cumilla (Field Shift Primary)</option>
                    <option value="chattogram">Chattogram</option>
                  </>
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" aria-hidden="true" />
            </div>
          </div>

          {/* Sowing Window Notice */}
          <div className="flex flex-col justify-center rounded-lg bg-surface-2 p-3 text-xs sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-1.5 font-medium text-content">
              <Calendar className="h-3.5 w-3.5 text-emerald" />
              <span>{sowingWindow || "—"}</span>
              {config.harvest_window_label ? (
                <>
                  <span className="text-muted">·</span>
                  <span className="text-muted">{config.harvest_window_label}</span>
                </>
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] text-muted">
              {locale === "bn"
                ? config.description_bn || strings.transitionDescAmanMustard
                : config.description_en || strings.transitionDescAmanMustard}
            </p>
          </div>
        </div>
      </Card>

      {/* Main Content Area */}
      {isLoading || (!error && !hasCurrentHandoff) ? (
        <LoadingState
          message={locale === "bn" ? "হ্যান্ডঅফ ব্যাকএন্ড ফলাফল লোড হচ্ছে…" : "Loading Handoff backend response…"}
        />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => loadData(selectedDistrict, transition, forceSnapshot)}
        />
      ) : (
        <div className="space-y-6">
          {/* 4 Top KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={CheckCircle2}
              tone="emerald"
              label={strings.kpiWorkableWindow || "Share of historical years"}
              value={`${locNum(workablePct, locale)}%`}
              hint={
                workableYears != null && totalYears != null
                  ? `${locNum(workableYears, locale)}/${locNum(totalYears, locale)} · ${locale === "bn"
                    ? "প্রকল্পের শুষ্ক-দিন সংজ্ঞা পূরণকারী ঐতিহাসিক বছর; ভবিষ্যৎ সম্ভাবনা নয়। (বপন উইন্ডো " + (sowingWindow || "—") + ")"
                    : "historical years met the project dry-day definition; not a future probability or agronomic threshold. (Sowing window " + (sowingWindow || "—") + ")"}`
                  : locale === "bn"
                    ? "প্রকল্পের শুষ্ক-দিন সংজ্ঞা অনুযায়ী; ভবিষ্যৎ সম্ভাবনা বা কৃষি সীমা নয়।"
                    : "Under the project dry-day definition; not a future probability or agronomic threshold."
              }
            />
            <MetricCard
              icon={Calendar}
              tone="climate"
              label={strings.kpiDryDays || "Median Sowing Dry Days"}
              value={locNum(dryMedian, locale)}
              unit={expectedSowingDays
                ? ` / ${locNum(expectedSowingDays, locale)} ${locale === "bn" ? "দিন" : "d"}`
                : ` ${locale === "bn" ? "দিন" : "d"}`}
              hint={`${strings.kpiDryDaysDesc || "Within the sowing window (rain < 1.0 mm/day)"} · ${sowingWindow || "—"}${dryMean !== "—" ? (locale === "bn" ? ` (গড়: ${locNum(dryMean, locale)} দিন)` : ` (Mean: ${dryMean}d)`) : ""}`}
            />
            <MetricCard
              icon={TrendingUp}
              tone="amber"
              label={strings.kpiOctLateRain || "Late Oct Rain Shift"}
              value={locNum(lateOctShiftSign, locale)}
              unit={lateOctDeltaMean !== undefined
                ? (locale === "bn"
                  ? `(+${locNum(lateOctDeltaMean.toFixed(1), locale)} মিমি)`
                  : `(+${lateOctDeltaMean.toFixed(1)} mm)`)
                : ""}
              hint={strings.kpiOctLateRainDesc || "Mean Oct 16–31 rainfall shift (P1 vs P2)"}
            />
            <MetricCard
              icon={Thermometer}
              tone="climate"
              label={strings.kpiSowingTmin || "Germination Min Temp"}
              value={`${locNum(sowingTminMean, locale)}`}
              unit="°C"
              hint={`${strings.kpiSowingTminDesc || "Nighttime minimum temp"} (${locale === "bn" ? "মধ্যমা" : "Median"}: ${locNum(sowingTminMedian, locale)}°C)`}
            />
          </div>

          {/* Sowing Opportunity Climatology Chart */}
          <Card className="p-5">
            <CardHeader className="flex flex-col gap-2 pb-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold text-content">
                  {strings.historicalAnalysisTitle ||
                    "Historical Sowing Window Analysis"}
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  {strings.historicalAnalysisDesc ||
                    "Year-by-year distribution of dry days, total rainfall, and longest consecutive dry run within the sowing window."}
                </p>
              </div>
            </CardHeader>

            <CardBody className="pt-2">
              <HandoffSowingChart
                data={yearlySeries}
                minConsecutiveDryDays={minDryDays}
                expectedDays={expectedSowingDays}
                fmt={(v) => (locale === "bn" ? toBnDigits(v) : String(v))}
                labels={{
                  dryDays: `${strings.chartDryDaysLabel || "Dry Days"} (${sowingWindow || "—"})`,
                  dryRun: strings.chartDryRunLabel || "Max Consecutive Dry Run (days)",
                  threshold: minDryDays
                    ? (locale === "bn"
                      ? `কার্যক্ষম প্রক্সি (≥${toBnDigits(minDryDays)} দিন)`
                      : `Operational proxy (≥${minDryDays}d)`)
                    : null,
                  rain: strings.chartRainLabel || "Rainfall (mm)",
                  daysUnit: locale === "bn" ? "দিন" : "d",
                  tooltipDays: locale === "bn" ? "দিন" : "days",
                  tooltipConsecutive: locale === "bn" ? "টানা শুষ্ক দিন" : "consecutive days",
                  tooltipSeasonYear: locale === "bn" ? "মৌসুমের বছর:" : "Season Year:",
                }}
              />
            </CardBody>
          </Card>

          {/* Climate Period Shift Comparison Section (2001–2012 vs 2013–2025) */}
          <Card className="p-5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-climate/12 text-climate">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-content">
                    {strings.periodShiftTitle || "Climate Period Shift Comparison"}
                  </h2>
                  <p className="text-xs text-muted">
                    {strings.periodShiftDesc ||
                      "Comparing early baseline (2001–2012, 12 years) against recent climate (2013–2025, 13 years) using nonparametric Mann-Whitney U and Welch's t-test."}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardBody className="pt-2">
              <div className="overflow-x-auto">
                <Table>
                  <THead
                    columns={[
                      strings.colMetric || "Climate Metric",
                      // Backend labels (period1_label) are English-only; in Bangla
                      // prefer the localized header, falling back to the backend.
                      (locale === "bn" ? (strings.colPeriod1 || periodComp.period1_label) : (periodComp.period1_label || strings.colPeriod1)) || "Period 1 (2001–2012)",
                      (locale === "bn" ? (strings.colPeriod2 || periodComp.period2_label) : (periodComp.period2_label || strings.colPeriod2)) || "Period 2 (2013–2025)",
                      strings.colDelta || "Shift (Δ)",
                      strings.colTestStats || "Statistical Tests (U / t)",
                      strings.colEvidence || "Evidence Status",
                    ]}
                  />
                  <TBody>
                    {periodComp.metrics ? (
                      Object.entries(periodComp.metrics).map(([key, item]) => {
                        const mwu = item.statistical_tests?.mann_whitney_u;
                        const welch = item.statistical_tests?.welch_t;
                        const shift = item.shift || {};
                        const isSig = mwu?.is_significant;

                        return (
                          <TR key={key}>
                            <TD className="font-medium text-content">
                              {strings[METRIC_STRING_KEYS[key]] || item.metric}
                              <span className="ml-1 text-xs text-muted">({item.unit})</span>
                            </TD>
                            <TD className="text-right text-sm">
                              {item.period1?.mean?.toFixed(2)}
                              <span className="block text-[11px] text-muted">
                                med: {item.period1?.median?.toFixed(1)}
                              </span>
                            </TD>
                            <TD className="text-right text-sm">
                              {item.period2?.mean?.toFixed(2)}
                              <span className="block text-[11px] text-muted">
                                med: {item.period2?.median?.toFixed(1)}
                              </span>
                            </TD>
                            <TD className="text-right font-medium text-sm">
                              <span
                                className={
                                  shift.delta_mean > 0
                                    ? "text-amber-strong"
                                    : shift.delta_mean < 0
                                    ? "text-climate-text"
                                    : "text-muted"
                                }
                              >
                                {shift.delta_mean > 0 ? `+${shift.delta_mean.toFixed(2)}` : shift.delta_mean?.toFixed(2)}
                              </span>
                              <span className="block text-[11px] text-muted">
                                {shift.delta_pct > 0 ? `+${shift.delta_pct.toFixed(1)}%` : `${shift.delta_pct?.toFixed(1)}%`}
                              </span>
                            </TD>
                            <TD className="text-center text-xs">
                              <div className="font-mono text-[11px]">
                                U={mwu?.u ?? "—"}, p={mwu?.p_value?.toFixed(3) ?? "—"}
                              </div>
                              <div className="text-[10px] text-muted">
                                t={welch?.t?.toFixed(2) ?? "—"} (p={String(welch?.p_value ?? welch?.p_approx ?? "—")})
                              </div>
                            </TD>
                            <TD className="text-right">
                              <Badge tone={isSig ? "high" : "low"}>
                                {isSig
                                  ? strings.statSignificant || "Significant (p < 0.05)"
                                  : strings.statWithinVariability || "Within variability (p ≥ 0.05)"}
                              </Badge>
                            </TD>
                          </TR>
                        );
                      })
                    ) : (
                      <TR>
                        <TD colSpan={6} className="text-center text-muted">
                          No period comparison records
                        </TD>
                      </TR>
                    )}
                  </TBody>
                </Table>
              </div>

              {/* Explanatory callout for Late-October Rainfall Shift */}
              <div className="mt-4 rounded-lg border border-amber/30 bg-amber/5 p-4 text-xs text-content">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-strong">
                      {locale === "bn"
                        ? "ঐতিহাসিক তুলনা · বৈজ্ঞানিক পর্যালোচনা বাকি"
                        : "Historical comparison · scientific review pending"}
                    </p>
                    <p className="text-muted leading-relaxed">
                      {locale === "bn"
                        ? "এই তুলনাটি বর্ণনামূলক এবং এর ডেটা ও পরিসংখ্যানগত ব্যাখ্যা স্বাধীনভাবে যাচাই করা হয়নি। এটি মাঠের অবস্থা, ভবিষ্যৎ আবহাওয়া বা বপনের সময় সম্পর্কে পরামর্শ নয়।"
                        : "This comparison is descriptive; its data and statistical interpretation have not been independently verified. It does not establish field conditions, future weather, or sowing advice."}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* DAE Agricultural Extension Advisory Card & Bangla SMS Preview */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Advisory / SMS Card */}
            <Card className="p-5">
              <CardHeader className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-forest/12 text-forest dark:bg-emerald/15 dark:text-emerald">
                    <Wheat className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-content">
                      {strings.advisoryTitle || "DAE Agricultural Extension Advisory Card"}
                    </h2>
                    <p className="text-xs text-muted">
                      {strings.advisorySubtitle ||
                        "Plain-text field advisory generated for agricultural officers and SMS broadcasts."}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySms}
                  className="gap-1.5 text-xs print:hidden"
                >
                  {smsCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald" />
                      <span className="text-emerald-text">{strings.smsCopied || "Copied!"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>{strings.copySms || "Copy SMS"}</span>
                    </>
                  )}
                </Button>
              </CardHeader>

              <CardBody className="pt-2">
                <div className="rounded-lg border border-line bg-surface-2 p-4 font-mono text-xs leading-relaxed text-content">
                  <pre className="whitespace-pre-wrap font-sans">
                    {generateSmsAdvisory(
                      currentDistrictObj,
                      config,
                      sowingOpp,
                      periodComp,
                      locale
                    )}
                  </pre>
                </div>
                <p className="mt-2 text-[11px] text-muted">
                  {strings.smsNotice ||
                    "Formatted for mobile SMS and field bulletin distribution (160 characters / unicode compatible)."}
                </p>
              </CardBody>
            </Card>

            {/* Scientific Disclosures & Limitations Box */}
            <Card className="p-5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2 text-muted">
                    <Info className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-content">
                      {strings.disclosuresTitle || "Scientific Methodology & Limitations"}
                    </h2>
                    <p className="text-xs text-muted">
                      NASA POWER Daily Agroclimatology (2001–2025)
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardBody className="space-y-3 pt-2 text-xs text-muted">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                  <p>
                    {strings.disclosureProxy ||
                      "Operational Proxy: Five consecutive dry days (< 1.0 mm/day) is a project-selected operational proxy for tillage workability; not an official agronomic threshold or field readiness guarantee."}
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                  <p>
                    <strong className="text-content">{locale === "bn" ? "প্রকল্প-নির্বাচিত বৃষ্টির দিন সংজ্ঞা:" : "Project-selected wet-day definition:"}</strong>{" "}
                    {locale === "bn"
                      ? "বৈধ দৈনিক বৃষ্টিপাত ≥ ১.০ মিমি হলে ভেজা দিন হিসেবে গণনা করা হয়। এটি এই প্রকল্পের বর্ণনামূলক নিয়ম, কৃষিতাত্ত্বিক সীমা নয়।"
                      : "A valid daily rainfall observation ≥ 1.0 mm is counted as a wet day. This is a descriptive project convention, not an agronomic threshold."}
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                  <p>
                    {strings.disclosureLst ||
                      "Time Standard: NASA POWER observations are indexed to Local Solar Time (LST), representing solar-day boundaries rather than UTC+6."}
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber" />
                  <p>
                    <strong className="text-content">{locale === "bn" ? "ডেটা যাচাই:" : "Data verification:"}</strong>{" "}
                    {locale === "bn"
                      ? "পর্যবেক্ষণ সংখ্যা ও সম্পূর্ণতার স্বাধীন যাচাই বাকি; যাচাই না হওয়া পর্যন্ত এগুলোকে নিশ্চিত ডেটা হিসেবে বিবেচনা করবেন না।"
                      : "Observation counts and completeness are pending independent verification; do not treat them as confirmed until reviewed."}
                  </p>
                </div>

                <div className="flex items-start gap-2 border-t border-line pt-2 text-amber-strong">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber" />
                  <p>
                    {strings.disclosureDisclaimer ||
                      "Non-Predictive Notice: Descriptive historical climatology only. Does not guarantee future weather outcomes, sowing dates, soil pathogen dynamics, or crop yields."}
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* 25-Year Climatology Observation Log */}
          <Card className="p-5">
            <CardHeader className="flex flex-col gap-1 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-content">
                  {strings.yearlyTableTitle || "Complete 25-Year Climatology Observations"}
                </h2>
                <p className="text-xs text-muted">
                  {strings.yearlyTableDesc ||
                    "NASA POWER Daily Agroclimatology records for Cumilla (2001–2025). All days use Local Solar Time (LST)."}
                </p>
              </div>
              <Badge tone="neutral" className="w-fit text-[11px]">
                {yearlySeries.length} {locale === "bn" ? "বছর" : "Years"}
              </Badge>
            </CardHeader>

            <CardBody className="pt-2">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <THead
                    columns={[
                      strings.colYear || "Year",
                      `${strings.colSowingDry || "Dry Days (sowing window)"}${sowingWindow ? ` (${sowingWindow})` : ""}`,
                      `${strings.colSowingRain || "Sowing-window Rain (mm)"}${sowingWindow ? ` (${sowingWindow})` : ""}`,
                      strings.colDryRun || "Max Dry Run (days)",
                      strings.colLateOctRain || "Late Oct Rain (mm)",
                      strings.colNovRain || "Nov Rain (mm)",
                      strings.colMinTmin || "Min Tmin (°C)",
                    ]}
                  />
                  <TBody>
                    {yearlySeries.map((row) => (
                      <TR key={row.year}>
                        <TD className="font-medium text-content">{locNum(row.year, locale)}</TD>
                        <TD className="text-right text-sm">
                          {locNum(row.dry_days_sowing, locale)}
                          {expectedSowingDays ? (
                            <span className="text-[11px] text-muted"> / {locNum(expectedSowingDays, locale)}</span>
                          ) : null}
                        </TD>
                        <TD className="text-right text-sm">
                          {locNum(formatFixed(row.total_sowing_rain, 1), locale)}
                          <PeriodTotalSub row={row} periodKey="sowing_window" locale={locale} />
                        </TD>
                        <TD className="text-right text-sm">
                          <span className={
                            minDryDays != null && row.max_dry_run >= minDryDays
                              ? "font-semibold text-emerald-text"
                              : "text-amber-strong"
                          }>
                            {locNum(row.max_dry_run, locale)}{locale === "bn" ? " দিন" : "d"}
                          </span>
                        </TD>
                        <TD className="text-right text-sm">
                          {locNum(formatFixed(row.oct_late_rain, 1), locale)}
                          <PeriodTotalSub row={row} periodKey="late_october_oct16_31" locale={locale} />
                        </TD>
                        <TD className="text-right text-sm">
                          {locNum(formatFixed(row.nov_total_rain, 1), locale)}
                          <PeriodTotalSub row={row} periodKey="november" locale={locale} />
                        </TD>
                        <TD className="text-right text-sm">{locNum(formatFixed(row.min_tmin_sowing, 1), locale)}°</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
