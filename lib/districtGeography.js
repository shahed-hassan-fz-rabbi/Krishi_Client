/** Validate the configured map reference point for a supported district. */
export const PROJECT_DISTRICT_CODES = Object.freeze(["cumilla", "chattogram"]);

export function isProjectDistrictCode(districtCode) {
  return typeof districtCode === "string" && PROJECT_DISTRICT_CODES.includes(districtCode.trim().toLowerCase());
}

export function getDistrictReferencePoint(district) {
  const latitude = district?.latitude;
  const longitude = district?.longitude;
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }
  return { latitude, longitude, center: [latitude, longitude] };
}

export function getProjectDistricts(districts) {
  if (!Array.isArray(districts)) return [];
  return districts.filter((district) => isProjectDistrictCode(district?.code) && getDistrictReferencePoint(district));
}

export function resolveProjectDistrictCode(code, districts) {
  const supported = getProjectDistricts(districts);
  if (supported.some((district) => district.code === code)) return code;
  return supported.find((district) => district.isDefault)?.code || supported[0]?.code || null;
}
