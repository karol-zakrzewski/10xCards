import type { ErrorResponse } from "@/types";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: Record<string, unknown>;

  constructor(status: number, message: string, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const getAuthorizationHeader = (): Record<string, string> => {
  if (typeof window === "undefined") {
    return {};
  }

  const candidates = [
    window.localStorage.getItem("supabase_access_token"),
    window.localStorage.getItem("access_token"),
    window.localStorage.getItem("sb-access-token"),
  ].filter(Boolean);

  const token = candidates[0];
  const value = token ? `Bearer ${token}` : "Bearer dev";
  return { Authorization: value };
};

export const fetchJson = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (response.ok) {
    if (!isJson) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  let parsedError: ErrorResponse | null = null;
  if (isJson) {
    try {
      parsedError = (await response.json()) as ErrorResponse;
    } catch {
      parsedError = null;
    }
  }

  if (parsedError?.error) {
    throw new ApiError(response.status, parsedError.error.message, parsedError.error.code, parsedError.error.details);
  }

  throw new ApiError(response.status, response.statusText || "Request failed");
};
