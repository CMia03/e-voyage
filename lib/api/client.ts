import { API_BASE_URL } from "@/lib/api";

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
  let body = options.body;

  if (shouldJsonStringify(body)) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: body as BodyInit | null | undefined,
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      (payload as ApiEnvelope | null)?.message ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  if ((payload as ApiEnvelope | null)?.success === false) {
    const message =
      (payload as ApiEnvelope | null)?.message || "Request failed";
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message || fallback;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    return message || fallback;
  }
  return fallback;
}

