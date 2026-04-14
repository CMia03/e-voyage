import { apiRequest } from "@/lib/api/client";

export type UserSummary = {
  id: string;
  nom?: string;
  prenom?: string;
  email?: string;
  role?: string;
  estActif?: boolean;
};

export function getUsers(token: string) {
  return apiRequest<{ data?: UserSummary[] }>("/api/utilisateurs", {
    token,
  });
}

export function getUserById(token: string, userId: string) {
  return apiRequest<{ data?: unknown }>(`/api/utilisateurs/${userId}`, {
    token,
  });
}

export function updateUser(token: string, userId: string, userData: {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateNaissance: string;
  adress: string;
  nationalite: string;
  role: string;
  estActif: boolean;
}) {
  return apiRequest<{ data?: unknown }>(`/api/utilisateurs/${userId}`, {
    token,
    method: "PUT",
    body: userData,
  });
}


