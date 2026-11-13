"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  MapPin,
  RefreshCw,
} from "lucide-react";

import { ClimateMonthlyChart } from "@/components/charts/ClimateMonthlyChart.js";
import EnvironmentalIntelligenceCards from "@/components/dashboard/EnvironmentalIntelligenceCards.js";
import DistrictLocationPanel from "@/components/dashboard/DistrictLocationPanel.js";
import WeatherIntelligenceSection from "@/components/dashboard/WeatherIntelligenceSection.js";
import { Badge } from "@/components/ui/Badge.js";
import { Card, CardBody, CardHeader } from "@/components/ui/Card.js";
import DashboardOverview from "@/components/dashboard/DashboardOverview.js";
import { ErrorState, LoadingState } from "@/components/ui/States.js";
import { Tooltip } from "@/components/ui/Tooltip.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import {
  getDistrictValidCoverage,
  responseBelongsToDistrict,
  isSupportedPowerProvenance,
} from "@/lib/dashboardData.js";
import { getProjectDistricts, isProjectDistrictCode } from "@/lib/districtGeography.js";
import {
  fetchClimateSummary,
  fetchEnvironmentalDataSources,
  fetchPrecipitationLatest,
  fetchSoilMoistureLatest,
  fetchVegetationLatest,
} from "@/services/api.js";

const MONTH_NAMES_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const MONTH_NAMES_BN = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

export default function DashboardWorkspace({ view = "overview", children }) {
  const { t, locale } = useLang();
  const {
    selectedDistrict,
    setSelectedDistrict,
    districts,
    currentDistrictObj,
  } = useLocation();

  const observationDetailsRef = useRef(null);
  useEffect(() => {
    const revealLinkedRecord = () => {
      if (/^#(power|rainfall|soil-moisture|vegetation)$/.test(window.location.hash) && observationDetailsRef.current) observationDetailsRef.current.open = true;
    };
    revealLinkedRecord();
    window.addEventListener("hashchange", revealLinkedRecord);
    return () => window.removeEventListener("hashchange", revealLinkedRecord);
  }, []);
  const revealRecordLink = (event) => {
    const href = event.target.closest("a")?.getAttribute("href");
    if (href && /^(?:\/climate)?#(power|rainfall|soil-moisture|vegetation)$/.test(href) && observationDetailsRef.current) observationDetailsRef.current.open = true;
  };

  const [summaryData, setSummaryData] = useState(null);
  const [metaData, setMetaData] = useState(null);
  const [summaryDistrict, setSummaryDistrict] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [environmentalSources, setEnvironmentalSources] = useState([]);
  const [latestEnvironmental, setLatestEnvironmental] = useState({ district: null, loaded: false, gpm: null, smap: null, modis: null });
  const latestDistrictRef = useRef(selectedDistrict);

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

  const handleDistrictChange = (districtCode) => {
    setSelectedDistrict(districtCode);
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
      ? currentDistrictObj?.nameBn || currentDistrictObj?.nameEn || selectedDistrict || "—"
      : currentDistrictObj?.nameEn || selectedDistrict || "—";

  const currentClimateSummary = summaryDistrict === selectedDistrict ? summaryData : null;
  const currentClimateMeta = summaryDistrict === selectedDistrict ? metaData : null;
  const currentEnvironmental = latestEnvironmental.district === selectedDistrict ? latestEnvironmental : null;
  const selectedDistrictLocation = isProjectDistrictCode(selectedDistrict) && currentDistrictObj?.code === selectedDistrict ? currentDistrictObj : null;
  const projectDistricts = getProjectDistricts(districts);
  const powerSource = environmentalSources.find((item) => item.datasetKey === "nasa:power:daily:point");
  const powerSourceCoverage = getDistrictValidCoverage(powerSource, selectedDistrict);
  const powerVerified = hasCurrentSummary && isSupportedPowerProvenance(metaData?.provenance);
  const powerCoverageLabel = powerSourceCoverage?.firstObservationDate && powerSourceCoverage?.lastObservationDate
    ? `${powerSourceCoverage.firstObservationDate} – ${powerSourceCoverage.lastObservationDate}`
    : locale === "bn" ? "তারিখের পরিসর অনুপলভ্য" : "Coverage dates unavailable";
  return <div className="mx-auto w-full max-w-[1200px] space-y-6" onClickCapture={revealRecordLink}>
    {view === "overview" ? null : <>

      <DistrictLocationPanel district={selectedDistrictLocation} locale={locale} />
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold text-content">{t("publicHeader.climateData")}</h1>
          <div className="flex flex-wrap items-center justify-start gap-2">
          {/* District selector */}
          <label className="relative flex min-h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 shadow-km-sm transition-colors focus-within:border-emerald">
            <MapPin className="h-4 w-4 text-emerald shrink-0" aria-hidden="true" />
            <select
              aria-label={locale === "bn" ? "জেলা-ভিত্তিক পর্যবেক্ষণের জেলা" : "District for district-level observations"}
              className="min-w-28 cursor-pointer appearance-none bg-transparent pr-6 text-sm font-medium text-content focus:outline-none"
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
            >
              {projectDistricts.map((d) => (
                <option key={d.code} value={d.code} className="bg-surface text-content">
                  {locale === "bn" ? d.nameBn || d.nameEn : d.nameEn}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" aria-hidden="true" />
          </label>

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
    </>}
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


    {view === "overview" ? <DashboardOverview available={hasCurrentSummary} metrics={{ rainfall: annualRainfallMean, temperature: meanTempAvg, humidity: humidityAvg, solar: solarAvg }} years={currentClimateMeta?.years_used} chartSeries={chartSeries} wettest={wettest} driest={driest} sources={environmentalSources} district={selectedDistrict} /> : <>

      <p className="text-sm text-muted">{t("dashboardUi.historyBoundary")}</p>
      {hasCurrentSummary && <>
          {/* Climate summary panel + monthly rainfall normal chart */}
          <section aria-label={t("dashboard.summaryTitle")}>
            <div className="grid gap-4 xl:grid-cols-12">
              <Card className="h-full xl:col-span-5">
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

                  <details className="mt-4 rounded-lg border border-line bg-surface-2 p-3 text-xs leading-relaxed text-muted">
                    <summary className="cursor-pointer font-medium text-content">{t("dashboardUi.details")}</summary>
                    {metaData?.formula_version && (
                      <p className="font-medium text-content mb-1">
                        {`${locale === "bn" ? "গণনা পদ্ধতি" : "Algorithm"}: ${metaData.formula_version}`}
                      </p>
                    )}
                    <p>{t("dashboard.limitationsNotice")}</p>
                  </details>
                </CardBody>
              </Card>

              <Card className="h-full xl:col-span-7">
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
                    monsoonLabel={t("dashboardUi.monsoonLabel")}
                  />
                </CardBody>
              </Card>
            </div>
          </section>
      </>}
      <EnvironmentalIntelligenceCards
        sectionTitle={t("dashboardUi.satelliteTab")}
        hideExploreLink
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
      <details ref={observationDetailsRef} className="rounded-2xl border border-line bg-surface p-4 sm:p-5"><summary className="cursor-pointer font-semibold text-content">{t("dashboardUi.observationDetails")}</summary><div className="mt-5">{children}</div></details>
      <details className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <summary className="cursor-pointer text-base font-semibold text-content">{t("dashboardUi.weatherTitle")}</summary>
        <div className="mt-5">
      <WeatherIntelligenceSection
        locationCode={selectedDistrict}
        locale={locale}
      />
        </div>
      </details>
    </>}
  </div>;
}
