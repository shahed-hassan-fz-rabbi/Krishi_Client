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

  return (
    <div className="space-y-6">
      {/* Header with District Switcher & Badges */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink font-heading sm:text-3xl">
              {isBn ? "ভৌগোলিক তথ্য ব্যবস্থা (GIS) মানচিত্র" : "Interactive GIS & Environmental Map"}
            </h1>
            <Badge variant="neutral">BBS 2020 Admin-2</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {isBn
              ? "বাংলাদেশ পরিসংখ্যান ব্যুরোর (BBS) অফিশিয়াল জেলা সীমানা এবং নাসার উপগ্রহ পর্যবেক্ষণের স্থানিক ম্যাপিং"
              : "Official BBS 2020 Admin-2 boundaries with integrated NASA satellite observations and physical footprint envelopes."}
          </p>
        </div>

        {/* District Switcher */}
        <div className="flex items-center gap-3">
          <div className="relative">
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
          </div>

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
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface p-3 text-xs shadow-xs">
        <span className="font-semibold text-ink flex items-center gap-1.5 mr-2">
          <Layers size={14} strokeWidth={1.8} className="text-emerald" />
          {isBn ? "লেয়ার নিয়ন্ত্রণ:" : "Layer Controls:"}
        </span>

        <button
          type="button"
          onClick={() => toggleLayer("boundary")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
            activeLayers.boundary
              ? "bg-emerald/15 text-emerald-strong border border-emerald/30"
              : "bg-surface-2 text-ink-muted hover:text-ink border border-transparent"
          }`}
        >
          <Check size={12} strokeWidth={2.5} className={activeLayers.boundary ? "opacity-100" : "opacity-0"} />
          {isBn ? "জেলা সীমানা (BBS)" : "District Boundary"}
        </button>

        <button
          type="button"
          onClick={() => toggleLayer("gpm")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
            activeLayers.gpm ? "bg-sky-100 text-sky-800 border border-sky-300" : "bg-surface-2 text-ink-muted hover:text-ink border border-transparent"
          }`}
        >
          <Check size={12} strokeWidth={2.5} className={activeLayers.gpm ? "opacity-100" : "opacity-0"} />
          <CloudRain size={12} strokeWidth={2} />
          {isBn ? "বৃষ্টিপাত (GPM)" : "Rainfall (GPM)"}
        </button>
        <button
          type="button"
          onClick={() => toggleLayer("smap")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
            activeLayers.smap
              ? "bg-[#0f6c49]/15 text-[#0f6c49] border border-[#0f6c49]/30"
              : "bg-surface-2 text-ink-muted hover:text-ink border border-transparent"
          }`}
        >
          <Check size={12} strokeWidth={2.5} className={activeLayers.smap ? "opacity-100" : "opacity-0"} />
          <Waves size={12} strokeWidth={2} />
          {isBn ? "মাটির আর্দ্রতা (SMAP)" : "Soil Moisture (SMAP)"}
        </button>

        <button
          type="button"
          onClick={() => toggleLayer("modis")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
            activeLayers.modis
              ? "bg-emerald/15 text-emerald-strong border border-emerald/30"
              : "bg-surface-2 text-ink-muted hover:text-ink border border-transparent"
          }`}
        >
          <Check size={12} strokeWidth={2.5} className={activeLayers.modis ? "opacity-100" : "opacity-0"} />
          <Leaf size={12} strokeWidth={2} />
          {isBn ? "উদ্ভিজ্জ সূচক (MODIS)" : "Vegetation (MODIS)"}
        </button>

        <button
          type="button"
          onClick={() => toggleLayer("climate")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
            activeLayers.climate
              ? "bg-sky-100 text-sky-800 border border-sky-300"
              : "bg-surface-2 text-ink-muted hover:text-ink border border-transparent"
          }`}
        >
          <Check size={12} strokeWidth={2.5} className={activeLayers.climate ? "opacity-100" : "opacity-0"} />
          <Thermometer size={12} strokeWidth={2} />
          {isBn ? "আবহাওয়া কেন্দ্র (POWER)" : "Climate Ref (POWER)"}
        </button>

        <button
          type="button"
          onClick={() => toggleLayer("footprints")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
            activeLayers.footprints
              ? "bg-amber-100 text-amber-800 border border-amber-300"
              : "bg-surface-2 text-ink-muted hover:text-ink border border-transparent"
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

      {/* Sensor Intelligence Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><CloudRain size={16} className="text-sky-700" /><h3 className="font-bold text-sm text-ink">{isBn ? "বৃষ্টিপাত (GPM IMERG)" : "Rainfall (GPM IMERG)"}</h3></div>
          </CardHeader>
          <CardBody className="space-y-2 text-xs">
            {layersData?.sensors?.precipitation ? <>
              <div className="text-lg font-bold text-ink">{layersData.sensors.precipitation.observation.dailySummary.completeness === "complete" ? `${layersData.sensors.precipitation.observation.dailySummary.totalPrecipitationMm} mm` : (isBn ? "সম্পূর্ণ দৈনিক মোট নেই" : "No complete daily total")}</div>
              <div className="text-ink-muted">{isBn ? "পর্যবেক্ষণের তারিখ:" : "Observation date:"} {layersData.sensors.precipitation.observation.dailySummary.dateLabel} · {layersData.sensors.precipitation.observation.dailySummary.validIntervals}/48 {isBn ? "বৈধ" : "valid intervals"}</div>
              <div className="text-ink-muted">{layersData.sensors.precipitation.nativeResolution}</div>
              <p className="text-[11px] text-ink-muted">{layersData.sensors.precipitation.spatialDisclosure}</p>
            </> : <p className="text-ink-muted">{isBn ? "GPM পর্যবেক্ষণ নেই" : "No GPM observations available"}</p>}
          </CardBody>
        </Card>
        {/* SMAP Soil Moisture Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Waves size={16} strokeWidth={1.8} className="text-[#0f6c49]" />
                <h3 className="font-bold text-sm text-ink">{isBn ? "মাটির আর্দ্রতা পর্যবেক্ষণ" : "Soil Moisture Pin"}</h3>
              </div>
              <Badge variant={smapObs?.isRecommendedQuality ? "success" : "warning"}>
                {smapObs?.qualityClassification || "N/A"}
              </Badge>
            </div>
          </CardHeader>
          <CardBody className="space-y-2 text-xs">
            {smapObs ? (
              <>
                <div className="flex items-baseline justify-between border-b pb-2">
                  <span className="text-ink-muted">{isBn ? "ভলিউমেট্রিক মান:" : "Volumetric Moisture:"}</span>
                  <span className="text-lg font-bold font-mono text-ink">{smapObs.soilMoisture} m³/m³</span>
                </div>
                <div className="flex items-center justify-between text-ink-muted">
                  <span>{isBn ? "অরবিট ও তারিখ:" : "Orbit & Date:"}</span>
                  <span className="font-mono text-ink font-medium">{smapObs.orbit} ({smapObs.dateLabel})</span>
                </div>
                <div className="flex items-center justify-between text-ink-muted">
                  <span>{isBn ? "রেফারেন্স দূরত্ব:" : "Offset Distance:"}</span>
                  <span className="font-mono text-ink font-medium">{layersData.sensors.soilMoisture.geodesicDistanceKm} km</span>
                </div>
                <p className="text-[11px] text-ink-muted/80 bg-surface-2 p-2 rounded-lg mt-2">
                  {isBn
                    ? "নমিনাল ৯ কিমি EASE-Grid সেল এবং ~৩৬ কিমি রেডিত্তমিটার অ্যান্টেনা বিম ফুটপ্রিন্ট প্রদর্শিত হচ্ছে।"
                    : "Nominal 9 km EASE-Grid posting & ~36 km native radiometer 3dB footprint are visualized."}
                </p>
              </>
            ) : (
              <p className="text-ink-muted">{isBn ? "কোনো পর্যবেক্ষণ নেই" : "No observation available"}</p>
            )}
          </CardBody>
        </Card>

        {/* MODIS Vegetation Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf size={16} strokeWidth={1.8} className="text-emerald" />
                <h3 className="font-bold text-sm text-ink">{isBn ? "উদ্ভিজ্জ সতেজতা পর্যবেক্ষণ" : "Vegetation Pin"}</h3>
              </div>
              <Badge variant={modisObs?.isReliableQuality ? "success" : "warning"}>
                {modisObs?.qualityClassification || "N/A"}
              </Badge>
            </div>
          </CardHeader>
          <CardBody className="space-y-2 text-xs">
            {modisObs ? (
              <>
                <div className="grid grid-cols-2 gap-2 border-b pb-2">
                  <div>
                    <span className="text-ink-muted block text-[11px]">NDVI (Greenness)</span>
                    <span className="text-lg font-bold font-mono text-ink">{modisObs.ndvi}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted block text-[11px]">EVI (Canopy)</span>
                    <span className="text-lg font-bold font-mono text-ink">{modisObs.evi}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-ink-muted">
                  <span>{isBn ? "কম্পোজিট দিন (DOY):" : "Composite DOY:"}</span>
                  <span className="font-mono text-ink font-medium">{modisObs.dateLabel} (DOY {modisObs.compositeDayOfYear})</span>
                </div>
                <div className="flex items-center justify-between text-ink-muted">
                  <span>{isBn ? "এমওডিআইএস টাইল:" : "MODIS Tile:"}</span>
                  <span className="font-mono text-ink font-medium">{modisObs.modisTile}</span>
                </div>
                <p className="text-[11px] text-ink-muted/80 bg-surface-2 p-2 rounded-lg mt-2">
                  {isBn
                    ? "২৫০ মিটার রেজোলিউশনে ৬.২৫ হেক্টর এলাকার ক্যানোপি ক্লোরোফিল পরিমাপ প্রদর্শিত হচ্ছে।"
                    : "250m sinusoidal resolution measuring regional chlorophyll vigor across 6.25 hectares."}
                </p>
              </>
            ) : (
              <p className="text-ink-muted">{isBn ? "কোনো পর্যবেক্ষণ নেই" : "No observation available"}</p>
            )}
          </CardBody>
        </Card>

        {/* Administrative Geography Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass size={16} strokeWidth={1.8} className="text-ink-muted" />
                <h3 className="font-bold text-sm text-ink">{isBn ? "প্রশাসনিক সীমানা তথ্য" : "Boundary Geography"}</h3>
              </div>
              <Badge variant="neutral">{districtMeta?.pCode || "BD"}</Badge>
            </div>
          </CardHeader>
          <CardBody className="space-y-2 text-xs">
            {districtMeta ? (
              <>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-ink-muted">{isBn ? "অফিশিয়াল নাম:" : "Official Name:"}</span>
                  <span className="font-bold text-ink">{districtMeta.nameEn} ({districtMeta.pCode})</span>
                </div>
                <div className="flex items-center justify-between text-ink-muted">
                  <span>{isBn ? "রেফারেন্স স্থানাঙ্ক:" : "Reference Coords:"}</span>
                  <span className="font-mono text-ink font-medium">{districtMeta.refCoord[1]}° N, {districtMeta.refCoord[0]}° E</span>
                </div>
                <div className="flex items-center justify-between text-ink-muted">
                  <span>{isBn ? "উৎস কর্তৃত্ব:" : "Source Authority:"}</span>
                  <span className="font-medium text-ink">BBS 2020 / UN OCHA HDX</span>
                </div>
                <p className="text-[11px] text-ink-muted/80 bg-surface-2 p-2 rounded-lg mt-2">
                  {isBn
                    ? "WGS 84 (EPSG:4326) ফরম্যাটে সংরক্ষিত আসল পলিগন ডেটাসেট ব্যবহার করা হয়েছে।"
                    : "Preserves exact un-simplified administrative geometry in standard WGS 84 (EPSG:4326)."}
                </p>
              </>
            ) : (
              <p className="text-ink-muted">{isBn ? "লোড হচ্ছে..." : "Loading..."}</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Spatial Resolution Scientific Limitations Alert */}
      <div className="rounded-xl border border-line bg-surface-2 p-4 text-xs text-ink-muted">
        <div className="flex items-start gap-2.5">
          <Info size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-emerald" />
          <div className="space-y-1">
            <span className="font-semibold text-ink">
              {isBn ? "স্থানিক স্কেল এবং উপগ্রহ সীমাবদ্ধতা সংক্রান্ত স্পষ্ট ঘোষণা:" : "Spatial Resolution & Scale Transparency Disclosure:"}
            </span>
            <p>
              {isBn
                ? "স্যাটেলাইট পর্যবেক্ষণসমূহ সংশ্লিষ্ট সেন্সরের গ্রিড স্কেলে এলাকাভিত্তিক গড় মান প্রদর্শন করে। নাসা স্ম্যাপ (SMAP) নমিনাল ৯ কিমি গ্রিড এবং ~৩৬ কিমি অ্যান্টেনা বিমে উপরিভাগের মাটির আর্দ্রতা পরিমাপ করে; মডিস (MODIS) ২৫০ মিটারে ক্যানোপি ক্লোরোফিল পরিমাপ করে এবং নাসা পাওয়ার (POWER) ০.৫° (~৫০ কিমি) গ্রিডে আবহাওয়ার অনুমিত উপাত্ত দেয়। এই পরিমাপগুলো কোনো নির্দিষ্ট কৃষকের একক ফসলি জমি বা খণ্ড খণ্ড মাঠের প্রত্যক্ষ চিত্র নির্দেশ করে না।"
                : "Satellite observations represent regional area-averaged pixel postings. NASA SMAP measures top 5cm soil moisture on a nominal 9 km grid (~36 km native radiometer footprint); NASA MODIS measures canopy chlorophyll dynamics over 250m pixels (6.25 ha); and NASA POWER provides regional gridded atmospheric assimilations (~50 km). These observations do NOT represent single individual farm plots or every micro-field in the district."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
