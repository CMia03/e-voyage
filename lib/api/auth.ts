import { apiRequest } from "@/lib/api/client";

export type LoginPayload = {
  login: string;
  motDePasse: string;
};

export type RegisterPayload = {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateNaissance: string;
  adress: string;
  login: string;
  motDePasse: string;
  nationalite: string;
};

export type ConfirmRegistrationPayload = {
  email: string;
  code: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken?: string;
  role: string;
  userId?: string;
  login?: string;
  nom?: string;
  prenom?: string;
  [key: string]: unknown;
};

export function login(payload: LoginPayload) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function initiateRegistration(payload: RegisterPayload) {
  return apiRequest("/api/auth/confirm/initiate-registration", {
    method: "POST",
    body: payload,
  });
}

export function completeRegistration(payload: ConfirmRegistrationPayload) {
  return apiRequest<{ data?: AuthResponse }>(
    "/api/auth/confirm/complete-registration",
    {
      method: "POST",
      body: payload,
    }
  );
}

export function loginWithGoogle() {
  // Rediriger vers l'endpoint Google OAuth
  window.location.href = '/api/auth/google';
}

export function getProfile(token: string) {
  return apiRequest<{ data?: unknown }>("/api/auth/me", {
    token,
  });
}

