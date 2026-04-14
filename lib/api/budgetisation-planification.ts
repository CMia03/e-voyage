import { apiRequest, ApiEnvelope } from "@/lib/api/client";
import {
  BudgetisationPlanificationVoyage,
  SaveBudgetisationPlanificationVoyagePayload,
} from "@/lib/type/budgetisation-planification";

export function listBudgetisationsPlanification(token?: string) {
  return apiRequest<ApiEnvelope<BudgetisationPlanificationVoyage[]>>(
    "/api/budgetisations-planification",
    { token }
  );
}

export function getBudgetisationPlanification(id: string, token?: string) {
  return apiRequest<ApiEnvelope<BudgetisationPlanificationVoyage>>(
    `/api/budgetisations-planification/${id}`,
    { token }
  );
}

export function listBudgetisationsByPlanification(planificationId: string, token?: string) {
  return apiRequest<ApiEnvelope<BudgetisationPlanificationVoyage[]>>(
    `/api/budgetisations-planification/planification/${planificationId}`,
    { token }
  );
}

export function listBudgetisationsByPlanificationAndCategorie(
  planificationId: string,
  categorieClientId: string,
  token?: string
) {
  return apiRequest<ApiEnvelope<BudgetisationPlanificationVoyage[]>>(
    `/api/budgetisations-planification/planification/${planificationId}/categorie/${categorieClientId}`,
    { token }
  );
}

export function listBudgetisationsByPlanificationAndGamme(
  planificationId: string,
  gamme: string,
  token?: string
) {
  return apiRequest<ApiEnvelope<BudgetisationPlanificationVoyage[]>>(
    `/api/budgetisations-planification/planification/${planificationId}/gamme/${encodeURIComponent(gamme)}`,
    { token }
  );
}

export function createBudgetisationPlanification(
  payload: SaveBudgetisationPlanificationVoyagePayload,
  token?: string
) {
  return apiRequest<ApiEnvelope<BudgetisationPlanificationVoyage>>(
    "/api/budgetisations-planification",
    {
      method: "POST",
      token,
      body: payload,
    }
  );
}

export function updateBudgetisationPlanification(
  id: string,
  payload: SaveBudgetisationPlanificationVoyagePayload,
  token?: string
) {
  return apiRequest<ApiEnvelope<BudgetisationPlanificationVoyage>>(
    `/api/budgetisations-planification/${id}`,
    {
      method: "PUT",
      token,
      body: payload,
    }
  );
}

export function deleteBudgetisationPlanification(id: string, token?: string) {
  return apiRequest<ApiEnvelope>(
    `/api/budgetisations-planification/${id}`,
    {
      method: "DELETE",
      token,
    }
  );
}