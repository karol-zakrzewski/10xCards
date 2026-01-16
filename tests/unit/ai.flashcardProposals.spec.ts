import { describe, expect, it } from "vitest";
import { flashcardProposalsSchema } from "@/lib/ai/schemas/flashcardProposals";

describe("ai.flashcardProposals.strictness", () => {
  it("rejects extra fields in proposal", () => {
    const result = flashcardProposalsSchema.safeParse({
      proposals: [
        {
          front: "Pytanie",
          back: "Odpowiedz",
          extra: "nope",
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toMatchInlineSnapshot(`
        [
          {
            "code": "unrecognized_keys",
            "keys": [
              "extra",
            ],
            "message": "Unrecognized key(s) in object: 'extra'",
            "path": [
              "proposals",
              0,
            ],
          },
        ]
      `);
    }
  });
});
