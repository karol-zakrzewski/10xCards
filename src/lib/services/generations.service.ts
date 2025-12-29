import { createHash, randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

import type { SupabaseClient } from "@/db/supabase.client";
import type { FlashcardProposalDTO, GenerationCreateCommand, GenerationSummaryDTO } from "@/types";

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

const normalizeError = (error: unknown): Record<string, unknown> => {
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
  const errorMessage = normalizeError(error).message;
  await supabase.from("generation_error_logs").insert({
    user_id: userId,
    model,
    source_text_hash: sourceTextHash,
    source_text_length: sourceTextLength,
    error_code: "PROVIDER_ERROR",
    error_message: errorMessage,
  });
};
