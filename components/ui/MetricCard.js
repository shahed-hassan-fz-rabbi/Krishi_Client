import { Card } from "./Card.js";

/**
 * MetricCard — key figure tiles for dashboard intelligence.
 * Value strings are formatted by the caller (backend/API later — never in UI logic
 * beyond presentation). `demo` renders the required Sample badge.
 */
export function MetricCard({
  icon: Icon = null,
  label,
  value,
  unit,
  hint,
  tone = "emerald", // emerald | climate | amber | purple
  demo = false,
  demoLabel,
  className = "",
}) {
  const iconWrap = {
    emerald: "bg-sage text-emerald dark:text-emerald",
    climate: "bg-climate/12 text-climate",
    amber: "bg-amber/12 text-amber",
    purple: "bg-purple/12 text-purple",
  }[tone];

  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {Icon ? (
            <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconWrap}`}>
              <Icon className="h-5 w-5" style={{ color: "currentColor" }} aria-hidden="true" />
            </span>
          ) : null}
          <p className="text-sm text-muted">{label}</p>
        </div>
        {demo ? <p className="text-[11px] font-medium text-amber">{demoLabel}</p> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-content">
        {value}
        {unit ? <span className="ml-1 text-base font-normal text-muted">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </Card>
  );
}
