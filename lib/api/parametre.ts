// lib/api/parametrage-marge-brute.ts
import { apiRequest, ApiEnvelope } from "@/lib/api/client";
import { ParametrageMargeBrute, ParametrageMargeBruteRequest } from "@/lib/type/Parametre";

// ========== API FUNCTIONS ==========

/**
 * Récupérer tous les paramétrages
 */
export function listParametrages(token?: string) {
  return apiRequest<ApiEnvelope<ParametrageMargeBrute[]>>(
    "/api/admin/parametrage",
    { token }
  );
}

/**
 * Récupérer les paramétrages actifs uniquement
 */
export function listParametragesActifs(token?: string) {
  return apiRequest<ApiEnvelope<ParametrageMargeBrute[]>>(
    "/api/admin/parametrage/actifs",
    { token }
  );
}

/**
 * Récupérer un paramétrage par son ID
 */
export function getParametrage(id: string, token?: string) {
  return apiRequest<ApiEnvelope<ParametrageMargeBrute>>(
    `/api/admin/parametrage/${id}`,
    { token }
  );
}

/**
 * Récupérer le paramétrage par catégorie client
 */
export function getParametrageByCategorieClient(categorieClientId: string, token?: string) {
  return apiRequest<ApiEnvelope<ParametrageMargeBrute>>(
    `/api/admin/parametrage/categorie/${categorieClientId}`,
    { token }
  );
}

/**
 * Créer un nouveau paramétrage
 */
export function createParametrage(payload: ParametrageMargeBruteRequest, token?: string) {
  return apiRequest<ApiEnvelope<ParametrageMargeBrute>>(
    "/api/admin/parametrage",
    {
      method: "POST",
      token,
      body: payload,
    }
  );
}

/**
 * Modifier un paramétrage existant
 */
export function updateParametrage(id: string, payload: ParametrageMargeBruteRequest, token?: string) {
  return apiRequest<ApiEnvelope<ParametrageMargeBrute>>(
    `/api/admin/parametrage/${id}`,
    {
      method: "PUT",
      token,
      body: payload,
    }
  );
}

/**
 * Supprimer un paramétrage
 */
export function deleteParametrage(id: string, token?: string) {
  return apiRequest<ApiEnvelope>(
    `/api/admin/parametrage/${id}`,
    {
      method: "DELETE",
      token,
    }
  );
}

/**
 * Activer/Désactiver un paramétrage
 */
export function toggleParametrageActif(id: string, token?: string) {
  return apiRequest<ApiEnvelope>(
    `/api/admin/parametrage/${id}/toggle`,
    {
      method: "PATCH",
      token,
    }
  );
}