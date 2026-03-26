"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface AdminSession {
  id: string;
  email: string;
  name: string | null;
  is_verified: boolean;
  is_locked: boolean;
  role_id: string | null;
  session_token: string;
  session_expires_at: string;
  created_at: string;
  last_login_at: string | null;
}

const ADMIN_SESSION_KEY = "admin_session";
const ADMIN_DATA_KEY = "admin";

export function useAdminSession() {
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load session from storage on mount
  useEffect(() => {
    const loadSession = () => {
      try {
        const sessionData = localStorage.getItem(ADMIN_SESSION_KEY);
        if (sessionData) {
          const parsed = JSON.parse(sessionData) as AdminSession;

          // Check if session has expired
          if (new Date(parsed.session_expires_at) < new Date()) {
            clearSession();
            return;
          }

          setAdmin(parsed);
        }
      } catch (error) {
        console.error("Error loading admin session:", error);
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  // Save session to storage
  const saveSession = useCallback((adminData: AdminSession) => {
    try {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminData));
      // Also save to sessionStorage for backward compatibility
      sessionStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(adminData));
      setAdmin(adminData);
    } catch (error) {
      console.error("Error saving admin session:", error);
    }
  }, []);

  // Clear session from storage
  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem(ADMIN_DATA_KEY);
      setAdmin(null);
    } catch (error) {
      console.error("Error clearing admin session:", error);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    if (admin?.session_token) {
      try {
        // Call logout API to invalidate session on server
        await fetch("/api/adminLogout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_token: admin.session_token,
          }),
        });
      } catch (error) {
        console.error("Error during logout:", error);
      }
    }
    clearSession();
    router.push("/admin");
  }, [admin, clearSession, router]);

  // Validate session with server
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!admin?.session_token) {
      return false;
    }

    try {
      const res = await fetch("/api/adminValidateSession", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_token: admin.session_token,
        }),
      });

      const data = await res.json();

      if (!data.success || !data.valid) {
        clearSession();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error validating session:", error);
      return false;
    }
  }, [admin, clearSession]);

  // Check if admin is allowed to access dashboard
  const isAllowed = useCallback((): boolean => {
    if (!admin) return false;
    if (!admin.is_verified) return false;
    if (admin.is_locked) return false;
    if (new Date(admin.session_expires_at) < new Date()) return false;
    return true;
  }, [admin]);

  return {
    admin,
    isLoading,
    isAuthenticated: !!admin,
    isAllowed: isAllowed(),
    saveSession,
    clearSession,
    logout,
    validateSession,
  };
}
