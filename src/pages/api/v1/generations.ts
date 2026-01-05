import type { APIRoute } from "astro";

import type { GenerationCreateCommand, GenerationListItemDTO, PagedResponse } from "@/types";
import { jsonError } from "@/lib/api/responses";
import { generateFromText, GenerationServiceError, listGenerations } from "@/lib/services/generations.service";
import { generationCreateSchema, generationListQuerySchema } from "@/lib/validation/generations";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;
  const user = locals.user;

  if (!user) {
    return jsonError(401, "UNAUTHORIZED", "Missing authenticated user.");
  }
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
      userId: user.id,
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

export const GET: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;
  const user = locals.user;

  if (!user) {
    return jsonError(401, "UNAUTHORIZED", "Missing authenticated user.");
  }

  let query: ReturnType<typeof generationListQuerySchema.parse>;
  try {
    const searchParams = Object.fromEntries(new URL(request.url).searchParams.entries());
    query = generationListQuerySchema.parse(searchParams);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid query parameters";
    return jsonError(400, "VALIDATION_ERROR", message);
  }

  try {
    const result: PagedResponse<GenerationListItemDTO> = await listGenerations({
      supabase,
      userId: user.id,
      page: query.page,
      limit: query.limit,
      order: query.order,
    });

    return new Response(JSON.stringify(result), {
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
