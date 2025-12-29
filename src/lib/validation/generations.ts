import { z } from "zod";

export const generationCreateSchema = z.object({
  sourceText: z
    .string({ required_error: "sourceText is required", invalid_type_error: "sourceText must be a string" })
    .trim()
    .min(1000, "sourceText must be at least 1000 characters")
    .max(10000, "sourceText must be at most 10000 characters"),
});

export type GenerationCreateInput = z.infer<typeof generationCreateSchema>;

export const generationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["created_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type GenerationListQuery = z.infer<typeof generationListQuerySchema>;

export const generationIdParamSchema = z.object({
  id: z.coerce
    .number({ required_error: "id is required", invalid_type_error: "id must be a number" })
    .int("id must be an integer")
    .positive("id must be greater than 0")
    .refine(Number.isSafeInteger, "id is too large"),
});

export type GenerationIdParam = z.infer<typeof generationIdParamSchema>;
