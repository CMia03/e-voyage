"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthSession, clearAuth, loadAuth, saveAuth } from "@/lib/auth";
import {
  forceRefreshToken,
  getValidToken,
  initializeSessionManager,
  isAuthenticated,
  withTokenRefresh,
} from "@/lib/session-manager";
import { checkAndLoadGoogleUserProfile, hasPreviousGoogleSession } from "@/lib/auto-auth";

interface UseAuthReturn {
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  getValidToken: () => Promise<string | null>;
  forceRefresh: () => Promise<boolean>;
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearAuth();
    setSession(null);
  }, []);

  useEffect(() => {
    const syncSession = async () => {
      const currentSession = loadAuth();

      if (!currentSession) {
        setSession(null);
        return;
      }

      const validToken = await getValidToken();
      if (validToken) {
        setSession(loadAuth());
        return;
      }

      clearAuth();
      setSession(null);
    };

    const initSession = async () => {
      try {
        const savedSession = loadAuth();

        if (savedSession) {
          if (hasPreviousGoogleSession()) {
            const googleResult = await checkAndLoadGoogleUserProfile();
            if (googleResult.session) {
              setSession(googleResult.session);
            } else {
              clearAuth();
              setSession(null);
            }
          } else {
            await syncSession();
          }
        }
      } catch (error) {
        console.error("Erreur lors de l'initialisation de la session:", error);
        clearAuth();
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    void initSession();
    initializeSessionManager();

    const checkSessionInterval = setInterval(() => {
      void syncSession();
    }, 2000);

    return () => clearInterval(checkSessionInterval);
  }, []);

  const login = useCallback((newSession: AuthSession) => {
    saveAuth(newSession);
    setSession(newSession);
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshedSession = await forceRefreshToken();
      if (refreshedSession) {
        setSession(refreshedSession);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erreur lors du rafraichissement du token:", error);
      logout();
      return false;
    }
  }, [logout]);

  const getValidTokenCallback = useCallback(async (): Promise<string | null> => {
    try {
      const token = await getValidToken();
      if (token) {
        setSession(loadAuth());
      }
      return token;
    } catch (error) {
      console.error("Erreur lors de l'obtention du token valide:", error);
      logout();
      return null;
    }
  }, [logout]);

  const forceRefreshCallback = useCallback(async (): Promise<boolean> => {
    try {
      const refreshedSession = await forceRefreshToken();
      if (refreshedSession) {
        setSession(refreshedSession);
        return true;
      }
      logout();
      return false;
    } catch (error) {
      console.error("Erreur lors du rafraichissement force:", error);
      logout();
      return false;
    }
  }, [logout]);

  return {
    session,
    isLoading,
    isAuthenticated: !!session && isAuthenticated(),
    login,
    logout,
    refreshToken,
    getValidToken: getValidTokenCallback,
    forceRefresh: forceRefreshCallback,
  };
}

export function useAuthenticatedApi() {
  const { getValidToken: getToken } = useAuth();

  const apiCallWithToken = useCallback(
    async <T,>(apiCall: () => Promise<T>): Promise<T> => {
      await getToken();
      return withTokenRefresh(apiCall);
    },
    [getToken]
  );

  return { apiCallWithToken };
}
