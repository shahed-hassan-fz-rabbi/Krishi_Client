"use client";
import { Bot, ChevronDown, Info } from "lucide-react";
import { Button } from "@/components/ui/Button.js";
import { useAuth } from "@/contexts/AuthContext.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";

export function RotationResults({ result, publicMode, onSave, saveBusy, explainBusy, question, setQuestion, onExplain, answer, onRemember }) {
  const { t, locale } = useLang();
  const { user } = useAuth();
  const { setSelectedDistrict } = useLocation();
  const bn = locale === "bn";
  const num = (value, digits = 0) => Number.isFinite(value) ? new Intl.NumberFormat(bn ? "bn-BD" : "en-GB", { maximumFractionDigits: digits }).format(value) : "—";
  const month = (value) => new Intl.DateTimeFormat(bn ? "bn-BD" : "en-GB", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2001, value - 1, 1)));
  const cropName = (code) => t(`rotation.crops.${code}`);
  const baseline = result.strategies.find((s) => s.isBaseline);
  const personalHref = user ? "/rotation-planner" : "/login?redirect=%2Frotation-planner";
  const rememberLink = () => onRemember(result.input);
  const sourceDistrict = () => setSelectedDistrict(result.input.districtCode);
  const area = result.areaClimate;
  const privateButton = (className = "") => <Button href={personalHref} onClick={rememberLink} variant="outline" className={className}>{t(user ? "rotationGuide.saveWorkspace" : "rotationGuide.saveLogin")}</Button>;

  return <section className="space-y-7" aria-live="polite">
    <header><h2 className="text-2xl font-semibold text-content">{t("rotationGuide.title")}</h2><p className="mt-2 text-sm leading-7 text-muted">{t("rotationGuide.subtitle")}</p></header>

    <section className="rounded-2xl border border-emerald/20 bg-emerald/5 p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-content">{t("rotationGuide.areaTitle")}</h3>
      <p className="mt-2 max-w-4xl text-sm leading-7 text-muted">{t("rotationGuide.areaNote")}</p>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">{[{ key: "warmest", row: area?.warmest, unit: "°C" }, { key: "wettest", row: area?.wettest, unit: "mm" }].map(({ key, row, unit }) => <div key={key} className="rounded-xl border border-line bg-surface p-4"><dt className="text-sm text-muted">{t(`rotationGuide.${key}`)}</dt><dd className="mt-2 text-xl font-semibold text-content">{row ? `${month(row.month)} · ${num(row.value, 1)} ${unit}` : t("rotationGuide.unknown")}</dd></div>)}</dl>
      <p className="mt-3 text-xs leading-6 text-muted">NASA POWER · {t("rotationGuide.period")}: {area?.period ? `${area.period.start} – ${area.period.end}` : t("rotationGuide.unknown")}</p>
      {((area?.temperature?.length || 0) < 12 || (area?.rainfall?.length || 0) < 12) && <p className="text-xs leading-6 text-muted">{t("rotationGuide.partial")}</p>}
      <div className="mt-4 flex flex-wrap gap-3"><Button href="/climate" onClick={sourceDistrict} variant="outline">{t("rotationGuide.climateLink")}</Button><Button href="/rainfall" onClick={sourceDistrict} variant="outline">{t("rotationGuide.rainfallLink")}</Button></div>
    </section>

    <p className="text-sm text-muted">{t("rotation.priority")}: {t(`rotation.options.${result.priority}`)}</p>
    <div className="grid items-start gap-5 xl:grid-cols-3">{result.strategies.map((strategy, index) => {
      const delta = strategy.waterRequirementMm - baseline.waterRequirementMm;
      const mainWarnings = strategy.warnings.filter((key) => ["boro_no_irrigation", "boro_limited_irrigation", "mustard_drainage"].includes(key));
      const climateKey = !strategy.climateCheck?.checked || strategy.climateCheck?.missing > 0 ? "temperatureMissing" : strategy.climateCheck.outside > 0 ? "temperatureReview" : "temperatureMatch";
      return <article key={strategy.id} className="min-w-0 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <p className="text-xs font-semibold text-emerald-strong">{t(strategy.isBaseline ? "rotation.baselineLabel" : "rotation.alternative")} {!strategy.isBaseline && num(index)}</p>
        <h3 className="mt-3 break-words text-lg font-semibold leading-8 text-content">{strategy.cropCodes.map(cropName).join(" → ")}</h3>
        <div className="mt-5 space-y-4 text-sm leading-7">
          <div><h4 className="font-semibold text-content">{t("rotationGuide.why")}</h4><p className="mt-1 text-muted">{t(strategy.isBaseline ? "rotationGuide.baseline" : delta < 0 ? "rotationGuide.waterLower" : delta > 0 ? "rotationGuide.waterHigher" : "rotationGuide.waterEqual")}</p>{!strategy.isBaseline && strategy.cropCodes.length < baseline.cropCodes.length && <p className="mt-1 text-muted">{t("rotationGuide.fewerCrops")}</p>}</div>
          <div><h4 className="font-semibold text-content">{t("rotationGuide.timingTitle")}</h4><p className={`mt-1 ${strategy.warnings.includes("calendar_overlap") ? "text-amber-strong" : "text-muted"}`}>{t(strategy.warnings.includes("calendar_overlap") ? "rotationGuide.overlap" : "rotationGuide.noOverlap")}</p></div>
          <div><h4 className="font-semibold text-content">{t("rotationGuide.temperatureTitle")}</h4><p className={`mt-1 ${climateKey === "temperatureReview" ? "text-amber-strong" : "text-muted"}`}>{t(`rotationGuide.${climateKey}`)}</p>{strategy.climateCheck?.outside > 0 && climateKey === "temperatureMissing" && <p className="mt-1 text-amber-strong">{t("rotationGuide.temperatureReview")}</p>}</div>
          {mainWarnings.length > 0 && <div className="rounded-lg bg-amber/10 p-3"><h4 className="font-semibold text-amber-strong">{t("rotationGuide.important")}</h4>{mainWarnings.map((key) => <p key={key} className="mt-1 text-amber-strong">{t(`rotation.warnings.${key}`)}</p>)}</div>}
        </div>

        <details className="mt-5 border-t border-line pt-4"><summary className="cursor-pointer text-sm font-medium text-content">{t("rotationGuide.details")}</summary>
          <dl className="mt-4 space-y-3 rounded-lg bg-surface-2 p-3 text-xs leading-6"><div><dt className="font-semibold text-content">{t("rotationGuide.water")}</dt><dd className="text-content">{num(strategy.waterRequirementMm)} mm</dd><dd className="text-muted">{t("rotationGuide.waterNote")}</dd></div><div><dt className="text-muted">{t("rotationGuide.families")}</dt><dd className="text-content">{num(strategy.cropFamilyCount)}</dd></div><div><dt className="text-muted">{t("rotationGuide.uncovered")}</dt><dd className="text-content">{num(strategy.uncoveredCalendarWeeks)}</dd><dd className="text-muted">{t("rotationGuide.uncoveredNote")}</dd></div></dl>
          <ol className="mt-4 space-y-5">{strategy.timeline.map((row) => <li key={row.cropCode} className="border-l-2 border-emerald/40 pl-3 text-xs leading-6 text-muted"><p className="text-sm font-semibold text-content">{cropName(row.cropCode)}</p><p>{t("rotationGuide.growingMonths")}: {row.climateCheck?.rainfall?.length ? row.climateCheck.rainfall.map((r) => month(r.month)).join(" · ") : `${num(row.startWeek)} → ${num(row.endWeek)}`}</p>
            <details className="mt-2"><summary className="cursor-pointer text-content">{t("rotationGuide.original")}</summary><p className="mt-2">{t("rotationGuide.sourceNotes")}</p><p>{row.sowingPeriod}</p><p>{row.harvestingPeriod}</p><a href={row.source.url} target="_blank" rel="noopener noreferrer" className="text-emerald-strong underline">{t("rotationGuide.source")}</a></details>
            {!!row.climateCheck?.checks?.length && <details className="mt-2"><summary className="cursor-pointer text-content">{t("rotationGuide.checkDetails")}</summary><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr>{["month", "stage", "observed", "preferred"].map((key) => <th key={key} className="p-2 font-semibold">{t(`rotationGuide.${key}`)}</th>)}</tr></thead><tbody>{row.climateCheck.checks.map((check) => <tr key={`${check.stageId}-${check.month}`} className="border-t border-line"><td className="p-2">{month(check.month)}</td><td className="p-2">{bn ? check.stageNameBn : check.stageNameEn}</td><td className="whitespace-nowrap p-2">{num(check.meanTemperatureC, 1)} °C</td><td className="whitespace-nowrap p-2">{num(check.preferredMinC)}–{num(check.preferredMaxC)} °C</td></tr>)}</tbody></table></div></details>}
            {!!row.climateCheck?.rainfall?.length && <details className="mt-2"><summary className="cursor-pointer text-content">{t("rotationGuide.rainDetails")}</summary><p className="mt-2">{t("rotationGuide.rainNote")}</p>{row.climateCheck.rainfall.map((rain) => <p key={rain.month}>{month(rain.month)}: {rain.meanMm === null ? t("rotationGuide.unknown") : `${num(rain.meanMm, 1)} mm`}</p>)}</details>}
          </li>)}</ol>
        </details>
        <details className="mt-4 text-xs leading-6 text-muted"><summary className="cursor-pointer font-medium text-content">{t("rotationGuide.extra")}</summary><ul className="mt-3 space-y-2">{strategy.warnings.filter((key) => !["climate_temperature_review", "climate_data_missing"].includes(key)).map((key) => <li key={key}>• {t(`rotation.warnings.${key}`)}</li>)}</ul></details>
        {publicMode ? <div className="mt-5"><p className="text-xs leading-6 text-muted">{t("rotationGuide.saveNote")}</p>{privateButton("mt-3 h-auto min-h-10 w-full py-2 text-center")}</div> : <Button className="mt-5 w-full" variant="outline" disabled={saveBusy || explainBusy} onClick={() => onSave(strategy)}>{t(saveBusy ? "rotation.working" : "rotation.save")}</Button>}
      </article>;
    })}</div>

    <section className="rounded-2xl border border-emerald/30 bg-surface p-5 sm:p-7">
      <Bot className="mb-3 h-7 w-7 text-emerald-strong" aria-hidden="true" /><h3 className="text-xl font-semibold text-content">{t("rotationGuide.aiTitle")}</h3><p className="my-3 max-w-3xl text-sm leading-7 text-muted">{t("rotationGuide.aiBody")}</p>
      {user ? <><form onSubmit={onExplain}><label className="block text-sm text-content">{t("rotationGuide.aiQuestion")}<textarea required maxLength={1000} value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-line bg-surface p-3 text-content" /></label><Button as="submit" disabled={explainBusy || saveBusy} className="mt-3">{t(explainBusy ? "rotation.working" : "rotationGuide.aiSend")}</Button></form>{answer && <p role="status" className="mt-5 whitespace-pre-wrap text-sm leading-8 text-content">{answer}</p>}<p className="mt-4 text-xs leading-6 text-muted">{t("rotationGuide.aiMode")}</p></> : <><Button href={personalHref} onClick={rememberLink} className="mt-2 h-auto min-h-10 py-2 text-center">{t("rotationGuide.aiLogin")}</Button><p className="mt-3 text-xs leading-6 text-muted">{t("rotationGuide.aiLoginNote")}</p></>}
    </section>

    <aside className="flex gap-3 rounded-xl border border-line bg-surface-2 p-5"><Info className="mt-1 h-5 w-5 shrink-0 text-climate" aria-hidden="true" /><div><h3 className="font-semibold text-content">{t("rotationGuide.sharedTitle")}</h3><p className="mt-2 text-sm leading-7 text-muted">{t("rotationGuide.sharedBody")}</p></div></aside>
    <details className="rounded-xl border border-line bg-surface p-5"><summary className="flex cursor-pointer items-center justify-between gap-3 font-medium text-content">{t("rotationGuide.dataDetails")}<ChevronDown className="h-4 w-4" aria-hidden="true" /></summary><p className="mt-4 text-sm leading-7 text-muted">{t("rotationGuide.limitations")}</p><div className="mt-4 grid gap-4 md:grid-cols-3">{Object.entries(result.evidence).map(([key, data]) => <div key={key} className="rounded-lg bg-surface-2 p-4 text-xs leading-6 text-muted"><h4 className="font-semibold text-content">{data.source}</h4><p>{data.resolution}</p><p>{data.date || (data.period ? `${data.period.start} – ${data.period.end}` : t("rotationGuide.unknown"))}</p><p>{t(data.provenance === "SNAPSHOT" ? "rotation.snapshot" : "rotationGuide.unknown")}</p>{key !== "power" && <><p>{t(data.usable ? "rotation.usable" : "rotation.rejected")}</p><p>{data.value === null ? t("rotationGuide.unknown") : `${num(data.value, 4)} ${key === "smap" ? "m³/m³" : ""}`}</p></>}</div>)}</div></details>
  </section>;
}
