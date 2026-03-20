import { ApiError, apiRequest } from "@/lib/api/client";
import {
  Activite,
  CategorieActivite,
  SaveActivitePayload,
} from "@/lib/type/activite";

type ApiDataEnvelope<T> = {
  data?: T;
};

async function apiRequestWithFallback<T>(
  paths: string[],
  options?: {
    method?: string;
    token?: string;
    body?: unknown;
  }
) {
  let lastError: unknown;

  for (const path of paths) {
    try {
      return await apiRequest<T>(path, options);
    } catch (error) {
      lastError = error;

      if (!(error instanceof ApiError)) {
        throw error;
      }

      if (error.status === 403) {
        throw error;
      }
    }
  }

  throw lastError;
}

export function listActivites(token?: string) {
  return apiRequestWithFallback<ApiDataEnvelope<Activite[]>>(
    ["/api/activiters", "/api/activites"],
    { token }
  );
}

export function getActivite(id: string, token?: string) {
  return apiRequestWithFallback<ApiDataEnvelope<Activite>>(
    [`/api/activiters/${id}`, `/api/activites/${id}`],
    { token }
  );
}

export function createActivite(payload: SaveActivitePayload, token?: string) {
  return apiRequest<ApiDataEnvelope<Activite>>("/api/activites", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateActivite(
  id: string,
  payload: SaveActivitePayload,
  token?: string
) {
  return apiRequestWithFallback<ApiDataEnvelope<Activite>>(
    [`/api/activiters/${id}`, `/api/activites/${id}`],
    {
      method: "PUT",
      token,
      body: payload,
    }
  );
}

export function deleteActivite(id: string, token?: string) {
  return apiRequestWithFallback<ApiDataEnvelope<string>>(
    [`/api/activiters/${id}`, `/api/activites/${id}`],
    {
      method: "DELETE",
      token,
    }
  );
}

export function listActiviteCategories(token?: string) {
  return apiRequest<ApiDataEnvelope<CategorieActivite[]>>(
    "/api/activites/categories",
    {
      token,
    }
  );
}

export function createActiviteCategorie(nom: string, token?: string) {
  return apiRequest<ApiDataEnvelope<CategorieActivite>>(
    "/api/activites/categories",
    {
      method: "POST",
      token,
      body: { nom },
    }
  );
}
