"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchDistricts } from "../services/api.js";
import { useAuth } from "./AuthContext.js";
import { getProjectDistricts, resolveProjectDistrictCode } from "../lib/districtGeography.js";

const DISTRICT_STORAGE_KEY = "km-selected-district";

const DEFAULT_DISTRICTS = [
  {
    code: "chattogram",
    nameEn: "Chattogram",
    nameBn: "চট্টগ্রাম",
    latitude: 22.3384,
    longitude: 91.8317,
    isDefault: true,
  },
  {
    code: "cumilla",
    nameEn: "Cumilla",
    nameBn: "কুমিল্লা",
    latitude: 23.46186,
    longitude: 91.18503,
    isDefault: false,
  },
];

const LocationContext = createContext({
  selectedDistrict: "chattogram",
  setSelectedDistrict: () => {},
  districts: DEFAULT_DISTRICTS,
  currentDistrictObj: DEFAULT_DISTRICTS[0],
  isLoadingDistricts: false,
  detectLocation: async () => {},
  resetDetectionState: () => {},
  detectionStatus: "idle", // idle | detecting | success | error
  detectionMessage: null,
});

/**
 * Haversine distance in kilometers between two lat/lon coordinates.
 */
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
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

export function LocationProvider({ children }) {
  const { user, updateProfile } = useAuth();
  const [selectedDistrict, setSelectedDistrictState] = useState("chattogram");
  const [districts, setDistricts] = useState(DEFAULT_DISTRICTS);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState("idle");
  const [detectionMessage, setDetectionMessage] = useState(null);

  // Sync stored district on hydration
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISTRICT_STORAGE_KEY);
      if (stored && resolveProjectDistrictCode(stored, DEFAULT_DISTRICTS) === stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedDistrictState(stored);
      } else if (stored) {
        const supportedDefault = resolveProjectDistrictCode(null, DEFAULT_DISTRICTS);
        setSelectedDistrictState(supportedDefault);
        localStorage.setItem(DISTRICT_STORAGE_KEY, supportedDefault);
      }
    } catch {
      /* ignore storage access error */
    }
  }, []);

  // Sync authenticated user's preferred district if available
  useEffect(() => {
    if (user?.preferredDistrict && (user.preferredDistrict === "chattogram" || user.preferredDistrict === "cumilla")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedDistrictState(user.preferredDistrict);
      try {
        localStorage.setItem(DISTRICT_STORAGE_KEY, user.preferredDistrict);
      } catch {
        /* ignore */
      }
    }
  }, [user?.preferredDistrict]);

  // Fetch live districts from API
  useEffect(() => {
    let active = true;
    async function loadDistricts() {
      setIsLoadingDistricts(true);
      const res = await fetchDistricts();
      const supportedDistricts = getProjectDistricts(res?.data);
      if (active && res?.success && supportedDistricts.length > 0) {
        setDistricts(supportedDistricts);
        const def = resolveProjectDistrictCode(null, supportedDistricts);
        try {
          const stored = localStorage.getItem(DISTRICT_STORAGE_KEY);
          const selected = resolveProjectDistrictCode(user?.preferredDistrict || stored, supportedDistricts) || def;
          if (selected !== stored && !user?.preferredDistrict) {
            localStorage.setItem(DISTRICT_STORAGE_KEY, selected);
          }
          if (selected !== stored) setSelectedDistrictState(selected);
        } catch {
          if (!user?.preferredDistrict) setSelectedDistrictState(def);
        }
      }
      if (active) setIsLoadingDistricts(false);
    }
    loadDistricts();
    return () => {
      active = false;
    };
  }, [user?.preferredDistrict]);

  const setSelectedDistrict = useCallback((code) => {
    if (!getProjectDistricts(districts).some((district) => district.code === code)) return;
    setSelectedDistrictState(code);
    try {
      localStorage.setItem(DISTRICT_STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
    // Persist to user profile in MongoDB if authenticated
    if (user) {
      updateProfile({ preferredDistrict: code }).catch(() => {});
    }
  }, [user, updateProfile, districts]);

  const currentDistrictObj =
    districts.find((d) => d.code === selectedDistrict) ||
    districts.find((d) => d.isDefault) ||
    districts[0];

  const resetDetectionState = useCallback(() => {
    setDetectionStatus("idle");
    setDetectionMessage(null);
  }, []);

  /**
   * Browser GPS / Network Location detection with distance mapping to closest supported district.
   * Uses non-blocking timeout, duplicate request prevention, and safe fallbacks.
   */
  const detectLocation = useCallback(async () => {
    if (detectionStatus === "detecting") {
      return { success: false, error: "alreadyDetecting" };
    }

    if (typeof window === "undefined" || !navigator.geolocation) {
      setDetectionStatus("error");
      setDetectionMessage("geolocationNotSupported");
      return { success: false, error: "geolocationNotSupported" };
    }

    setDetectionStatus("detecting");
    setDetectionMessage(null);

    return new Promise((resolve) => {
      let settled = false;

      // Application-level safety timer prevents hanging if browser driver stalls
      const safetyTimer = setTimeout(() => {
        if (!settled) {
          settled = true;
          setDetectionStatus("error");
          setDetectionMessage("timeout");
          resolve({ success: false, error: "timeout" });
        }
      }, 8500);

      try {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (settled) return;
            settled = true;
            clearTimeout(safetyTimer);

            const userLat = position?.coords?.latitude;
            const userLon = position?.coords?.longitude;

            if (typeof userLat !== "number" || typeof userLon !== "number") {
              setDetectionStatus("error");
              setDetectionMessage("positionUnavailable");
              return resolve({ success: false, error: "positionUnavailable" });
            }

            // Find closest supported district
            let closest = null;
            let minDistance = Infinity;

            districts.forEach((d) => {
              const dist = haversineDistanceKm(userLat, userLon, d.latitude, d.longitude);
              if (dist < minDistance) {
                minDistance = dist;
                closest = d;
              }
            });

            if (closest) {
              setDetectionStatus("success");
              setDetectionMessage({
                district: closest,
                distanceKm: Math.round(minDistance),
              });
              resolve({ success: true, district: closest, distanceKm: minDistance });
            } else {
              setDetectionStatus("error");
              setDetectionMessage("positionUnavailable");
              resolve({ success: false, error: "positionUnavailable" });
            }
          },
          (err) => {
            if (settled) return;
            settled = true;
            clearTimeout(safetyTimer);

            setDetectionStatus("error");
            let errKey = "unknownError";
            if (err?.code === 1) errKey = "permissionDenied";
            else if (err?.code === 2) errKey = "positionUnavailable";
            else if (err?.code === 3) errKey = "timeout";
            setDetectionMessage(errKey);
            resolve({ success: false, error: errKey });
          },
          {
            enableHighAccuracy: false, // Prevents hanging on desktops/laptops without satellite GPS
            timeout: 8000,             // 8s native timeout
            maximumAge: 300000,        // Accept cached location up to 5 minutes
          }
        );
      } catch {
        if (!settled) {
          settled = true;
          clearTimeout(safetyTimer);
          setDetectionStatus("error");
          setDetectionMessage("unknownError");
          resolve({ success: false, error: "unknownError" });
        }
      }
    });
  }, [detectionStatus, districts]);

  return (
    <LocationContext.Provider
      value={{
        selectedDistrict,
        setSelectedDistrict,
        districts,
        currentDistrictObj,
        isLoadingDistricts,
        detectLocation,
        resetDetectionState,
        detectionStatus,
        detectionMessage,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return ctx;
}
