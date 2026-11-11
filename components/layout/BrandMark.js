"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sprout } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageContext.js";

const LOGO_SRC = "/images/logo.png";

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
    <Link href={href} className="group inline-flex items-center gap-2.5">
      {logoOk ? (
        <Image
          src={LOGO_SRC}
          alt="Krishi Mama"
          width={64}
          height={36}
          onError={() => setLogoOk(false)}
          className={`h-9 w-auto max-w-[130px] shrink-0 object-contain drop-shadow-xs transition-transform duration-200 group-hover:scale-105 ${
            tone === "dark" ? "brightness-100" : ""
          }`}
          priority
        />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald text-white shadow-km-sm">
          <Sprout className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      {!compact ? (
        <span className="min-w-0 leading-tight">
          <span className="block text-base font-bold tracking-tight text-inherit transition-colors group-hover:text-emerald">
            {t("brand")}
          </span>
          {showSubtitle ? (
            <span
              className={
                tone === "dark"
                  ? "mt-0.5 block text-[11px] font-normal leading-4 text-emerald-100/75"
                  : "mt-0.5 block text-[11px] font-normal leading-4 text-muted"
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
