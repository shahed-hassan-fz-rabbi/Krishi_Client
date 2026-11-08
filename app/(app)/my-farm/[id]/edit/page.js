"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Save,
  Tractor,
} from "lucide-react";

import { useLang } from "@/lib/i18n/LanguageContext.js";
import { fetchFarmById, updateFarm } from "@/services/api.js";
import { LAND_UNITS } from "@/lib/upazilas.js";

function EditFarmContent() {
  const router = useRouter();
  const params = useParams();
  const farmId = params?.id;
  const { t, lang } = useLang();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState("");

  const [formData, setFormData] = useState({
    farmName: "",
    village: "",
    area: "",
    unit: "decimal",
    landType: "medium_high",
    soilType: "loam",
    drainage: "good",
    irrigationAvailability: "available",
    waterSource: "",
    variety: "",
    cultivationMethod: "",
    plantingDate: "",
    notes: "",
    status: "active",
  });

  const [staticLocation, setStaticLocation] = useState({
    district: "",
    districtCode: "",
    upazila: "",
    cropName: "",
  });

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetchFarmById(farmId);
        if (active) {
          if (res.success && res.data) {
            const f = res.data;
            setFormData({
              farmName: f.farmName || "",
              village: f.location?.village || "",
              area: f.land?.area || "",
              unit: f.land?.unit || "decimal",
              landType: f.land?.landType || "medium_high",
              soilType: f.soil?.type || "loam",
              drainage: f.soil?.drainage || "good",
              irrigationAvailability: f.water?.irrigationAvailability || "available",
              waterSource: f.water?.waterSource || "",
              variety: f.crop?.variety || "",
              cultivationMethod: f.crop?.cultivationMethod || "",
              plantingDate: f.crop?.plantingDate || "",
              notes: f.notes || "",
              status: f.status || "active",
            });
            setStaticLocation({
              district: f.location?.district,
              districtCode: f.location?.districtCode,
              upazila: f.location?.upazila,
              cropName: f.crop?.cropName,
            });
          } else {
            setError(res.error?.message || "Failed to load farm details");
          }
        }
      } catch (err) {
        if (active) setError("A network error occurred while loading farm data.");
      } finally {
        if (active) setLoading(false);
      }
    }

    if (farmId) loadData();

    return () => {
      active = false;
    };
  }, [farmId]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.farmName.trim()) {
      setSubmitError(lang === "bn" ? "খামারের নাম আবশ্যক" : "Farm name is required");
      return;
    }
    const areaNum = parseFloat(formData.area);
    if (!formData.area || isNaN(areaNum) || areaNum <= 0) {
      setSubmitError(lang === "bn" ? "সঠিক জমির পরিমাণ লিখুন" : "Valid positive area is required");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    const payload = {
      farmName: formData.farmName.trim(),
      location: {
        village: formData.village.trim(),
      },
      land: {
        area: areaNum,
        unit: formData.unit,
        landType: formData.landType,
      },
      soil: {
        type: formData.soilType,
        drainage: formData.drainage,
      },
      water: {
        irrigationAvailability: formData.irrigationAvailability,
        waterSource: formData.waterSource.trim(),
      },
      crop: {
        variety: formData.variety.trim(),
        cultivationMethod: formData.cultivationMethod.trim(),
        plantingDate: formData.plantingDate,
      },
      notes: formData.notes.trim(),
      status: formData.status,
    };

    try {
      const res = await updateFarm(farmId, payload);
      if (res.success) {
        router.push(`/my-farm/${farmId}`);
      } else {
        setSubmitError(res.error?.message || "Failed to update farm");
      }
    } catch {
      setSubmitError("Failed to update farm due to network error.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800" />
        <div className="h-96 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/30 dark:bg-red-950/20">
        <p className="text-sm font-semibold text-red-800 dark:text-red-300">{error}</p>
        <div className="mt-4">
          <Link
            href="/my-farm"
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-800 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("myFarm.backToList")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-2">
      <div className="flex items-center justify-between">
        <Link
          href={`/my-farm/${farmId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("myFarm.details.overview")}
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          {t("myFarm.editFarm")}
        </h1>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          {staticLocation.cropName} • {staticLocation.upazila}, {staticLocation.district}
        </p>
      </div>

      {submitError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900">
        {/* Farm Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
            {t("myFarm.fields.farmName")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.farmName}
            onChange={(e) => updateField("farmName", e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
          />
        </div>

        {/* Village */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
            {t("myFarm.fields.village")}
          </label>
          <input
            type="text"
            value={formData.village}
            onChange={(e) => updateField("village", e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
          />
        </div>

        {/* Land Area and Unit */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              {t("myFarm.fields.landArea")} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.area}
              onChange={(e) => updateField("area", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              {t("myFarm.fields.landUnit")}
            </label>
            <select
              value={formData.unit}
              onChange={(e) => updateField("unit", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            >
              {LAND_UNITS.map((u) => (
                <option key={u.code} value={u.code}>
                  {u.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Irrigation and Water */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              {t("myFarm.fields.irrigationAvailability")}
            </label>
            <select
              value={formData.irrigationAvailability}
              onChange={(e) => updateField("irrigationAvailability", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            >
              <option value="available">Available</option>
              <option value="limited">Limited</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              {t("myFarm.fields.waterSource")}
            </label>
            <input
              type="text"
              value={formData.waterSource}
              onChange={(e) => updateField("waterSource", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            />
          </div>
        </div>

        {/* Variety and Planting Date */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              {t("myFarm.fields.variety")}
            </label>
            <input
              type="text"
              value={formData.variety}
              onChange={(e) => updateField("variety", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              {t("myFarm.fields.plantingDate")}
            </label>
            <input
              type="date"
              value={formData.plantingDate}
              onChange={(e) => updateField("plantingDate", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => updateField("status", e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
          >
            <option value="active">Active</option>
            <option value="harvested">Harvested</option>
            <option value="planning">Planning</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
            {t("myFarm.fields.notes")}
          </label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-stone-100 pt-4 dark:border-stone-800">
          <Link
            href={`/my-farm/${farmId}`}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-forest-700 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-forest-800 disabled:opacity-50 dark:bg-forest-600 dark:hover:bg-forest-500"
          >
            {submitting ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EditFarmPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl space-y-4 py-8">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800" />
          <div className="h-96 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
        </div>
      }
    >
      <EditFarmContent />
    </Suspense>
  );
}
