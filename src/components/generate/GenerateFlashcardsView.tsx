import * as React from "react";

import { GenerationStatusBanner } from "@/components/generate/GenerationStatusBanner";
import { ProposalsSection } from "@/components/generate/ProposalsSection";
import { SourceTextSection } from "@/components/generate/SourceTextSection";
import { EditProposalDialog } from "@/components/generate/EditProposalDialog";
import { useGenerationSession } from "@/components/hooks/useGenerationSession";
import { fetchJson, getAuthorizationHeader, ApiError } from "@/lib/api/client";
import type { BulkFlashcardsCreateResultDTO, FlashcardProposalDTO, GenerationSummaryDTO } from "@/types";
import {
  getSourceTextValidation,
  normalizeFlashcardKey,
  type ApiErrorVM,
  type ApiRequestState,
} from "@/lib/viewmodels/generateFlashcards";

const GENERATIONS_ENDPOINT = "/api/v1/generations";
const BULK_CREATE_ENDPOINT = "/api/v1/flashcards/bulkCreate";

interface GenerationResponse {
  generation: GenerationSummaryDTO;
  proposals: FlashcardProposalDTO[];
}

const mapApiError = (error: unknown): ApiErrorVM => {
  if (error instanceof ApiError) {
    const fallbackMessage = error.message || "Wystąpił nieoczekiwany błąd.";
    const messageByCode: Record<string, string> = {
      VALIDATION_ERROR: "Sprawdź poprawność danych wejściowych.",
      UNAUTHORIZED: "Twoja sesja wygasła. Zaloguj się ponownie.",
      PROVIDER_ERROR: "Błąd dostawcy AI. Spróbuj ponownie później.",
    };
    const message = error.code && messageByCode[error.code] ? messageByCode[error.code] : fallbackMessage;

    return {
      httpStatus: error.status,
      code: error.code,
      message,
      details: error.details,
    };
  }

  return {
    message: "Nie udało się połączyć z serwerem.",
  };
};

const GenerateFlashcardsView = () => {
  const {
    sourceText,
    setSourceText,
    generationId,
    generatedCount,
    proposals,
    acceptedCount,
    clearSession,
    applyGenerationResult,
    toggleAccept,
    refuse,
    undo,
    applyEdit,
  } = useGenerationSession();

  const [generateState, setGenerateState] = React.useState<ApiRequestState>("idle");
  const [generateError, setGenerateError] = React.useState<ApiErrorVM | undefined>();
  const [saveState, setSaveState] = React.useState<ApiRequestState>("idle");
  const [saveError, setSaveError] = React.useState<ApiErrorVM | undefined>();
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editingProposalId, setEditingProposalId] = React.useState<string | null>(null);

  const generateAbortRef = React.useRef<AbortController | null>(null);

  const validation = React.useMemo(() => getSourceTextValidation(sourceText), [sourceText]);
  const hasProposals = proposals.length > 0;
  const isGenerating = generateState === "loading";
  const isSaving = saveState === "loading";
  const isBusy = isGenerating || isSaving;

  const disableGenerateReason = hasProposals ? "Usuń bieżące propozycje, aby wygenerować nowe." : undefined;

  const canGenerate = validation.isValid && !hasProposals && !isBusy;

  const editingProposal = React.useMemo(
    () => proposals.find((proposal) => proposal.id === editingProposalId),
    [editingProposalId, proposals]
  );

  const handleClear = React.useCallback(() => {
    generateAbortRef.current?.abort();
    generateAbortRef.current = null;
    clearSession();
    setGenerateState("idle");
    setGenerateError(undefined);
    setSaveState("idle");
    setSaveError(undefined);
    setEditDialogOpen(false);
    setEditingProposalId(null);
  }, [clearSession]);

  const handleGenerate = React.useCallback(async () => {
    if (!canGenerate) {
      return;
    }

    generateAbortRef.current?.abort();
    const controller = new AbortController();
    generateAbortRef.current = controller;

    setGenerateState("loading");
    setGenerateError(undefined);

    try {
      const response = await fetchJson<GenerationResponse>(GENERATIONS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthorizationHeader(),
        },
        body: JSON.stringify({ sourceText }),
        signal: controller.signal,
      });

      applyGenerationResult(response.generation, response.proposals);
      setGenerateState("success");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      const mapped = mapApiError(error);
      setGenerateError(mapped);
      setGenerateState("error");

      if (mapped.httpStatus === 401 || mapped.code === "UNAUTHORIZED") {
        window.location.href = "/login";
      }
    }
  }, [applyGenerationResult, canGenerate, sourceText]);

  const handleSaveAccepted = React.useCallback(async () => {
    if (!generationId || acceptedCount === 0 || isBusy) {
      return;
    }

    const acceptedItems = proposals
      .filter((proposal) => proposal.status === "accepted")
      .map((proposal) => ({
        front: proposal.current.front.trim(),
        back: proposal.current.back.trim(),
        source: proposal.sourceForSave,
      }));

    const seen = new Set<string>();
    const dedupedItems = acceptedItems.filter((item) => {
      const key = normalizeFlashcardKey(item.front, item.back);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    if (dedupedItems.length === 0) {
      setSaveError({ message: "Usuń duplikaty i spróbuj ponownie." });
      setSaveState("error");
      return;
    }

    setSaveState("loading");
    setSaveError(undefined);

    try {
      await fetchJson<{ data: BulkFlashcardsCreateResultDTO }>(BULK_CREATE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthorizationHeader(),
        },
        body: JSON.stringify({ generationId, items: dedupedItems }),
      });

      clearSession();
      setSaveState("success");
    } catch (error) {
      const mapped = mapApiError(error);
      setSaveError(mapped);
      setSaveState("error");

      if (mapped.httpStatus === 401 || mapped.code === "UNAUTHORIZED") {
        window.location.href = "/login";
      }
    }
  }, [acceptedCount, clearSession, generationId, isBusy, proposals]);

  const handleAcceptToggle = React.useCallback((id: string) => toggleAccept(id), [toggleAccept]);
  const handleRefuse = React.useCallback((id: string) => refuse(id), [refuse]);
  const handleUndo = React.useCallback((id: string) => undo(id), [undo]);
  const handleEdit = React.useCallback((id: string) => {
    setEditingProposalId(id);
    setEditDialogOpen(true);
  }, []);

  const handleCloseEdit = React.useCallback(() => {
    setEditDialogOpen(false);
    setEditingProposalId(null);
  }, []);

  const handleSaveEdit = React.useCallback(
    (id: string, next: { front: string; back: string }) => {
      applyEdit(id, next);
      setEditDialogOpen(false);
      setEditingProposalId(null);
    },
    [applyEdit]
  );

  return (
    <section className="grid gap-6">
      <SourceTextSection
        value={sourceText}
        onChange={setSourceText}
        validation={validation}
        canGenerate={canGenerate}
        isGenerating={isGenerating}
        isSaving={isSaving}
        onGenerate={handleGenerate}
        onClear={handleClear}
        disableGenerateReason={disableGenerateReason}
        isBusy={isBusy}
      />
      <GenerationStatusBanner
        state={generateState}
        error={generateError}
        onRetry={!hasProposals ? handleGenerate : undefined}
      />
      <ProposalsSection
        proposals={proposals}
        acceptedCount={acceptedCount}
        generatedCount={generatedCount}
        isSaving={isSaving}
        isBusy={isBusy}
        onAcceptToggle={handleAcceptToggle}
        onRefuse={handleRefuse}
        onUndo={handleUndo}
        onEdit={handleEdit}
        onSaveAccepted={handleSaveAccepted}
        saveErrorMessage={saveError?.message}
      />
      <EditProposalDialog
        open={editDialogOpen}
        proposal={editingProposal}
        onClose={handleCloseEdit}
        onSave={handleSaveEdit}
        isBusy={isBusy}
      />
    </section>
  );
};

export default GenerateFlashcardsView;
