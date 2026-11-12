"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  CalendarRange,
  ChevronDown,
  Info,
  Layers,
  Leaf,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
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
  fetchVegetationHistory,
  fetchVegetationLatest,
} from "@/services/api.js";

export default function VegetationSection({ embedded = false, refreshToken = 0, onOverview }) {
  const { t, locale } = useLang();
  const { selectedDistrict, setSelectedDistrict, districts, currentDistrictObj } =
    useLocation();

  const [latestData, setLatestData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const latestDistrictRef = useRef(selectedDistrict);

  const isBn = locale === "bn";

  const loadVegetationData = useCallback(async (districtCode) => {
    latestDistrictRef.current = districtCode;
    setIsLoading(true);
    setError(null);
    setLatestData(null);
    setHistoryData(null);
    onOverview?.("modis", { districtCode, status: "loading", reliable: false, ndvi: null, evi: null, date: null });
    const currentYear = new Date().getUTCFullYear();
    const toDate = new Date().toISOString().slice(0, 10);
    const fromDate = `${currentYear - 5}-01-01`;
    try {
      const [latestRes, historyRes] = await Promise.all([
        fetchVegetationLatest(districtCode),
        fetchVegetationHistory(districtCode, fromDate, toDate),
      ]);

      if (latestDistrictRef.current !== districtCode) return;

      if (latestRes.success && latestRes.data) {
        setLatestData(latestRes.data);
      } else {
        setLatestData(null);
      }
      if (historyRes.success) setHistoryData(historyRes.data);
    } catch (err) {
      if (latestDistrictRef.current !== districtCode) return;
      setError(err.message || (isBn ? "উপাত্ত লোড করতে ব্যর্থ" : "Failed to load vegetation data"));
    } finally {
      if (latestDistrictRef.current === districtCode) {
        setIsLoading(false);
      }
    }
  }, [isBn, onOverview]);

  useEffect(() => {
    if (isLoading || latestDistrictRef.current !== selectedDistrict) return;
    const observation = latestData;
    const reliable = !error && observation?.isReliableQuality === true
      && observation.pixelReliability === 0
      && Number.isFinite(observation.ndvi) && observation.ndvi >= -0.2 && observation.ndvi <= 1;
    const evi = reliable && Number.isFinite(observation?.evi) && observation.evi >= -0.2 && observation.evi <= 1
      ? observation.evi
      : null;
    onOverview?.("modis", {
      districtCode: selectedDistrict,
      status: error || !observation ? "unavailable" : (reliable ? "good-quality" : "quality-excluded"),
      reliable,
      ndvi: reliable ? observation.ndvi : null,
      evi,
      date: observation?.dateLabel || null,
    });
  }, [error, isLoading, latestData, onOverview, selectedDistrict]);

  useEffect(() => {
    if (selectedDistrict) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadVegetationData(selectedDistrict);
    }
  }, [selectedDistrict, refreshToken, loadVegetationData]);

  const reliableLatest = latestData?.isReliableQuality === true
    && latestData?.pixelReliability === 0
    && Number.isFinite(latestData?.ndvi) && latestData.ndvi >= -0.2 && latestData.ndvi <= 1;

  const districtName = isBn ? currentDistrictObj?.nameBn : currentDistrictObj?.nameEn;

  const Heading = embedded ? "h2" : "h1";

  return (
    <section id={embedded ? "vegetation" : undefined} aria-labelledby={embedded ? "vegetation-section-title" : undefined} className="scroll-mt-24 space-y-5">
      {/* Page Header with District Selector & NASA Provenance */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Heading id={embedded ? "vegetation-section-title" : undefined} className="text-xl font-bold tracking-tight text-ink font-heading sm:text-2xl">
              {isBn ? "ফসলের সবুজত্বের সূচক" : "Vegetation greenness index"}
            </Heading>
            <Badge variant="neutral">NASA MODIS MOD13Q1.061</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {isBn
              ? "নাসা টেরা স্যাটেলাইট থেকে প্রাপ্ত ২৫০ মিটার ১৬-দিনের কম্পোজিট এনডিভিআই (NDVI) ও ইভিআই (EVI) উদ্ভিজ্জ সূচক"
              : "250m 16-day composite Normalized Difference (NDVI) & Enhanced Vegetation Index (EVI) from NASA Terra MODIS."}
          </p>
        </div>

        {/* District Switcher */}
        <div className="flex items-center gap-3">
          {!embedded && <>
          <div className="relative">
            <label htmlFor="veg-district-select" className="sr-only">
              {isBn ? "জেলা নির্বাচন করুন" : "Select District"}
            </label>
            <MapPin
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
              size={15}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <select
              id="veg-district-select"
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
            onClick={() => loadVegetationData(selectedDistrict)}
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
              <span className="font-semibold text-ink">{isBn ? "এই মানের অর্থ:" : "What this measure means:"}</span>
              <p>
                {isBn
                  ? "এগুলো উপগ্রহের ছবিতে গাছপালা কতটা সবুজ দেখা যায় তা বোঝায়। ফলন, রোগ বা পোকা আক্রমণের সরাসরি পরীক্ষা নয়।"
                  : "These indices describe how green vegetation appears in the satellite image. They do not directly measure yield, disease, or pest damage."}
              </p>
            </div>
          </div>
        </div>

        <details className="rounded-xl border border-line bg-surface px-4 py-3 text-xs text-ink-muted">
          <summary className="cursor-pointer font-medium text-ink">{isBn ? "উপাত্ত সম্পর্কে আরও জানুন" : "More about this dataset"}</summary>
          <p className="mt-2 leading-6">{isBn ? "MODIS MOD13Q1.061 প্রায় ২৫০ মিটার পিক্সেলের ১৬-দিনের কম্পোজিট। ভালো মানের পিক্সেল র‍্যাঙ্ক ০ দিয়ে চিহ্নিত।" : "MODIS MOD13Q1.061 provides 16-day composites at about 250 m. Rank 0 is the product's good-quality pixel class."}</p>
        </details>

        <div className="rounded-xl border border-emerald/30 bg-emerald/5 p-3 text-xs text-ink-muted">
          <div className="flex items-start gap-2">
            <Layers size={15} strokeWidth={1.8} className="mt-0.5 shrink-0 text-emerald" />
            <p>
              {isBn
                ? "মান যাচাই: এই পণ্যে র‍্যাঙ্ক ০-কে ভালো মান হিসেবে ধরা হয়েছে। এখানে দেখানো সুপারিশকৃত মানে অন্য র‍্যাঙ্ক ব্যবহার করা হয় না। এই যাচাই ফসলের স্বাস্থ্য নির্ণয় করে না।"
                : "Quality check: rank 0 is classified as good quality for this product. Other ranks are not used for the recommended value shown here; this check does not diagnose crop health."}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message={isBn ? "উদ্ভিজ্জ উপাত্ত লোড হচ্ছে..." : "Loading vegetation intelligence..."} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadVegetationData(selectedDistrict)} />
      ) : !latestData ? (
        <Card>
          <CardBody className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-surface-2 text-ink-muted">
              <Leaf size={24} strokeWidth={1.8} className="text-emerald" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-ink">
              {isBn ? "নির্ভরযোগ্য পর্যবেক্ষণ পাওয়া যায়নি" : "No good-quality observation available"}
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-ink-muted">
              {isBn
                ? "এই জেলার জন্য মান-যাচাই করা উদ্ভিজ্জ সূচক এখন দেখানোর মতো নেই। এটি ফসল নেই বা ফসল খারাপ—এমন প্রমাণ নয়। পরে আবার চেষ্টা করুন বা অন্য জেলা বেছে নিন।"
                : "There is no quality-approved vegetation index to show for this district right now. This does not mean there are no crops or that crop condition is poor. Try again later or choose another district."}
            </p>
            <p className="mt-4 text-xs text-ink-muted">NASA MODIS MOD13Q1.061 · 16-day vegetation composite</p>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Latest Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardBody className="space-y-1">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>{isBn ? "সর্বশেষ এনডিভিআই (NDVI)" : "Latest NDVI Index"}</span>
                  <Leaf size={16} strokeWidth={1.8} className="text-emerald" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-ink">
                    {reliableLatest ? latestData.ndvi : "—"}
                  </span>
                  <span className="text-xs text-ink-muted">Index</span>
                </div>
                <div className="text-xs text-ink-muted">
                  <span className="text-ink-muted">{latestData?.dateLabel || "—"}</span>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="space-y-1">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>{isBn ? "এনহ্যান্সড ভেজিটেশন (EVI)" : "Enhanced Veg Index (EVI)"}</span>
                  <Sparkles size={16} strokeWidth={1.8} className="text-blue-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-ink">
                    {reliableLatest && Number.isFinite(latestData?.evi) ? latestData.evi : "—"}
                  </span>
                  <span className="text-xs text-ink-muted">Index</span>
                </div>
                <div className="text-xs text-ink-muted">
                  {isBn ? "বায়ুমণ্ডলীয় অ্যারোসল সংশোধিত" : "Aerosol & Soil Corrected"}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="space-y-1">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>{isBn ? "পিক্সেল নির্ভরযোগ্যতা" : "Pixel Reliability"}</span>
                  <Activity size={16} strokeWidth={1.8} className="text-emerald" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-ink">
                    {isBn ? "র‍্যাঙ্ক" : "Rank"} {latestData?.pixelReliability ?? "—"}
                  </span>
                </div>
                <div className="text-xs">
                  {reliableLatest ? (
                    <span className="inline-flex items-center gap-1 text-emerald font-medium">
                      <ShieldCheck size={12} /> {isBn ? "নির্ভরযোগ্য (Good Data)" : "Reliable (Good Data)"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                      <ShieldAlert size={12} /> {isBn ? "সতর্কতা প্রয়োজন (Marginal/Cloud)" : "Marginal / Cloud mask"}
                    </span>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="space-y-1">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>{isBn ? "কম্পোজিট সংগ্রহের দিন (DOY)" : "Composite DOY"}</span>
                  <CalendarRange size={16} strokeWidth={1.8} className="text-emerald" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-ink">
                    {isBn ? "দিন" : "Day"} {latestData?.compositeDayOfYear ?? "—"}
                  </span>
                </div>
                <div className="text-xs text-ink-muted">
                  {isBn ? "১৬-দিনের সেরা পর্যবেক্ষণ" : "Best observation in 16-day window"}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Time Series Area Chart */}
          {historyData?.series && historyData.series.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-ink">
                      {isBn ? "ক্যানোপি গ্রিননেস পরিবর্তন ধারা (NDVI ও EVI)" : "Canopy Greenness Dynamics (NDVI & EVI)"}
                    </h2>
                    <p className="text-xs text-ink-muted">
                      {districtName} — {historyData.from} {isBn ? "থেকে" : "to"} {historyData.to}
                    </p>
                  </div>
                  <Badge variant="neutral">250m Resolution</Badge>
                </div>
              </CardHeader>
              <CardBody>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={historyData.series}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="eviGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis domain={[-0.1, 1.0]} tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Area
                        type="monotone"
                        dataKey="ndvi"
                        name="NDVI"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#ndviGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="evi"
                        name="EVI"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#eviGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Detailed Observations Table */}
          {historyData?.series && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-ink">
                    {isBn ? "১৬-দিনের পর্যবেক্ষণ ও গুণমান রেকর্ড" : "16-Day Observation & Quality Records"}
                  </h2>
                  <Badge variant="neutral">MOD13Q1.061</Badge>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <Table>
                  <THead>
                    <TR>
                      <TD className="font-semibold">{isBn ? "তারিখ" : "Composite Date"}</TD>
                      <TD className="font-semibold">{isBn ? "DOY" : "Acq DOY"}</TD>
                      <TD className="font-semibold">{isBn ? "এনডিভিআই" : "NDVI Index"}</TD>
                      <TD className="font-semibold">{isBn ? "ইভিআই" : "EVI Index"}</TD>
                      <TD className="font-semibold">{isBn ? "পিক্সেল নির্ভরযোগ্যতা" : "Pixel Reliability"}</TD>
                      <TD className="font-semibold">{isBn ? "শ্রেণিবিভাগ" : "Classification"}</TD>
                    </TR>
                  </THead>
                  <TBody>
                    {historyData.series.map((row, i) => (
                      <TR key={`${row.date}-${i}`}>
                        <TD className="font-medium">{row.date}</TD>
                        <TD className="font-mono text-xs">Day {row.compositeDayOfYear || "—"}</TD>
                        <TD className="font-mono font-medium text-emerald">
                          {row.ndvi !== null ? row.ndvi : "Fill (-3000)"}
                        </TD>
                        <TD className="font-mono font-medium text-blue-600">
                          {row.evi !== null ? row.evi : "Fill (-3000)"}
                        </TD>
                        <TD>
                          <Badge variant={row.pixelReliability === 0 ? "success" : "warning"}>
                            Rank {row.pixelReliability}
                          </Badge>
                        </TD>
                        <TD className="text-xs text-ink-muted">
                          {row.isReliableQuality
                            ? isBn ? "নির্ভরযোগ্য (Good Data)" : "Reliable (Good Data)"
                            : isBn ? "সতর্কতা (Marginal/Cloud)" : "Marginal / Cloud"}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </section>
  );
}
