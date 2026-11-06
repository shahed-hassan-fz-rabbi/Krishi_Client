"use client";

import { useState } from "react";
import { Leaf } from "lucide-react";
import { Badge } from "@/components/ui/Badge.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";

const HERO_SRC = "/images/hero.jpeg";

/**
 * Landing hero photograph (user-provided asset).
 * - object-cover inside a fixed aspect frame; no distortion.
 * - If /images/hero.jpeg is missing, a graceful styled placeholder is shown.
 * - Two floating climate chips are labeled as Sample until NASA data is live.
 */
export function HeroMedia() {
  const { t } = useLang();
  const [ok, setOk] = useState(true);

  return (
    <div className="relative">
      <div className="relative aspect-[4/5] w-full max-w-xl self-center overflow-hidden rounded-2xl shadow-km-md ring-1 ring-line sm:aspect-[4/3] lg:aspect-[5/6]">
        {ok ? (
          <img
            src={HERO_SRC}
            alt={t("landing.heroImageAlt")}
            onError={() => setOk(false)}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-sage to-bg">
            <Leaf className="h-10 w-10 text-emerald" aria-hidden="true" />
            <p className="max-w-[16rem] px-4 text-center text-xs text-muted">
              {t("landing.heroImagePending")}
            </p>
          </div>
        )}

        {/* Floating climate chips over the photograph (sample-labeled) */}
        <div className="absolute left-4 top-6 hidden rounded-xl border border-line/60 bg-surface/95 px-3.5 py-3 shadow-km-md backdrop-blur sm:block">
          <p className="text-[11px] text-muted">{t("landing.floatingRainfall")}</p>
          <p className="text-base font-semibold text-content">
            542 mm<span className="ml-1 text-[11px] font-normal text-muted">Jul</span>
          </p>
          <span className="text-[10px] font-medium text-amber">{t("common.sample")}</span>
        </div>

        <div className="absolute bottom-6 right-4 hidden rounded-xl border border-line/60 bg-surface/95 px-3.5 py-3 shadow-km-md backdrop-blur sm:block">
          <p className="text-[11px] text-muted">{t("landing.floatingSoil")}</p>
          <p className="text-base font-semibold text-content">
            0.31 <span className="text-[11px] font-normal text-muted">m³/m³</span>
          </p>
          <span className="text-[10px] font-medium text-amber">{t("common.sample")}</span>
        </div>

        <Badge tone="blue" className="absolute bottom-4 left-4 border-white/40">
          Chattogram · Bangladesh
        </Badge>
      </div>
    </div>
  );
}
