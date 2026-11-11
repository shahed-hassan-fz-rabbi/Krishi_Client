"use client";
import { Suspense } from "react";
import { Droplets, Leaf, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PublicHeader, PublicFooter } from "@/components/layout/PublicChrome.js";
import { RotationPlanner } from "@/components/RotationPlanner.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { resolveRotationDistrict } from "@/lib/climatePlanning.js";

function PublicRotationForm() {
  const searchParams = useSearchParams();
  const { selectedDistrict } = useLocation();
  const district = resolveRotationDistrict(searchParams.get("district"), selectedDistrict);
  return <RotationPlanner publicMode initialDistrict={district} key={district} />;
}

export default function CropRotationPage() {
  const { t, locale } = useLang();
  return <div className="flex min-h-screen flex-col bg-bg">
    <PublicHeader />
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <header className="mb-8 max-w-3xl">
        <h1 className="break-words text-3xl font-bold leading-tight text-content sm:text-4xl">{t("rotation.simpleTitle")}</h1>
        <p className="mt-4 text-base leading-7 text-muted">{t("rotation.publicIntro")}</p>
      </header>
      <section aria-labelledby="rotation-benefits" className="mb-8">
        <h2 id="rotation-benefits" className="text-xl font-semibold text-content">{t("rotation.benefitsTitle")}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[{ key: "soil", Icon: Leaf }, { key: "pests", Icon: ShieldCheck }, { key: "planning", Icon: Droplets }].map(({ key, Icon }) => <article key={key} className="rounded-xl border border-line bg-surface p-5">
            <Icon className="mb-3 h-6 w-6 text-emerald-strong" aria-hidden="true" />
            <h3 className="font-semibold text-content">{t(`rotation.benefits.${key}.title`)}</h3>
            <p className="mt-2 text-sm leading-7 text-muted">{t(`rotation.benefits.${key}.body`)}</p>
          </article>)}
        </div>
        <p className="mt-4 text-xs leading-6 text-muted">{t("rotation.benefitsNote")} <a href="https://www.fao.org/family-farming/detail/en/c/1617788/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-content">{t("rotation.benefitsSource")}</a></p>
      </section>
      <section aria-labelledby="rotation-tool-help" className="mb-6 rounded-xl border border-emerald/20 bg-emerald/5 p-5 sm:p-6">
        <h2 id="rotation-tool-help" className="text-lg font-semibold text-content">{t("rotation.toolHelpTitle")}</h2>
        <p className="mt-2 max-w-4xl text-sm leading-7 text-muted">{t("rotation.toolHelpBody")}</p>
        <ol className="mt-4 grid gap-3 text-sm leading-6 text-content md:grid-cols-3">{t("rotation.simpleSteps").map((step, index) => <li key={step} className="flex items-start gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald text-xs font-medium text-white">{new Intl.NumberFormat(locale === "bn" ? "bn" : "en").format(index + 1)}</span><span>{step}</span></li>)}</ol>
        <p className="mt-4 text-xs leading-6 text-emerald-strong">{t("rotation.publicAccessNote")}</p>
      </section>
      <Suspense fallback={<p role="status">{t("common.loading")}</p>}><PublicRotationForm /></Suspense>
    </main>
    <PublicFooter />
  </div>;
}
