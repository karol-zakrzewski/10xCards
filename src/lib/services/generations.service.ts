import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";

import type { Tables } from "@/db/database.types";
import type { SupabaseClient } from "@/db/supabase.client";
import type {
  FlashcardProposalDTO,
  GenerationCreateCommand,
  GenerationDetailDTO,
  GenerationListItemDTO,
  GenerationSummaryDTO,
  PagedResponse,
} from "@/types";
import { GoogleAIService, GoogleAIServiceError } from "@/lib/services/google-ai.service";

const DEFAULT_GOOGLE_MODEL = "gemini-2.5-flash";

const googleAiService = new GoogleAIService({
  apiKey: import.meta.env.GEMINI_API_KEY,
  defaultModel: DEFAULT_GOOGLE_MODEL,
  defaultParams: { temperature: 0.2, top_p: 1, max_tokens: 900 },
});

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

interface GetGenerationByIdParams {
  supabase: SupabaseClient;
  userId: string;
  id: number;
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

type GenerationDetailRow = Pick<
  Tables<"generations">,
  | "id"
  | "generated_count"
  | "accepted_unedited_count"
  | "accepted_edited_count"
  | "source_text_length"
  | "generation_duration"
  | "created_at"
  | "updated_at"
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

const mapGenerationDetailRowToDTO = (row: GenerationDetailRow): GenerationDetailDTO => ({
  id: row.id,
  generatedCount: row.generated_count,
  acceptedUneditedCount: row.accepted_unedited_count,
  acceptedEditedCount: row.accepted_edited_count,
  sourceTextLength: row.source_text_length,
  generationDurationMs: row.generation_duration,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const generateFromText = async (
  command: GenerationCreateCommand,
  { supabase, userId, model = DEFAULT_GOOGLE_MODEL }: GenerateFromTextOptions
): Promise<GenerationResult> => {
  const sourceText = command.sourceText.trim();
  const sourceTextLength = sourceText.length;
  const sourceTextHash = createHash("md5").update(sourceText).digest("hex");

  const startedAt = performance.now();

  const usedModel = model;

  let proposals: FlashcardProposalDTO[];
  try {
    proposals = await googleAiService.generateFlashcardProposalsFromText({ sourceText, model: usedModel });
  } catch (error) {
    await logGenerationError(supabase, {
      userId,
      model: usedModel,
      sourceTextHash,
      sourceTextLength,
      error,
    });

    if (error instanceof GoogleAIServiceError) {
      throw new GenerationServiceError(error.status, error.code, error.message, {
        cause: normalizeError(error),
      });
    }

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
      model: usedModel,
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

export const getGenerationById = async ({
  supabase,
  userId,
  id,
}: GetGenerationByIdParams): Promise<GenerationDetailDTO> => {
  const { data, error } = await supabase
    .from("generations")
    .select(
      "id, generated_count, accepted_unedited_count, accepted_edited_count, source_text_length, generation_duration, created_at, updated_at"
    )
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // PostgREST code for no rows found
      throw new GenerationServiceError(404, "NOT_FOUND", "Generation not found.");
    }
    throw new GenerationServiceError(500, "DB_ERROR", "Failed to fetch generation.", { hint: error.message });
  }

  if (!data) {
    throw new GenerationServiceError(404, "NOT_FOUND", "Generation not found.");
  }

  return mapGenerationDetailRowToDTO(data);
};

const normalizeError = (error: unknown): { message: string; name?: string; code?: string } => {
  if (error instanceof GoogleAIServiceError) {
    return { message: error.message, name: error.name, code: error.code };
  }
  if (error instanceof Error) {
    return { message: error.message, name: error.name };
  }
  return { message: "Unknown error" };
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
  const { message: errorMessage, code: errorCode } = normalizeError(error);
  await supabase.from("generation_error_logs").insert({
    user_id: userId,
    model,
    source_text_hash: sourceTextHash,
    source_text_length: sourceTextLength,
    error_code: errorCode ?? "PROVIDER_ERROR",
    error_message: errorMessage,
  });
};
