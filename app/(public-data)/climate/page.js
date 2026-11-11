"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarRange, ChevronDown, CloudRain, Droplets, Info, Leaf, MapPin, RefreshCw, Thermometer } from "lucide-react";
import { TemperatureRangeChart } from "@/components/charts/ClimateMonthlyChart.js";
import { Button } from "@/components/ui/Button.js";
import { Card, CardBody, CardHeader } from "@/components/ui/Card.js";
import { ErrorState, LoadingState } from "@/components/ui/States.js";
import { Table, TBody, TD, THead, TR } from "@/components/ui/Table.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { fetchTemperature } from "@/services/api.js";
import { fillClimateText, observedTemperature, rotationLinkForDistrict, summarizeMonthlyTemperature } from "@/lib/climatePlanning.js";
import RainfallSection from "@/components/climate/RainfallSection.js";
import SoilMoistureSection from "@/components/climate/SoilMoistureSection.js";
import VegetationSection from "@/components/climate/VegetationSection.js";

export default function ClimatePage() {
  const { t, locale } = useLang();
  const { selectedDistrict, setSelectedDistrict, districts, currentDistrictObj } = useLocation();
  const [tempData, setTempData] = useState(null);
  const [metaData, setMetaData] = useState(null);
  const [dataDistrict, setDataDistrict] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [datasetOverview, setDatasetOverview] = useState({});
  const requestId = useRef(0);
  const number = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-GB", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const integer = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-GB");
  const monthNames = Array.from({ length: 12 }, (_, i) => new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2024, i, 1))));

  const loadClimateData = useCallback(async (districtCode) => {
    const id = ++requestId.current;
    setIsLoading(true); setError(false); setTempData(null); setMetaData(null);
    try {
      const response = await fetchTemperature(districtCode, { metric: "all" });
      if (id !== requestId.current) return;
      if (!response.success || !response.data) throw new Error("Unavailable record");
      setTempData(response.data); setMetaData(response.meta); setDataDistrict(districtCode);
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDistrict) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadClimateData(selectedDistrict);
    }
    return () => { requestId.current += 1; };
  }, [selectedDistrict, loadClimateData]);

  const summary = summarizeMonthlyTemperature(tempData?.monthly_historical);
  const districtName = (locale === "bn" ? currentDistrictObj?.nameBn : currentDistrictObj?.nameEn) || t(`rotation.districts.${selectedDistrict}`);
  const months = (rows) => new Intl.ListFormat(locale === "bn" ? "bn" : "en", { style: "long", type: "conjunction" }).format(rows.map((m) => monthNames[m - 1]));
  const temperature = (value) => observedTemperature(value) === null ? "—" : `${number.format(value)} °C`;
  const chartSeries = Array.from({ length: 12 }, (_, index) => {
    const entry = tempData?.monthly_historical?.[String(index + 1)];
    const usable = Number.isFinite(entry?.years_used) && entry.years_used > 0;
    return { month: index + 1, monthLabel: monthNames[index].slice(0, 3),
      t2m: usable ? observedTemperature(entry?.stats?.mean) : null,
      tmax: usable ? observedTemperature(entry?.mean_tmax?.mean) : null,
      tmin: usable ? observedTemperature(entry?.mean_tmin?.mean) : null };
  });
  const summaryText = summary.warmest ? fillClimateText(t(summary.complete ? "climatePlanning.summary" : "climatePlanning.summaryPartial"), {
    district: districtName, warmMonths: months(summary.warmest.months), coolMonths: months(summary.coolest.months),
    warmValue: number.format(summary.warmest.value), coolValue: number.format(summary.coolest.value), count: integer.format(summary.monthsAvailable),
  }) : t("climatePlanning.noData");
  const reportDatasetOverview = useCallback((dataset, payload) => {
    setDatasetOverview((current) => ({ ...current, [dataset]: payload }));
  }, []);
  const refreshAllData = () => {
    setRefreshToken((current) => current + 1);
    loadClimateData(selectedDistrict);
  };
  const overviewCards = [
    {
      key: "power", icon: Thermometer, accent: "text-amber-700 bg-amber-500/10",
      title: locale === "bn" ? "এলাকার জলবায়ুর ইতিহাস" : "Area climate history",
      source: "NASA POWER · Historical",
      value: dataDistrict === selectedDistrict && summary.warmest ? `${number.format(summary.warmest.value)} °C` : "—",
      detail: dataDistrict !== selectedDistrict || isLoading ? (locale === "bn" ? "তথ্য লোড হচ্ছে" : "Loading available data") : summary.warmest ? `${locale === "bn" ? "তুলনামূলক উষ্ণ মাস" : "Warmest monthly average"}: ${months(summary.warmest.months)}` : (locale === "bn" ? "তথ্য পাওয়া যায়নি" : "No available observation"),
      explanation: locale === "bn" ? "ঐতিহাসিক গড়—আজকের আবহাওয়ার পূর্বাভাস নয়।" : "Historical average, not today's weather forecast.",
      date: dataDistrict === selectedDistrict && summary.monthsAvailable ? (metaData?.from && metaData?.to ? `${metaData.from} – ${metaData.to}` : (locale === "bn" ? "ঐতিহাসিক উপাত্ত" : "Historical record")) : "—",
      href: "#power",
    },
    {
      key: "gpm", icon: CloudRain, accent: "text-sky-700 bg-sky-500/10",
      title: locale === "bn" ? "বৃষ্টিপাত" : "Rainfall",
      source: "NASA GPM IMERG Final V07",
      value: datasetOverview.gpm?.districtCode === selectedDistrict && datasetOverview.gpm?.complete ? `${number.format(datasetOverview.gpm.value)} mm` : "—",
      detail: datasetOverview.gpm?.districtCode !== selectedDistrict ? (locale === "bn" ? "তথ্য লোড হচ্ছে" : "Loading available data") : datasetOverview.gpm?.complete ? (locale === "bn" ? "৪৮টির ৪৮টি সময়-খণ্ড যাচাই করা" : "All 48 half-hour intervals validated") : (locale === "bn" ? "সম্পূর্ণ দৈনিক মোট পাওয়া যায়নি" : "No complete daily total available"),
      explanation: locale === "bn" ? "দৈনিক মোট দেখাই কেবল ৪৮টি ব্যবধান বৈধ হলে।" : "A daily total appears only when all 48 intervals are valid.",
      date: datasetOverview.gpm?.districtCode === selectedDistrict ? datasetOverview.gpm?.date || "—" : "—",
      href: "#rainfall",
    },
    {
      key: "smap", icon: Droplets, accent: "text-blue-700 bg-blue-500/10",
      title: locale === "bn" ? "মাটির উপরিভাগের আর্দ্রতা" : "Surface soil moisture",
      source: "NASA SMAP SPL3SMP_E V006",
      value: datasetOverview.smap?.districtCode === selectedDistrict && datasetOverview.smap?.recommended ? `${number.format(datasetOverview.smap.value)} m³/m³` : "—",
      detail: datasetOverview.smap?.districtCode !== selectedDistrict ? (locale === "bn" ? "তথ্য লোড হচ্ছে" : "Loading available data") : datasetOverview.smap?.recommended ? (locale === "bn" ? `মানের ফ্ল্যাগ ${datasetOverview.smap.flag} · সুপারিশকৃত` : `Quality flag ${datasetOverview.smap.flag} · recommended`) : (locale === "bn" ? "সুপারিশকৃত মান পাওয়া যায়নি" : "No recommended-quality value available"),
      explanation: locale === "bn" ? "মাটির উপরিভাগের আর্দ্রতা; শিকড়ের গভীরতার নয়।" : "Surface-soil moisture, not root-zone moisture.",
      date: datasetOverview.smap?.districtCode === selectedDistrict ? datasetOverview.smap?.date || "—" : "—",
      href: "#soil-moisture",
    },
    {
      key: "modis", icon: Leaf, accent: "text-emerald-700 bg-emerald-500/10",
      title: locale === "bn" ? "ফসলের সবুজত্বের সূচক" : "Vegetation greenness index",
      source: "NASA MODIS MOD13Q1.061",
      value: datasetOverview.modis?.districtCode === selectedDistrict && datasetOverview.modis?.reliable ? `NDVI ${number.format(datasetOverview.modis.ndvi)}` : "—",
      detail: datasetOverview.modis?.districtCode !== selectedDistrict ? (locale === "bn" ? "তথ্য লোড হচ্ছে" : "Loading available data") : datasetOverview.modis?.reliable ? (locale === "bn" ? `নির্ভরযোগ্য পিক্সেল · EVI ${Number.isFinite(datasetOverview.modis.evi) ? number.format(datasetOverview.modis.evi) : "—"}` : `Good-quality pixel · EVI ${Number.isFinite(datasetOverview.modis.evi) ? number.format(datasetOverview.modis.evi) : "—"}`) : (locale === "bn" ? "নির্ভরযোগ্য মান পাওয়া যায়নি" : "No good-quality value available"),
      explanation: locale === "bn" ? "গাছপালার সবুজত্বের সূচক; ফলন বা রোগের সরাসরি নির্ণয় নয়।" : "Vegetation greenness index, not a direct yield or disease diagnosis.",
      date: datasetOverview.modis?.districtCode === selectedDistrict ? datasetOverview.modis?.date || "—" : "—",
      href: "#vegetation",
    },
  ];

  return <div className="space-y-8">
    <header className="flex flex-wrap items-start justify-between gap-5">
      <div className="max-w-2xl">
        <p className="mb-3 flex items-center gap-2 text-xs font-medium text-muted"><Thermometer className="h-4 w-4 text-emerald" aria-hidden="true" />{t("climatePlanning.source")}</p>
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-content sm:text-3xl">{t("climatePlanning.title")}</h1>
        <p className="mt-3 text-sm leading-7 text-muted">{t("climatePlanning.subtitle")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2.5">
          <MapPin className="h-4 w-4 shrink-0 text-emerald" aria-hidden="true" />
          <span className="sr-only">{t("landing.supportedDistricts")}</span>
          <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className="cursor-pointer appearance-none bg-transparent pr-6 text-sm font-medium text-content focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald">
            {districts.map((d) => <option key={d.code} value={d.code} className="bg-surface text-content">{locale === "bn" ? d.nameBn || d.nameEn : d.nameEn}</option>)}
          </select><ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-muted" aria-hidden="true" />
        </label>
        <button type="button" onClick={refreshAllData} disabled={isLoading} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-content transition-colors hover:bg-surface-2 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />{t("dashboard.refresh")}
        </button>
      </div>
    </header>

    <section aria-label={locale === "bn" ? "নির্বাচিত এলাকার NASA তথ্য" : "NASA data for the selected area"} className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><h2 className="text-lg font-semibold text-content">{locale === "bn" ? `${districtName} এলাকার তথ্য এক নজরে` : `${districtName} at a glance`}</h2><p className="mt-1 text-sm text-muted">{locale === "bn" ? "প্রতিটি মানের পাশে পর্যবেক্ষণের তারিখ ও মান-যাচাই দেখুন। ফাঁকা মান শূন্য নয়।" : "Check each observation date and quality note. An unavailable value does not mean zero."}</p></div>
        <span className="text-xs text-muted">{locale === "bn" ? "জেলা-ভিত্তিক উপগ্রহ/ঐতিহাসিক তথ্য; জমির সরাসরি পরিমাপ নয়" : "District-level satellite or historical data, not a direct field measurement"}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map(({ key, icon: Icon, accent, title, source, value, detail, explanation, date, href }) => <a key={key} href={href} className="group min-w-0 rounded-2xl border border-line bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold text-content">{title}</p><p className="mt-1 truncate text-[11px] text-muted">{source}</p></div><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent}`}><Icon className="h-4 w-4" aria-hidden="true" /></span></div>
          <p className="mt-4 truncate text-2xl font-semibold tracking-tight text-content" title={value}>{value}</p>
          <p className="mt-1 min-h-10 text-xs leading-5 text-muted">{detail}</p>
          <p className="mt-2 min-h-10 text-xs leading-5 text-content/80">{explanation}</p>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3 text-[11px] text-muted"><span>{locale === "bn" ? "পর্যবেক্ষণ" : "Observed"}</span><span className="truncate font-medium text-content">{date}</span></div>
        </a>)}
      </div>
    </section>

    {(isLoading || (!error && dataDistrict !== selectedDistrict)) && <Card><CardBody><LoadingState /></CardBody></Card>}
    {error && !isLoading && <Card><CardBody><ErrorState onRetry={() => loadClimateData(selectedDistrict)} /><p className="mt-3 text-center text-sm text-muted">{t("climatePlanning.loadError")}</p></CardBody></Card>}

    {!isLoading && !error && tempData && dataDistrict === selectedDistrict && <>
      <section id="power" aria-labelledby="climate-summary" className="scroll-mt-24 rounded-2xl border border-emerald/20 bg-emerald/5 p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="climate-summary" className="text-xl font-semibold text-content">{t("climatePlanning.snapshotTitle")}</h2><p className="flex items-center gap-2 text-xs text-muted"><CalendarRange className="h-4 w-4" aria-hidden="true" />{t("climatePlanning.period")}</p></div>
        <p className="mt-4 max-w-4xl text-base leading-8 text-content">{summaryText}</p>
        <dl className="mt-6 grid gap-4 md:grid-cols-3">
          {[{ key: "warmest", entry: summary.warmest }, { key: "coolest", entry: summary.coolest }].map(({ key, entry }) => <div key={key} className="min-w-0 rounded-xl border border-line bg-surface p-5"><dt className="text-sm text-muted">{t(`climatePlanning.${key}`)}</dt><dd className="mt-3 text-2xl font-semibold text-content">{entry ? temperature(entry.value) : "—"}</dd><dd className="mt-2 text-sm text-muted">{entry ? months(entry.months) : t("rotation.unavailable")}</dd></div>)}
          <div className="rounded-xl border border-line bg-surface p-5"><dt className="text-sm text-muted">{t("climatePlanning.coverage")}</dt><dd className="mt-3 text-2xl font-semibold text-content">{integer.format(summary.monthsAvailable)} / {integer.format(12)}</dd><dd className="mt-2 text-xs leading-6 text-muted">{t("climatePlanning.coverageNote")}</dd></div>
        </dl><p className="mt-4 text-xs leading-6 text-muted">{t("climatePlanning.averageNote")}</p>
      </section>

      <section aria-labelledby="climate-planning" className="space-y-4">
        <h2 id="climate-planning" className="text-xl font-semibold text-content">{t("climatePlanning.readingTitle")}</h2>
        <p className="max-w-3xl text-sm leading-7 text-muted">{t("climatePlanning.readingBody")}</p>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card><CardBody className="flex h-full flex-col"><h3 className="text-base font-semibold text-content">{t("climatePlanning.calendarTitle")}</h3><p className="mb-5 mt-3 flex-1 text-sm leading-7 text-muted">{t("climatePlanning.calendarBody")}</p><Button href="/crop-calendar" variant="outline" className="w-fit">{t("climatePlanning.calendarCta")}</Button></CardBody></Card>
          <Card><CardBody className="flex h-full flex-col"><h3 className="text-base font-semibold text-content">{t("climatePlanning.waterTitle")}</h3><p className="mb-5 mt-3 flex-1 text-sm leading-7 text-muted">{t("climatePlanning.waterBody")}</p><div className="flex flex-wrap gap-3"><a href="#rainfall" className="inline-flex min-h-10 items-center rounded-lg border border-line bg-surface px-3 text-sm font-medium text-content hover:bg-surface-2">{t("climatePlanning.rainfallCta")}</a><a href="#soil-moisture" className="inline-flex min-h-10 items-center rounded-lg border border-line bg-surface px-3 text-sm font-medium text-content hover:bg-surface-2">{t("climatePlanning.soilCta")}</a></div></CardBody></Card>
        </div>
        <div className="rounded-2xl border border-line bg-forest p-5 text-white sm:p-7">
          <h3 className="text-lg font-semibold">{t("climatePlanning.compareTitle")}</h3><p className="mt-3 max-w-3xl text-sm leading-7 text-white/85">{t("climatePlanning.compareBody")}</p>
          <Button href={rotationLinkForDistrict(selectedDistrict)} variant="hero" className="mt-5 h-auto min-h-12 w-full px-4 py-3 text-center sm:w-auto">{t("climatePlanning.rotationCta")}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Button>
          <p className="mt-3 text-xs leading-6 text-white/80">{t("climatePlanning.rotationNote")}</p>
        </div>
      </section>

      <Card><CardBody className="flex gap-3"><Info className="mt-1 h-5 w-5 shrink-0 text-climate" aria-hidden="true" /><div><h2 className="text-sm font-semibold text-content">{t("climatePlanning.boundaryTitle")}</h2><p className="mt-2 text-sm leading-7 text-muted">{t("climatePlanning.boundaryBody")}</p></div></CardBody></Card>

      {summary.monthsAvailable > 0 && <Card><CardHeader title={t("climatePlanning.chartTitle")} description={t("climatePlanning.chartBody")} /><CardBody><TemperatureRangeChart data={chartSeries} title={t("climatePlanning.chartTitle")} highLabel={t("climatePlanning.highLine")} meanLabel={t("climatePlanning.meanLine")} lowLabel={t("climatePlanning.lowLine")} /></CardBody></Card>}

      <details className="group rounded-xl border border-line bg-surface shadow-km-sm">
        <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 font-semibold text-content focus-visible:outline-2 focus-visible:outline-emerald">{t("climatePlanning.details")}<ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
        <div className="border-t border-line p-5">
          <h2 className="text-base font-semibold text-content">{t("climatePlanning.tableTitle")}</h2><p className="mb-4 mt-2 text-sm leading-6 text-muted">{t("climate.monthlyTableDesc")}</p>
          <div className="overflow-x-auto"><Table><THead columns={[t("climate.colMonth"), t("climate.colMeanT2M"), t("climate.colMeanTMax"), t("climate.colMeanTMin"), t("climate.colDiurnal"), t("climate.colAbsMax"), t("climate.colAbsMin"), t("climatePlanning.years")]} /><TBody>
            {monthNames.map((name, index) => { const row = tempData.monthly_historical?.[String(index + 1)]; return <TR key={name}><TD className="font-medium text-content">{name}</TD>{[row?.stats?.mean, row?.mean_tmax?.mean, row?.mean_tmin?.mean, row?.diurnal_range?.mean, row?.absolute_max, row?.absolute_min].map((value, i) => <TD key={i} className="whitespace-nowrap text-content">{temperature(value)}</TD>)}<TD className="text-muted">{Number.isFinite(row?.years_used) ? integer.format(row.years_used) : "—"}</TD></TR>; })}
          </TBody></Table></div>
          <h3 className="mt-6 text-sm font-semibold text-content">{t("climatePlanning.dtrTitle")}</h3><p className="mt-2 text-sm leading-7 text-muted">{t("climatePlanning.dtrBody")}</p>
          <div className="mt-5 rounded-lg bg-surface-2 p-4 text-xs leading-6 text-muted"><p>{t("climatePlanning.provenance")}: {metaData?.dataset_provenance || "nasa:power:daily:point"} · {t("climatePlanning.timeStandard")}: {metaData?.time_standard || "LST"}</p><p>{metaData?.limitations || t("dashboard.limitationsNotice")}</p></div>
        </div>
      </details>
    </>}

    <div className="border-t border-line pt-7">
      <div className="mb-5 max-w-3xl">
        <h2 className="text-xl font-bold tracking-tight text-content sm:text-2xl">
          {locale === "bn" ? "বৃষ্টি, মাটির আর্দ্রতা ও ফসলের সবুজত্ব" : "Rainfall, soil moisture, and crop greenness"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          {locale === "bn"
            ? "একই নির্বাচিত জেলার জন্য উপগ্রহের পর্যবেক্ষণ। এগুলো এলাকার চিত্র, নির্দিষ্ট জমির সরাসরি পরিমাপ নয়।"
            : "Satellite observations for the selected district. They describe regional conditions, not direct measurements from an individual field."}
        </p>
      </div>
      <div className="space-y-8">
        <RainfallSection embedded />
        <SoilMoistureSection embedded />
        <VegetationSection embedded />
      </div>
    </div>
  </div>;
}
