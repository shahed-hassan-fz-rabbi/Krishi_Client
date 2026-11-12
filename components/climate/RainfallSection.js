"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarRange,
  ChevronDown,
  CloudRain,
  Droplets,
  Info,
  MapPin,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { ClimateMonthlyChart } from "@/components/charts/ClimateMonthlyChart.js";
import { Badge } from "@/components/ui/Badge.js";
import { Card, CardBody, CardHeader } from "@/components/ui/Card.js";
import { ErrorState, LoadingState } from "@/components/ui/States.js";
import { Table, TBody, TD, THead, TR } from "@/components/ui/Table.js";
import { Tooltip } from "@/components/ui/Tooltip.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { fetchPrecipitationLatest, fetchRainfall } from "@/services/api.js";

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_NAMES_BN = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

export default function RainfallSection({ embedded = false, refreshToken = 0, onOverview }) {
  const { t, locale } = useLang();
  const { selectedDistrict, setSelectedDistrict, districts, currentDistrictObj } = useLocation();

  const [monthlyData, setMonthlyData] = useState(null);
  const [seasonalData, setSeasonalData] = useState(null);
  const [gpmData, setGpmData] = useState(null);
  const [metaData, setMetaData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const latestDistrictRef = useRef(selectedDistrict);

  const monthNames = locale === "bn" ? MONTH_NAMES_BN : MONTH_NAMES_EN;

  const loadRainfallData = useCallback(async (districtCode) => {
    latestDistrictRef.current = districtCode;
    setIsLoading(true);
    setError(null);
    setMonthlyData(null);
    setSeasonalData(null);
    setGpmData(null);
    onOverview?.("gpm", { districtCode, status: "loading", complete: false, value: null, date: null });
    try {
      const [mRes, sRes, gRes] = await Promise.all([
        fetchRainfall(districtCode, { grouping: "monthly" }),
        fetchRainfall(districtCode, { grouping: "seasonal" }),
        fetchPrecipitationLatest(districtCode).catch(() => null),
      ]);

      if (latestDistrictRef.current !== districtCode) return;

      if (mRes.success && mRes.data) {
        setMonthlyData(mRes.data);
        setMetaData(mRes.meta);
      } else {
        throw new Error(mRes.error?.message || "Failed to load monthly rainfall data");
      }

      if (sRes.success && sRes.data) {
        setSeasonalData(sRes.data);
      }
      const nextGpmData = gRes?.success && gRes.data ? { ...gRes.data, meta: gRes.meta } : null;
      setGpmData(nextGpmData);
    } catch (err) {
      if (latestDistrictRef.current === districtCode) {
        setError(err.message || "Failed to load rainfall intelligence");
      }
    } finally {
      if (latestDistrictRef.current === districtCode) {
        setIsLoading(false);
      }
    }
  }, [onOverview]);

  useEffect(() => {
    if (isLoading || latestDistrictRef.current !== selectedDistrict) return;
    const daily = gpmData?.latestDailySummary;
    const complete = daily?.completeness === "complete" && daily?.validIntervals === 48 && Number.isFinite(daily?.totalPrecipitationMm);
    onOverview?.("gpm", {
      districtCode: selectedDistrict,
      status: error || !gpmData ? "unavailable" : (complete ? "complete" : "incomplete"),
      complete: !error && Boolean(gpmData) && complete,
      value: !error && complete ? daily.totalPrecipitationMm : null,
      date: daily?.dateLabel || null,
    });
  }, [error, gpmData, isLoading, onOverview, selectedDistrict]);

  useEffect(() => {
    if (selectedDistrict) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadRainfallData(selectedDistrict);
    }
  }, [selectedDistrict, refreshToken, loadRainfallData]);

  // Transform monthly normals for chart and table
  const chartSeries = [];
  const tableRows = [];

  if (monthlyData?.historical_normals) {
    for (let m = 1; m <= 12; m++) {
      const entry = monthlyData.historical_normals[String(m)];
      const stats = entry?.stats || {};
      const mLabel = monthNames[m - 1];

      chartSeries.push({
        month: m,
        monthLabel: mLabel.substring(0, 3),
        mean: stats.mean != null ? Math.round(stats.mean * 10) / 10 : null,
        median: stats.median != null ? Math.round(stats.median * 10) / 10 : null,
      });

      tableRows.push({
        monthNumber: m,
        monthName: mLabel,
        mean: stats.mean != null ? stats.mean.toFixed(1) : "—",
        median: stats.median != null ? stats.median.toFixed(1) : "—",
        p25: stats.p25 != null ? stats.p25.toFixed(1) : "—",
        p75: stats.p75 != null ? stats.p75.toFixed(1) : "—",
        p90: stats.p90 != null ? stats.p90.toFixed(1) : "—",
        minMax: stats.min != null && stats.max != null ? `${stats.min.toFixed(1)} – ${stats.max.toFixed(1)}` : "—",
        yearsUsed: entry?.years_used ?? null,
      });
    }
  }

  const districtDisplayName =
    locale === "bn"
      ? currentDistrictObj?.nameBn || currentDistrictObj?.nameEn || "চট্টগ্রাম"
      : currentDistrictObj?.nameEn || "Chattogram";

  const seasons = seasonalData?.historical_seasons || {};

  const Heading = embedded ? "h2" : "h1";

  return (
    <section id={embedded ? "rainfall" : undefined} aria-labelledby={embedded ? "rainfall-section-title" : undefined} className="scroll-mt-24 space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge tone="blue">
              <CloudRain className="h-3.5 w-3.5" aria-hidden="true" />
              PRECTOTCORR
            </Badge>
            <span className="text-xs text-muted">WMO Standard: ≥ 1.0 mm/day</span>
          </div>
          <Heading id={embedded ? "rainfall-section-title" : undefined} className="text-xl font-bold tracking-tight text-content sm:text-2xl">
            {t("rainfall.title")}
          </Heading>
          <p className="mt-1 text-sm text-muted">
            <span className="font-semibold text-content">{districtDisplayName}</span> — {t("rainfall.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* The integrated page has one shared district selector. */}
          {!embedded && <>
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
          </>}

          <div className="hidden items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-muted sm:flex">
            <CalendarRange className="h-4 w-4" aria-hidden="true" />
            <span className="font-medium text-content">2001–2025</span>
          </div>

          <Tooltip label={t("dashboard.refreshNote")}>
            <button
              type="button"
              onClick={() => loadRainfallData(selectedDistrict)}
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
      {isLoading && (
        <Card>
          <CardBody>
            <LoadingState />
          </CardBody>
        </Card>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <Card>
          <CardBody>
            <ErrorState onRetry={() => loadRainfallData(selectedDistrict)} />
            <p className="mt-2 text-center text-xs text-danger">{error}</p>
          </CardBody>
        </Card>
      )}

      {/* Monthly chart & Seasonal overview */}
      <Card>
        <CardHeader title={locale === "bn" ? "NASA GPM IMERG Final V07 পর্যবেক্ষণ" : "NASA GPM IMERG Final V07 Observation"}
          description={locale === "bn" ? "অর্ধঘণ্টার স্যাটেলাইট বৃষ্টিপাত; দৈনিক মোট কেবল ৪৮/৪৮ বৈধ ব্যবধানে" : "Half-hourly satellite precipitation; daily total requires 48/48 valid intervals"} />
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-xs text-muted">{locale === "bn" ? "পর্যবেক্ষণের দিন (UTC+6)" : "Observation day (UTC+6)"}</p><p className="font-mono font-semibold text-content">{gpmData?.latestDailySummary?.dateLabel || "—"}</p></div>
          <div><p className="text-xs text-muted">{locale === "bn" ? "সম্পূর্ণ দৈনিক মোট" : "Complete daily total"}</p><p className="font-mono font-semibold text-content">{gpmData?.latestDailySummary?.completeness === "complete" && gpmData.latestDailySummary.validIntervals === 48 ? `${gpmData.latestDailySummary.totalPrecipitationMm} mm` : (locale === "bn" ? "অসম্পূর্ণ/অনুপস্থিত — মোট দেখানো হয়নি" : "Incomplete/unavailable — total withheld")}</p></div>
          <div><p className="text-xs text-muted">{locale === "bn" ? "বৈধ ব্যবধান" : "Valid intervals"}</p><p className="font-mono font-semibold text-content">{gpmData?.latestDailySummary?.validIntervals != null ? `${gpmData.latestDailySummary.validIntervals}/48` : "—"}</p></div>
          <div><p className="text-xs text-muted">{locale === "bn" ? "সর্বশেষ ব্যবধান; পর্যবেক্ষণ সময়" : "Latest interval; observation time"}</p><p className="font-mono text-xs text-content">{gpmData?.latestInterval?.intervalStartUtc ? new Date(gpmData.latestInterval.intervalStartUtc).toISOString() : "—"}</p></div>
          <p className="sm:col-span-2 lg:col-span-4 text-xs text-muted">{gpmData?.meta?.limitations?.join(" ") || "NASA GPM IMERG is a regional ~0.1° grid estimate, not a farm rain gauge. No offline GPM snapshot is configured."}</p>
        </CardBody>
      </Card>

      {!isLoading && monthlyData && (
        <>
          <section>
            <Card>
              <CardHeader
                title={t("rainfall.monthlyNormalsTitle")}
                description={t("rainfall.monthlyNormalsDesc")}
                action={
                  <Badge tone="emerald">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    {metaData?.years_used ?? "—"} {t("dashboard.yearsUsed")}
                  </Badge>
                }
              />
              <CardBody className="pt-2">
                <ClimateMonthlyChart
                  data={chartSeries}
                  dataKey="mean"
                  medianKey="median"
                  unit="mm"
                  title="Monthly Rainfall Normals"
                  showMedian={true}
                  barColor="var(--km-climate)"
                />
              </CardBody>
            </Card>
          </section>

          {/* Seasonal breakdown according to BMD standards */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-content">{t("rainfall.seasonalTitle")}</h2>
              <p className="text-xs text-muted">{t("rainfall.seasonalDesc")}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Winter */}
              <Card className="border-blue/20">
                <CardBody className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-content text-sm">{t("rainfall.winter")}</h3>
                    <Badge tone="blue" className="text-xs">Dec–Feb</Badge>
                  </div>
                  <p className="text-2xl font-bold text-content">
                    {seasons.winter?.stats?.mean != null ? `${Math.round(seasons.winter.stats.mean)} mm` : "—"}
                  </p>
                  <p className="text-xs text-muted">
                    Median: {seasons.winter?.stats?.median != null ? `${Math.round(seasons.winter.stats.median)} mm` : "—"}
                  </p>
                  <div className="text-xs text-muted pt-2 border-t border-line">
                    P25 – P75: {seasons.winter?.stats?.p25 != null ? Math.round(seasons.winter.stats.p25) : "—"} – {seasons.winter?.stats?.p75 != null ? Math.round(seasons.winter.stats.p75) : "—"} mm
                  </div>
                </CardBody>
              </Card>

              {/* Pre-Monsoon */}
              <Card className="border-amber/20">
                <CardBody className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-content text-sm">{t("rainfall.preMonsoon")}</h3>
                    <Badge tone="moderate" className="text-xs">Mar–May</Badge>
                  </div>
                  <p className="text-2xl font-bold text-content">
                    {seasons.pre_monsoon?.stats?.mean != null ? `${Math.round(seasons.pre_monsoon.stats.mean)} mm` : "—"}
                  </p>
                  <p className="text-xs text-muted">
                    Median: {seasons.pre_monsoon?.stats?.median != null ? `${Math.round(seasons.pre_monsoon.stats.median)} mm` : "—"}
                  </p>
                  <div className="text-xs text-muted pt-2 border-t border-line">
                    P25 – P75: {seasons.pre_monsoon?.stats?.p25 != null ? Math.round(seasons.pre_monsoon.stats.p25) : "—"} – {seasons.pre_monsoon?.stats?.p75 != null ? Math.round(seasons.pre_monsoon.stats.p75) : "—"} mm
                  </div>
                </CardBody>
              </Card>

              {/* Monsoon */}
              <Card className="border-emerald/20">
                <CardBody className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-content text-sm">{t("rainfall.monsoon")}</h3>
                    <Badge tone="emerald" className="text-xs">Jun–Sep</Badge>
                  </div>
                  <p className="text-2xl font-bold text-content">
                    {seasons.monsoon?.stats?.mean != null ? `${Math.round(seasons.monsoon.stats.mean)} mm` : "—"}
                  </p>
                  <p className="text-xs text-muted">
                    Median: {seasons.monsoon?.stats?.median != null ? `${Math.round(seasons.monsoon.stats.median)} mm` : "—"}
                  </p>
                  <div className="text-xs text-muted pt-2 border-t border-line">
                    P25 – P75: {seasons.monsoon?.stats?.p25 != null ? Math.round(seasons.monsoon.stats.p25) : "—"} – {seasons.monsoon?.stats?.p75 != null ? Math.round(seasons.monsoon.stats.p75) : "—"} mm
                  </div>
                </CardBody>
              </Card>

              {/* Post-Monsoon */}
              <Card className="border-purple/20">
                <CardBody className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-content text-sm">{t("rainfall.postMonsoon")}</h3>
                    <Badge tone="purple" className="text-xs">Oct–Nov</Badge>
                  </div>
                  <p className="text-2xl font-bold text-content">
                    {seasons.post_monsoon?.stats?.mean != null ? `${Math.round(seasons.post_monsoon.stats.mean)} mm` : "—"}
                  </p>
                  <p className="text-xs text-muted">
                    Median: {seasons.post_monsoon?.stats?.median != null ? `${Math.round(seasons.post_monsoon.stats.median)} mm` : "—"}
                  </p>
                  <div className="text-xs text-muted pt-2 border-t border-line">
                    P25 – P75: {seasons.post_monsoon?.stats?.p25 != null ? Math.round(seasons.post_monsoon.stats.p25) : "—"} – {seasons.post_monsoon?.stats?.p75 != null ? Math.round(seasons.post_monsoon.stats.p75) : "—"} mm
                  </div>
                </CardBody>
              </Card>
            </div>
          </section>

          {/* Full monthly historical distribution table */}
          <section>
            <Card>
              <CardHeader
                title="Historical Monthly Percentile Distribution (2001–2025)"
                description={t("rainfall.monthlyDistributionDesc")}
              />
              <CardBody className="pt-2 overflow-x-auto">
                <Table>
                  <THead
                    columns={[
                      t("rainfall.colMonth"),
                      t("rainfall.colMean"),
                      t("rainfall.colMedian"),
                      t("rainfall.colP25"),
                      t("rainfall.colP75"),
                      t("rainfall.colP90"),
                      t("rainfall.colMinMax"),
                      "Years Used",
                    ]}
                  />
                  <TBody>
                    {tableRows.map((r) => (
                      <TR key={r.monthNumber}>
                        <TD className="font-medium text-content">{r.monthName}</TD>
                        <TD className="font-semibold text-content">{r.mean}</TD>
                        <TD className="text-emerald font-medium">{r.median}</TD>
                        <TD className="text-muted">{r.p25}</TD>
                        <TD className="text-muted">{r.p75}</TD>
                        <TD className="text-muted">{r.p90}</TD>
                        <TD className="text-muted text-xs font-mono">{r.minMax}</TD>
                        <TD className="text-muted text-xs">{r.yearsUsed ?? "—"}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>

                <div className="mt-4 rounded-lg bg-surface-2 p-3 text-xs text-muted flex items-start gap-2">
                  <Info className="h-4 w-4 text-emerald shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-content mb-0.5">
                      Provenance: {metaData?.dataset_provenance || "nasa:power:daily:point"} · Time standard: {metaData?.time_standard || "LST"}
                    </p>
                    <p>{metaData?.limitations || t("dashboard.limitationsNotice")}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </section>
        </>
      )}
    </section>
  );
}
