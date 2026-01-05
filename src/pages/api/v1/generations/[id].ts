import type { APIRoute } from "astro";

import { jsonError } from "@/lib/api/responses";
import { getGenerationById, GenerationServiceError } from "@/lib/services/generations.service";
import { generationIdParamSchema } from "@/lib/validation/generations";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;
  const user = locals.user;

  if (!user) {
    return jsonError(401, "UNAUTHORIZED", "Missing authenticated user.");
  }

  const parsed = generationIdParamSchema.safeParse(params);
  if (!parsed.success) {
    const message = parsed.error.errors.at(0)?.message ?? "Invalid path parameter";
    return jsonError(400, "VALIDATION_ERROR", message);
  }
  const id = parsed.data.id;

  try {
    const generation = await getGenerationById({ supabase, userId: user.id, id });

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
