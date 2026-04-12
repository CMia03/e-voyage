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

  // Initialiser la session au montage du composant
  useEffect(() => {
    const initSession = async () => {
      try {
        // Charger la session depuis localStorage
        const savedSession = loadAuth();
        
        if (savedSession) {
          // Vérifier si c'est un utilisateur Google et charger son profil automatiquement
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
                // Token expiré et non rafraîchissable
                clearAuth();
                setSession(null);
              }
            } else {
              // Token expiré, essayer de rafraîchir
              const refreshedSession = await forceRefreshToken();
              if (refreshedSession) {
                setSession(refreshedSession);
              } else {
                // Échec du refresh, déconnecter automatiquement
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
    
    // Initialiser le gestionnaire de session pour le rafraîchissement automatique
    initializeSessionManager();
    
    // Ajouter un écouteur pour détecter l'expiration de session
    const checkSessionInterval = setInterval(() => {
      const currentSession = loadAuth();
      const isCurrentlyAuthenticated = isAuthenticated();
      
      // Si la session a changé (expirée ou déconnectée)
      if (session && !isCurrentlyAuthenticated) {
        console.log("Session expirée, déconnexion automatique");
        clearAuth();
        setSession(null);
        
        // Rediriger vers la page de login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }, 2000); // Vérifier toutes les 2 secondes pour plus de réactivité

    // Nettoyer l'intervalle au démontage
    return () => clearInterval(checkSessionInterval);
  }, []);

  // Fonction de login
  const login = useCallback((newSession: AuthSession) => {
    saveAuth(newSession);
    setSession(newSession);
  }, []);

  // Fonction de logout
  const logout = useCallback(() => {
    clearAuth();
    setSession(null);
  }, []);

  // Fonction pour rafraîchir le token
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

  // Fonction pour obtenir un token valide
  const getValidTokenCallback = useCallback(async (): Promise<string | null> => {
    try {
      return await getValidToken();
    } catch (error) {
      console.error("Erreur lors de l'obtention du token valide:", error);
      logout();
      return null;
    }
  }, [logout]);

  // Fonction pour forcer le rafraîchissement
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
  
  console.log("useAuth result:", authResult);
  return authResult;
}

// Hook pour les requêtes API avec gestion automatique du token
export function useAuthenticatedApi() {
  const { getValidToken } = useAuth();

  const apiCallWithToken = useCallback(async <T>(
    apiCall: () => Promise<T>
  ): Promise<T> => {
    return withTokenRefresh(apiCall);
  }, [getValidToken]);

  return { apiCallWithToken };
}
