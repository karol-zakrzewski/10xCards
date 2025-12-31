import * as React from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FlashcardDTO } from "@/types";

interface DeleteFlashcardDialogProps {
  open: boolean;
  flashcard?: FlashcardDTO;
  isBusy: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export const DeleteFlashcardDialog = ({
  open,
  flashcard,
  isBusy,
  error,
  onClose,
  onConfirm,
}: DeleteFlashcardDialogProps) => {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isBusy) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!flashcard || isBusy) {
      return;
    }
    onConfirm(flashcard.id);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Usuń fiszkę</DialogTitle>
          <DialogDescription>
            Ta operacja jest nieodwracalna. Fiszka zostanie trwale usunięta z Twojej kolekcji.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 text-sm text-muted-foreground p-2">
          {flashcard ? (
            <div className="rounded-lg border border-border bg-muted/30 p-2 text-foreground">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Fiszka do usunięcia</p>
              <p className="mt-1 line-clamp-2 text-sm font-medium">{flashcard.front}</p>
            </div>
          ) : (
            <p>Nie wybrano fiszki do usunięcia.</p>
          )}
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isBusy}>
            Anuluj
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!flashcard || isBusy}>
            {isBusy ? "Usuwanie…" : "Usuń"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
