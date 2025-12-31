import type { FlashcardDTO, FlashcardSource, PageMeta } from "@/types";
import type { ApiErrorVM, ApiRequestState } from "@/lib/viewmodels/generateFlashcards";

export type { ApiErrorVM, ApiRequestState };

export interface FlashcardsFiltersVM {
  q: string;
  source?: FlashcardSource;
  page: number;
  limit: number;
  sort: "created_at";
  order: "desc";
}

export interface FlashcardsListState {
  items: FlashcardDTO[];
  pageMeta: PageMeta;
  status: ApiRequestState;
  error?: ApiErrorVM;
}

export interface FlashcardFormValues {
  front: string;
  back: string;
}

export interface FlashcardFormErrors {
  front?: string;
  back?: string;
}

export interface FlashcardFormState {
  values: FlashcardFormValues;
  errors: FlashcardFormErrors;
  isValid: boolean;
  isDirty: boolean;
}

export type FlashcardFormMode = "create" | "edit";
