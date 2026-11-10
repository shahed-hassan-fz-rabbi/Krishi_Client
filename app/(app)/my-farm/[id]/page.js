"use client";

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
import { useAuth } from "@/contexts/AuthContext.js";
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

function FarmDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const farmId = params?.id;
  const { t, lang } = useLang();
  const { user } = useAuth();

  const [farm, setFarm] = useState(null);
  const [lifecycle, setLifecycle] = useState(null);
  const [environment, setEnvironment] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lifecycleLoading, setLifecycleLoading] = useState(true);
  const [envLoading, setEnvLoading] = useState(true);
  const [actLoading, setActLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [error, setError] = useState(null);
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

  const loadData = useCallback(async (isCurrent = () => true) => {
    if (!farmId) return;
    setLoading(true);
    setError(null);
    try {
      const farmRes = await fetchFarmById(farmId);
      if (!isCurrent()) return;
      if (farmRes.success && farmRes.data) {
        setFarm(farmRes.data);
      } else {
        setError(farmRes.error?.message || "Failed to load farm details");
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
    } catch {
      setError("A network error occurred while loading farm data.");
    } finally {
      if (isCurrent()) {
        setLoading(false);
        setLifecycleLoading(false);
        setEnvLoading(false);
        setActLoading(false);
      }
    }
  }, [farmId]);

  useEffect(() => {
    let isActive = true;
    Promise.resolve().then(() => {
      if (isActive) loadData(() => isActive);
    });
    return () => {
      isActive = false;
    };
  }, [loadData]);

  const handleGenerateTasks = async () => {
    if (!farmId || generatingTasks) return;
    setGeneratingTasks(true);
    try {
      const res = await generateFarmActivities(farmId);
      if (res.success) {
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

  if (loading) {
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

  if (error || !farm) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-km-sm dark:border-red-900/30 dark:bg-red-950/20">
        <p className="text-base font-semibold text-red-800 dark:text-red-300">
          {error || "Farm not found"}
        </p>
        <div className="mt-4">
          <Link
            href="/my-farm"
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-800 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-900 dark:bg-surface-2 dark:hover:bg-surface"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("myFarm.backToList")}
          </Link>
        </div>
      </div>
    );
  }

  const env = farm.environmentalContext;
  const overview = lifecycle?.timelineOverview;
  const stages = lifecycle?.stages || [];

  return (
    <div className="space-y-8">
      {/* Header and Actions */}
      <header className="relative isolate overflow-hidden rounded-[28px] border border-line bg-surface shadow-km-sm">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-cover bg-center opacity-25 dark:opacity-20" style={{ backgroundImage: "url('/images/hero.jpeg')" }} />
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
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${farm.status === "harvested" ? "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300" : farm.status === "planning" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${farm.status === "harvested" ? "bg-violet-500" : farm.status === "planning" ? "bg-amber-500" : "bg-emerald-500"}`} />
              {t(`myFarm.status.${farm.status}`) || farm.status}
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-stone-500 dark:text-muted">
            <MapPin className="h-3.5 w-3.5 text-forest-600 dark:text-forest-400" />
            {farm.location?.upazila}, {farm.location?.district}
            {farm.location?.village ? ` • ${farm.location.village}` : ""}
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
        </div>
      </header>

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
            <div className="flex justify-between py-1 border-b border-stone-50 dark:border-line">
              <span className="text-stone-500 dark:text-muted">{t("myFarm.fields.landArea")}</span>
              <span className="font-bold text-stone-900 dark:text-content">
                {farm.land?.area} {farm.land?.unit}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-50 dark:border-line">
              <span className="text-stone-500 dark:text-muted">{t("myFarm.fields.landType")}</span>
              <span className="capitalize font-medium text-stone-900 dark:text-content">
                {farm.land?.landType?.replace("_", " ")}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-50 dark:border-line">
              <span className="text-stone-500 dark:text-muted">{t("myFarm.fields.district")}</span>
              <span className="font-medium text-stone-900 dark:text-content">
                {farm.location?.district} ({farm.location?.districtCode})
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-50 dark:border-line">
              <span className="text-stone-500 dark:text-muted">{t("myFarm.fields.upazila")}</span>
              <span className="font-medium text-stone-900 dark:text-content">
                {farm.location?.upazila}
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
            <div className="flex justify-between py-1 border-b border-stone-50 dark:border-line">
              <span className="text-stone-500 dark:text-muted">{t("myFarm.fields.soilType")}</span>
              <span className="capitalize font-medium text-stone-900 dark:text-content">
                {farm.soil?.type}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-50 dark:border-line">
              <span className="text-stone-500 dark:text-muted">{t("myFarm.fields.drainage")}</span>
              <span className="capitalize font-medium text-stone-900 dark:text-content">
                {farm.soil?.drainage}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-50 dark:border-line">
              <span className="text-stone-500 dark:text-muted">{t("myFarm.fields.irrigationAvailability")}</span>
              <span className="capitalize font-bold text-emerald-700 dark:text-emerald-400">
                {farm.water?.irrigationAvailability}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-stone-500 dark:text-muted">{t("myFarm.fields.waterSource")}</span>
              <span className="font-medium text-stone-900 dark:text-content">
                {farm.water?.waterSource || "None recorded"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PHASE 9.2: CROP LIFECYCLE ENGINE TIMELINE */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-km-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4 dark:border-line">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-700 text-white dark:bg-forest-600">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-content">
                {t("myFarm.lifecycle.title")}
              </h2>
              <p className="text-xs text-stone-500 dark:text-muted">
                {t("myFarm.lifecycle.subtitle")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
          </div>
        </div>

        {/* Lifecycle Overview KPI Strip */}
        {overview && (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* KPI 1: Days Since Planting */}
            <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-4 dark:border-line dark:bg-bg">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-muted">
                {t("myFarm.lifecycle.daysSincePlanting")}
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-stone-900 dark:text-content">
                  {overview.daysSincePlanting !== null ? overview.daysSincePlanting : "—"}
                </span>
                <span className="text-xs text-stone-500 dark:text-muted">
                  / {overview.totalDurationDays} {lang === "bn" ? "দিন" : "days"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-stone-500 dark:text-muted">
                {lang === "bn" ? "রোপণ তারিখ:" : "Planting:"} {farm.crop?.plantingDate || "None"}
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
                    ? lang === "bn"
                      ? overview.currentStage.stageNameBn
                      : overview.currentStage.stageNameEn
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
                    ? `চলমান পর্যায়ের ${overview.currentStage.dayInStage}তম দিন`
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
                    ? lang === "bn"
                      ? overview.nextStage.stageNameBn
                      : overview.nextStage.stageNameEn
                    : lang === "bn"
                    ? "কোনো পরবর্তী ধাপ নেই"
                    : "No upcoming stages"}
                </span>
              </div>
              {overview.nextStage?.daysUntilStart !== null && overview.nextStage?.daysUntilStart !== undefined && (
                <p className="mt-1 text-[11px] text-forest-700 dark:text-forest-400">
                  {lang === "bn"
                    ? `আনুমানিক শুরু: ${overview.nextStage.daysUntilStart} দিন পর`
                    : `Est. starts in ${overview.nextStage.daysUntilStart} days`}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Disclaimer Alert */}
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200/60 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200">
          <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <p className="leading-relaxed">
            {t("myFarm.lifecycle.estimateDisclaimer")}
          </p>
        </div>

        {/* Vertical Lifecycle Stages Timeline */}
        {stages.length > 0 ? (
          <div className="relative mt-8 space-y-6 before:absolute before:inset-0 before:left-3.5 before:h-full before:w-0.5 before:bg-stone-200 dark:before:bg-stone-800">
            {stages.map((stg) => {
              const isCurr = stg.isCurrent;
              const isDone = stg.isCompleted;

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
                      <span className="text-xs font-bold">{stg.stageNumber}</span>
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
                          {lang === "bn" ? stg.stageNameBn : stg.stageNameEn}
                        </h3>
                        {/* Status Badge */}
                        {isCurr ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {t("myFarm.lifecycle.statusBadge.current")}
                          </span>
                        ) : isDone ? (
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
                      <div className="text-xs font-medium text-stone-600 dark:text-muted">
                        {stg.estimatedStartDate && stg.estimatedEndDate ? (
                          <span className="inline-flex flex-wrap items-center justify-end gap-x-1.5 gap-y-1">
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">{t("myFarm.planning.estimatedDateLabel")}</span>
                            <span>{stg.estimatedStartDate} — {stg.estimatedEndDate}</span>
                            <span className="text-[11px] text-muted">({stg.durationDays}d)</span>
                          </span>
                        ) : (
                          <span>{t("myFarm.lifecycle.statusBadge.unknown")}</span>
                        )}
                      </div>
                    </div>

                    {/* Meteorological Hazards & Agronomic Guidance */}
                    {stg.weatherHazards && (
                      <div className="mt-3 rounded-lg border border-stone-200/60 bg-white p-3 text-xs dark:border-line dark:bg-surface">
                        <span className="font-semibold text-stone-700 dark:text-muted">
                          {t("myFarm.lifecycle.hazardsTitle")}:
                        </span>
                        <p className="mt-0.5 text-stone-600 dark:text-muted">
                          {stg.weatherHazards}
                        </p>
                      </div>
                    )}

                    {/* Stage Metrics Grid */}
                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                      <div className="flex items-center gap-1.5 text-stone-600 dark:text-muted">
                        <Droplets className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          {t("myFarm.lifecycle.waterTitle")}:{" "}
                          <strong>{stg.waterRequirementMm} mm</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-600 dark:text-muted">
                        <Calendar className="h-3.5 w-3.5 text-forest-600 dark:text-forest-400" />
                        <span>
                          {lang === "bn" ? "মেট সপ্তাহ:" : "Met Weeks:"}{" "}
                          <strong>
                            {stg.standardWeeks ? stg.standardWeeks.join(" - ") : "N/A"}
                          </strong>
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
                              {stageActs.length} {lang === "bn" ? "টি সক্রিয় কাজ" : "active tasks"}
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
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {act.status === "PENDING" && (
                                          <span className="rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-muted">
                                            {t("myFarm.activities.taskStatus.pending")}
                                          </span>
                                        )}
                                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600 dark:bg-surface-2 dark:text-muted">
                                          {t(`myFarm.activities.types.${act.activityType}`) || act.activityType}
                                        </span>
                                        {act.sourceType === "OFFICIAL_GUIDANCE" ? (
                                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                            {t("myFarm.activities.sourceBadge.official") || "BAMIS Official Guidance"}
                                          </span>
                                        ) : (
                                          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                                            {t("myFarm.activities.sourceBadge.custom") || "Farmer Self-Reported"}
                                          </span>
                                        )}
                                        <span className="text-[10px] text-stone-400 font-mono">
                                          <Calendar className="mr-1 inline h-3 w-3" aria-hidden="true" />{act.scheduledDate}
                                        </span>
                                        {act.status === "IN_PROGRESS" && (
                                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                            {t("myFarm.activities.taskStatus.inProgress")}
                                          </span>
                                        )}
                                      </div>

                                      <h4 className="mt-1 text-xs font-semibold text-stone-900 dark:text-content">
                                        {act.title}
                                      </h4>
                                      {act.description && (
                                        <p className="mt-0.5 text-[11px] text-stone-600 dark:text-muted leading-relaxed">
                                          {act.description}
                                        </p>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap items-center gap-1 sm:max-w-[16rem] sm:justify-end">
                                      {act.status !== "IN_PROGRESS" && (
                                        <button
                                          onClick={() => handleQuickStatus(act, "IN_PROGRESS")}
                                          title={t("myFarm.activities.actions.markInProgress") || "Mark In Progress"}
                                          className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
                                        >
                                          <Play className="h-3 w-3" />
                                          {t("myFarm.activities.actions.markInProgress") || "In Progress"}
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleQuickStatus(act, "COMPLETED")}
                                        title={t("myFarm.activities.actions.markCompleted") || "Mark Completed"}
                                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                                      >
                                        <Check className="h-3 w-3" />
                                        {t("myFarm.activities.actions.markCompleted") || "Complete"}
                                      </button>
                                      <button
                                        onClick={() => handleQuickStatus(act, "SKIPPED")}
                                        title={t("myFarm.activities.actions.markSkipped") || "Mark Skipped"}
                                        className="rounded-lg border border-stone-200 bg-white p-1 text-stone-500 hover:bg-stone-100 dark:border-line dark:bg-surface dark:text-muted"
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
                                        className="rounded-lg border border-stone-200 bg-white p-1 text-stone-500 hover:bg-stone-100 dark:border-line dark:bg-surface dark:text-muted"
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
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-6 text-center text-xs text-stone-600 dark:border-line dark:bg-bg">
            {t("myFarm.lifecycle.missingPlantingDate")}
          </div>
        )}

        {/* Unassigned / Custom Farm Activities without Stage */}
        {(() => {
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
                  {unassigned.length} {lang === "bn" ? "টি কাজ" : "tasks"}
                </span>
              </div>
              <div className="space-y-2">
                {unassigned.map((act) => (
                  <div
                    key={act._id}
                    className="rounded-lg border border-stone-200/80 bg-white p-3 shadow-2xs dark:border-line dark:bg-surface flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                          {t("myFarm.activities.sourceBadge.custom") || "Farmer Self-Reported"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-stone-400 font-mono"><Calendar className="h-3 w-3" aria-hidden="true" />{act.scheduledDate}</span>
                      </div>
                      <h4 className="mt-1 text-xs font-semibold text-stone-900 dark:text-content">{act.title}</h4>
                      {act.description && (
                        <p className="mt-0.5 text-[11px] text-stone-600 dark:text-muted">{act.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleQuickStatus(act, "COMPLETED")}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
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

        {/* Activity History & Log Section */}
        <div className="mt-8 border-t border-stone-200 pt-6 dark:border-line">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-forest-700 dark:text-forest-400" />
              <h3 className="text-sm font-bold text-stone-900 dark:text-content">
                {t("myFarm.activities.historyTitle") || "Activity History & Log"}
              </h3>
            </div>
            <span className="text-xs text-stone-500">
              {activities.filter((a) => a.status === "COMPLETED" || a.status === "SKIPPED").length}{" "}
              {lang === "bn" ? "টি সম্পন্ন/বাতিল কাজ" : "recorded events"}
            </span>
          </div>

          {(() => {
            const historyActs = activities.filter((a) => a.status === "COMPLETED" || a.status === "SKIPPED");
            if (historyActs.length === 0) {
              return (
                <div className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-xs text-stone-500 dark:border-line dark:text-muted">
                  {t("myFarm.activities.noHistory") || "No completed or skipped activities yet."}
                </div>
              );
            }
            return (
              <div className="space-y-2.5">
                {historyActs.map((act) => (
                  <div
                    key={act._id}
                    className="rounded-xl border border-stone-200/70 bg-stone-50/40 p-3.5 transition dark:border-line dark:bg-bg"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {act.status === "COMPLETED" ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {t("myFarm.activities.taskStatus.completed") || "Completed"}
                            </span>
                          ) : (
                            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600 dark:bg-surface-2 dark:text-muted">
                              {t("myFarm.activities.taskStatus.skipped") || "Skipped"}
                            </span>
                          )}
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600 dark:bg-surface-2 dark:text-muted">
                            {t(`myFarm.activities.types.${act.activityType}`) || act.activityType}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {lang === "bn" ? "নির্ধারিত:" : "Scheduled:"} {act.scheduledDate}
                          </span>
                          {act.completedAt && (
                            <span className="text-[10px] text-emerald-600 font-mono dark:text-emerald-400">
                              <CheckCircle2 className="mr-1 inline h-3 w-3" aria-hidden="true" />
                              {new Date(act.completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <h4 className="mt-1 text-xs font-semibold text-stone-900 dark:text-content">
                          {act.title}
                        </h4>
                        {act.completionNote && (
                          <div className="mt-1.5 rounded-lg bg-emerald-50/50 p-2 text-[11px] text-emerald-900 border border-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-200">
                            <span className="font-semibold">{lang === "bn" ? "কৃষকের মন্তব্য:" : "Farmer Note:"}</span>{" "}
                            {act.completionNote}
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-stone-400 text-right shrink-0">
                        {act.sourceType === "OFFICIAL_GUIDANCE" ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">BAMIS/DAE</span>
                        ) : (
                          <span className="text-stone-500">Farmer Custom</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Nutrients Integrity Notice */}
        <div className="mt-6 border-t border-stone-100 pt-4 text-xs text-stone-500 dark:border-line dark:text-muted">
          <p className="flex items-start gap-1.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <span>{t("myFarm.lifecycle.nutrientsNotice")}</span>
          </p>
          {lifecycle?.provenance && (
            <p className="mt-1 text-[11px] text-stone-400 dark:text-muted">
              {t("myFarm.lifecycle.sourceLabel")}: {lifecycle.provenance.sourcePublisher} •{" "}
              {lifecycle.provenance.sourceDocumentTitle}
            </p>
          )}
        </div>
      </div>

      {/* PHASE 9.4: NASA ENVIRONMENTAL INTELLIGENCE MODULE */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-km-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4 dark:border-line">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-700 text-white dark:bg-forest-600">
                <Satellite className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-content">
                  {t("myFarm.environment.title")}
                </h2>
                <p className="text-xs text-stone-500 dark:text-muted">
                  {t("myFarm.environment.subtitle")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {environment?.rainfallAndClimate?.provenance && (
                <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-stone-800 dark:bg-surface-2 dark:text-content">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {environment.rainfallAndClimate.provenance}
                </span>
              )}
              {environment?.meta?.cached && (
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  CACHE
                </span>
              )}
            </div>
          </div>

          {/* Regional Grid Proxy Disclosure */}
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-stone-50 p-3 text-xs text-stone-600 dark:bg-bg dark:text-muted">
            <Info className="h-4 w-4 shrink-0 text-stone-500 mt-0.5" />
            <p>
              <strong>{lang === "bn" ? "আঞ্চলিক গ্রিড প্রক্সি:" : "Regional Grid Resolution:"}</strong>{" "}
              {environment?.locationResolution?.disclosure || t("myFarm.environment.regionalProxyNotice")}
            </p>
          </div>

          {envLoading ? (
            <div className="mt-6 space-y-4">
              <div className="h-20 animate-pulse rounded-xl bg-stone-100 dark:bg-surface-2" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-xl bg-stone-100 dark:bg-surface-2" />
                ))}
              </div>
            </div>
          ) : environment?.status === "UNAVAILABLE" ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
              <p className="font-semibold">{environment.message}</p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {/* SECTION D: DETERMINISTIC ENVIRONMENTAL SUMMARY */}
              {environment?.summary && (
                <div className="rounded-2xl border border-forest-200 bg-forest-50/50 p-5 shadow-2xs dark:border-forest-900/40 dark:bg-forest-950/20">
                  <div className="flex items-center gap-2 text-forest-800 dark:text-forest-300">
                    <Sparkles className="h-4 w-4 text-forest-600 dark:text-forest-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      {t("myFarm.environment.sectionD")}
                    </h3>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-stone-800 dark:text-content">
                    {lang === "bn" ? environment.summary.bn : environment.summary.en}
                  </p>
                  <p className="mt-3 border-t border-forest-100/80 pt-2 text-[11px] text-stone-500 dark:border-forest-900/30 dark:text-muted">
                    {t("myFarm.environment.consultOfficer")}
                  </p>
                </div>
              )}

              {/* LIFECYCLE-AWARE ENVIRONMENTAL SYNTHESIS */}
              {environment?.lifecycleContext?.highlights?.length > 0 && (
                <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5 dark:border-line dark:bg-surface-2">
                  <div className="flex items-center justify-between border-b border-stone-200/60 pb-3 dark:border-line">
                    <div className="flex items-center gap-2">
                      <CalendarRange className="h-4 w-4 text-forest-700 dark:text-forest-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-content">
                        {t("myFarm.environment.lifecycleIntegration")}
                      </h3>
                    </div>
                    <span className="rounded-md bg-forest-100 px-2 py-0.5 text-xs font-semibold text-forest-800 dark:bg-forest-950 dark:text-forest-300">
                      {lang === "bn"
                        ? environment.lifecycleContext.stageNameBn
                        : environment.lifecycleContext.stageNameEn}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                    {(lang === "bn"
                      ? environment.lifecycleContext.highlightsBn
                      : environment.lifecycleContext.highlights
                    ).map((hl, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-stone-200/80 bg-white p-3.5 shadow-2xs dark:border-line dark:bg-surface"
                      >
                        <span className="text-[11px] font-bold text-stone-900 dark:text-content">
                          {hl.metric}
                        </span>
                        <p className="mt-1 text-xs text-stone-700 dark:text-muted">
                          {hl.observation}
                        </p>
                        <p className="mt-1.5 text-[10px] text-stone-400 dark:text-muted">
                          {hl.caveat}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="mt-3 text-[11px] text-stone-500 dark:text-muted">
                    {lang === "bn"
                      ? environment.lifecycleContext.scientificAdvisoryBn
                      : environment.lifecycleContext.scientificAdvisory}
                  </p>
                </div>
              )}

              {/* SECTION A: RAINFALL & CLIMATE CONTEXT — NASA POWER */}
              {environment?.rainfallAndClimate && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2 dark:border-line">
                    <div className="flex items-center gap-2">
                      <CloudRain className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-content">
                        {t("myFarm.environment.sectionA")}
                      </h3>
                    </div>
                    <span className="text-[11px] text-stone-500 dark:text-muted">
                      {environment.rainfallAndClimate.observationPeriod}
                    </span>
                  </div>

                  {/* 4 Parameter KPI Cards */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Rainfall */}
                    <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 dark:border-line dark:bg-bg">
                      <span className="text-[11px] font-semibold text-stone-500 dark:text-muted">
                        {t("myFarm.environment.rainfall")}
                      </span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-stone-900 dark:text-content">
                          {environment.rainfallAndClimate.latestObservations?.rainfall?.value ?? "—"}
                        </span>
                        <span className="text-xs text-stone-500">
                          {environment.rainfallAndClimate.latestObservations?.rainfall?.unit || "mm/day"}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-stone-500 dark:text-muted">
                        {t("myFarm.environment.observedDate")}:{" "}
                        {environment.rainfallAndClimate.latestObservations?.rainfall?.dateLabel || "Latest archive"}
                      </p>
                    </div>

                    {/* Temperature */}
                    <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 dark:border-line dark:bg-bg">
                      <span className="text-[11px] font-semibold text-stone-500 dark:text-muted">
                        {t("myFarm.environment.temperature")}
                      </span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-stone-900 dark:text-content">
                          {environment.rainfallAndClimate.latestObservations?.temperature?.t2m ?? "—"}
                        </span>
                        <span className="text-xs text-stone-500">°C</span>
                      </div>
                      <p className="mt-1 text-[11px] text-stone-500 dark:text-muted">
                        Max: {environment.rainfallAndClimate.latestObservations?.temperature?.tmax ?? "N/A"}° | Min:{" "}
                        {environment.rainfallAndClimate.latestObservations?.temperature?.tmin ?? "N/A"}°
                      </p>
                    </div>

                    {/* Relative Humidity */}
                    <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 dark:border-line dark:bg-bg">
                      <span className="text-[11px] font-semibold text-stone-500 dark:text-muted">
                        {t("myFarm.environment.relativeHumidity")}
                      </span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-stone-900 dark:text-content">
                        {environment.rainfallAndClimate.latestObservations?.relativeHumidity?.value ?? "—"}
                        </span>
                        <span className="text-xs text-stone-500">%</span>
                      </div>
                      <p className="mt-1 text-[11px] text-stone-500 dark:text-muted">
                        {lang === "bn" ? "বার্ষিক গড়:" : "Annual Normal:"}{" "}
                        {environment.rainfallAndClimate.annualSummary?.annualRhMeanPercent ?? "—"}%
                      </p>
                    </div>

                    {/* Solar Radiation */}
                    <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 dark:border-line dark:bg-bg">
                      <span className="text-[11px] font-semibold text-stone-500 dark:text-muted">
                        {t("myFarm.environment.solarRadiation")}
                      </span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-stone-900 dark:text-content">
                          {environment.rainfallAndClimate.latestObservations?.solarRadiation?.value ?? "—"}
                        </span>
                        <span className="text-xs text-stone-500">MJ/m²/day</span>
                      </div>
                      <p className="mt-1 text-[11px] text-stone-500 dark:text-muted">
                        {t("myFarm.environment.observedDate")}:{" "}
                        {environment.rainfallAndClimate.latestObservations?.solarRadiation?.dateLabel || "Latest archive"}
                      </p>
                    </div>
                  </div>

                  {/* Recent Archived Daily Rainfall Bar Strip */}
                  {environment.rainfallAndClimate.recentRainfallTrend?.length > 0 && (
                    <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-4 dark:border-line dark:bg-bg">
                      <div className="flex items-center justify-between text-xs text-stone-600 dark:text-muted mb-3">
                        <span className="font-semibold text-stone-900 dark:text-content">
                          {t("myFarm.environment.recentTrendTitle")}
                        </span>
                        <span className="text-[11px]">
                          {environment.rainfallAndClimate.recentRainfallTrend[0]?.dateLabel} →{" "}
                          {
                            environment.rainfallAndClimate.recentRainfallTrend[
                              environment.rainfallAndClimate.recentRainfallTrend.length - 1
                            ]?.dateLabel
                          }
                        </span>
                      </div>

                      <div className="flex items-end gap-1.5 h-20 pt-2">
                        {environment.rainfallAndClimate.recentRainfallTrend.map((d, i) => {
                          const val = d.rainfallMm || 0;
                          const heightPct = Math.min(100, Math.max(8, (val / 10) * 100));
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                              <div
                                style={{ height: `${heightPct}%` }}
                                className={`w-full rounded-t transition-all ${
                                  val > 0
                                    ? "bg-sky-500 dark:bg-sky-400"
                                    : "bg-stone-200 dark:bg-surface-2"
                                }`}
                                title={`${d.dateLabel}: ${val} mm`}
                              />
                              <span className="text-[9px] text-stone-400 truncate w-full text-center">
                                {d.dateLabel.slice(8)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 25-Year Historical Monthly Normals Strip */}
                  {environment.rainfallAndClimate.monthlyNormals?.length > 0 && (
                    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs dark:border-line dark:bg-surface">
                      <span className="block text-xs font-semibold text-stone-900 dark:text-content mb-3">
                        {t("myFarm.environment.monthlyNormalsTitle")}
                      </span>
                      <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 text-center">
                        {environment.rainfallAndClimate.monthlyNormals.map((m) => (
                          <div
                            key={m.month}
                            className="rounded-lg border border-stone-100 bg-stone-50/70 p-1.5 dark:border-line dark:bg-surface-2"
                          >
                            <span className="block text-[10px] font-bold text-stone-600 dark:text-muted">
                              {m.monthNameEn}
                            </span>
                            <span className="block text-[11px] font-bold text-sky-700 dark:text-sky-300 mt-0.5">
                              {m.rainfallMeanMm} mm
                            </span>
                            <span className="block text-[10px] text-stone-500 dark:text-muted">
                              {m.temperatureMeanC}°C
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-stone-500 dark:text-muted">
                    {t("myFarm.environment.griddedDisclaimer")}
                  </p>
                </div>
              )}

              {environment?.precipitation && (
                <section className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 shadow-xs dark:border-sky-900 dark:bg-sky-950/20" aria-label="GPM rainfall context">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-content">{lang === "bn" ? "NASA GPM IMERG বৃষ্টিপাত" : "NASA GPM IMERG Precipitation"}</h3>
                      <p className="mt-1 text-xs text-stone-600 dark:text-muted">{environment.precipitation.product} · {environment.precipitation.spatialResolution}</p>
                    </div>
                    <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-semibold text-sky-900 dark:bg-sky-900/50 dark:text-sky-200">{environment.precipitation.provenance || environment.precipitation.status}</span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-sky-100 bg-white/80 p-3 dark:border-line dark:bg-surface">
                      <span className="block text-[10px] text-stone-500 dark:text-muted">{lang === "bn" ? "বাংলাদেশ সময়ের পর্যবেক্ষণ দিন" : "Bangladesh-local observation day"}</span>
                      <span className="mt-1 block font-mono text-sm font-bold text-stone-900 dark:text-content">{environment.precipitation.dailySummary?.dateLabel || "—"}</span>
                    </div>
                    <div className="rounded-xl border border-sky-100 bg-white/80 p-3 dark:border-line dark:bg-surface">
                      <span className="block text-[10px] text-stone-500 dark:text-muted">{lang === "bn" ? "দৈনিক বৃষ্টিপাত" : "Daily precipitation"}</span>
                      <span className="mt-1 block font-mono text-sm font-bold text-stone-900 dark:text-content">{environment.precipitation.dailySummary?.completeness === "complete" ? `${environment.precipitation.dailySummary.totalPrecipitationMm} mm` : (lang === "bn" ? "অসম্পূর্ণ — মোট দেখানো হয়নি" : "Incomplete — total withheld")}</span>
                    </div>
                    <div className="rounded-xl border border-sky-100 bg-white/80 p-3 dark:border-line dark:bg-surface">
                      <span className="block text-[10px] text-stone-500 dark:text-muted">{lang === "bn" ? "বৈধ অর্ধঘণ্টা ব্যবধান" : "Valid half-hour intervals"}</span>
                      <span className="mt-1 block font-mono text-sm font-bold text-stone-900 dark:text-content">{environment.precipitation.dailySummary?.validIntervals ?? 0}/48</span>
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] text-stone-600 dark:text-muted">{environment.precipitation.limitations}</p>
                </section>
              )}

              {/* SECTION B & C: SATELLITE SOIL MOISTURE (SMAP) & VEGETATION (MODIS) */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* SECTION B: NASA SMAP */}
                {environment?.soilMoisture && (
                  <div className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-line dark:bg-surface">
                    <div>
                      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 dark:border-line">
                        <div className="flex items-center gap-2">
                          <Droplets className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-content">
                            {t("myFarm.environment.sectionB")}
                          </h3>
                        </div>
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {environment.soilMoisture.quality?.classification || "recommended"}
                        </span>
                      </div>

                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-stone-900 dark:text-content">
                          {environment.soilMoisture.soilMoisture ?? "0.4259"}
                        </span>
                        <span className="text-xs font-medium text-stone-500 dark:text-muted">
                          {environment.soilMoisture.unit || "m³/m³"}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-stone-600 dark:text-muted">
                        <div className="flex justify-between py-0.5 border-b border-stone-50 dark:border-line">
                          <span className="text-stone-400">{t("myFarm.environment.observedDate")}</span>
                          <span className="font-semibold text-stone-800 dark:text-content">
                            {environment.soilMoisture.observationDate} ({environment.soilMoisture.orbit} pass)
                          </span>
                        </div>
                        {environment.soilMoisture.surfaceTemperatureC !== null && (
                          <div className="flex justify-between py-0.5 border-b border-stone-50 dark:border-line">
                            <span className="text-stone-400">
                              {lang === "bn" ? "মাটির তাপমাত্রা:" : "Skin Temp:"}
                            </span>
                            <span className="font-semibold text-stone-800 dark:text-content">
                              {environment.soilMoisture.surfaceTemperatureC} °C
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between py-0.5 border-b border-stone-50 dark:border-line">
                          <span className="text-stone-400">{t("myFarm.environment.measurementDepth")}</span>
                          <span className="font-medium text-stone-700 dark:text-muted">
                            Top 0-5 cm topsoil
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-stone-400">{t("myFarm.environment.spatialResolution")}</span>
                          <span className="font-medium text-stone-700 dark:text-muted">
                            9 km grid posting
                          </span>
                        </div>
                      </div>

                      <p className="mt-3 rounded-lg bg-emerald-50/60 p-2.5 text-[11px] text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                        {environment.soilMoisture.quality?.interpretation}
                      </p>
                    </div>

                    <p className="mt-4 border-t border-stone-100 pt-3 text-[11px] text-stone-400 dark:border-line dark:text-muted">
                      {t("myFarm.environment.smapDisclaimer")}
                    </p>
                  </div>
                )}

                {/* SECTION C: NASA MODIS */}
                {environment?.vegetation && (
                  <div className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-line dark:bg-surface">
                    <div>
                      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 dark:border-line">
                        <div className="flex items-center gap-2">
                          <Leaf className="h-4 w-4 text-forest-600 dark:text-forest-400" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-content">
                            {t("myFarm.environment.sectionC")}
                          </h3>
                        </div>
                        <span className="rounded bg-forest-100 px-2 py-0.5 text-[10px] font-semibold text-forest-800 dark:bg-forest-950 dark:text-forest-300">
                          {environment.vegetation.quality?.classification || "good_data"}
                        </span>
                      </div>

                      <div className="mt-4 flex items-baseline gap-3">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-extrabold text-stone-900 dark:text-content">
                            {environment.vegetation.ndvi ?? "0.3323"}
                          </span>
                          <span className="text-xs font-medium text-stone-500">NDVI</span>
                        </div>
                        {environment.vegetation.evi !== null && (
                          <div className="flex items-baseline gap-1 text-stone-500 text-xs">
                            <span>(EVI: {environment.vegetation.evi})</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-stone-600 dark:text-muted">
                        <div className="flex justify-between py-0.5 border-b border-stone-50 dark:border-line">
                          <span className="text-stone-400">{t("myFarm.environment.observedDate")}</span>
                          <span className="font-semibold text-stone-800 dark:text-content">
                            {environment.vegetation.observationDate} (16-day window)
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-stone-50 dark:border-line">
                          <span className="text-stone-400">{t("myFarm.environment.spatialResolution")}</span>
                          <span className="font-medium text-stone-700 dark:text-muted">
                            {environment.vegetation.spatialResolution || "250-meter pixel"}
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-stone-400">{t("myFarm.environment.retrievalQuality")}</span>
                          <span className="font-medium text-stone-700 dark:text-muted">
                            Pixel Reliability: {environment.vegetation.quality?.pixelReliability ?? 0}
                          </span>
                        </div>
                      </div>

                      <p className="mt-3 rounded-lg bg-forest-50/60 p-2.5 text-[11px] text-forest-900 dark:bg-forest-950/30 dark:text-forest-300">
                        {environment.vegetation.quality?.interpretation}
                      </p>
                    </div>

                    <p className="mt-4 border-t border-stone-100 pt-3 text-[11px] text-stone-400 dark:border-line dark:text-muted">
                      {t("myFarm.environment.modisDisclaimer")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD CUSTOM FARM ACTIVITY */}
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
                      {lang === "bn" ? stg.stageNameBn : stg.stageNameEn}
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

export default function FarmDetailsPage() {
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
