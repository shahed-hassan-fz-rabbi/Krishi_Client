/** Returns only valid numeric coordinates for a representative division point. */
export function getDivisionPoint(division) {
  const point = division?.representativePoint;
  const latitude = point?.latitude;
  const longitude = point?.longitude;

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
