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
 * Visualizes the 25-year historical distribution of:
 * 1. Sowing Window Dry Days (Nov 1–20)
 * 2. Longest Consecutive Dry Run (workability window)
 * 3. Workability Threshold (≥ 5 consecutive dry days)
 */
export function HandoffSowingChart({
  data = [],
  title = "25-Year Sowing Opportunity Climatology",
  minConsecutiveDryDays = 5,
  labels = {
    dryDays: "Dry Days (Nov 1–20)",
    dryRun: "Max Consecutive Dry Run (days)",
    threshold: "Workable Threshold (≥5d)",
    rain: "Sowing Rain",
  },
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 w-full items-center justify-center text-sm text-muted">
        No climatology series available
      </div>
    );
  }

  return (
    <div className="h-80 w-full" role="img" aria-label={title}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: -8 }}>
          <CartesianGrid stroke="var(--km-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={{ stroke: "var(--km-border)" }}
            tick={{ fill: "var(--km-text-muted)", fontSize: 11 }}
            interval={1}
          />
          <YAxis
            domain={[0, 20]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--km-text-muted)", fontSize: 11 }}
            width={36}
            unit=" d"
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
              if (name === labels.dryDays) return [`${value} / 20 days`, name];
              if (name === labels.dryRun) return [`${value} consecutive days`, name];
              return [`${value}`, name];
            }}
            labelFormatter={(label) => `Season Year: ${label}`}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
            iconType="circle"
          />
          <ReferenceLine
            y={minConsecutiveDryDays}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: labels.threshold,
              fill: "#d97706",
              fontSize: 11,
              position: "insideTopLeft",
            }}
          />
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
  );
}
