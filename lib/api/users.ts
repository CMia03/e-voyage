import { apiRequest } from "@/lib/api/client";

export type UserSummary = {
  id: string;
  nom?: string;
  prenom?: string;
  email?: string;
  role?: string;
  estActif?: boolean;
};

export function listUsers(token: string) {
  return apiRequest<{ data?: UserSummary[] }>("/api/utilisateurs", {
    token,
  });
}

