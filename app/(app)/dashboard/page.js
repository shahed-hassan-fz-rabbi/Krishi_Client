"use client";

import Link from "next/link";
import {
  ArrowRight,
  CloudRain,
  Database,
  Droplets,
  Leaf,
  ThermometerSun,
  Wheat,
} from "lucide-react";

import { SampleClimateChart } from "@/components/charts/SampleClimateChart.js";
import { Badge, SampleBadge } from "@/components/ui/Badge.js";
import { Button } from "@/components/ui/Button.js";
import { Card, CardBody, CardHeader } from "@/components/ui/Card.js";
import { MetricCard } from "@/components/ui/MetricCard.js";
import { TBody, TD, THead, TR, Table } from "@/components/ui/Table.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";

const sampleMetrics = [
  { id: "rain30", labelKey: "rain30", value: "486", unit: "mm", icon: CloudRain, tone: "climate", hintKey: "rain30Hint" },
  { id: "tmax", labelKey: "tmaxAvg", value: "31.2", unit: "Â°C", icon: ThermometerSun, tone: "amber", hintKey: "tmaxHint" },
  { id: "rh", labelKey: "rhAvg", value: "78", unit: "%", icon: Droplets, tone: "emerald", hintKey: "rhHint" },
  { id: "ndvi", labelKey: "ndviAvg", value: "0.62", unit: "NDVI", icon: Leaf, tone: "purple", hintKey: "ndviHint" },
];

const metricCopy = {
  en: {
    rain30: "Rainfall â€” last 30 days",
    rain30Hint: "Rolling window over the historical record",
    tmaxAvg: "Avg. daily max temperature",
    tmaxHint: "Satellite-derived 2 m temperature",
    rhAvg: "Avg. relative humidity",
    rhHint: "2 m relative humidity",
    ndviAvg: "Vegetation index (NDVI)",
    ndviHint: "16-day MODIS composite trend",
    sample: "Sample",
  },
  bn: {
    rain30: "à¦¬à§ƒà¦·à§à¦Ÿà¦¿à¦ªà¦¾à¦¤ â€” à¦¶à§‡à¦· à§©à§¦ à¦¦à¦¿à¦¨",
    rain30Hint: "à¦à¦¤à¦¿à¦¹à¦¾à¦¸à¦¿à¦• à¦°à§‡à¦•à¦°à§à¦¡à§‡à¦° à¦‰à¦ªà¦° à¦°à§‹à¦²à¦¿à¦‚ à¦¸à¦®à¦¯à¦¼à¦¸à§€à¦®à¦¾",
    tmaxAvg: "à¦—à¦¡à¦¼ à¦¸à¦°à§à¦¬à§‹à¦šà§à¦š à¦¤à¦¾à¦ªà¦®à¦¾à¦¤à§à¦°à¦¾",
    tmaxHint: "à¦¸à§à¦¯à¦¾à¦Ÿà§‡à¦²à¦¾à¦‡à¦Ÿ à¦¥à§‡à¦•à§‡ à¦ªà¦¾à¦“à¦¯à¦¼à¦¾ à§¨ à¦®à¦¿à¦Ÿà¦¾à¦° à¦¤à¦¾à¦ªà¦®à¦¾à¦¤à§à¦°à¦¾",
    rhAvg: "à¦—à¦¡à¦¼ à¦¤à§à¦²à¦¨à¦¾à¦®à§‚à¦²à¦• à¦†à¦°à§à¦¦à§à¦°à¦¤à¦¾",
    rhHint: "à§¨ à¦®à¦¿à¦Ÿà¦¾à¦° à¦†à¦ªà§‡à¦•à§à¦·à¦¿à¦• à¦†à¦°à§à¦¦à§à¦°à¦¤à¦¾",
    ndviAvg: "à¦‰à¦¦à§à¦­à¦¿à¦¦ à¦¸à¦¬à§à¦œà¦­à¦¾à¦¬ (NDVI)",
    ndviHint: "à§§à§¬ à¦¦à¦¿à¦¨à§‡à¦° MODIS à¦•à¦®à§à¦ªà§‹à¦œà¦¿à¦Ÿ",
    sample: "à¦¨à¦®à§à¦¨à¦¾",
  },
};

const datasetRows = [
  { name: "NASA POWER â€” PRECTOTCORR, T2M, T2M_MAX, T2M_MIN, RH2M", scope: "2001â€“present Â· daily point series", status: "ready" },
  { name: "GPM IMERG V07 (Final Run)", scope: "2020â€“2025 Â· daily satellite rainfall", status: "planned" },
  { name: "SMAP SPL3SMP_E V006", scope: "2015â€“present Â· surface soil moisture", status: "planned" },
  { name: "MODIS MOD13Q1.061", scope: "2020â€“present Â· NDVI / EVI", status: "planned" },
];

export default function DashboardPage() {
  const { t, locale } = useLang();
  const m = metricCopy[locale] || metricCopy.en;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-content">{t("dashboard.title")}</h1>
          <p className="mt-1 text-sm text-muted">
            <span className="font-medium text-content">{t("dashboard.subtitleHeading")}</span>
            {" â€” "}
            {t("dashboard.subtitleNote")}
          </p>
        </div>
        <SampleBadge label={m.sample} />
      </header>

      {/* Metric cards â€” all sample values until Phase 3+ */}
      <section aria-label={t("dashboard.metricsTitle")}>
        <h2 className="mb-3 text-sm font-semibold text-muted">{t("dashboard.metricsTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sampleMetrics.map((metric) => (
            <MetricCard
              key={metric.id}
              icon={metric.icon}
              tone={metric.tone}
              label={m[metric.labelKey]}
              value={metric.value}
              unit={metric.unit}
              hint={m[metric.hintKey]}
              demo
              demoLabel={m.sample}
            />
          ))}
        </div>
      </section>

      {/* Handoff teaser + sample chart */}
      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader
            title={t("dashboard.handoffTeaserTitle")}
            description={t("dashboard.handoffTeaserBody")}
          />
          <CardBody className="pt-3">
            <div className="flex flex-wrap gap-2 pb-4">
              <Badge tone="low">0 d</Badge>
              <ArrowRight className="h-4 w-4 self-center text-muted" aria-hidden="true" />
              <Badge tone="moderate">7 d</Badge>
              <ArrowRight className="h-4 w-4 self-center text-muted" aria-hidden="true" />
              <Badge tone="high">14 d</Badge>
            </div>
            <Button href="/handoff" size="sm" variant="forest" className="w-full sm:w-auto">
              <Wheat className="h-4 w-4" aria-hidden="true" />
              {t("dashboard.handoffTeaserCta")}
            </Button>
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title={t("dashboard.chartTitle")}
            description={t("dashboard.chartNote")}
            action={<SampleBadge label={m.sample} />}
          />
          <CardBody className="pt-3">
            <SampleClimateChart seriesLabel={t("dashboard.climateChartSeries")} />
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
                    <TD className="font-medium">{d.name}</TD>
                    <TD className="text-muted">{d.scope}</TD>
                    <TD>
                      <Badge tone={d.status === "ready" ? "blue" : "purple"}>
                        {d.status === "ready" ? t("dashboard.statusReady") : t("dashboard.pendingUntil")}
                      </Badge>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <p className="mt-4 flex items-start gap-2 text-xs text-muted">
              <Database className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t("common.sampleNote")}
            </p>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
