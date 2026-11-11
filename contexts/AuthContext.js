"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { safeReturnTo, AUTH_RETURN_KEY } from "../lib/access.js";
import {
  fetchCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
  updateUserProfile,
} from "../services/api.js";

const AuthContext = createContext({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  updateProfile: async () => ({ success: false }),
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from httpOnly cookie on initial load
  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const res = await fetchCurrentUser();
        if (active && res.success && res.data?.user) {
          setUser(res.data.user);
          if (new URLSearchParams(window.location.search).get("auth") === "google_success") {
            try {
              const storedReturn = sessionStorage.getItem(AUTH_RETURN_KEY);
              sessionStorage.removeItem(AUTH_RETURN_KEY);
              if (storedReturn && safeReturnTo(storedReturn) !== "/dashboard") window.location.replace(safeReturnTo(storedReturn));
            } catch { /* Storage is optional; keep the default dashboard. */ }
          }
        } else if (active) {
          setUser(null);
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async ({ email, phone, identifier, password }) => {
    setIsLoading(true);
    try {
      const res = await loginUser({ email, phone, identifier, password });
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setIsLoading(false);
        return { success: true, user: res.data.user };
      }
      setIsLoading(false);
      return {
        success: false,
        error: res.error?.message || "Invalid email or password",
        code: res.error?.code || "INVALID_CREDENTIALS",
      };
    } catch (err) {
      setIsLoading(false);
      return {
        success: false,
        error: err.message || "Network error occurred",
        code: "NETWORK_ERROR",
      };
    }
  }, []);

  const register = useCallback(async ({ name, email, phone, password, preferredDistrict }) => {
    setIsLoading(true);
    try {
      const res = await registerUser({ name, email, phone, password, preferredDistrict });
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setIsLoading(false);
        return { success: true, user: res.data.user };
      }
      setIsLoading(false);
      return {
        success: false,
        error: res.error?.message || "Registration failed",
        code: res.error?.code || "REGISTRATION_FAILED",
      };
    } catch (err) {
      setIsLoading(false);
      return {
        success: false,
        error: err.message || "Network error occurred",
        code: "NETWORK_ERROR",
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      /* ignore network error on logout */
    } finally {
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async ({ name, preferredDistrict }) => {
    try {
      const res = await updateUserProfile({ name, preferredDistrict });
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      return {
        success: false,
        error: res.error?.message || "Failed to update profile",
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || "Network error occurred",
      };
    }
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
