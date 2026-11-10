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
  variant = "default",
}) {
  const isDashboard = variant === "dashboard";
  const cardClassName = isDashboard
    ? ["h-full overflow-hidden border-forest/10 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-km-md sm:p-6 dark:border-line", className].filter(Boolean).join(" ")
    : ["p-5 transition-shadow hover:shadow-km-md", className].filter(Boolean).join(" ");
  const iconWrap = {
    emerald: "bg-emerald/10 text-emerald-strong dark:text-emerald",
    climate: "bg-climate/10 text-climate-strong dark:text-climate",
    amber: "bg-amber/10 text-amber-strong dark:text-amber",
    purple: "bg-purple/10 text-purple-strong dark:text-purple",
    neutral: "bg-surface-2 text-muted",
  }[tone] || "bg-surface-2 text-muted";

  return (
    <Card className={cardClassName}>
      <div className={`flex ${isDashboard ? "flex-col items-start gap-4" : "items-start justify-between gap-3"}`}>
        <div className={`flex min-w-0 ${isDashboard ? "w-full items-center justify-between gap-3" : "items-center gap-3"}`}>
          {isDashboard && <p className="min-w-0 whitespace-normal text-sm font-semibold leading-snug text-muted">{label}</p>}
          {Icon ? (
            <span className={`flex ${isDashboard ? "h-10 w-10 rounded-xl bg-forest/8 text-forest dark:bg-emerald/15 dark:text-emerald" : "h-9 w-9 rounded-lg " + iconWrap} shrink-0 items-center justify-center`}>
              <Icon className={isDashboard ? "h-5 w-5" : "h-4.5 w-4.5"} strokeWidth={1.8} aria-hidden="true" />
            </span>
          ) : null}
          {!isDashboard && <p className="truncate text-sm font-medium text-muted">{label}</p>}
        </div>
        {demo ? <p className="text-[11px] font-medium text-amber shrink-0">{demoLabel}</p> : null}
      </div>
      <p className={`${isDashboard ? "mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-3xl font-semibold tracking-tight sm:text-4xl" : "mt-3 text-2xl font-semibold tracking-tight"} text-content`}>
        <span>{value}</span>
        {unit ? <span className={`${isDashboard ? "text-sm font-medium" : "ml-1 text-base font-normal"} text-muted`}>{unit}</span> : null}
      </p>
      {hint ? <p className={`mt-2 ${isDashboard ? "max-w-xs text-xs" : "text-xs"} leading-relaxed text-muted`}>{hint}</p> : null}
    </Card>
  );
}
