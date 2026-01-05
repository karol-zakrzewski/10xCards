import type { APIRoute } from "astro";

import { createSupabaseServerInstance } from "@/db/supabase.client";
import { jsonError } from "@/lib/api/responses";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerInstance({ headers: request.headers, cookies });
  const { error } = await supabase.auth.signOut();

  if (error) {
    return jsonError(500, "AUTH_ERROR", "Nie udało się wylogować.");
  }

  return new Response(JSON.stringify({ data: { signedOut: true } }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
