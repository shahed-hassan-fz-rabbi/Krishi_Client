"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarRange,
  ChevronDown,
  CloudRain,
  Database,
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
import { Badge } from "@/components/ui/Badge.js";
import { Button } from "@/components/ui/Button.js";
import { Card, CardBody, CardHeader } from "@/components/ui/Card.js";
import { MetricCard } from "@/components/ui/MetricCard.js";
import { ErrorState, LoadingState } from "@/components/ui/States.js";
import { Table, TBody, TD, THead, TR } from "@/components/ui/Table.js";
import { Tooltip } from "@/components/ui/Tooltip.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { fetchClimateSummary, fetchEnvironmentalDataSources } from "@/services/api.js";

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
  const latestDistrictRef = useRef(selectedDistrict);

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
    try {
      const res = await fetchClimateSummary(districtCode);
      // Guard against race conditions when switching districts rapidly
      if (latestDistrictRef.current !== districtCode) return;

      if (res.success && res.data) {
        setSummaryData(res.data);
        setMetaData(res.meta);
        setSummaryDistrict(districtCode);
      } else {
        setError(res.error?.message || "Failed to load climate observations");
      }
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

  const hasCurrentSummary = Boolean(summaryData && summaryDistrict === selectedDistrict);

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

  const environmentalRow = (datasetKey, name, scope) => {
    const source = environmentalSources.find((item) => item.datasetKey === datasetKey);
    const isAvailable = source?.availability === "available";
    const observedDates = source?.firstObservationDate && source?.lastObservationDate
      ? `${source.firstObservationDate} – ${source.lastObservationDate}`
      : null;
    const countNote = isAvailable
      ? `${Number(source.observationCount).toLocaleString()} ${locale === "bn" ? "পর্যবেক্ষণ" : "observations"}${observedDates ? ` · ${observedDates}` : ""}`
      : source?.availability === "database_unavailable"
        ? locale === "bn" ? "ডেটাবেস সংযোগ নেই" : "Database unavailable"
        : source?.availability === "not_ingested"
          ? locale === "bn" ? "সংরক্ষিত পর্যবেক্ষণ নেই" : "No observations stored"
          : locale === "bn" ? "প্রাপ্যতা অজানা" : "Availability not loaded";
    return { name, scope, status: source?.availability || "unavailable", note: countNote };
  };

  const datasetRows = [
    {
      name: "NASA POWER — Agroclimatology Point Series (6 Parameters)",
      scope: "2001–2025 · PRECTOTCORR, T2M, T2M_MAX, T2M_MIN, RH2M, ALLSKY_SFC_SW_DWN",
      status: "configured",
      note: metaData
        ? `${Number(metaData.valid_observations || 0).toLocaleString()} / ${Number(metaData.total_observations || 0).toLocaleString()} valid observations · ${metaData.coverage_percent ?? "—"}% coverage`
        : "—",
    },
    environmentalRow("nasa:gpm:imerg:3imerghh:v07", "GPM IMERG V07 (Final Run)", "Bangladesh UTC+06 daily precipitation; complete only with 48/48 valid intervals"),
    environmentalRow("nasa:smap:spl3smp_e:v006", "SMAP SPL3SMP_E V006", "Surface soil moisture (9 km gridded); retrieval quality shown"),
    environmentalRow("nasa:modis:mod13q1:v061", "MODIS MOD13Q1.061", "NDVI / EVI 16-day composites; marginal quality distinguished"),
  ];

  return (
    <div className="space-y-6">
          {/* Page header: title + district selector + historical period */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-content">{t("dashboard.title")}</h1>
          <p className="mt-1 text-sm text-muted">
            <span className="font-semibold text-content">{districtDisplayName}</span>
            {" — "}
            {t("dashboard.subtitleNote")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* District selector */}
          <div className="relative flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
            <MapPin className="h-4 w-4 text-emerald shrink-0" aria-hidden="true" />
            <select
              aria-label={t("landing.supportedDistricts")}
              className="bg-transparent pr-6 text-sm font-medium text-content focus:outline-none cursor-pointer appearance-none"
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
          </div>

          {/* Historical period */}
          <div className="hidden items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-muted sm:flex">
            <CalendarRange className="h-4 w-4" aria-hidden="true" />
            <span className="font-medium text-content">{t("dashboard.period")}:</span> 2001–2025
          </div>

          {/* LST standard disclosure badge */}
          <Tooltip label={t("dashboard.timeStandardTooltip")}>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-climate/12 text-climate cursor-help">
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
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-content hover:bg-surface-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-emerald" : ""}`} aria-hidden="true" />
              {t("dashboard.refresh")}
            </button>
          </Tooltip>
        </div>
      </header>

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
            <h2 className="mb-3 text-sm font-semibold text-muted">{t("dashboard.metricsTitle")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={CloudRain}
                tone="climate"
                label={t("dashboard.annualRainfall")}
                value={annualRainfallMean}
                unit="mm/yr"
                hint={t("dashboard.annualRainfallHint")}
                demo={false}
              />
              <MetricCard
                icon={ThermometerSun}
                tone="amber"
                label={t("dashboard.meanTemp")}
                value={meanTempAvg}
                unit="°C"
                hint={t("dashboard.meanTempHint")}
                demo={false}
              />
              <MetricCard
                icon={Droplets}
                tone="emerald"
                label={t("dashboard.humidity")}
                value={humidityAvg}
                unit="%"
                hint={t("dashboard.humidityHint")}
                demo={false}
              />
              <MetricCard
                icon={Sun}
                tone="purple"
                label={t("dashboard.solarRadiation")}
                value={solarAvg}
                unit="MJ/m²/d"
                hint={t("dashboard.solarRadiationHint")}
                demo={false}
              />
            </div>
          </section>

          {/* Climate summary panel + monthly rainfall normal chart */}
          <section aria-label={t("dashboard.summaryTitle")}>
            <div className="grid gap-4 lg:grid-cols-4">
              <Card className="lg:col-span-2">
                <CardHeader
                  title={t("dashboard.summaryTitle")}
                  description={`${districtDisplayName} (2001–2025 · ${metaData?.years_used ?? "—"} ${t("dashboard.yearsUsed")})`}
                  action={
                    <Badge tone="sage" className="text-xs">
                      NASA POWER
                    </Badge>
                  }
                />
                <CardBody className="pt-3">
                  <ul className="divide-y divide-line">
                    <li className="flex items-center justify-between py-2.5">
                      <p className="text-sm text-muted">{t("dashboard.summaryWettest")}</p>
                      <p className="text-sm font-semibold text-content">
                        {wettest.value}
                        <span className="ml-1 text-xs font-normal text-muted">mm</span>
                        <span className="ml-2 text-xs font-medium text-emerald">({wettest.month})</span>
                      </p>
                    </li>
                    <li className="flex items-center justify-between py-2.5">
                      <p className="text-sm text-muted">{t("dashboard.summaryDriest")}</p>
                      <p className="text-sm font-semibold text-content">
                        {driest.value}
                        <span className="ml-1 text-xs font-normal text-muted">mm</span>
                        <span className="ml-2 text-xs font-medium text-amber">({driest.month})</span>
                      </p>
                    </li>
                    <li className="flex items-center justify-between py-2.5">
                      <p className="text-sm text-muted">{t("dashboard.summaryHottest")}</p>
                      <p className="text-sm font-semibold text-content">
                        {hottest.value}
                        <span className="ml-1 text-xs font-normal text-muted">°C</span>
                        <span className="ml-2 text-xs font-medium text-danger">({hottest.month})</span>
                      </p>
                    </li>
                    <li className="flex items-center justify-between py-2.5">
                      <p className="text-sm text-muted">{t("dashboard.summaryCoolest")}</p>
                      <p className="text-sm font-semibold text-content">
                        {coolest.value}
                        <span className="ml-1 text-xs font-normal text-muted">°C</span>
                        <span className="ml-2 text-xs font-medium text-climate">({coolest.month})</span>
                      </p>
                    </li>
                  </ul>

                  <div className="mt-4 rounded-lg bg-surface-2 p-3 text-xs text-muted">
                    <p className="font-medium text-content mb-1">
                      {metaData?.formula_version ? `Algorithm: ${metaData.formula_version}` : "Algorithm: v1.0.0-phase3"}
                    </p>
                    <p>{t("dashboard.limitationsNotice")}</p>
                  </div>
                </CardBody>
              </Card>

              <Card className="lg:col-span-2">
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
                  />
                </CardBody>
              </Card>
            </div>
          </section>
        </>
      )}

      {/* Handoff Window Intelligence promotional card */}
      <section>
        <Card className="border-emerald/25 bg-gradient-to-br from-sage/70 to-transparent dark:from-sage/25">
          <CardHeader
            title={t("dashboard.handoffTeaserTitle")}
            description={t("dashboard.handoffTeaserBody")}
          />
          <CardBody className="flex flex-wrap items-center gap-4 pt-3">
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral">0 d</Badge>
              <ArrowRight className="h-4 w-4 self-center text-muted" aria-hidden="true" />
              <Badge tone="neutral">7 d</Badge>
              <ArrowRight className="h-4 w-4 self-center text-muted" aria-hidden="true" />
              <Badge tone="neutral">14 d</Badge>
            </div>
            <Button href="/handoff" size="sm" variant="forest">
              <Wheat className="h-4 w-4" aria-hidden="true" />
              {t("dashboard.handoffTeaserCta")}
            </Button>
          </CardBody>
        </Card>
      </section>

      {/* Dataset transparency table */}
      <section aria-label={t("dashboard.dataStatusTitle")}>
        <Card>
          <CardHeader title={t("dashboard.dataStatusTitle")} />
          <CardBody className="pt-3">
            <Table>
              <THead
                columns={[
                  t("dashboard.colDataset"),
                  t("dashboard.colScope"),
                  t("dashboard.colStatus"),
                ]}
              />
              <TBody>
                {datasetRows.map((d) => (
                  <TR key={d.name}>
                    <TD className="font-medium">
                      <div>{d.name}</div>
                      <div className="text-xs text-muted mt-0.5">{d.note}</div>
                    </TD>
                    <TD className="text-muted">{d.scope}</TD>
                    <TD>
                      <Badge tone={d.status === "available" || d.status === "configured" ? "neutral" : "purple"}>
                        {d.status === "available"
                          ? locale === "bn" ? "পর্যবেক্ষণ উপলভ্য" : "Historical observations available"
                          : d.status === "configured"
                          ? locale === "bn"
                            ? "কনফিগার করা · ডেটা স্বাধীনভাবে যাচাই হয়নি"
                            : "Configured · data not independently verified"
                          : d.status === "database_unavailable"
                            ? locale === "bn" ? "ডেটাবেস সংযোগ নেই" : "Database unavailable"
                            : d.status === "not_ingested"
                              ? locale === "bn" ? "সংরক্ষিত পর্যবেক্ষণ নেই" : "No observations stored"
                              : locale === "bn" ? "প্রাপ্যতা অজানা" : "Availability not loaded"}
                      </Badge>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <p className="mt-4 flex items-start gap-2 text-xs text-muted">
              <Database className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" aria-hidden="true" />
              <span>
                <strong>{t("dashboard.timeStandardBadge")}:</strong> {t("dashboard.timeStandardTooltip")}
              </span>
            </p>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
