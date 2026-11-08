"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CloudRain,
  Database,
  Droplets,
  Globe,
  Leaf,
  Languages,
  MapPin,
  ShieldCheck,
  Sprout,
  Thermometer,
} from "lucide-react";

import { PublicHeader, PublicFooter } from "@/components/layout/PublicChrome.js";
import { Badge } from "@/components/ui/Badge.js";
import { Button } from "@/components/ui/Button.js";
import { Card, CardBody, CardHeader } from "@/components/ui/Card.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";

const HERO_SRC = "/images/hero.jpeg";

const featureItems = [
  { icon: CloudRain, titleKey: "featureRainfall", descKey: "featureRainfallDesc", tone: "climate" },
  { icon: Thermometer, titleKey: "featureTemp", descKey: "featureTempDesc", tone: "amber" },
  { icon: MapPin, titleKey: "featureDistrict", descKey: "featureDistrictDesc", tone: "emerald" },
  { icon: Database, titleKey: "featureEvidence", descKey: "featureEvidenceDesc", tone: "emerald" },
  { icon: Languages, titleKey: "featureLanguage", descKey: "featureLanguageDesc", tone: "neutral" },
  { icon: ShieldCheck, titleKey: "featureTransparency", descKey: "featureTransparencyDesc", tone: "emerald" },
];

const steps = [
  { n: "1", icon: MapPin, titleKey: "step1Title", descKey: "step1Desc" },
  { n: "2", icon: Database, titleKey: "step2Title", descKey: "step2Desc" },
  { n: "3", icon: BarChart3, titleKey: "step3Title", descKey: "step3Desc" },
  { n: "4", icon: Sprout, titleKey: "step4Title", descKey: "step4Desc" },
];

const datasets = [
  {
    name: "NASA POWER — Agroclimatology Daily",
    scope: "Daily rainfall, temperature, humidity, and solar radiation observations",
    status: "implemented",
  },
  { name: "SMAP SPL3SMP_E", scope: "Surface soil moisture", status: "planned" },
  { name: "GPM IMERG V07", scope: "High-resolution satellite precipitation", status: "planned" },
  { name: "MODIS MOD13Q1.061", scope: "NDVI / EVI vegetation indices", status: "planned" },
];

export default function LandingPage() {
  const { t, locale } = useLang();
  const { districts } = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero with background image */}
        <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden">
          {/* Background image with overlay */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-forest/95 via-forest/85 to-emerald/90 dark:from-forest/98 dark:via-forest/92 dark:to-emerald/95" />
            <img
              src={HERO_SRC}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>

          {/* Hero content overlay - centered */}
          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
            <Badge tone="sage" className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm">
              {t("landing.heroKicker")}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
              {t("landing.heroTitle")}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/95 sm:text-xl lg:text-2xl max-w-3xl mx-auto">
              {t("landing.heroSubtitle")}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <Button href="/dashboard" size="lg" className="bg-white text-forest hover:bg-white/90 px-8">
                {t("landing.heroCta")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                href="#how-it-works"
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 hover:border-white/60 px-8"
              >
                {t("landing.heroSecondary")}
              </Button>
            </div>
            <p className="mt-8 max-w-2xl mx-auto text-sm text-white/80 leading-relaxed">
              {t("landing.heroNote")}
            </p>
          </div>
        </section>

        {/* Supported districts */}
        <section className="border-b border-line bg-surface py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-emerald" aria-hidden="true" />
                <span className="text-sm font-medium text-muted">{t("landing.supportedDistricts")}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {districts.map((d) => (
                  <Badge key={d.code} tone="emerald">
                    {locale === "bn" ? d.nameBn || d.nameEn : d.nameEn}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-content sm:text-4xl">
              {t("landing.sectionFeatures")}
            </h2>
            <p className="mt-4 text-base text-muted sm:text-lg">{t("landing.sectionFeaturesSub")}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureItems.map((f) => (
              <Card key={f.titleKey} className="transition-shadow hover:shadow-km-md">
                <CardBody>
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border border-line ${
                      f.tone === "climate"
                        ? "bg-climate/10 text-climate"
                        : f.tone === "amber"
                          ? "bg-amber/10 text-amber-strong dark:text-amber"
                          : f.tone === "neutral"
                            ? "bg-surface-2 text-content"
                            : "bg-emerald/10 text-emerald-strong dark:text-emerald"
                    }`}
                  >
                    <f.icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-content">{t(f.titleKey)}</h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed">{t(f.descKey)}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 bg-surface py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-content sm:text-4xl">
                {t("landing.sectionHow")}
              </h2>
              <p className="mt-4 text-base text-muted sm:text-lg">{t("landing.sectionHowSub")}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <div key={s.n} className="relative">
                  <div className="rounded-xl border border-line bg-bg p-6 h-full">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald">
                        Step 0{s.n}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface shadow-km-sm">
                        <s.icon className="h-4.5 w-4.5 text-emerald" strokeWidth={1.8} aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-content mb-2">{t(s.titleKey)}</h3>
                    <p className="text-sm text-muted leading-relaxed">{t(s.descKey)}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-line -translate-y-1/2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Data sources */}
        <section id="data" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-content sm:text-4xl">
              {t("landing.sectionData")}
            </h2>
            <p className="mt-4 text-base text-muted sm:text-lg">{t("landing.sectionDataSub")}</p>
          </div>

          <Card className="max-w-3xl mx-auto">
            <CardHeader title={t("landing.dataStatusTitle")} className="mb-2" />
            <CardBody>
              <ul className="divide-y divide-line">
                {datasets.map((d) => (
                  <li key={d.name} className="flex flex-wrap items-center justify-between gap-2 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-content">{d.name}</p>
                      <p className="text-xs text-muted mt-0.5">{d.scope}</p>
                    </div>
                    <Badge tone={d.status === "implemented" ? "emerald" : "purple"}>
                      {d.status === "implemented" ? t("landing.statusImplemented") : t("landing.statusPlanned")}
                    </Badge>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-muted">{t("landing.nasaLstNote")}</p>
            </CardBody>
          </Card>
        </section>

        {/* About */}
        <section id="about" className="scroll-mt-20 bg-surface py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tight text-content sm:text-4xl">
                {t("landing.sectionAbout")}
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted sm:text-lg">
                {t("landing.sectionAboutBody")}
              </p>
              <div className="mt-8 flex items-center justify-center gap-4">
                <Button href="/dashboard" size="lg">
                  {t("landing.heroCta")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
