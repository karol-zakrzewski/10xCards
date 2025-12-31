import * as React from "react";

import type { FlashcardProposalDTO, GenerationSummaryDTO } from "@/types";
import {
  mapProposalFromDTO,
  updateProposalContent,
  type FlashcardProposalVM,
} from "@/lib/viewmodels/generateFlashcards";

export const useGenerationSession = () => {
  const [sourceText, setSourceText] = React.useState("");
  const [generationId, setGenerationId] = React.useState<number | null>(null);
  const [generatedCount, setGeneratedCount] = React.useState(0);
  const [proposals, setProposals] = React.useState<FlashcardProposalVM[]>([]);

  const acceptedCount = React.useMemo(
    () => proposals.filter((proposal) => proposal.status === "accepted").length,
    [proposals]
  );

  const clearSession = React.useCallback(() => {
    setSourceText("");
    setGenerationId(null);
    setGeneratedCount(0);
    setProposals([]);
  }, []);

  const applyGenerationResult = React.useCallback((generation: GenerationSummaryDTO, items: FlashcardProposalDTO[]) => {
    setGenerationId(generation.id);
    setGeneratedCount(generation.generatedCount);
    setProposals(items.map(mapProposalFromDTO));
  }, []);

  const toggleAccept = React.useCallback((id: string) => {
    setProposals((current) =>
      current.map((proposal) => {
        if (proposal.id !== id) {
          return proposal;
        }
        if (proposal.status === "refused") {
          return proposal;
        }
        return {
          ...proposal,
          status: proposal.status === "accepted" ? "pending" : "accepted",
        };
      })
    );
  }, []);

  const refuse = React.useCallback((id: string) => {
    setProposals((current) =>
      current.map((proposal) => {
        if (proposal.id !== id) {
          return proposal;
        }
        if (proposal.status === "refused") {
          return proposal;
        }
        return { ...proposal, status: "refused" };
      })
    );
  }, []);

  const undo = React.useCallback((id: string) => {
    setProposals((current) =>
      current.map((proposal) => {
        if (proposal.id !== id) {
          return proposal;
        }
        if (proposal.status !== "refused") {
          return proposal;
        }
        return { ...proposal, status: "pending" };
      })
    );
  }, []);

  const applyEdit = React.useCallback((id: string, next: { front: string; back: string }) => {
    setProposals((current) =>
      current.map((proposal) => {
        if (proposal.id !== id) {
          return proposal;
        }
        return updateProposalContent(proposal, next);
      })
    );
  }, []);

  return {
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
  };
};
