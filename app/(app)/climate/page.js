"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarRange,
  Flame,
  Info,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Snowflake,
  Sun,
  Thermometer,
} from "lucide-react";

import { TemperatureRangeChart } from "@/components/charts/ClimateMonthlyChart.js";
import { Badge } from "@/components/ui/Badge.js";
import { Card, CardBody, CardHeader } from "@/components/ui/Card.js";
import { ErrorState, LoadingState } from "@/components/ui/States.js";
import { Table, TBody, TD, THead, TR } from "@/components/ui/Table.js";
import { Tooltip } from "@/components/ui/Tooltip.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { fetchTemperature } from "@/services/api.js";

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_NAMES_BN = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

export default function ClimatePage() {
  const { t, locale } = useLang();
  const { selectedDistrict, setSelectedDistrict, districts, currentDistrictObj } = useLocation();

  const [tempData, setTempData] = useState(null);
  const [metaData, setMetaData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const latestDistrictRef = useRef(selectedDistrict);

  const monthNames = locale === "bn" ? MONTH_NAMES_BN : MONTH_NAMES_EN;

  const loadClimateData = useCallback(async (districtCode) => {
    latestDistrictRef.current = districtCode;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchTemperature(districtCode, { metric: "all" });
      if (latestDistrictRef.current !== districtCode) return;

      if (res.success && res.data) {
        setTempData(res.data);
        setMetaData(res.meta);
      } else {
        throw new Error(res.error?.message || "Failed to load temperature intelligence");
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
      loadClimateData(selectedDistrict);
    }
  }, [selectedDistrict, loadClimateData]);

  // Display monthly normals and extremes supplied by the scientific API.
  const chartSeries = [];
  const tableRows = [];

  if (tempData?.monthly_historical) {
    const hist = tempData.monthly_historical;
    for (let m = 1; m <= 12; m++) {
      const entry = hist[String(m)];
      const stats = entry?.stats || {};
      const mLabel = monthNames[m - 1];
      const meanT2M = stats.mean != null ? Math.round(stats.mean * 10) / 10 : null;
      const meanTMax = entry?.mean_tmax?.mean != null
        ? Math.round(entry.mean_tmax.mean * 10) / 10
        : null;
      const meanTMin = entry?.mean_tmin?.mean != null
        ? Math.round(entry.mean_tmin.mean * 10) / 10
        : null;
      const diurnalRange = entry?.diurnal_range?.mean != null
        ? Math.round(entry.diurnal_range.mean * 10) / 10
        : null;

      chartSeries.push({
        month: m,
        monthLabel: mLabel.substring(0, 3),
        t2m: meanT2M,
        tmax: meanTMax,
        tmin: meanTMin,
      });

      tableRows.push({
        monthNumber: m,
        monthName: mLabel,
        meanT2M: meanT2M != null ? meanT2M.toFixed(1) : "—",
        meanTMax: meanTMax != null ? meanTMax.toFixed(1) : "—",
        meanTMin: meanTMin != null ? meanTMin.toFixed(1) : "—",
        diurnalRange: diurnalRange != null ? diurnalRange.toFixed(1) : "—",
        absMax: entry?.absolute_max != null ? entry.absolute_max.toFixed(1) : "—",
        absMin: entry?.absolute_min != null ? entry.absolute_min.toFixed(1) : "—",
        yearsUsed: entry?.years_used ?? 0,
      });
    }
  }

  const districtDisplayName =
    locale === "bn"
      ? currentDistrictObj?.nameBn || currentDistrictObj?.nameEn || "চট্টগ্রাম"
      : currentDistrictObj?.nameEn || "Chattogram";

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge tone="amber">
              <Thermometer className="h-3.5 w-3.5" aria-hidden="true" />
              T2M · TMAX · TMIN
            </Badge>
            <span className="text-xs text-muted">NASA POWER 2 m Air Temperature</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
            {t("climate.title")}
          </h1>
          <p className="mt-1 text-sm text-muted">
            <span className="font-semibold text-content">{districtDisplayName}</span> — {t("climate.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* District selector */}
          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
            <MapPin className="h-4 w-4 text-emerald" aria-hidden="true" />
            <select
              aria-label={t("landing.supportedDistricts")}
              className="bg-transparent text-sm font-medium text-content focus:outline-none cursor-pointer"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              {districts.map((d) => (
                <option key={d.code} value={d.code} className="bg-surface text-content">
                  {locale === "bn" ? d.nameBn || d.nameEn : d.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-muted sm:flex">
            <CalendarRange className="h-4 w-4" aria-hidden="true" />
            <span className="font-medium text-content">2001–2025</span>
          </div>

          <Tooltip label={t("dashboard.refreshNote")}>
            <button
              type="button"
              onClick={() => loadClimateData(selectedDistrict)}
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
            <ErrorState onRetry={() => loadClimateData(selectedDistrict)} />
            <p className="mt-2 text-center text-xs text-danger">{error}</p>
          </CardBody>
        </Card>
      )}

      {/* Temperature Range Chart */}
      {!isLoading && tempData && (
        <>
          <section>
            <Card>
              <CardHeader
                title={t("climate.tempNormalsTitle")}
                description={t("climate.tempNormalsDesc")}
                action={
                  <Badge tone="emerald">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    {metaData?.years_used ?? "—"} {t("dashboard.yearsUsed")}
                  </Badge>
                }
              />
              <CardBody className="pt-2">
                <TemperatureRangeChart data={chartSeries} title="Monthly Temperature Range" />
              </CardBody>
            </Card>
          </section>

          {/* Diurnal Range & Thermal Insights */}
          <section className="grid gap-4 md:grid-cols-2">
            <Card className="border-amber/20 bg-amber/5">
              <CardBody className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-amber" />
                  <h3 className="font-semibold text-content text-base">Diurnal Temperature Range (DTR)</h3>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  {t("climate.diurnalDesc")}
                </p>
              </CardBody>
            </Card>

            <Card className="border-blue/20 bg-climate/5">
              <CardBody className="space-y-3">
                <div className="flex items-center gap-2">
                  <Snowflake className="h-5 w-5 text-climate" />
                  <h3 className="font-semibold text-content text-base">{t("climate.evidenceTitle")}</h3>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  {t("climate.evidenceDesc")}
                </p>
              </CardBody>
            </Card>
          </section>

          {/* Full monthly temperature normals table */}
          <section>
            <Card>
              <CardHeader
                title="Monthly Temperature Statistics (2001–2025)"
                description={t("climate.monthlyTableDesc")}
              />
              <CardBody className="pt-2 overflow-x-auto">
                <Table>
                  <THead
                    columns={[
                      t("climate.colMonth"),
                      t("climate.colMeanT2M"),
                      t("climate.colMeanTMax"),
                      t("climate.colMeanTMin"),
                      t("climate.colDiurnal"),
                      t("climate.colAbsMax"),
                      t("climate.colAbsMin"),
                      "Years Used",
                    ]}
                  />
                  <TBody>
                    {tableRows.map((r) => (
                      <TR key={r.monthNumber}>
                        <TD className="font-medium text-content">{r.monthName}</TD>
                        <TD className="font-semibold text-amber">{r.meanT2M} °C</TD>
                        <TD className="text-danger">{r.meanTMax} °C</TD>
                        <TD className="text-climate">{r.meanTMin} °C</TD>
                        <TD className="text-content font-medium">{r.diurnalRange} °C</TD>
                        <TD className="text-xs font-mono text-danger/80">{r.absMax} °C</TD>
                        <TD className="text-xs font-mono text-climate/80">{r.absMin} °C</TD>
                        <TD className="text-muted text-xs">{r.yearsUsed}</TD>
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
    </div>
  );
}
