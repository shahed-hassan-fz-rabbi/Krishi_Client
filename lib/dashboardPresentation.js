/** Observation label only; never substitute today's year for missing dates. */
export function observationYear(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value)) return null;
  return Number.isNaN(Date.parse(value)) ? null : value.slice(0, 4);
}
