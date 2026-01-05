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
  return {};
};

export const fetchJson = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const { headers, credentials, ...rest } = init ?? {};
  const response = await fetch(input, {
    ...rest,
    headers,
    credentials: credentials ?? "include",
  });
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
