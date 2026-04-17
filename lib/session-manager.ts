import { AuthSession, saveAuth, clearAuth, loadAuth } from "@/lib/auth";
import { refreshToken } from "@/lib/api/auth";

const TOKEN_LIFETIME = 15 * 60;
const REFRESH_MARGIN = 5 * 60;

let refreshPromise: Promise<AuthSession> | null = null;

function getTokenExpiration(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  
  const now = Date.now();
  const refreshTime = expiration - (REFRESH_MARGIN * 1000);
  
  return now >= refreshTime;
}

async function refreshSession(): Promise<AuthSession> {
  const currentSession = loadAuth();
  
  if (!currentSession?.refreshToken) {
    throw new Error('No refresh token available');
  }

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

      saveAuth(newSession);
      
      return newSession;
    } catch (error) {
      clearAuth();
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function getValidToken(): Promise<string | null> {
  const session = loadAuth();
  
  if (!session) {
    return null;
  }

  if (!isTokenExpired(session.accessToken)) {
    return session.accessToken;
  }

  try {
    const newSession = await refreshSession();
    return newSession.accessToken;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const session = loadAuth();
  if (!session) return false;
  
  return !isTokenExpired(session.accessToken);
}

export async function forceRefreshToken(): Promise<AuthSession | null> {
  try {
    return await refreshSession();
  } catch {
    return null;
  }
}

export function initializeSessionManager() {
  setInterval(async () => {
    if (isAuthenticated()) {
      await getValidToken();
    }
  }, 60000);
}

export async function withTokenRefresh<T>(
  apiCall: () => Promise<T>
): Promise<T> {
  try {
    return await apiCall();
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
      const newToken = await getValidToken();
      if (newToken) {
        return await apiCall();
      }
    }
    throw error;
  }
}
