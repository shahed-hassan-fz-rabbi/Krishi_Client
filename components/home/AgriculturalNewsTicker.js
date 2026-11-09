"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { useAuth } from "@/contexts/AuthContext.js";
import {
  fetchClimateSummary,
  fetchClimateLatest,
  fetchPrecipitationLatest,
  fetchSoilMoistureLatest,
  fetchVegetationLatest,
} from "@/services/api.js";
import {
  generateDistrictHeadlines,
} from "@/lib/tickerHeadlines.js";

export function AgriculturalNewsTicker() {
  const { t, locale } = useLang();
  const { selectedDistrict, setSelectedDistrict } = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [climateData, setClimateData] = useState(null);
  const [powerLatest, setPowerLatest] = useState(null);
  const [gpmData, setGpmData] = useState(null);
  const [smapData, setSmapData] = useState(null);
  const [modisData, setModisData] = useState(null);
  const [isManualPaused, setIsManualPaused] = useState(false);
  const [isHoverPaused, setIsHoverPaused] = useState(false);

  // Normalize current district code
  const currentDistrict =
    selectedDistrict?.toLowerCase() === "chattogram" ? "chattogram" : "cumilla";

  // When registered user is logged in, automatically sync with their registered farm district
  useEffect(() => {
    if (isAuthenticated && user?.preferredDistrict) {
      const userDist = user.preferredDistrict.toLowerCase();
      if ((userDist === "cumilla" || userDist === "chattogram") && userDist !== currentDistrict) {
        setSelectedDistrict(userDist);
      }
    }
  }, [isAuthenticated, user?.preferredDistrict, currentDistrict, setSelectedDistrict]);

  // Fetch verified real data on mount & when district changes, and periodically every 30 minutes
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [climRes, powerRes, gpmRes, smapRes, modisRes] = await Promise.allSettled([
          fetchClimateSummary(currentDistrict),
          fetchClimateLatest(currentDistrict),
          fetchPrecipitationLatest(currentDistrict),
          fetchSoilMoistureLatest(currentDistrict),
          fetchVegetationLatest(currentDistrict),
        ]);

        if (!isMounted) return;

        if (climRes.status === "fulfilled" && climRes.value?.data) {
          setClimateData({ ...climRes.value.data, provenance: climRes.value.meta?.provenance });
        } else setClimateData(null);
        if (powerRes.status === "fulfilled" && powerRes.value?.data) {
          setPowerLatest({ ...powerRes.value.data, provenance: powerRes.value.meta?.provenance });
        } else setPowerLatest(null);
        if (gpmRes.status === "fulfilled" && gpmRes.value?.data) {
          setGpmData({ ...gpmRes.value.data, provenance: gpmRes.value.meta?.provenance });
        } else setGpmData(null);
        if (smapRes.status === "fulfilled" && smapRes.value?.data) {
          setSmapData({ ...smapRes.value.data, provenance: smapRes.value.meta?.provenance });
        } else setSmapData(null);
        if (modisRes.status === "fulfilled" && modisRes.value?.data) {
          setModisData({ ...modisRes.value.data, provenance: modisRes.value.meta?.provenance });
        } else setModisData(null);
      } catch {
        // Fallback snapshots in tickerHeadlines handle offline resilience gracefully
      }
    }

    loadData();

    // Periodic auto-refresh every 30 minutes so long-running display tabs stay up-to-date
    const refreshInterval = setInterval(loadData, 30 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, [currentDistrict]);

  // Headlines display source observation dates, never the current client date.
  const headlines = useMemo(() => {
    return generateDistrictHeadlines({
      district: currentDistrict,
      climateData,
      powerLatest,
      gpmData,
      smapData,
      modisData,
      locale,
    });
  }, [currentDistrict, climateData, powerLatest, gpmData, smapData, modisData, locale]);

  // Check if any breaking alert is active
  const hasBreakingAlert = headlines.some((h) => h.isBreaking);

  // Is animation paused
  const isPaused = isManualPaused || isHoverPaused;

  // Toggle manual pause
  const togglePlayPause = useCallback(() => {
    setIsManualPaused((prev) => !prev);
  }, []);

  // Render individual headline item without cluttered icons
  const renderItem = (item, keyPrefix = "") => {
    return (
      <Link
        key={`${keyPrefix}-${item.id}`}
        href={item.href}
        className="group/item inline-flex items-center space-x-2.5 px-4 py-1 text-xs text-ink dark:text-[#e2ede6] hover:text-emerald-800 dark:hover:text-white transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 rounded"
      >
        {/* Category Pill (Clean typography, no cluttered icons) */}
        {item.isBreaking ? (
          <span className="inline-flex items-center bg-red-600 text-white font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded shadow-sm">
            {item.categoryLabel}
          </span>
        ) : item.category === "NASA UPDATE" ? (
          <span className="inline-flex items-center bg-sky-800 text-sky-100 font-semibold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded border border-sky-600/40">
            {item.categoryLabel}
          </span>
        ) : item.category === "DAILY CLIMATE" ? (
          <span className="inline-flex items-center bg-emerald-800 text-emerald-100 font-semibold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded border border-emerald-600/40">
            {item.categoryLabel}
          </span>
        ) : item.category === "CROP GUIDELINES" ? (
          <span className="inline-flex items-center bg-amber-800 text-amber-100 font-semibold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded border border-amber-600/40">
            {item.categoryLabel}
          </span>
        ) : (
          <span className="inline-flex items-center bg-[#164832] text-emerald-100 font-semibold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded border border-emerald-500/30">
            {item.categoryLabel}
          </span>
        )}

        {/* Source observation date or historical coverage period */}
        <span className="hidden sm:inline-flex items-center text-[10px] font-mono font-medium text-emerald-800 dark:text-emerald-300/90 bg-white/70 dark:bg-black/40 border border-emerald-700/20 dark:border-emerald-500/20 px-2 py-0.5 rounded">
          {item.dateLabel}
        </span>

        {/* Clean Headline Text */}
        <span className="font-medium text-[12.5px] group-hover/item:text-emerald-200 group-hover/item:underline underline-offset-2 transition-colors">
          {item.headline}
        </span>

        {/* Subtle Separator */}
        <span className="text-emerald-600/50 select-none pl-3" aria-hidden="true">
          •
        </span>
      </Link>
    );
  };

  const isUserFarmDistrict = (code) => {
    return isAuthenticated && user?.preferredDistrict?.toLowerCase() === code;
  };

  return (
    <aside
      aria-label={t("ticker.brandLabel") || "Agricultural News Bulletin"}
      className="km-ticker-container sticky top-16 z-30 w-full border-b border-emerald-900/20 dark:border-white/10 bg-[#f2f7f3]/98 dark:bg-[#06120c]/98 backdrop-blur-md text-ink dark:text-white shadow-km-sm transition-all"
      onMouseEnter={() => setIsHoverPaused(true)}
      onMouseLeave={() => setIsHoverPaused(false)}
      onTouchStart={() => setIsHoverPaused(true)}
      onTouchEnd={() => setIsHoverPaused(false)}
    >
      <div className="mx-auto flex h-10 max-w-7xl items-center overflow-hidden px-2 sm:px-4">
        {/* Left Broadcast Channel Badge Block */}
        <div className="z-30 flex shrink-0 items-center space-x-1.5 sm:space-x-2 bg-[#f2f7f3] dark:bg-[#06120c] pr-2.5 border-r border-emerald-900/20 dark:border-white/10 py-1">
          {/* TV News Live Channel Badge with sleek pulsing dot */}
          <div
            className={`flex items-center space-x-1.5 rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors ${
              hasBreakingAlert
                ? "bg-red-600 shadow-red-900/40"
                : "bg-[#144830] border border-emerald-500/30"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                  hasBreakingAlert ? "bg-red-300" : "bg-emerald-400"
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  hasBreakingAlert ? "bg-white" : "bg-emerald-400"
                }`}
              />
            </span>
            <span className="hidden md:inline font-bold">
              {hasBreakingAlert
                ? t("ticker.breaking") || "BREAKING"
                : t("ticker.brandLabel") || "KRISHI BULLETIN"}
            </span>
            <span className="md:hidden font-bold">
              {hasBreakingAlert
                ? t("ticker.breaking") || "ALERT"
                : t("ticker.statusObserved") || "OBSERVED"}
            </span>
          </div>

          {/* Clean Location Toggle Pills (No extra icons) */}
          <div
            role="group"
            aria-label={t("ticker.selectDistrictPrompt") || "Select district"}
            className="flex items-center rounded bg-emerald-950/5 dark:bg-black/40 border border-emerald-900/20 dark:border-emerald-900/60 p-0.5 text-[11px]"
          >
            <button
              type="button"
              onClick={() => setSelectedDistrict("cumilla")}
              className={`rounded px-2 py-0.5 font-semibold transition-all flex items-center gap-1 ${
                currentDistrict === "cumilla"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-emerald-900/70 dark:text-emerald-200/70 hover:text-emerald-950 dark:hover:text-white hover:bg-emerald-900/10 dark:hover:bg-emerald-900/40"
              }`}
              title={
                isUserFarmDistrict("cumilla")
                  ? (locale === "bn" ? "আপনার নিবন্ধিত খামার: কুমিল্লা" : "Your Registered Farm: Cumilla")
                  : (locale === "bn" ? "কুমিল্লা জেলা নির্বাচন করুন" : "Select Cumilla")
              }
            >
              <span>{t("ticker.cumilla") || "Cumilla"}</span>
              {isUserFarmDistrict("cumilla") && (
                <span className="text-[9px] bg-emerald-800 text-emerald-100 px-1 rounded uppercase font-bold tracking-tight">
                  {locale === "bn" ? "খামার" : "Farm"}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setSelectedDistrict("chattogram")}
              className={`rounded px-2 py-0.5 font-semibold transition-all flex items-center gap-1 ${
                currentDistrict === "chattogram"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-emerald-900/70 dark:text-emerald-200/70 hover:text-emerald-950 dark:hover:text-white hover:bg-emerald-900/10 dark:hover:bg-emerald-900/40"
              }`}
              title={
                isUserFarmDistrict("chattogram")
                  ? (locale === "bn" ? "আপনার নিবন্ধিত খামার: চট্টগ্রাম" : "Your Registered Farm: Chattogram")
                  : (locale === "bn" ? "চট্টগ্রাম জেলা নির্বাচন করুন" : "Select Chattogram")
              }
            >
              <span>{t("ticker.chattogram") || "Chattogram"}</span>
              {isUserFarmDistrict("chattogram") && (
                <span className="text-[9px] bg-emerald-800 text-emerald-100 px-1 rounded uppercase font-bold tracking-tight">
                  {locale === "bn" ? "খামার" : "Farm"}
                </span>
              )}
            </button>
          </div>

          {/* Minimal Pause / Resume Control */}
          <button
            type="button"
            onClick={togglePlayPause}
            className={`p-1 rounded transition-colors text-emerald-300 hover:text-white hover:bg-emerald-900/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 ${
              isManualPaused ? "bg-emerald-800/80 text-white" : ""
            }`}
            title={
              isManualPaused
                ? (locale === "bn" ? "স্ক্রোল পুনরায় চালু করুন" : "Resume ticker")
                : (locale === "bn" ? "স্ক্রোল থামান" : "Pause ticker")
            }
            aria-label={isManualPaused ? "Resume ticker" : "Pause ticker"}
          >
            {isManualPaused ? (
              <Play className="h-3 w-3 fill-current" />
            ) : (
              <Pause className="h-3 w-3 fill-current" />
            )}
          </button>
        </div>

        {/* Scrolling News Marquee Track Area (Right to Left: ডান দিক থেকে বাম দিকে) */}
        <div className="relative flex flex-1 items-center overflow-hidden km-ticker-scroll">
          {/* Left subtle fade mask */}
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-6 bg-gradient-to-r from-[#091a13] dark:from-[#06120c] to-transparent"
            aria-hidden="true"
          />

          {/* Continuous Right-to-Left Infinite Scrolling Tracks */}
          <div
            className="flex w-full select-none"
            style={{
              animationPlayState: isPaused ? "paused" : "running",
            }}
          >
            {/* Track 1: Original Headlines */}
            <div
              className="flex animate-km-ticker shrink-0 items-center"
              style={{
                animationPlayState: isPaused ? "paused" : "running",
              }}
            >
              {headlines.map((item) => renderItem(item, "t1"))}
            </div>

            {/* Track 2: Duplicate for Mathematical Zero-Gap Infinite Seamless Loop */}
            <div
              className="flex animate-km-ticker shrink-0 items-center"
              aria-hidden="true"
              style={{
                animationPlayState: isPaused ? "paused" : "running",
              }}
            >
              {headlines.map((item) => renderItem(item, "t2"))}
            </div>
          </div>

          {/* Right subtle fade mask */}
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-8 sm:w-16 bg-gradient-to-l from-[#091a13] dark:from-[#06120c] to-transparent"
            aria-hidden="true"
          />
        </div>
      </div>
    </aside>
  );
}
