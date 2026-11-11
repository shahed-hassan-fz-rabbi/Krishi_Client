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
        const observation = latestRes.data;
        const recommended = Number.isFinite(observation.soilMoisture)
          && observation.soilMoisture >= 0 && observation.soilMoisture <= 1
          && observation.isRecommendedQuality === true
          && [0, 8].includes(observation.retrievalQualityFlag);
        onOverview?.("smap", {
          districtCode,
          status: recommended ? "recommended" : "quality-excluded",
          recommended,
          value: recommended ? observation.soilMoisture : null,
          flag: observation.retrievalQualityFlag ?? null,
          date: observation.dateLabel || null,
        });
      } else {
        setLatestData(null);
        onOverview?.("smap", { districtCode, status: "unavailable", recommended: false, value: null, date: null });
      }

      if (historyRes.success && historyRes.data) {
        setHistoryData(historyRes.data);
      } else {
        setHistoryData(null);
      }
    } catch (err) {
      if (latestDistrictRef.current === districtCode) {
        onOverview?.("smap", { districtCode, status: "unavailable", recommended: false, value: null, date: null });
        setError(err.message || "Failed to load soil moisture intelligence");
      }
    } finally {
      if (latestDistrictRef.current === districtCode) {
        setIsLoading(false);
      }
    }
  }, [onOverview]);

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
            <Badge variant="neutral">NASA SMAP SPL3SMP_E V006</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {isBn
              ? "নাসা এসএমএপি স্যাটেলাইট থেকে প্রাপ্ত শীর্ষ ৫ সেমি ভলিউমেট্রিক মাটির আর্দ্রতা ও গুণমান ফ্ল্যাগ বিশ্লেষণ"
              : "Topsoil (~5 cm) volumetric moisture and retrieval quality bitmask from NASA SMAP enhanced radiometer observations."}
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

      {/* Scientific Transparency Disclosures */}
      <div className="space-y-2">
        <div className="rounded-xl border border-line bg-surface-2 p-4 text-xs text-ink-muted">
          <div className="flex items-start gap-2.5">
            <Info size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-emerald" />
            <div className="space-y-1">
              <span className="font-semibold text-ink">
                {isBn ? "রেডিওমিটার রেজোলিউশন ও ফুটপ্রিন্ট ঘোষণা:" : "Radiometer Footprint & Spatial Resolution Disclosure:"}
              </span>
              <p>
                {isBn
                  ? "এসএমএপি (SMAP) এল-ব্যান্ড রেডিওমিটারের প্রকৃত আদি ফুটপ্রিন্ট প্রায় ৩৬–৪০ কিমি, যা ব্যাকাস-গিলবার্ট (Backus-Gilbert) অপ্টিমাল ইন্টারপোলেশনের মাধ্যমে ৯ কিমি EASE-Grid 2.0 গ্রিডে পোস্ট করা হয়েছে। এটি কোনো ৯ কিমি স্বাধীন ইন-সিটু সেন্সর পরিমাপ নয় এবং এটি রুট-জোন (শিকড় অঞ্চল) আর্দ্রতা নির্দেশ করে না। এটি শীর্ষ ~৫ সেমি মাটির আঞ্চলিক স্যাটেলাইট প্রক্সি।"
                  : "NASA SMAP L-band radiometer has a native physical footprint of approximately ~36 km, posted onto a 9 km EASE-Grid 2.0 through Backus-Gilbert optimal interpolation. It is NOT an independent 9 km field-level sensor measurement and does NOT measure root-zone soil moisture."}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber/30 bg-amber/5 p-3 text-xs text-ink-muted">
          <div className="flex items-start gap-2">
            <CalendarRange size={15} strokeWidth={1.8} className="mt-0.5 shrink-0 text-amber-600" />
            <p>
              {isBn
                ? "এটি মাটির উপরিভাগের আঞ্চলিক স্যাটেলাইট পর্যবেক্ষণ—আপনার জমির সরাসরি মাপ বা শিকড়ের গভীরের আর্দ্রতা নয়। মান-যাচাইয়ে না টিকলে মানটি দেখানো হয় না।"
                : "This is a regional satellite observation of surface soil, not a direct measurement of your field or root-zone moisture. Values that fail the quality gate are withheld."}
            </p>
          </div>
        </div>
      </div>

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
            <p className="mt-4 text-xs text-ink-muted">{isBn ? "NASA SMAP SPL3SMP_E V006 · উপরিভাগের আর্দ্রতা" : "NASA SMAP SPL3SMP_E V006 · surface soil moisture"}</p>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Latest Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardBody className="space-y-1">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>{isBn ? "সর্বশেষ আর্দ্রতা" : "Latest Volumetric Moisture"}</span>
                  <Droplets size={16} strokeWidth={1.8} className="text-emerald" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-ink">
                    {recommendedLatest ? latestData.soilMoisture : "—"}
                  </span>
                  <span className="text-xs text-ink-muted">m³/m³</span>
                </div>
                <div className="text-xs text-ink-muted">
                  {recommendedLatest ? `${isBn ? "পর্যবেক্ষণ:" : "Observed:"} ${latestData.dateLabel || "—"} (${latestData.latestOrbit || "—"})` : (isBn ? `মান-যাচাইয়ে উত্তীর্ণ নয় · ফ্ল্যাগ ${latestData?.retrievalQualityFlag ?? "—"}` : `Quality gate not met · flag ${latestData?.retrievalQualityFlag ?? "—"}`)}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="space-y-1">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>{isBn ? "সকাল পর্যবেক্ষণ (AM)" : "Morning Pass (AM ~06:00)"}</span>
                  <Sun size={16} strokeWidth={1.8} className="text-amber-500" />
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
                      <ShieldCheck size={12} /> {isBn ? "সুপারিশকৃত মান (Flag 8)" : "Recommended (Flag 8)"}
                    </span>
                  ) : latestData?.orbits?.am?.soilMoisture != null ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                      <ShieldAlert size={12} /> {isBn ? "সুপারিশহীন (not_recommended, Flag 9)" : "Not recommended (Flag 9)"}
                    </span>
                  ) : (
                    <span className="text-ink-muted">{isBn ? "সোয়াথ গ্যাপ" : "Swath boundary gap"}</span>
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
                      {isBn ? "এসএমএপি স্যাটেলাইট রেকর্ড ও গুণমান বিশ্লেষণ" : "SMAP Observation Records & QA Bitmask Breakdown"}
                    </h2>
                    <p className="text-xs text-ink-muted">
                      {districtName} — {historyData.from} {isBn ? "থেকে" : "to"} {historyData.to}
                    </p>
                  </div>
                  <Badge variant="neutral">9 km EASE-Grid 2.0</Badge>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <Table>
                  <THead>
                    <TR>
                      <TD className="font-semibold">{isBn ? "তারিখ" : "Date (LST/UTC)"}</TD>
                      <TD className="font-semibold">{isBn ? "অরবিট" : "Orbit"}</TD>
                      <TD className="font-semibold">{isBn ? "ভলিউমেট্রিক আর্দ্রতা" : "Volumetric Moisture"}</TD>
                      <TD className="font-semibold">{isBn ? "কোয়ালিটি ফ্ল্যাগ" : "Quality Flag"}</TD>
                      <TD className="font-semibold">{isBn ? "নাসা ইউজার গাইড ডিকোডিং" : "NASA V006 Bitmask Decoding"}</TD>
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
                            Flag {row.qualityFlag}
                          </Badge>
                        </TD>
                        <TD className="text-xs">
                          {row.qualityFlag === 8 ? (
                            <span className="text-emerald">
                              {isBn
                                ? "সুপারিশকৃত মান: রিট্রিভাল সফল ও সুপারিশকৃত (Bit 0=0, Bit 1=0, Bit 2=0, Bit 3=1)"
                                : "Recommended: Retrieval attempted, successful, quality recommendation met (Bit 0=0)"}
                            </span>
                          ) : row.qualityFlag === 9 ? (
                            <span className="text-amber-700 dark:text-amber-400">
                              {isBn
                                ? "সতর্কবার্তা: রিট্রিভাল সফল, তবে গুণমানের শর্ত পূরণ হয়নি (Bit 0=1; পানি/উপকূলীয় প্রভাব)"
                                : "Not recommended: Attempted and successful, but quality recommendation not met (Bit 0=1)"}
                            </span>
                          ) : (
                            <span className="text-ink-muted">
                              {isBn ? "সোয়াথ বহির্ভূত পিক্সেল" : "Inactive swath boundary cell"}
                            </span>
                          )}
                        </TD>
                        <TD className="text-xs text-ink-muted">
                          {row.surfaceFlag === 128
                            ? isBn ? "স্বাভাবিক কৃষিজমি (Flag 128; Bit 7 ক্রান্তীয় ফলস-ফ্রস্ট)" : "Nominal cropland (Flag 128; Bit 7 low-lat false freeze)"
                            : row.surfaceFlag === 143
                            ? isBn ? "উপকূল/পানি/নগর মিশ্রণ (Flag 143; Bits 0,1,2,3,7)" : "Water/Coastal/Urban mix (Flag 143; Bits 0,1,2,3,7)"
                            : `Flag ${row.surfaceFlag}`}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </CardBody>
            </Card>
          )}
          {observedHistoryDates.length > 0 && <p className="text-xs text-ink-muted">{isBn ? "উপলভ্য পর্যবেক্ষণ:" : "Available observations:"} {observedHistoryDates[0]} – {observedHistoryDates[observedHistoryDates.length - 1]}</p>}
        </>
      )}
    </section>
  );
}
