import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetMe, mockDeleteMe } = vi.hoisted(() => ({
  mockGetMe: vi.fn(),
  mockDeleteMe: vi.fn(),
}));

vi.mock("@/lib/services/me.service", () => {
  class MeServiceError extends Error {
    status: number;
    code: string;
    details?: Record<string, unknown>;

    constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
      super(message);
      this.name = "MeServiceError";
      this.status = status;
      this.code = code;
      this.details = details;
    }
  }

  return {
    getMe: mockGetMe,
    deleteMe: mockDeleteMe,
    MeServiceError,
  };
});

import { GET as meGet } from "@/pages/api/v1/me";

describe("me.routes", () => {
  beforeEach(() => {
    mockGetMe.mockReset();
    mockDeleteMe.mockReset();
  });

  it("me.get.validUser.returns200", async () => {
    const supabase = { name: "supabase" };

    mockGetMe.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
      stats: { flashcardsCount: 3, generationsCount: 2 },
    });

    const response = await meGet({
      locals: { supabase, user: { id: "user-1", email: "user@example.com" } },
    } as never);

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchInlineSnapshot(`
      {
        "data": {
          "stats": {
            "flashcardsCount": 3,
            "generationsCount": 2,
          },
          "user": {
            "email": "user@example.com",
            "id": "user-1",
          },
        },
      }
    `);
    expect(mockGetMe).toHaveBeenCalledWith({
      supabase,
      user: { id: "user-1", email: "user@example.com" },
    });
  });
});
