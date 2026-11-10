const allowedPowerProvenance = new Set(["HISTORICAL_DATABASE", "CACHED", "SNAPSHOT"]);

export function getDistrictValidCoverage(source, districtCode) {
  if (!source || !districtCode) return null;
  return source.districtValidCoverage?.[districtCode] || null;
}

export function responseBelongsToDistrict(responseData, districtCode) {
  return Boolean(districtCode && responseData?.districtCode?.toLowerCase?.() === districtCode.toLowerCase());
}

export function isSupportedPowerProvenance(provenance) {
  return allowedPowerProvenance.has(provenance);
}

export function getCompleteGpmDailyTotal(summary) {
  if (
    summary?.completeness !== "complete" ||
    summary?.expectedIntervals !== 48 ||
    summary?.observedIntervals !== 48 ||
    summary?.validIntervals !== 48 ||
    !Number.isFinite(summary?.totalPrecipitationMm)
  ) return null;
  return summary.totalPrecipitationMm;
}

export function getRecommendedSmapValue(observation) {
  if (observation?.isRecommendedQuality !== true || ![0, 8].includes(observation.retrievalQualityFlag)) return null;
  return Number.isFinite(observation.soilMoisture) && observation.soilMoisture >= 0 && observation.soilMoisture <= 1
    ? observation.soilMoisture : null;
}

export function getReliableModisIndices(observation) {
  if (observation?.isReliableQuality !== true || observation.pixelReliability !== 0) return null;
  const ndvi = Number.isFinite(observation.ndvi) && observation.ndvi >= -0.2 && observation.ndvi <= 1 ? observation.ndvi : null;
  const evi = Number.isFinite(observation.evi) && observation.evi >= -0.2 && observation.evi <= 1 ? observation.evi : null;
  return ndvi === null && evi === null ? null : { ndvi, evi };
}
