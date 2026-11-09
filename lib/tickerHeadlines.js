/**
 * Ticker Headlines Generator & Verified Snapshot Fallback
 *
 * Produces scientifically accurate, verified television news headlines
 * for Krishi Mama's Homepage Agricultural Breaking News Ticker.
 *
 * Grounded in:
 * - NASA POWER (Daily Agroclimatology, Point meteorological & solar reanalysis)
 * - NASA SMAP (SPL3SMP_E V006 9km Radiometer top 0-5 cm soil moisture)
 * - NASA MODIS (MOD13Q1.061 250m 16-Day NDVI/EVI composite)
 * - DAE / BAMIS (Department of Agricultural Extension official crop calendar)
 */

export const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBengaliNumber(val) {
  if (val === null || val === undefined || val === "") return "";
  return String(val).replace(/[0-9]/g, (d) => BENGALI_DIGITS[Number(d)]);
}

export function getTodayFormattedDate(locale = "en", referenceDate = null) {
  let now;
  if (referenceDate) {
    now = typeof referenceDate === "string" ? new Date(referenceDate) : referenceDate;
  } else if (typeof window === "undefined") {
    // Deterministic timestamp during SSR / prerender prevents Next.js unstable Date() errors
    now = new Date(1794182400000);
  } else {
    now = new Date();
  }
  const day = String(now.getDate()).padStart(2, "0");
  const year = now.getFullYear();

  if (locale === "bn") {
    const monthsBn = [
      "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
      "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
    ];
    return `${toBengaliNumber(day)} ${monthsBn[now.getMonth()]} ${toBengaliNumber(year)}`;
  }

  const monthsEn = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${day} ${monthsEn[now.getMonth()]} ${year}`;
}

export function formatObservationDate(dateStr, locale = "en") {
  if (!dateStr) return getTodayFormattedDate(locale);
  const clean = String(dateStr).split("T")[0];
  if (locale === "bn") {
    const parts = clean.split("-");
    if (parts.length === 3) {
      return toBengaliNumber(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    return toBengaliNumber(clean);
  }
  return clean;
}

export function formatDecimals(num, decimals = 3, locale = "en") {
  if (typeof num !== "number" || isNaN(num)) return "";
  const formatted = num.toFixed(decimals);
  return locale === "bn" ? toBengaliNumber(formatted) : formatted;
}

export function formatIntegerWithCommas(num, locale = "en") {
  if (typeof num !== "number" || isNaN(num)) return "";
  const formatted = Math.round(num).toLocaleString("en-US");
  return locale === "bn" ? toBengaliNumber(formatted) : formatted;
}

/**
 * Verified Offline Snapshots (from server/data/snapshots)
 * Used as reliable fallback when backend is unreachable or offline.
 */
export const VERIFIED_SNAPSHOTS = {
  cumilla: {
    districtCode: "cumilla",
    nameEn: "Cumilla",
    nameBn: "কুমিল্লা",
    smap: {
      soilMoisture: 0.4259,
      observationDate: "2024-01-03",
      qualityFlag: 8,
      unit: "m^3/m^3",
      orbit: "AM",
      quality: "recommended",
      provenance: "SNAPSHOT",
      depth: "Top 0-5 cm",
    },
    modis: {
      ndvi: 0.2865,
      evi: 0.1323,
      observationDate: "2024-01-17",
      qualityClassification: "marginal_data",
      compositeDayOfYear: 28,
      provenance: "16-DAY COMPOSITE",
      cadence: "16-day composite",
      grid: "250m",
    },
    climate: {
      meanAnnualRainfall: 2454.3,
      meanAnnualTemp: 24.97,
      unit: "mm",
      validObservations: 9131,
      yearsUsed: 25,
      period: "2001-2025",
      provenance: "HISTORICAL",
    },
    crops: {
      namesEn: "Transplanted Aman Rice & Boro Rice",
      namesBn: "রোপা আমন ও বোরো ধান",
      season: "Kharif-2 / Rabi",
    },
  },
  chattogram: {
    districtCode: "chattogram",
    nameEn: "Chattogram",
    nameBn: "চট্টগ্রাম",
    smap: {
      soilMoisture: 0.1871,
      observationDate: "2024-01-03",
      qualityFlag: 9,
      unit: "m^3/m^3",
      orbit: "AM",
      quality: "not_recommended",
      provenance: "SNAPSHOT",
      depth: "Top 0-5 cm",
    },
    modis: {
      ndvi: 0.3323,
      evi: 0.1434,
      observationDate: "2024-01-17",
      qualityClassification: "good_data",
      compositeDayOfYear: 28,
      provenance: "16-DAY COMPOSITE",
      cadence: "16-day composite",
      grid: "250m",
    },
    climate: {
      meanAnnualRainfall: 3158.8,
      meanAnnualTemp: 25.53,
      monsoonRainfall2025: 2859.3,
      winterRainfallMean: 34.8,
      unit: "mm",
      validObservations: 9131,
      yearsUsed: 25,
      period: "2001-2025",
      provenance: "HISTORICAL",
    },
    crops: {
      namesEn: "Transplanted Aman Rice & Winter Crops",
      namesBn: "রোপা আমন ও শীতকালীন ফসল",
      season: "Kharif-2 / Rabi",
    },
  },
};

/** Build bilingual headlines from dated, sourced observations and historical baselines only. */
export function generateDistrictHeadlines({
  district = "cumilla",
  climateData = null,
  powerLatest = null,
  gpmData = null,
  smapData = null,
  modisData = null,
  locale = "en",
}) {
  const code = district?.toLowerCase() === "chattogram" ? "chattogram" : "cumilla";
  const snap = VERIFIED_SNAPSHOTS[code];
  const isBn = locale === "bn";
  const label = isBn ? snap.nameBn : snap.nameEn;
  const headlines = [];
  const add = (item) => headlines.push({ district: code, districtLabel: label, isBreaking: false, ...item });
  const smap = smapData || snap.smap;
  const flag = smap.retrievalQualityFlag ?? smap.qualityFlag;
  const smapGood = smap.isRecommendedQuality ?? [0, 8].includes(flag);
  if (smapGood && Number.isFinite(smap.soilMoisture)) {
    const date = smap.dateLabel || smap.observationDate || "date unavailable";
    const value = formatDecimals(smap.soilMoisture, 3, locale);
    const orbit = smap.latestOrbit || smap.orbit || "—";
    add({
      id: code + "-smap-observation", category: "NASA UPDATE", categoryLabel: isBn ? "নাসা পর্যবেক্ষণ" : "NASA OBSERVATION",
      provenance: smap.provenance || (smapData ? "HISTORICAL_DATABASE" : "SNAPSHOT"), dateLabel: date, ingestedAt: smap.ingestedAt || null,
      headline: isBn
        ? "[" + label + "] NASA SMAP SPL3SMP_E: শীর্ষ ০–৫ সেমি মাটিতে " + value + " m³/m³; " + date + ", " + orbit + " অরবিট, মান পতাকা " + (flag ?? "—") + "। এটি ক্ষেত্র-পরিমাপ নয়।"
        : "[" + label + "] NASA SMAP SPL3SMP_E: " + value + " m³/m³ at 0–5 cm depth; observed " + date + ", " + orbit + " orbit, quality flag " + (flag ?? "—") + ". Regional satellite estimate.",
      dataset: "NASA SMAP SPL3SMP_E V006", href: "/soil-moisture",
    });
  } else if (Number.isFinite(smap.soilMoisture)) {
    const date = smap.dateLabel || smap.observationDate || "date unavailable";
    add({
      id: code + "-smap-quality", category: "NASA UPDATE", categoryLabel: isBn ? "মান সতর্কতা" : "QUALITY NOTICE",
      provenance: smap.provenance || (smapData ? "HISTORICAL_DATABASE" : "SNAPSHOT"), dateLabel: date, ingestedAt: smap.ingestedAt || null,
      headline: isBn
        ? "[" + label + "] NASA SMAP SPL3SMP_E: " + date + " পর্যবেক্ষণটি সুপারিশকৃত মানে নয় (পতাকা " + (flag ?? "—") + "); মানটি নির্ভরযোগ্য মাটির আর্দ্রতা হিসেবে দেখানো হচ্ছে না।"
        : "[" + label + "] NASA SMAP SPL3SMP_E: the " + date + " observation is not recommended quality (flag " + (flag ?? "—") + "); its measurement is omitted from the reliable-value headline.",
      dataset: "NASA SMAP SPL3SMP_E V006", href: "/soil-moisture",
    });
  }

  const modis = modisData || snap.modis;
  if (Number.isFinite(modis.ndvi) && Number.isFinite(modis.evi)) {
    const date = modis.dateLabel || modis.observationDate || "date unavailable";
    const quality = modis.qualityClassification || (modis.pixelReliability === 0 ? "good_data" : "marginal_data");
    add({
      id: code + "-modis-veg", category: "NASA UPDATE", categoryLabel: isBn ? "নাসা পর্যবেক্ষণ" : "NASA OBSERVATION",
      provenance: modis.provenance || (modisData ? "HISTORICAL_DATABASE" : "SNAPSHOT"), dateLabel: date, ingestedAt: modis.ingestedAt || null,
      headline: isBn
        ? "[" + label + "] NASA MODIS MOD13Q1.061: NDVI " + formatDecimals(modis.ndvi, 3, locale) + ", EVI " + formatDecimals(modis.evi, 3, locale) + "; " + date + ", " + quality + " মান (২৫০ মিটার, ১৬-দিনের কম্পোজিট)।"
        : "[" + label + "] NASA MODIS MOD13Q1.061: NDVI " + formatDecimals(modis.ndvi, 3, locale) + ", EVI " + formatDecimals(modis.evi, 3, locale) + "; " + date + ", " + quality + " quality (250 m, 16-day composite).",
      dataset: "NASA MODIS MOD13Q1.061", href: "/vegetation",
    });
  }

  if (gpmData?.latestDailySummary) {
    const day = gpmData.latestDailySummary;
    const complete = day.completeness === "complete" && day.validIntervals === 48;
    const total = complete ? formatDecimals(day.totalPrecipitationMm, 2, locale) + " mm" : (isBn ? "অসম্পূর্ণ দিন; " + toBengaliNumber(day.validIntervals) + "/৪৮ ব্যবধান, মোট প্রকাশ করা হয়নি" : "incomplete day; " + day.validIntervals + "/48 intervals, total withheld");
    add({
      id: code + "-gpm-rainfall", category: "NASA UPDATE", categoryLabel: isBn ? "নাসা পর্যবেক্ষণ" : "NASA OBSERVATION",
      provenance: gpmData.provenance || "HISTORICAL_DATABASE", dateLabel: day.dateLabel, ingestedAt: gpmData.latestInterval?.ingestedAt || null,
      headline: isBn
        ? "[" + label + "] NASA GPM IMERG Final V07: " + day.dateLabel + "-এর বৃষ্টিপাত " + total + " (বৈধ ব্যবধান " + toBengaliNumber(day.validIntervals) + "/৪৮; প্রায় ১০ কিমি গ্রিড)।"
        : "[" + label + "] NASA GPM IMERG Final V07: " + day.dateLabel + " rainfall " + total + " (" + day.validIntervals + "/48 valid half-hour intervals; ~10 km grid).",
      dataset: "NASA GPM IMERG Final V07", href: "/rainfall",
    });
  }

  const power = powerLatest?.observations || {};
  const rain = power.PRECTOTCORR;
  const temp = power.T2M;
  if (rain || temp) {
    const date = rain?.observationDate || temp?.observationDate || "date unavailable";
    add({
      id: code + "-power-latest", category: "DAILY CLIMATE", categoryLabel: isBn ? "ঐতিহাসিক জলবায়ু" : "HISTORICAL CLIMATE",
      provenance: powerLatest?.provenance || "HISTORICAL_DATABASE", dateLabel: date, ingestedAt: rain?.ingestedAt || temp?.ingestedAt || null,
      headline: isBn
        ? "[" + label + "] NASA POWER ঐতিহাসিক দৈনিক উপাত্ত (" + date + " LST): বৃষ্টিপাত " + (rain ? formatDecimals(rain.value, 1, locale) + " mm" : "—") + ", তাপমাত্রা " + (temp ? formatDecimals(temp.value, 1, locale) + "°C" : "—") + "। এটি পূর্বাভাস নয়।"
        : "[" + label + "] NASA POWER historical daily values (" + date + " LST): precipitation " + (rain ? formatDecimals(rain.value, 1, locale) + " mm" : "unavailable") + ", temperature " + (temp ? formatDecimals(temp.value, 1, locale) + "°C" : "unavailable") + ". Not a forecast.",
      dataset: "NASA POWER Daily Agroclimatology", href: "/climate",
    });
  }

  const rainMean = climateData?.rainfall?.annual_historical?.mean ?? snap.climate.meanAnnualRainfall;
  const tempMean = climateData?.temperature?.annual_historical?.mean ?? snap.climate.meanAnnualTemp;
  add({
    id: code + "-climate-baseline", category: "KRISHI UPDATE", categoryLabel: isBn ? "জলবায়ু ভিত্তিরেখা" : "CLIMATE BASELINE",
    provenance: climateData?.provenance || "SNAPSHOT", dateLabel: snap.climate.period,
    headline: isBn
      ? "[" + label + "] NASA POWER " + snap.climate.period + " ঐতিহাসিক ভিত্তিরেখা: গড় বার্ষিক বৃষ্টিপাত " + formatIntegerWithCommas(rainMean, locale) + " মিমি; গড় তাপমাত্রা " + formatDecimals(tempMean, 1, locale) + "°C। পূর্বাভাস নয়।"
      : "[" + label + "] NASA POWER " + snap.climate.period + " historical baseline: mean annual rainfall " + formatIntegerWithCommas(rainMean, locale) + " mm and mean temperature " + formatDecimals(tempMean, 1, locale) + "°C. Not a forecast.",
    dataset: "NASA POWER Historical Reanalysis", href: "/climate",
  });

  {
    const cropNames = isBn ? snap.crops.namesBn : snap.crops.namesEn;
    add({
      id: code + "-crop-calendar", category: "CROP GUIDELINES", categoryLabel: isBn ? "শস্য নির্দেশিকা" : "CROP GUIDELINES",
      provenance: "BAMIS / DAE", dateLabel: "Official crop calendar",
      headline: isBn ? "[" + label + "] BAMIS / DAE-এর প্রকাশিত শস্য ক্যালেন্ডার ও মৌসুমভিত্তিক নির্দেশিকা দেখুন: " + cropNames + "।" : "[" + label + "] Consult the published BAMIS / DAE crop calendar and seasonal guidance for " + cropNames + ".",
      dataset: "DAE / BAMIS Official Calendar", href: "/crop-calendar",
    });
  }
  return headlines;
}
