/**
 * Krishi Mama — Frontend API Client.
 * Communicates with the Krishi Mama REST API (Node/Express backend).
 *
 * All endpoints use NEXT_PUBLIC_API_BASE_URL (defaults to http://localhost:5000/api/v1).
 * Never exposes private credentials or secrets.
 */

const DEFAULT_BASE_URL = "http://localhost:5000/api/v1";

export function compareCropRotations(input) {
  return request("/rotations/compare", { method: "POST", body: JSON.stringify(input) });
}
export function previewCropRotations(input) {
  return request("/rotations/preview", { method: "POST", body: JSON.stringify(input) });
}
export function saveRotationPlan(payload) {
  return request("/rotations/plans", { method: "POST", body: JSON.stringify(payload) });
}
export function fetchRotationPlans() { return request("/rotations/plans"); }
export function explainRotationResult(payload) {
  return request("/rotations/explain", { method: "POST", body: JSON.stringify(payload), timeoutMs: 16000 });
}

export function getApiBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  let url = (envUrl && typeof envUrl === "string" ? envUrl : DEFAULT_BASE_URL).replace(/\/+$/, "");
  if (typeof window !== "undefined") {
    if (window.location.hostname === "127.0.0.1" && url.includes("localhost")) {
      url = url.replace("localhost", "127.0.0.1");
    } else if (window.location.hostname === "localhost" && url.includes("127.0.0.1")) {
      url = url.replace("127.0.0.1", "localhost");
    }
  }
  return url;
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

/** BBS-derived representative Bangladesh administrative division points. */
export async function fetchDivisions() {
  return request("/divisions");
}

/** Four-dataset division view; NASA credentials remain on the server. */
export async function fetchDivisionIntelligence(division) {
  return request(`/divisions/intelligence?division=${encodeURIComponent(division)}`, { timeoutMs: 130000 });
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

/** Latest stored daily NASA POWER observations; historical records are not forecasts. */
export async function fetchClimateLatest(district = "cumilla") {
  return request(`/climate/latest?district=${encodeURIComponent(district)}`);
}

/** Latest GPM IMERG Final V07 half-hourly record and validated local-day summary. */
export async function fetchPrecipitationLatest(district = "cumilla") {
  return request(`/precipitation/latest?district=${encodeURIComponent(district)}`);
}

/** Cross-dataset availability, observation coverage and ingestion provenance. */
export async function fetchEnvironmentalDataSources() {
  return request("/data-sources");
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
 * GET /api/v1/auth/google/status
 * Check if Google OAuth 2.0 is configured on backend.
 */
export async function fetchGoogleAuthStatus() {
  return request("/auth/google/status");
}

/**
 * Returns the backend Google OAuth initiation URL.
 */
export function getGoogleAuthEndpoint() {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/auth/google`;
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

/**
 * POST /api/v1/assistant/chat
 * Sends a natural language query to the Krishi Mama AI Assistant.
 * Grounded in NASA satellite observations and official crop calendar matrices.
 */
export async function sendAssistantMessage({ message, district = "cumilla", crop = null, farmId = null, conversationId = null }) {
  return request("/assistant/chat", {
    method: "POST",
    body: JSON.stringify({ message, district, crop, farmId, conversationId }),
    timeoutMs: 35000,
  });
}

/**
 * GET /api/v1/assistant/conversations
 * Fetches the authenticated user's conversation history list.
 */
export async function fetchAssistantConversations() {
  return request("/assistant/conversations");
}

/**
 * GET /api/v1/assistant/conversations/:id
 * Fetches a specific conversation with all message turns.
 */
export async function fetchAssistantConversation(id) {
  return request(`/assistant/conversations/${encodeURIComponent(id)}`);
}

/**
 * PATCH /api/v1/assistant/conversations/:id
 * Renames an existing conversation title.
 */
export async function renameAssistantConversation(id, title) {
  return request(`/assistant/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

/**
 * DELETE /api/v1/assistant/conversations/:id
 * Deletes a conversation by ID.
 */
export async function deleteAssistantConversation(id) {
  return request(`/assistant/conversations/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/**
 * ============================================================================
 * MY FARM — SMART CROP LIFECYCLE MANAGEMENT API
 * ============================================================================
 */

/**
 * GET /api/v1/farms
 * Fetches all farms belonging to the authenticated user.
 */
export async function fetchFarms(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return request(`/farms${qs}`);
}

/**
 * GET /api/v1/farms/:id
 * Fetches single farm details with official crop phenology and satellite context.
 */
export async function fetchFarmById(id) {
  return request(`/farms/${encodeURIComponent(id)}`);
}

/**
 * POST /api/v1/farms
 * Creates a new farm belonging to the authenticated user.
 */
export async function createFarm(payload) {
  return request("/farms", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * PATCH /api/v1/farms/:id
 * Updates an existing farm document.
 */
export async function updateFarm(id, payload) {
  return request(`/farms/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE /api/v1/farms/:id
 * Deletes a farm belonging to the authenticated user.
 */
export async function deleteFarm(id) {
  return request(`/farms/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/**
 * ============================================================================
 * CROP LIFECYCLE TEMPLATE ENGINE API
 * ============================================================================
 */

/**
 * GET /api/v1/farms/:id/lifecycle
 * Fetches structured lifecycle timeline for a specific farm.
 */
export async function fetchFarmLifecycle(farmId, options = {}) {
  const query = new URLSearchParams();
  if (options.asOfDate) query.set("asOfDate", options.asOfDate);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return request(`/farms/${encodeURIComponent(farmId)}/lifecycle${qs}`);
}

/**
 * POST /api/v1/farms/:id/lifecycle/refresh
 * Re-evaluates lifecycle and synchronizes current stage in the database.
 */
export async function refreshFarmLifecycle(farmId) {
  return request(`/farms/${encodeURIComponent(farmId)}/lifecycle/refresh`, {
    method: "POST",
  });
}

/**
 * GET /api/v1/crop-lifecycle/templates
 * Fetches all supported crop lifecycle templates.
 */
export async function fetchCropLifecycleTemplates() {
  return request("/crop-lifecycle/templates");
}

/**
 * GET /api/v1/crop-lifecycle/templates/:cropCode?district=cumilla
 * Fetches template specifications for a specific crop and optional district.
 */
export async function fetchCropLifecycleTemplate(cropCode, district = null) {
  const query = district ? `?district=${encodeURIComponent(district)}` : "";
  return request(`/crop-lifecycle/templates/${encodeURIComponent(cropCode)}${query}`);
}

/**
 * POST /api/v1/crop-planning/recommendations
 * Evaluates suitable crops and generates AI-assisted planning recommendations.
 */
export async function fetchCropPlanningRecommendations(payload) {
  return request("/crop-planning/recommendations", {
    method: "POST",
    body: JSON.stringify(payload),
    timeoutMs: 45000,
  });
}

/**
 * GET /api/v1/farms/:id/environment
 * Fetches NASA Environmental Intelligence for a specific farm.
 */
export async function fetchFarmEnvironment(farmId) {
  return request(`/farms/${encodeURIComponent(farmId)}/environment`);
}

/**
 * GET /api/v1/farms/:id/activities
 * Fetches activities for a farm with optional query filters.
 */
export async function fetchFarmActivities(farmId, params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.stageCode) query.set("stageCode", params.stageCode);
  if (params.activityType) query.set("activityType", params.activityType);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return request(`/farms/${encodeURIComponent(farmId)}/activities${qs}`);
}

/**
 * GET /api/v1/farms/:id/activities/:activityId
 */
export async function fetchSingleFarmActivity(farmId, activityId) {
  return request(`/farms/${encodeURIComponent(farmId)}/activities/${encodeURIComponent(activityId)}`);
}

/**
 * POST /api/v1/farms/:id/activities
 * Creates a custom farm activity.
 */
export async function createFarmActivity(farmId, activityData) {
  return request(`/farms/${encodeURIComponent(farmId)}/activities`, {
    method: "POST",
    body: JSON.stringify(activityData),
  });
}

/**
 * PATCH /api/v1/farms/:id/activities/:activityId
 * Updates activity status, note, or rescheduled date.
 */
export async function updateFarmActivity(farmId, activityId, updateData) {
  return request(`/farms/${encodeURIComponent(farmId)}/activities/${encodeURIComponent(activityId)}`, {
    method: "PATCH",
    body: JSON.stringify(updateData),
  });
}

/**
 * DELETE /api/v1/farms/:id/activities/:activityId
 * Deletes a custom farmer-created activity.
 */
export async function deleteFarmActivity(farmId, activityId) {
  return request(`/farms/${encodeURIComponent(farmId)}/activities/${encodeURIComponent(activityId)}`, {
    method: "DELETE",
  });
}

/**
 * POST /api/v1/farms/:id/activities/generate
 * Generates official template activities for the farm.
 */
export async function generateFarmActivities(farmId) {
  return request(`/farms/${encodeURIComponent(farmId)}/activities/generate`, {
    method: "POST",
  });
}

/**
 * GET /api/v1/farms/activities/overview
 * Fetches user-wide activity overview for the My Farm dashboard.
 */
export async function fetchActivitiesOverview() {
  return request("/farms/activities/overview");
}

/**
 * GET /api/v1/farms/activities/notifications-readiness
 */
export async function fetchActivitiesNotificationReadiness() {
  return request("/farms/activities/notifications-readiness");
}

/**
 * ============================================================================
 * SMART FARM NOTIFICATIONS API
 * ============================================================================
 */

/**
 * GET /api/v1/notifications
 */
export async function fetchNotifications(params = {}) {
  const query = new URLSearchParams();
  if (params.unreadOnly) query.set("unreadOnly", "true");
  if (params.farmId) query.set("farmId", params.farmId);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));
  const qs = query.toString() ? `?${query.toString()}` : "";
  return request(`/notifications${qs}`);
}

/**
 * GET /api/v1/notifications/unread-count
 */
export async function fetchUnreadNotificationCount() {
  return request("/notifications/unread-count");
}

/**
 * PATCH /api/v1/notifications/:id/read
 */
export async function markNotificationRead(id) {
  return request(`/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
  });
}

/**
 * PATCH /api/v1/notifications/read-all
 */
export async function markAllNotificationsRead(farmId = null) {
  return request("/notifications/read-all", {
    method: "PATCH",
    body: JSON.stringify(farmId ? { farmId } : {}),
  });
}

/**
 * DELETE /api/v1/notifications/:id
 */
export async function deleteNotification(id) {
  return request(`/notifications/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/**
 * -----------------------------------------------------------------------------
 * Weather Intelligence & Early Warning Endpoints (Phase 7.0)
 * -----------------------------------------------------------------------------
 */

export async function fetchWeatherForecast(params = {}) {
  const query = new URLSearchParams();
  if (params.location) query.set("location", params.location);
  if (params.latitude != null) query.set("latitude", String(params.latitude));
  if (params.longitude != null) query.set("longitude", String(params.longitude));
  if (params.farmId) query.set("farmId", params.farmId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return request(`/weather/forecast${qs}`);
}

export async function fetchWeatherOutlook(params = {}) {
  const query = new URLSearchParams();
  if (params.location) query.set("location", params.location);
  if (params.latitude != null) query.set("latitude", String(params.latitude));
  if (params.longitude != null) query.set("longitude", String(params.longitude));
  if (params.farmId) query.set("farmId", params.farmId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return request(`/weather/outlook${qs}`);
}

export async function fetchWeatherAlerts(params = {}) {
  const query = new URLSearchParams();
  if (params.location) query.set("location", params.location);
  if (params.division) query.set("division", params.division);
  if (params.district) query.set("district", params.district);
  if (params.crop) query.set("crop", params.crop);
  if (params.stage) query.set("stage", params.stage);
  if (params.farmId) query.set("farmId", params.farmId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return request(`/weather/alerts${qs}`);
}

export async function fetchCropWeatherPlanning(params = {}) {
  const query = new URLSearchParams();
  if (params.location) query.set("location", params.location);
  if (params.crop) query.set("crop", params.crop);
  if (params.stage) query.set("stage", params.stage);
  if (params.farmId) query.set("farmId", params.farmId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return request(`/weather/crop-planning${qs}`);
}
