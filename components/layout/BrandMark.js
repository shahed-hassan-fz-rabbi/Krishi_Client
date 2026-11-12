"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sprout } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { BRAND_LOGO_SRC } from "@/lib/branding.js";

/**
 * Official Krishi Mama mark.
 * Uses the user-provided /images/logo.png with object-contain (no stretch/crop).
 * If the asset is missing, falls back to the temporary inline mark without
 * breaking layout; it displays automatically once the user adds the file.
 */
export function BrandMark({ href = "/", tone = "light", compact = false, showSubtitle = true }) {
  const { t } = useLang();
  const [logoOk, setLogoOk] = useState(true);

  return (
    <Link href={href} className="group inline-flex items-center gap-2.5 shrink-0">
      {logoOk ? (
        <Image
          src={BRAND_LOGO_SRC}
          alt="Krishi Mama"
          width={40}
          height={40}
          unoptimized
          onError={() => setLogoOk(false)}
          className="h-10 w-10 shrink-0 object-contain drop-shadow-xs transition-transform duration-200 group-hover:scale-105"
          priority
        />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald text-white shadow-km-sm">
          <Sprout className="h-6 w-6" aria-hidden="true" />
        </span>
      )}
      {!compact ? (
        <span className="min-w-0 leading-tight">
          <span className="block text-base font-bold tracking-tight text-inherit transition-colors group-hover:text-emerald whitespace-nowrap">
            {t("brand")}
          </span>
          {showSubtitle ? (
            <span
              className={
                tone === "dark"
                  ? "mt-0.5 block text-[11px] font-normal leading-4 text-emerald-100/75 whitespace-nowrap"
                  : "mt-0.5 block text-[11px] font-normal leading-4 text-muted whitespace-nowrap"
              }
            >
              {t("brandSubtitle")}
            </span>
          ) : null}
        </span>
      ) : null}
    </Link>
  );
}
