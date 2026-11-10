"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  CalendarRange,
  ChevronDown,
  CloudRain,
  Droplets,
  Info,
  MapPin,
  RefreshCw,
  Sun,
  ThermometerSun,
  Wheat,
  ArrowRight,
} from "lucide-react";

import { ClimateMonthlyChart } from "@/components/charts/ClimateMonthlyChart.js";
import EnvironmentalIntelligenceCards from "@/components/dashboard/EnvironmentalIntelligenceCards.js";
import WeatherIntelligenceSection from "@/components/dashboard/WeatherIntelligenceSection.js";
import { Badge } from "@/components/ui/Badge.js";
import { Button } from "@/components/ui/Button.js";
import { Card, CardBody, CardHeader } from "@/components/ui/Card.js";
import { MetricCard } from "@/components/ui/MetricCard.js";
import { ErrorState, LoadingState } from "@/components/ui/States.js";
import { Tooltip } from "@/components/ui/Tooltip.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import {
  getDistrictValidCoverage,
  responseBelongsToDistrict,
  isSupportedPowerProvenance,
} from "@/lib/dashboardData.js";
import {
  fetchClimateSummary,
  fetchEnvironmentalDataSources,
  fetchDivisionIntelligence,
  fetchDivisions,
  fetchPrecipitationLatest,
  fetchSoilMoistureLatest,
  fetchVegetationLatest,
} from "@/services/api.js";

const DivisionPanel = dynamic(() => import("@/components/dashboard/DivisionIntelligencePanel.js"), { ssr: false });

const MONTH_NAMES_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const MONTH_NAMES_BN = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

export default function DashboardPage() {
  const { t, locale } = useLang();
  const {
    selectedDistrict,
    setSelectedDistrict,
    districts,
    currentDistrictObj,
  } = useLocation();

  const [summaryData, setSummaryData] = useState(null);
  const [metaData, setMetaData] = useState(null);
  const [summaryDistrict, setSummaryDistrict] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [environmentalSources, setEnvironmentalSources] = useState([]);
  const [latestEnvironmental, setLatestEnvironmental] = useState({ district: null, loaded: false, gpm: null, smap: null, modis: null });
  const [divisionList, setDivisionList] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("dhaka");
  const [divisionData, setDivisionData] = useState(null);
  const [divisionError, setDivisionError] = useState(false);
  const [divisionLoading, setDivisionLoading] = useState(true);
  const latestDistrictRef = useRef(selectedDistrict);

  useEffect(() => {
    let active = true;
    fetchDivisions().then((response) => {
      if (!active || !response?.success || !Array.isArray(response.data)) return;
      setDivisionList(response.data);
      if (response.data.some((division) => division.code === "dhaka")) setSelectedDivision("dhaka");
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const settle = (promise) => promise
      .then((response) => {
        const matchesDistrict = response?.success && responseBelongsToDistrict(response.data, selectedDistrict);
        return { data: matchesDistrict ? response.data : null, meta: response?.meta || null, error: !matchesDistrict };
      })
      .catch(() => ({ data: null, meta: null, error: true }));
    Promise.all([
      settle(fetchPrecipitationLatest(selectedDistrict)),
      settle(fetchSoilMoistureLatest(selectedDistrict)),
      settle(fetchVegetationLatest(selectedDistrict)),
    ]).then(([gpm, smap, modis]) => {
      if (active) setLatestEnvironmental({ district: selectedDistrict, loaded: true, gpm, smap, modis });
    });
    return () => { active = false; };
  }, [selectedDistrict]);

  useEffect(() => {
    let active = true;
    fetchDivisionIntelligence(selectedDivision).then((response) => {
      if (!active) return;
      if (response?.success && response.data?.division?.code === selectedDivision) setDivisionData(response.data);
      else setDivisionError(true);
    }).catch(() => { if (active) setDivisionError(true); }).finally(() => { if (active) setDivisionLoading(false); });
    return () => { active = false; };
  }, [selectedDivision]);

  const handleDivisionChange = (divisionCode) => {
    setSelectedDivision(divisionCode);
    setDivisionData(null);
    setDivisionError(false);
    setDivisionLoading(true);
  };

  useEffect(() => {
    let mounted = true;
    fetchEnvironmentalDataSources()
      .then((response) => {
        if (mounted && Array.isArray(response?.data)) setEnvironmentalSources(response.data);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const loadDashboardData = useCallback(async (districtCode) => {
    latestDistrictRef.current = districtCode;
    setIsLoading(true);
    setError(null);
    setSummaryData(null);
    setMetaData(null);
    setSummaryDistrict(null);

    const settle = (promise) => promise
      .then((response) => {
        const matchesDistrict = response?.success && responseBelongsToDistrict(response.data, districtCode);
        return { data: matchesDistrict ? response.data : null, meta: response?.meta || null, error: !matchesDistrict };
      })
      .catch(() => ({ data: null, meta: null, error: true }));

    try {
      const [climateRes, sourcesRes, gpm, smap, modis] = await Promise.all([
        fetchClimateSummary(districtCode),
        fetchEnvironmentalDataSources().catch(() => null),
        settle(fetchPrecipitationLatest(districtCode)),
        settle(fetchSoilMoistureLatest(districtCode)),
        settle(fetchVegetationLatest(districtCode)),
      ]);

      // Guard against race conditions when switching districts rapidly
      if (latestDistrictRef.current !== districtCode) return;

      if (climateRes?.success && climateRes.data) {
        setSummaryData(climateRes.data);
        setMetaData(climateRes.meta);
        setSummaryDistrict(districtCode);
      } else {
        setError(climateRes?.error?.message || "Failed to load climate observations");
      }

      if (Array.isArray(sourcesRes?.data)) {
        setEnvironmentalSources(sourcesRes.data);
      }
      setLatestEnvironmental({ district: districtCode, loaded: true, gpm, smap, modis });

    } catch (err) {
      if (latestDistrictRef.current === districtCode) {
        setError(err.message || "An unexpected error occurred");
      }
    } finally {
      if (latestDistrictRef.current === districtCode) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedDistrict) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadDashboardData(selectedDistrict);
    }
  }, [selectedDistrict, loadDashboardData]);

  // Derive display values from live NASA POWER calculations
  const monthNames = locale === "bn" ? MONTH_NAMES_BN : MONTH_NAMES_EN;

  let annualRainfallMean = "—";
  let meanTempAvg = "—";
  let humidityAvg = "—";
  let solarAvg = "—";

  let wettest = { month: "—", value: "—" };
  let driest = { month: "—", value: "—" };
  let hottest = { month: "—", value: "—" };
  let coolest = { month: "—", value: "—" };

  const chartSeries = [];

  const hasCurrentSummary = Boolean(
    summaryData && summaryDistrict === selectedDistrict && isSupportedPowerProvenance(metaData?.provenance)
  );

  if (hasCurrentSummary) {
    // 1. Rainfall annual mean
    const rfAnnual = summaryData.rainfall?.annual_historical;
    if (rfAnnual?.mean != null) {
      annualRainfallMean = Math.round(rfAnnual.mean).toLocaleString();
    }

    // 2. Monthly rainfall normals for chart and extremes
    const rfMonthly = summaryData.rainfall?.monthly_historical;
    if (rfMonthly) {
      let maxRf = -Infinity;
      let minRf = Infinity;
      let maxMonth = 1;
      let minMonth = 1;

      for (let m = 1; m <= 12; m++) {
        const stats = rfMonthly[String(m)]?.stats;
        if (stats?.mean == null && stats?.median == null) continue;
        const mean = stats?.mean != null ? Math.round(stats.mean * 10) / 10 : null;
        const median = stats?.median != null ? Math.round(stats.median * 10) / 10 : null;

        chartSeries.push({
          month: m,
          monthLabel: monthNames[m - 1],
          mean,
          median,
        });

        if (mean != null && mean > maxRf) {
          maxRf = mean;
          maxMonth = m;
        }
        if (mean != null && mean < minRf) {
          minRf = mean;
          minMonth = m;
        }
      }

      if (maxRf !== -Infinity) {
        wettest = { month: monthNames[maxMonth - 1], value: Math.round(maxRf) };
      }
      if (minRf !== Infinity) {
        driest = { month: monthNames[minMonth - 1], value: Math.round(minRf) };
      }
    }

    // 3. Temperature normals
    const tempMonthly = summaryData.temperature?.monthly_historical;
    const annualTemperature = summaryData.temperature?.annual_historical;
    if (annualTemperature?.mean != null) {
      meanTempAvg = Number(annualTemperature.mean).toFixed(1);
    }
    if (tempMonthly) {
      let maxT = -Infinity;
      let minT = Infinity;
      let hotMonth = 1;
      let coolMonth = 1;
      for (let m = 1; m <= 12; m++) {
        const stats = tempMonthly[String(m)]?.stats;
        if (stats?.mean != null) {
          if (stats.mean > maxT) {
            maxT = stats.mean;
            hotMonth = m;
          }
          if (stats.mean < minT) {
            minT = stats.mean;
            coolMonth = m;
          }
        }
      }

      if (maxT !== -Infinity) {
        hottest = { month: monthNames[hotMonth - 1], value: maxT.toFixed(1) };
      }
      if (minT !== Infinity) {
        coolest = { month: monthNames[coolMonth - 1], value: minT.toFixed(1) };
      }
    }

    // 4. Relative humidity annual normal from the scientific API.
    const annualHumidity = summaryData.rh2m?.annual_historical;
    if (annualHumidity?.mean != null) {
      humidityAvg = Math.round(annualHumidity.mean);
    }

    // 5. Solar radiation annual normal from the scientific API.
    const annualSolar = summaryData.allsky_sfc_sw_dwn?.annual_historical;
    if (annualSolar?.mean != null) {
      solarAvg = Number(annualSolar.mean).toFixed(1);
    }
  }

  const districtDisplayName =
    locale === "bn"
      ? currentDistrictObj?.nameBn || currentDistrictObj?.nameEn || "চট্টগ্রাম"
      : currentDistrictObj?.nameEn || "Chattogram";

  const currentClimateSummary = summaryDistrict === selectedDistrict ? summaryData : null;
  const currentClimateMeta = summaryDistrict === selectedDistrict ? metaData : null;
  const currentEnvironmental = latestEnvironmental.district === selectedDistrict ? latestEnvironmental : null;
  const powerSource = environmentalSources.find((item) => item.datasetKey === "nasa:power:daily:point");
  const powerSourceCoverage = getDistrictValidCoverage(powerSource, selectedDistrict);
  const powerVerified = hasCurrentSummary && isSupportedPowerProvenance(metaData?.provenance);
  const powerCoverageLabel = powerSourceCoverage?.firstObservationDate && powerSourceCoverage?.lastObservationDate
    ? `${powerSourceCoverage.firstObservationDate} – ${powerSourceCoverage.lastObservationDate}`
    : locale === "bn" ? "তারিখের পরিসর অনুপলভ্য" : "Coverage dates unavailable";
  return (
    <div className="space-y-8">
      {/* Dashboard context and controls */}
      <header className="relative isolate min-h-[220px] overflow-hidden rounded-2xl border border-line bg-surface shadow-km-sm">
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <Image
            src="/images/hero.jpeg"
            alt=""
            fill
            sizes="(min-width: 1440px) 1120px, calc(100vw - 3rem)"
            className="object-cover object-center opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bg/18 via-transparent to-transparent dark:from-bg/25 dark:via-transparent dark:to-transparent" />
        </div>
        <div className="relative z-10 flex min-h-[220px] flex-col justify-center gap-5 p-4 sm:p-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0 max-w-2xl rounded-2xl border border-white/55 bg-surface/80 p-4 shadow-lg shadow-slate-950/10 backdrop-blur-md sm:p-5 dark:border-white/10 dark:bg-surface/75">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="sage">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {districtDisplayName}
              </Badge>
              <Badge tone="blue">
                <CalendarRange className="h-3 w-3" aria-hidden="true" />
                {powerCoverageLabel}
              </Badge>
              <Badge tone="neutral">NASA POWER · {locale === "bn" ? "ঐতিহাসিক" : "Historical"}</Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-content sm:text-4xl">{t("dashboard.title")}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              {t("dashboard.subtitleNote")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          {/* District selector */}
          <label className="relative flex min-h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 shadow-km-sm transition-colors focus-within:border-emerald">
            <MapPin className="h-4 w-4 text-emerald shrink-0" aria-hidden="true" />
            <select
              aria-label={t("landing.supportedDistricts")}
              className="min-w-28 cursor-pointer appearance-none bg-transparent pr-6 text-sm font-medium text-content focus:outline-none"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              {districts.map((d) => (
                <option key={d.code} value={d.code} className="bg-surface text-content">
                  {locale === "bn" ? d.nameBn || d.nameEn : d.nameEn}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" aria-hidden="true" />
          </label>

          {/* LST standard disclosure badge */}
          <Tooltip label={t("dashboard.timeStandardTooltip")}>
            <span className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-climate/20 bg-climate/10 px-3 text-xs font-medium text-climate-text cursor-help">
              <Info className="h-3 w-3" aria-hidden="true" />
              {t("dashboard.timeStandardBadge")}
            </span>
          </Tooltip>

          {/* Refresh action */}
          <Tooltip label={t("dashboard.refreshNote")}>
            <button
              type="button"
              onClick={() => loadDashboardData(selectedDistrict)}
              disabled={isLoading}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-forest px-3.5 text-sm font-medium text-white shadow-km-sm transition-colors hover:bg-forest-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-climate disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={t("dashboard.refresh")}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-emerald" : ""}`} aria-hidden="true" />
              {t("dashboard.refresh")}
            </button>
          </Tooltip>
        </div>
        </div>
      </header>

      <DivisionPanel
        divisions={divisionList}
        selected={selectedDivision}
        onSelect={handleDivisionChange}
        data={divisionData}
        loading={divisionLoading}
        error={divisionError}
        locale={locale}
      />

      <EnvironmentalIntelligenceCards
        locale={locale}
        selectedDistrict={selectedDistrict}
        districtDisplayName={districtDisplayName}
        environmentalSources={environmentalSources}
        climateSummary={currentClimateSummary}
        climateMeta={currentClimateMeta}
        gpmData={currentEnvironmental?.gpm}
        smapData={currentEnvironmental?.smap}
        modisData={currentEnvironmental?.modis}
        isLoading={isLoading}
      />

      <WeatherIntelligenceSection
        locationCode={selectedDistrict}
        locale={locale}
      />

      {/* Loading state */}
      {isLoading && !hasCurrentSummary && (
        <Card>
          <CardBody>
            <LoadingState />
          </CardBody>
        </Card>
      )}

      {/* Error state */}
      {error && !hasCurrentSummary && (
        <Card>
          <CardBody>
            <ErrorState onRetry={() => loadDashboardData(selectedDistrict)} />
            <p className="mt-2 text-center text-xs text-danger">{error}</p>
          </CardBody>
        </Card>
      )}

      {/* Real NASA POWER Climate Metric cards */}
      {hasCurrentSummary && (
        <>
          <section aria-label={t("dashboard.metricsTitle")}>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest/8 text-forest dark:bg-emerald/15 dark:text-emerald">
                  <BarChart3 className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold tracking-tight text-content">{t("dashboard.metricsTitle")}</h2>
                  <p className="mt-1 text-xs text-muted">{districtDisplayName} · NASA POWER {locale === "bn" ? "ঐতিহাসিক জলবায়ু স্বাভাবিক মান" : "historical climate normals"}</p>
                </div>
              </div>
              <Badge tone="sage" className="shrink-0">
                <CalendarRange className="h-3.5 w-3.5" aria-hidden="true" />
                {metaData?.years_used ?? "—"} {locale === "bn" ? "বছরের উপাত্ত" : "years represented"}
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={CloudRain}
                tone="emerald"
                label={t("dashboard.annualRainfall")}
                value={annualRainfallMean}
                unit="mm/yr"
                hint={t("dashboard.annualRainfallHint")}
                demo={false}
                variant="dashboard"
              />
              <MetricCard
                icon={ThermometerSun}
                tone="emerald"
                label={t("dashboard.meanTemp")}
                value={meanTempAvg}
                unit="°C"
                hint={t("dashboard.meanTempHint")}
                demo={false}
                variant="dashboard"
              />
              <MetricCard
                icon={Droplets}
                tone="emerald"
                label={t("dashboard.humidity")}
                value={humidityAvg}
                unit="%"
                hint={t("dashboard.humidityHint")}
                demo={false}
                variant="dashboard"
              />
              <MetricCard
                icon={Sun}
                tone="emerald"
                label={t("dashboard.solarRadiation")}
                value={solarAvg}
                unit="MJ/m²/d"
                hint={t("dashboard.solarRadiationHint")}
                demo={false}
                variant="dashboard"
              />
            </div>
          </section>

          {/* Climate summary panel + monthly rainfall normal chart */}
          <section aria-label={t("dashboard.summaryTitle")}>
            <div className="grid gap-4 xl:grid-cols-12">
              <Card className="xl:col-span-5">
                <CardHeader
                  title={t("dashboard.summaryTitle")}
                  description={`${districtDisplayName} (${powerCoverageLabel} · ${metaData?.years_used ?? "—"} ${locale === "bn" ? "বছরের উপাত্ত" : "years represented"})`}
                  action={
                    <Badge tone="sage" className="text-xs">
                      NASA POWER
                    </Badge>
                  }
                />
                <CardBody className="pt-3">
                  <ul className="divide-y divide-line">
                    <li className="flex items-center justify-between gap-3 py-3">
                      <p className="text-sm text-muted">{t("dashboard.summaryWettest")}</p>
                      <p className="text-right text-sm font-semibold text-content">
                        {wettest.value}
                        <span className="ml-1 text-xs font-normal text-muted">mm</span>
                        <span className="ml-2 text-xs font-medium text-emerald-text">({wettest.month})</span>
                      </p>
                    </li>
                    <li className="flex items-center justify-between gap-3 py-3">
                      <p className="text-sm text-muted">{t("dashboard.summaryDriest")}</p>
                      <p className="text-right text-sm font-semibold text-content">
                        {driest.value}
                        <span className="ml-1 text-xs font-normal text-muted">mm</span>
                        <span className="ml-2 text-xs font-medium text-emerald-text">({driest.month})</span>
                      </p>
                    </li>
                    <li className="flex items-center justify-between gap-3 py-3">
                      <p className="text-sm text-muted">{t("dashboard.summaryHottest")}</p>
                      <p className="text-right text-sm font-semibold text-content">
                        {hottest.value}
                        <span className="ml-1 text-xs font-normal text-muted">°C</span>
                        <span className="ml-2 text-xs font-medium text-emerald-text">({hottest.month})</span>
                      </p>
                    </li>
                    <li className="flex items-center justify-between gap-3 py-3">
                      <p className="text-sm text-muted">{t("dashboard.summaryCoolest")}</p>
                      <p className="text-right text-sm font-semibold text-content">
                        {coolest.value}
                        <span className="ml-1 text-xs font-normal text-muted">°C</span>
                        <span className="ml-2 text-xs font-medium text-emerald-text">({coolest.month})</span>
                      </p>
                    </li>
                  </ul>

                  <div className="mt-4 rounded-lg border border-line bg-surface-2 p-3 text-xs leading-relaxed text-muted">
                    {metaData?.formula_version && (
                      <p className="font-medium text-content mb-1">
                        {`${locale === "bn" ? "গণনা পদ্ধতি" : "Algorithm"}: ${metaData.formula_version}`}
                      </p>
                    )}
                    <p>{t("dashboard.limitationsNotice")}</p>
                  </div>
                </CardBody>
              </Card>

              <Card className="xl:col-span-7">
                <CardHeader
                  title={t("dashboard.chartTitle")}
                  description={t("dashboard.chartNote")}
                  action={
                    <Badge tone="emerald" className="text-xs">
                      {metaData?.coverage_percent != null
                        ? `${metaData.coverage_percent}% ${t("dashboard.coverage")}`
                        : `— ${t("dashboard.coverage")}`}
                    </Badge>
                  }
                />
                <CardBody className="pt-2">
                  <ClimateMonthlyChart
                    data={chartSeries}
                    dataKey="mean"
                    medianKey="median"
                    unit="mm"
                    title={t("dashboard.chartTitle")}
                    showMedian={true}
                    meanLabel={locale === "bn" ? "গড় (মিমি)" : "Mean (mm)"}
                    medianLabel={locale === "bn" ? "মধ্যক (মিমি)" : "Median (mm)"}
                    emptyMessage={locale === "bn" ? "এই চার্টের জন্য পর্যবেক্ষণ সিরিজ পাওয়া যায়নি" : "No observation series available"}
                    variant="dashboard"
                  />
                </CardBody>
              </Card>
            </div>
          </section>
        </>
      )}

      {/* Handoff Window Intelligence promotional card */}
      <section>
        <Card className="border-line bg-surface-2/40">
          <CardHeader
            title={t("dashboard.handoffTeaserTitle")}
            description={t("dashboard.handoffTeaserBody")}
          />
          <CardBody className="flex flex-wrap items-center justify-between gap-4 pt-3">
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral">0 {locale === "bn" ? "দিন" : "d"}</Badge>
              <ArrowRight className="h-4 w-4 self-center text-muted" aria-hidden="true" />
              <Badge tone="neutral">7 {locale === "bn" ? "দিন" : "d"}</Badge>
              <ArrowRight className="h-4 w-4 self-center text-muted" aria-hidden="true" />
              <Badge tone="neutral">14 {locale === "bn" ? "দিন" : "d"}</Badge>
            </div>
            <Button href="/handoff" size="sm" variant="forest">
              <Wheat className="h-4 w-4" aria-hidden="true" />
              {t("dashboard.handoffTeaserCta")}
            </Button>
          </CardBody>
        </Card>
      </section>

    </div>
  );
}
