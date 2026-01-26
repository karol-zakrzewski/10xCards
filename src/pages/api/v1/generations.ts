import type { APIRoute } from "astro";

import type { GenerationCreateCommand, GenerationListItemDTO, PagedResponse } from "@/types";
import { jsonError } from "@/lib/api/responses";
import { generateFromText, GenerationServiceError, listGenerations } from "@/lib/services/generations.service";
import { generationCreateSchema, generationListQuerySchema } from "@/lib/validation/generations";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;
  const user = locals.user;
  const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  console.info("[generations:POST] start", {
    requestId,
    url: request.url,
    contentLength: request.headers.get("content-length"),
    hasUser: Boolean(user),
    userId: user?.id,
  });

  if (!user) {
    return jsonError(401, "UNAUTHORIZED", "Missing authenticated user.");
  }
  let body: GenerationCreateCommand;
  try {
    const json = await request.json();
    const parsed = generationCreateSchema.parse(json);
    body = { sourceText: parsed.sourceText };
    console.info("[generations:POST] parsed body", { requestId, sourceTextLength: body.sourceText.length });
  } catch (error) {
    console.error("[generations:POST] invalid body", {
      requestId,
      error: error instanceof Error ? { name: error.name, message: error.message } : error,
    });
    const message = error instanceof Error ? error.message : "Invalid request body";
    return jsonError(400, "VALIDATION_ERROR", message);
  }

  try {
    console.info("[generations:POST] calling generateFromText", { requestId });
    const result = await generateFromText(body, {
      supabase,
      userId: user.id,
    });

    console.info("[generations:POST] success", {
      requestId,
      generationId: result.generation.id,
      generatedCount: result.generation.generatedCount,
    });
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[generations:POST] error", {
      requestId,
      error:
        error instanceof GenerationServiceError
          ? { name: error.name, code: error.code, message: error.message, status: error.status, details: error.details }
          : error instanceof Error
            ? { name: error.name, message: error.message }
            : error,
    });
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
