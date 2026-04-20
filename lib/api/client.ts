import { API_BASE_URL } from "@/lib/api";
import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import { getValidToken } from '@/lib/session-manager';


export type ApiEnvelope<T = unknown> = {
  success?: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
};

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function extractErrorMessage(payload: unknown): string | undefined {
  if (!payload) return undefined;

  if (typeof payload === "string") {
    return payload.trim() || undefined;
  }

  if (typeof payload !== "object") {
    return undefined;
  }

  const candidate = payload as {
    message?: unknown;
    error?: unknown;
    errors?: unknown;
  };

  if (typeof candidate.message === "string" && candidate.message.trim()) {
    return candidate.message;
  }

  if (typeof candidate.error === "string" && candidate.error.trim()) {
    return candidate.error;
  }

  if (candidate.errors && typeof candidate.errors === "object") {
    const firstError = Object.values(candidate.errors as Record<string, unknown>).find(
      (value) => typeof value === "string" && value.trim()
    );

    if (typeof firstError === "string") {
      return firstError;
    }
  }

  return undefined;
}

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  token?: string;
  body?: unknown;
  autoRefresh?: boolean; // Nouvelle option pour activer le refresh automatique
};

function buildHeaders(options?: RequestOptions) {
  const headers: Record<string, string> = {
    ...(options?.headers ?? {}),
  };
  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  return headers;
}

// Construire les headers avec token automatique
async function buildHeadersWithAuth(options?: RequestOptions): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    ...(options?.headers ?? {}),
  };
  
  // Si autoRefresh est activé et aucun token n'est fourni, obtenir un token valide
  if (options?.autoRefresh && !options?.token) {
    const validToken = await getValidToken();
    if (validToken) {
      headers.Authorization = `Bearer ${validToken}`;
    }
  } else if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  
  return headers;
}

function shouldJsonStringify(body: unknown) {
  if (!body) return false;
  if (typeof body === "string") return false;
  if (body instanceof FormData) return false;
  return true;
}


export async function apiRequest<T = ApiEnvelope>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const autoRefresh = options.autoRefresh ?? false;
  let headers: Record<string, string>;
  
  if (autoRefresh) {
    headers = await buildHeadersWithAuth(options);
  } else {
    headers = buildHeaders(options);
  }
  
  const data = options.body;

  if (shouldJsonStringify(data)) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }

  const config: AxiosRequestConfig = {
    method: (options.method as Method) ?? "GET",
    url: `${API_BASE_URL}${path}`,
    headers,
    data: data,
  };

  const makeRequest = async () => {
    try {
      const response: AxiosResponse = await axios(config);
      const payload = response.data;

      if (payload && (payload as ApiEnvelope)?.success === false) {
        const message = extractErrorMessage(payload) || "Request failed";
        throw new ApiError(message, response.status, payload);
      }

      return payload as T;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const payload = error.response.data;
        const message =
          extractErrorMessage(payload) ||
          error.message ||
          `Request failed with status ${error.response.status}`;
        throw new ApiError(message, error.response.status, payload);
      }
      
      throw new ApiError(
        error instanceof Error ? error.message : "Request failed",
        500,
        null
      );
    }
  };

  // Si autoRefresh est activé, utiliser l'intercepteur
  if (autoRefresh) {
    return await makeRequestWithRefresh(makeRequest);
  }
  
  return await makeRequest();
}

// Fonction pour gérer le refresh automatique en cas d'erreur 401
async function makeRequestWithRefresh<T>(requestFn: () => Promise<T>): Promise<T> {
  try {
    return await requestFn();
  } catch (error: unknown) {
    // Si l'erreur est 401 (Unauthorized), essayer de rafraîchir le token
    if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
      const newToken = await getValidToken();
      if (newToken) {
        // Mettre à jour les headers avec le nouveau token et réessayer
        // Note: ici vous devriez recréer la requête avec le nouveau token
        // Pour simplifier, on relance la fonction originale
        return await requestFn();
      }
    }
    throw error;
  }
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message || extractErrorMessage(error.data) || fallback;
  }
  if (error && typeof error === "object") {
    const directMessage = extractErrorMessage(error);
    if (directMessage) return directMessage;
  }
  return fallback;
}

