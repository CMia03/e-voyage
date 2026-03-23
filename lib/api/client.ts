import { API_BASE_URL } from "@/lib/api";
import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';


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
  const headers = buildHeaders(options);
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
    
    // Gérer les erreurs réseau ou autres
    throw new ApiError(
      error instanceof Error ? error.message : "Request failed",
      500,
      null
    );
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

