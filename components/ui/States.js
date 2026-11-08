"use client";

import Link from "next/link";
import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { useLang } from "../../lib/i18n/LanguageContext.js";

/** Loading / empty / error / future-phase states — the only four allowed across the app. */

export function LoadingState({ className = "" }) {
  const { t } = useLang();
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-14 text-center ${className}`}>
      <Loader2 className="h-6 w-6 animate-spin text-emerald" strokeWidth={2} aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-content">{t("states.loadingTitle")}</p>
        <p className="mt-1 text-xs text-muted">{t("states.loadingBody")}</p>
      </div>
    </div>
  );
}

export function EmptyState({ title, body, className = "" }) {
  const { t } = useLang();
  return (
    <div className={`flex flex-col items-center justify-center gap-2 py-14 text-center ${className}`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface-2">
        <Inbox className="h-5 w-5 text-muted" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <p className="mt-2 text-sm font-medium text-content">{title || t("states.emptyTitle")}</p>
      <p className="max-w-sm text-xs text-muted leading-relaxed">{body || t("states.emptyBody")}</p>
    </div>
  );
}

export function ErrorState({ onRetry, className = "" }) {
  const { t } = useLang();
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-14 text-center ${className}`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-danger/20 bg-danger/10">
        <AlertTriangle className="h-5 w-5 text-danger" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-medium text-content">{t("states.errorTitle")}</p>
        <p className="mt-1 text-xs text-muted">{t("states.errorBody")}</p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-sm text-content transition-colors hover:bg-surface-2"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
          {t("states.retry")}
        </button>
      ) : null}
    </div>
  );
}

/**
 * PlaceholderScreen — used for screens that arrive in later phases.
 * Clearly states the phase so no one mistakes it for a working analyzer.
 */
export function PlaceholderScreen({ icon: Icon, title, message, phaseTag }) {
  const { t } = useLang();
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-surface-2 shadow-km-sm">
        <Icon className="h-6 w-6 text-emerald" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <div className="max-w-md">
        <h1 className="text-xl font-semibold text-content tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted leading-relaxed">{message}</p>
      </div>
      <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
        {phaseTag} · {t("states.placeholderNote")}
      </span>
      <Link
        href="/dashboard"
        className="mt-2 text-sm font-medium text-emerald underline-offset-4 hover:underline"
      >
        {t("common.backHome")}
      </Link>
    </div>
  );
}
