import { z } from "zod";
import type { APIRoute } from "astro";

import { createSupabaseServerInstance } from "@/db/supabase.client";
import { jsonError } from "@/lib/api/responses";

export const prerender = false;

const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  let payload: z.infer<typeof signInSchema>;
  try {
    payload = signInSchema.parse(await request.json());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request body.";
    return jsonError(400, "VALIDATION_ERROR", message);
  }

  const supabase = createSupabaseServerInstance({ headers: request.headers, cookies });
  const { data, error } = await supabase.auth.signInWithPassword(payload);

  if (error || !data.user) {
    return jsonError(401, "AUTH_ERROR", "Nieprawidłowy e-mail lub hasło.");
  }

  return new Response(
    JSON.stringify({
      data: {
        user: {
          id: data.user.id,
          email: data.user.email ?? "",
        },
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
