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

export function getProfile(token: string) {
  return apiRequest<{ data?: unknown }>("/api/auth/me", {
    token,
  });
}

