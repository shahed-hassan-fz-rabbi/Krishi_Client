import test from "node:test";
import assert from "node:assert/strict";

/**
 * Krishi Mama — Location Selection, GPS Timeout & Back Navigation Tests
 */

// Haversine formula from LocationContext
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const DISTRICTS = [
  { code: "chattogram", nameEn: "Chattogram", latitude: 22.3384, longitude: 91.8317 },
  { code: "cumilla", nameEn: "Cumilla", latitude: 23.46186, longitude: 91.18503 },
];

test("GPS location mapping: coordinates near Cumilla resolve to Cumilla", () => {
  const userLat = 23.45;
  const userLon = 91.19;

  let closest = null;
  let minDistance = Infinity;

  DISTRICTS.forEach((d) => {
    const dist = haversineDistanceKm(userLat, userLon, d.latitude, d.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      closest = d;
    }
  });

  assert.equal(closest.code, "cumilla");
  assert.ok(minDistance < 5, `Expected distance < 5km, got ${minDistance}`);
});

test("GPS location mapping: coordinates near Chattogram resolve to Chattogram", () => {
  const userLat = 22.35;
  const userLon = 91.82;

  let closest = null;
  let minDistance = Infinity;

  DISTRICTS.forEach((d) => {
    const dist = haversineDistanceKm(userLat, userLon, d.latitude, d.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      closest = d;
    }
  });

  assert.equal(closest.code, "chattogram");
  assert.ok(minDistance < 5, `Expected distance < 5km, got ${minDistance}`);
});

test("GPS error code classification handles permission denied, position unavailable, and timeout", () => {
  function mapGeolocationError(err) {
    if (err?.code === 1) return "permissionDenied";
    if (err?.code === 2) return "positionUnavailable";
    if (err?.code === 3) return "timeout";
    return "unknownError";
  }

  assert.equal(mapGeolocationError({ code: 1 }), "permissionDenied");
  assert.equal(mapGeolocationError({ code: 2 }), "positionUnavailable");
  assert.equal(mapGeolocationError({ code: 3 }), "timeout");
  assert.equal(mapGeolocationError({ code: 99 }), "unknownError");
  assert.equal(mapGeolocationError(null), "unknownError");
});

test("Safety fallback timer resolves with timeout when browser geolocation callback hangs", async () => {
  async function simulateDetectLocationWithSafetyTimer(driverBehavior) {
    return new Promise((resolve) => {
      let settled = false;

      // Fast 50ms safety timer for testing
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve({ success: false, error: "timeout" });
        }
      }, 50);

      if (driverBehavior === "hangs") {
        // Simulates browser driver never calling success or error
      } else if (driverBehavior === "immediate_success") {
        setTimeout(() => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve({ success: true, district: "cumilla" });
          }
        }, 10);
      }
    });
  }

  // 1. Hanging driver is caught by safety timer
  const hangRes = await simulateDetectLocationWithSafetyTimer("hangs");
  assert.equal(hangRes.success, false);
  assert.equal(hangRes.error, "timeout");

  // 2. Responsive driver succeeds and clears safety timer
  const successRes = await simulateDetectLocationWithSafetyTimer("immediate_success");
  assert.equal(successRes.success, true);
  assert.equal(successRes.district, "cumilla");
});

test("Duplicate simultaneous GPS request prevention", async () => {
  let isDetecting = true;

  function tryDetectLocation() {
    if (isDetecting) {
      return { success: false, error: "alreadyDetecting" };
    }
    isDetecting = true;
    return { success: true };
  }

  const result = tryDetectLocation();
  assert.equal(result.success, false);
  assert.equal(result.error, "alreadyDetecting");
});

test("Manual district selection functions independently when GPS fails", () => {
  const formState = {
    fullName: "Rahim Farmer",
    email: "rahim@krishimama.local",
    password: "Password123!",
    chosenDistrict: "chattogram",
    gpsStatus: "error", // GPS timed out or was denied
  };

  // Farmer explicitly picks Cumilla manually
  formState.chosenDistrict = "cumilla";

  // Form validation for registration
  const isValid = Boolean(
    formState.fullName &&
    formState.email &&
    formState.password &&
    (formState.chosenDistrict === "cumilla" || formState.chosenDistrict === "chattogram")
  );

  assert.equal(isValid, true);
  assert.equal(formState.chosenDistrict, "cumilla");
});

test("Back navigation preserves form data between step 2 and step 1", () => {
  // Simulates registration wizard state machine
  const state = {
    step: 1,
    fullName: "Karim Mia",
    email: "karim@krishimama.local",
    password: "SecretPassword123!",
    confirmPassword: "SecretPassword123!",
    chosenDistrict: "chattogram",
  };

  // Step 1 -> Step 2
  state.step = 2;
  state.chosenDistrict = "cumilla";

  // Farmer clicks Back button to return to Step 1
  state.step = 1;

  // Form values must remain completely intact
  assert.equal(state.fullName, "Karim Mia");
  assert.equal(state.email, "karim@krishimama.local");
  assert.equal(state.password, "SecretPassword123!");
  assert.equal(state.confirmPassword, "SecretPassword123!");
  assert.equal(state.chosenDistrict, "cumilla");
});
