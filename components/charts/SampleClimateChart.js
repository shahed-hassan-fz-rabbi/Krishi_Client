"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/**
 * Sample monthly rainfall climatology shape for UI preview ONLY.
 * Will be replaced by /api/v1/climate/rainfall output in Phase 3.
 * The consuming card must always pair this with <SampleBadge/> + sampleNote.
 */
export const sampleMonthlyRainfall = [
  { month: "Jan", mm: 12 },
  { month: "Feb", mm: 23 },
  { month: "Mar", mm: 40 },
  { month: "Apr", mm: 118 },
  { month: "May", mm: 262 },
  { month: "Jun", mm: 542 },
  { month: "Jul", mm: 685 },
  { month: "Aug", mm: 611 },
  { month: "Sep", mm: 388 },
  { month: "Oct", mm: 158 },
  { month: "Nov", mm: 48 },
  { month: "Dec", mm: 10 },
];

export function SampleClimateChart({ data = sampleMonthlyRainfall, seriesLabel }) {
  return (
    <div className="h-64 w-full" role="img" aria-label={seriesLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="km-rain" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--km-climate)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--km-climate)" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--km-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={{ stroke: "var(--km-border)" }}
            tick={{ fill: "var(--km-text-muted)", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--km-text-muted)", fontSize: 12 }}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "var(--km-surface)",
              border: "1px solid var(--km-border)",
              borderRadius: 10,
              color: "var(--km-text)",
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--km-text-muted)" }}
            cursor={{ stroke: "var(--km-border)" }}
          />
          <Area
            type="monotone"
            dataKey="mm"
            name={seriesLabel}
            stroke="var(--km-climate)"
            strokeWidth={2}
            fill="url(#km-rain)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
