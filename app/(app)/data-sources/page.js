"use client";

import { useEffect, useState } from "react";
import {
  CalendarRange,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  Globe,
  Layers,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge.js";
import { Card, CardBody, CardHeader } from "@/components/ui/Card.js";
import { ErrorState, LoadingState } from "@/components/ui/States.js";
import { Table, TBody, TD, THead, TR } from "@/components/ui/Table.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import { fetchDataSources } from "@/services/api.js";

const PLANNED_DATASETS = [
  {
    name: "GPM IMERG V07 (Final Run)",
    provider: "NASA Goddard Space Flight Center / JAXA",
    scope: "High-resolution satellite precipitation (0.1° × 0.1° gridded)",
    purpose: "Fine-grained precipitation and dry spell validation",
    status: "Planned (Phase 4)",
  },
  {
    name: "SMAP SPL3SMP_E V006",
    provider: "NASA Jet Propulsion Laboratory (JPL)",
    scope: "Enhanced surface soil moisture (9 km gridded)",
    purpose: "Surface soil moisture context; not root-zone moisture or a field measurement.",
    status: "Planned (Phase 4)",
  },
  {
    name: "MODIS MOD13Q1.061",
    provider: "NASA LP DAAC / USGS EROS",
    scope: "16-day composite vegetation indices (NDVI / EVI, 250 m)",
    purpose: "Crop canopy vigor, greenness tracking, and vegetative stage monitoring",
    status: "Planned (Phase 4)",
  },
];

export default function DataSourcesPage() {
  const { t } = useLang();
  const [datasets, setDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toISOString().slice(0, 10);
  };

  const loadDataSources = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchDataSources();
      if (res.success && Array.isArray(res.data)) {
        setDatasets(res.data);
      } else {
        setError(res.error?.message || "Failed to load dataset catalogue");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDataSources();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge tone="emerald">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            NASA Earth Science
          </Badge>
          <span className="text-xs text-muted">Provenance Standard: LST</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
          {t("dataSources.title")}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          {t("dataSources.subtitle")}
        </p>
      </header>

      {/* Loading state */}
      {isLoading && (
        <Card>
          <CardBody>
            <LoadingState />
          </CardBody>
        </Card>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <Card>
          <CardBody>
            <ErrorState onRetry={loadDataSources} />
            <p className="mt-2 text-center text-xs text-danger">{error}</p>
          </CardBody>
        </Card>
      )}

      {/* Active Datasets */}
      {!isLoading && datasets.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-content flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald" aria-hidden="true" />
            {t("dataSources.activeTitle")}
          </h2>

          {datasets.map((ds) => (
            <Card key={ds.datasetKey} className="border-emerald/20">
              <CardHeader
                title={ds.product}
                description={ds.provider}
                action={
                  <Badge tone="emerald">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("dataSources.activeDatasetBadge")}
                  </Badge>
                }
              />
              <CardBody className="space-y-6">
                {/* Key metadata grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-surface-2 p-3">
                    <p className="text-xs text-muted flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-emerald" />
                      {t("dataSources.observationCount")}
                    </p>
                    <p className="text-lg font-bold text-content mt-1">
                      {Number.isFinite(ds.observationCount) ? ds.observationCount.toLocaleString() : "—"}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {t("dataSources.lastVerified")}: {formatDate(ds.coverage?.lastVerifiedAt)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-surface-2 p-3">
                    <p className="text-xs text-muted flex items-center gap-1.5">
                      <CalendarRange className="h-3.5 w-3.5 text-climate" />
                      {t("dataSources.coveragePeriod")}
                    </p>
                    <p className="text-lg font-bold text-content mt-1">
                      {formatDate(ds.coverage?.firstObservedDate)} – {formatDate(ds.coverage?.lastObservedDate)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-surface-2 p-3">
                    <p className="text-xs text-muted flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber" />
                      {t("dataSources.timeStandard")}
                    </p>
                    <p className="text-lg font-bold text-content mt-1">{ds.timeStandard || "—"}</p>
                    <p className="text-xs text-muted mt-0.5">Local Solar Time</p>
                  </div>

                  <div className="rounded-lg bg-surface-2 p-3">
                    <p className="text-xs text-muted flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-purple" />
                      {t("dataSources.spatialResolution")}
                    </p>
                    <p className="text-lg font-bold text-content mt-1">
                      {ds.spatialResolutionNote || "—"}
                    </p>
                  </div>
                </div>

                {/* Parameters table */}
                <div>
                  <h3 className="text-sm font-semibold text-content mb-3">
                    {t("dataSources.parameters")}
                  </h3>
                  <Table>
                    <THead columns={["Code", "Description", "Unit", "Temporal Resolution"]} />
                    <TBody>
                      {Object.entries(ds.parameters || {}).map(([paramCode, info]) => (
                        <TR key={paramCode}>
                          <TD className="font-mono text-xs font-semibold text-emerald">
                            {paramCode}
                          </TD>
                          <TD className="text-content text-sm">{info.longName}</TD>
                          <TD className="text-muted text-sm font-mono">{info.unit}</TD>
                          <TD className="text-muted text-sm">Daily (LST)</TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>

                {/* Time standard disclosure notice */}
                <div className="rounded-xl border border-line bg-surface-2 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-content font-medium text-sm">
                    <Clock className="h-4 w-4 text-climate" />
                    {t("dataSources.disclosureTitle")}
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    {ds.timeStandardDisclosure}
                  </p>
                </div>

                {/* Official source links */}
                {ds.sourceUrls && ds.sourceUrls.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-content uppercase tracking-wider mb-2">
                      {t("dataSources.sources")}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {ds.sourceUrls.map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-content hover:bg-surface-2 transition-colors"
                        >
                          <span className="font-mono">{url}</span>
                          <ExternalLink className="h-3 w-3 text-muted" aria-hidden="true" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </section>
      )}

      {/* Planned Datasets */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-content flex items-center gap-2">
          <Layers className="h-5 w-5 text-purple" aria-hidden="true" />
          {t("dataSources.plannedTitle")}
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {PLANNED_DATASETS.map((p) => (
            <Card key={p.name}>
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-content">{p.name}</h3>
                  <Badge tone="purple" className="shrink-0 text-xs">
                    {p.status}
                  </Badge>
                </div>
                <p className="text-xs text-emerald font-medium">{p.provider}</p>
                <p className="text-xs text-muted leading-relaxed">{p.scope}</p>
                <div className="pt-2 border-t border-line">
                  <p className="text-xs font-medium text-content">Agricultural purpose:</p>
                  <p className="text-xs text-muted mt-0.5">{p.purpose}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* Transparency and Scientific Notice */}
      <section>
        <Card className="border-amber/20 bg-amber/5">
          <CardBody className="flex items-start gap-3 p-5">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-semibold text-content">
                {t("dataSources.limitationsTitle")}
              </h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                {t("dataSources.limitationsBody")}
              </p>
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
