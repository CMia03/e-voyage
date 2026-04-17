"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthSession, saveAuth, clearAuth, loadAuth } from "@/lib/auth";
import { 
  getValidToken, 
  isAuthenticated, 
  forceRefreshToken, 
  initializeSessionManager,
  withTokenRefresh 
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

  useEffect(() => {
    const initSession = async () => {
      try {
        const savedSession = loadAuth();
        
        if (savedSession) {
          if (hasPreviousGoogleSession()) {
            try {
              const googleResult = await checkAndLoadGoogleUserProfile();
              if (googleResult.session) {
                setSession(googleResult.session);
              } else {
                clearAuth();
                setSession(null);
              }
            } catch (error) {
              console.error("Erreur lors du chargement du profil Google:", error);
              clearAuth();
              setSession(null);
            }
          } else {
            // Vérifier si le token est valide
            if (isAuthenticated()) {
              const validToken = await getValidToken();
              if (validToken) {
                setSession(savedSession);
              } else {
                  clearAuth();
                setSession(null);
              }
            } else {
                const refreshedSession = await forceRefreshToken();
              if (refreshedSession) {
                setSession(refreshedSession);
              } else {
                clearAuth();
                setSession(null);
              }
            }
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

    initSession();
    
    initializeSessionManager();
    
    const checkSessionInterval = setInterval(() => {
      const currentSession = loadAuth();
      const isCurrentlyAuthenticated = isAuthenticated();
      
      if (session && !isCurrentlyAuthenticated) {
        console.log("Session expirée, déconnexion automatique");
        clearAuth();
        setSession(null);
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }, 2000);

    return () => clearInterval(checkSessionInterval);
  }, []);

  const login = useCallback((newSession: AuthSession) => {
    saveAuth(newSession);
    setSession(newSession);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setSession(null);
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
      console.error("Erreur lors du rafraîchissement du token:", error);
      logout();
      return false;
    }
  }, [logout]);

  const getValidTokenCallback = useCallback(async (): Promise<string | null> => {
    try {
      return await getValidToken();
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
      console.error("Erreur lors du rafraîchissement forcé:", error);
      logout();
      return false;
    }
  }, [logout]);

  const authResult = {
    session,
    isLoading,
    isAuthenticated: !!session && isAuthenticated(),
    login,
    logout,
    refreshToken,
    getValidToken: getValidTokenCallback,
    forceRefresh: forceRefreshCallback,
  };
  
  return authResult;
}

export function useAuthenticatedApi() {
  const { getValidToken } = useAuth();

  const apiCallWithToken = useCallback(async <T>(
    apiCall: () => Promise<T>
  ): Promise<T> => {
    return withTokenRefresh(apiCall);
  }, [getValidToken]);

  return { apiCallWithToken };
}
