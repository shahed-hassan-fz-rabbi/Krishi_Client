/** Describe monthly observations; never infer forecasts or crop suitability. */
export function observedTemperature(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= -50 && value <= 60 ? value : null;
}

export function summarizeMonthlyTemperature(monthly = {}) {
  const available = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const row = monthly?.[String(month)];
    const value = observedTemperature(row?.stats?.mean);
    return value !== null && Number.isFinite(row?.years_used) && row.years_used > 0 ? { month, value } : null;
  }).filter(Boolean);
  if (!available.length) return { monthsAvailable: 0, complete: false, warmest: null, coolest: null };
  const high = Math.max(...available.map((row) => row.value));
  const low = Math.min(...available.map((row) => row.value));
  return {
    monthsAvailable: available.length,
    complete: available.length === 12,
    warmest: { value: high, months: available.filter((row) => row.value === high).map((row) => row.month) },
    coolest: { value: low, months: available.filter((row) => row.value === low).map((row) => row.month) },
  };
}

export function rotationLinkForDistrict(district) {
  return ["cumilla", "chattogram"].includes(district) ? `/crop-rotation?district=${district}` : "/crop-rotation";
}

export function resolveRotationDistrict(requested, selected) {
  if (["cumilla", "chattogram"].includes(requested)) return requested;
  return ["cumilla", "chattogram"].includes(selected) ? selected : "cumilla";
}

export function resolveRotationPriority(requested) {
  return ["water", "diversity", "calendar"].includes(requested) ? requested : "water";
}

export function fillClimateText(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => String(values[key] ?? match));
}
