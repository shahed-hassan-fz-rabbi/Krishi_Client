/** Risk / status badges. Colors map to approved palette; never decorative-only. */

const toneClasses = {
  // Text tones use *-strong variants: the raw brand amber/danger/purple fail
  // WCAG AA (4.5:1) as text on light surfaces. The *-strong tokens flip to the
  // brighter brand color in dark mode, so one class works in both themes.
  // dark: sage text on the dark sage bg would be invisible → use content color
  low: "bg-sage text-forest dark:text-content", // soft green chip
  emerald: "bg-emerald/15 text-emerald-text",
  moderate: "bg-amber/15 text-amber-strong",
  high: "bg-danger/12 text-danger-strong",
  purple: "bg-purple/15 text-purple-strong",
  blue: "bg-climate/12 text-climate-text",
  neutral: "bg-surface-2 text-muted",
  outline: "border border-line text-muted",
  sage: "bg-sage/20 text-forest dark:text-content",
};

export function Badge({ tone = "neutral", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * RiskBadge — reserved for the handoff engine's deterministic risk levels.
 * tone: low | moderate | high | insufficient (insufficient = "not enough evidence")
 */
export function RiskBadge({ level = "insufficient", label }) {
  const map = {
    low: { tone: "low", dot: "bg-emerald" },
    moderate: { tone: "moderate", dot: "bg-amber" },
    high: { tone: "high", dot: "bg-danger" },
    insufficient: { tone: "neutral", dot: "bg-muted" },
  };
  const { tone, dot } = map[level] || map.insufficient;
  return (
    <Badge tone={tone}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </Badge>
  );
}

/** SampleBadge — REQUIRED on any card backed by demo data until NASA integration. */
export function SampleBadge({ label }) {
  return (
    <Badge tone="amber" className="border border-amber/30">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
        <circle cx="5" cy="9" r="1" />
        <rect x="4" y="1" width="2" height="6" rx="1" />
      </svg>
      {label}
    </Badge>
  );
}
