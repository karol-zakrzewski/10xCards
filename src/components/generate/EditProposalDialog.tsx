import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  createEditDraft,
  validateEditDraft,
  type FlashcardEditDraftVM,
  type FlashcardProposalVM,
} from "@/lib/viewmodels/generateFlashcards";

interface EditProposalDialogProps {
  open: boolean;
  proposal?: FlashcardProposalVM;
  onClose: () => void;
  onSave: (id: string, next: { front: string; back: string }) => void;
  isBusy?: boolean;
}

export const EditProposalDialog = ({ open, proposal, onClose, onSave, isBusy = false }: EditProposalDialogProps) => {
  const [draft, setDraft] = React.useState<FlashcardEditDraftVM>(() => createEditDraft(proposal));

  React.useEffect(() => {
    setDraft(createEditDraft(proposal));
  }, [proposal?.id, open]);

  const validatedDraft = React.useMemo(() => validateEditDraft(draft.front, draft.back), [draft.front, draft.back]);

  const isDirty = React.useMemo(() => {
    if (!proposal) {
      return false;
    }
    return (
      proposal.current.front !== validatedDraft.front.trim() || proposal.current.back !== validatedDraft.back.trim()
    );
  }, [proposal, validatedDraft]);

  const handleSave = React.useCallback(() => {
    if (!proposal || !validatedDraft.isValid || !isDirty) {
      return;
    }
    onSave(proposal.id, { front: validatedDraft.front.trim(), back: validatedDraft.back.trim() });
  }, [proposal, validatedDraft, isDirty, onSave]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edytuj fiszkę</DialogTitle>
          <DialogDescription>Zmień treść i zapisz tylko poprawne wartości.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="flashcard-front" className="text-sm font-medium">
              Przód
            </label>
            <Textarea
              id="flashcard-front"
              value={draft.front}
              onChange={(event) => setDraft((current) => ({ ...current, front: event.target.value }))}
              aria-invalid={validatedDraft.frontError ? "true" : "false"}
              disabled={isBusy}
            />
            {validatedDraft.frontError ? <p className="text-xs text-destructive">{validatedDraft.frontError}</p> : null}
          </div>
          <div className="grid gap-2">
            <label htmlFor="flashcard-back" className="text-sm font-medium">
              Tył
            </label>
            <Textarea
              id="flashcard-back"
              value={draft.back}
              onChange={(event) => setDraft((current) => ({ ...current, back: event.target.value }))}
              aria-invalid={validatedDraft.backError ? "true" : "false"}
              disabled={isBusy}
            />
            {validatedDraft.backError ? <p className="text-xs text-destructive">{validatedDraft.backError}</p> : null}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isBusy}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={isBusy || !validatedDraft.isValid || !isDirty}>
            Zapisz zmiany
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
