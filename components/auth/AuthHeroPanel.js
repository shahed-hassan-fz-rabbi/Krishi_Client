"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CloudRain, Layers, ShieldCheck, Sprout } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext.js";

const LOGO_SRC = "/images/logo.png";

/**
 * AuthHeroPanel
 * High-definition, watermark-free promotional panel for Krishi Mama authentication.
 * Features an elegant forest green gradient backdrop, SVG topographic agricultural
 * curves, verified NASA & BARC capability highlights, and clean brand typography.
 */
export function AuthHeroPanel({ mode = "login" }) {
  const { t } = useLang();
  const [logoOk, setLogoOk] = useState(true);

  const isRegister = mode === "register";

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-emerald-900/40 bg-gradient-to-br from-[#062415] via-[#0b3820] to-[#124d2c] p-8 lg:p-10 flex flex-col justify-between shadow-sm text-white select-none">
      {/* SVG Agricultural Topography & Field Terrace Curves (100% Vector, Zero Watermarks) */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern id="agro-grid-pattern" width="48" height="48" patternUnits="userSpaceOnUse">
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#agro-grid-pattern)" />
        <path
          d="M -40 160 C 140 100, 260 240, 520 180 C 780 120, 880 220, 1100 160"
          fill="none"
          stroke="rgba(52, 211, 153, 0.35)"
          strokeWidth="1.5"
        />
        <path
          d="M -40 240 C 120 180, 280 320, 540 260 C 800 200, 900 300, 1100 240"
          fill="none"
          stroke="rgba(52, 211, 153, 0.25)"
          strokeWidth="1.5"
        />
        <path
          d="M -40 320 C 160 260, 300 400, 560 340 C 820 280, 920 380, 1100 320"
          fill="none"
          stroke="rgba(52, 211, 153, 0.18)"
          strokeWidth="1.5"
        />
        <path
          d="M -40 400 C 140 340, 320 480, 580 420 C 840 360, 940 460, 1100 400"
          fill="none"
          stroke="rgba(52, 211, 153, 0.12)"
          strokeWidth="1.5"
        />
      </svg>

      {/* Atmospheric ambient glow */}
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-emerald-600/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Top Section: Brand + Headlines */}
      <div className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          {logoOk ? (
            <Image
              src={LOGO_SRC}
              alt="Krishi Mama"
              width={40}
              height={40}
              onError={() => setLogoOk(false)}
              className="h-10 w-10 shrink-0 rounded-lg bg-white p-1 object-contain shadow-sm border border-white/20 group-hover:scale-105 transition-transform"
            />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm">
              <Sprout className="h-6 w-6" aria-hidden="true" />
            </span>
          )}
          <div className="leading-tight">
            <span className="block text-lg font-bold text-white tracking-tight">Krishi Mama</span>
            <span className="block text-[11px] text-emerald-300 font-medium">
              Agro-Climatic Intelligence
            </span>
          </div>
        </Link>

        <div className="mt-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-medium text-emerald-200 mb-3 backdrop-blur-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
            <span>{t("auth.secureSession")}</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug">
            {isRegister
              ? t("auth.registerBrandTitle") || "Empowering Resilient Agriculture with Space Science"
              : t("auth.loginBrandTitle") || "NASA Satellite Intelligence for Bangladeshi Farmers"}
          </h2>
          <p className="mt-2.5 text-sm text-emerald-100/90 leading-relaxed max-w-md">
            {isRegister
              ? t("auth.registerBrandDesc") ||
                "Create your farm profile to unlock precision crop scheduling, environmental risk advisories, and stage-by-stage lifecycle intelligence."
              : t("auth.loginBrandDesc") ||
                "Real-time agro-meteorological monitoring, soil moisture tracking, and localized crop lifecycle calendars for Cumilla and Chattogram."}
          </p>
        </div>
      </div>

      {/* Middle Section: Value Proposition Cards */}
      <div className="relative z-10 my-6 space-y-3">
        <div className="flex items-start gap-3 rounded-xl bg-black/20 border border-white/10 p-3.5 backdrop-blur-xs transition-colors hover:bg-black/25">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            <CloudRain className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">
              {isRegister
                ? t("auth.registerFeature1") || "NASA Climate Observations"
                : t("auth.loginFeature1") || "NASA POWER Meteorology"}
            </p>
            <p className="text-[11px] text-emerald-200/80 leading-normal mt-0.5">
              {isRegister
                ? t("auth.registerFeature1Desc") ||
                  "Daily precipitation, solar radiation, and thermal metrics tailored for your district."
                : t("auth.loginFeature1Desc") ||
                  "Decades of solar irradiance and rainfall patterns updated daily for your fields."}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-black/20 border border-white/10 p-3.5 backdrop-blur-xs transition-colors hover:bg-black/25">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">
              {isRegister
                ? t("auth.registerFeature2") || "Location-Specific Grounding"
                : t("auth.loginFeature2") || "SMAP & MODIS Earth Observation"}
            </p>
            <p className="text-[11px] text-emerald-200/80 leading-normal mt-0.5">
              {isRegister
                ? t("auth.registerFeature2Desc") ||
                  "Tailored agro-ecological intelligence for Chattogram and Cumilla zones."
                : t("auth.loginFeature2Desc") ||
                  "Multi-depth root-zone soil moisture and satellite vegetation vigor indices."}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-black/20 border border-white/10 p-3.5 backdrop-blur-xs transition-colors hover:bg-black/25">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">
              {isRegister
                ? t("auth.registerFeature3") || "BARC & DAE Agricultural Science"
                : t("auth.loginFeature3") || "Calibrated Lifecycle Calendars"}
            </p>
            <p className="text-[11px] text-emerald-200/80 leading-normal mt-0.5">
              {isRegister
                ? t("auth.registerFeature3Desc") ||
                  "Stage-by-stage crop management grounded in official Bangladeshi agricultural calendars."
                : t("auth.loginFeature3Desc") ||
                  "Ground-truthed stage transitions and actionable field advisories with zero guesswork."}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Citation & Verification Line */}
      <div className="relative z-10 pt-4 border-t border-emerald-800/60 flex items-center justify-between text-[11px] text-emerald-300/80">
        <span>NASA Earthdata • BARC / DAE</span>
        <span>Cumilla & Chattogram</span>
      </div>
    </div>
  );
}
