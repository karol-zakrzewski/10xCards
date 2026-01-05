import type { APIRoute } from "astro";

import { jsonError } from "@/lib/api/responses";
import { createFlashcard, FlashcardServiceError, listFlashcards } from "@/lib/services/flashcards.service";
import { flashcardCreateSchema, flashcardListQuerySchema } from "@/lib/validation/flashcards";
import type { FlashcardCreateCommand, FlashcardDTO, PagedResponse } from "@/types";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;
  const user = locals.user;

  if (!user) {
    return jsonError(401, "UNAUTHORIZED", "Missing authenticated user.");
  }

  let body: FlashcardCreateCommand;
  try {
    const json = await request.json();
    const parsed = flashcardCreateSchema.parse(json);
    body = {
      front: parsed.front,
      back: parsed.back,
      source: "manual",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request body";
    return jsonError(400, "VALIDATION_ERROR", message);
  }

  try {
    const flashcard = await createFlashcard({ supabase, userId: user.id }, body);

    return new Response(JSON.stringify({ data: flashcard }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof FlashcardServiceError) {
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

  let query: ReturnType<typeof flashcardListQuerySchema.parse>;
  try {
    const searchParams = Object.fromEntries(new URL(request.url).searchParams.entries());
    query = flashcardListQuerySchema.parse(searchParams);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid query parameters";
    return jsonError(400, "VALIDATION_ERROR", message);
  }

  try {
    const result: PagedResponse<FlashcardDTO> = await listFlashcards({
      supabase,
      userId: user.id,
      page: query.page,
      limit: query.limit,
      order: query.order,
      sort: query.sort,
      source: query.source,
      generationId: query.generationId,
      q: query.q,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof FlashcardServiceError) {
      return jsonError(error.status, error.code, error.message, error.details);
    }

    return jsonError(500, "INTERNAL_ERROR", "Unexpected server error.", {
      cause: error instanceof Error ? error.message : "Unknown",
    });
  }
};
