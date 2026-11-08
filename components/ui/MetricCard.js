import { Card } from "./Card.js";

/**
 * MetricCard — key figure tiles for dashboard intelligence.
 * Standardized icon styling with WCAG-compliant semantic accents.
 */
export function MetricCard({
  icon: Icon = null,
  label,
  value,
  unit,
  hint,
  tone = "emerald", // emerald | climate | amber | purple | neutral
  demo = false,
  demoLabel,
  className = "",
}) {
  const iconWrap = {
    emerald: "bg-emerald/10 text-emerald-strong dark:text-emerald",
    climate: "bg-climate/10 text-climate-strong dark:text-climate",
    amber: "bg-amber/10 text-amber-strong dark:text-amber",
    purple: "bg-purple/10 text-purple-strong dark:text-purple",
    neutral: "bg-surface-2 text-muted",
  }[tone] || "bg-surface-2 text-muted";

  return (
    <Card className={`p-5 transition-shadow hover:shadow-km-md ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {Icon ? (
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconWrap}`}>
              <Icon className="h-4.5 w-4.5" strokeWidth={1.8} aria-hidden="true" />
            </span>
          ) : null}
          <p className="text-sm font-medium text-muted truncate">{label}</p>
        </div>
        {demo ? <p className="text-[11px] font-medium text-amber shrink-0">{demoLabel}</p> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-content">
        {value}
        {unit ? <span className="ml-1 text-base font-normal text-muted">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted leading-relaxed">{hint}</p> : null}
    </Card>
  );
}
