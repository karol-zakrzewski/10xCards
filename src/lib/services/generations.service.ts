import { createHash, randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

import type { Tables } from "@/db/database.types";
import type { SupabaseClient } from "@/db/supabase.client";
import type {
  FlashcardProposalDTO,
  GenerationCreateCommand,
  GenerationListItemDTO,
  GenerationSummaryDTO,
  PagedResponse,
} from "@/types";

const DEFAULT_MODEL = "openrouter/mock-gpt";

export class GenerationServiceError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "GenerationServiceError";
  }
}

interface GenerateFromTextOptions {
  supabase: SupabaseClient;
  userId: string;
  model?: string;
}

export interface GenerationResult {
  generation: GenerationSummaryDTO;
  proposals: FlashcardProposalDTO[];
}

interface ListGenerationsParams {
  supabase: SupabaseClient;
  userId: string;
  page: number;
  limit: number;
  order: "asc" | "desc";
}

type GenerationListRow = Pick<
  Tables<"generations">,
  | "id"
  | "model"
  | "generated_count"
  | "accepted_unedited_count"
  | "accepted_edited_count"
  | "source_text_length"
  | "generation_duration"
  | "created_at"
>;

const mapGenerationRowToDTO = (row: GenerationListRow): GenerationListItemDTO => ({
  id: row.id,
  model: row.model,
  generatedCount: row.generated_count,
  acceptedUneditedCount: row.accepted_unedited_count,
  acceptedEditedCount: row.accepted_edited_count,
  sourceTextLength: row.source_text_length,
  generationDurationMs: row.generation_duration,
  createdAt: row.created_at,
});

export const generateFromText = async (
  command: GenerationCreateCommand,
  { supabase, userId, model = DEFAULT_MODEL }: GenerateFromTextOptions
): Promise<GenerationResult> => {
  const sourceText = command.sourceText.trim();
  const sourceTextLength = sourceText.length;
  const sourceTextHash = createHash("md5").update(sourceText).digest("hex");

  const startedAt = performance.now();

  let proposals: FlashcardProposalDTO[];
  try {
    proposals = await mockGenerateProposals();
  } catch (error) {
    await logGenerationError(supabase, {
      userId,
      model,
      sourceTextHash,
      sourceTextLength,
      error,
    });

    throw new GenerationServiceError(502, "PROVIDER_ERROR", "The AI provider failed to generate flashcards.", {
      cause: normalizeError(error),
    });
  }

  const generationDurationMs = Math.max(1, Math.round(performance.now() - startedAt));
  const generatedCount = proposals.length;

  const { data: generationRow, error: generationInsertError } = await supabase
    .from("generations")
    .insert({
      user_id: userId,
      model,
      generated_count: generatedCount,
      generation_duration: generationDurationMs,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
    })
    .select("id, generated_count, generation_duration, created_at")
    .single();

  if (generationInsertError || !generationRow) {
    throw new GenerationServiceError(500, "INTERNAL_ERROR", "Failed to save generation metrics.", {
      hint: generationInsertError?.message,
    });
  }

  return {
    generation: {
      id: generationRow.id,
      generatedCount: generationRow.generated_count,
      generationDurationMs: generationRow.generation_duration,
      createdAt: generationRow.created_at,
    },
    proposals,
  };
};

export const listGenerations = async ({
  supabase,
  userId,
  page,
  limit,
  order,
}: ListGenerationsParams): Promise<PagedResponse<GenerationListItemDTO>> => {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from("generations")
    .select(
      "id, model, generated_count, accepted_unedited_count, accepted_edited_count, source_text_length, generation_duration, created_at",
      { count: "exact" }
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: order === "asc" })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new GenerationServiceError(500, "DB_ERROR", "Failed to list generations.", { hint: error.message });
  }

  const rows = (data ?? []) as GenerationListRow[];
  const mapped = rows.map(mapGenerationRowToDTO);

  return {
    data: mapped,
    page: {
      page,
      limit,
      total: count ?? 0,
    },
  };
};

const normalizeError = (error: unknown): { message: string; name?: string } => {
  if (error instanceof Error) {
    return { message: error.message, name: error.name };
  }
  return { message: "Unknown error" };
};

const mockGenerateProposals = async (): Promise<FlashcardProposalDTO[]> => {
  const template = [
    { front: "Key insight 1", back: "Mock answer for insight 1" },
    { front: "Key insight 2", back: "Mock answer for insight 2" },
    { front: "Key insight 3", back: "Mock answer for insight 3" },
  ];

  return template.map((item) => ({
    id: randomUUID(),
    front: item.front,
    back: item.back,
    source: "ai-full",
  }));
};

const logGenerationError = async (
  supabase: SupabaseClient,
  {
    userId,
    model,
    sourceTextHash,
    sourceTextLength,
    error,
  }: {
    userId: string;
    model: string;
    sourceTextHash: string;
    sourceTextLength: number;
    error: unknown;
  }
) => {
  const { message: errorMessage } = normalizeError(error);
  await supabase.from("generation_error_logs").insert({
    user_id: userId,
    model,
    source_text_hash: sourceTextHash,
    source_text_length: sourceTextLength,
    error_code: "PROVIDER_ERROR",
    error_message: errorMessage,
  });
};
