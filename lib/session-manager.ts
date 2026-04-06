import { AuthSession, saveAuth, clearAuth, loadAuth } from "@/lib/auth";
import { refreshToken } from "@/lib/api/auth";

// Durée de vie du token en secondes (généralement 15 minutes)
const TOKEN_LIFETIME = 15 * 60; // 15 minutes
// Marge de sécurité pour rafraîchir le token avant expiration (5 minutes)
const REFRESH_MARGIN = 5 * 60; // 5 minutes

let refreshPromise: Promise<AuthSession> | null = null;

// Decode JWT token pour obtenir la date d'expiration
function getTokenExpiration(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null; // Convertir en millisecondes
  } catch {
    return null;
  }
}

// Vérifier si le token est expiré ou va expirer bientôt
function isTokenExpired(token: string): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true; // Si on ne peut pas décoder, on considère comme expiré
  
  const now = Date.now();
  const refreshTime = expiration - (REFRESH_MARGIN * 1000);
  
  return now >= refreshTime;
}

// Rafraîchir le token avec gestion de concurrence
async function refreshSession(): Promise<AuthSession> {
  const currentSession = loadAuth();
  
  if (!currentSession?.refreshToken) {
    throw new Error('No refresh token available');
  }

  // Si un rafraîchissement est déjà en cours, retourner la même promesse
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await refreshToken(currentSession.refreshToken!);
      
      const newSession: AuthSession = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken || currentSession.refreshToken,
        role: response.role,
        userId: response.userId,
        login: response.login,
        nom: response.nom,
        prenom: response.prenom,
      };

      // Sauvegarder la nouvelle session
      saveAuth(newSession);
      
      return newSession;
    } catch (error) {
      // En cas d'échec du refresh, nettoyer la session
      clearAuth();
      throw error;
    } finally {
      // Réinitialiser la promesse après traitement
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Obtenir un token valide (rafraîchit si nécessaire)
export async function getValidToken(): Promise<string | null> {
  const session = loadAuth();
  
  if (!session) {
    return null;
  }

  // Si le token est encore valide, le retourner
  if (!isTokenExpired(session.accessToken)) {
    return session.accessToken;
  }

  // Sinon, rafraîchir la session
  try {
    const newSession = await refreshSession();
    return newSession.accessToken;
  } catch {
    return null;
  }
}

// Vérifier si l'utilisateur est authentifié avec un token valide
export function isAuthenticated(): boolean {
  const session = loadAuth();
  if (!session) return false;
  
  return !isTokenExpired(session.accessToken);
}

// Forcer le rafraîchissement du token
export async function forceRefreshToken(): Promise<AuthSession | null> {
  try {
    return await refreshSession();
  } catch {
    return null;
  }
}

// Initialiser le gestionnaire de session
export function initializeSessionManager() {
  // Vérifier périodiquement si le token doit être rafraîchi
  setInterval(async () => {
    if (isAuthenticated()) {
      await getValidToken(); // Déclenche le refresh si nécessaire
    }
  }, 60000); // Vérifier chaque minute
}

// Intercepteur pour les requêtes API
export async function withTokenRefresh<T>(
  apiCall: () => Promise<T>
): Promise<T> {
  try {
    return await apiCall();
  } catch (error: unknown) {
    // Si l'erreur est 401 (Unauthorized), essayer de rafraîchir le token
    if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
      const newToken = await getValidToken();
      if (newToken) {
        // Réessayer l'appel API avec le nouveau token
        return await apiCall();
      }
    }
    throw error;
  }
}
