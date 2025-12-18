import type { Tables, TablesInsert, TablesUpdate } from "@/db/database.types";

// Core entity aliases (single source of truth from Supabase-generated types)
type FlashcardRow = Tables<"flashcards">;
type GenerationRow = Tables<"generations">;
type GenerationErrorLogRow = Tables<"generation_error_logs">;

// Shared primitives
export type FlashcardSource = "manual" | "ai-full" | "ai-edited";

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
}

export interface PagedResponse<T> {
  data: T[];
  page: PageMeta;
}

export interface DeletedResponse {
  deleted: true;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// -------------------------
// Flashcards
// -------------------------

export interface FlashcardDTO {
  id: FlashcardRow["id"];
  front: FlashcardRow["front"];
  back: FlashcardRow["back"];
  source: FlashcardSource;
  generationId: FlashcardRow["generation_id"];
  createdAt: FlashcardRow["created_at"];
  updatedAt: FlashcardRow["updated_at"];
}

export type FlashcardCreateCommand = Pick<TablesInsert<"flashcards">, "front" | "back" | "source">;

export type FlashcardUpdateCommand = Pick<TablesUpdate<"flashcards">, "front" | "back">;

export type BulkFlashcardsCreateItemCommand = Pick<FlashcardCreateCommand, "front" | "back" | "source"> & {
  // Only AI-derived sources are allowed in bulk create
  source: Extract<FlashcardSource, "ai-full" | "ai-edited">;
};

export interface BulkFlashcardsCreateCommand {
  generationId: GenerationRow["id"];
  items: BulkFlashcardsCreateItemCommand[];
}

export interface BulkFlashcardsCreateResultDTO {
  created: FlashcardDTO[];
  generation: {
    id: GenerationRow["id"];
    acceptedUneditedCount: GenerationRow["accepted_unedited_count"];
    acceptedEditedCount: GenerationRow["accepted_edited_count"];
    updatedAt: GenerationRow["updated_at"];
  };
}

// -------------------------
// Generations
// -------------------------

export interface GenerationCreateCommand {
  sourceText: string;
}

export interface FlashcardProposalDTO {
  id: FlashcardRow["id"];
  front: FlashcardRow["front"];
  back: FlashcardRow["back"];
  source: Extract<FlashcardSource, "ai-full" | "ai-edited" | "manual">;
}

export interface GenerationSummaryDTO {
  id: GenerationRow["id"];
  generatedCount: GenerationRow["generated_count"];
  generationDurationMs: GenerationRow["generation_duration"];
  createdAt: GenerationRow["created_at"];
}

export interface GenerationListItemDTO {
  id: GenerationRow["id"];
  model: GenerationRow["model"];
  generatedCount: GenerationRow["generated_count"];
  acceptedUneditedCount: GenerationRow["accepted_unedited_count"];
  acceptedEditedCount: GenerationRow["accepted_edited_count"];
  sourceTextLength: GenerationRow["source_text_length"];
  generationDurationMs: GenerationRow["generation_duration"];
  createdAt: GenerationRow["created_at"];
}

export interface GenerationDetailDTO {
  id: GenerationRow["id"];
  generatedCount: GenerationRow["generated_count"];
  acceptedUneditedCount: GenerationRow["accepted_unedited_count"];
  acceptedEditedCount: GenerationRow["accepted_edited_count"];
  sourceTextLength: GenerationRow["source_text_length"];
  generationDurationMs: GenerationRow["generation_duration"];
  createdAt: GenerationRow["created_at"];
  updatedAt: GenerationRow["updated_at"];
}

export interface GenerationAcceptanceStatsDTO {
  id: GenerationRow["id"];
  acceptedUneditedCount: GenerationRow["accepted_unedited_count"];
  acceptedEditedCount: GenerationRow["accepted_edited_count"];
  updatedAt: GenerationRow["updated_at"];
}

// -------------------------
// Generation error logs
// -------------------------

export interface GenerationErrorLogDTO {
  id: GenerationErrorLogRow["id"];
  sourceTextHash: GenerationErrorLogRow["source_text_hash"];
  sourceTextLength: GenerationErrorLogRow["source_text_length"];
  errorCode: GenerationErrorLogRow["error_code"];
  errorMessage: GenerationErrorLogRow["error_message"];
  createdAt: GenerationErrorLogRow["created_at"];
}

// -------------------------
// Me
// -------------------------

export interface MeUserDTO {
  id: string;
  email: string;
}

export interface MeStatsDTO {
  flashcardsCount: number;
  generationsCount: number;
}

export interface MeDTO {
  user: MeUserDTO;
  stats: MeStatsDTO;
}
