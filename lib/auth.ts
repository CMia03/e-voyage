export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  role: "ADMIN" | "USER" | string;
  userId?: string;
  login?: string;
  nom?: string;
  prenom?: string;
  expiresAt?: number;
};

const STORAGE_KEY = "cool_voyage_auth";

export function saveAuth(session: AuthSession) {
  if (typeof window === "undefined") return;
  
  const sessionWithExpiry = {
    ...session,
    expiresAt: session.expiresAt || Date.now() + (60 * 60 * 1000)
  };
  
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionWithExpiry));
}

export function loadAuth(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as AuthSession;
    
    if (session.expiresAt && Date.now() > session.expiresAt) {
      clearAuth();
      return null;
    }
    
    return session;
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

