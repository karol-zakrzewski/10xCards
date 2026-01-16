import { describe, expect, it } from "vitest";
import {
  bulkFlashcardsCreateSchema,
  flashcardCreateSchema,
  flashcardListQuerySchema,
} from "@/lib/validation/flashcards";

describe("flashcards.create.validInput.trimsAndParses", () => {
  it("parses and trims front/back", () => {
    const result = flashcardCreateSchema.parse({
      front: "  Pytanie  ",
      back: "  Odpowiedz  ",
    });

    expect(result).toEqual({
      front: "Pytanie",
      back: "Odpowiedz",
    });
  });
});

describe("flashcards.create.invalidFrontTooLong", () => {
  it("rejects front longer than 200", () => {
    const result = flashcardCreateSchema.safeParse({
      front: "a".repeat(201),
      back: "ok",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toMatchInlineSnapshot(`
        [
          {
            "code": "too_big",
            "exact": false,
            "inclusive": true,
            "maximum": 200,
            "message": "front must be at most 200 characters",
            "path": [
              "front",
            ],
            "type": "string",
          },
        ]
      `);
    }
  });
});

describe("flashcards.list.defaults", () => {
  it("applies default paging and ordering", () => {
    const result = flashcardListQuerySchema.parse({});

    expect(result).toMatchInlineSnapshot(`
      {
        "limit": 20,
        "order": "desc",
        "page": 1,
        "sort": "created_at",
      }
    `);
  });
});

describe("flashcards.bulkCreate.items.validation", () => {
  it("rejects empty items array", () => {
    const result = bulkFlashcardsCreateSchema.safeParse({
      generationId: 1,
      items: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toMatchInlineSnapshot(`
        [
          {
            "code": "too_small",
            "exact": false,
            "inclusive": true,
            "message": "items must contain at least one flashcard",
            "minimum": 1,
            "path": [
              "items",
            ],
            "type": "array",
          },
        ]
      `);
    }
  });
});
