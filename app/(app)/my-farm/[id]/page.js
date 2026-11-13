"use client";

import { hazardTextKeys } from "@/lib/farmSourceText.js";
import { PrivateAccess } from "@/components/auth/PrivateAccess.js";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CloudRain,
  Compass,
  Droplets,
  Edit3,
  ExternalLink,
  Info,
  Layers,
  Leaf,
  MapPin,
  RefreshCw,
  RotateCw,
  Satellite,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  Thermometer,
  Tractor,
  Trash2,
  CalendarRange,
  Activity,
  TrendingUp,
  ListTodo,
  Plus,
  Check,
  Play,
  SkipForward,
  X,
  History,
  FileText,
} from "lucide-react";

import { useLang } from "@/lib/i18n/LanguageContext.js";
import { getUpazilasForDistrict, LAND_UNITS } from "@/lib/upazilas.js";
import { useAuth } from "@/contexts/AuthContext.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { useFarmDisplay } from "@/contexts/FarmDisplayContext.js";
import {
  fetchFarmById,
  deleteFarm,
  fetchFarmLifecycle,
  refreshFarmLifecycle,
  fetchFarmEnvironment,
  fetchFarmActivities,
  createFarmActivity,
  updateFarmActivity,
  deleteFarmActivity,
  generateFarmActivities,
} from "@/services/api.js";
import { dispatchFarmNotificationUpdate } from "@/lib/farmNotificationEvents.js";
import WeatherIntelligenceSection from "@/components/dashboard/WeatherIntelligenceSection.js";

function FarmDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const farmId = params?.id;
  const { t, lang } = useLang();
  const { user, isLoading: authLoading } = useAuth();
  const { setSelectedDistrict } = useLocation();

  const [activeFarmTab, setActiveFarmTab] = useState("now");
  const [expandedStages, setExpandedStages] = useState({});
  const [farm, setFarm] = useState(null);
  const [lifecycle, setLifecycle] = useState(null);
  const [environment, setEnvironment] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loadedForUserId, setLoadedForUserId] = useState(null);
  const [loadedFarmId, setLoadedFarmId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lifecycleLoading, setLifecycleLoading] = useState(true);
  const [envLoading, setEnvLoading] = useState(true);
  const [actLoading, setActLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [error, setError] = useState(null);
  const [dataError, setDataError] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customForm, setCustomForm] = useState({
    title: "",
    description: "",
    scheduledDate: "",
    activityType: "general_management",
    relatedStageCode: "",
  });
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [completionNote, setCompletionNote] = useState("");
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newScheduledDate, setNewScheduledDate] = useState("");

  const currentUserId = user ? String(user._id || user.id) : null;
  const { setRecord } = useFarmDisplay();
  const localDigits = (value) => lang === "bn" ? String(value ?? "—").replace(/[0-9]/g, digit => "০১২৩৪৫৬৭৮৯"[Number(digit)]) : String(value ?? "—");
  const stageLabel = stage => {
    const labels = {
      "অঙ্কুরোদগম ও বীজতলা তৈরি": "seedbedStage",
      "বীজতলা তৈরি ও বীজ বপন": "sowingStage",
      "বীজ বপন ও বীজতলা তৈরি": "sowingStage",
      "বীজ বপন ও অঙ্কুরোদগম": "sproutingStage",
      "চারা রোপণ ও প্রাথমিক বৃদ্ধি": "transplantStage",
      "জমি তৈরি ও চারা রোপণ": "prepareTransplantStage",
      "চারা রোপণ ও অঙ্গজ বৃদ্ধি": "transplantStage",
      "কুশি গজানো ও থোড় আসা": "growthStage",
      "কুশি গজানো ও থোড় আসা": "growthStage",
      "কুশি গজানো ও অঙ্গজ বৃদ্ধি": "growthStage",
      "অঙ্গজ বৃদ্ধি ও শাখা বিস্তার": "branchingStage",
      "ফুল ফোটা ও দানা গঠন": "flowerStage",
      "থোড় আসা ও ফুল ফোটা": "floweringStage",
      "থোড় আসা ও ফুল ফোটা": "floweringStage",
      "ফুল ফোটা ও শুঁটি গঠন": "podStage",
      "দানা পাকা ও ফসল কর্তন": "harvestStage",
      "শুঁটি পরিপক্বতা ও ফসল কর্তন": "harvestStage",
    };
    const key = labels[stage?.stageNameBn];
    return key ? t(`farmUi.${key}`) : (lang === "bn" ? stage?.stageNameBn : stage?.stageNameEn);
  };
  const stageDate = (value, includeYear) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return localDigits(value);
    const date = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return localDigits(value);
    return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "long", ...(includeYear ? {year: "numeric"} : {}), timeZone: "UTC" }).format(date);
  };
  const districtLabel = farm?.location?.districtCode ? t(`rotation.districts.${farm.location.districtCode}`) : farm?.location?.district;
  const upazilaRecord = getUpazilasForDistrict(farm?.location?.districtCode).find((item) => item.nameEn.toLowerCase() === farm?.location?.upazila?.toLowerCase() || item.code === farm?.location?.upazila);
  const upazilaLabel = upazilaRecord ? (lang === "bn" ? upazilaRecord.nameBn : upazilaRecord.nameEn) : farm?.location?.upazila;
  const unitRecord = LAND_UNITS.find((item) => item.code === farm?.land?.unit);
  const unitLabel = unitRecord ? (lang === "bn" ? unitRecord.nameBn : unitRecord.nameEn) : farm?.land?.unit;
  const activityTitle = (act) => {
    if (act.sourceType !== "OFFICIAL_GUIDANCE" || lang !== "bn") return act.title;
    const titles = [["Seedbed Preparation", "sowing"], ["Seed Preparation", "sowing"], ["Field Transplanting", "transplant"], ["Tillering & Vegetative", "growth"], ["Flowering & Panicle", "flowering"], ["Crop Maturity", "harvest"], ["Water Requirement", "water"], ["Weather Hazard", "hazard"]];
    const entry = titles.find(([prefix]) => act.title?.startsWith(prefix));
    return entry ? t(`farmUi.tasks.${entry[1]}`) : t(`myFarm.activities.types.${act.activityType}`);
  };
  const hazardText = text => lang === "bn" && hazardTextKeys[text] ? t(`farmUi.sourceTranslations.${hazardTextKeys[text]}`) : text;
  const translatedDescription = act => {
    if (lang !== "bn" || act.sourceType !== "OFFICIAL_GUIDANCE") return act.description;
    const hazardPrefix = "Official BAMIS agro-climatic hazard advisory: ";
    if (act.description?.startsWith(hazardPrefix)) return hazardText(act.description.slice(hazardPrefix.length));
    const water = act.description?.match(/^Official BAMIS stage water requirement is ([\d.]+) mm\./);
    if (water) return t("farmUi.sourceTranslations.waterDescription").replace("{amount}", localDigits(water[1]));
    const descriptions = [
      ["Prepare nursery seedbed or sow seeds according to official ", "sowingDescription"],
      ["Transplant seedlings to main puddled field", "transplantDescription"],
      ["Inspect vegetative tillers", "growthDescription"],
      ["Monitor crop health during flowering.", "floweringDescription"],
      ["Inspect grain maturity", "harvestDescription"],
      ["Conduct standard field operations for ", "generalDescription"],
    ];
    const entry = descriptions.find(([prefix]) => act.description?.startsWith(prefix));
    return entry ? t(`farmUi.sourceTranslations.${entry[1]}`) : act.description;
  };
  const activityDescription = act => !act.description ? null : <p className="mt-2 text-xs leading-6 text-muted">{translatedDescription(act)}</p>;
  const farmDistrictCode = farm?.location?.districtCode || farm?.location?.district;
  useEffect(() => {
    if (!currentUserId || loadedForUserId !== currentUserId || loadedFarmId !== String(farmId) || error || !["cumilla", "chattogram"].includes(farmDistrictCode)) return;
    const display = { userId: currentUserId, farmId: String(farmId), districtCode: farmDistrictCode };
    setRecord(display);
    return () => setRecord((current) => current?.userId === display.userId && current?.farmId === display.farmId ? null : current);
  }, [currentUserId, loadedForUserId, loadedFarmId, farmId, farmDistrictCode, error, setRecord]);
  const loadData = useCallback(async (isCurrent = () => true, ownerId = currentUserId) => {
    if (!farmId) return;
    setLoading(true);
    setError(null);
    setDataError(false);
    setLoadedForUserId(ownerId);
    setLoadedFarmId(null);
    setLifecycle(null);
    setEnvironment(null);
    setActivities([]);
    try {
      const farmRes = await fetchFarmById(farmId);
      if (!isCurrent()) return;
      if (farmRes.success && farmRes.data) {
        setFarm(farmRes.data);
        setLoadedFarmId(String(farmId));
      } else {
        setError(farmRes.error?.message || "Failed to load farm details");
        setLoadedFarmId(String(farmId));
        setLoading(false);
        return;
      }

      setLifecycleLoading(true);
      setEnvLoading(true);
      setActLoading(true);

      const [lcRes, envRes, actRes] = await Promise.all([
        fetchFarmLifecycle(farmId),
        fetchFarmEnvironment(farmId),
        fetchFarmActivities(farmId).catch(() => ({ success: false })),
      ]);
      if (!isCurrent()) return;

      if (lcRes.success && lcRes.data) {
        setLifecycle(lcRes.data);
      }
      if (envRes.success && envRes.data) {
        setEnvironment(envRes.data);
      }
      if (actRes.success && actRes.data) {
        setActivities(actRes.data.activities || []);
      }
      if (!lcRes.success || !lcRes.data || !envRes.success || !envRes.data || !actRes.success || !actRes.data) {
        setDataError(true);
      }
    } catch {
      setError("A network error occurred while loading farm data.");
      setLoadedFarmId(String(farmId));
    } finally {
      if (isCurrent()) {
        setLoading(false);
        setLifecycleLoading(false);
        setEnvLoading(false);
        setActLoading(false);
      }
    }
  }, [farmId, currentUserId]);

  useEffect(() => {
    if (authLoading || !user) return undefined;
    let isActive = true;
    const ownerId = currentUserId;
    Promise.resolve().then(() => {
      if (isActive) loadData(() => isActive, ownerId);
    });
    return () => {
      isActive = false;
    };
  }, [authLoading, user, currentUserId, loadData]);

  const handleGenerateTasks = async () => {
    if (!farmId || generatingTasks) return;
    setGeneratingTasks(true);
    try {
      const res = await generateFarmActivities(farmId);
      if (res.success) {
        dispatchFarmNotificationUpdate();
        const actRes = await fetchFarmActivities(farmId);
        if (actRes.success && actRes.data) {
          setActivities(actRes.data.activities || []);
        }
      } else {
        alert(res.error?.message || "Failed to generate activities");
      }
    } catch {
      alert("Error generating activities");
    } finally {
      setGeneratingTasks(false);
    }
  };

  const handleQuickStatus = async (act, newStatus) => {
    if (newStatus === "COMPLETED") {
      setSelectedActivity(act);
      setCompletionNote("");
      setShowCompleteModal(true);
      return;
    }
    try {
      const res = await updateFarmActivity(farmId, act._id, { status: newStatus });
      if (res.success && res.data) {
        dispatchFarmNotificationUpdate();
        setActivities((prev) => prev.map((a) => (a._id === act._id ? res.data : a)));
      } else {
        alert(res.error?.message || "Failed to update status");
      }
    } catch {
      alert("Error updating activity");
    }
  };

  const handleConfirmComplete = async () => {
    if (!selectedActivity) return;
    try {
      const res = await updateFarmActivity(farmId, selectedActivity._id, {
        status: "COMPLETED",
        completionNote,
      });
      if (res.success && res.data) {
        dispatchFarmNotificationUpdate();
        setActivities((prev) => prev.map((a) => (a._id === selectedActivity._id ? res.data : a)));
        setShowCompleteModal(false);
        setSelectedActivity(null);
      } else {
        alert(res.error?.message || "Failed to complete activity");
      }
    } catch {
      alert("Error completing activity");
    }
  };

  const handleConfirmReschedule = async () => {
    if (!selectedActivity || !newScheduledDate) return;
    try {
      const res = await updateFarmActivity(farmId, selectedActivity._id, {
        scheduledDate: newScheduledDate,
      });
      if (res.success && res.data) {
        dispatchFarmNotificationUpdate();
        setActivities((prev) => prev.map((a) => (a._id === selectedActivity._id ? res.data : a)));
        setShowRescheduleModal(false);
        setSelectedActivity(null);
      } else {
        alert(res.error?.message || "Failed to reschedule activity");
      }
    } catch {
      alert("Error rescheduling activity");
    }
  };

  const handleCreateCustom = async (e) => {
    e.preventDefault();
    if (!customForm.title || !customForm.scheduledDate) {
      alert("Please enter title and date");
      return;
    }
    try {
      const res = await createFarmActivity(farmId, customForm);
      if (res.success && res.data) {
        dispatchFarmNotificationUpdate();
        setActivities((prev) => [...prev, res.data]);
        setShowCreateModal(false);
        setCustomForm({
          title: "",
          description: "",
          scheduledDate: "",
          activityType: "general_management",
          relatedStageCode: "",
        });
      } else {
        alert(res.error?.message || "Failed to create activity");
      }
    } catch {
      alert("Error creating custom activity");
    }
  };

  const handleDeleteActivity = async (act) => {
    if (!act.isCustom) {
      alert(t("myFarm.activities.modal.cannotDeleteOfficial") || "Official guidance cannot be deleted.");
      return;
    }
    if (!window.confirm(t("myFarm.activities.modal.confirmDelete") || "Are you sure you want to delete this custom task?")) {
      return;
    }
    try {
      const res = await deleteFarmActivity(farmId, act._id);
      if (res.success) {
        dispatchFarmNotificationUpdate();
        setActivities((prev) => prev.filter((a) => a._id !== act._id));
      } else {
        alert(res.error?.message || "Failed to delete activity");
      }
    } catch {
      alert("Error deleting activity");
    }
  };

  const handleRefreshLifecycle = async () => {
    if (!farmId || refreshing) return;
    setRefreshing(true);
    try {
      const res = await refreshFarmLifecycle(farmId);
      if (res.success && res.data) {
        dispatchFarmNotificationUpdate();
        setLifecycle(res.data);
        if (res.meta?.syncedStage && farm) {
          setFarm((prev) => ({
            ...prev,
            crop: { ...prev.crop, currentStage: res.meta.syncedStage },
          }));
        }
      }
    } catch {
      alert("Failed to refresh lifecycle");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t("myFarm.confirmDelete") || "Are you sure you want to delete this farm?")) {
      return;
    }
    setDeleting(true);
    try {
      const res = await deleteFarm(farmId);
      if (res.success) {
        router.push("/my-farm");
      } else {
        alert(res.error?.message || "Failed to delete farm");
        setDeleting(false);
      }
    } catch {
      alert("Error deleting farm");
      setDeleting(false);
    }
  };

  if (authLoading || loading || (user && (loadedForUserId !== currentUserId || loadedFarmId !== String(farmId)))) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-surface-2" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl bg-stone-100 dark:bg-surface" />
          <div className="h-64 animate-pulse rounded-2xl bg-stone-100 dark:bg-surface" />
        </div>
      </div>
    );
  }

  if (!user || error || !farm) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-km-sm dark:border-red-900/30 dark:bg-red-950/20">
        <p className="text-base font-semibold text-red-800 dark:text-red-300">
          {!user ? (lang === "bn" ? "খামার দেখতে লগইন করুন।" : "Please log in to view this farm.") : (error || "Farm not found")}
        </p>
        <div className="mt-4">
          <Link
            href="/my-farm"
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-800 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-900 dark:bg-surface-2 dark:hover:bg-surface"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("myFarm.backToList")}
          </Link>
          <button
            type="button"
            onClick={() => loadData(undefined, currentUserId)}
            className="ml-3 inline-flex items-center gap-1.5 rounded-xl bg-forest-700 px-4 py-2 text-xs font-semibold text-white hover:bg-forest-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {lang === "bn" ? "আবার চেষ্টা করুন" : "Try again"}
          </button>
        </div>
      </div>
    );
  }

  const env = farm.environmentalContext;
  const overview = lifecycle?.timelineOverview;
  const stages = lifecycle?.stages || [];
  const currentStageCodes = new Set(stages.filter(stage => stage.isCurrent).map(stage => stage.stageCode));
  const currentTasks = activities.filter(act => currentStageCodes.has(act.relatedStageCode) && act.status !== "COMPLETED" && act.status !== "SKIPPED");

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 pb-6">
      {/* Header and Actions */}
      <header className="relative isolate rounded-[24px] border border-line bg-surface shadow-km-sm">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-cover bg-center opacity-25 dark:opacity-20" style={{ backgroundImage: "url('/images/hero.png')" }} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white/95 via-white/85 to-white/65 dark:from-surface/95 dark:via-surface/85 dark:to-surface/65" />
        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between lg:p-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href="/my-farm"
              className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-800 dark:text-muted dark:hover:text-stone-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("myFarm.backToList")}
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
              {farm.farmName}
            </h1>

          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-stone-500 dark:text-muted">
            <MapPin className="h-3.5 w-3.5 text-forest-600 dark:text-forest-400" />
            {upazilaLabel}, {districtLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Link
            href={`/assistant?farmId=${farm._id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-xs hover:bg-emerald-100 transition-colors dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <Bot className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t("myFarm.farmAssistant.askAiAboutFarm") || (isBn ? "এআই সহকারীকে জিজ্ঞাসা করুন" : "Ask AI Assistant")}</span>
          </Link>
          <details className="relative">
            <summary className="cursor-pointer rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium text-content">{t("farmUi.more")}</summary>
            <div className="absolute right-0 z-20 mt-2 flex w-56 flex-col gap-2 rounded-2xl border border-line bg-surface p-3 shadow-lg">
          <Link
            href={`/my-farm/${farm._id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-xs hover:bg-stone-50 dark:border-line dark:bg-surface-2 dark:text-muted dark:hover:bg-surface-2"
          >
            <Edit3 className="h-3.5 w-3.5" />
            {t("myFarm.editFarm")}
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 shadow-xs hover:bg-red-100 disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("myFarm.deleteFarm")}
          </button>
            </div>
          </details>
        </div>
        </div>
      </header>

      {dataError && (
        <div role="status" className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <span>{lang === "bn" ? "কিছু খামার-সম্পর্কিত তথ্য লোড হয়নি। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।" : "Some farm details could not be loaded. Check the connection and retry."}</span>
          <button type="button" onClick={() => loadData(undefined, currentUserId)} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-amber-400 px-3 py-2 text-xs font-semibold hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-950/60">
            <RefreshCw className="h-3.5 w-3.5" />
            {lang === "bn" ? "আবার চেষ্টা করুন" : "Retry farm data"}
          </button>
        </div>
      )}

      <div role="tablist" aria-label={t("farmUi.tabsLabel")} className="flex gap-2 overflow-x-auto rounded-2xl border border-line bg-surface p-2">
        {["now", "timeline", "land"].map(tab => <button key={tab} id={`farm-tab-${tab}`} role="tab" type="button" tabIndex={activeFarmTab === tab ? 0 : -1} onKeyDown={event => { const tabs = ["now", "timeline", "land"]; const index = tabs.indexOf(tab); const next = event.key === "ArrowRight" ? tabs[(index + 1) % 3] : event.key === "ArrowLeft" ? tabs[(index + 2) % 3] : event.key === "Home" ? tabs[0] : event.key === "End" ? tabs[2] : null; if (next) { event.preventDefault(); setActiveFarmTab(next); document.getElementById(`farm-tab-${next}`)?.focus(); } }} aria-selected={activeFarmTab === tab} aria-controls={`farm-panel-${tab}`} onClick={() => setActiveFarmTab(tab)} className={`min-h-11 flex-1 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${activeFarmTab === tab ? "bg-forest text-white shadow-sm" : "text-muted hover:bg-emerald-50 dark:hover:bg-emerald-950/30"}`}>{t(`farmUi.tabs.${tab}`)}</button>)}
      </div>
      <section id="farm-panel-land" role="tabpanel" aria-labelledby="farm-tab-land" hidden={activeFarmTab !== "land"}>
      {/* Grid: Land/Location & Soil/Water */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Land & Location */}
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-km-sm sm:p-6">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3 dark:border-line">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-forest-50 text-forest-700 dark:bg-forest-950/60 dark:text-forest-400">
              <Layers className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-content">
              {t("myFarm.details.locationLand")}
            </h2>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div className="flex justify-between py-1 dark:border-line">
              <span className="text-stone-500 dark:text-muted">{t("myFarm.fields.landArea")}</span>
              <span className="font-bold text-stone-900 dark:text-content">
                {localDigits(farm.land?.area)} {unitLabel}
              </span>
            </div>
            <div className="flex justify-between py-1 dark:border-line">
              <span className="text-stone-500 dark:text-muted">{t("myFarm.fields.landType")}</span>
              <span className="capitalize font-medium text-stone-900 dark:text-content">
                {t(`myFarm.landTypes.${farm.land?.landType || "unspecified"}`)}
              </span>
            </div>
            <div className="flex justify-between py-1 dark:border-line">
              <span className="text-stone-500 dark:text-muted">{t("myFarm.fields.district")}</span>
              <span className="font-medium text-stone-900 dark:text-content">
                {districtLabel}
              </span>
            </div>
            <div className="flex justify-between py-1 dark:border-line">
              <span className="text-stone-500 dark:text-muted">{t("myFarm.fields.upazila")}</span>
              <span className="font-medium text-stone-900 dark:text-content">
                {upazilaLabel}
              </span>
            </div>
            {farm.location?.village && (
              <div className="flex justify-between py-1">
                <span className="text-stone-500 dark:text-muted">{t("myFarm.fields.village")}</span>
                <span className="font-medium text-stone-900 dark:text-content">
                  {farm.location?.village}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Soil & Water Profile */}
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-km-sm sm:p-6">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3 dark:border-line">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Droplets className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-content">
              {t("myFarm.details.soilWater")}
            </h2>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div className="flex justify-between py-1 dark:border-line">
              <span className="text-stone-500 dark:text-muted">{t("myFarm.fields.soilType")}</span>
              <span className="capitalize font-medium text-stone-900 dark:text-content">
                {t(`myFarm.soilTypes.${farm.soil?.type || "unknown"}`)}
              </span>
            </div>
            <div className="flex justify-between py-1 dark:border-line">
              <span className="text-stone-500 dark:text-muted">{t("myFarm.fields.drainage")}</span>
              <span className="capitalize font-medium text-stone-900 dark:text-content">
                {t(`myFarm.drainageTypes.${farm.soil?.drainage || "unknown"}`)}
              </span>
            </div>
            <div className="flex justify-between py-1 dark:border-line">
              <span className="text-stone-500 dark:text-muted">{t("myFarm.fields.irrigationAvailability")}</span>
              <span className="capitalize font-bold text-emerald-700 dark:text-emerald-400">
                {(farm.water?.irrigationAvailability && farm.water.irrigationAvailability !== "unknown" ? t(`myFarm.irrigationOptions.${farm.water.irrigationAvailability}`) : t("farmUi.notRecorded"))}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-stone-500 dark:text-muted">{t("myFarm.fields.waterSource")}</span>
              <span className="font-medium text-stone-900 dark:text-content">
                {farm.water?.waterSource || t("farmUi.notRecorded")}
              </span>
            </div>
          </div>
        </div>
      </div>

      </section>
      <section id={`farm-panel-${activeFarmTab === "land" ? "inactive" : activeFarmTab}`} role="tabpanel" aria-labelledby={`farm-tab-${activeFarmTab}`} hidden={activeFarmTab === "land"}>
      {/* PHASE 9.2: CROP LIFECYCLE ENGINE TIMELINE */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-km-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4 dark:border-line">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-700 text-white dark:bg-forest-600">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-content">
                {t(activeFarmTab === "now" ? "farmUi.tabs.now" : "myFarm.lifecycle.title")}
              </h2>
              <p className="text-xs text-stone-500 dark:text-muted">
                {t("farmUi.timelineNote")}
              </p>
            </div>
          </div>

          <details className="relative"><summary className="cursor-pointer rounded-xl border border-line px-3 py-2 text-xs font-semibold text-content">{t("farmUi.manageTasks")}</summary><div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setCustomForm({
                  title: "",
                  description: "",
                  scheduledDate: new Date().toISOString().split("T")[0],
                  activityType: "general_management",
                  relatedStageCode: overview?.currentStage?.stageCode || "",
                });
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-forest-600 bg-white px-3 py-1.5 text-xs font-semibold text-forest-700 shadow-xs hover:bg-forest-50 dark:border-forest-500/50 dark:bg-surface-2 dark:text-forest-400 dark:hover:bg-forest-950/40"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("myFarm.activities.addCustomActivity") || "Add Custom Task"}
            </button>
            <button
              onClick={handleGenerateTasks}
              disabled={generatingTasks}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-xs hover:bg-stone-50 disabled:opacity-50 dark:border-line dark:bg-surface-2 dark:text-muted dark:hover:bg-surface-2"
            >
              <ListTodo className="h-3.5 w-3.5" />
              {generatingTasks
                ? t("myFarm.activities.generating") || "Generating..."
                : t("myFarm.activities.generateOfficialTasks") || "Generate Official Tasks"}
            </button>
            <button
              onClick={handleRefreshLifecycle}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-xs hover:bg-stone-50 disabled:opacity-50 dark:border-line dark:bg-surface-2 dark:text-muted dark:hover:bg-surface-2"
            >
              <RotateCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? t("myFarm.lifecycle.refreshing") : t("myFarm.lifecycle.refreshButton")}
            </button>
          </div></details>
        </div>

        {/* Lifecycle Overview KPI Strip */}
        {activeFarmTab === "now" && overview && (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* KPI 1: Days Since Planting */}
            <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-4 dark:border-line dark:bg-bg">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-muted">
                {t("myFarm.lifecycle.daysSincePlanting")}
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-stone-900 dark:text-content">
                  {localDigits(overview.daysSincePlanting)}
                </span>
                <span className="text-xs text-stone-500 dark:text-muted">
                  / {localDigits(overview.totalDurationDays)} {lang === "bn" ? "দিন" : "days"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-stone-500 dark:text-muted">
                {lang === "bn" ? "রোপণ তারিখ:" : "Planting:"} {farm.crop?.plantingDate ? localDigits(farm.crop.plantingDate) : t("farmUi.notRecorded")}
              </p>
            </div>

            {/* KPI 2: Current Stage */}
            <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                {t("myFarm.lifecycle.currentStage")}
              </span>
              <div className="mt-1">
                <span className="text-base font-bold text-emerald-950 dark:text-emerald-200">
                  {overview.currentStage
                    ? stageLabel(overview.currentStage)
                    : overview.isCompleted
                    ? lang === "bn"
                      ? "ফসল কর্তন সম্পন্ন বা প্রস্তুত"
                      : "Harvest Ready / Completed"
                    : overview.isPending
                    ? lang === "bn"
                      ? "রোপণ অপেক্ষমাণ"
                      : "Planting Scheduled"
                    : lang === "bn"
                    ? "অনির্ধারিত"
                    : "Not determined"}
                </span>
              </div>
              {overview.currentStage && overview.currentStage.dayInStage && (
                <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                  {lang === "bn"
                    ? `চলমান পর্যায়ের ${localDigits(overview.currentStage.dayInStage)}তম দিন`
                    : `Day ${overview.currentStage.dayInStage} in this stage`}
                </p>
              )}
            </div>

            {/* KPI 3: Next Estimated Stage */}
            <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-4 dark:border-line dark:bg-bg">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-muted">
                {t("myFarm.lifecycle.nextStage")}
              </span>
              <div className="mt-1">
                <span className="text-sm font-bold text-stone-900 dark:text-content">
                  {overview.nextStage
                    ? stageLabel(overview.nextStage)
                    : lang === "bn"
                    ? "কোনো পরবর্তী ধাপ নেই"
                    : "No upcoming stages"}
                </span>
              </div>
              {overview.nextStage?.daysUntilStart !== null && overview.nextStage?.daysUntilStart !== undefined && (
                <p className="mt-1 text-[11px] text-forest-700 dark:text-forest-400">
                  {lang === "bn"
                    ? `আনুমানিক শুরু: ${localDigits(overview.nextStage.daysUntilStart)} দিন পর`
                    : `Est. starts in ${overview.nextStage.daysUntilStart} days`}
                </p>
              )}
            </div>
          </div>
        )}

        <details hidden={activeFarmTab !== "now"} className="mt-5 rounded-2xl border border-line bg-emerald-50/40 p-4 dark:bg-emerald-950/20"><summary className="cursor-pointer text-sm font-semibold text-content">{t("farmUi.weatherDetails")}</summary>
        <WeatherIntelligenceSection
          compact
          locationCode={farm.location?.districtCode || farm.location?.district}
          locale={lang}
          farmId={String(farm._id)}
          crop={farm.crop?.cropCode || null}
        />

        </details>
        {activeFarmTab === "now" && <section className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 sm:p-6 dark:border-emerald-900/50 dark:bg-emerald-950/20" aria-labelledby="now-guidance-heading">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-forest dark:bg-emerald-900/40 dark:text-emerald-300"><Sprout className="h-5 w-5" aria-hidden="true" /></span><h3 id="now-guidance-heading" className="text-base font-semibold text-content">{t("farmUi.whatNow")}</h3></div>
          {currentTasks.length > 0 ? <ul className="mt-4 space-y-2 text-sm leading-6 text-content">{currentTasks.slice(0, 3).map(act => <li key={act._id} className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" aria-hidden="true" />{activityTitle(act)}</li>)}</ul> : <p className="mt-4 text-sm leading-6 text-muted">{t(overview?.currentStage ? "farmUi.noPendingTasks" : "farmUi.noCurrentStage")}</p>}
          <button type="button" onClick={() => { setActiveFarmTab("timeline"); document.getElementById("farm-tab-timeline")?.focus(); }} className="mt-4 flex min-h-11 w-full items-center justify-between gap-3 rounded-xl bg-forest px-4 py-3 text-left text-sm font-semibold text-white transition-colors hover:bg-forest/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-emerald-800 dark:hover:bg-emerald-700">{t("farmUi.timelineButton")}<ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" /></button>
        </section>}
        <div hidden={activeFarmTab !== "timeline"}>
        {/* Vertical Lifecycle Stages Timeline */}
        {stages.length > 0 ? (
          <div className="relative mt-8 space-y-6 before:absolute before:inset-0 before:left-3.5 before:h-full before:w-0.5 before:bg-stone-200 dark:before:bg-stone-800">
            {stages.map((stg) => {
              const isCurr = stg.isCurrent;
              const isDone = stg.isCompleted;
              const expanded = expandedStages[stg.stageCode] ?? isCurr;
              const taskCount = activities.filter(a => a.relatedStageCode === stg.stageCode && a.status !== "COMPLETED" && a.status !== "SKIPPED").length;

              return (
                <div key={stg.stageCode} className="relative flex items-start gap-4">
                  {/* Timeline Node Dot */}
                  <div
                    className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
                      isCurr
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                        : isDone
                        ? "border-emerald-600 bg-white text-emerald-600 dark:bg-surface dark:text-emerald-400"
                        : "border-stone-300 bg-white text-stone-400 dark:border-line dark:bg-surface"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-bold">{localDigits(stg.stageNumber)}</span>
                    )}
                  </div>

                  {/* Stage Card */}
                  <div
                    className={`flex-1 rounded-xl border p-4 transition ${
                      isCurr
                        ? "border-emerald-500 bg-emerald-50/30 shadow-xs ring-1 ring-emerald-500/20 dark:border-emerald-600 dark:bg-emerald-950/20"
                        : "border-stone-200 bg-stone-50/30 dark:border-line dark:bg-bg"
                    }`}
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-stone-900 dark:text-content">
                          {stageLabel(stg)}
                        </h3>
                        {/* Status Badge */}
                        {isCurr ? null : isDone ? (
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600 dark:bg-surface-2 dark:text-muted">
                            {t("myFarm.lifecycle.statusBadge.completed")}
                          </span>
                        ) : (
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500 dark:bg-surface-2 dark:text-muted">
                            {t("myFarm.lifecycle.statusBadge.upcoming")}
                          </span>
                        )}
                      </div>

                      {/* Estimated Dates */}
                      <div className="max-w-full overflow-x-auto text-xs font-medium text-stone-600 dark:text-muted">
                        {stg.estimatedStartDate && stg.estimatedEndDate ? (
                          <span className="inline-block whitespace-nowrap rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200/70 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/50">
                            {t("farmUi.stageTime")}{" "}
                            <span>{stageDate(stg.estimatedStartDate, stg.estimatedStartDate.slice(0, 4) !== stg.estimatedEndDate.slice(0, 4))} — {stageDate(stg.estimatedEndDate, stg.estimatedStartDate.slice(0, 4) !== stg.estimatedEndDate.slice(0, 4))}</span>
                          </span>
                        ) : (
                          <span>{t("myFarm.lifecycle.statusBadge.unknown")}</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-muted">{t("farmUi.taskCount").replace("{count}", localDigits(taskCount))}</span>
                      <button type="button" aria-expanded={expanded} aria-controls={`stage-details-${stg.stageCode}`} onClick={() => setExpandedStages(prev => ({...prev, [stg.stageCode]: !expanded}))} className="min-h-10 rounded-xl border border-emerald-200 bg-surface px-4 py-2 text-xs font-semibold text-forest dark:border-emerald-900 dark:text-emerald-300">{t(expanded ? "farmUi.collapse" : "farmUi.expand")}</button>
                    </div>
                    <div id={`stage-details-${stg.stageCode}`} hidden={!expanded}>
                    {/* Meteorological Hazards & Agronomic Guidance */}
                    {stg.weatherHazards && (
                      <details className="mt-3 rounded-lg bg-surface-2 p-3 text-xs"><summary className="cursor-pointer text-muted">{t("farmUi.sourceHazards")}</summary>
                        <span className="font-semibold text-stone-700 dark:text-muted">
                          {t("myFarm.lifecycle.hazardsTitle")}:
                        </span>
                        <p className="mt-0.5 text-stone-600 dark:text-muted">
                          {hazardText(stg.weatherHazards)}
                        </p>
                      </details>
                    )}

                    {/* Stage Metrics Grid */}
                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                      <div className="flex items-center gap-1.5 text-stone-600 dark:text-muted">
                        <Droplets className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          {t("myFarm.lifecycle.waterTitle")}:{" "}
                          <strong>{localDigits(stg.waterRequirementMm)} {t("farmUi.mm")}</strong>
                        </span>
                      </div>

                    </div>

                    {/* Stage Activities Section */}
                    {(() => {
                      const stageActs = activities.filter(
                        (a) =>
                          a.relatedStageCode === stg.stageCode &&
                          a.status !== "COMPLETED" &&
                          a.status !== "SKIPPED"
                      );
                      return (
                        <div className="mt-4 border-t border-stone-200/70 pt-3 dark:border-line">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-forest-800 dark:text-forest-300 flex items-center gap-1">
                              <ListTodo className="h-3 w-3" />
                              {lang === "bn" ? "পর্যায়ের কর্মকাণ্ড ও করণীয়" : "Stage Activities & Tasks"}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              {t("farmUi.taskCount").replace("{count}", localDigits(stageActs.length))}
                            </span>
                          </div>


                          {stageActs.length > 0 ? (
                            <div className="space-y-2">
                              {stageActs.map((act) => (
                                <div
                                  key={act._id}
                                  className="rounded-lg border border-stone-200/80 bg-white p-3 shadow-2xs dark:border-line dark:bg-surface"
                                >
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="mt-1 text-xs font-semibold text-stone-900 dark:text-content">
                                        {activityTitle(act)}
                                      </h4>
                                      {activityDescription(act)}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                      {act.status !== "IN_PROGRESS" && (
                                        <button
                                          onClick={() => handleQuickStatus(act, "IN_PROGRESS")}
                                          title={t("myFarm.activities.actions.markInProgress") || "Mark In Progress"}
                                          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-medium text-forest transition-colors hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                                        >
                                          <Play className="h-3 w-3" />
                                          {t("myFarm.activities.actions.markInProgress") || "In Progress"}
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleQuickStatus(act, "COMPLETED")}
                                        title={t("myFarm.activities.actions.markCompleted") || "Mark Completed"}
                                        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-forest bg-forest px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-forest/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-emerald-700 dark:bg-emerald-800 dark:text-white dark:hover:bg-emerald-700"
                                      >
                                        <Check className="h-3 w-3" />
                                        {t("myFarm.activities.actions.markCompleted") || "Complete"}
                                      </button>
                                      <button
                                        onClick={() => handleQuickStatus(act, "SKIPPED")}
                                        title={t("myFarm.activities.actions.markSkipped") || "Mark Skipped"}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-muted transition-colors hover:bg-surface-2 hover:text-content focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                                      >
                                        <SkipForward className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedActivity(act);
                                          setNewScheduledDate(act.scheduledDate);
                                          setShowRescheduleModal(true);
                                        }}
                                        title={t("myFarm.activities.actions.reschedule") || "Reschedule"}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-muted transition-colors hover:bg-surface-2 hover:text-content focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                                      >
                                        <Calendar className="h-3 w-3" />
                                      </button>
                                      {act.isCustom && (
                                        <button
                                          onClick={() => handleDeleteActivity(act)}
                                          title={t("myFarm.activities.actions.delete") || "Delete"}
                                          className="rounded-lg border border-red-200 bg-red-50 p-1 text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-stone-400">
                              {lang === "bn" ? "এই পর্যায়ে কোনো অপেক্ষমাণ কাজ নেই।" : "No pending activities for this stage."}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-6 text-center text-xs text-stone-600 dark:border-line dark:bg-bg">
            {t("myFarm.lifecycle.missingPlantingDate")}
          </div>
        )}

        </div>
        {/* Unassigned / Custom Farm Activities without Stage */}
        {activeFarmTab === "now" && (() => {
          const stageCodes = new Set(stages.map((s) => s.stageCode));
          const unassigned = activities.filter(
            (a) =>
              (!a.relatedStageCode || !stageCodes.has(a.relatedStageCode)) &&
              a.status !== "COMPLETED" &&
              a.status !== "SKIPPED"
          );
          if (unassigned.length === 0) return null;
          return (
            <div className="mt-8 rounded-xl border border-stone-200 bg-stone-50/50 p-4 dark:border-line dark:bg-bg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-muted flex items-center gap-1.5">
                  <ListTodo className="h-3.5 w-3.5 text-forest-700" />
                  {lang === "bn" ? "অতিরিক্ত খামার কাজ" : "Additional Farm Tasks"}
                </span>
                <span className="text-xs text-stone-500 font-mono">
                  {localDigits(unassigned.length)} {lang === "bn" ? "টি কাজ" : "tasks"}
                </span>
              </div>
              <div className="space-y-2">
                {unassigned.map((act) => (
                  <div
                    key={act._id}
                    className="rounded-lg border border-stone-200/80 bg-white p-3 shadow-2xs dark:border-line dark:bg-surface flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="mt-1 text-xs font-semibold text-stone-900 dark:text-content">{activityTitle(act)}</h4>
                      {activityDescription(act)}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleQuickStatus(act, "COMPLETED")}
                        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-forest bg-forest px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-forest/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-emerald-700 dark:bg-emerald-800 dark:text-white dark:hover:bg-emerald-700"
                      >
                        <Check className="h-3 w-3" />
                        {t("myFarm.activities.actions.markCompleted") || "Complete"}
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(act)}
                        className="rounded-lg border border-red-200 bg-red-50 p-1 text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

      </div>

      </section>
      {activeFarmTab === "land" && <Link href="/climate" onClick={() => { if (farmDistrictCode) setSelectedDistrict(farmDistrictCode); }} className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-4 text-sm font-semibold text-forest transition-colors hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
        {t("farmUi.areaClimateLink")}<ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
      </Link>}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-surface border border-stone-200 dark:border-line">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 dark:border-line">
              <div className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-forest-700 dark:text-forest-400" />
                <h3 className="text-base font-bold text-stone-900 dark:text-content">
                  {t("myFarm.activities.modal.createTitle") || "Add Farm Activity"}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 dark:hover:bg-surface-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-muted">
                  {t("myFarm.activities.modal.titleLabel") || "Task Title"} *
                </label>
                <input
                  type="text"
                  required
                  value={customForm.title}
                  onChange={(e) => setCustomForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder={t("myFarm.activities.modal.titlePlaceholder") || "e.g., Weed clearing, Apply mulch"}
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-forest-500 focus:outline-none dark:border-line dark:bg-surface-2 dark:text-content"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-muted">
                    {t("myFarm.activities.modal.typeLabel") || "Activity Type"}
                  </label>
                  <select
                    value={customForm.activityType}
                    onChange={(e) => setCustomForm((p) => ({ ...p, activityType: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-forest-500 focus:outline-none dark:border-line dark:bg-surface-2 dark:text-content"
                  >
                    <option value="general_management">{t("myFarm.activities.types.general_management") || "General Management"}</option>
                    <option value="field_preparation">{t("myFarm.activities.types.field_preparation") || "Field Preparation"}</option>
                    <option value="sowing">{t("myFarm.activities.types.sowing") || "Sowing & Seedbed"}</option>
                    <option value="transplanting">{t("myFarm.activities.types.transplanting") || "Transplanting"}</option>
                    <option value="irrigation_monitoring">{t("myFarm.activities.types.irrigation_monitoring") || "Water & Moisture Check"}</option>
                    <option value="weeding">{t("myFarm.activities.types.weeding") || "Weeding & Cleaning"}</option>
                    <option value="fertilizer_application">{t("myFarm.activities.types.fertilizer_application") || "Nutrient Management"}</option>
                    <option value="pest_scouting">{t("myFarm.activities.types.pest_scouting") || "Pest & Hazard Scouting"}</option>
                    <option value="harvesting">{t("myFarm.activities.types.harvesting") || "Harvesting"}</option>
                    <option value="threshing_drying">{t("myFarm.activities.types.threshing_drying") || "Threshing & Drying"}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-muted">
                    {t("myFarm.activities.modal.dateLabel") || "Scheduled Date"} *
                  </label>
                  <input
                    type="date"
                    required
                    value={customForm.scheduledDate}
                    onChange={(e) => setCustomForm((p) => ({ ...p, scheduledDate: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-forest-500 focus:outline-none dark:border-line dark:bg-surface-2 dark:text-content"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-muted">
                  {t("myFarm.activities.modal.stageLabel") || "Related Growth Stage (Optional)"}
                </label>
                <select
                  value={customForm.relatedStageCode}
                  onChange={(e) => setCustomForm((p) => ({ ...p, relatedStageCode: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-forest-500 focus:outline-none dark:border-line dark:bg-surface-2 dark:text-content"
                >
                  <option value="">{lang === "bn" ? "কোনো নির্দিষ্ট পর্যায় নয় (সাধারণ কাজ)" : "None / General Farm Task"}</option>
                  {stages.map((stg) => (
                    <option key={stg.stageCode} value={stg.stageCode}>
                      {stageLabel(stg)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-muted">
                  {t("myFarm.activities.modal.descLabel") || "Description (Optional)"}
                </label>
                <textarea
                  rows={2}
                  value={customForm.description}
                  onChange={(e) => setCustomForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder={t("myFarm.activities.modal.descPlaceholder") || "Provide helpful notes or instructions"}
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-forest-500 focus:outline-none dark:border-line dark:bg-surface-2 dark:text-content"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-line">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 dark:border-line dark:text-muted"
                >
                  {t("myFarm.activities.modal.cancel") || "Cancel"}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-forest-700 px-4 py-2 text-xs font-semibold text-white hover:bg-forest-800 dark:bg-forest-600"
                >
                  {t("myFarm.activities.modal.submit") || "Save Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COMPLETE ACTIVITY WITH OPTIONAL NOTE */}
      {showCompleteModal && selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-surface border border-stone-200 dark:border-line">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 dark:border-line">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-stone-900 dark:text-content">
                  {t("myFarm.activities.modal.completeTitle") || "Mark Activity as Completed"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setSelectedActivity(null);
                }}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 dark:hover:bg-surface-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3">
              <p className="text-xs text-stone-600 dark:text-muted font-medium">
                {selectedActivity.title}
              </p>
              <div className="mt-3">
                <label className="block text-xs font-semibold text-stone-700 dark:text-muted">
                  {t("myFarm.activities.modal.completionNote") || "Completion Note (Optional)"}
                </label>
                <textarea
                  rows={3}
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  placeholder={t("myFarm.activities.modal.notePlaceholder") || "Describe how the task went, inputs used, or field observations..."}
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none dark:border-line dark:bg-surface-2 dark:text-content"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-line">
              <button
                type="button"
                onClick={() => {
                  setShowCompleteModal(false);
                  setSelectedActivity(null);
                }}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 dark:border-line dark:text-muted"
              >
                {t("myFarm.activities.modal.cancel") || "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleConfirmComplete}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                {t("myFarm.activities.modal.confirmComplete") || "Confirm Completion"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RESCHEDULE ACTIVITY */}
      {showRescheduleModal && selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-surface border border-stone-200 dark:border-line">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 dark:border-line">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-forest-700 dark:text-forest-400" />
                <h3 className="text-base font-bold text-stone-900 dark:text-content">
                  {t("myFarm.activities.modal.rescheduleTitle") || "Reschedule Activity"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setSelectedActivity(null);
                }}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 dark:hover:bg-surface-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3">
              <p className="text-xs text-stone-600 dark:text-muted font-medium">
                {selectedActivity.title}
              </p>
              <div className="mt-3">
                <label className="block text-xs font-semibold text-stone-700 dark:text-muted">
                  {t("myFarm.activities.modal.newDate") || "New Scheduled Date"}
                </label>
                <input
                  type="date"
                  required
                  value={newScheduledDate}
                  onChange={(e) => setNewScheduledDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-forest-500 focus:outline-none dark:border-line dark:bg-surface-2 dark:text-content"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-line">
              <button
                type="button"
                onClick={() => {
                  setShowRescheduleModal(false);
                  setSelectedActivity(null);
                }}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 dark:border-line dark:text-muted"
              >
                {t("myFarm.activities.modal.cancel") || "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleConfirmReschedule}
                className="rounded-xl bg-forest-700 px-4 py-2 text-xs font-semibold text-white hover:bg-forest-800 dark:bg-forest-600"
              >
                {t("myFarm.activities.actions.reschedule") || "Reschedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FarmDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-10 w-48 animate-pulse rounded-xl bg-stone-200 dark:bg-surface-2" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="h-64 animate-pulse rounded-2xl bg-stone-100 dark:bg-surface" />
            <div className="h-64 animate-pulse rounded-2xl bg-stone-100 dark:bg-surface" />
          </div>
        </div>
      }
    >
      <FarmDetailsContent />
    </Suspense>
  );
}

export default function ProtectedFarmDetailsPage() {
  return <PrivateAccess><FarmDetailsPage /></PrivateAccess>;
}
