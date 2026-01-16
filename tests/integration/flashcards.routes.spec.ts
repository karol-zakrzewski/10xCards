import { describe, expect, it } from "vitest";

import { GET as flashcardsGet } from "@/pages/api/v1/flashcards";

const makeRequest = (url: string) =>
  new Request(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

describe("flashcards.routes", () => {
  it("flashcards.list.missingUser.returns401", async () => {
    const request = makeRequest("http://localhost/api/v1/flashcards");

    const response = await flashcardsGet({ request, locals: { supabase: {}, user: null } } as never);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchInlineSnapshot(`
      {
        "error": {
          "code": "UNAUTHORIZED",
          "message": "Missing authenticated user.",
        },
      }
    `);
  });
});
