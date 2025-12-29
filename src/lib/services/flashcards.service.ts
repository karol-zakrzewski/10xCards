import type { Tables } from "@/db/database.types";
import type { SupabaseClient } from "@/db/supabase.client";
import type { FlashcardCreateCommand, FlashcardDTO, FlashcardSource } from "@/types";

export class FlashcardServiceError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "FlashcardServiceError";
  }
}

type FlashcardRow = Tables<"flashcards">;

const mapFlashcardRowToDTO = (row: FlashcardRow): FlashcardDTO => ({
  id: row.id,
  front: row.front,
  back: row.back,
  source: row.source as FlashcardSource,
  generationId: row.generation_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const createFlashcard = async (
  { supabase, userId }: { supabase: SupabaseClient; userId: string },
  command: FlashcardCreateCommand
): Promise<FlashcardDTO> => {
  const { data, error } = await supabase
    .from("flashcards")
    .insert({
      user_id: userId,
      front: command.front,
      back: command.back,
      source: command.source,
      generation_id: null,
    })
    .select("id, front, back, source, generation_id, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new FlashcardServiceError(500, "DB_ERROR", "Failed to create flashcard.", {
      hint: error?.message,
    });
  }

  return mapFlashcardRowToDTO(data as FlashcardRow);
};
