export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  role: "ADMIN" | "USER" | string;
  userId?: string;
  login?: string;
  nom?: string;
  prenom?: string;
};

const STORAGE_KEY = "cool_voyage_auth";

export function saveAuth(session: AuthSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadAuth(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

