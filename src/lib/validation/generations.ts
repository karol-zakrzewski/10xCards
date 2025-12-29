import { z } from "zod";

export const generationCreateSchema = z.object({
  sourceText: z
    .string({ required_error: "sourceText is required", invalid_type_error: "sourceText must be a string" })
    .trim()
    .min(1000, "sourceText must be at least 1000 characters")
    .max(10000, "sourceText must be at most 10000 characters"),
});

export type GenerationCreateInput = z.infer<typeof generationCreateSchema>;
