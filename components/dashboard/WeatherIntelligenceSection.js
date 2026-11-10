"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CloudSun,
  CloudRain,
  Sun,
  Cloud,
  CloudLightning,
  CloudFog,
  CloudDrizzle,
  Droplets,
  Wind,
  Thermometer,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Info,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge.js";
import { Card, CardBody, CardHeader } from "@/components/ui/Card.js";
import { Tooltip } from "@/components/ui/Tooltip.js";
import { fetchCropWeatherPlanning } from "@/services/api.js";

// Helper to choose appropriate Lucide icon for WMO weather codes
function getWeatherIcon(iconName, className = "h-5 w-5") {
  switch (iconName) {
    case "Sun":
      return <Sun className={`${className} text-amber-500`} aria-hidden="true" />;
    case "CloudSun":
      return <CloudSun className={`${className} text-emerald`} aria-hidden="true" />;
    case "CloudRain":
      return <CloudRain className={`${className} text-sky-500`} aria-hidden="true" />;
    case "CloudLightning":
      return <CloudLightning className={`${className} text-purple-500`} aria-hidden="true" />;
    case "CloudFog":
      return <CloudFog className={`${className} text-slate-400`} aria-hidden="true" />;
    case "CloudDrizzle":
      return <CloudDrizzle className={`${className} text-sky-400`} aria-hidden="true" />;
    case "Cloud":
    default:
      return <Cloud className={`${className} text-slate-400`} aria-hidden="true" />;
  }
}

// Format date into readable day and month
function formatForecastDate(dateStr, locale = "en") {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const dayName = d.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", { weekday: "short" });
    const dayMonth = d.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", { day: "numeric", month: "short" });
    return { dayName, dayMonth };
  } catch {
    return { dayName: "", dayMonth: dateStr };
  }
}

function formatMetric(value, locale = "en", maximumFractionDigits = 1) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits }).format(value);
}

export default function WeatherIntelligenceSection({ locationCode = "chattogram", locale = "en", farmId = null, crop = null }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("shortRange"); // "shortRange", "extended", "subSeasonal", "seasonal"

  const loadWeatherData = useCallback(() => {
    setLoading(true);
    setError(null);

    fetchCropWeatherPlanning({
      location: locationCode,
      farmId,
      crop,
    })
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.message || "Failed to load weather intelligence");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Network error loading weather intelligence");
        setLoading(false);
      });
  }, [locationCode, farmId, crop]);

  useEffect(() => {
    let isCancelled = false;
    Promise.resolve().then(() => {
      if (!isCancelled) {
        loadWeatherData();
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [loadWeatherData]);

  if (loading) {
    return (
      <section className="mt-8 rounded-2xl border border-line bg-surface p-6 shadow-km-sm">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="h-10 w-10 rounded-xl bg-forest/10 dark:bg-emerald/20" />
          <div className="space-y-2">
            <div className="h-4 w-48 rounded bg-forest/10 dark:bg-emerald/20" />
            <div className="h-3 w-72 rounded bg-forest/10 dark:bg-emerald/20" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-forest/5 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  // Graceful inline error & unavailable state — preserves dedicated dashboard section visibility
  if (error || !data) {
    const locDisplay = locale === "bn" ? (locationCode === "cumilla" ? "কুমিল্লা" : "চট্টগ্রাম") : locationCode;
    return (
      <section aria-labelledby="weather-intel-heading" className="mt-8 rounded-2xl border border-line bg-surface p-6 shadow-km-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest/8 text-forest dark:bg-emerald/15 dark:text-emerald">
              <CloudSun className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald dark:text-emerald-400">
                  {locale === "bn" ? "সংখ্যাতাত্ত্বিক পূর্বাভাস ও প্রারম্ভিক সতর্কতা" : "NUMERICAL FORECAST & EARLY WARNING"}
                </span>
                <span className="inline-flex items-center rounded-md border border-line bg-surface-alt px-1.5 py-0.5 text-[10px] font-medium text-muted">
                  Asia/Dhaka (GMT+6)
                </span>
              </div>
              <h2 id="weather-intel-heading" className="mt-1 text-lg font-bold tracking-tight text-content sm:text-xl">
                {locale === "bn" ? "কৃষি আবহাওয়া বুদ্ধিমত্তা ও ফসল দৃষ্টিভঙ্গি" : "Agricultural Weather Intelligence & Crop Outlook"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={loadWeatherData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface-alt hover:bg-surface px-3 py-1.5 text-xs font-semibold text-content transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-emerald" />
            <span>{locale === "bn" ? "পুনরায় চেষ্টা করুন" : "Retry"}</span>
          </button>
        </div>

        {/* Unavailable Notice */}
        <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-content">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-content">
                {locale === "bn"
                  ? `${locDisplay}-এর জন্য আবহাওয়া উপাত্ত সাময়িকভাবে অনুপলব্ধ`
                  : `Weather Intelligence Temporarily Unavailable for ${locDisplay}`}
              </h3>
              <p className="text-xs text-muted">
                {error || (locale === "bn" ? "পূর্বাভাস সেবাদাতা প্রোভাইডারের সংযোগে সাময়িক সমস্যা হয়েছে।" : "Unable to establish connection with upstream meteorological providers.")}
              </p>
              <p className="text-[11px] text-content-muted mt-2 pt-2 border-t border-line/40">
                {locale === "bn"
                  ? "বৈজ্ঞানিক সুরক্ষা নীতি: উপাত্ত অনুপস্থিত থাকলে অনুমাননির্ভর বা কাল্পনিক আবহাওয়া না দেখিয়ে ঝুঁকি মূল্যায়ন নিরপেক্ষভাবে স্থগিত রাখা হয়।"
                  : "Scientific policy: Krishi Mama withholds automated agricultural risk evaluations when real-time forecast data cannot be validated, rather than substituting fabricated or stale predictions."}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const { location, shortRangeSummary, risks, operationalGuidance, subSeasonalOutlookSummary, seasonalOutlookSummary, provenance } = data;
  const currentCondition = shortRangeSummary?.currentCondition;
  const alerts = risks?.alerts || [];
  const overallRisk = risks?.overallRiskLevel || "DATA_INSUFFICIENT";
  const locName = locale === "bn" ? location?.nameBn || location?.nameEn : location?.nameEn;

  return (
    <section aria-labelledby="weather-intel-heading" className="mt-8 rounded-2xl border border-line bg-surface p-6 shadow-km-sm transition-all">
      {/* Header with Title and Location Badge */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest/8 text-forest dark:bg-emerald/15 dark:text-emerald">
            <CloudSun className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald dark:text-emerald-400">
                {locale === "bn" ? "সংখ্যাতাত্ত্বিক পূর্বাভাস ও প্রারম্ভিক সতর্কতা" : "NUMERICAL FORECAST & EARLY WARNING"}
              </span>
              <span className="inline-flex items-center rounded-md border border-line bg-surface-alt px-1.5 py-0.5 text-[10px] font-medium text-muted">
                Asia/Dhaka (GMT+6)
              </span>
            </div>
            <h2 id="weather-intel-heading" className="mt-1 text-lg font-bold tracking-tight text-content sm:text-xl">
              {locale === "bn" ? "কৃষি আবহাওয়া বুদ্ধিমত্তা ও ফসল দৃষ্টিভঙ্গি" : "Agricultural Weather Intelligence & Crop Outlook"}
            </h2>
            <p className="mt-1 text-xs text-muted max-w-2xl">
              {locale === "bn"
                ? `${locName}-এর জন্য উচ্চ-রেজোলিউশন ৭ দিনের পূর্বাভাস, ১৬ দিনের বর্ধিত দৃষ্টিভঙ্গি, উপ-মৌসুমি প্রবণতা এবং যাচাইকৃত সরকারি সতর্কতা।`
                : `High-resolution 7-day forecast, 16-day extended outlook, sub-seasonal trends, and verified government warnings for ${locName}.`}
            </p>
          </div>
        </div>

        {/* Current Weather Pill */}
        {currentCondition && (
          <div className="flex shrink-0 items-center gap-3 rounded-xl border border-line bg-surface-alt px-4 py-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              {getWeatherIcon(currentCondition.conditionEn?.includes("Rain") ? "CloudRain" : "Sun", "h-6 w-6")}
              <div>
                <div className="text-xs font-semibold text-content">
                  {locale === "bn" ? currentCondition.conditionBn || currentCondition.conditionEn : currentCondition.conditionEn}
                </div>
                <div className="text-[11px] text-muted">
                  {locale === "bn" ? `আজ সর্বোচ্চ ${formatMetric(currentCondition.temperatureMaxC, locale)}°সে · বৃষ্টি ${formatMetric(currentCondition.todayRainExpectedMm, locale)} মিমি` : `Max ${formatMetric(currentCondition.temperatureMaxC, locale)}°C · Rain ${formatMetric(currentCondition.todayRainExpectedMm, locale)} mm`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 1. Agricultural Weather Risk Alerts Banner */}
      {alerts.length > 0 ? (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
              <h3 className="text-sm font-bold text-content">
                {locale === "bn" ? `সক্রিয় কৃষি আবহাওয়া সতর্কতা (${alerts.length}টি)` : `Active Agricultural Weather Alerts (${alerts.length})`}
              </h3>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                overallRisk === "SEVERE"
                  ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30"
                  : overallRisk === "HIGH" || overallRisk === "MODERATE"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  : overallRisk === "LOW"
                    ? "bg-emerald/10 text-emerald dark:text-emerald-400 border border-emerald/30"
                    : "bg-surface-alt text-muted border border-line"
              }`}
            >
              {overallRisk} RISK
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-xl border p-3.5 transition-all ${
                  alert.isGovernmentNotice
                    ? "border-emerald/40 bg-emerald/5 dark:bg-emerald/10"
                    : alert.severity === "SEVERE"
                    ? "border-red-500/30 bg-red-500/5 dark:bg-red-500/10"
                    : alert.severity === "HIGH"
                    ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10"
                    : "border-line bg-surface-alt"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {alert.isGovernmentNotice ? (
                      <ShieldAlert className="h-4 w-4 text-emerald shrink-0" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" aria-hidden="true" />
                    )}
                    <span className="text-xs font-bold text-content line-clamp-1">
                      {locale === "bn" ? alert.titleBn : alert.titleEn}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                      alert.isGovernmentNotice
                        ? "bg-emerald/15 text-emerald-800 dark:text-emerald-300 border-emerald/30"
                        : "bg-surface-alt text-muted border-line"
                    }`}>
                      {alert.isGovernmentNotice
                        ? (locale === "bn" ? `সরকারি · ${alert.issuingAuthority || "যাচাইকৃত"}` : `Official · ${alert.issuingAuthority || "Verified"}`)
                        : (locale === "bn" ? "কৃষি ঝুঁকি" : "Forecast Risk")}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted px-1.5 py-0.5 rounded bg-surface border border-line">
                      {alert.metric || alert.severity}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted line-clamp-2">
                  {locale === "bn" ? alert.descriptionBn : alert.descriptionEn}
                </p>
                <div className="mt-2.5 rounded-lg bg-surface p-2 text-xs font-medium text-content border border-line/60">
                  <span className="font-bold text-emerald dark:text-emerald-400">
                    {locale === "bn" ? "করণীয়: " : "Action: "}
                  </span>
                  {locale === "bn" ? alert.actionAdviceBn : alert.actionAdviceEn}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : overallRisk === "DATA_INSUFFICIENT" ? (
        <div className="mt-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-content">
          <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <span>
            {locale === "bn"
              ? "পর্যাপ্ত পূর্বাভাস উপাত্ত নেই; আবহাওয়া ঝুঁকি বা নিরাপদ কাজের অবস্থা নির্ধারণ করা যাচ্ছে না।"
              : "Forecast data is insufficient; weather risk and safe operating conditions cannot be assessed."}
          </span>
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald/20 bg-emerald/5 p-3 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald" aria-hidden="true" />
          <span>
            {locale === "bn"
              ? "বর্তমানে কোনো মারাত্মক আবহাওয়া ঝুঁকি বা সরকারি সতর্কতা নেই। স্বাভাবিক কৃষি কার্যক্রম পরিচালনা করুন।"
              : "No extreme weather hazards or official warnings currently detected for this location. Standard operations favorable."}
          </span>
        </div>
      )}

      {/* 2. Forecast View Navigation Tabs */}
      <div className="mt-6 border-b border-line">
        <nav className="flex gap-4 overflow-x-auto" aria-label="Forecast Range">
          <button
            type="button"
            onClick={() => setActiveTab("shortRange")}
            className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "shortRange"
                ? "border-emerald text-emerald dark:text-emerald-400"
                : "border-transparent text-muted hover:text-content"
            }`}
          >
            {locale === "bn" ? "৭ দিনের পূর্বাভাস" : "7-Day Forecast"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("extended")}
            className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "extended"
                ? "border-emerald text-emerald dark:text-emerald-400"
                : "border-transparent text-muted hover:text-content"
            }`}
          >
            {locale === "bn" ? "১৬ দিনের বর্ধিত দৃষ্টিভঙ্গি" : "16-Day Extended Outlook"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("subSeasonal")}
            className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "subSeasonal"
                ? "border-emerald text-emerald dark:text-emerald-400"
                : "border-transparent text-muted hover:text-content"
            }`}
          >
            {locale === "bn" ? "১–৬ সপ্তাহ উপ-মৌসুমি" : "Weeks 1–6 Sub-Seasonal"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("seasonal")}
            className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "seasonal"
                ? "border-emerald text-emerald dark:text-emerald-400"
                : "border-transparent text-muted hover:text-content"
            }`}
          >
            {locale === "bn" ? "১–৩ মাস মৌসুমি" : "Months 1–3 Seasonal"}
          </button>
        </nav>
      </div>

      {/* Tab 1: 7-Day Short-Range Forecast Cards */}
      {activeTab === "shortRange" && (
        <div className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {(data.shortRangeForecast || []).map((day, idx) => {
              const { dayName, dayMonth } = formatForecastDate(day.date, locale);
              const isToday = idx === 0;

              return (
                <div
                  key={day.date}
                  className={`rounded-xl border p-3 flex flex-col justify-between transition-all ${
                    isToday
                      ? "border-emerald/40 bg-emerald/5 dark:bg-emerald/10 shadow-sm"
                      : "border-line bg-surface hover:border-emerald/30"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold ${isToday ? "text-emerald dark:text-emerald-400" : "text-muted"}`}>
                        {isToday ? (locale === "bn" ? "আজ" : "Today") : dayName}
                      </span>
                      <span className="text-[10px] text-muted">{dayMonth}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-center py-1">
                      {getWeatherIcon(day.icon, "h-7 w-7")}
                    </div>

                    <div className="mt-2 text-center">
                      <div className="text-xs font-semibold text-content line-clamp-1">
                        {locale === "bn" ? day.conditionBn : day.conditionEn}
                      </div>
                      <div className="mt-1 text-sm font-bold text-content">
                        {formatMetric(day.temperatureMaxC, locale)}° <span className="text-xs font-normal text-muted">/ {formatMetric(day.temperatureMinC, locale)}°</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-line/60 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-muted">
                      <span className="flex items-center gap-1">
                        <Droplets className="h-3 w-3 text-sky-500" aria-hidden="true" />
                        {formatMetric(day.precipitationSumMm, locale)} mm
                      </span>
                      <span className="font-medium text-sky-600 dark:text-sky-400">
                        {formatMetric(day.precipitationProbabilityMax, locale, 0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted">
                      <span className="flex items-center gap-1">
                        <Wind className="h-3 w-3 text-slate-400" aria-hidden="true" />
                        {formatMetric(day.windSpeedMaxKmH, locale)} km/h
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: 16-Day Extended Outlook */}
      {activeTab === "extended" && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-300">
            <Info className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
            <span>
              {locale === "bn"
                ? "৮–১৬ দিনের পূর্বাভাস বর্ধিত দৃষ্টিভঙ্গি নির্দেশ করে এবং এতে সংখ্যাভিত্তিক মডেলের স্বাভাবিক অনিশ্চয়তা রয়েছে। মাঠের সূচি প্রস্তুতির বদলে দূরবর্তী আবহাওয়া প্রবণতা বোঝার জন্য ব্যবহার করুন।"
                : "Days 8–16 represent an extended numerical outlook with elevated uncertainty. Suitable for advance operational awareness rather than precision scheduling."}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5">
            {(data.extendedForecast || []).map((day) => {
              const { dayName, dayMonth } = formatForecastDate(day.date, locale);

              return (
                <div key={day.date} className="rounded-xl border border-line bg-surface p-2.5 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-muted">{dayMonth}</div>
                    <div className="my-2 flex justify-center">{getWeatherIcon(day.icon, "h-6 w-6")}</div>
                    <div className="text-center font-bold text-xs text-content">
                      {formatMetric(day.temperatureMaxC, locale)}° <span className="text-[10px] font-normal text-muted">/ {formatMetric(day.temperatureMinC, locale)}°</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-line/60 flex items-center justify-between text-[10px] text-muted">
                    <span>{formatMetric(day.precipitationSumMm, locale)} mm</span>
                    <span className="text-sky-600 dark:text-sky-400">{formatMetric(day.precipitationProbabilityMax, locale, 0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Sub-Seasonal Weeks 1-6 */}
      {activeTab === "subSeasonal" && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-line/80 bg-surface-alt p-3 text-xs text-muted">
            <Info className="h-4 w-4 shrink-0 text-emerald" aria-hidden="true" />
            <span>
              {locale === "bn"
                ? "Open-Meteo ECMWF Seasonal Seamless (EC46 + SEAS5) মডেল নির্বাচন থেকে ১–৬ সপ্তাহের আঞ্চলিক প্রবণতা। এটি নির্দিষ্ট খামারের দৈনিক পূর্বাভাস নয়।"
                : "Weeks 1–6 regional tendencies use Open-Meteo's ECMWF Seasonal Seamless selection (EC46 + SEAS5); they are not local farm-level daily forecasts."}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(subSeasonalOutlookSummary || []).map((w) => (
              <div key={w.weekNumber} className="rounded-xl border border-line bg-surface p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald dark:text-emerald-400">
                      {locale === "bn" ? `সপ্তাহ ${w.weekNumber}` : `Week ${w.weekNumber}`}
                    </span>
                    <span className="text-[10px] font-medium text-muted">
                      {w.startDate && w.endDate ? `${w.startDate} — ${w.endDate}` : (locale === "bn" ? "অপ্রাপ্য" : "Unavailable")}
                    </span>
                  </div>
                  {w.isAvailable === false ? (
                    <div className="mt-3">
                      <div className="text-xs font-semibold text-muted">
                        {locale === "bn" ? "উপাত্ত অপ্রাপ্য" : "Data Unavailable"}
                      </div>
                      <p className="mt-1 text-[11px] text-muted">
                        {locale === "bn"
                          ? "এই মেয়াদের জন্য নির্ভরযোগ্য উপ-মৌসুমি দৃষ্টিভঙ্গি পাওয়া যায়নি।"
                          : "Reliable sub-seasonal data is unavailable for this forecast horizon."}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <div className="text-xs font-semibold text-content">
                        {locale === "bn" ? w.rainTendencyBn : w.rainTendencyEn}
                      </div>
                      <div className="mt-2 text-xs text-muted flex items-center justify-between">
                        <span>{locale === "bn" ? "প্রত্যাশিত বৃষ্টিপাত:" : "Expected Rain:"}</span>
                        <span className="font-bold text-content">{w.expectedRainfallMeanMm} mm</span>
                      </div>
                      <div className="mt-1 text-xs text-muted flex items-center justify-between">
                        <span>{locale === "bn" ? "গড় তাপমাত্রা:" : "Mean Temp:"}</span>
                        <span className="font-bold text-content">{w.expectedTempMeanC} °C</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-2 border-t border-line/60 text-[10px] text-muted flex items-center justify-between">
                  <span>{locale === "bn" ? "পূর্বাভাস দিগন্ত:" : "Forecast Horizon:"}</span>
                  <span className="font-medium text-emerald dark:text-emerald-400">
                    {locale === "bn" ? w.horizonDescriptionBn || `সপ্তাহ ${w.weekNumber}` : w.horizonDescriptionEn || `Week ${w.weekNumber}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Seasonal Months 1-3 */}
      {activeTab === "seasonal" && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-line/80 bg-surface-alt p-3 text-xs text-muted">
            <Info className="h-4 w-4 shrink-0 text-emerald" aria-hidden="true" />
            <span>
              {locale === "bn"
                ? "প্রায় ৩০ দিনের ব্লকে আঞ্চলিক মডেল সিরিজের সারাংশ। এই দৈনিক API উত্তরে ক্যালিব্রেটেড বৃষ্টির সম্ভাব্যতা নেই; খামারের নির্দিষ্ট পূর্বাভাস হিসেবে ব্যবহার করবেন না।"
                : "Regional model summaries are grouped into ~30-day blocks. The requested daily response does not provide calibrated rainfall probabilities; this is not a farm-level forecast."}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {(seasonalOutlookSummary || []).map((m) => (
              <div key={m.monthIndex} className="rounded-xl border border-line bg-surface p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-content truncate">
                      {locale === "bn" ? m.windowLabelBn || m.monthNameBn : m.windowLabelEn || m.monthNameEn}
                    </h4>
                    <span className="text-[10px] font-bold text-emerald dark:text-emerald-400 shrink-0">
                      {locale === "bn" ? m.rainfallThresholdStatusBn : m.rainfallThresholdStatusEn}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-muted">
                      <span>{locale === "bn" ? (m.seriesType === "ENSEMBLE_MEMBERS" ? "পাওয়া সদস্য সিরিজের গড় বৃষ্টি:" : "মডেল সিরিজের গড় বৃষ্টি:") : (m.seriesType === "ENSEMBLE_MEMBERS" ? "Mean across returned member series:" : "Model-series mean rainfall:")}</span>
                      <span className="font-semibold text-content">{m.rainfallMeanMm != null ? `${m.rainfallMeanMm} mm` : (locale === "bn" ? "অপ্রাপ্য" : "Unavailable")}</span>
                    </div>
                    {m.rainfallMedianMm !== undefined && m.rainfallMedianMm !== null && (
                      <div className="flex justify-between text-muted">
                        <span>{locale === "bn" ? "পাওয়া সিরিজের মধ্যক বৃষ্টি:" : "Median across returned series:"}</span>
                        <span className="font-semibold text-content">{m.rainfallMedianMm} mm</span>
                      </div>
                    )}
                    {m.rainfallRangeMm && m.rainfallRangeMm.min != null && (
                      <div className="flex justify-between text-muted">
                        <span>{locale === "bn" ? "পাওয়া বৃষ্টি মানের সীমা (সর্বনিম্ন–সর্বোচ্চ):" : "Range across returned rainfall values:"}</span>
                        <span className="font-semibold text-content">{m.rainfallRangeMm.min} – {m.rainfallRangeMm.max} mm</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted">
                      <span>{locale === "bn" ? "মডেল সিরিজের গড় তাপমাত্রা:" : "Model-series mean temperature:"}</span>
                      <span className="font-semibold text-content">{m.temperatureMeanC != null ? `${m.temperatureMeanC} °C` : (locale === "bn" ? "অপ্রাপ্য" : "Unavailable")}</span>
                    </div>
                    {m.temperatureRangeC && m.temperatureRangeC.min != null && (
                      <div className="flex justify-between text-muted">
                        <span>{locale === "bn" ? "পাওয়া তাপমাত্রা মানের সীমা (সর্বনিম্ন–সর্বোচ্চ):" : "Range across returned temperature values:"}</span>
                        <span className="font-semibold text-content">{m.temperatureRangeC.min} – {m.temperatureRangeC.max} °C</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-line/60 text-[10px] text-muted">
                  <div className="flex items-center justify-between">
                    <span>{locale === "bn" ? "স্থানিক স্কেল:" : "Spatial Scale:"}</span>
                    <span className="font-medium text-content">~36 km Regional Grid</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span>
                      {locale === "bn" ? "এই সময়ের ব্যবহারযোগ্য সিরিজ:" : "Usable series for this period:"}
                    </span>
                    <span className="font-medium text-emerald dark:text-emerald-400">
                      {m.usableSeriesCount > 0
                        ? `${m.usableSeriesCount} ${m.seriesType === "ENSEMBLE_MEMBERS" ? (locale === "bn" ? "ফেরত পাওয়া সদস্য সিরিজ" : "returned member series") : (locale === "bn" ? "মডেল সিরিজ" : "model series")}`
                        : (locale === "bn" ? "উপাত্ত অপ্রাপ্য" : "Unavailable")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Agronomic Operational Guidance Cards */}
      {operationalGuidance && (
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            {locale === "bn" ? "মাঠ পর্যায়ের কৃষিজ সিদ্ধান্ত ও অপারেশনাল উইন্ডো" : "Agronomic Operational Decision Windows"}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {/* Spraying Window */}
            <div className="rounded-xl border border-line bg-surface p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-muted">
                    {locale === "bn" ? "কীটনাশক/স্প্রে করার অনুকূলতা" : "Foliar Spraying Window"}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    operationalGuidance.sprayWindow.isAvailable === false
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                      : operationalGuidance.sprayWindow.isSuitable
                      ? "bg-emerald/15 text-emerald-800 dark:text-emerald-300 border-emerald/30"
                      : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30"
                  }`}>
                    {operationalGuidance.sprayWindow.isAvailable === false
                      ? (locale === "bn" ? "উপাত্ত অপ্রাপ্য" : "Unavailable")
                      : operationalGuidance.sprayWindow.isSuitable
                      ? (locale === "bn" ? "অনুকূল" : "Suitable")
                      : (locale === "bn" ? "প্রতিকূল" : "Unfavorable")}
                  </span>
                </div>
                <div className="mt-1 text-sm font-semibold text-content">
                  {locale === "bn" ? operationalGuidance.sprayWindow.verdictBn : operationalGuidance.sprayWindow.verdictEn}
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                {locale === "bn" ? operationalGuidance.sprayWindow.detailsBn : operationalGuidance.sprayWindow.detailsEn}
              </p>
            </div>

            {/* Irrigation Window */}
            <div className="rounded-xl border border-line bg-surface p-3.5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-muted">
                  {locale === "bn" ? "সেচ প্রয়োগের সময়সূচি" : "Irrigation Scheduling"}
                </span>
                <div className="mt-1 text-sm font-semibold text-content">
                  {locale === "bn" ? operationalGuidance.irrigationWindow.verdictBn : operationalGuidance.irrigationWindow.verdictEn}
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                {locale === "bn" ? operationalGuidance.irrigationWindow.detailsBn : operationalGuidance.irrigationWindow.detailsEn}
              </p>
            </div>

            {/* Harvest Window */}
            <div className="rounded-xl border border-line bg-surface p-3.5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-muted">
                  {locale === "bn" ? "ফসল কাটা ও শুকানোর নিরাপত্তা" : "Harvest & Drying Safety"}
                </span>
                <div className="mt-1 text-sm font-semibold text-content">
                  {locale === "bn" ? operationalGuidance.harvestWindow.verdictBn : operationalGuidance.harvestWindow.verdictEn}
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                {locale === "bn"
                  ? "পরবর্তী ৭২ ঘণ্টায় ধান কাটা ও রোদে শুকানোর সার্বিক উপযোগিতা।"
                  : "Overall safety for grain threshing and open-air drying over next 72h."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Data Provenance & Freshness Metadata */}
      <div className="mt-6 pt-4 border-t border-line/60 flex flex-col gap-2.5 text-[11px] text-muted">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-content">{locale === "bn" ? "তথ্যসূত্র ও মডেল:" : "Sources & Models:"}</span>
            <span className="rounded-md bg-surface-alt px-2 py-0.5 border border-line/60">
              {provenance?.forecastModel || "Open-Meteo Best Match (Deterministic NWP Combination)"}
            </span>
            <span className="rounded-md bg-surface-alt px-2 py-0.5 border border-line/60">
              {provenance?.seasonalModel || "Open-Meteo Seasonal Forecast API"}
            </span>
            <span className="rounded-md bg-surface-alt px-2 py-0.5 border border-line/60">
              {provenance?.officialAdvisories || (locale === "bn" ? "সরকারি সতর্কতার তথ্য অনুপলব্ধ" : "Government warning status unavailable")}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-md bg-surface-alt px-2 py-0.5 border border-line/60 text-emerald dark:text-emerald-400 font-medium text-[10px]">
              {locale === "bn"
                ? `পূর্বাভাস: ${provenance?.forecastDataStatus !== "AVAILABLE" ? "অপ্রাপ্য" : provenance?.isForecastCached ? "ক্যাশড" : "সরাসরি আনা"}`
                : `Forecast: ${provenance?.forecastDataStatus !== "AVAILABLE" ? "Unavailable" : provenance?.isForecastCached ? "Cached" : "Fetched"}`}
            </span>
            <span className="rounded-md bg-surface-alt px-2 py-0.5 border border-line/60 text-emerald dark:text-emerald-400 font-medium text-[10px]">
              {locale === "bn"
                ? `মৌসুমি: ${provenance?.seasonalDataStatus !== "AVAILABLE" ? "অপ্রাপ্য" : provenance?.isSeasonalCached ? "ক্যাশড" : "সরাসরি আনা"}`
                : `Seasonal: ${provenance?.seasonalDataStatus !== "AVAILABLE" ? "Unavailable" : provenance?.isSeasonalCached ? "Cached" : "Fetched"}`}
            </span>
            {provenance?.forecastFetchTimestamp && (
              <span className="text-[10px] text-muted">
                {locale === "bn" ? "পূর্বাভাস fetch: " : "Forecast fetched: "}
                {new Date(provenance.forecastFetchTimestamp).toLocaleString(locale === "bn" ? "bn-BD" : "en-US", { timeZone: "Asia/Dhaka", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            {provenance?.seasonalFetchTimestamp && (
              <span className="text-[10px] text-muted">
                {locale === "bn" ? "মৌসুমি fetch: " : "Seasonal fetched: "}
                {new Date(provenance.seasonalFetchTimestamp).toLocaleString(locale === "bn" ? "bn-BD" : "en-US", { timeZone: "Asia/Dhaka", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            {provenance?.forecastReferenceTime && (
              <span className="text-[10px] text-muted">
                {locale === "bn" ? `মডেল রান: ${provenance.forecastReferenceTime}` : `Model Run: ${provenance.forecastReferenceTime}`}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-content-muted">
          <span>
            {locale === "bn"
              ? "স্থানিক নির্ভুলতা: আঞ্চলিক গ্রিড (~৩৬ কিমি)। মাইক্রোক্লাইমেট পার্থক্যের কারণে স্থানীয় পরিস্থিতি ভিন্ন হতে পারে।"
              : "Spatial Scale: Coarse regional grid (~36 km). Sub-seasonal & seasonal tendencies are not calibrated for single-farm microclimates."}
          </span>
          <span>Asia/Dhaka Standard Time</span>
        </div>
      </div>
    </section>
  );
}
