import { describe, expect, it } from "vitest";
import {
  generationCreateSchema,
  generationIdParamSchema,
  generationListQuerySchema,
} from "@/lib/validation/generations";

describe("generations.create.boundaries", () => {
  it("accepts sourceText length 1000 and 10000", () => {
    const min = "a".repeat(1000);
    const max = "b".repeat(10000);

    expect(generationCreateSchema.parse({ sourceText: min }).sourceText.length).toBe(1000);
    expect(generationCreateSchema.parse({ sourceText: max }).sourceText.length).toBe(10000);
  });

  it("rejects sourceText shorter than 1000", () => {
    const result = generationCreateSchema.safeParse({ sourceText: "a".repeat(999) });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toMatchInlineSnapshot(`
        [
          {
            "code": "too_small",
            "exact": false,
            "inclusive": true,
            "message": "sourceText must be at least 1000 characters",
            "minimum": 1000,
            "path": [
              "sourceText",
            ],
            "type": "string",
          },
        ]
      `);
    }
  });
});

describe("generations.list.defaults", () => {
  it("applies default paging and ordering", () => {
    const result = generationListQuerySchema.parse({});

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

describe("generations.idParam.validation", () => {
  it("coerces numeric string and rejects non-positive", () => {
    const ok = generationIdParamSchema.parse({ id: "5" });
    expect(ok.id).toBe(5);

    const bad = generationIdParamSchema.safeParse({ id: 0 });
    expect(bad.success).toBe(false);
  });
});
