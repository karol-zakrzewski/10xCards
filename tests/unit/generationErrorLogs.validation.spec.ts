import { describe, expect, it } from "vitest";
import { generationErrorLogListQuerySchema } from "@/lib/validation/generationErrorLogs";

describe("generationErrorLogs.list.defaults", () => {
  it("applies default paging and ordering", () => {
    const result = generationErrorLogListQuerySchema.parse({});

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
