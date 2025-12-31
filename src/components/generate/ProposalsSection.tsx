import { Badge } from "@/components/ui/badge";
import { SaveAcceptedBar } from "@/components/generate/SaveAcceptedBar";
import { ProposalCard } from "@/components/generate/ProposalCard";
import type { FlashcardProposalVM } from "@/lib/viewmodels/generateFlashcards";

interface ProposalsSectionProps {
  proposals: FlashcardProposalVM[];
  acceptedCount: number;
  generatedCount: number;
  isSaving: boolean;
  isBusy: boolean;
  onAcceptToggle: (id: string) => void;
  onRefuse: (id: string) => void;
  onUndo: (id: string) => void;
  onEdit: (id: string) => void;
  onSaveAccepted: () => void;
  saveErrorMessage?: string;
}

export const ProposalsSection = ({
  proposals,
  acceptedCount,
  generatedCount,
  isSaving,
  isBusy,
  onAcceptToggle,
  onRefuse,
  onUndo,
  onEdit,
  onSaveAccepted,
  saveErrorMessage,
}: ProposalsSectionProps) => {
  if (proposals.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Propozycje fiszek</h2>
          <p className="text-sm text-muted-foreground">Wybierz, które fiszki chcesz zapisać.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary">Akceptowane: {acceptedCount}</Badge>
          <Badge variant="outline">Wygenerowane: {generatedCount}</Badge>
        </div>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {proposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            disabled={isBusy}
            onAcceptToggle={onAcceptToggle}
            onRefuse={onRefuse}
            onUndo={onUndo}
            onEdit={onEdit}
          />
        ))}
      </div>
      <SaveAcceptedBar acceptedCount={acceptedCount} isSaving={isSaving} onSave={onSaveAccepted} />
      {saveErrorMessage ? <p className="text-sm text-destructive">{saveErrorMessage}</p> : null}
    </section>
  );
};
