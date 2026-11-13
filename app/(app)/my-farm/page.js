"use client";
import { PrivateAccess } from "@/components/auth/PrivateAccess.js";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  Droplets,
  Layers,
  MapPin,
  Plus,
  Sprout,
  Tractor,
  Trash2,
  Edit3,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ListTodo,
  Check,
  Play,
  SkipForward,
} from "lucide-react";

import { SUPPORTED_CROPS, LAND_UNITS, getUpazilasForDistrict } from "@/lib/upazilas.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { useAuth } from "@/contexts/AuthContext.js";
import { fetchFarms, deleteFarm, fetchActivitiesOverview, updateFarmActivity } from "@/services/api.js";
import { dispatchFarmNotificationUpdate } from "@/lib/farmNotificationEvents.js";

function MyFarmPage() {
  const { t, lang } = useLang();
  const { user, isLoading: authLoading } = useAuth();

  const [farms, setFarms] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activityOverview, setActivityOverview] = useState(null);
  const [activityOverviewError, setActivityOverviewError] = useState(false);
  const [loadedForUserId, setLoadedForUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const digits = value => lang === "bn" ? String(value ?? "—").replace(/[0-9]/g, digit => "০১২৩৪৫৬৭৮৯"[Number(digit)]) : String(value ?? "—");
  const farmLabel = (farm, kind) => {
    let entry;
    if (kind === "crop") entry = SUPPORTED_CROPS.find(item => item.code === farm.crop?.cropCode || item.nameEn === farm.crop?.cropName);
    if (kind === "unit") entry = LAND_UNITS.find(item => item.code === farm.land?.unit);
    if (kind === "upazila") entry = getUpazilasForDistrict(farm.location?.districtCode).find(item => item.code === farm.location?.upazila || item.nameEn.toLowerCase() === farm.location?.upazila?.toLowerCase());
    if (entry) return lang === "bn" ? entry.nameBn : entry.nameEn;
    return kind === "crop" ? farm.crop?.cropName || t("farmUi.notRecorded") : kind === "unit" ? farm.land?.unit || "" : farm.location?.upazila;
  };
  const loadFarmsAndActivities = useCallback(async (isCurrent = () => true, ownerId) => {
    setLoading(true);
    setError(null);
    setLoadedForUserId(ownerId);
    setActivityOverviewError(false);
    try {
      const [farmRes, actRes] = await Promise.all([
        fetchFarms(),
        fetchActivitiesOverview().catch(() => ({ success: false })),
      ]);
      if (!isCurrent()) return;

      if (farmRes.success && farmRes.data) {
        setFarms(farmRes.data.farms || []);
        setSummary(farmRes.data.summary || null);
      } else {
        if (farmRes.status === 401) {
          setFarms([]);
          setSummary(null);
        } else {
          setError(farmRes.error?.message || "Failed to load farms");
        }
      }

      if (actRes.success && actRes.data) {
        setActivityOverview(actRes.data);
      } else {
        setActivityOverviewError(true);
      }
    } catch {
      if (isCurrent()) setError("An unexpected network error occurred.");
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return undefined;
    let isActive = true;
    const ownerId = String(user._id || user.id);
    Promise.resolve().then(() => isActive && loadFarmsAndActivities(() => isActive, ownerId));
    return () => {
      isActive = false;
    };
  }, [authLoading, user, loadFarmsAndActivities]);

  const currentUserId = user ? String(user._id || user.id) : null;
  const farmDataIsCurrent = Boolean(user && currentUserId && loadedForUserId === currentUserId);
  const displayedFarms = farmDataIsCurrent ? farms : [];
  const displayedSummary = farmDataIsCurrent ? summary : null;
  const displayedActivityOverview = farmDataIsCurrent ? activityOverview : null;

  const handleQuickStatus = async (farmId, activityId, newStatus) => {
    setUpdatingTaskId(activityId);
    try {
      const res = await updateFarmActivity(farmId, activityId, { status: newStatus });
      if (res.success) {
        dispatchFarmNotificationUpdate();
        // Refresh activity overview
        const refreshed = await fetchActivitiesOverview();
        if (refreshed.success) {
          setActivityOverview(refreshed.data);
          setActivityOverviewError(false);
        } else {
          setActivityOverviewError(true);
        }
      } else {
        alert(res.error?.message || "Failed to update activity status");
      }
    } catch {
      alert("Error updating activity");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleDelete = async (farmId) => {
    if (!window.confirm(t("myFarm.confirmDelete") || "Are you sure you want to delete this farm?")) {
      return;
    }
    setDeletingId(farmId);
    try {
      const res = await deleteFarm(farmId);
      if (res.success) {
        setFarms((prev) => prev.filter((f) => f._id !== farmId));
        if (summary) {
          setSummary((prev) => ({
            ...prev,
            totalFarms: Math.max(0, (prev?.totalFarms || 1) - 1),
          }));
        }
      } else {
        alert(res.error?.message || "Failed to delete farm");
      }
    } catch {
      alert("Error deleting farm");
    } finally {
      setDeletingId(null);
    }
  };


  return (
    <div className="space-y-7">
      <header className="relative isolate overflow-hidden rounded-[28px] border border-line bg-surface shadow-km-sm">
        <div aria-hidden="true" className="absolute inset-0 -z-20 bg-cover bg-[center_75%]" style={{ backgroundImage: "url('/images/hero.png')" }} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#052e21]/95 via-[#052e21]/60 to-transparent" />
        <div className="flex min-h-[200px] flex-col justify-center gap-6 p-5 sm:min-h-[220px] sm:p-7 lg:flex-row lg:items-end lg:justify-between lg:p-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{t("myFarm.title")}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/85 sm:text-base">{t("myFarm.subtitle")}</p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <Link
            href="/my-farm/plan"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-white/90 px-4 py-2.5 text-sm font-semibold text-content shadow-km-sm transition-colors hover:border-forest/40 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-climate dark:bg-surface/90 dark:hover:bg-surface-2"
          >
            <Sprout className="h-4 w-4 text-forest dark:text-emerald-300" />
            {t("myFarm.planning.planWithAi") || "Plan a Crop with AI"}
          </Link>
          <Link
            href="/my-farm/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white shadow-km-sm transition-colors hover:bg-forest-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-climate"
          >
            <Plus className="h-4 w-4" />
            {t("myFarm.addNewFarm")}
          </Link>
          </div>
        </div>
      </header>

      {user && farmDataIsCurrent && activityOverviewError && (
        <div role="status" className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <span>{lang === "bn" ? "খামারের কাজের সারাংশ লোড হয়নি।" : "Farm activity summary could not be loaded."}</span>
          <button type="button" onClick={() => loadFarmsAndActivities(undefined, currentUserId)} className="min-h-9 rounded-lg border border-amber-400 px-3 py-2 text-xs font-semibold hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-950/60">
            {lang === "bn" ? "আবার চেষ্টা করুন" : "Retry"}
          </button>
        </div>
      )}

      {/* Guest Mode Notice */}
      {!user && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-medium">{t("myFarm.guestNotice")}</p>
            </div>
          </div>
          <Link
            href="/login?redirect=/my-farm"
            className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
          >
            {t("myFarm.loginCta")}
          </Link>
        </div>
      )}

      {/* Summary KPI Cards */}
      {user && displayedSummary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-km-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-muted">
                {t("myFarm.stats.totalFarms")}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-50 text-forest-700 dark:bg-forest-950/60 dark:text-forest-400">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-stone-900 dark:text-content">
                {displayedSummary.totalFarms}
              </span>
              <span className="text-xs text-stone-500 dark:text-muted">
                {lang === "bn" ? "প্লট নিবন্ধিত" : "plots registered"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 shadow-km-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-muted">
                {t("myFarm.stats.totalArea")}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-stone-900 dark:text-content">
                {displayedSummary.totalAreaDecimal}
              </span>
              <span className="text-xs text-stone-500 dark:text-muted">
                {lang === "bn" ? "শতাংশ (Decimal)" : "decimals"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 shadow-km-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-muted">
                {t("myFarm.stats.activeCrops")}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                <Sprout className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-stone-900 dark:text-content">
                {displayedSummary.uniqueCropsCount || 0}
              </span>
              <span className="text-xs text-stone-500 dark:text-muted">
                {lang === "bn" ? "ধরনের ফসল" : "crop types"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading || authLoading || (user && !farmDataIsCurrent) ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-2xl border border-line bg-surface p-6"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-900 dark:text-red-200">{lang === "bn" ? "খামারের তথ্য লোড করা যায়নি" : "Farm data could not be loaded"}</p>
              <p className="mt-1 text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          </div>
          <button
            onClick={() => loadFarmsAndActivities(undefined, currentUserId)}
            className="mt-4 min-h-10 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
          >
            {lang === "bn" ? "আবার চেষ্টা করুন" : "Try again"}
          </button>
        </div>
      ) : displayedFarms.length === 0 ? (
        /* Empty State */
        <div className="rounded-[28px] border border-line bg-surface p-6 text-center shadow-km-sm sm:p-10 lg:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-50 text-forest-700 dark:bg-forest-950/60 dark:text-forest-400">
            <Tractor className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-stone-900 dark:text-content">
            {t("myFarm.noFarmsTitle")}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-stone-600 dark:text-muted">
            {t("myFarm.noFarmsDesc")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/my-farm/plan"
              className="inline-flex items-center justify-center rounded-xl border border-forest-600 bg-white px-5 py-2.5 text-sm font-semibold text-forest-700 shadow-xs transition hover:bg-forest-50 dark:border-forest-500/50 dark:bg-surface dark:text-forest-400 dark:hover:bg-forest-950/40"
            >
              {t("myFarm.planning.planWithAi") || "Plan a Crop with AI"}
            </Link>
            <Link
              href="/my-farm/new"
              className="inline-flex items-center gap-2 rounded-xl bg-forest-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-800 dark:bg-forest-600 dark:hover:bg-forest-500"
            >
              <Plus className="h-4 w-4" />
              {t("myFarm.addNewFarm")}
            </Link>
          </div>
        </div>
      ) : (
        /* Farm Cards Grid */
        <section aria-label={lang === "bn" ? "নিবন্ধিত খামার" : "Registered farms"}>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-content">{lang === "bn" ? "আপনার খামার" : "Your farms"}</h2>
            <p className="mt-1 text-sm text-muted">{lang === "bn" ? "প্রতিটি প্লটের তথ্য ও কাজ এক জায়গায় দেখুন" : "Farm details and field activities in one place"}</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted">
            <Layers className="h-3.5 w-3.5 text-forest dark:text-emerald-300" />
            {digits(displayedSummary?.totalFarms ?? displayedFarms.length)} {lang === "bn" ? "টি খামার" : "farms"}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {displayedFarms.map((farm) => (
            <div
              key={farm._id}
              className="group flex min-w-0 flex-col justify-between rounded-2xl border border-line bg-surface p-5 shadow-km-sm transition-colors hover:border-forest/30 hover:shadow-md sm:p-6"
            >
              <div>
                {/* Header: Name and status badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold text-stone-900 dark:text-content">
                      {farm.farmName}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-500 dark:text-muted">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-forest-600 dark:text-forest-400" />
                      <span className="truncate">
                        {farmLabel(farm, "upazila")}, {farm.location?.districtCode ? t(`rotation.districts.${farm.location.districtCode}`) : farm.location?.district}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="mt-5 space-y-3 rounded-xl border border-line/70 bg-bg/70 p-4 dark:bg-surface-2/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500 dark:text-muted">
                      {t("myFarm.fields.cropCode")}:
                    </span>
                    <span className="max-w-[65%] truncate text-right font-semibold text-content">
                      {farmLabel(farm, "crop")}
                      {farm.crop?.variety ? ` (${farm.crop.variety})` : ""}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500 dark:text-muted">
                      {t("myFarm.fields.landArea")}:
                    </span>
                    <span className="font-semibold text-stone-900 dark:text-content">
                      {digits(farm.land?.area)} {farmLabel(farm, "unit")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500 dark:text-muted">
                      {t("myFarm.fields.plantingDate")}:
                    </span>
                    <span className="font-medium text-stone-700 dark:text-muted">
                      {digits(farm.crop?.plantingDate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500 dark:text-muted">
                      {t("myFarm.fields.irrigationAvailability")}:
                    </span>
                    <span className="capitalize text-stone-700 dark:text-muted">
                      {["available", "limited", "unavailable"].includes(farm.water?.irrigationAvailability) ? t(`myFarm.irrigationOptions.${farm.water.irrigationAvailability}`) : t("farmUi.notRecorded")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 dark:border-line">
                <Link
                  href={`/my-farm/${farm._id}`}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-forest transition-colors hover:bg-forest/5 hover:text-forest-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-climate dark:text-emerald-300"
                >
                  {t("myFarm.viewDetails")}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>

                <div className="flex items-center gap-1">
                  <Link
                    href={`/my-farm/${farm._id}/edit`}
                    className="min-h-10 min-w-10 rounded-xl p-2 text-muted transition-colors hover:bg-bg hover:text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-climate dark:hover:bg-surface-2"
                    title={t("myFarm.editFarm")}
                    aria-label={`${t("myFarm.editFarm")} ${farm.farmName}`}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(farm._id, farm.farmName)}
                    disabled={deletingId === farm._id}
                    className="min-h-10 min-w-10 rounded-xl p-2 text-muted transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                    title={t("myFarm.deleteFarm")}
                    aria-label={`${t("myFarm.deleteFarm")} ${farm.farmName}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        </section>
      )}
    </div>
  );
}

export default function ProtectedMyFarmPage() {
  return <PrivateAccess><MyFarmPage /></PrivateAccess>;
}
