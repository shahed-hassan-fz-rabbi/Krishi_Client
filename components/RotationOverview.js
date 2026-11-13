import { ArrowRight, CalendarDays, Droplets, Leaf, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useLang } from "@/lib/i18n/LanguageContext.js";

const benefits = [
  { key: "soil", Icon: Leaf },
  { key: "pests", Icon: ShieldCheck },
  { key: "planning", Icon: Droplets },
];

export function RotationOverview({ publicMode }) {
  const { t, locale } = useLang();

  return <section className="space-y-6" aria-labelledby="rotation-page-title">
    <div className="overflow-hidden rounded-3xl border border-emerald/20 bg-surface shadow-km-sm">
      <div className="relative isolate grid min-h-[580px] gap-7 p-5 sm:min-h-[470px] sm:p-8 lg:min-h-[430px] lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.75fr)] lg:items-center lg:gap-10 lg:p-10">
        <Image src="/images/hero.png" alt="" fill priority sizes="(max-width: 1024px) 100vw, 80vw" className="-z-20 object-cover object-center" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950/75 via-slate-900/50 to-amber-950/20 dark:from-slate-950/85 dark:via-slate-900/65 dark:to-amber-950/30" />
        <div className="min-w-0 self-end lg:self-center">
          <h1 id="rotation-page-title" className="max-w-3xl break-words text-3xl font-bold leading-tight text-white drop-shadow sm:text-4xl lg:text-5xl">{t("rotation.simpleTitle")}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/95 drop-shadow-sm sm:text-base">{t("rotation.publicIntro")}</p>
        </div>
        <div className="min-w-0 self-start rounded-2xl border border-white/70 bg-white/90 p-5 text-slate-950 shadow-xl backdrop-blur-md sm:p-6 lg:self-center dark:border-white/25 dark:bg-slate-950/85 dark:text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200"><CalendarDays className="h-5 w-5" aria-hidden="true" /></span>
            <h2 className="text-base font-semibold sm:text-lg">{t("rotation.toolHelpTitle")}</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">{t("rotation.toolHelpBody")}</p>
          <p className="mt-4 border-t border-slate-200 pt-4 text-xs leading-6 text-slate-600 dark:border-white/15 dark:text-slate-300">{t(publicMode ? "rotation.publicAccessNote" : "rotation.privateAccessNote")}</p>
        </div>
      </div>

      <div className="grid gap-px bg-line md:grid-cols-3">
        {benefits.map(({ key, Icon }, index) => <article key={key} className="bg-surface p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald-strong"><Icon className="h-5 w-5" aria-hidden="true" /></span>
            <span className="text-xs font-semibold text-muted">{new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-GB", { minimumIntegerDigits: 2 }).format(index + 1)}</span>
          </div>
          <h3 className="mt-4 font-semibold text-content">{t(`rotation.benefits.${key}.title`)}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{t(`rotation.benefits.${key}.body`)}</p>
        </article>)}
      </div>
      <p className="border-t border-line px-5 py-4 text-xs leading-6 text-muted sm:px-6">
        {t("rotation.benefitsNote")} <a href="https://www.fao.org/family-farming/detail/en/c/1617788/" target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-strong underline underline-offset-2 hover:text-content">{t("rotation.benefitsSource")} <ArrowRight className="inline h-3 w-3" aria-hidden="true" /></a>
      </p>
    </div>

    <ol className="grid gap-3 sm:grid-cols-3" aria-label={t("rotation.stepsTitle")}>
      {t("rotation.simpleSteps").map((step, index) => <li key={step} className="flex min-w-0 items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-km-sm sm:p-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald text-sm font-semibold text-white">{new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-GB").format(index + 1)}</span>
        <span className="pt-1 text-sm leading-6 text-content">{step}</span>
      </li>)}
    </ol>
  </section>;
}
