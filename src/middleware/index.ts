import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "@/db/supabase.client";

const AUTH_API_PREFIX = "/api/v1/auth";
const PROTECTED_PAGES = new Set(["/generate", "/flashcards", "/account"]);

const isPublicAsset = (pathname: string) => {
  if (pathname.startsWith("/_astro")) {
    return true;
  }
  if (pathname.startsWith("/assets")) {
    return true;
  }
  if (pathname === "/favicon.png" || pathname === "/favicon.ico") {
    return true;
  }
  if (pathname.endsWith(".xml") || pathname.endsWith(".txt")) {
    return true;
  }
  return pathname.includes(".");
};

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  const { pathname } = url;

  if (isPublicAsset(pathname)) {
    return next();
  }

  const supabase = createSupabaseServerInstance({ headers: request.headers, cookies });
  locals.supabase = supabase;

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  if (user) {
    locals.user = { id: user.id, email: user.email };
  }

  if (pathname.startsWith(AUTH_API_PREFIX)) {
    return next();
  }

  if ((pathname === "/login" || pathname === "/register") && user) {
    return redirect("/generate");
  }

  if (PROTECTED_PAGES.has(pathname)) {
    if (!user) {
      const redirectTo = encodeURIComponent(pathname);
      return redirect(`/login?redirectTo=${redirectTo}`);
    }
  }

  if (pathname.startsWith("/api/v1")) {
    if (!user) {
      return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Unauthorized." } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return next();
});
