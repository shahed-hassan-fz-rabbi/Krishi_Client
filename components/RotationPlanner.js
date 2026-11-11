"use client";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { Button } from "@/components/ui/Button.js";
import { RotationResults } from "@/components/RotationResults.js";
import { compareCropRotations, previewCropRotations, saveRotationPlan, fetchRotationPlans, explainRotationResult, fetchFarms } from "@/services/api.js";

const cropCodes = ["monsoon_aman", "boro_rice", "aus_rice", "mustard"];
const initialProfile = { districtCode: "cumilla", soilType: "unknown", drainage: "unknown", irrigation: "unknown", priority: "water" };
const selectClass = "mt-2 w-full rounded-lg border border-line bg-surface px-3 py-3 text-sm text-content";
const DRAFT_KEY = "km-rotation-preview-draft";
function consumeDraft() {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(sessionStorage.getItem(DRAFT_KEY));
    return value && ["cumilla", "chattogram"].includes(value.districtCode) && Array.isArray(value.baseline) && value.baseline.length <= 4 && value.baseline.every((code) => cropCodes.includes(code)) ? value : null;
  } catch { return null; }
}

export function RotationPlanner({ publicMode = false, initialDistrict = "cumilla" }) {
  const { t, locale } = useLang();
  const [draft] = useState(() => publicMode ? null : consumeDraft());
  const [profile, setProfile] = useState(() => draft ? { ...initialProfile, ...Object.fromEntries(Object.keys(initialProfile).map((key) => [key, draft[key] || initialProfile[key]])) } : { ...initialProfile, districtCode: initialDistrict });
  const [baseline, setBaseline] = useState(() => draft?.baseline?.length ? draft.baseline : [""]);
  const [farmId, setFarmId] = useState("");
  const [farms, setFarms] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(Boolean(draft && !publicMode));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [explainBusy, setExplainBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  useEffect(() => {
    if (publicMode) return;
    try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* Storage is optional. */ }
    let active = true;
    Promise.all([fetchFarms(), fetchRotationPlans()]).then(([farmRes, planRes]) => {
      if (!active) return;
      setFarms(farmRes.success ? farmRes.data?.farms || [] : []);
      setPlans(planRes.success ? planRes.data?.plans || [] : []);
      setLoadFailed(!farmRes.success || !planRes.success);
    }).catch(() => { if (active) setLoadFailed(true); });
    return () => { active = false; };
  }, [publicMode]);

  useEffect(() => {
    if (publicMode || !draft) return;
    let active = true;
    compareCropRotations(draft).then((response) => {
      if (!active) return;
      if (response.success) setResult(response.data);
      else setError("RESTORE_FAILED");
    }).catch(() => { if (active) setError("RESTORE_FAILED"); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [publicMode, draft]);

  const invalidate = () => { setResult(null); setAnswer(null); setNotice(""); setError(""); };
  const change = (key, value) => { invalidate(); setFarmId(""); setProfile((old) => ({ ...old, [key]: value })); };
  const selectFarm = (id) => {
    invalidate(); setFarmId(id);
    const farm = farms.find((item) => item._id === id);
    if (farm) setProfile((old) => ({ ...old, districtCode: farm.location.districtCode, soilType: farm.soil?.type || "unknown", drainage: farm.soil?.drainage || "unknown", irrigation: farm.water?.irrigationAvailability || "unknown" }));
  };
  const compare = async (event) => {
    event.preventDefault();
    if (busy) return;
    invalidate();
    if (baseline.some((code) => !code) || new Set(baseline).size !== baseline.length) { setError(t("rotation.invalid")); return; }
    setBusy(true);
    try {
      const response = await (publicMode ? previewCropRotations : compareCropRotations)({ ...profile, baseline });
      if (response.success) setResult(response.data);
      else setError(t(response.status === 401 ? "access.body" : "rotation.error"));
    } catch { setError(t("rotation.error")); }
    finally { setBusy(false); }
  };
  const save = async (strategy) => {
    if (saveBusy) return;
    setSaveBusy(true); setNotice(""); setError("");
    try {
      const response = await saveRotationPlan({ input: result.input, selectedStrategyId: strategy.id, farmId: farmId || null });
      if (response.success) { setNotice(t("rotation.saved")); setPlans((old) => [response.data.plan, ...old].slice(0, 30)); }
      else setError(t("rotation.error"));
    } catch { setError(t("rotation.error")); }
    finally { setSaveBusy(false); }
  };
  const explain = async (event) => {
    event.preventDefault();
    if (explainBusy) return;
    setExplainBusy(true); setAnswer(null);
    try {
      const response = await explainRotationResult({ input: result.input, question, language: locale });
      setAnswer(response.success && response.data?.answer ? response.data.answer : t("rotation.assistantFallback"));
    } catch { setAnswer(t("rotation.assistantFallback")); }
    finally { setExplainBusy(false); }
  };
  const cropName = (code) => t(`rotation.crops.${code}`);
  const field = (key, options, namespace = "options") => <label key={key} className="block text-sm font-medium text-content">{t(`rotation.${key}`)}
    <select className={selectClass} value={profile[key]} onChange={(e) => change(key, e.target.value)}>
      {options.map((value) => <option key={value} value={value}>{t(`rotation.${namespace}.${value}`)}</option>)}
    </select></label>;

  return <div className="space-y-8">
    {!publicMode && <header><h1 className="text-3xl font-bold text-content">{t("rotation.title")}</h1><p className="mt-3 max-w-3xl leading-7 text-muted">{t("rotation.intro")}</p></header>}
    {loadFailed && <p role="status" className="text-sm text-amber-strong">{t("rotation.farmLoadError")}</p>}
    <form onSubmit={compare} className="rounded-2xl border border-line bg-surface p-5 sm:p-8">
      <fieldset disabled={busy || saveBusy || explainBusy}>
        <legend className="mb-6 text-xl font-semibold text-content">{t("rotation.profile")}</legend>
        {!publicMode && <label className="mb-5 block text-sm font-medium text-content">{t("rotation.farm")}<select value={farmId} onChange={(e) => selectFarm(e.target.value)} className={selectClass}><option value="">{t("rotation.manual")}</option>{farms.map((farm) => <option key={farm._id} value={farm._id}>{farm.farmName}</option>)}</select></label>}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm font-medium text-content">{t("rotation.district")}<select value={profile.districtCode} onChange={(e) => change("districtCode", e.target.value)} className={selectClass}><option value="cumilla">{t("rotation.districts.cumilla")}</option><option value="chattogram">{t("rotation.districts.chattogram")}</option></select></label>
          {field("soilType", ["unknown", "clay", "loam", "clay_loam", "sandy_loam", "sandy", "silt", "alluvial", "other"], "soil")}
          {field("drainage", ["unknown", "good", "moderate", "poor", "waterlogged"])}
          {field("irrigation", ["unknown", "available", "limited", "unavailable"])}
          {field("priority", ["water", "diversity", "calendar"])}
        </div>
        <h2 className="mt-8 text-lg font-semibold text-content">{t("rotation.baseline")}</h2><p className="mt-2 text-sm leading-6 text-muted">{t("rotation.baselineHelp")}</p>
        <div className="mt-4 space-y-3">{baseline.map((code, index) => <div key={index} className="flex items-center gap-3">
          <label className="flex-1"><span className="sr-only">{t("rotation.baseline")} {index + 1}</span><select required value={code} className={selectClass} onChange={(e) => { invalidate(); setBaseline((old) => old.map((v, i) => i === index ? e.target.value : v)); }}><option value="">{t("rotation.chooseCrop")}</option>{cropCodes.map((c) => <option key={c} value={c}>{cropName(c)}</option>)}</select></label>
          {baseline.length > 1 && <Button variant="ghost" onClick={() => { invalidate(); setBaseline((old) => old.filter((_, i) => i !== index)); }}>{t("rotation.remove")}</Button>}
        </div>)}</div>
        <div className="mt-5 flex flex-wrap gap-3">{baseline.length < 4 && <Button variant="outline" onClick={() => { invalidate(); setBaseline((old) => [...old, ""]); }}>{t("rotation.addCrop")}</Button>}<Button as="submit" disabled={busy}>{t(busy ? "rotation.working" : "rotation.compare")}</Button></div>
      </fieldset>
    </form>
    {error && <p role="alert" className="rounded-lg border border-danger/30 p-4 text-danger-strong">{error === "RESTORE_FAILED" ? t("rotation.error") : error}</p>}
    {notice && <p role="status" className="text-emerald-strong">{notice}</p>}
    {result && <RotationResults result={result} publicMode={publicMode} onSave={save} saveBusy={saveBusy} explainBusy={explainBusy} question={question} setQuestion={setQuestion} onExplain={explain} answer={answer} onRemember={(input) => { try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(input)); } catch { /* Continue without storage. */ } }} />}
    {!publicMode && <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6"><h2 className="text-xl font-semibold text-content">{t("rotation.savedTitle")}</h2>{!plans.length ? <p className="mt-4 text-sm text-muted">{t("rotation.noSaved")}</p> : <ul className="mt-4 space-y-3">{plans.map((plan) => { const chosen = plan.comparison?.strategies?.find((s) => s.id === plan.selectedStrategyId); return <li key={plan._id} className="rounded-lg bg-surface-2 p-4"><p className="font-medium text-content">{chosen?.cropCodes.map(cropName).join(" → ")}</p><p className="mt-2 text-xs text-muted">{t(`rotation.districts.${plan.comparison?.input?.districtCode}`)} · {new Date(plan.createdAt).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", { timeZone: "Asia/Dhaka" })}</p></li>; })}</ul>}</section>}
  </div>;
}
