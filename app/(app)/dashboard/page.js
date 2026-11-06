"use client";

import {
  CalendarRange,
  CloudRain,
  Database,
  Droplets,
  Leaf,
  MapPin,
  RefreshCw,
  ThermometerSun,
  Wheat,
  ArrowRight,
} from "lucide-react";

import { SampleClimateChart } from "@/components/charts/SampleClimateChart.js";
import { Badge, SampleBadge } from "@/components/ui/Badge.js";
import { Button } from "@/components/ui/Button.js";
import { Card, CardBody, CardHeader } from "@/components/ui/Card.js";
import { MetricCard } from "@/components/ui/MetricCard.js";
import { Table, TBody, TD, THead, TR } from "@/components/ui/Table.js";
import { Tooltip } from "@/components/ui/Tooltip.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";

const sampleMetrics = [
  { id: "rain30", labelKey: "rain30", value: "486", unit: "mm", icon: CloudRain, tone: "climate", hintKey: "rain30Hint" },
  { id: "tmax", labelKey: "tmaxAvg", value: "31.2", unit: "°C", icon: ThermometerSun, tone: "amber", hintKey: "tmaxHint" },
  { id: "rh", labelKey: "rhAvg", value: "78", unit: "%", icon: Droplets, tone: "emerald", hintKey: "rhHint" },
  { id: "ndvi", labelKey: "ndviAvg", value: "0.62", unit: "NDVI", icon: Leaf, tone: "purple", hintKey: "ndviHint" },
];

const metricCopy = {
  en: {
    rain30: "Rainfall — last 30 days",
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
    rain30: "বৃষ্টিপাত — শেষ ৩০ দিন",
    rain30Hint: "ঐতিহাসিক রেকর্ডের উপর রোলিং সময়সীমা",
    tmaxAvg: "গড় দৈনিক সর্বোচ্চ তাপমাত্রা",
    tmaxHint: "স্যাটেলাইট থেকে পাওয়া ২ মিটার তাপমাত্রা",
    rhAvg: "গড় তুলনামূলক আর্দ্রতা",
    rhHint: "২ মিটার আপেক্ষিক আর্দ্রতা",
    ndviAvg: "উদ্ভিদ সবুজভাব (NDVI)",
    ndviHint: "১৬ দিনের MODIS কম্পোজিট",
    sample: "নমুনা",
  },
};

const summaryRows = [
  { id: "wettest", labelKey: "summaryWettest", value: "685", unit: "mm", detail: "Jul" },
  { id: "driest", labelKey: "summaryDriest", value: "10", unit: "mm", detail: "Dec" },
  { id: "hottest", labelKey: "summaryHottest", value: "33.5", unit: "°C", detail: "Apr" },
  { id: "coolest", labelKey: "summaryCoolest", value: "22.8", unit: "°C", detail: "Jan" },
];

const datasetRows = [
  { name: "NASA POWER — PRECTOTCORR, T2M, T2M_MAX, T2M_MIN, RH2M", scope: "2001–present · daily point series", status: "ready" },
  { name: "GPM IMERG V07 (Final Run)", scope: "2020–2025 · daily satellite rainfall", status: "planned" },
  { name: "SMAP SPL3SMP_E V006", scope: "2015–present · surface soil moisture", status: "planned" },
  { name: "MODIS MOD13Q1.061", scope: "2020–present · NDVI / EVI", status: "planned" },
];

export default function DashboardPage() {
  const { t, locale } = useLang();
  const m = metricCopy[locale] || metricCopy.en;

  return (
    <div className="space-y-6">
      {/* Page header: title + district selector + historical period + refresh action */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-content">{t("dashboard.title")}</h1>
          <p className="mt-1 text-sm text-muted">
            <span className="font-medium text-content">{t("dashboard.subtitleHeading")}</span>
            {" — "}
            {t("dashboard.subtitleNote")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
            <MapPin className="h-4 w-4 text-emerald" aria-hidden="true" />
            <select
              aria-label={t("landing.district")}
              className="bg-transparent text-sm font-medium text-content focus:outline-none"
              defaultValue="chittogram"
            >
              <option value="chittogram">Chattogram</option>
            </select>
          </div>
          <div className="hidden items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-muted sm:flex">
            <CalendarRange className="h-4 w-4" aria-hidden="true" />
            <span className="font-medium text-content">{t("dashboard.period")}:</span> 2001–2025
          </div>
          <Tooltip label={t("dashboard.refreshNote")}>
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-muted"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {t("dashboard.refresh")}
            </button>
          </Tooltip>
          <SampleBadge label={m.sample} />
        </div>
      </header>

      {/* Metric cards — all sample values until Phase 3+ */}
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

      {/* Handoff teaser + rainfall chart + climate summary panel */}
      <section aria-label={t("dashboard.metricsTitle")}>
        <div className="grid gap-4 lg:grid-cols-4">
          <Card className="lg:col-span-2">
            <CardHeader
              title={t("dashboard.summaryTitle")}
              description={t("common.defaultDistrict")}
              action={<SampleBadge label={m.sample} />}
            />
            <CardBody className="pt-3">
              <ul className="divide-y divide-line">
                {summaryRows.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2.5">
                    <p className="text-sm text-muted">{t(`dashboard.${r.labelKey}`)}</p>
                    <p className="text-sm font-semibold text-content">
                      {r.value}
                      <span className="ml-1 text-xs font-normal text-muted">{r.unit}</span>
                      <span className="ml-2 text-xs text-muted">{r.detail}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader
              title={t("dashboard.chartTitle")}
              description={t("dashboard.chartNote")}
              action={<SampleBadge label={m.sample} />}
            />
            <CardBody className="pt-3">
              <SampleClimateChart seriesLabel={t("dashboard.climateChartSeries")} />
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Handoff Window Intelligence promotional card */}
      <section>
        <Card className="border-emerald/25 bg-gradient-to-br from-sage/70 to-transparent dark:from-sage/25">
          <CardHeader
            title={t("dashboard.handoffTeaserTitle")}
            description={t("dashboard.handoffTeaserBody")}
          />
          <CardBody className="flex flex-wrap items-center gap-4 pt-3">
            <div className="flex flex-wrap gap-2">
              <Badge tone="low">0 d</Badge>
              <ArrowRight className="h-4 w-4 self-center text-muted" aria-hidden="true" />
              <Badge tone="moderate">7 d</Badge>
              <ArrowRight className="h-4 w-4 self-center text-muted" aria-hidden="true" />
              <Badge tone="high">14 d</Badge>
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
