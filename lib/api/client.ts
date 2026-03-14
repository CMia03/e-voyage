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
      const message = payload.message || "Request failed";
      throw new ApiError(message, response.status, payload);
    }

    return payload as T;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const payload = error.response.data;
      const message = 
        (payload as ApiEnvelope | null)?.message || 
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
  if (error instanceof ApiError) return error.message || fallback;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    return message || fallback;
  }
  return fallback;
}

