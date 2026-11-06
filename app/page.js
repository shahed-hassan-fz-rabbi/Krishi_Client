"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CloudRain,
  Droplets,
  Leaf,
  Languages,
  ShieldCheck,
  Sprout,
} from "lucide-react";

import { PublicHeader, PublicFooter } from "@/components/layout/PublicChrome.js";
import { HeroMedia } from "@/components/landing/HeroMedia.js";
import { Badge } from "@/components/ui/Badge.js";
import { Button } from "@/components/ui/Button.js";
import { Card, CardBody, CardHeader } from "@/components/ui/Card.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";

const featureItems = [
  { icon: Sprout, tone: "emerald" },
  { icon: BarChart3, tone: "climate" },
  { icon: Droplets, tone: "climate" },
  { icon: Leaf, tone: "emerald" },
  { icon: Languages, tone: "purple" },
  { icon: ShieldCheck, tone: "amber" },
];

const highlightIcons = [ArrowRight, BarChart3, Droplets, Leaf];

const steps = [
  { n: "1", keyTitle: "step1Title", keyBody: "step1Body" },
  { n: "2", keyTitle: "step2Title", keyBody: "step2Body" },
  { n: "3", keyTitle: "step3Title", keyBody: "step3Body" },
];

const datasets = [
  {
    name: "NASA POWER — Agroclimatology Daily",
    scope: "Rainfall, temperatures, humidity, solar radiation",
    status: "implemented", // Phase 3
  },
  { name: "SMAP SPL3SMP_E", scope: "Surface soil moisture", status: "later" },
  { name: "GPM IMERG V07", scope: "High-resolution satellite precipitation", status: "later" },
  { name: "MODIS MOD13Q1.061", scope: "NDVI / EVI vegetation indices", status: "later" },
];

export default function LandingPage() {
  const { t } = useLang();

  const featureCopy = [
    [
      "Handoff Window Intelligence",
      "We compare what history says about sowing now, 7 days late, or 14 days late — with district-specific rainfall, temperature and humidity records.",
    ],
    [
      "Climate Intelligence",
      "Long-term temperature and humidity patterns from NASA POWER, presented with honest evidence coverage.",
    ],
    [
      "Soil Moisture Insights",
      "SMAP satellite soil moisture adds the surface-moisture story — always labeled as satellite estimates, never field measurements.",
    ],
    [
      "Vegetation Watch",
      "MODIS NDVI/EVI trends show how the landscape has been growing — vegetation indices inform, they do not measure yield.",
    ],
    [
      "English + Bangla",
      "Every calculated result is explained in simple Bengali and English — built for the people who actually read it.",
    ],
    [
      "Radical transparency",
      "Each number shows its dataset, period, and limitations. Insufficient evidence is stated as insufficient — never dressed up.",
    ],
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero — two-column with the user-provided photograph */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_80%_0%,var(--km-sage)_0%,transparent_70%)]"
          />
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Badge tone="blue" className="mb-5">
                {t("landing.heroKicker")}
              </Badge>
              <h1 className="max-w-xl text-4xl leading-tight font-bold tracking-tight text-content sm:text-5xl">
                {t("landing.heroTitle")}
              </h1>
              <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">{t("landing.heroSubtitle")}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button href="/dashboard" size="lg">
                  {t("landing.heroCta")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button href="#how-it-works" size="lg" variant="outline">
                  {t("landing.heroSecondary")}
                </Button>
              </div>
              <p className="mt-6 max-w-xl text-xs text-muted">{t("landing.heroNote")}</p>
            </div>
            <HeroMedia />
          </div>

          {/* Feature highlight strip */}
          <div className="border-y border-line bg-surface">
            <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:px-6 sm:grid-cols-2 lg:grid-cols-4">
              {t("landing.highlights").map((label, i) => {
                const Icon = highlightIcons[i] || Sprout;
                return (
                  <div key={label} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sage text-forest">
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-[10px] tracking-wide text-muted uppercase">
                        {t("landing.highlightsLabel")}
                      </p>
                      <p className="text-sm font-medium text-content">{label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
            {t("landing.sectionFeatures")}
          </h2>
          <p className="mt-2 text-sm text-muted sm:text-base">{t("landing.sectionFeaturesSub")}</p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featureItems.map((f, i) => (
              <Card key={featureCopy[i][0]} className="transition-shadow hover:shadow-km-md">
                <CardBody>
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      f.tone === "climate"
                        ? "bg-climate/12 text-climate"
                        : f.tone === "purple"
                          ? "bg-purple/12 text-purple"
                          : f.tone === "amber"
                            ? "bg-amber/12 text-amber"
                            : "bg-sage text-emerald"
                    }`}
                  >
                    <f.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-content">{featureCopy[i][0]}</h3>
                  <p className="mt-2 text-sm text-muted">{featureCopy[i][1]}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 bg-surface py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
              {t("landing.sectionHow")}
            </h2>
            <p className="mt-2 text-sm text-muted sm:text-base">{t("landing.sectionHowSub")}</p>

            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {steps.map((s) => (
                <li key={s.n} className="relative rounded-xl border border-line bg-bg p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald text-sm font-bold text-white">
                    {s.n}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-content">{t(`landing.${s.keyTitle}`)}</h3>
                  <p className="mt-2 text-sm text-muted">{t(`landing.${s.keyBody}`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Data sources */}
        <section id="data" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
            {t("landing.sectionData")}
          </h2>
          <p className="mt-2 text-sm text-muted sm:text-base">{t("landing.sectionDataSub")}</p>

          <Card className="mt-10">
            <CardHeader title={t("landing.dataStatusTitle")} className="mb-2" />
            <CardBody>
              <ul className="divide-y divide-line">
                {datasets.map((d) => (
                  <li key={d.name} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="text-sm font-medium text-content">{d.name}</p>
                      <p className="text-xs text-muted">{d.scope}</p>
                    </div>
                    <Badge tone={d.status === "implemented" ? "low" : "purple"}>
                      {d.status === "implemented" ? t("landing.statusImplemented") : t("landing.statusLaterPhase")}
                    </Badge>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted">{t("common.sampleNote")}</p>
            </CardBody>
          </Card>
        </section>

        {/* About */}
        <section id="about" className="scroll-mt-20 bg-surface py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
              {t("landing.sectionAbout")}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
              {t("landing.sectionAboutBody")}
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Button href="/dashboard">{t("landing.heroCta")}</Button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
