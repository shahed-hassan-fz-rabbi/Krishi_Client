"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchDistricts } from "../services/api.js";
import { useAuth } from "./AuthContext.js";

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
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedDistrictState(stored);
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
      if (active && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setDistricts(res.data);
        const def = res.data.find((d) => d.isDefault)?.code || res.data[0].code;
        try {
          const stored = localStorage.getItem(DISTRICT_STORAGE_KEY);
          if (!stored && !user?.preferredDistrict) {
            setSelectedDistrictState(def);
          }
        } catch {
          /* ignore */
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
  }, [user, updateProfile]);

  const currentDistrictObj =
    districts.find((d) => d.code === selectedDistrict) ||
    districts.find((d) => d.isDefault) ||
    districts[0];

  /**
   * Browser GPS detection with distance mapping to closest supported district.
   */
  const detectLocation = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setDetectionStatus("error");
      setDetectionMessage("geolocationNotSupported");
      return { success: false, error: "geolocationNotSupported" };
    }

    setDetectionStatus("detecting");
    setDetectionMessage(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;

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
            // Note: Does NOT silently overwrite selectedDistrict here.
            // Returns the recommendation so the user or caller explicitly confirms.
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
          setDetectionStatus("error");
          let errKey = "unknownError";
          if (err.code === 1) errKey = "permissionDenied";
          else if (err.code === 2) errKey = "positionUnavailable";
          else if (err.code === 3) errKey = "timeout";
          setDetectionMessage(errKey);
          resolve({ success: false, error: errKey });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, [districts]);

  return (
    <LocationContext.Provider
      value={{
        selectedDistrict,
        setSelectedDistrict,
        districts,
        currentDistrictObj,
        isLoadingDistricts,
        detectLocation,
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
