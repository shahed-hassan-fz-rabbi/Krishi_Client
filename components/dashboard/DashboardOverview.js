"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CloudRain, Droplets, Sun, ThermometerSun, Sprout } from "lucide-react";
import { ClimateMonthlyChart } from "@/components/charts/ClimateMonthlyChart.js";
import { Button } from "@/components/ui/Button.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { getDistrictValidCoverage } from "@/lib/dashboardData.js";

export default function DashboardOverview({ available, metrics, years, chartSeries, wettest, driest, sources, district }) {
  const { t, locale } = useLang();
  const number = (value) => new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-GB").format(value);
  const averageTag = Number.isFinite(years) && years > 0 ? t("dashboardDesign.averageTag").replace("{years}", number(years)) : null;
  const tiles = [
    { key: "annualRainfall", value: metrics.rainfall, unit: t("dashboardDesign.annualRainUnit"), icon: CloudRain, tint: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" },
    { key: "meanTemp", value: metrics.temperature, unit: t("dashboardDesign.temperatureUnit"), icon: ThermometerSun, tint: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
    { key: "humidity", value: metrics.humidity, unit: t("dashboardDesign.humidityUnit"), icon: Droplets, tint: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300" },
    { key: "solarRadiation", value: metrics.solar, unit: t("dashboardDesign.solarUnit"), icon: Sun, tint: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200" },
  ];
  return <div className="space-y-6 rounded-3xl bg-[#edf5eb] p-3 sm:p-5 dark:bg-bg">
    <header className="relative isolate overflow-hidden rounded-2xl bg-forest p-6 text-white sm:p-8 lg:min-h-[220px]">
      <Image src="/images/hero.png" alt="" fill sizes="(min-width: 1280px) 1200px, 100vw" className="-z-20 object-cover object-[center_75%]" priority />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#052e21]/95 via-[#052e21]/65 to-transparent" />
      <div className="max-w-xl"><h1 className="max-w-[24ch] text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{t("dashboardDesign.headline")}</h1><p className="mt-3 max-w-md text-sm leading-6 text-white/90">{t("dashboardDesign.subtitle")}</p>
        <div className="mt-5 flex flex-wrap gap-3"><Button href="/crop-rotation" variant="hero">{t("dashboardDesign.planButton")}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Button><Button href="/climate" variant="outline" className="border-white/60 bg-white/10 text-white hover:bg-white/20 hover:text-white">{t("dashboardDesign.climateButton")}</Button></div>
      </div>
    </header>
    {available && <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("dashboard.metricsTitle")}>
        {tiles.filter(({ value }) => value !== "—").map(({ key, value, unit, icon: Icon, tint }) => <article key={key} className="flex min-h-[130px] flex-col rounded-2xl border border-[#d5e4d2] dark:border-line bg-surface p-4"><div className="flex items-center justify-between gap-3"><h2 className="text-xs font-medium text-muted">{t(`dashboard.${key}`)}</h2><span className={`rounded-xl p-2 ${tint}`}><Icon className="h-5 w-5" aria-hidden="true" /></span></div><p className="mt-2 text-2xl font-semibold text-content">{locale === "bn" ? String(value).replace(/[0-9]/g, digit => "০১২৩৪৫৬৭৮৯"[Number(digit)]) : value} <span className="text-xs font-normal text-muted">{unit}</span></p>{averageTag && <p className="mt-2 text-[11px] text-muted">{averageTag}</p>}</article>)}
      </section>
      <section className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
        <article className="min-w-0 rounded-2xl border border-[#d5e4d2] dark:border-line bg-surface p-5"><h2 className="mb-4 text-base font-semibold text-content">{t("dashboardDesign.rainfallTitle")}</h2><ClimateMonthlyChart data={chartSeries} variant="compact" title={t("dashboardDesign.rainfallTitle")} meanLabel={t("dashboardDesign.meanRain")} medianLabel={t("dashboardDesign.medianRain")} emptyMessage={t("rotation.unavailable")} monsoonLabel={t("dashboardUi.monsoonLabel")} /></article>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">{[{ key: "wettest", row: wettest }, { key: "driest", row: driest }].filter(({ row }) => row.value !== "—").map(({ key, row }) => <article key={key} className="flex flex-col justify-center rounded-2xl border border-[#d5e4d2] dark:border-line bg-surface p-5">{averageTag && <p className="text-xs leading-6 text-muted">{t("dashboardDesign.rainfallRecordYears").replace("{years}", number(years))}</p>}<h2 className="mt-2 text-base font-semibold leading-7 text-content">{t(`dashboardDesign.${key}`).replace("{month}", row.month)}</h2><p className="mt-2 text-2xl font-semibold text-content">{number(row.value)} <span className="text-sm font-normal text-muted">{t("dashboardDesign.rainUnit")}</span></p><p className="text-xs leading-6 text-muted">{t("dashboardDesign.monthlyRainUnit")}</p><p className="mt-2 text-xs leading-6 text-muted">{t("dashboardDesign.rainfallRecordNote")}</p></article>)}</div>
      </section>
    </>}
    <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
      <article className="rounded-2xl border border-[#d5e4d2] dark:border-line bg-surface p-5 sm:p-6"><div className="flex items-center gap-3"><Sprout className="h-6 w-6 text-emerald-strong" aria-hidden="true" /><h2 className="text-lg font-semibold text-content">{t("dashboardDesign.rotationTitle")}</h2></div><p className="mt-4 max-w-xl text-sm leading-7 text-muted">{t("dashboardDesign.rotationNote")}</p><Button href="/crop-rotation" variant="forest" className="mt-5">{t("dashboardDesign.openComparison")}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Button></article>
      <article className="rounded-2xl border border-[#d5e4d2] dark:border-line bg-surface p-5"><h2 className="font-semibold text-content">{t("dashboardDesign.prioritiesTitle")}</h2><p className="mt-2 text-xs leading-6 text-muted">{t("dashboardDesign.prioritiesNote")}</p><ul className="mt-3 space-y-2 text-sm text-content">{["water", "diversity", "calendar"].map((key) => <li key={key}><Link href={`/crop-rotation?district=${encodeURIComponent(district)}&priority=${key}`} className="flex items-center justify-between gap-3 rounded-lg border border-[#d8e8d2] bg-[#e8f3e3] px-3 py-2.5 transition-colors hover:bg-[#dcecd5] dark:border-line dark:bg-emerald/10 dark:hover:bg-emerald/20 focus-visible:outline-2 focus-visible:outline-emerald"><span>{t(`rotation.options.${key}`)}</span><ArrowRight className="h-4 w-4 shrink-0 text-emerald-strong" aria-hidden="true" /></Link></li>)}</ul></article>
    </section>
    <section className="rounded-2xl border border-[#d5e4d2] dark:border-line bg-surface p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-content">{t("dashboardDesign.sourcesTitle")}</h2><Link href="/data-sources" className="text-sm font-medium text-emerald-strong hover:underline">{t("dashboardDesign.sourcesLink")}</Link></div><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[{ name: "POWER", key: "nasa:power:daily:point" }, { name: "SMAP", key: "nasa:smap:spl3smp_e:v006", limited: true }, { name: "GPM", key: "nasa:gpm:imerg:3imerghh:v07" }, { name: "MODIS", key: "nasa:modis:mod13q1:v061", limited: true }].map(({ name, key, limited }) => {
      const source = sources.find((item) => item.datasetKey === key);
      const coverage = getDistrictValidCoverage(source, district);
      return <article key={key} className="rounded-xl border border-[#d5e4d2] bg-[#f3f8f0] p-4 dark:border-line dark:bg-surface-2"><h3 className="text-sm font-semibold text-content">{name}</h3>{coverage?.firstObservationDate && coverage?.lastObservationDate && <p className="mt-2 break-words text-xs leading-6 text-muted">{coverage.firstObservationDate} – {coverage.lastObservationDate}</p>}{limited && <p className="mt-2 text-xs text-muted">{t("dashboardDesign.limited")}</p>}</article>;
    })}</div></section>
  </div>;
}
