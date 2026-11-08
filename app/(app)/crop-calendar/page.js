"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CalendarRange,
  ChevronDown,
  Clock,
  Compass,
  Droplets,
  ExternalLink,
  FileText,
  Info,
  Layers,
  Leaf,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Thermometer,
  Waves,
  Wind,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge.js";
import { Card, CardBody, CardHeader } from "@/components/ui/Card.js";
import { LoadingState, ErrorState } from "@/components/ui/States.js";
import { Table, TBody, TD, THead, TR } from "@/components/ui/Table.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import {
  fetchCropCalendarAlignment,
  fetchCropCalendars,
  fetchCropList,
} from "@/services/api.js";

export default function CropCalendarPage() {
  const { t, locale } = useLang();
  const { selectedDistrict, setSelectedDistrict, districts, currentDistrictObj } =
    useLocation();

  const [cropsList, setCropsList] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState("monsoon_aman");
  const [calendarData, setCalendarData] = useState(null);
  const [alignmentData, setAlignmentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isBn = locale === "bn";

  const loadData = useCallback(async (districtCode, cropId) => {
    setIsLoading(true);
    setError(null);
    try {
      const [cropsRes, calRes, alignRes] = await Promise.all([
        fetchCropList(),
        fetchCropCalendars(districtCode, cropId),
        fetchCropCalendarAlignment(districtCode, cropId),
      ]);

      if (cropsRes.success && cropsRes.data) {
        setCropsList(cropsRes.data);
      }

      if (calRes.success && calRes.data?.length > 0) {
        setCalendarData(calRes.data[0]);
      } else {
        throw new Error(calRes.error?.message || "No crop calendar found");
      }

      if (alignRes.success && alignRes.data) {
        setAlignmentData(alignRes.data);
      }
    } catch (err) {
      setError(err.message || (isBn ? "ক্যালেন্ডার উপাত্ত লোড করতে ব্যর্থ" : "Failed to load crop calendar data"));
    } finally {
      setIsLoading(false);
    }
  }, [isBn]);

  useEffect(() => {
    if (selectedDistrict && selectedCrop) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData(selectedDistrict, selectedCrop);
    }
  }, [selectedDistrict, selectedCrop, loadData]);

  const districtName = isBn ? currentDistrictObj?.nameBn : currentDistrictObj?.nameEn;
  const distCal = calendarData?.districtCalendar;
  const currentStage = alignmentData?.officialCalendar?.currentStage;
  const satContext = alignmentData?.satelliteContext;

  return (
    <div className="space-y-6">
      {/* Page Header with District & Crop Selectors */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink font-heading sm:text-3xl">
              {isBn ? "সরকারি ফসল আবহাওয়া পঞ্জিকা" : "Official Crop Agro-Weather Calendar"}
            </h1>
            <Badge variant="neutral">BAMIS / DAE / BRRI / BARI</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {isBn
              ? "কৃষি সম্প্রসারণ অধিদপ্তর ও বামিস-এর অনুমোদিত কৃষি অঞ্চলভিত্তিক ফসল পঞ্জিকা ও উপগ্রহ সূচক সমকালীন বিশ্লেষণ"
              : "Source-verified agro-meteorological crop calendars from BAMIS and DAE with NASA satellite environmental context."}
          </p>
        </div>

        {/* Dual District & Crop Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* District Selector */}
          <div className="relative">
            <label htmlFor="crop-district-select" className="sr-only">
              {isBn ? "জেলা নির্বাচন করুন" : "Select District"}
            </label>
            <MapPin
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
              size={15}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <select
              id="crop-district-select"
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

          {/* Crop Selector */}
          <div className="relative">
            <label htmlFor="crop-select" className="sr-only">
              {isBn ? "ফসল নির্বাচন করুন" : "Select Crop"}
            </label>
            <Leaf
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald"
              size={15}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <select
              id="crop-select"
              aria-label={isBn ? "ফসল নির্বাচন করুন" : "Select Crop"}
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="appearance-none rounded-xl border border-line bg-surface py-2 pl-9 pr-8 text-sm font-medium text-ink shadow-xs transition hover:border-emerald focus:border-emerald focus:outline-hidden"
            >
              {cropsList.map((c) => (
                <option key={c.cropId} value={c.cropId}>
                  {isBn ? c.nameBn : c.nameEn} ({isBn ? c.seasonBn : c.season})
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
            onClick={() => loadData(selectedDistrict, selectedCrop)}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface-2"
            title={isBn ? "উপাত্ত রিফ্রেশ করুন" : "Refresh data"}
          >
            <RefreshCw size={14} strokeWidth={1.8} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{isBn ? "রিফ্রেশ" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Official Agro-Ecological Metadata & Provenance Banner */}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-ink">
                {isBn ? calendarData?.nameBn : calendarData?.nameEn}
              </span>
              <Badge variant="success">
                {isBn ? calendarData?.seasonBn : calendarData?.season}
              </Badge>
              <span className="text-xs text-ink-muted font-mono">
                {calendarData?.scientificName}
              </span>
            </div>
            <p className="text-xs text-ink-muted">
              <strong>{isBn ? "কৃষি অঞ্চল:" : "DAE Region:"}</strong> {distCal?.daeRegion}
            </p>
            <p className="text-xs text-ink-muted">
              <strong>{isBn ? "অনুমোদিত জাতসমূহ:" : "Typical Varieties:"}</strong> {calendarData?.typicalVarieties}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5 text-xs text-ink-muted">
            <a
              href={distCal?.sourceDocumentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 font-medium text-ink transition hover:border-emerald hover:text-emerald"
            >
              <FileText size={13} strokeWidth={1.8} />
              <span>{isBn ? "অফিশিয়াল BAMIS গেজেট PDF" : "Official BAMIS Advisory PDF"}</span>
              <ExternalLink size={11} strokeWidth={1.8} />
            </a>
            <span className="text-[11px] text-ink-muted">
              {distCal?.sourcePublisher}
            </span>
          </div>
        </div>
      </div>

      {/* Crop Key Agronomic Windows Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody className="space-y-1">
            <div className="flex items-center gap-2 text-ink-muted">
              <Clock size={15} strokeWidth={1.8} />
              <span className="text-xs">{isBn ? "মোট জীবনকাল" : "Total Life Cycle"}</span>
            </div>
            <div className="text-2xl font-bold font-mono text-ink">
              {distCal?.totalDurationDays} {isBn ? "দিন" : "Days"}
            </div>
            <p className="text-[11px] text-ink-muted">
              {isBn ? "বপন থেকে কর্তন পর্যন্ত গড় মেয়াদ" : "Sowing to harvest duration"}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-1">
            <div className="flex items-center gap-2 text-ink-muted">
              <Calendar size={15} strokeWidth={1.8} />
              <span className="text-xs">{isBn ? "বপন / বীজতলা সময়" : "Sowing Period"}</span>
            </div>
            <div className="text-sm font-bold text-ink">
              {distCal?.sowingPeriod}
            </div>
            <p className="text-[11px] text-ink-muted">
              {distCal?.transplantingPeriod
                ? `${isBn ? "চারা রোপণ:" : "Transplanting:"} ${distCal.transplantingPeriod}`
                : (isBn ? "সরাসরি জমিতে বীজ বপন" : "Direct seeded crop")}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-1">
            <div className="flex items-center gap-2 text-ink-muted">
              <Droplets size={15} strokeWidth={1.8} />
              <span className="text-xs">{isBn ? "মোট পানির চাহিদা" : "Water Requirement"}</span>
            </div>
            <div className="text-2xl font-bold font-mono text-ink">
              {distCal?.waterRequirementMmTotal} mm
            </div>
            <p className="text-[11px] text-ink-muted">
              {isBn ? "সেচ ও বৃষ্টির সম্মিলিত সামগ্রিক প্রয়োজন" : "Total evapotranspiration & irrigation need"}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-1">
            <div className="flex items-center gap-2 text-ink-muted">
              <CalendarRange size={15} strokeWidth={1.8} />
              <span className="text-xs">{isBn ? "ফসল কর্তন সময়" : "Harvest Window"}</span>
            </div>
            <div className="text-sm font-bold text-ink">
              {distCal?.harvestingPeriod}
            </div>
            <p className="text-[11px] text-ink-muted">
              {isBn ? "অনুকূল পরিপক্বতা পর্যায়" : "Target maturity window"}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Phenological Stage-by-Stage Timeline & Advisory Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={16} strokeWidth={1.8} className="text-emerald" />
              <h2 className="text-base font-bold text-ink">
                {isBn ? "পর্যায়ভিত্তিক ফসল পঞ্জিকা ও আবহাওয়া সতর্কতা" : "Phenological Stages & Meteorological Advisories"}
              </h2>
            </div>
            <span className="text-xs text-ink-muted">
              {distCal?.stages?.length || 0} {isBn ? "টি সুনির্দিষ্ট পর্যায়" : "Stages"}
            </span>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TD className="w-12 font-bold">#</TD>
                  <TD className="font-bold">{isBn ? "ফসল বৃদ্ধির পর্যায়" : "Phenological Stage"}</TD>
                  <TD className="font-bold">{isBn ? "আবহাওয়া সপ্তাহ (SMW)" : "Standard Weeks"}</TD>
                  <TD className="font-bold">{isBn ? "মেয়াদ" : "Days"}</TD>
                  <TD className="font-bold">{isBn ? "পানির চাহিদা" : "Water (mm)"}</TD>
                  <TD className="font-bold">{isBn ? "অনুকূল তাপমাত্রা" : "Optimal Temp"}</TD>
                  <TD className="font-bold">{isBn ? "আবহাওয়া ঝুঁকি ও বিশেষ সতর্কতা" : "Weather Hazards & Advisory"}</TD>
                </TR>
              </THead>
              <TBody>
                {distCal?.stages?.map((stage, idx) => {
                  const isCurrent = currentStage?.stageId === stage.stageId;
                  return (
                    <TR key={stage.stageId} className={isCurrent ? "bg-emerald/5" : ""}>
                      <TD className="font-mono text-xs text-ink-muted">{idx + 1}</TD>
                      <TD>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink">
                            {isBn ? stage.stageNameBn : stage.stageNameEn}
                          </span>
                          {isCurrent && (
                            <Badge variant="success" className="text-[10px]">
                              {isBn ? "চলমান পর্যায়" : "Active Now"}
                            </Badge>
                          )}
                        </div>
                      </TD>
                      <TD className="font-mono text-xs text-ink-muted">
                        Week {stage.standardWeeks[0]} – {stage.standardWeeks[1]}
                      </TD>
                      <TD className="font-mono text-xs text-ink">
                        {stage.durationDays} {isBn ? "দিন" : "d"}
                      </TD>
                      <TD className="font-mono text-xs text-ink">
                        {stage.waterRequirementMm} mm
                      </TD>
                      <TD className="font-mono text-xs text-ink">
                        {stage.optimalTempRange[0]}°C – {stage.optimalTempRange[1]}°C
                      </TD>
                      <TD className="text-xs text-ink-muted max-w-xs">
                        <div className="flex items-start gap-1.5">
                          <AlertTriangle size={13} strokeWidth={1.8} className="text-amber-600 mt-0.5 shrink-0" />
                          <span>{stage.weatherHazards}</span>
                        </div>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </div>
        </CardBody>
      </Card>

      {/* Satellite Context & Scientific Integration Section */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Compass size={18} strokeWidth={1.8} className="text-[#2878c8]" />
            <h3 className="font-bold text-base text-ink">
              {isBn ? "উপগ্রহ সূচক সমকালীন বিশ্লেষণ (Satellite Environmental Context)" : "Satellite Environmental Alignment"}
            </h3>
          </div>
          <Badge variant="neutral">NASA Earthdata</Badge>
        </div>

        <p className="text-xs text-ink-muted">
          {isBn
            ? "সরকারি ক্রপ ক্যালেন্ডারের সাথে নাসার বাস্তব উপগ্রহ পর্যবেক্ষণের স্থানিক পরিবেশগত অবস্থা নিচে প্রদর্শন করা হলো। উপগ্রহ পর্যবেক্ষণগুলো কেবল পরিবেশগত অবস্থা নির্দেশ করে, এগুলো সরাসরি সার বা সেচের সরকারি নির্দেশিকা নয়।"
            : "Below is the real-time physical environmental context from NASA satellite missions alongside the official crop calendar. Satellite observations provide regional atmospheric and canopy conditions, NOT direct agronomic mandates."}
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Soil Moisture Alignment */}
          <div className="rounded-xl border border-line bg-surface-2 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Waves size={15} strokeWidth={1.8} className="text-[#0f6c49]" />
                <span className="font-semibold text-xs text-ink">
                  {isBn ? "মাটির আর্দ্রতা অবস্থা (NASA SMAP)" : "Soil Moisture Context (NASA SMAP)"}
                </span>
              </div>
              <Badge variant={satContext?.soilMoisture?.isRecommended ? "success" : "warning"}>
                {satContext?.soilMoisture?.quality || "N/A"}
              </Badge>
            </div>
            {satContext?.soilMoisture ? (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-ink-muted">{isBn ? "সর্বশেষ মান:" : "Latest Observation:"}</span>
                  <span className="font-bold font-mono text-base text-ink">
                    {satContext.soilMoisture.value} {satContext.soilMoisture.unit}
                  </span>
                </div>
                <div className="flex justify-between text-ink-muted text-[11px]">
                  <span>{isBn ? "তারিখ ও রেজোলিউশন:" : "Date & Resolution:"}</span>
                  <span>{satContext.soilMoisture.date} (9 km grid posting)</span>
                </div>
                <p className="text-[11px] text-ink-muted/80 pt-1 border-t">
                  {isBn
                    ? "শীর্ষ ৫ সেমি মাটির আর্দ্রতা। বীজতলা ও চারা রোপণ পর্যায়ে উপযুক্ত মাটি প্রস্তুতিতে সহায়ক।"
                    : "Top 5cm volume soil water. Informs seedbed preparation and transplanting field readiness."}
                </p>
              </div>
            ) : (
              <p className="text-xs text-ink-muted">{isBn ? "কোনো পর্যবেক্ষণ পাওয়া যায়নি" : "No observation available"}</p>
            )}
          </div>

          {/* Vegetation Index Alignment */}
          <div className="rounded-xl border border-line bg-surface-2 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf size={15} strokeWidth={1.8} className="text-emerald" />
                <span className="font-semibold text-xs text-ink">
                  {isBn ? "ক্যানোপি সবুজত্ব সূচক (NASA MODIS)" : "Canopy Vigor Index (NASA MODIS)"}
                </span>
              </div>
              <Badge variant={satContext?.vegetationIndex?.isReliable ? "success" : "warning"}>
                {satContext?.vegetationIndex?.quality || "N/A"}
              </Badge>
            </div>
            {satContext?.vegetationIndex ? (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-ink-muted">{isBn ? "সর্বশেষ এনডিভিআই (NDVI):" : "Latest NDVI Index:"}</span>
                  <span className="font-bold font-mono text-base text-ink">
                    {satContext.vegetationIndex.ndvi}
                  </span>
                </div>
                <div className="flex justify-between text-ink-muted text-[11px]">
                  <span>{isBn ? "তারিখ ও রেজোলিউশন:" : "Date & Resolution:"}</span>
                  <span>{satContext.vegetationIndex.date} (250m sinusoidal)</span>
                </div>
                <p className="text-[11px] text-ink-muted/80 pt-1 border-t">
                  {isBn
                    ? "২৫০ মিটারে ক্যানোপি ক্লোরোফিল পরিমাপ। বৃদ্ধি পর্যায় ও জৈববস্তুর সতেজতা পর্যবেক্ষণ।"
                    : "250m regional chlorophyll absorption indicating vegetative canopy vigor."}
                </p>
              </div>
            ) : (
              <p className="text-xs text-ink-muted">{isBn ? "কোনো পর্যবেক্ষণ পাওয়া যায়নি" : "No observation available"}</p>
            )}
          </div>
        </div>

        {/* Scientific Disclosure */}
        <div className="rounded-xl border border-line bg-surface p-3 text-xs text-ink-muted">
          <div className="flex items-start gap-2">
            <Info size={15} strokeWidth={1.8} className="mt-0.5 shrink-0 text-emerald" />
            <p>{alignmentData?.scientificDisclosure}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
