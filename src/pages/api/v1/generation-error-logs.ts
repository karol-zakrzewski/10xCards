import type { APIRoute } from "astro";

import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { jsonError } from "@/lib/api/responses";
import { GenerationErrorLogServiceError, listGenerationErrorLogs } from "@/lib/services/generationErrorLogs.service";
import { generationErrorLogListQuerySchema } from "@/lib/validation/generationErrorLogs";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;

  const authHeader = request.headers.get("authorization");
  if (!authHeader || authHeader.trim() === "") {
    return jsonError(401, "UNAUTHORIZED", "Missing Authorization header.");
  }

  let query: ReturnType<typeof generationErrorLogListQuerySchema.parse>;
  try {
    const searchParams = Object.fromEntries(new URL(request.url).searchParams.entries());
    query = generationErrorLogListQuerySchema.parse(searchParams);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid query parameters";
    return jsonError(400, "VALIDATION_ERROR", message);
  }

  const userId = DEFAULT_USER_ID;

  try {
    const result = await listGenerationErrorLogs({
      supabase,
      userId,
      page: query.page,
      limit: query.limit,
      order: query.order,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof GenerationErrorLogServiceError) {
      return jsonError(error.status, error.code, error.message, error.details);
    }

    return jsonError(500, "INTERNAL_ERROR", "Unexpected server error.", {
      cause: error instanceof Error ? error.message : "Unknown",
    });
  }
};
