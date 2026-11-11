"use client";

import dynamic from "next/dynamic";
import { CloudRain, Droplets, Leaf, MapPin, Sun } from "lucide-react";
import { getDivisionPoint } from "@/lib/divisionPoint.js";

const DivisionPointMap = dynamic(() => import("./DivisionPointMap.js"), { ssr: false });

const PRODUCTS = [
  { key: "power", icon: Sun, titleBn: "এলাকার জলবায়ুর ইতিহাস", titleEn: "Historical climate context", technical: "NASA POWER · Daily point", explanationBn: "তাপমাত্রা, বৃষ্টি, আর্দ্রতা ও সৌরশক্তির ঐতিহাসিক চিত্র—লাইভ আবহাওয়া নয়।", explanationEn: "Historical temperature, rainfall, humidity and solar context—not live weather.", unit: "°C", metricLabelBn: "গড় তাপমাত্রা · ৫ বছর", metricLabelEn: "Mean temperature · 5 years", href: "/climate", color: "amber" },
  { key: "gpm", icon: CloudRain, titleBn: "বৃষ্টিপাতের তথ্য", titleEn: "Rainfall observations", technical: "NASA GPM IMERG V07 Final", explanationBn: "উপগ্রহে মাপা বৃষ্টিপাত; অসম্পূর্ণ দিনের যোগফল পূর্ণ দিনের মান নয়।", explanationEn: "Satellite rainfall estimates; incomplete days are not shown as complete totals.", unit: "mm/day", href: "/climate#rainfall", color: "sky" },
  { key: "smap", icon: Droplets, titleBn: "মাটির উপরিভাগের আর্দ্রতা", titleEn: "Near-surface soil moisture", technical: "NASA SMAP SPL3SMP_E V006", explanationBn: "মাটির কাছের পৃষ্ঠস্তরের আর্দ্রতা; শিকড়-স্তরের মাপ নয়।", explanationEn: "Near-surface soil moisture; this is not root-zone moisture.", unit: "m³/m³", href: "/climate#soil-moisture", color: "teal" },
  { key: "modis", icon: Leaf, titleBn: "ফসলের সবুজত্বের সূচক", titleEn: "Vegetation greenness index", technical: "NASA MODIS MOD13Q1.061", explanationBn: "গাছপালার NDVI/EVI সূচক; সরাসরি ফসলের স্বাস্থ্য নির্ণয় নয়।", explanationEn: "Plant greenness indices, not a direct crop-health diagnosis.", unit: "NDVI / EVI", href: "/climate#vegetation", color: "emerald" },
];

const accents = {
  amber: "border-t-amber-500 text-amber-700 dark:text-amber-300",
  sky: "border-t-sky-500 text-sky-700 dark:text-sky-300",
  teal: "border-t-teal-500 text-teal-700 dark:text-teal-300",
  emerald: "border-t-emerald-600 text-emerald-700 dark:text-emerald-300",
};

function formatValue(value, locale) {
  if (!Number.isFinite(value)) return null;
  return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits: 2 }).format(value);
}

export default function DivisionIntelligencePanel({ divisions, selected, onSelect, data, loading, error, locale }) {
  const isBn = locale === "bn";
  const division = data?.division || divisions.find((item) => item.code === selected);
  const datasets = data?.datasets || {};
  const point = getDivisionPoint(division);

  return (
    <section className="space-y-4" aria-labelledby="division-intelligence-heading" aria-busy={loading}>
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-km-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-forest dark:text-emerald-300">{isBn ? "বাংলাদেশ · ৮ বিভাগ" : "Bangladesh · 8 divisions"}</p>
          <h2 id="division-intelligence-heading" className="mt-1 text-xl font-bold text-content">{isBn ? "বিভাগভিত্তিক পরিবেশের তথ্য" : "Division environmental intelligence"}</h2>
          <p className="mt-1 text-sm text-muted">{isBn ? "প্রতিটি মান একটি যাচাইকৃত প্রতিনিধিত্বমূলক বিন্দু থেকে।" : "Each reading is for one verified representative point."}</p>
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
          const value = power ? formatValue(power.value, locale) : null;
          const available = item?.status === "available" && (product.key !== "power" || value !== null);
          const observationDate = power?.observationDate;
          return (
            <article key={product.key} className={`flex min-h-60 flex-col rounded-2xl border border-line border-t-[3px] bg-surface p-4 shadow-km-sm ${accents[product.color]}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2"><Icon size={19} strokeWidth={1.8} aria-hidden="true" /></span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${available ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"}`}>
                  {loading ? (isBn ? "লোড হচ্ছে" : "Loading") : available ? (isBn ? "উপাত্ত পাওয়া গেছে" : "Data available") : (isBn ? "এখনও পাওয়া যায়নি" : "Unavailable")}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-content">{isBn ? product.titleBn : product.titleEn}</h3>
              <p className="mt-1 text-[11px] text-muted">{product.technical}</p>
              <p className="mt-1 min-h-8 text-[11px] leading-relaxed text-muted">{isBn ? product.explanationBn : product.explanationEn}</p>
              <div className="mt-4 rounded-xl border border-line bg-surface-2/70 p-3">
                <p className="text-2xl font-bold tracking-tight text-content">{available ? value : "—"}<span className="ml-1.5 text-xs font-medium text-muted">{product.unit}</span></p>
                <p className="mt-1 text-xs text-muted">{product.key === "power" ? (isBn ? product.metricLabelBn : product.metricLabelEn) : isBn ? "বৈধ প্রতিনিধি-বিন্দু পর্যবেক্ষণ" : "Validated representative-point observation"}</p>
                {product.key !== "power" && <p className="mt-1 text-[11px] leading-relaxed text-muted">{item?.reason || (isBn ? "এই বিভাগের জন্য যাচাইকৃত পর্যবেক্ষণ নেই।" : "No validated observation for this division point.")}</p>}
              </div>
              <div className="mt-3 space-y-1 text-[11px] text-muted">
                <p>{isBn ? "পর্যবেক্ষণের তারিখ" : "Observation date"}: {available && observationDate ? observationDate : "—"}</p>
                <p>{isBn ? "উৎস / অবস্থা" : "Source / provenance"}: {item?.provenance === "LIVE_FETCHED" ? (isBn ? "NASA থেকে আনা · ঐতিহাসিক" : "NASA fetched · historical") : item?.provenance === "CACHED" ? "Cached" : item?.provenance || "—"}</p>
                {available && power && <p>{isBn ? "মান যাচাই" : "Quality"}: {power.validObservationCount} valid days · LST</p>}
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
