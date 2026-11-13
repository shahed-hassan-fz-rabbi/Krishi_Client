"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarRange,
  ChevronDown,
  Droplets,
  Info,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Sunset,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";

import { Badge } from "@/components/ui/Badge.js";
import { Card, CardBody, CardHeader } from "@/components/ui/Card.js";
import { ErrorState, LoadingState } from "@/components/ui/States.js";
import { Table, TBody, TD, THead, TR } from "@/components/ui/Table.js";
import { Tooltip } from "@/components/ui/Tooltip.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import {
  fetchSoilMoistureHistory,
  fetchSoilMoistureLatest,
} from "@/services/api.js";

export default function SoilMoistureSection({ embedded = false, refreshToken = 0, onOverview }) {
  const { t, locale } = useLang();
  const observationDate = value => {
    if (!value) return "—";
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {day: "numeric", month: "long", year: "numeric", timeZone: "UTC"}).format(date);
  };

  const { selectedDistrict, setSelectedDistrict, districts, currentDistrictObj } = useLocation();

  const [latestData, setLatestData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const latestDistrictRef = useRef(selectedDistrict);

  const isBn = locale === "bn";

  const loadSoilMoistureData = useCallback(async (districtCode) => {
    latestDistrictRef.current = districtCode;
    setIsLoading(true);
    setError(null);
    setLatestData(null);
    setHistoryData(null);
    onOverview?.("smap", { districtCode, status: "loading", recommended: false, value: null, date: null });
    const currentYear = new Date().getUTCFullYear();
    const toDate = new Date().toISOString().slice(0, 10);
    const fromDate = `${currentYear - 5}-01-01`;
    try {
      const [latestRes, historyRes] = await Promise.all([
        fetchSoilMoistureLatest(districtCode),
        fetchSoilMoistureHistory(districtCode, fromDate, toDate),
      ]);

      if (latestDistrictRef.current !== districtCode) return;

      if (latestRes.success && latestRes.data) {
        setLatestData(latestRes.data);
      } else {
        setLatestData(null);
      }

      if (historyRes.success && historyRes.data) {
        setHistoryData(historyRes.data);
      } else {
        setHistoryData(null);
      }
    } catch (err) {
      if (latestDistrictRef.current === districtCode) {
        setError(err.message || "Failed to load soil moisture intelligence");
      }
    } finally {
      if (latestDistrictRef.current === districtCode) {
        setIsLoading(false);
      }
    }
  }, [onOverview]);

  useEffect(() => {
    if (isLoading || latestDistrictRef.current !== selectedDistrict) return;
    const observation = latestData;
    const recommended = !error && Number.isFinite(observation?.soilMoisture)
      && observation.soilMoisture >= 0 && observation.soilMoisture <= 1
      && observation.isRecommendedQuality === true
      && [0, 8].includes(observation.retrievalQualityFlag);
    onOverview?.("smap", {
      districtCode: selectedDistrict,
      status: error || !observation ? "unavailable" : (recommended ? "recommended" : "quality-excluded"),
      recommended,
      value: recommended ? observation.soilMoisture : null,
      flag: observation?.retrievalQualityFlag ?? null,
      date: observation?.dateLabel || null,
    });
  }, [error, isLoading, latestData, onOverview, selectedDistrict]);

  useEffect(() => {
    if (selectedDistrict) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadSoilMoistureData(selectedDistrict);
    }
  }, [selectedDistrict, refreshToken, loadSoilMoistureData]);

  const recommendedLatest = latestData
    && Number.isFinite(latestData.soilMoisture)
    && latestData.soilMoisture >= 0 && latestData.soilMoisture <= 1
    && latestData.isRecommendedQuality === true
    && [0, 8].includes(latestData.retrievalQualityFlag);
  const observedHistoryDates = (historyData?.series || []).map((row) => row.date).filter(Boolean).sort();

  const districtName = isBn ? currentDistrictObj?.nameBn || selectedDistrict : currentDistrictObj?.nameEn || selectedDistrict;

  const Heading = embedded ? "h2" : "h1";

  return (
    <section id={embedded ? "soil-moisture" : undefined} aria-labelledby={embedded ? "soil-section-title" : undefined} className="scroll-mt-24 space-y-5">
      {/* Page Header with District Selector & Provenance Status */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Heading id={embedded ? "soil-section-title" : undefined} className="text-xl font-bold tracking-tight text-ink font-heading sm:text-2xl">
              {isBn ? "মাটির উপরিভাগের আর্দ্রতা" : "Surface soil moisture"}
            </Heading>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {t("soilSimple.intro")}
          </p>
        </div>

        {/* District Switcher */}
        <div className="flex items-center gap-3">
          {!embedded && <>
          <div className="relative">
            <label htmlFor="soil-district-select" className="sr-only">
              {isBn ? "জেলা নির্বাচন করুন" : "Select District"}
            </label>
            <MapPin
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
              size={15}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <select
              id="soil-district-select"
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
          </>}

          <button
            type="button"
            onClick={() => loadSoilMoistureData(selectedDistrict)}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface-2"
            title={isBn ? "উপাত্ত রিফ্রেশ করুন" : "Refresh data"}
          >
            <RefreshCw size={14} strokeWidth={1.8} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{isBn ? "রিফ্রেশ" : "Refresh"}</span>
          </button>
        </div>
      </div>

      <p className="rounded-xl border border-line bg-surface-2/40 px-4 py-3 text-sm leading-6 text-muted">{t("soilSimple.note")}</p>

      {isLoading ? (
        <LoadingState message={isBn ? "মাটির আর্দ্রতা উপাত্ত লোড হচ্ছে..." : "Loading soil moisture intelligence..."} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadSoilMoistureData(selectedDistrict)} />
      ) : !latestData ? (
        <Card>
          <CardBody className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-surface-2 text-ink-muted">
              <Droplets size={24} strokeWidth={1.8} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-ink">
              {isBn ? "সুপারিশকৃত মান পাওয়া যায়নি" : "No recommended observation available"}
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-ink-muted">
              {isBn
                ? "এই জেলার জন্য মান-যাচাই করা মাটির আর্দ্রতার পর্যবেক্ষণ এখন দেখানোর মতো নেই। এটি শূন্য আর্দ্রতা বোঝায় না। পরে আবার চেষ্টা করুন বা অন্য জেলা বেছে নিন।"
                : "There is no quality-approved soil-moisture observation to show for this district right now. This does not mean zero moisture. Try again later or choose another district."}
            </p>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Latest Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="h-full border-sky-200 bg-sky-50/60 dark:border-sky-900 dark:bg-sky-950/20">
              <CardBody className="space-y-2">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>{isBn ? "সর্বশেষ আর্দ্রতা" : "Latest Volumetric Moisture"}</span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300"><Droplets size={22} strokeWidth={1.8} aria-hidden="true" /></span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-ink">
                    {recommendedLatest ? latestData.soilMoisture : "—"}
                  </span>
                  <span className="text-xs text-ink-muted">m³/m³</span>
                </div>
                <div className="text-xs text-ink-muted">
                  {recommendedLatest ? `${isBn ? "পর্যবেক্ষণ:" : "Observed:"} ${latestData.dateLabel || "—"} (${latestData.latestOrbit || "—"})` : (t("observationSimple.unverified"))}
                </div>
              </CardBody>
            </Card>

            <Card className="h-full border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20">
              <CardBody className="space-y-2">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>{isBn ? "সকাল পর্যবেক্ষণ (AM)" : "Morning Pass (AM ~06:00)"}</span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"><Sun size={22} strokeWidth={1.8} aria-hidden="true" /></span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-ink">
                    {latestData?.orbits?.am?.isRecommended && [0, 8].includes(latestData?.orbits?.am?.qualityFlag) && Number.isFinite(latestData?.orbits?.am?.soilMoisture)
                      ? latestData.orbits.am.soilMoisture
                      : "—"}
                  </span>
                  <span className="text-xs text-ink-muted">m³/m³</span>
                </div>
                <div className="text-xs">
                  {latestData?.orbits?.am?.isRecommended ? (
                    <span className="inline-flex items-center gap-1 text-emerald font-medium">
                      <ShieldCheck size={12} /> {t("observationSimple.passed")}
                    </span>
                  ) : latestData?.orbits?.am?.soilMoisture != null ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                      <ShieldAlert size={12} /> {t("observationSimple.unverified")}
                    </span>
                  ) : (
                    <span className="text-ink-muted">{t("observationSimple.missing")}</span>
                  )}
                </div>
              </CardBody>
            </Card>

          </div>

          {/* Observation Details Table with Detailed QA Bit Explanations */}
          {historyData?.series && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-ink">
                      {isBn ? "মাটির আর্দ্রতার আগের রেকর্ড" : "Earlier soil moisture records"}
                    </h2>
                    <p className="text-xs text-ink-muted">
                      {districtName} — {historyData.from} {isBn ? "থেকে" : "to"} {historyData.to}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <Table>
                  <THead>
                    <TR>
                      <TD className="font-semibold">{isBn ? "তারিখ" : "Date (LST/UTC)"}</TD>
                      <TD className="font-semibold">{isBn ? "অরবিট" : "Orbit"}</TD>
                      <TD className="font-semibold">{isBn ? "ভলিউমেট্রিক আর্দ্রতা" : "Volumetric Moisture"}</TD>
                      <TD className="font-semibold">{t("observationSimple.quality")}</TD>
                      <TD className="font-semibold">{isBn ? "যাচাইয়ের ফল" : "Check result"}</TD>
                      <TD className="font-semibold">{isBn ? "সারফেস ফ্ল্যাগ" : "Surface Condition"}</TD>
                    </TR>
                  </THead>
                  <TBody>
                    {historyData.series.map((row, i) => (
                      <TR key={`${row.date}-${row.orbit}-${i}`}>
                        <TD className="font-medium">{row.date}</TD>
                        <TD>
                          <span className="font-mono text-xs">{row.orbit}</span>
                        </TD>
                        <TD className="font-mono font-medium">
                          {row.soilMoisture !== null ? `${row.soilMoisture} m³/m³` : (
                            <span className="text-ink-muted">Swath Gap (-9999.0)</span>
                          )}
                        </TD>
                        <TD>
                          <Badge variant={row.qualityFlag === 8 ? "success" : row.qualityFlag === 9 ? "warning" : "neutral"}>
                            {t([0, 8].includes(row.qualityFlag) ? "observationSimple.passed" : "observationSimple.unverified")}
                          </Badge>
                        </TD>
                        <TD className="text-xs">
                          {t([0, 8].includes(row.qualityFlag) ? "observationSimple.passed" : "observationSimple.unverified")}
                        </TD>
                        <TD className="text-xs text-ink-muted">
                          {row.surfaceFlag === 128
                            ? isBn ? "কৃষিজমি হিসেবে চিহ্নিত" : "Classified as cropland"
                            : row.surfaceFlag === 143
                            ? isBn ? "পানি, উপকূল বা বসতির মিশ্র এলাকা" : "Mixed water, coastal or built-up area"
                            : t("farmUi.notRecorded")}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </CardBody>
            </Card>
          )}
          {observedHistoryDates.length > 0 && <p className="text-xs text-ink-muted">{t("observationSimple.period")} {observationDate(observedHistoryDates[0])} – {observationDate(observedHistoryDates[observedHistoryDates.length - 1])}</p>}
        </>
      )}
    </section>
  );
}
