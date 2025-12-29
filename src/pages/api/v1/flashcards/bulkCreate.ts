import type { APIRoute } from "astro";

import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { jsonError } from "@/lib/api/responses";
import { bulkCreateFlashcards, FlashcardServiceError } from "@/lib/services/flashcards.service";
import { bulkFlashcardsCreateSchema } from "@/lib/validation/flashcards";
import type { BulkFlashcardsCreateCommand } from "@/types";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;

  const authHeader = request.headers.get("authorization");
  if (!authHeader || authHeader.trim() === "") {
    return jsonError(401, "UNAUTHORIZED", "Missing Authorization header.");
  }

  let body: BulkFlashcardsCreateCommand;
  try {
    const json = await request.json();
    const parsed = bulkFlashcardsCreateSchema.parse(json);
    body = {
      generationId: parsed.generationId,
      items: parsed.items.map((item) => ({
        front: item.front,
        back: item.back,
        source: item.source,
      })),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request body";
    return jsonError(400, "VALIDATION_ERROR", message);
  }

  const userId = DEFAULT_USER_ID; // TODO: replace with authenticated user id when auth is added

  try {
    const result = await bulkCreateFlashcards({ supabase, userId }, body);

    return new Response(JSON.stringify({ data: result }), {
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
