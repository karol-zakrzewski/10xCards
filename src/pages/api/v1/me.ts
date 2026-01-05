import { z } from "zod";
import type { APIRoute } from "astro";

import { jsonError } from "@/lib/api/responses";
import { deleteMe, getMe, MeServiceError } from "@/lib/services/me.service";

export const prerender = false;

const deleteMeSchema = z.object({
  confirm: z.boolean().optional(),
});

export const GET: APIRoute = async ({ locals }) => {
  const supabase = locals.supabase;
  const user = locals.user;

  if (!user) {
    return jsonError(401, "UNAUTHORIZED", "Missing authenticated user.");
  }

  try {
    const result = await getMe({ supabase, user });
    return new Response(JSON.stringify({ data: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof MeServiceError) {
      return jsonError(error.status, error.code, error.message, error.details);
    }
    return jsonError(500, "INTERNAL_ERROR", "Unexpected server error.", {
      cause: error instanceof Error ? error.message : "Unknown",
    });
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;
  const user = locals.user;

  if (!user) {
    return jsonError(401, "UNAUTHORIZED", "Missing authenticated user.");
  }

  let confirm = false;
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = deleteMeSchema.parse(json);
    confirm = parsed.confirm ?? false;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request body";
    return jsonError(400, "VALIDATION_ERROR", message);
  }

  if (!confirm) {
    return jsonError(400, "VALIDATION_ERROR", "Account deletion requires confirm=true.");
  }

  try {
    const result = await deleteMe({ userSupabase: supabase, userId: user.id });
    return new Response(JSON.stringify({ data: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof MeServiceError) {
      return jsonError(error.status, error.code, error.message, error.details);
    }
    return jsonError(500, "INTERNAL_ERROR", "Unexpected server error.", {
      cause: error instanceof Error ? error.message : "Unknown",
    });
  }
};
