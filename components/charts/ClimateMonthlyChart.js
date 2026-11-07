"use client";

import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * ClimateMonthlyChart
 * Visualizes monthly normals (mean, median, percentiles) for rainfall or temperature.
 */
export function ClimateMonthlyChart({
  data = [],
  dataKey = "mean",
  medianKey = "median",
  unit = "mm",
  title = "Monthly Normals",
  showMedian = true,
  barColor = "var(--km-climate)",
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center text-sm text-muted">
        No observation series available
      </div>
    );
  }

  return (
    <div className="h-72 w-full" role="img" aria-label={title}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 12, bottom: 4, left: -4 }}>
          <defs>
            <linearGradient id="km-chart-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={barColor} stopOpacity={0.4} />
              <stop offset="100%" stopColor={barColor} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--km-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="monthLabel"
            tickLine={false}
            axisLine={{ stroke: "var(--km-border)" }}
            tick={{ fill: "var(--km-text-muted)", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--km-text-muted)", fontSize: 12 }}
            width={48}
            unit={` ${unit}`}
          />
          <Tooltip
            contentStyle={{
              background: "var(--km-surface)",
              border: "1px solid var(--km-border)",
              borderRadius: 10,
              color: "var(--km-text)",
              fontSize: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            labelStyle={{ color: "var(--km-text)", fontWeight: 600, marginBottom: 4 }}
            cursor={{ fill: "var(--km-surface-2)", opacity: 0.5 }}
            formatter={(val, name) => [`${val} ${unit}`, name]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            iconType="circle"
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            name={`Mean (${unit})`}
            fill="url(#km-chart-grad)"
            stroke={barColor}
            strokeWidth={2}
          />
          {showMedian && medianKey && (
            <Line
              type="monotone"
              dataKey={medianKey}
              name={`Median (${unit})`}
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: "#10b981" }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * TemperatureRangeChart
 * Visualizes TMAX, T2M (mean), and TMIN with diurnal range.
 */
export function TemperatureRangeChart({ data = [], title = "Monthly Temperature Range" }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center text-sm text-muted">
        No temperature series available
      </div>
    );
  }

  return (
    <div className="h-72 w-full" role="img" aria-label={title}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 12, bottom: 4, left: -4 }}>
          <CartesianGrid stroke="var(--km-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="monthLabel"
            tickLine={false}
            axisLine={{ stroke: "var(--km-border)" }}
            tick={{ fill: "var(--km-text-muted)", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--km-text-muted)", fontSize: 12 }}
            width={48}
            unit=" °C"
          />
          <Tooltip
            contentStyle={{
              background: "var(--km-surface)",
              border: "1px solid var(--km-border)",
              borderRadius: 10,
              color: "var(--km-text)",
              fontSize: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            labelStyle={{ color: "var(--km-text)", fontWeight: 600, marginBottom: 4 }}
            formatter={(val, name) => [`${val} °C`, name]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="tmax"
            name="Max Temp (TMAX)"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3, fill: "#ef4444" }}
          />
          <Line
            type="monotone"
            dataKey="t2m"
            name="Mean Temp (T2M)"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3, fill: "#f59e0b" }}
          />
          <Line
            type="monotone"
            dataKey="tmin"
            name="Min Temp (TMIN)"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3, fill: "#3b82f6" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
