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
  fetchVegetationStatus,
} from "@/services/api.js";

export default function VegetationPage() {
  const { t, locale } = useLang();
  const { selectedDistrict, setSelectedDistrict, districts, currentDistrictObj } =
    useLocation();

  const [latestData, setLatestData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const latestDistrictRef = useRef(selectedDistrict);

  const isBn = locale === "bn";

  const loadVegetationData = useCallback(async (districtCode) => {
    latestDistrictRef.current = districtCode;
    setIsLoading(true);
    setError(null);
    try {
      const [statusRes, latestRes, historyRes] = await Promise.all([
        fetchVegetationStatus(),
        fetchVegetationLatest(districtCode),
        fetchVegetationHistory(districtCode, "2023-12-01", "2024-12-31"),
      ]);

      if (latestDistrictRef.current !== districtCode) return;

      if (statusRes.success) setSystemStatus(statusRes.data);
      if (latestRes.success) setLatestData(latestRes.data);
      if (historyRes.success) setHistoryData(historyRes.data);
    } catch (err) {
      if (latestDistrictRef.current !== districtCode) return;
      setError(err.message || (isBn ? "উপাত্ত লোড করতে ব্যর্থ" : "Failed to load vegetation data"));
    } finally {
      if (latestDistrictRef.current === districtCode) {
        setIsLoading(false);
      }
    }
  }, [isBn]);

  useEffect(() => {
    if (selectedDistrict) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadVegetationData(selectedDistrict);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrict]);

  const districtName = isBn ? currentDistrictObj?.nameBn : currentDistrictObj?.nameEn;

  return (
    <div className="space-y-6">
      {/* Page Header with District Selector & NASA Provenance */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink font-heading sm:text-3xl">
              {isBn ? "উদ্ভিজ্জ ও ক্যানোপি ইন্টেলিজেন্স" : "Vegetation & Canopy Intelligence"}
            </h1>
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
              <span className="font-semibold text-ink">
                {isBn ? "উদ্ভিজ্জ সূচক বৈজ্ঞানিক ঘোষণা:" : "Vegetation Index Scientific Disclosure:"}
              </span>
              <p>
                {isBn
                  ? "এমওডিআইএস (MODIS) এনডিভিআই এবং ইভিআই শীর্ষ ক্যানোপির পৃষ্ঠীয় প্রতিফলনের ওপর ভিত্তি করে ক্লোরোফিল শোষণ ও সবুজত্ব পরিমাপ করে। এটি কৃষিজমির আপেক্ষিক সতেজতা ও বৃদ্ধির পর্যায় নির্দেশ করে; এটি প্রত্যক্ষ ফসল উৎপাদন (ফলন), কীটপতঙ্গের আক্রমণ বা শিকড় অঞ্চলের পানি নির্দেশ করে না।"
                  : "NASA MODIS NDVI and EVI quantify chlorophyll absorption and canopy vigor across 250m pixels. They represent canopy greenness dynamics and phenological timing, NOT direct crop yield, pest infestation, or root-zone soil water."}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emerald/30 bg-emerald/5 p-3 text-xs text-ink-muted">
          <div className="flex items-start gap-2">
            <Layers size={15} strokeWidth={1.8} className="mt-0.5 shrink-0 text-emerald" />
            <p>
              {isBn
                ? "কোয়ালিটি ফিল্টারিং: পিক্সেল রিলায়েবিলিটি র্যাঙ্ক ০ (Good Data) নিশ্চিত করে যে পিক্সেলটি মেঘমুক্ত ও উচ্চ মানের। র্যাঙ্ক ১ (মার্জিনাল) বা ৩ (মেঘ) কৃষিজ সিদ্ধান্তে ব্যবহারে সতর্কতা অবলম্বন করা হয়।"
                : "QA Reliability Filter: Pixel Reliability Rank 0 (Good Data) guarantees cloud-free, high-fidelity reflectance. Rank 1 (Marginal) and Rank 3 (Cloudy) are filtered out of recommended averages."}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message={isBn ? "উদ্ভিজ্জ উপাত্ত লোড হচ্ছে..." : "Loading vegetation intelligence..."} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadVegetationData(selectedDistrict)} />
      ) : !latestData && (!systemStatus || systemStatus.totalObservationsStored === 0) ? (
        <Card>
          <CardBody className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-surface-2 text-ink-muted">
              <Leaf size={24} strokeWidth={1.8} className="text-emerald" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-ink">
              {isBn ? "এমওডিআইএস অ্যাপিয়ার্স প্রস্তুতি সম্পন্ন (ডাটাবেস রাইট পেন্ডিং)" : "NASA AppEEARS Prepared (Awaiting Ingestion Approval)"}
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-ink-muted">
              {isBn
                ? "নাসা অ্যাপিয়ার্স ক্যাটালগ (MOD13Q1.061) এবং ২৫০ মিটার এনডিভিআই/ইভিআই পাইপলাইন লোকালভাবে কনফিগার করা হয়েছে। আপনার স্পষ্ট অনুমোদনের পর পয়েন্ট স্যাম্পলিং টাস্ক ডেটাবেসে সংযুক্ত হবে।"
                : "NASA AppEEARS product catalog (MOD13Q1.061) and 250m NDVI/EVI pipeline are locally configured. Records will be ingested following explicit sign-off."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
              <Badge variant="neutral">Product: MOD13Q1.061 (250m, 16-day)</Badge>
              <Badge variant="neutral">Layers: NDVI, EVI, Pixel Reliability, DOY</Badge>
              <Badge variant="neutral">Status: Zero DB Writes (Safety Preserved)</Badge>
            </div>
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
                    {latestData?.ndvi !== null ? latestData?.ndvi : "N/A"}
                  </span>
                  <span className="text-xs text-ink-muted">Index</span>
                </div>
                <div className="text-xs text-ink-muted">
                  {latestData?.ndvi >= 0.5 ? (
                    <span className="text-emerald font-medium">
                      {isBn ? "ঘন ক্যানোপি কভার (> 0.5)" : "Dense Green Canopy (> 0.5)"}
                    </span>
                  ) : latestData?.ndvi >= 0.3 ? (
                    <span className="text-amber-600 font-medium">
                      {isBn ? "মধ্যম উদ্ভিজ্জ বিকাশ (0.3–0.5)" : "Moderate Vegetative Cover"}
                    </span>
                  ) : (
                    <span className="text-ink-muted">
                      {isBn ? "কম ক্যানোপি / খোলা জমি" : "Low Biomass / Fallow"}
                    </span>
                  )}
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
                    {latestData?.evi !== null ? latestData?.evi : "N/A"}
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
                    Rank {latestData?.pixelReliability !== null ? latestData?.pixelReliability : "—"}
                  </span>
                </div>
                <div className="text-xs">
                  {latestData?.isReliableQuality ? (
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
                    Day {latestData?.compositeDayOfYear || "N/A"}
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
    </div>
  );
}
