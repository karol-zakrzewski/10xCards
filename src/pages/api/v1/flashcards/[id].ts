import type { APIRoute } from "astro";

import { jsonError } from "@/lib/api/responses";
import {
  deleteFlashcard,
  FlashcardServiceError,
  getFlashcardById,
  updateFlashcard,
} from "@/lib/services/flashcards.service";
import { flashcardIdParamSchema, flashcardUpdateSchema } from "@/lib/validation/flashcards";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;
  const user = locals.user;

  if (!user) {
    return jsonError(401, "UNAUTHORIZED", "Missing authenticated user.");
  }

  const parsed = flashcardIdParamSchema.safeParse(params);
  if (!parsed.success) {
    const message = parsed.error.errors.at(0)?.message ?? "Invalid path parameter";
    return jsonError(400, "VALIDATION_ERROR", message);
  }

  try {
    const flashcard = await getFlashcardById({ supabase, userId: user.id, id: parsed.data.id });
    return new Response(JSON.stringify({ data: flashcard }), {
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

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const supabase = locals.supabase;
  const user = locals.user;

  if (!user) {
    return jsonError(401, "UNAUTHORIZED", "Missing authenticated user.");
  }

  const parsedParams = flashcardIdParamSchema.safeParse(params);
  if (!parsedParams.success) {
    const message = parsedParams.error.errors.at(0)?.message ?? "Invalid path parameter";
    return jsonError(400, "VALIDATION_ERROR", message);
  }

  let body;
  try {
    const json = await request.json();
    const parsedBody = flashcardUpdateSchema.parse(json);
    body = parsedBody;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request body";
    return jsonError(400, "VALIDATION_ERROR", message);
  }

  try {
    const flashcard = await updateFlashcard({ supabase, userId: user.id }, parsedParams.data.id, body);
    return new Response(JSON.stringify({ data: flashcard }), {
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

export const DELETE: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;
  const user = locals.user;

  if (!user) {
    return jsonError(401, "UNAUTHORIZED", "Missing authenticated user.");
  }

  const parsed = flashcardIdParamSchema.safeParse(params);
  if (!parsed.success) {
    const message = parsed.error.errors.at(0)?.message ?? "Invalid path parameter";
    return jsonError(400, "VALIDATION_ERROR", message);
  }

  try {
    const result = await deleteFlashcard({ supabase, userId: user.id }, parsed.data.id);
    return new Response(JSON.stringify({ data: result }), {
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
