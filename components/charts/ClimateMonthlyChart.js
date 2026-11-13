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
  ReferenceArea,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartNoAxesCombined } from "lucide-react";

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
  meanLabel = `Mean (${unit})`,
  medianLabel = `Median (${unit})`,
  emptyMessage = "No observation series available",
  variant = "default",
  monsoonLabel = null,
}) {
  const isDashboard = variant === "dashboard" || variant === "compact";
  const isCompact = variant === "compact";
  const monsoonStart = data.find((row) => row.month === 6)?.monthLabel;
  const monsoonEnd = data.find((row) => row.month === 9)?.monthLabel;
  const showMonsoon = monsoonLabel && monsoonStart && monsoonEnd;

  if (!data || data.length === 0) {
    return (
      <div className={isDashboard
        ? "flex h-[300px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-surface-2/50 px-5 text-center text-sm text-muted"
        : "flex h-64 w-full items-center justify-center text-sm text-muted"}>
        {isDashboard && <ChartNoAxesCombined className="h-5 w-5 text-emerald" strokeWidth={1.8} aria-hidden="true" />}
        <span>{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className={isCompact ? "relative h-[240px] w-full" : isDashboard ? "relative h-[300px] w-full sm:h-[340px] xl:h-[360px]" : "relative h-72 w-full"} role="img" aria-label={showMonsoon ? `${title} · ${monsoonLabel}` : title}>
      {showMonsoon && <p className="absolute right-2 top-0 flex items-center gap-1.5 text-[11px] text-muted"><span className="h-2.5 w-3 rounded-sm bg-emerald/15" aria-hidden="true" />{monsoonLabel}</p>}
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={isDashboard ? { top: showMonsoon ? 30 : 16, right: 18, bottom: 8, left: 4 } : { top: 12, right: 12, bottom: 4, left: -4 }}>
          <defs>
            <linearGradient id="km-chart-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={barColor} stopOpacity={0.4} />
              <stop offset="100%" stopColor={barColor} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--km-border)" strokeDasharray="3 3" vertical={false} />
          {showMonsoon && <ReferenceArea x1={monsoonStart} x2={monsoonEnd} fill="var(--km-emerald)" fillOpacity={0.1} strokeOpacity={0} />}
          <XAxis
            dataKey="monthLabel"
            tickLine={false}
            axisLine={{ stroke: "var(--km-border)" }}
            tick={{ fill: "var(--km-text-muted)", fontSize: isDashboard ? 11 : 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--km-text-muted)", fontSize: 12 }}
            width={isDashboard ? 56 : 48}
            unit={` ${unit}`}
          />
          <Tooltip
            contentStyle={{
              background: "var(--km-surface)",
              border: "1px solid var(--km-border)",
              borderRadius: isDashboard ? 12 : 10,
              color: "var(--km-text)",
              fontSize: 12,
              boxShadow: isDashboard ? "var(--km-shadow-md)" : "0 4px 12px rgba(0,0,0,0.1)",
              ...(isDashboard ? { padding: "10px 12px" } : {}),
            }}
            labelStyle={{ color: "var(--km-text)", fontWeight: 600, marginBottom: 4 }}
            cursor={{ fill: "var(--km-surface-2)", opacity: 0.5 }}
            formatter={(val, name) => [`${val} ${unit}`, name]}
          />
          <Legend
            wrapperStyle={{ fontSize: isDashboard ? 11 : 12, paddingTop: isDashboard ? 12 : 8 }}
            iconType="circle"
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            name={meanLabel}
            fill="url(#km-chart-grad)"
            stroke={barColor}
            strokeWidth={2}
            dot={isDashboard ? { r: 2.5, fill: barColor, stroke: "var(--km-surface)", strokeWidth: 1.5 } : undefined}
            activeDot={isDashboard ? { r: 4, strokeWidth: 2, stroke: "var(--km-surface)" } : undefined}
          />
          {showMedian && medianKey && (
            <Line
              type="monotone"
              dataKey={medianKey}
            name={medianLabel}
              stroke={isDashboard ? "var(--km-emerald)" : "#10b981"}
              strokeWidth={isDashboard ? 2.25 : 2}
              strokeDasharray="4 4"
              dot={isDashboard
                ? { r: 2.5, fill: "var(--km-emerald)", stroke: "var(--km-surface)", strokeWidth: 1.5 }
                : { r: 3, fill: "#10b981" }}
              activeDot={isDashboard ? { r: 4, strokeWidth: 2, stroke: "var(--km-surface)" } : undefined}
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
export function TemperatureRangeChart({ data = [], title = "Monthly Temperature Range", highLabel = "Max Temp (TMAX)", meanLabel = "Mean Temp (T2M)", lowLabel = "Min Temp (TMIN)" }) {
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
            name={highLabel}
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3, fill: "#ef4444" }}
          />
          <Line
            type="monotone"
            dataKey="t2m"
            name={meanLabel}
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3, fill: "#f59e0b" }}
          />
          <Line
            type="monotone"
            dataKey="tmin"
            name={lowLabel}
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3, fill: "#3b82f6" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
