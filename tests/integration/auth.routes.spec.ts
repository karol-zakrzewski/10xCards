import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSignUp, mockSignIn, createSupabaseServerInstance } = vi.hoisted(() => {
  const mockSignUp = vi.fn();
  const mockSignIn = vi.fn();
  const createSupabaseServerInstance = vi.fn(() => ({
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignIn,
    },
  }));

  return { mockSignUp, mockSignIn, createSupabaseServerInstance };
});

vi.mock("@/db/supabase.client", () => ({ createSupabaseServerInstance }));

import { POST as signUpPost } from "@/pages/api/v1/auth/sign-up";
import { POST as signInPost } from "@/pages/api/v1/auth/sign-in";

const makeCookies = () => ({
  get: () => undefined,
  set: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
  delete: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
});

describe("auth.routes", () => {
  beforeEach(() => {
    mockSignUp.mockReset();
    mockSignIn.mockReset();
    createSupabaseServerInstance.mockClear();
  });

  it("auth.signUp.invalidBody.returns400", async () => {
    const request = new Request("http://localhost/api/v1/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "123456" }),
    });

    const response = await signUpPost({ request, cookies: makeCookies() } as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toContain("Invalid email");
    expect(createSupabaseServerInstance).not.toHaveBeenCalled();
  });

  it("auth.signIn.validBody.returnsUser", async () => {
    mockSignIn.mockResolvedValue({
      data: { user: { id: "user-1", email: "user@example.com" } },
      error: null,
    });

    const request = new Request("http://localhost/api/v1/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com", password: "secret123" }),
    });

    const response = await signInPost({ request, cookies: makeCookies() } as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchInlineSnapshot(`
      {
        "data": {
          "user": {
            "email": "user@example.com",
            "id": "user-1",
          },
        },
      }
    `);
    expect(mockSignIn).toHaveBeenCalledOnce();
  });
});
