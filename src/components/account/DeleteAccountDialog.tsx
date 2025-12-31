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
import type { ApiErrorVM } from "@/lib/viewmodels/accountViewmodels";

interface DeleteAccountDialogProps {
  open: boolean;
  isBusy: boolean;
  error?: ApiErrorVM;
  confirmed: boolean;
  onConfirm: () => void;
  onClose: () => void;
  onConfirmChange: (confirmed: boolean) => void;
}

export const DeleteAccountDialog = ({
  open,
  isBusy,
  error,
  confirmed,
  onConfirm,
  onClose,
  onConfirmChange,
}: DeleteAccountDialogProps) => {
  const checkboxId = React.useId();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isBusy) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (isBusy || !confirmed) {
      return;
    }
    onConfirm();
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onConfirmChange(event.target.checked);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Usuń konto</DialogTitle>
          <DialogDescription>
            Ta operacja jest nieodwracalna. Wszystkie Twoje dane zostaną trwale usunięte.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 text-sm text-muted-foreground">
          <label htmlFor={checkboxId} className="flex items-start gap-3 rounded-lg border border-border p-3">
            <input
              id={checkboxId}
              type="checkbox"
              className="mt-1 size-4 accent-destructive"
              checked={confirmed}
              onChange={handleCheckboxChange}
              disabled={isBusy}
            />
            <span>Potwierdzam usunięcie konta i wszystkich danych.</span>
          </label>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isBusy}>
            Anuluj
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!confirmed || isBusy}>
            {isBusy ? "Usuwanie…" : "Usuń konto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
