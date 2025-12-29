import type { APIRoute } from "astro";

import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { jsonError } from "@/lib/api/responses";
import { getGenerationById, GenerationServiceError } from "@/lib/services/generations.service";
import { generationIdParamSchema } from "@/lib/validation/generations";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;

  const parsed = generationIdParamSchema.safeParse(params);
  if (!parsed.success) {
    const message = parsed.error.errors.at(0)?.message ?? "Invalid path parameter";
    return jsonError(400, "VALIDATION_ERROR", message);
  }
  const id = parsed.data.id;

  // TODO: replace DEFAULT_USER_ID with authenticated user id when auth is wired.
  const userId = DEFAULT_USER_ID;

  try {
    const generation = await getGenerationById({ supabase, userId, id });

    return new Response(JSON.stringify({ data: generation }), {
      status: 200,
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
