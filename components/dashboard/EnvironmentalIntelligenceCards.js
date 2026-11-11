"use client";

import Link from "next/link";
import {
  Sun,
  CloudRain,
  Droplets,
  Leaf,
  ArrowRight,
  ShieldCheck,
  Info,
} from "lucide-react";
import { toBengaliNumber } from "@/lib/tickerHeadlines.js";

/**
 * Krishi Mama — Premium Enterprise Environmental Intelligence Cards.
 * Refined agricultural intelligence SaaS interface for 4 NASA datasets:
 * 1. NASA POWER (জলবায়ুর ইতিহাস / Climate Baseline)
 * 2. NASA GPM IMERG (বৃষ্টিপাত / Precipitation)
 * 3. NASA SMAP (মাটির আর্দ্রতা / Surface Soil Moisture)
 * 4. NASA MODIS (গাছপালার সবুজত্ব / Vegetation Index)
 *
 * Design Guidelines:
 * - Clean white card surfaces on off-white background with subtle borders and sophisticated shadows.
 * - Restrained dataset accents (Amber, Sky, Teal, Emerald) via subtle 2px top bars and soft icon badges.
 * - Deep forest-green actions and typography hierarchy.
 * - Equal, balanced card heights with aligned header, metric, metadata, and footer rows.
 * - Strictly zero hardcoded observations, dates, or record counts.
 * - Honest, dignified unavailable states; absent observations remain distinct from measured zero values.
 */

function formatNumber(num, locale = "en") {
  if (num === null || num === undefined || !Number.isFinite(num)) return "—";
  const formatted = num.toLocaleString(locale === "bn" ? "bn-BD" : "en-US");
  return locale === "bn" ? toBengaliNumber(formatted) : formatted;
}

function formatDate(dateStr, locale = "en") {
  if (!dateStr || typeof dateStr !== "string") {
    return locale === "bn" ? "তারিখ অনুপলভ্য" : "Date unavailable";
  }
  return locale === "bn" ? toBengaliNumber(dateStr) : dateStr;
}

function formatDateRange(firstDate, lastDate, locale = "en") {
  if (!firstDate || !lastDate) {
    return locale === "bn" ? "সময়সীমা অনুপলভ্য" : "Range unavailable";
  }
  const start = locale === "bn" ? toBengaliNumber(firstDate) : firstDate;
  const end = locale === "bn" ? toBengaliNumber(lastDate) : lastDate;
  return `${start} – ${end}`;
}

function provenanceLabel(provenance, locale) {
  if (provenance === "HISTORICAL_DATABASE") return locale === "bn" ? "ঐতিহাসিক ডেটাবেস" : "Historical database";
  if (provenance === "CACHED") return locale === "bn" ? "ক্যাশ করা বিশ্লেষণ" : "Cached analysis";
  if (provenance === "SNAPSHOT") return locale === "bn" ? "অফলাইন স্ন্যাপশট" : "Offline snapshot";
  return locale === "bn" ? "উৎস যাচাই হয়নি" : "Provenance unavailable";
}

function sourceMetadata(source, resolution, provenance, locale) {
  return [source, resolution, provenanceLabel(provenance, locale)].filter(Boolean).join(" · ");
}

export default function EnvironmentalIntelligenceCards({
  locale = "bn",
  selectedDistrict = "cumilla",
  districtDisplayName = "কুমিল্লা",
  environmentalSources = [],
  climateSummary = null,
  climateMeta = null,
  gpmData = null,
  smapData = null,
  modisData = null,
  isLoading = false,
}) {
  const isBn = locale === "bn";

  // --------------------------------------------------------------------------
  // 1. NASA POWER (Historical Baseline Agroclimatology)
  // --------------------------------------------------------------------------
  const powerSource = environmentalSources.find((s) => s.datasetKey === "nasa:power:daily:point");
  const powerDistrictValid = powerSource?.districtValidCoverage?.[selectedDistrict];
  const powerValidCount = Number.isFinite(powerDistrictValid?.count)
    ? powerDistrictValid.count
    : Number.isFinite(climateMeta?.valid_observations) ? climateMeta.valid_observations : null;
  const powerFirstDate = powerDistrictValid?.firstObservationDate || null;
  const powerLastDate = powerDistrictValid?.lastObservationDate || null;

  const meanTempValue = climateSummary?.temperature?.annual_historical?.mean;
  const humidityValue = climateSummary?.rh2m?.annual_historical?.mean;
  const rainfallValue = climateSummary?.rainfall?.annual_historical?.mean;
  const meanTemp = Number.isFinite(meanTempValue) ? meanTempValue.toFixed(1) : null;
  const humidity = Number.isFinite(humidityValue) ? humidityValue.toFixed(0) : null;
  const rainfall = Number.isFinite(rainfallValue) ? Math.round(rainfallValue) : null;
  const powerYears = Number.isFinite(climateMeta?.years_used) ? climateMeta.years_used : null;

  // --------------------------------------------------------------------------
  // 2. NASA GPM IMERG (Precipitation)
  // --------------------------------------------------------------------------
  const gpmSource = environmentalSources.find((s) => s.datasetKey === "nasa:gpm:imerg:3imerghh:v07");
  const gpmDistrictValid = gpmSource?.districtValidCoverage?.[selectedDistrict];
  const gpmValidCount = Number.isFinite(gpmDistrictValid?.count) ? gpmDistrictValid.count : null;
  const gpmFirstDate = gpmDistrictValid?.firstObservationDate || null;
  const gpmLastDate = gpmDistrictValid?.lastObservationDate || null;

  const gpmLatestSummary = gpmData?.data?.latestDailySummary;
  const gpmHasObservation = Boolean(gpmLatestSummary || gpmData?.data?.latestInterval);
  const isGpmDayComplete = gpmLatestSummary?.completeness === "complete" &&
    gpmLatestSummary?.observedIntervals === 48 &&
    gpmLatestSummary?.validIntervals === 48 &&
    Number.isFinite(gpmLatestSummary?.totalPrecipitationMm);
  const gpmRainValue = isGpmDayComplete ? Number(gpmLatestSummary.totalPrecipitationMm).toFixed(1) : null;
  const gpmObservedDate = gpmLatestSummary?.dateLabel || gpmData?.data?.latestInterval?.observationDate || gpmLastDate;

  // --------------------------------------------------------------------------
  // 3. NASA SMAP (Surface Soil Moisture)
  // --------------------------------------------------------------------------
  const smapSource = environmentalSources.find((s) => s.datasetKey === "nasa:smap:spl3smp_e:v006");
  const smapDistrictValid = smapSource?.districtValidCoverage?.[selectedDistrict];
  const smapDistrictStatus = smapSource?.districtAvailability?.[selectedDistrict];
  const smapValidCount = Number.isFinite(smapDistrictValid?.count)
    ? smapDistrictValid.count
    : Number.isFinite(smapDistrictStatus?.validRecordCount) ? smapDistrictStatus.validRecordCount : null;
  const smapTotalStoredCount = Number.isFinite(smapSource?.districtCoverage?.[selectedDistrict])
    ? smapSource.districtCoverage[selectedDistrict]
    : Number.isFinite(smapDistrictStatus?.storedRecordCount) ? smapDistrictStatus.storedRecordCount : null;
  const smapFirstDate = smapDistrictValid?.firstObservationDate || smapDistrictStatus?.firstValidObservationDate || null;
  const smapLastDate = smapDistrictValid?.lastObservationDate || smapDistrictStatus?.lastValidObservationDate || null;

  const rawSmapObs = smapData?.data;
  const isSmapRecommended = rawSmapObs?.isRecommendedQuality === true && [0, 8].includes(rawSmapObs?.retrievalQualityFlag);
  const smapSoilMoisture = isSmapRecommended && Number.isFinite(rawSmapObs?.soilMoisture)
    ? Number(rawSmapObs.soilMoisture).toFixed(4)
    : null;
  const smapObsDate = rawSmapObs?.dateLabel || smapLastDate;

  // --------------------------------------------------------------------------
  // 4. NASA MODIS (Canopy Greenness / NDVI)
  // --------------------------------------------------------------------------
  const modisSource = environmentalSources.find((s) => s.datasetKey === "nasa:modis:mod13q1:v061");
  const modisDistrictValid = modisSource?.districtValidCoverage?.[selectedDistrict];
  const modisGoodCount = Number.isFinite(modisDistrictValid?.count) ? modisDistrictValid.count : null;
  const modisMarginalCount = Number.isFinite(modisDistrictValid?.qualityCounts?.marginal_data)
    ? modisDistrictValid.qualityCounts.marginal_data : null;
  const modisFirstDate = modisDistrictValid?.firstObservationDate || null;
  const modisLastDate = modisDistrictValid?.lastObservationDate || null;

  const rawModisObs = modisData?.data;
  const isModisGood = rawModisObs?.pixelReliability === 0 && rawModisObs?.isReliableQuality === true;
  const isModisMarginal = rawModisObs?.pixelReliability === 1;
  const modisNdvi = Number.isFinite(rawModisObs?.ndvi) ? Number(rawModisObs.ndvi).toFixed(4) : null;
  const modisEvi = Number.isFinite(rawModisObs?.evi) ? Number(rawModisObs.evi).toFixed(4) : null;
  const modisObsDate = rawModisObs?.dateLabel || modisLastDate;

  // --------------------------------------------------------------------------
  // Unified Symmetrical Dataset Cards Configuration
  // --------------------------------------------------------------------------
  const cards = [
    // ------------------------------------------------------------------------
    // CARD 1: NASA POWER
    // ------------------------------------------------------------------------
    {
      id: "power",
      title: isBn ? "জলবায়ুর ইতিহাস" : "Climate Baseline",
      technicalCode: "NASA POWER · Point Daily",
      icon: Sun,
      topBorder: "border-t-amber-500",
      iconWrap: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30",
      href: "/climate",
      badge: {
        text: powerYears != null
          ? `${formatNumber(powerYears, locale)} ${isBn ? "বছরের গড়" : "year normal"}`
          : (isBn ? "ঐতিহাসিক গড়" : "Historical normal"),
        style: "bg-amber-50 text-amber-800 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40",
        tooltip: isBn
          ? "NASA POWER-এর দীর্ঘমেয়াদি ঐতিহাসিক গড়। এটি পূর্বাভাস বা লাইভ আবহাওয়া নয়।"
          : "Long-term historical baseline. An agroclimatic reference, not a forecast or live weather.",
      },
      explanation: isBn
        ? "আপনার জেলার তাপমাত্রা, বার্ষিক বৃষ্টিপাত ও আর্দ্রতার দীর্ঘমেয়াদি ঐতিহাসিক চিত্র।"
        : "Your district’s long-term historical temperature, rainfall, and humidity context.",
      metric: {
        primaryValue: meanTemp !== null ? (isBn ? toBengaliNumber(meanTemp) : meanTemp) : "—",
        unit: "°C",
        label: isBn ? "বার্ষিক গড় তাপমাত্রা" : "Mean Annual Temperature",
        isUnavailable: meanTemp === null,
        subMetrics: [
          {
            label: isBn ? "আর্দ্রতা" : "Humidity",
            value: humidity !== null ? `${isBn ? toBengaliNumber(humidity) : humidity}%` : "—",
          },
          {
            label: isBn ? "গড় বৃষ্টি" : "Annual Rain",
            value: rainfall !== null ? `${formatNumber(rainfall, locale)} ${isBn ? "মিমি" : "mm"}` : "—",
          },
        ],
      },
      metadata: [
        {
          label: isBn ? "সর্বশেষ পর্যবেক্ষণ" : "Latest Observation",
          value: formatDate(powerLastDate, locale),
        },
        {
          label: isBn ? "সংরক্ষিত সময়সীমা" : "Stored Coverage",
          value: formatDateRange(powerFirstDate, powerLastDate, locale),
        },
        {
          label: isBn ? "বৈধ রেকর্ড সংখ্যা" : "Valid Records",
          value: powerValidCount ? `${formatNumber(powerValidCount, locale)} ${isBn ? "দিন" : "days"}` : "—",
        },
        {
          label: isBn ? "উৎস ও রেজোলিউশন" : "Source & Resolution",
          value: sourceMetadata("NASA POWER", "Point", climateMeta?.provenance, locale),
        },
      ],
      actionLabel: isBn ? "জলবায়ু বিশ্লেষণ দেখুন" : "View Climate Analysis",
    },

    // ------------------------------------------------------------------------
    // CARD 2: NASA GPM IMERG
    // ------------------------------------------------------------------------
    {
      id: "gpm",
      title: isBn ? "বৃষ্টিপাত" : "Precipitation",
      technicalCode: "NASA GPM · IMERG V07 Final",
      icon: CloudRain,
      topBorder: "border-t-sky-500",
      iconWrap: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200/50 dark:border-sky-800/30",
      href: "/rainfall",
      badge: {
        text: isGpmDayComplete
          ? (isBn ? "৪৮/৪৮ সম্পন্ন" : "48/48 Complete")
          : gpmHasObservation
            ? (isBn ? "অসম্পূর্ণ দিন" : "Incomplete")
            : (isBn ? "উপাত্ত নেই" : "Unavailable"),
        style: isGpmDayComplete
          ? "bg-emerald-50 text-emerald-800 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40"
          : gpmHasObservation
            ? "bg-amber-50 text-amber-800 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40"
            : "bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800/70 dark:text-stone-300 dark:border-stone-700",
        tooltip: isBn
          ? "বাংলাদেশ সিভিল দিনের (UTC+6) জন্য সম্পূর্ণ ৪৮টি আধা-ঘণ্টার উপগ্রহ ব্যবধান নিশ্চিত করা হয়েছে।"
          : "Strict 48 half-hourly intervals verified for the Bangladesh civil day (UTC+6).",
      },
      explanation: isBn
        ? "উপগ্রহের মাইক্রোওয়েভ ও রাডার দিয়ে পরিমাপ করা বৃষ্টিপাত—কখন ও কত বৃষ্টি হয়েছে।"
        : "Satellite microwave and radar measurements showing actual ground precipitation.",
      metric: {
        primaryValue: isGpmDayComplete ? (isBn ? toBengaliNumber(gpmRainValue) : gpmRainValue) : "—",
        unit: isBn ? "মিমি" : "mm",
        label: isGpmDayComplete
          ? (isBn ? `২৪ ঘণ্টার মোট বৃষ্টি (${formatDate(gpmObservedDate, locale)})` : `24h Total Rain (${formatDate(gpmObservedDate, locale)})`)
          : gpmHasObservation
            ? (isBn ? "৪৮টি ব্যবধান পূর্ণ হয়নি" : "Incomplete 48-interval day")
            : (isBn ? "পর্যবেক্ষণ অনুপলভ্য" : "Observation unavailable"),
        isUnavailable: !isGpmDayComplete,
        subMetrics: [
          {
            label: isBn ? "ব্যবধান" : "Intervals",
            value: gpmLatestSummary ? `${isBn ? toBengaliNumber(gpmLatestSummary.validIntervals) : gpmLatestSummary.validIntervals}/48` : "—",
          },
          {
            label: isBn ? "স্থিতি" : "Status",
            value: isGpmDayComplete && Number(gpmRainValue) === 0
              ? (isBn ? "শুষ্ক দিন (০ মিমি)" : "Dry Day (0 mm)")
              : isGpmDayComplete
                ? (isBn ? "বৃষ্টিপাত পরিমাপিত" : "Rain observed")
                : (isBn ? "অনুপলভ্য" : "Unavailable"),
          },
        ],
      },
      metadata: [
        {
          label: isBn ? "সর্বশেষ পর্যবেক্ষণ" : "Latest Observation",
          value: formatDate(gpmObservedDate, locale),
        },
        {
          label: isBn ? "সংরক্ষিত সময়সীমা" : "Stored Coverage",
          value: formatDateRange(gpmFirstDate, gpmLastDate, locale),
        },
        {
          label: isBn ? "বৈধ রেকর্ড সংখ্যা" : "Valid Records",
          value: gpmValidCount !== null ? `${formatNumber(gpmValidCount, locale)} ${isBn ? "বৈধ ব্যবধান" : "valid intervals"}` : "—",
        },
        {
          label: isBn ? "উৎস ও রেজোলিউশন" : "Source & Resolution",
          value: sourceMetadata("NASA GES DISC", "10 km", gpmData?.meta?.provenance, locale),
        },
      ],
      actionLabel: isBn ? "বৃষ্টিপাত বিবরণ দেখুন" : "View Rainfall Details",
    },

    // ------------------------------------------------------------------------
    // CARD 3: NASA SMAP
    // ------------------------------------------------------------------------
    {
      id: "smap",
      title: isBn ? "মাটির আর্দ্রতা" : "Soil Moisture",
      technicalCode: "NASA SMAP · SPL3SMP_E V006",
      icon: Droplets,
      topBorder: "border-t-teal-600",
      iconWrap: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200/50 dark:border-teal-800/30",
      href: "/soil-moisture",
      badge: {
        text: isSmapRecommended
          ? (isBn ? "প্রস্তাবিত" : "Recommended")
          : rawSmapObs?.retrievalQualityFlag === 9
            ? (isBn ? "ফ্ল্যাগ ৯ প্রত্যাহার" : "Flag 9 Withheld")
            : (isBn ? "অনুপলভ্য" : "Unavailable"),
        style: isSmapRecommended
          ? "bg-teal-50 text-teal-800 border-teal-200/70 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/40"
          : "bg-stone-100 text-stone-700 border-stone-200/80 dark:bg-stone-900/40 dark:text-stone-300 dark:border-stone-800/50",
        tooltip: isBn
          ? "NSIDC নীতিমালা অনুযায়ী শুধুমাত্র ফ্ল্যাগ ০ ও ৮ নির্ভরযোগ্য মান। ফ্ল্যাগ ৯ শিকড়-স্তরের জন্য অনির্ভরযোগ্য হওয়ায় মান প্রদর্শন স্থগিত রাখা হয়েছে।"
          : "Only quality flags 0 and 8 are recommended per NSIDC. Flag 9 is withheld to protect scientific integrity.",
      },
      explanation: isBn
        ? "মাটির ওপরের ০–৫ সেমি উপরিভাগের আর্দ্রতা; এটি গভীর শিকড়-স্তরের পানি নয়।"
        : "Top 0-5 cm surface soil moisture proxy; not root-zone saturation.",
      metric: {
        primaryValue: smapSoilMoisture !== null
          ? (isBn ? toBengaliNumber(smapSoilMoisture) : smapSoilMoisture)
          : rawSmapObs
            ? (isBn ? "মান স্থগিত" : "Data Withheld")
            : (isBn ? "উপাত্ত নেই" : "Unavailable"),
        unit: smapSoilMoisture !== null ? "m³/m³" : "",
        label: isSmapRecommended
          ? (isBn ? `পৃষ্ঠীয় আর্দ্রতা (${formatDate(smapObsDate, locale)})` : `Surface Moisture (${formatDate(smapObsDate, locale)})`)
          : rawSmapObs?.retrievalQualityFlag != null
            ? (isBn ? `ফ্ল্যাগ ${toBengaliNumber(rawSmapObs.retrievalQualityFlag)} প্রস্তাবিত মানদণ্ড পূরণ করেনি` : `Flag ${rawSmapObs.retrievalQualityFlag} does not meet the recommended quality gate`)
            : (isBn ? "প্রস্তাবিত মানের পর্যবেক্ষণ নেই" : "No recommended-quality observation"),
        isUnavailable: smapSoilMoisture === null,
        subMetrics: [
          {
            label: isBn ? "গুণমান" : "Quality",
            value: rawSmapObs?.retrievalQualityFlag != null
              ? (isBn ? `ফ্ল্যাগ ${toBengaliNumber(rawSmapObs.retrievalQualityFlag)}` : `Flag ${rawSmapObs.retrievalQualityFlag}`)
              : "—",
          },
          {
            label: isBn ? "গভীরতা" : "Depth",
            value: "0–5 cm",
          },
        ],
      },
      metadata: [
        {
          label: isBn ? "সর্বশেষ পর্যবেক্ষণ" : "Latest Observation",
          value: formatDate(smapObsDate, locale),
        },
        {
          label: isBn ? "সংরক্ষিত সময়সীমা" : "Stored Coverage",
          value: smapFirstDate && smapLastDate ? formatDateRange(smapFirstDate, smapLastDate, locale) : (isBn ? "বৈধ কভারেজ নেই" : "No valid coverage"),
        },
        {
          label: isBn ? "বৈধ রেকর্ড সংখ্যা" : "Valid Records",
          value: smapValidCount > 0
            ? `${formatNumber(smapValidCount, locale)} ${isBn ? "টি বৈধ" : "valid"}`
            : smapValidCount === 0 && smapTotalStoredCount !== null
              ? (isBn ? `০টি বৈধ (${formatNumber(smapTotalStoredCount, locale)}টি সংরক্ষিত)` : `0 valid (${formatNumber(smapTotalStoredCount, locale)} stored)`)
              : "—",
        },
        {
          label: isBn ? "উৎস ও রেজোলিউশন" : "Source & Resolution",
          value: sourceMetadata("NASA NSIDC", "9 km", smapData?.meta?.provenance, locale),
        },
      ],
      actionLabel: isBn ? "মাটির আর্দ্রতা দেখুন" : "View Soil Moisture Details",
    },

    // ------------------------------------------------------------------------
    // CARD 4: NASA MODIS
    // ------------------------------------------------------------------------
    {
      id: "modis",
      title: isBn ? "গাছপালার সবুজত্ব" : "Vegetation Index",
      technicalCode: "NASA MODIS · 250m SIN",
      icon: Leaf,
      topBorder: "border-t-emerald-600",
      iconWrap: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30",
      href: "/vegetation",
      badge: {
        text: isModisGood
          ? (isBn ? "উত্তম মান" : "Good Data")
          : isModisMarginal
            ? (isBn ? "প্রান্তিক মান" : "Marginal Data")
            : rawModisObs
              ? (isBn ? "মান যাচাই হয়নি" : "Quality unavailable")
              : (isBn ? "উপাত্ত নেই" : "Unavailable"),
        style: isModisGood
          ? "bg-emerald-50 text-emerald-800 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40"
          : isModisMarginal || rawModisObs
            ? "bg-amber-50 text-amber-800 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40"
            : "bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800/70 dark:text-stone-300 dark:border-stone-700",
        tooltip: isBn
          ? "MODIS পিক্সেল নির্ভরযোগ্যতা র‍্যাঙ্ক ০ হলো মেঘমুক্ত পরিষ্কার মান; র‍্যাঙ্ক ১ হলো মেঘ বা বায়ুমণ্ডলের কারণে প্রান্তিক মান।"
          : "Pixel reliability rank 0 indicates clear-sky quality; rank 1 indicates marginal atmospheric conditions.",
      },
      explanation: isBn
        ? "উপগ্রহ চিত্রে মাঠের সামগ্রিক সবুজত্ব ও পাতার ঘনত্ব; এটি সরাসরি ফসলের রোগ নির্ণয় নয়।"
        : "Regional canopy greenness and chlorophyll density; not a direct plant disease diagnosis.",
      metric: {
        primaryValue: modisNdvi !== null ? (isBn ? toBengaliNumber(modisNdvi) : modisNdvi) : "—",
        unit: "NDVI",
        label: isBn
          ? `১৬ দিনের যৌগিক চক্র (${formatDate(modisObsDate, locale)})`
          : `16-Day Composite (${formatDate(modisObsDate, locale)})`,
        isUnavailable: modisNdvi === null,
        subMetrics: [
          {
            label: "EVI",
            value: modisEvi !== null ? (isBn ? toBengaliNumber(modisEvi) : modisEvi) : "—",
          },
          {
            label: isBn ? "গুণমান" : "Quality",
            value: rawModisObs?.pixelReliability != null
              ? (isBn ? `র‍্যাঙ্ক ${toBengaliNumber(rawModisObs.pixelReliability)}` : `Rank ${rawModisObs.pixelReliability}`)
              : "—",
          },
        ],
      },
      metadata: [
        {
          label: isBn ? "সর্বশেষ পর্যবেক্ষণ" : "Latest Observation",
          value: formatDate(modisObsDate, locale),
        },
        {
          label: isBn ? "সংরক্ষিত সময়সীমা" : "Stored Coverage",
          value: formatDateRange(modisFirstDate, modisLastDate, locale),
        },
        {
          label: isBn ? "বৈধ রেকর্ড সংখ্যা" : "Valid Records",
          value: modisGoodCount !== null
            ? `${formatNumber(modisGoodCount, locale)} ${isBn ? "টি উত্তম চক্র" : "good cycles"}${modisMarginalCount != null ? ` · ${formatNumber(modisMarginalCount, locale)} ${isBn ? "টি প্রান্তিক" : "marginal"}` : ""}`
            : "—",
        },
        {
          label: isBn ? "উৎস ও রেজোলিউশন" : "Source & Resolution",
          value: sourceMetadata("NASA LP DAAC", "250 m", modisData?.meta?.provenance, locale),
        },
      ],
      actionLabel: isBn ? "সবুজত্ব বিবরণ দেখুন" : "View Vegetation Details",
    },
  ];

  return (
    <section aria-labelledby="environmental-intelligence-title" aria-busy={isLoading} className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-forest-100 text-forest-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-forest-700 dark:text-emerald-400">
              {isBn ? "জলবায়ু তথ্য" : "Climate Data"}
            </p>
          </div>
          <h2 id="environmental-intelligence-title" className="mt-1 text-xl font-bold tracking-tight text-stone-900 sm:text-2xl dark:text-stone-50">
            {isBn ? "আপনার এলাকার জলবায়ু তথ্য" : "Climate data for your area"}
          </h2>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-xl text-xs leading-relaxed text-stone-600 dark:text-stone-300">
          {isBn
            ? `${districtDisplayName} জেলার NASA পর্যবেক্ষণ; তারিখ, গুণমান ও সীমাবদ্ধতা প্রতিটি কার্ডে দেখানো হয়েছে।`
            : `NASA observations for ${districtDisplayName}. Dates, quality, and limitations are shown on each card.`}
        </p>
        <Link href="/climate" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-forest-700 transition-colors hover:bg-forest/5 hover:text-forest-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-climate dark:text-emerald-400 dark:hover:bg-white/5">
          <span>{isBn ? "সব জলবায়ু তথ্য দেখুন" : "Explore Climate Data"}</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        </div>
      </div>

      {/* Grid of 4 Symmetrical Enterprise SaaS Cards (2 Cards per Row) */}
      <div className="grid w-full min-w-0 items-stretch gap-4 md:grid-cols-2 lg:gap-5">
        {cards.map((card) => {
          const CardIcon = card.icon;
          return (
            <div
              key={card.id}
              className={`group flex h-full w-full min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-0 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-forest-600/30 hover:shadow-md dark:border-white/10 dark:bg-surface dark:hover:border-emerald-500/30 ${card.topBorder} border-t-2`}
            >
              <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                {/* Header Row: Icon + Title on left, Status Badge on right */}
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-2xs ${card.iconWrap}`}>
                      <CardIcon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm sm:text-base font-bold tracking-tight text-stone-900 dark:text-stone-100">{card.title}</h3>
                      <p className="mt-0.5 truncate text-[11px] font-mono font-medium text-stone-500 dark:text-stone-400">{card.technicalCode}</p>
                    </div>
                  </div>
                  <span
                    title={card.badge.tooltip}
                    className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold shadow-2xs ${card.badge.style}`}
                  >
                    {card.badge.text}
                  </span>
                </div>

                {/* Farmer-Friendly Explanation */}
                <p className="mt-2.5 min-h-[2rem] text-xs leading-relaxed text-stone-600 dark:text-stone-300 line-clamp-2">
                  {card.explanation}
                </p>

                {/* Main Metric Container with Horizontal Balanced Layout */}
                <div className={`mt-3 rounded-xl border p-3.5 sm:p-4 ${
                  card.metric.isUnavailable
                    ? "border-amber-200/60 bg-amber-50/40 dark:border-amber-900/30 dark:bg-amber-950/20"
                    : "border-stone-200/60 bg-stone-50/70 dark:border-white/5 dark:bg-surface-2/40"
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-2xl font-extrabold tracking-tight sm:text-3xl ${
                          card.metric.isUnavailable
                            ? "text-amber-900 dark:text-amber-200 text-xl sm:text-2xl"
                            : "text-stone-900 dark:text-stone-50"
                        }`}>
                          {card.metric.primaryValue}
                        </span>
                        {card.metric.unit && (
                          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">{card.metric.unit}</span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs font-medium text-stone-600 dark:text-stone-300">
                        {card.metric.label}
                      </p>
                    </div>

                    {/* Sub-Metrics Pill Chips */}
                    {Array.isArray(card.metric.subMetrics) && card.metric.subMetrics.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        {card.metric.subMetrics.map((chip, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 rounded-lg border border-stone-200/80 bg-white px-2.5 py-1 text-xs font-medium text-stone-800 shadow-2xs dark:border-white/10 dark:bg-surface-2 dark:text-stone-200">
                            <span className="text-stone-500 dark:text-stone-400">{chip.label}:</span>
                            <span className="font-bold">{chip.value}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Balanced 2-Column Metadata Grid (Compact & Clear) */}
                <div className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-stone-200/60 pt-3 text-[11px] leading-relaxed dark:border-white/5">
                  {card.metadata.map((meta, idx) => (
                    <div key={idx} className="flex min-w-0 flex-col">
                      <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400">{meta.label}</span>
                      <span className="min-w-0 truncate font-semibold text-stone-800 dark:text-stone-200">{meta.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Link Footer */}
              <div className="border-t border-stone-200/70 bg-stone-50/60 px-4 py-2.5 sm:px-5 sm:py-3 dark:border-white/10 dark:bg-surface-2/20">
                <Link
                  href={card.href}
                  className="group/link flex items-center justify-between text-xs font-semibold text-forest-700 transition-colors hover:text-forest-900 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  <span>{card.actionLabel}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" aria-hidden="true" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
