"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  Check,
  ChevronDown,
  Compass,
  Database,
  Eye,
  Info,
  Layers,
  Leaf,
  MapPin,
  RefreshCw,
  CloudRain,
  ShieldAlert,
  ShieldCheck,
  Thermometer,
  Waves,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge.js";
import { Card, CardBody, CardHeader } from "@/components/ui/Card.js";
import { LoadingState, ErrorState } from "@/components/ui/States.js";
import { useAuth } from "@/contexts/AuthContext.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import {
  fetchGisBoundaries,
  fetchGisDistricts,
  fetchGisLayers,
} from "@/services/api.js";

// SSR-Safe dynamic import for Leaflet
const DynamicGisMap = dynamic(
  () => import("@/components/map/DistrictGisMap.js"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[620px] w-full flex-col items-center justify-center rounded-2xl border border-line bg-surface-2 text-ink-muted">
        <LoadingState message="মানচিত্র লোড হচ্ছে... (Loading GIS Map)" />
      </div>
    ),
  }
);

export default function MapPage() {
  const { user } = useAuth();
  const { t, locale } = useLang();
  const { selectedDistrict, setSelectedDistrict, districts, currentDistrictObj } =
    useLocation();

  const [layersData, setLayersData] = useState(null);
  const [boundaryData, setBoundaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

  // Layer toggles
  const [activeLayers, setActiveLayers] = useState({
    boundary: true,
    gpm: true,
    smap: true,
    modis: true,
    climate: true,
    footprints: true,
  });

  const isBn = locale === "bn";

  const loadMapData = useCallback(async (districtCode) => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    setLayersData(null);
    setBoundaryData(null);
    try {
      const [layerRes, bndRes] = await Promise.all([
        fetchGisLayers(districtCode),
        fetchGisBoundaries(districtCode),
      ]);

      if (!layerRes.success) {
        throw new Error(layerRes.error?.message || "Failed to load GIS layers");
      }

      if (requestId !== requestIdRef.current || layerRes.data?.district?.code !== districtCode) return;
      setLayersData(layerRes.data);
      if (bndRes.success) {
        setBoundaryData(bndRes.data);
      }
    } catch (err) {
      if (requestId === requestIdRef.current) setError(err.message || (isBn ? "জিআইএস উপাত্ত লোড করতে ব্যর্থ" : "Failed to load GIS data"));
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [isBn]);

  useEffect(() => {
    if (selectedDistrict) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadMapData(selectedDistrict);
    }
  }, [selectedDistrict, loadMapData]);

  useEffect(() => () => { requestIdRef.current += 1; }, []);

  const toggleLayer = (key) => {
    setActiveLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const districtName = isBn ? currentDistrictObj?.nameBn : currentDistrictObj?.nameEn;
  const smapObs = layersData?.sensors?.soilMoisture?.observation;
  const modisObs = layersData?.sensors?.vegetation?.observation;
  const districtMeta = layersData?.district;
  const display = value => locale === "bn" ? String(value ?? "—").replace(/[0-9]/g, digit => "০১২৩৪৫৬৭৮৯"[Number(digit)]) : String(value ?? "—");
  const rainfall = layersData?.sensors?.precipitation?.observation?.dailySummary;


  return (
    <div className="space-y-6">
      {/* Header with District Switcher & Badges */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink font-heading sm:text-3xl">
              {isBn ? "ভৌগোলিক তথ্য ব্যবস্থা (GIS) মানচিত্র" : "Interactive GIS & Environmental Map"}
            </h1>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {isBn
              ? "বাংলাদেশ পরিসংখ্যান ব্যুরোর (BBS) অফিশিয়াল জেলা সীমানা এবং নাসার উপগ্রহ পর্যবেক্ষণের স্থানিক ম্যাপিং"
              : "Official BBS 2020 Admin-2 boundaries with integrated NASA satellite observations and physical footprint envelopes."}
          </p>
        </div>

        {/* District Switcher */}
        <div className="flex items-center gap-3">
          {!user && <div className="relative">
            <label htmlFor="gis-district-select" className="sr-only">
              {isBn ? "জেলা নির্বাচন করুন" : "Select District"}
            </label>
            <MapPin
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
              size={15}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <select
              id="gis-district-select"
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
          </div>}

          <button
            type="button"
            onClick={() => loadMapData(selectedDistrict)}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface-2"
            title={isBn ? "উপাত্ত রিফ্রেশ করুন" : "Refresh data"}
          >
            <RefreshCw size={14} strokeWidth={1.8} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{isBn ? "রিফ্রেশ" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Layer Toggles Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-line bg-surface p-4 text-xs shadow-xs">
        <span className="font-semibold text-ink flex items-center gap-1.5 mr-2">
          <Layers size={14} strokeWidth={1.8} className="text-emerald" />
          {isBn ? "লেয়ার নিয়ন্ত্রণ:" : "Layer Controls:"}
        </span>

        <button
          type="button"
          aria-pressed={activeLayers.boundary}
          onClick={() => toggleLayer("boundary")}
          className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
            activeLayers.boundary
              ? "bg-forest text-white border border-forest shadow-xs hover:bg-forest/90 dark:bg-emerald-800 dark:border-emerald-700 dark:hover:bg-emerald-700"
              : "bg-surface text-muted hover:bg-surface-2 hover:text-content border border-line"
          }`}
        >
          <Check size={12} strokeWidth={2.5} className={activeLayers.boundary ? "opacity-100" : "opacity-0"} />
          {isBn ? "জেলা সীমানা (BBS)" : "District Boundary"}
        </button>

        <button
          type="button"
          aria-pressed={activeLayers.gpm}
          onClick={() => toggleLayer("gpm")}
          className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
            activeLayers.gpm ? "bg-forest text-white border border-forest shadow-xs hover:bg-forest/90 dark:bg-emerald-800 dark:border-emerald-700 dark:hover:bg-emerald-700" : "bg-surface text-muted hover:bg-surface-2 hover:text-content border border-line"
          }`}
        >
          <Check size={12} strokeWidth={2.5} className={activeLayers.gpm ? "opacity-100" : "opacity-0"} />
          <CloudRain size={12} strokeWidth={2} />
          {isBn ? "বৃষ্টিপাত (GPM)" : "Rainfall (GPM)"}
        </button>
        <button
          type="button"
          aria-pressed={activeLayers.smap}
          onClick={() => toggleLayer("smap")}
          className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
            activeLayers.smap
              ? "bg-forest text-white border border-forest shadow-xs hover:bg-forest/90 dark:bg-emerald-800 dark:border-emerald-700 dark:hover:bg-emerald-700"
              : "bg-surface text-muted hover:bg-surface-2 hover:text-content border border-line"
          }`}
        >
          <Check size={12} strokeWidth={2.5} className={activeLayers.smap ? "opacity-100" : "opacity-0"} />
          <Waves size={12} strokeWidth={2} />
          {isBn ? "মাটির আর্দ্রতা (SMAP)" : "Soil Moisture (SMAP)"}
        </button>

        <button
          type="button"
          aria-pressed={activeLayers.modis}
          onClick={() => toggleLayer("modis")}
          className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
            activeLayers.modis
              ? "bg-forest text-white border border-forest shadow-xs hover:bg-forest/90 dark:bg-emerald-800 dark:border-emerald-700 dark:hover:bg-emerald-700"
              : "bg-surface text-muted hover:bg-surface-2 hover:text-content border border-line"
          }`}
        >
          <Check size={12} strokeWidth={2.5} className={activeLayers.modis ? "opacity-100" : "opacity-0"} />
          <Leaf size={12} strokeWidth={2} />
          {isBn ? "উদ্ভিজ্জ সূচক (MODIS)" : "Vegetation (MODIS)"}
        </button>

        <button
          type="button"
          aria-pressed={activeLayers.climate}
          onClick={() => toggleLayer("climate")}
          className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
            activeLayers.climate
              ? "bg-forest text-white border border-forest shadow-xs hover:bg-forest/90 dark:bg-emerald-800 dark:border-emerald-700 dark:hover:bg-emerald-700"
              : "bg-surface text-muted hover:bg-surface-2 hover:text-content border border-line"
          }`}
        >
          <Check size={12} strokeWidth={2.5} className={activeLayers.climate ? "opacity-100" : "opacity-0"} />
          <Thermometer size={12} strokeWidth={2} />
          {isBn ? "আবহাওয়া কেন্দ্র (POWER)" : "Climate Ref (POWER)"}
        </button>

        <button
          type="button"
          aria-pressed={activeLayers.footprints}
          onClick={() => toggleLayer("footprints")}
          className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
            activeLayers.footprints
              ? "bg-forest text-white border border-forest shadow-xs hover:bg-forest/90 dark:bg-emerald-800 dark:border-emerald-700 dark:hover:bg-emerald-700"
              : "bg-surface text-muted hover:bg-surface-2 hover:text-content border border-line"
          }`}
        >
          <Check size={12} strokeWidth={2.5} className={activeLayers.footprints ? "opacity-100" : "opacity-0"} />
          <Compass size={12} strokeWidth={2} />
          {isBn ? "স্থানিক ফুটপ্রিন্ট (Footprints)" : "Spatial Footprints"}
        </button>
      </div>

      {/* Main Interactive Map Canvas */}
      {error ? (
        <ErrorState message={error} onRetry={() => loadMapData(selectedDistrict)} />
      ) : (
        <DynamicGisMap
          boundaryData={boundaryData}
          layersData={layersData}
          activeLayers={activeLayers}
          isBn={isBn}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { key: "rain", Icon: CloudRain, color: "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300", value: rainfall?.completeness === "complete" ? `${display(rainfall.totalPrecipitationMm)} ${t("farmUi.mm")}` : t("mapSimple.noData"), date: rainfall?.dateLabel },
          { key: "soil", Icon: Waves, color: "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300", value: smapObs?.isRecommendedQuality && smapObs?.soilMoisture != null ? `${display(smapObs.soilMoisture)} m³/m³` : t("mapSimple.noData"), date: smapObs?.dateLabel },
          { key: "green", Icon: Leaf, color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300", value: modisObs?.isReliableQuality && modisObs?.ndvi != null ? `${display(modisObs.ndvi)} NDVI` : t("mapSimple.noData"), date: modisObs?.dateLabel },
          { key: "district", Icon: Compass, color: "bg-stone-100 text-stone-600 dark:bg-surface-2 dark:text-muted", value: districtMeta ? (isBn ? districtMeta.nameBn || t(`rotation.districts.${selectedDistrict}`) : districtMeta.nameEn) : t("mapSimple.noData") },
        ].map(({ key, Icon, color, value, date }) => <article key={key} className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-xs">
          <div className="flex items-center gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" aria-hidden="true" /></span><h3 className="text-sm font-semibold text-content">{t(`mapSimple.${key}`)}</h3></div>
          <p className="mt-5 break-words text-xl font-semibold text-content">{value}</p>
          {date && <p className="mt-2 text-xs text-muted">{t("rainSimple.day")}: {display(date)}</p>}
          <p className="mt-4 text-xs leading-6 text-muted">{t(key === "district" ? "mapSimple.boundaryNote" : "mapSimple.areaNote")}</p>
        </article>)}
      </div>
    </div>
  );
}
