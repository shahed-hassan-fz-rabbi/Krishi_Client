/**
 * Krishi Mama — Frontend API Client.
 * Communicates with the Krishi Mama REST API (Node/Express backend).
 *
 * All endpoints use NEXT_PUBLIC_API_BASE_URL (defaults to http://localhost:5000/api/v1).
 * Never exposes private credentials or secrets.
 */

const DEFAULT_BASE_URL = "http://localhost:5000/api/v1";

export function getApiBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl && typeof envUrl === "string") {
    return envUrl.replace(/\/+$/, "");
  }
  return DEFAULT_BASE_URL;
}

/**
 * Robust fetch wrapper with timeout and error classification.
 */
async function request(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const timeoutMs = options.timeoutMs || 15000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      // Avoid Next.js caching issues for fresh data
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: json?.error || {
          message: `Server returned HTTP ${res.status}: ${res.statusText}`,
          code: `HTTP_${res.status}`,
        },
        status: res.status,
      };
    }

    return {
      success: true,
      data: json?.data ?? null,
      meta: json?.meta ?? null,
      status: res.status,
    };
  } catch (err) {
    clearTimeout(timeoutId);

    const isAbort = err.name === "AbortError";
    const message = isAbort
      ? `Request timed out after ${timeoutMs / 1000}s`
      : err.message || "Network request failed";

    return {
      success: false,
      error: {
        message,
        code: isAbort ? "REQUEST_TIMEOUT" : "NETWORK_ERROR",
      },
      status: 0,
    };
  }
}

/**
 * GET /api/v1/health
 * Liveness & readiness check, including database & dataset status.
 */
export async function fetchHealth() {
  return request("/health");
}

/**
 * GET /api/v1/districts
 * Returns enabled districts with exact coordinates and default flag.
 */
export async function fetchDistricts() {
  return request("/districts");
}

/**
 * GET /api/v1/climate/summary?district=chattogram[&from=YYYY-MM-DD&to=YYYY-MM-DD]
 * Multi-parameter climate summary across rainfall, temperatures, humidity, and solar radiation.
 */
export async function fetchClimateSummary(district = "chattogram", options = {}) {
  const params = new URLSearchParams({ district });
  if (options.from) params.set("from", options.from);
  if (options.to) params.set("to", options.to);

  return request(`/climate/summary?${params.toString()}`, { timeoutMs: 30000 });
}

/**
 * GET /api/v1/climate/rainfall?district=chattogram[&from=...&to=...&grouping=monthly|annual|seasonal|daily]
 * Aggregated rainfall series and historical normals.
 */
export async function fetchRainfall(district = "chattogram", options = {}) {
  const params = new URLSearchParams({ district });
  if (options.from) params.set("from", options.from);
  if (options.to) params.set("to", options.to);
  if (options.grouping) params.set("grouping", options.grouping);

  return request(`/climate/rainfall?${params.toString()}`, { timeoutMs: 30000 });
}

/**
 * GET /api/v1/climate/temperature?district=chattogram[&from=...&to=...&metric=t2m|tmax|tmin|all]
 * Aggregated temperature series and historical normals.
 */
export async function fetchTemperature(district = "chattogram", options = {}) {
  const params = new URLSearchParams({ district });
  if (options.from) params.set("from", options.from);
  if (options.to) params.set("to", options.to);
  if (options.metric) params.set("metric", options.metric);

  return request(`/climate/temperature?${params.toString()}`, { timeoutMs: 30000 });
}

/**
 * GET /api/v1/data-sources
 * Enriched dataset catalog with observation counts, verified coverage, and provenance.
 */
export async function fetchDataSources() {
  return request("/data-sources");
}

/**
 * POST /api/v1/auth/register
 * Register a new user with default role 'farmer'.
 */
export async function registerUser({ name, email, password, preferredDistrict }) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, preferredDistrict }),
  });
}

/**
 * POST /api/v1/auth/login
 * Log in with email and password, establishing an httpOnly session.
 */
export async function loginUser({ email, password }) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * GET /api/v1/auth/me
 * Retrieve the current authenticated user's session profile.
 */
export async function fetchCurrentUser() {
  return request("/auth/me");
}

/**
 * POST /api/v1/auth/logout
 * Log out and clear the session cookie.
 */
export async function logoutUser() {
  return request("/auth/logout", {
    method: "POST",
  });
}

/**
 * PATCH /api/v1/auth/profile
 * Update user preferences such as name or preferredDistrict.
 */
export async function updateUserProfile({ name, preferredDistrict }) {
  return request("/auth/profile", {
    method: "PATCH",
    body: JSON.stringify({ name, preferredDistrict }),
  });
}

/**
 * GET /api/v1/climate/handoff?district=cumilla&transition=aman-mustard
 * Retrieves crop handoff statistics, sowing opportunity, and period shift comparison.
 * The static snapshot is retained in public assets but disabled until its values
 * and provenance have been independently reviewed.
 */
export async function fetchHandoffAnalysis(
  district = "cumilla",
  transition = "aman-mustard",
  options = {}
) {
  // Fail closed: the bundled snapshot is not independently verified.
  if (options.forceSnapshot) {
    return {
      success: false,
      error: {
        message: "The bundled Handoff snapshot is disabled pending independent verification.",
        code: "UNVERIFIED_SNAPSHOT_DISABLED",
      },
      status: 0,
    };
  }

  const params = new URLSearchParams({ district, transition });
  const liveRes = await request(`/climate/handoff?${params.toString()}`, { timeoutMs: 35000 });

  if (liveRes.success) {
    return {
      ...liveRes,
      sourceMode: "live",
    };
  }

  return liveRes;
}

/**
 * GET /api/v1/soil-moisture/latest?district=cumilla
 * Fetches latest volumetric soil moisture from NASA SMAP.
 */
export async function fetchSoilMoistureLatest(district = "cumilla") {
  return request(`/soil-moisture/latest?district=${encodeURIComponent(district)}`);
}

/**
 * GET /api/v1/soil-moisture/history?district=cumilla&from=...&to=...
 * Fetches historical SMAP time-series and quality indicators.
 */
export async function fetchSoilMoistureHistory(district = "cumilla", from = "2024-01-01", to = "2024-12-31", quality = null) {
  const params = new URLSearchParams({ district, from, to });
  if (quality) {
    params.set("quality", quality);
  }
  return request(`/soil-moisture/history?${params.toString()}`);
}

/**
 * GET /api/v1/soil-moisture/status
 * Fetches SMAP ingestion and Earthdata connection status.
 */
export async function fetchSoilMoistureStatus() {
  return request("/soil-moisture/status");
}

/**
 * GET /api/v1/vegetation/latest?district=cumilla
 * Fetches latest 250m MODIS NDVI, EVI, and QA reliability.
 */
export async function fetchVegetationLatest(district = "cumilla") {
  return request(`/vegetation/latest?district=${encodeURIComponent(district)}`);
}

/**
 * GET /api/v1/vegetation/history?district=cumilla&from=...&to=...&quality=good
 * Fetches 16-day composite vegetation index time series.
 */
export async function fetchVegetationHistory(district = "cumilla", from = "2024-01-01", to = "2024-12-31", quality = null) {
  const params = new URLSearchParams({ district, from, to });
  if (quality) {
    params.set("quality", quality);
  }
  return request(`/vegetation/history?${params.toString()}`);
}

/**
 * GET /api/v1/vegetation/status
 * Fetches MODIS ingestion and AppEEARS connection status.
 */
export async function fetchVegetationStatus() {
  return request("/vegetation/status");
}

/**
 * GET /api/v1/gis/districts
 * Fetches available GIS districts and spatial bounding boxes.
 */
export async function fetchGisDistricts() {
  return request("/gis/districts");
}

/**
 * GET /api/v1/gis/boundaries?district=...
 * Fetches official BBS 2020 Admin-2 GeoJSON boundary polygons.
 */
export async function fetchGisBoundaries(district = null) {
  const query = district ? `?district=${encodeURIComponent(district)}` : "";
  return request(`/gis/boundaries${query}`);
}

/**
 * GET /api/v1/gis/layers?district=...
 * Fetches multi-sensor geospatial observation pins, footprint circles, and metadata.
 */
export async function fetchGisLayers(district = "cumilla") {
  return request(`/gis/layers?district=${encodeURIComponent(district)}`);
}

/**
 * GET /api/v1/crop-calendar/crops
 * Fetches list of supported crops and seasons.
 */
export async function fetchCropList() {
  return request("/crop-calendar/crops");
}

/**
 * GET /api/v1/crop-calendar?district=...&crop=...&season=...
 * Fetches official BAMIS/DAE crop calendars and phenological stages.
 */
export async function fetchCropCalendars(district = "cumilla", crop = null, season = null) {
  const params = new URLSearchParams({ district });
  if (crop) params.set("crop", crop);
  if (season) params.set("season", season);
  return request(`/crop-calendar?${params.toString()}`);
}

/**
 * GET /api/v1/crop-calendar/alignment?district=...&crop=...
 * Fetches live alignment of official crop calendar with NASA satellite indicators.
 */
export async function fetchCropCalendarAlignment(district = "cumilla", crop = "monsoon_aman") {
  const params = new URLSearchParams({ district, crop });
  return request(`/crop-calendar/alignment?${params.toString()}`);
}
