"use client";
import Image from "next/image";
import { useLang } from "@/lib/i18n/LanguageContext.js";

/** Quiet farming image shared by login and registration. */
export function AuthHeroPanel() {
  const { t } = useLang();
  return <section className="relative isolate flex h-full min-h-[540px] flex-col overflow-hidden bg-[#062e20] p-8 text-white lg:p-10">
    <Image src="/images/auth-farmer.png" alt="" fill sizes="(min-width: 1024px) 480px, 100vw" className="-z-20 object-cover object-center" priority />
    <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-[#032b1e]/85 via-[#032b1e]/25 to-transparent" />
    <div className="max-w-sm">
      <h2 className="text-3xl font-semibold leading-[1.2] tracking-tight xl:text-[2.15rem]">{t("auth.authPanelTitle")}</h2>
      <p className="mt-4 max-w-[29ch] text-sm leading-7 text-[#e0ede4]">{t("auth.authPanelBody")}</p>
    </div>
  </section>;
}
