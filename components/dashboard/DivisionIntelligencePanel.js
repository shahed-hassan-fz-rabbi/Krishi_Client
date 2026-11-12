"use client";

import dynamic from "next/dynamic";
import { CloudRain, Droplets, Leaf, MapPin, Sun } from "lucide-react";
import { getDivisionPoint } from "@/lib/divisionPoint.js";

const DivisionPointMap = dynamic(() => import("./DivisionPointMap.js"), { ssr: false });

const PRODUCTS = [
  { key: "power", icon: Sun, titleBn: "এলাকার জলবায়ুর ইতিহাস", titleEn: "Historical climate context", technical: "NASA POWER · Daily point", explanationBn: "তাপমাত্রা, বৃষ্টি, আর্দ্রতা ও সৌরশক্তির ঐতিহাসিক চিত্র—লাইভ আবহাওয়া নয়।", explanationEn: "Historical temperature, rainfall, humidity and solar context—not live weather.", unit: "°C", metricLabelBn: "গড় তাপমাত্রা · ৫ বছর", metricLabelEn: "Mean temperature · 5 years", href: "/climate", color: "amber" },
  { key: "gpm", icon: CloudRain, titleBn: "বৃষ্টিপাতের তথ্য", titleEn: "Rainfall observations", technical: "NASA GPM IMERG V07 Final", explanationBn: "উপগ্রহে মাপা বৃষ্টিপাত; অসম্পূর্ণ দিনের যোগফল পূর্ণ দিনের মান নয়।", explanationEn: "Satellite rainfall estimates; incomplete days are not shown as complete totals.", unit: "mm", href: "/climate#rainfall", color: "sky" },
  { key: "smap", icon: Droplets, titleBn: "মাটির উপরিভাগের আর্দ্রতা", titleEn: "Near-surface soil moisture", technical: "NASA SMAP SPL3SMP_E V006", explanationBn: "মাটির কাছের পৃষ্ঠস্তরের আর্দ্রতা; শিকড়-স্তরের মাপ নয়।", explanationEn: "Near-surface soil moisture; this is not root-zone moisture.", unit: "m³/m³", href: "/climate#soil-moisture", color: "teal" },
  { key: "modis", icon: Leaf, titleBn: "ফসলের সবুজত্বের সূচক", titleEn: "Vegetation greenness index", technical: "NASA MODIS MOD13Q1.061", explanationBn: "গাছপালার NDVI/EVI সূচক; সরাসরি ফসলের স্বাস্থ্য নির্ণয় নয়।", explanationEn: "Plant greenness indices, not a direct crop-health diagnosis.", unit: "NDVI", href: "/climate#vegetation", color: "emerald" },
];

const accents = {
  amber: "border-t-amber-500 text-amber-700 dark:text-amber-300",
  sky: "border-t-sky-500 text-sky-700 dark:text-sky-300",
  teal: "border-t-teal-500 text-teal-700 dark:text-teal-300",
  emerald: "border-t-emerald-600 text-emerald-700 dark:text-emerald-300",
};

function formatValue(value, locale, maximumFractionDigits = 2) {
  if (!Number.isFinite(value)) return null;
  return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits }).format(value);
}

export default function DivisionIntelligencePanel({
  divisions,
  selected,
  onSelect,
  data,
  selectedDistrict,
  districtDisplayName,
  districtObservations,
  districtLoading,
  loading,
  error,
  locale,
}) {
  const isBn = locale === "bn";
  const division = data?.division || divisions.find((item) => item.code === selected);
  const datasets = data?.datasets || {};
  const point = getDivisionPoint(division);
  const districtMapsToDivision = selected === "chattogram" &&
    (selectedDistrict === "chattogram" || selectedDistrict === "cumilla");
  const districtDataMatches = districtMapsToDivision && districtObservations?.district === selectedDistrict;

  return (
    <section className="space-y-4" aria-labelledby="division-intelligence-heading" aria-busy={loading}>
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-km-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-forest dark:text-emerald-300">{isBn ? "বাংলাদেশ · ৮ বিভাগ" : "Bangladesh · 8 divisions"}</p>
          <h2 id="division-intelligence-heading" className="mt-1 text-xl font-bold text-content">{isBn ? "বিভাগভিত্তিক পরিবেশের তথ্য" : "Division environmental intelligence"}</h2>
          <p className="mt-1 text-sm text-muted">{isBn ? "POWER-এর মান বিভাগীয় প্রতিনিধি-বিন্দুর; GPM, SMAP ও MODIS-এর মান নির্বাচিত জেলার পর্যবেক্ষণ।" : "POWER uses the division representative point; GPM, SMAP and MODIS use observations for the selected district."}</p>
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm font-medium text-content">
          <MapPin className="h-4 w-4 text-forest" aria-hidden="true" />
          <span className="sr-only">{isBn ? "বিভাগ নির্বাচন" : "Select division"}</span>
          <select value={selected} onChange={(event) => onSelect(event.target.value)} className="min-w-36 bg-transparent outline-none" aria-label={isBn ? "বিভাগ নির্বাচন" : "Select division"}>
            {divisions.map((item) => <option key={item.code} value={item.code}>{isBn ? item.nameBn : item.nameEn}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {PRODUCTS.map((product) => {
          const Icon = product.icon;
          const item = datasets[product.key];
          const power = product.key === "power" ? item?.metrics?.temperature : null;
          const districtResponse = product.key === "power" ? null : districtObservations?.[product.key];
          const responseMatchesDistrict = districtResponse?.data?.districtCode === selectedDistrict;
          const observation = districtDataMatches && !districtResponse?.error && responseMatchesDistrict
            ? districtResponse.data
            : null;
          const gpmSummary = product.key === "gpm" ? observation?.latestDailySummary : null;
          const gpmComplete = gpmSummary?.completeness === "complete" &&
            gpmSummary?.expectedIntervals === 48 && gpmSummary?.observedIntervals === 48 &&
            gpmSummary?.validIntervals === 48 && Number.isFinite(gpmSummary?.totalPrecipitationMm) &&
            gpmSummary.totalPrecipitationMm >= 0;
          const smapRecommended = product.key === "smap" && observation?.isRecommendedQuality === true &&
            [0, 8].includes(observation?.retrievalQualityFlag) && Number.isFinite(observation?.soilMoisture) &&
            observation.soilMoisture >= 0 && observation.soilMoisture <= 1;
          const modisQualityKnown = product.key === "modis" &&
            ((observation?.pixelReliability === 0 && observation?.isReliableQuality === true) || observation?.pixelReliability === 1);
          const modisValue = modisQualityKnown && Number.isFinite(observation?.ndvi) &&
            observation.ndvi >= -0.2 && observation.ndvi <= 1 ? observation.ndvi : null;
          const districtValue = product.key === "gpm" && gpmComplete
            ? gpmSummary.totalPrecipitationMm
            : product.key === "smap" && smapRecommended
              ? observation.soilMoisture
              : product.key === "modis"
                ? modisValue
                : null;
          const value = product.key === "power"
            ? (power ? formatValue(power.value, locale) : null)
            : districtValue !== null
              ? formatValue(districtValue, locale, product.key === "gpm" ? 2 : 4)
              : null;
          const available = product.key === "power"
            ? item?.status === "available" && value !== null
            : product.key === "gpm"
              ? Boolean(gpmComplete)
              : product.key === "smap"
                ? smapRecommended
                : modisValue !== null;
          const cardLoading = loading || (districtMapsToDivision && districtLoading && product.key !== "power");
          const observationDate = product.key === "power"
            ? power?.observationDate
            : product.key === "gpm"
              ? gpmSummary?.dateLabel || observation?.latestInterval?.observationDate
              : observation?.dateLabel;
          const provenance = product.key === "power" ? item?.provenance : districtResponse?.meta?.provenance;
          const qualityLabel = product.key === "power"
            ? (power ? `${power.validObservationCount} valid days · LST` : null)
            : product.key === "gpm"
              ? gpmSummary ? `${gpmSummary.validIntervals}/48 ${isBn ? "বৈধ ব্যবধান" : "valid intervals"}` : null
              : product.key === "smap"
                ? observation?.retrievalQualityFlag != null ? `${isBn ? "ফ্ল্যাগ" : "Flag"} ${observation.retrievalQualityFlag}` : null
                : observation?.pixelReliability != null
                  ? `${observation.pixelReliability === 0 ? (isBn ? "উত্তম মান" : "Good quality") : (isBn ? "প্রান্তিক মান" : "Marginal quality")} · ${isBn ? "র‍্যাঙ্ক" : "rank"} ${observation.pixelReliability}`
                  : null;
          const unavailableReason = product.key === "power"
            ? item?.reason
            : !districtMapsToDivision
              ? (isBn ? "জেলা-ভিত্তিক NASA পর্যবেক্ষণ দেখতে চট্টগ্রাম বিভাগ নির্বাচন করুন।" : "Select Chattogram division to show observations for this supported district.")
            : product.key === "gpm"
              ? gpmSummary && !gpmComplete
                ? (isBn ? `${gpmSummary.validIntervals}/48 ব্যবধান বৈধ; পূর্ণ দিনের মোট দেখানো হচ্ছে না।` : `${gpmSummary.validIntervals}/48 intervals are valid; no complete daily total is shown.`)
                : isBn ? "নির্বাচিত জেলার জন্য যাচাইকৃত পর্যবেক্ষণ পাওয়া যায়নি।" : "No validated observation is available for the selected district."
              : product.key === "smap"
                ? isBn ? "শুধু মান-ফ্ল্যাগ ০ বা ৮-এর যাচাইকৃত মাপ দেখানো হয়; এমন মাপ না থাকলে মান দেখানো হবে না।" : "Only validated measurements with quality flag 0 or 8 are shown; no value is shown when none qualify."
                : isBn ? "নির্বাচিত জেলার জন্য যাচাইকৃত MODIS পর্যবেক্ষণ পাওয়া যায়নি।" : "No validated MODIS observation is available for the selected district.";
          const unit = product.key === "modis" ? "NDVI" : product.unit;
          return (
            <article key={product.key} className={`flex min-h-60 flex-col rounded-2xl border border-line border-t-[3px] bg-surface p-4 shadow-km-sm ${accents[product.color]}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2"><Icon size={19} strokeWidth={1.8} aria-hidden="true" /></span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${available ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"}`}>
                  {cardLoading ? (isBn ? "লোড হচ্ছে" : "Loading") : available ? product.key === "modis" && observation?.pixelReliability === 1 ? (isBn ? "প্রান্তিক মান" : "Marginal quality") : (isBn ? "যাচাইকৃত তথ্য" : "Validated data") : (isBn ? "যাচাইকৃত তথ্য নেই" : "No validated data")}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-content">{isBn ? product.titleBn : product.titleEn}</h3>
              <p className="mt-1 text-[11px] text-muted">{product.technical}</p>
              <p className="mt-1 min-h-8 text-[11px] leading-relaxed text-muted">{isBn ? product.explanationBn : product.explanationEn}</p>
              <div className="mt-4 rounded-xl border border-line bg-surface-2/70 p-3">
                <p className="text-2xl font-bold tracking-tight text-content">{cardLoading ? "—" : available ? value : "—"}<span className="ml-1.5 text-xs font-medium text-muted">{unit}</span></p>
                <p className="mt-1 text-xs text-muted">{product.key === "power" ? (isBn ? product.metricLabelBn : product.metricLabelEn) : districtDataMatches ? `${isBn ? "জেলা" : "District point"} · ${districtDisplayName}` : districtMapsToDivision ? (isBn ? "নির্বাচিত জেলার বিন্দু" : "Selected district point") : (isBn ? "বিভাগের সঙ্গে মিলিয়ে জেলা নির্বাচন করুন" : "Select the matching division for district data")}</p>
                {product.key === "modis" && Number.isFinite(observation?.evi) && observation.evi >= -0.2 && observation.evi <= 1 && <p className="mt-1 text-xs text-muted">EVI {formatValue(observation.evi, locale, 4)}</p>}
                {product.key !== "power" && qualityLabel && <p className="mt-1 text-[11px] leading-relaxed text-muted">{qualityLabel}</p>}
                {product.key !== "power" && !available && !cardLoading && <p className="mt-1 text-[11px] leading-relaxed text-muted">{unavailableReason}</p>}
              </div>
              <div className="mt-3 space-y-1 text-[11px] text-muted">
                <p>{isBn ? "পর্যবেক্ষণের তারিখ" : "Observation date"}: {observationDate || "—"}</p>
                <p>{isBn ? "উৎস / অবস্থা" : "Source / provenance"}: {provenance === "LIVE_FETCHED" ? (isBn ? "NASA থেকে আনা · ঐতিহাসিক" : "NASA fetched · historical") : provenance === "HISTORICAL_DATABASE" ? (isBn ? "NASA ঐতিহাসিক ডেটাবেস" : "NASA historical database") : provenance === "CACHED" ? "Cached" : provenance || "—"}</p>
                {qualityLabel && product.key === "power" && <p>{isBn ? "মান যাচাই" : "Quality"}: {qualityLabel}</p>}
              </div>
              <a href={product.href} className="mt-auto pt-3 text-xs font-semibold text-forest hover:underline dark:text-emerald-300">{isBn ? "বিস্তারিত দেখুন →" : "View details →"}</a>
            </article>
          );
        })}
      </div>

      <div className="grid gap-4 rounded-2xl border border-line bg-surface p-4 shadow-km-sm md:grid-cols-[1fr_1.3fr]">
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-content"><MapPin className="h-4 w-4 text-forest" aria-hidden="true" />{isBn ? "নির্বাচিত প্রতিনিধিত্বমূলক বিন্দু" : "Selected representative point"}</h3>
          <p className="text-sm font-semibold text-content">{isBn ? division?.nameBn : division?.nameEn}</p>
          <p className="text-xs text-muted">{point ? `${point.latitude.toFixed(5)}° N, ${point.longitude.toFixed(5)}° E` : "—"} · {division?.pointMethod || "BBS division polygon centroid"}</p>
          <p className="text-xs leading-relaxed text-muted">{isBn ? "একটি বিন্দুর তথ্য পুরো বিভাগের সব স্থান বা খামারের অবস্থা বোঝায় না।" : division?.limitation || "A single point does not represent every location or farm in this division."}</p>
        </div>
        {error ? <div role="status" className="flex min-h-40 items-center justify-center rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">{isBn ? "বিভাগের তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।" : "Division intelligence could not be loaded. Try again."}</div> : point ? <DivisionPointMap division={division} locale={locale} /> : <div role="status" className="flex min-h-40 items-center justify-center rounded-xl bg-surface-2 p-4 text-sm text-muted">{isBn ? "মানচিত্রের জন্য বৈধ প্রতিনিধিত্বমূলক স্থানাঙ্ক নেই।" : "No valid representative coordinates are available for the map."}</div>}
      </div>
    </section>
  );
}
