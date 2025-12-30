import { z } from "zod";

export const flashcardCreateSchema = z.object({
  front: z
    .string({ required_error: "front is required", invalid_type_error: "front must be a string" })
    .trim()
    .min(1, "front must be at least 1 character")
    .max(200, "front must be at most 200 characters"),
  back: z
    .string({ required_error: "back is required", invalid_type_error: "back must be a string" })
    .trim()
    .min(1, "back must be at least 1 character")
    .max(500, "back must be at most 500 characters"),
});

export type FlashcardCreateInput = z.infer<typeof flashcardCreateSchema>;

export const flashcardUpdateSchema = z.object({
  front: flashcardCreateSchema.shape.front,
  back: flashcardCreateSchema.shape.back,
});

export const flashcardIdParamSchema = z.object({
  id: z.string({ required_error: "id is required" }).uuid("id must be a valid UUID"),
});

export const flashcardListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(200).optional(),
  source: z.enum(["ai-full", "ai-edited", "manual"]).optional(),
  generationId: z.coerce
    .number({ invalid_type_error: "generationId must be a number" })
    .int("generationId must be an integer")
    .positive("generationId must be greater than 0")
    .refine(Number.isSafeInteger, "generationId is too large")
    .optional(),
  sort: z.enum(["created_at", "updated_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type FlashcardListQuery = z.infer<typeof flashcardListQuerySchema>;

export const bulkFlashcardsCreateSchema = z.object({
  generationId: z.coerce
    .number({ required_error: "generationId is required", invalid_type_error: "generationId must be a number" })
    .int("generationId must be an integer")
    .positive("generationId must be greater than 0")
    .refine(Number.isSafeInteger, "generationId is too large"),
  items: z
    .array(
      z.object({
        front: flashcardCreateSchema.shape.front,
        back: flashcardCreateSchema.shape.back,
        source: z.enum(["ai-full", "ai-edited"]),
      })
    )
    .min(1, "items must contain at least one flashcard")
    .max(100, "items must not exceed 100 flashcards"),
});

export type BulkFlashcardsCreateInput = z.infer<typeof bulkFlashcardsCreateSchema>;
