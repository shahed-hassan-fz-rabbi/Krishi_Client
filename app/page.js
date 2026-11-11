"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Clock,
  Layers,
  Satellite,
  BarChart3,
  CloudRain,
  Database,
  Droplets,
  Globe,
  Leaf,
  Languages,
  MapPin,
  ShieldCheck,
  Sprout,
  Thermometer,
} from "lucide-react";

import { fetchDataSources } from "@/services/api.js";
import { PublicHeader, PublicFooter } from "@/components/layout/PublicChrome.js";
import { Badge } from "@/components/ui/Badge.js";
import { Button } from "@/components/ui/Button.js";
import { Card, CardBody, CardHeader } from "@/components/ui/Card.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";

const HERO_SRC = "/images/hero.png";

const featureItems = [
  { icon: CloudRain, titleKey: "featureRainfall", descKey: "featureRainfallDesc", tone: "climate" },
  { icon: Thermometer, titleKey: "featureTemp", descKey: "featureTempDesc", tone: "amber" },
  { icon: MapPin, titleKey: "featureDistrict", descKey: "featureDistrictDesc", tone: "emerald" },
  { icon: Database, titleKey: "featureEvidence", descKey: "featureEvidenceDesc", tone: "emerald" },
  { icon: Languages, titleKey: "featureLanguage", descKey: "featureLanguageDesc", tone: "neutral" },
  { icon: ShieldCheck, titleKey: "featureTransparency", descKey: "featureTransparencyDesc", tone: "emerald" },
];

const powerDataset = {
  scope: "Daily gridded historical climate data, including meteorological reanalysis and satellite-derived solar parameters",
};

const steps = [
  { n: "1", icon: MapPin, titleKey: "step1Title", descKey: "step1Desc" },
  { n: "2", icon: Database, titleKey: "step2Title", descKey: "step2Desc" },
  { n: "3", icon: BarChart3, titleKey: "step3Title", descKey: "step3Desc" },
  { n: "4", icon: Sprout, titleKey: "step4Title", descKey: "step4Desc" },
];

export default function LandingPage() {
  const { t, locale } = useLang();
  const { districts } = useLocation();
  const [liveDataSources, setLiveDataSources] = useState(null);
  const [hasLoadedDataSources, setHasLoadedDataSources] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchDataSources()
      .then((res) => {
        if (isMounted && res?.data) {
          setLiveDataSources(res.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setHasLoadedDataSources(true);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const powerApiSource = Array.isArray(liveDataSources)
    ? liveDataSources.find((item) => item.datasetKey === "nasa:power:daily:point") || null
    : null;
  const getSourceStatus = (datasetKey) => {
    const source = liveDataSources?.find((item) => item.datasetKey === datasetKey);
    if (!source) {
      if (!hasLoadedDataSources) return locale === "bn" ? "প্রাপ্যতা যাচাই হচ্ছে" : "Checking availability";
      return locale === "bn" ? "পর্যবেক্ষণ অনুপলব্ধ" : "Observations unavailable";
    }
    if (source.availability === "available" && Number.isFinite(source.validObservationCount)) {
      return locale === "bn"
        ? `${formatLocalizedNumber(source.validObservationCount)} ঐতিহাসিক পর্যবেক্ষণ`
        : `${formatLocalizedNumber(source.validObservationCount)} valid historical observations`;
    }
    return locale === "bn" ? "পর্যবেক্ষণ অনুপলব্ধ" : "Observations unavailable";
  };

  const validObservationCount = Number.isFinite(powerApiSource?.validObservationCount) && powerApiSource.validObservationCount >= 0
    ? powerApiSource.validObservationCount
    : null;
  const formatLocalizedNumber = (value) => locale === "bn"
    ? String(value.toLocaleString("en-US")).replace(/[0-9]/g, (d) => ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"][Number(d)])
    : value.toLocaleString("en-US");
  const formattedObsCount = validObservationCount == null ? "—" : formatLocalizedNumber(validObservationCount);

  const firstObservationDate = powerApiSource?.firstObservationDate
    ? new Date(powerApiSource.firstObservationDate)
    : null;
  const lastObservationDate = powerApiSource?.lastObservationDate
    ? new Date(powerApiSource.lastObservationDate)
    : null;
  const hasCoverageDates = firstObservationDate && lastObservationDate
    && !Number.isNaN(firstObservationDate.getTime()) && !Number.isNaN(lastObservationDate.getTime());
  const dynamicCoverageYears = hasCoverageDates
    ? `${formatLocalizedNumber(firstObservationDate.getFullYear())} – ${formatLocalizedNumber(lastObservationDate.getFullYear())}`
    : "—";
  const powerAvailabilityLabel = !hasLoadedDataSources
    ? (locale === "bn" ? "প্রাপ্যতা যাচাই হচ্ছে" : "Checking availability")
    : powerApiSource?.availability === "available" && validObservationCount != null
    ? (locale === "bn" ? "ঐতিহাসিক ডেটা উপলব্ধ" : "Historical data available")
    : (locale === "bn" ? "ঐতিহাসিক ডেটা অনুপলব্ধ" : "Historical data unavailable");

  const activeParameters = powerApiSource?.parameters
    ? Object.entries(powerApiSource.parameters)
    : [];

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero with background image */}
        <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden">
          {/* Background image with overlay */}
          <div className="absolute inset-0">
            <Image
              src={HERO_SRC}
              alt=""
              fill
              preload
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-forest/85 via-forest/75 to-emerald/80 dark:from-forest/90 dark:via-forest/82 dark:to-emerald/88" />
          </div>

          {/* Hero content overlay - centered */}
          <div className="relative mx-auto w-full min-w-0 max-w-4xl px-4 text-center sm:px-6">
            <h1 className="break-words text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
              {t("landing.heroTitle")}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/95 sm:text-xl lg:text-2xl max-w-3xl mx-auto">
              {t("landing.heroSubtitle")}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <Button href="/crop-rotation" size="lg" variant="hero" className="px-8">
                {t("rotation.start")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                href="/dashboard"
                size="lg"
                variant="heroOutline"
                className="px-8"
              >
                {t("publicHeader.exploreDashboard")}
              </Button>
            </div>
            <p className="mt-8 max-w-2xl mx-auto text-sm text-white/80 leading-relaxed">
              {t("landing.heroNote")}
            </p>
          </div>
        </section>

        {/* Supported districts */}
        <section className="border-b border-line bg-surface py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-emerald" aria-hidden="true" />
                <span className="text-sm font-medium text-muted">{t("landing.supportedDistricts")}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {districts.map((d) => (
                  <Badge key={d.code} tone="emerald">
                    {locale === "bn" ? d.nameBn || d.nameEn : d.nameEn}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-content sm:text-4xl">
              {t("landing.sectionFeatures")}
            </h2>
            <p className="mt-4 text-base text-muted sm:text-lg">{t("landing.sectionFeaturesSub")}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureItems.map((f) => (
              <Card key={f.titleKey} className="transition-shadow hover:shadow-km-md">
                <CardBody>
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border border-line ${
                      f.tone === "climate"
                        ? "bg-climate/10 text-climate"
                        : f.tone === "amber"
                          ? "bg-amber/10 text-amber-strong dark:text-amber"
                          : f.tone === "neutral"
                            ? "bg-surface-2 text-content"
                            : "bg-emerald/10 text-emerald-strong dark:text-emerald"
                    }`}
                  >
                    <f.icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-content">{t(`landing.${f.titleKey}`)}</h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed">{t(`landing.${f.descKey}`)}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 border-t border-line bg-surface-2/40 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold text-content sm:text-4xl">{t("landing.sectionHow")}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center leading-7 text-muted">{t("landing.sectionHowSub")}</p>
            <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => <li key={s.n} className="rounded-2xl border border-line bg-surface p-6">
                <div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald text-sm font-semibold text-white">{s.n}</span><s.icon className="h-6 w-6 text-emerald" aria-hidden="true" /></div>
                <h3 className="mt-5 text-lg font-semibold text-content">{t(`landing.${s.titleKey}`)}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{t(`landing.${s.descKey}`)}</p>
              </li>)}
            </ol>
            <div className="mt-8 rounded-2xl border border-line bg-surface p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-content">{t("rotation.assistantTitle")}</h3>
              <p className="mt-3 max-w-3xl leading-7 text-muted">{t("rotation.assistantBody")}</p>
              <Button href="/crop-rotation" variant="outline" className="mt-5">{t("access.demo")}</Button>
            </div>
          </div>
        </section>

        {/* Grounded in NASA Earth and climate data — Vibrant, High-End Space & Earth Observation Showcase */}
        <section id="data" className="scroll-mt-20 border-t border-line/60 bg-gradient-to-b from-surface via-surface-2/20 to-surface py-20 dark:from-bg dark:via-surface-card/10 dark:to-bg sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            {/* Header with vibrant pill */}
            <div className="mx-auto max-w-3xl text-center mb-14">
              <div className="inline-flex items-center gap-2 rounded-full border border-climate/40 bg-climate/10 px-4 py-1.5 text-xs font-bold text-climate mb-4 shadow-sm backdrop-blur-sm">
                <Satellite className="h-4 w-4 animate-pulse text-climate" />
                <span className="uppercase tracking-wider text-[11px] font-bold">{t("landing.dataKicker")}</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-content sm:text-4xl lg:text-5xl">
                {t("landing.sectionData")}
              </h2>
              <p className="mt-4 text-base text-muted sm:text-lg leading-relaxed max-w-2xl mx-auto">
                {t("landing.sectionDataSub")}
              </p>
            </div>

            {/* NASA POWER historical climate reference */}
            <div className="relative mb-12 overflow-hidden rounded-2xl border-2 border-emerald-500/35 bg-gradient-to-br from-surface via-surface-2/50 to-emerald-500/10 p-6 shadow-km-md backdrop-blur-sm dark:from-surface-card dark:via-surface-card dark:to-emerald-950/30 sm:p-8">
              {/* Vibrant ambient glow */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
              
              <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-6 pb-6 border-b border-line/80">
                <div className="flex items-start gap-4">
                  <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 p-3 text-emerald ring-1 ring-emerald-500/40 shadow-sm">
                    <Satellite className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald">
                        {locale === "bn" ? "ঐতিহাসিক জলবায়ু রেফারেন্স" : "Historical climate reference"}
                      </span>
                      <span className="text-xs text-muted">•</span>
                      <span className="text-xs font-medium text-muted">
                        {powerApiSource?.provider || "NASA POWER (Langley Research Center)"}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-content sm:text-2xl">
                      NASA POWER — Agroclimatology Daily
                    </h3>
                    <p className="mt-1 text-sm text-muted sm:text-base max-w-2xl leading-relaxed">
                      {powerDataset.scope}
                    </p>
                    <p className="mt-2 font-mono text-[11px] text-muted truncate max-w-xl">
                      {powerApiSource?.endpoint || "https://power.larc.nasa.gov/api/temporal/daily/point"}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center md:items-start">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1.5 text-xs font-bold text-emerald shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span>{powerAvailabilityLabel}</span>
                  </div>
                </div>
              </div>

              {/* Dataset coverage and metadata returned by the backend catalog */}
              <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                <div className="rounded-xl border border-line/80 bg-surface/90 dark:bg-surface/50 p-4 shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald block mb-1">
                    {locale === "bn" ? "যাচাইকৃত সংরক্ষিত পর্যবেক্ষণ" : "Validated stored observations"}
                  </span>
                  <span className="text-xl font-extrabold text-content sm:text-2xl block">
                    {formattedObsCount}
                  </span>
                  <span className="text-[11px] text-muted">
                    {locale === "bn" ? "ঐতিহাসিক দৈনিক ডেটা" : "Historical daily observations"}
                  </span>
                </div>

                <div className="rounded-xl border border-line/80 bg-surface/90 dark:bg-surface/50 p-4 shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-climate block mb-1">
                    {locale === "bn" ? "সময়কাল ব্যাপ্তি" : "Temporal Range"}
                  </span>
                  <span className="text-xl font-extrabold text-content sm:text-2xl block">
                    {dynamicCoverageYears}
                  </span>
                  <span className="text-[11px] text-muted">
                    {hasCoverageDates
                      ? (locale === "bn" ? "সংরক্ষিত ডেটার সময়কাল" : "Stored observation period")
                      : (locale === "bn" ? "সময়কাল অনুপলব্ধ" : "Coverage dates unavailable")}
                  </span>
                </div>

                <div className="rounded-xl border border-line/80 bg-surface/90 dark:bg-surface/50 p-4 shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-strong block mb-1">
                    {locale === "bn" ? "টাইম স্ট্যান্ডার্ড" : "Time Standard"}
                  </span>
                  <span className="text-xl font-extrabold text-content sm:text-2xl block">
                    {powerApiSource?.timeStandard || "—"}
                  </span>
                  <span className="text-[11px] text-muted">
                    {powerApiSource?.timeStandardDisclosure || (locale === "bn" ? "সময়-মান অনুপলব্ধ" : "Time standard unavailable")}
                  </span>
                </div>

                <div className="rounded-xl border border-line/80 bg-surface/90 dark:bg-surface/50 p-4 shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-1">
                    {locale === "bn" ? "স্থানিক মডেল" : "Spatial Footprint"}
                  </span>
                  <span className="text-base font-bold text-content sm:text-lg block mt-0.5">
                    {powerApiSource?.spatialResolution || "—"}
                  </span>
                  <span className="text-[11px] text-muted">
                    {powerApiSource?.product || (locale === "bn" ? "পণ্য পরিচিতি অনুপলব্ধ" : "Product metadata unavailable")}
                  </span>
                </div>
              </div>

              {/* NASA POWER parameters from the dataset catalog */}
              <div className="relative mt-6 pt-5 border-t border-line/80">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald block mb-3">
                  {locale === "bn" ? "NASA POWER প্যারামিটার" : "NASA POWER parameters"}
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {activeParameters.map(([code, meta]) => (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-content shadow-sm transition-all hover:bg-emerald-500/20"
                      title={meta.longName || code}
                    >
                      <span className="font-mono font-bold text-emerald">{code}</span>
                      <span className="text-muted text-[11px]">({meta.unit})</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Expansion Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <h3 className="text-lg font-bold text-content flex items-center gap-2">
                  <Layers className="h-5 w-5 text-climate" />
                  <span>{t("landing.dataPipelineTitle")}</span>
                </h3>
                <p className="text-xs text-muted sm:text-sm mt-0.5">
                  {t("landing.dataPipelineSub")}
                </p>
              </div>
              <Badge tone="purple" className="self-start sm:self-auto text-xs font-bold shadow-sm">
                {locale === "bn" ? "ঐতিহাসিক ডেটা কভারেজ" : "Historical data coverage"}
              </Badge>
            </div>

            {/* Next-Gen Satellite Pipeline Cards (3-Column Grid with rich category color tones) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
              {/* Card 1: SMAP SPL3SMP_E */}
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-km-sm dark:bg-surface-card flex flex-col justify-between transition-all hover:border-blue-500/40 hover:shadow-km-md">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30">
                      <Droplets className="h-5 w-5" />
                    </div>
                    <Badge tone="neutral">{getSourceStatus("nasa:smap:spl3smp_e:v006")}</Badge>
                  </div>
                  <h4 className="text-base font-bold text-content font-mono">SMAP SPL3SMP_E</h4>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Near-surface soil moisture at satellite grid scale
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/70 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted block">{locale === "bn" ? "রেজোলিউশন" : "Resolution"}:</span>
                    <span className="font-semibold text-content">9 km Gridded</span>
                  </div>
                  <div>
                    <span className="text-muted block">{locale === "bn" ? "পরিমাপ গভীরতা" : "Target Depth"}:</span>
                    <span className="font-semibold text-content">Top 0–5 cm Soil</span>
                  </div>
                </div>
              </div>

              {/* Card 2: GPM IMERG V07 */}
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-km-sm dark:bg-surface-card flex flex-col justify-between transition-all hover:border-climate/40 hover:shadow-km-md">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-climate/15 text-climate ring-1 ring-climate/30">
                      <CloudRain className="h-5 w-5" />
                    </div>
                    <Badge tone="neutral">{getSourceStatus("nasa:gpm:imerg:3imerghh:v07")}</Badge>
                  </div>
                  <h4 className="text-base font-bold text-content font-mono">GPM IMERG V07</h4>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    High-resolution satellite precipitation
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/70 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted block">{locale === "bn" ? "রেজোলিউশন" : "Resolution"}:</span>
                    <span className="font-semibold text-content">0.1° (~10 km)</span>
                  </div>
                  <div>
                    <span className="text-muted block">{locale === "bn" ? "ফ্রিকোয়েন্সি" : "Cadence"}:</span>
                    <span className="font-semibold text-content">Half-Hourly / Daily</span>
                  </div>
                </div>
              </div>

              {/* Card 3: MODIS MOD13Q1.061 */}
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-km-sm dark:bg-surface-card flex flex-col justify-between transition-all hover:border-emerald/40 hover:shadow-km-md">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald/15 text-emerald ring-1 ring-emerald/30">
                      <Sprout className="h-5 w-5" />
                    </div>
                    <Badge tone="neutral">{getSourceStatus("nasa:modis:mod13q1:v061")}</Badge>
                  </div>
                  <h4 className="text-base font-bold text-content font-mono">MODIS MOD13Q1.061</h4>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    NDVI / EVI vegetation indices
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/70 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted block">{locale === "bn" ? "রেজোলিউশন" : "Resolution"}:</span>
                    <span className="font-semibold text-content">250 m Pixel Grid</span>
                  </div>
                  <div>
                    <span className="text-muted block">{locale === "bn" ? "কম্পোজিট" : "Composite"}:</span>
                    <span className="font-semibold text-content">16-Day Cloud-Free</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scientific Solar-Day Note & Documentation Banner with amber accent */}
            <div className="rounded-2xl border border-line bg-surface-2/60 dark:bg-surface-card/60 p-5 sm:p-6 shadow-km-sm flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-strong mt-0.5 ring-1 ring-amber-500/30">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-content">
                    {locale === "bn" ? "সৌর-দিবস সময়সীমা (LST) ও বৈজ্ঞানিক নির্ভুলতা" : "Local Solar Time (LST) & Astronomical Accuracy"}
                  </h4>
                  <p className="text-xs text-muted mt-1 leading-relaxed max-w-2xl">
                    {powerApiSource?.timeStandardDisclosure || t("landing.nasaLstNote")}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <Button href="/data-sources" variant="outline" size="sm" className="font-semibold shadow-sm">
                  <span>{locale === "bn" ? "সম্পূর্ণ মেথডোলজি দেখুন" : "View Data Sources"}</span>
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* About Section — High-End Agricultural Intelligence & Mission */}
        <section id="about" className="scroll-mt-20 border-t border-line/70 bg-gradient-to-b from-surface via-surface-2/30 to-surface py-24 dark:from-bg dark:via-surface-card/20 dark:to-bg">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            {/* Section Header */}
            <div className="mx-auto max-w-3xl text-center">
              <Badge tone="emerald" className="mb-4 uppercase tracking-wider text-[11px] font-bold">
                {t("landing.aboutKicker")}
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-content sm:text-4xl lg:text-5xl">
                {t("landing.sectionAbout")}
              </h2>
              <p className="mt-4 text-base text-muted sm:text-lg leading-relaxed">
                {t("landing.aboutSubtitle")}
              </p>
            </div>

            {/* Core Mission Statement Card */}
            <div className="mt-12 overflow-hidden rounded-2xl border border-line bg-surface p-8 shadow-km-sm dark:bg-surface-card sm:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald">
                    {locale === "bn" ? "প্রমাণভিত্তিক সিদ্ধান্ত গ্রহণ" : "Evidence-Based Decision Support"}
                  </span>
                  <p className="mt-3 text-base text-content sm:text-lg leading-relaxed">
                    {t("landing.sectionAboutBody")}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <Button href="/dashboard" size="lg">
                      {t("landing.heroCta")}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button href="/data-sources" size="lg" variant="outline">
                      {t("landing.aboutViewDataSources")}
                    </Button>
                  </div>
                </div>

                {/* Right highlights list */}
                <div className="lg:col-span-4 rounded-xl border border-line/80 bg-surface-2/50 dark:bg-black/20 p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-emerald shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-content">
                      {locale === "bn" ? "নাসা পাওয়ার ও আর্থ অবজারভেশন সরাসরি যুক্ত" : "Direct NASA Earth Observation integration"}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sprout className="h-5 w-5 text-emerald shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-content">
                      {locale === "bn" ? "ডিএই ও বিএএমআইএস সরকারি শস্য ক্যালেন্ডার" : "DAE & BAMIS national crop calendar alignment"}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-content">
                      {locale === "bn" ? "১০০% সত্যতা — কোনো ভিত্তিহীন পূর্বাভাস নয়" : "100% Integrity — no unverified weather forecasts"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Feature Pillars Grid */}
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-line bg-surface p-6 shadow-sm transition-all hover:border-emerald/40 hover:shadow-km-sm dark:bg-surface-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald/10 text-emerald">
                  <Globe className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-content">
                  {t("landing.aboutPillar1Title")}
                </h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  {t("landing.aboutPillar1Desc")}
                </p>
              </div>

              <div className="rounded-xl border border-line bg-surface p-6 shadow-sm transition-all hover:border-emerald/40 hover:shadow-km-sm dark:bg-surface-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-forest/10 text-forest dark:bg-emerald/10 dark:text-emerald">
                  <Sprout className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-content">
                  {t("landing.aboutPillar2Title")}
                </h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  {t("landing.aboutPillar2Desc")}
                </p>
              </div>

              <div className="rounded-xl border border-line bg-surface p-6 shadow-sm transition-all hover:border-emerald/40 hover:shadow-km-sm dark:bg-surface-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-climate/10 text-climate">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-content">
                  {t("landing.aboutPillar3Title")}
                </h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  {t("landing.aboutPillar3Desc")}
                </p>
              </div>

              <div className="rounded-xl border border-line bg-surface p-6 shadow-sm transition-all hover:border-emerald/40 hover:shadow-km-sm dark:bg-surface-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber/10 text-amber-strong">
                  <Languages className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-content">
                  {t("landing.aboutPillar4Title")}
                </h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  {t("landing.aboutPillar4Desc")}
                </p>
              </div>
            </div>

            {/* Impact Metrics Ribbon */}
            <div className="mt-14 rounded-2xl border border-line/80 bg-surface-2/40 p-8 dark:bg-surface-card/60">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-line/70">
                <div className="text-center pt-4 lg:pt-0">
                  <div className="text-3xl font-extrabold text-emerald sm:text-4xl">
                    {t("landing.aboutStat1Value")}
                  </div>
                  <div className="mt-1 text-xs sm:text-sm font-medium text-muted">
                    {t("landing.aboutStat1Label")}
                  </div>
                </div>

                <div className="text-center pt-4 lg:pt-0 lg:pl-6">
                  <div className="text-3xl font-extrabold text-forest dark:text-emerald sm:text-4xl">
                    {t("landing.aboutStat2Value")}
                  </div>
                  <div className="mt-1 text-xs sm:text-sm font-medium text-muted">
                    {t("landing.aboutStat2Label")}
                  </div>
                </div>

                <div className="text-center pt-4 lg:pt-0 lg:pl-6">
                  <div className="text-3xl font-extrabold text-climate sm:text-4xl">
                    {t("landing.aboutStat3Value")}
                  </div>
                  <div className="mt-1 text-xs sm:text-sm font-medium text-muted">
                    {t("landing.aboutStat3Label")}
                  </div>
                </div>

                <div className="text-center pt-4 lg:pt-0 lg:pl-6">
                  <div className="text-3xl font-extrabold text-amber-strong sm:text-4xl">
                    {t("landing.aboutStat4Value")}
                  </div>
                  <div className="mt-1 text-xs sm:text-sm font-medium text-muted">
                    {t("landing.aboutStat4Label")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
