import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGenerateFromText, mockListGenerations, mockGetGenerationById } = vi.hoisted(() => ({
  mockGenerateFromText: vi.fn(),
  mockListGenerations: vi.fn(),
  mockGetGenerationById: vi.fn(),
}));

vi.mock("@/lib/services/generations.service", () => {
  class GenerationServiceError extends Error {
    status: number;
    code: string;
    details?: Record<string, unknown>;

    constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
      super(message);
      this.name = "GenerationServiceError";
      this.status = status;
      this.code = code;
      this.details = details;
    }
  }

  return {
    generateFromText: mockGenerateFromText,
    listGenerations: mockListGenerations,
    getGenerationById: mockGetGenerationById,
    GenerationServiceError,
  };
});

import { GET as generationByIdGet } from "@/pages/api/v1/generations/[id]";
import { POST as generationsPost } from "@/pages/api/v1/generations";

describe("generations.routes", () => {
  beforeEach(() => {
    mockGenerateFromText.mockReset();
    mockListGenerations.mockReset();
    mockGetGenerationById.mockReset();
  });

  it("generations.create.validBody.returns201", async () => {
    const supabase = { name: "supabase" };
    const sourceText = "a".repeat(1000);

    mockGenerateFromText.mockResolvedValue({
      generation: {
        id: 10,
        generatedCount: 2,
        generationDurationMs: 120,
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      proposals: [
        { front: "Pytanie 1", back: "Odpowiedz 1" },
        { front: "Pytanie 2", back: "Odpowiedz 2" },
      ],
    });

    const request = new Request("http://localhost/api/v1/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceText }),
    });

    const response = await generationsPost({
      request,
      locals: { supabase, user: { id: "user-1" } },
    } as never);

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchInlineSnapshot(`
      {
        "generation": {
          "createdAt": "2024-01-01T00:00:00.000Z",
          "generatedCount": 2,
          "generationDurationMs": 120,
          "id": 10,
        },
        "proposals": [
          {
            "back": "Odpowiedz 1",
            "front": "Pytanie 1",
          },
          {
            "back": "Odpowiedz 2",
            "front": "Pytanie 2",
          },
        ],
      }
    `);
    expect(mockGenerateFromText).toHaveBeenCalledWith({ sourceText }, { supabase, userId: "user-1" });
  });

  it("generations.getById.invalidParam.returns400", async () => {
    const response = await generationByIdGet({
      params: { id: "not-a-number" },
      locals: { supabase: {}, user: { id: "user-1" } },
    } as never);

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchInlineSnapshot(`
      {
        "error": {
          "code": "VALIDATION_ERROR",
          "message": "id must be a number",
        },
      }
    `);
  });
});
