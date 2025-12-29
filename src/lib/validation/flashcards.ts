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
