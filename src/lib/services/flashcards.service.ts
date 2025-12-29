import type { Tables } from "@/db/database.types";
import type { SupabaseClient } from "@/db/supabase.client";
import type {
  BulkFlashcardsCreateCommand,
  BulkFlashcardsCreateResultDTO,
  FlashcardCreateCommand,
  FlashcardDTO,
  FlashcardSource,
} from "@/types";

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

interface ListFlashcardsParams {
  supabase: SupabaseClient;
  userId: string;
  page: number;
  limit: number;
  order: "asc" | "desc";
  sort: "created_at" | "updated_at";
  source?: FlashcardSource;
  generationId?: number;
  q?: string;
}

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

export const listFlashcards = async ({
  supabase,
  userId,
  page,
  limit,
  order,
  sort,
  source,
  generationId,
  q,
}: ListFlashcardsParams) => {
  const offset = (page - 1) * limit;

  let query = supabase
    .from("flashcards")
    .select("id, front, back, source, generation_id, created_at, updated_at", { count: "exact" })
    .eq("user_id", userId)
    .order(sort, { ascending: order === "asc" })
    .range(offset, offset + limit - 1);

  if (source) {
    query = query.eq("source", source);
  }

  if (typeof generationId === "number") {
    query = query.eq("generation_id", generationId);
  }

  if (q) {
    const pattern = `%${q}%`;
    query = query.or(`front.ilike.${pattern},back.ilike.${pattern}`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new FlashcardServiceError(500, "DB_ERROR", "Failed to list flashcards.", { hint: error.message });
  }

  const rows = (data ?? []) as FlashcardRow[];

  return {
    data: rows.map(mapFlashcardRowToDTO),
    page: {
      page,
      limit,
      total: count ?? 0,
    },
  };
};

export const bulkCreateFlashcards = async (
  { supabase, userId }: { supabase: SupabaseClient; userId: string },
  command: BulkFlashcardsCreateCommand
): Promise<BulkFlashcardsCreateResultDTO> => {
  const { data: generationRow, error: generationError } = await supabase
    .from("generations")
    .select("id, accepted_unedited_count, accepted_edited_count, user_id")
    .eq("id", command.generationId)
    .eq("user_id", userId)
    .single();

  if (generationError) {
    if (generationError.code === "PGRST116") {
      throw new FlashcardServiceError(404, "NOT_FOUND", "Generation not found.");
    }
    throw new FlashcardServiceError(500, "DB_ERROR", "Failed to fetch generation.", { hint: generationError.message });
  }

  if (!generationRow) {
    throw new FlashcardServiceError(404, "NOT_FOUND", "Generation not found.");
  }

  const inserts = command.items.map((item) => ({
    user_id: userId,
    generation_id: command.generationId,
    front: item.front,
    back: item.back,
    source: item.source,
  }));

  const { data: insertedRows, error: insertError } = await supabase
    .from("flashcards")
    .insert(inserts)
    .select("id, front, back, source, generation_id, created_at, updated_at");

  if (insertError || !insertedRows) {
    throw new FlashcardServiceError(500, "DB_ERROR", "Failed to create flashcards.", { hint: insertError?.message });
  }

  const acceptedUneditedDelta = command.items.filter((item) => item.source === "ai-full").length;
  const acceptedEditedDelta = command.items.filter((item) => item.source === "ai-edited").length;

  const { error: updateError } = await supabase
    .from("generations")
    .update({
      accepted_unedited_count: (generationRow.accepted_unedited_count ?? 0) + acceptedUneditedDelta,
      accepted_edited_count: (generationRow.accepted_edited_count ?? 0) + acceptedEditedDelta,
    })
    .eq("id", command.generationId)
    .eq("user_id", userId);

  if (updateError) {
    throw new FlashcardServiceError(500, "DB_ERROR", "Failed to update generation stats.", {
      hint: updateError.message,
    });
  }

  return {
    created: (insertedRows as FlashcardRow[]).map(mapFlashcardRowToDTO),
    generation: {
      id: generationRow.id,
      acceptedUneditedCount: (generationRow.accepted_unedited_count ?? 0) + acceptedUneditedDelta,
      acceptedEditedCount: (generationRow.accepted_edited_count ?? 0) + acceptedEditedDelta,
      updatedAt: new Date().toISOString(),
    },
  };
};
