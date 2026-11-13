"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * HandoffSowingChart
 * Visualizes the historical distribution of:
 * 1. Sowing Window Dry Days (window comes from the transition config)
 * 2. Longest Consecutive Dry Run (workability window)
 * 3. Workability Threshold (>= minConsecutiveDryDays consecutive dry days)
 *
 * expectedDays is the expected number of sowing-window calendar days from the
 * backend config; when unavailable no day-count total is invented and the
 * y-domain falls back to the data range.
 *
 * fmt optionally localizes every rendered number (Bengali digits in Bangla);
 * phrases below use the labels.* overrides so tooltips stay in-language.
 */
export function HandoffSowingChart({
  data = [],
  title = "Historical Sowing Opportunity Climatology",
  minConsecutiveDryDays = null,
  expectedDays = null,
  fmt = null,
  labels = {
    dryDays: "Dry Days",
    dryRun: "Max Consecutive Dry Run (days)",
    threshold: null,
    rain: "Sowing Rain",
    daysUnit: " d",
    tooltipDays: "days",
    tooltipConsecutive: "consecutive days",
    tooltipSeasonYear: "Season Year:",
  },
}) {
  const num = (v) => (typeof fmt === "function" ? fmt(v) : String(v));
  const daysUnit = labels.daysUnit ?? "d";
  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 w-full items-center justify-center text-sm text-muted">
        No climatology series available
      </div>
    );
  }

  const hasThreshold = Number.isFinite(Number(minConsecutiveDryDays))
    && minConsecutiveDryDays !== null;

  return (
    <div className="w-full" role="img" aria-label={title}>
      {hasThreshold && labels.threshold && <p className="mb-3 flex items-center gap-2 text-xs leading-6 text-muted"><span className="w-6 shrink-0 border-t-2 border-dashed border-amber-500" aria-hidden="true" />{labels.threshold}</p>}
      <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: -8 }}>
          <CartesianGrid stroke="var(--km-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={{ stroke: "var(--km-border)" }}
            tick={{ fill: "var(--km-text-muted)", fontSize: 11 }}
            tickFormatter={(y) => num(y)}
            interval={1}
          />
          <YAxis
            domain={[0, expectedDays ?? "auto"]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--km-text-muted)", fontSize: 11 }}
            width={36}
            tickFormatter={(v) => `${num(v)}\u00A0${daysUnit}`}
          />
          <Tooltip
            contentStyle={{
              background: "var(--km-surface)",
              border: "1px solid var(--km-border)",
              borderRadius: 10,
              color: "var(--km-text)",
              fontSize: 12,
              boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
            }}
            formatter={(value, name) => {
              if (name === labels.dryDays) {
                return [`${num(value)}${expectedDays ? ` / ${num(expectedDays)}` : ""} ${labels.tooltipDays}`, name];
              }
              if (name === labels.dryRun) return [`${num(value)} ${labels.tooltipConsecutive}`, name];
              return [`${num(value)}`, name];
            }}
            labelFormatter={(label) => `${labels.tooltipSeasonYear} ${num(label)}`}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
            iconType="circle"
            // Series-colored legend text (#0284c7 / #10b981) fails 4.5:1 on
            // light backgrounds; keep the series color on the dot, darken text.
            formatter={(value) => (
              <span style={{ color: "var(--km-text-muted)" }}>{value}</span>
            )}
          />
          {hasThreshold ? (
            <ReferenceLine
              y={minConsecutiveDryDays}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1.5}

            />
          ) : null}
          <Bar
            dataKey="dry_days_sowing"
            name={labels.dryDays}
            fill="#0284c7"
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
          />
          <Line
            type="monotone"
            dataKey="max_dry_run"
            name={labels.dryRun}
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#10b981" }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
