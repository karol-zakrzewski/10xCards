import type { FlashcardProposalDTO } from "@/types";

export type ProposalStatus = "pending" | "accepted" | "refused";

export interface FlashcardProposalVM {
  id: string;
  base: { front: string; back: string };
  current: { front: string; back: string };
  status: ProposalStatus;
  isEdited: boolean;
  sourceForSave: "ai-full" | "ai-edited";
}

export interface GenerationSessionVM {
  sourceText: string;
  generationId: number | null;
  generatedCount: number;
  proposals: FlashcardProposalVM[];
  acceptedCount: number;
}

export type ApiRequestState = "idle" | "loading" | "success" | "error";

export interface ApiErrorVM {
  httpStatus?: number;
  code?: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface SourceTextValidationVM {
  trimmedLength: number;
  min: 1000;
  max: 10000;
  isValid: boolean;
  errorMessage?: string;
}

export interface FlashcardEditDraftVM {
  front: string;
  back: string;
  frontError?: string;
  backError?: string;
  isValid: boolean;
}

const SOURCE_MIN = 1000;
const SOURCE_MAX = 10000;

export const getSourceTextValidation = (value: string): SourceTextValidationVM => {
  const trimmedLength = value.trim().length;
  const min = SOURCE_MIN as 1000;
  const max = SOURCE_MAX as 10000;
  const isValid = trimmedLength >= min && trimmedLength <= max;

  let errorMessage: string | undefined;
  if (trimmedLength > 0 && trimmedLength < min) {
    errorMessage = `Wpisz co najmniej ${min} znaków.`;
  }
  if (trimmedLength > max) {
    errorMessage = `Tekst jest za długi. Maksymalnie ${max} znaków.`;
  }

  return {
    trimmedLength,
    min,
    max,
    isValid,
    ...(errorMessage ? { errorMessage } : {}),
  };
};

export const mapProposalFromDTO = (proposal: FlashcardProposalDTO): FlashcardProposalVM => {
  const base = { front: proposal.front, back: proposal.back };
  return {
    id: proposal.id,
    base,
    current: base,
    status: "pending",
    isEdited: false,
    sourceForSave: "ai-full",
  };
};

export const updateProposalContent = (
  proposal: FlashcardProposalVM,
  next: { front: string; back: string }
): FlashcardProposalVM => {
  const isEdited = proposal.base.front !== next.front || proposal.base.back !== next.back;
  return {
    ...proposal,
    current: { front: next.front, back: next.back },
    isEdited,
    sourceForSave: isEdited ? "ai-edited" : "ai-full",
  };
};

export const createEditDraft = (proposal?: FlashcardProposalVM): FlashcardEditDraftVM => {
  if (!proposal) {
    return { front: "", back: "", isValid: false };
  }

  return {
    front: proposal.current.front,
    back: proposal.current.back,
    isValid: true,
  };
};

export const validateEditDraft = (front: string, back: string): FlashcardEditDraftVM => {
  const trimmedFront = front.trim();
  const trimmedBack = back.trim();

  const frontValid = trimmedFront.length >= 1 && trimmedFront.length <= 200;
  const backValid = trimmedBack.length >= 1 && trimmedBack.length <= 500;

  return {
    front,
    back,
    frontError: frontValid ? undefined : "Przód musi mieć 1–200 znaków.",
    backError: backValid ? undefined : "Tył musi mieć 1–500 znaków.",
    isValid: frontValid && backValid,
  };
};

export const normalizeFlashcardKey = (front: string, back: string) => {
  return `${front.trim().toLowerCase()}::${back.trim().toLowerCase()}`;
};
