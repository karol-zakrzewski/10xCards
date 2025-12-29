import type { ErrorResponse } from "@/types";

export const jsonError = (status: number, code: string, message: string, details?: Record<string, unknown>) => {
  const payload: ErrorResponse = { error: { code, message, ...(details ? { details } : {}) } };
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
};
