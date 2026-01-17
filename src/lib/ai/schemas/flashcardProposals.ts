import { z } from "zod";

export const flashcardProposalsSchema = z
  .object({
    proposals: z
      .array(
        z
          .object({
            front: z.string().trim().min(1).max(200),
            back: z.string().trim().min(1).max(500),
          })
          .strict()
      )
      .min(1)
      .max(12),
  })
  .strict();

export type FlashcardProposalsResponse = z.infer<typeof flashcardProposalsSchema>;

export const flashcardProposalsJsonSchema = {
  name: "flashcards_proposals_v1",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      proposals: {
        type: "array",
        minItems: 1,
        maxItems: 12,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            front: { type: "string", minLength: 1, maxLength: 200 },
            back: { type: "string", minLength: 1, maxLength: 500 },
          },
          required: ["front", "back"],
        },
      },
    },
    required: ["proposals"],
  },
} as const;

export const flashcardProposalsResponseFormat = {
  type: "json_schema",
  json_schema: flashcardProposalsJsonSchema,
} as const;
