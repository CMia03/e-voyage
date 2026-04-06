import { apiRequest } from "@/lib/api/client";
import { AuthResponse, ConfirmRegistrationPayload, LoginPayload, RegisterPayload } from "../type/data";


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

export function refreshToken(refreshToken: string) {
  return apiRequest<{
    accessToken: string;
    refreshToken?: string;
    role: string;
    userId?: string;
    login?: string;
    nom?: string;
    prenom?: string;
  }>("/api/auth/refresh-token", {
    method: "POST",
    body: { refreshToken },
  });
}

export function getProfile(token: string) {
  return apiRequest<{ data?: unknown }>("/api/auth/me", {
    token,
  });
}

export function updateProfile(token: string, profileData: {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateNaissance: string;
  adress: string;
  nationalite: string;
}) {
  return apiRequest<{ data?: unknown }>("/api/auth/me", {
    token,
    method: "PUT",
    body: profileData,
  });
}
