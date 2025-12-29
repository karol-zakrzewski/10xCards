import type { APIRoute } from "astro";

import type { ErrorResponse, GenerationCreateCommand } from "@/types";
import { DEFAULT_USER_ID, supabaseClient } from "@/db/supabase.client";
import { generateFromText, GenerationServiceError } from "@/lib/services/generations.service";
import { generationCreateSchema } from "@/lib/validation/generations";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const supabase = supabaseClient;

  let body: GenerationCreateCommand;
  try {
    const json = await request.json();
    const parsed = generationCreateSchema.parse(json);
    body = { sourceText: parsed.sourceText };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request body";
    return jsonError(400, "VALIDATION_ERROR", message);
  }

  try {
    const result = await generateFromText(body, {
      supabase,
      userId: DEFAULT_USER_ID,
    });

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof GenerationServiceError) {
      return jsonError(error.status, error.code, error.message, error.details);
    }

    return jsonError(500, "INTERNAL_ERROR", "Unexpected server error.", {
      cause: error instanceof Error ? error.message : "Unknown",
    });
  }
};

function jsonError(status: number, code: string, message: string, details?: Record<string, unknown>) {
  const payload: ErrorResponse = { error: { code, message, ...(details ? { details } : {}) } };
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
