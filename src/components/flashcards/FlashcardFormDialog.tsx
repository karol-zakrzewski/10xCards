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
import { Textarea } from "@/components/ui/textarea";
import type { FlashcardFormMode, FlashcardFormValues } from "@/lib/viewmodels/flashcardsViewmodels";

interface FlashcardFormDialogProps {
  open: boolean;
  mode: FlashcardFormMode;
  initialValues?: FlashcardFormValues;
  isBusy: boolean;
  submitError?: string;
  onClose: () => void;
  onSubmit: (values: FlashcardFormValues) => void;
}

const DEFAULT_VALUES: FlashcardFormValues = { front: "", back: "" };

const validateValues = (values: FlashcardFormValues) => {
  const trimmedFront = values.front.trim();
  const trimmedBack = values.back.trim();

  const errors: { front?: string; back?: string } = {};

  if (trimmedFront.length < 1 || trimmedFront.length > 200) {
    errors.front = "Przód musi mieć 1–200 znaków.";
  }

  if (trimmedBack.length < 1 || trimmedBack.length > 500) {
    errors.back = "Tył musi mieć 1–500 znaków.";
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};

export const FlashcardFormDialog = ({
  open,
  mode,
  initialValues,
  isBusy,
  submitError,
  onClose,
  onSubmit,
}: FlashcardFormDialogProps) => {
  const [values, setValues] = React.useState<FlashcardFormValues>(initialValues ?? DEFAULT_VALUES);
  const [errors, setErrors] = React.useState<{ front?: string; back?: string }>({});
  const frontId = React.useId();
  const backId = React.useId();

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setValues(initialValues ?? DEFAULT_VALUES);
    setErrors({});
  }, [open, initialValues]);

  const initial = initialValues ?? DEFAULT_VALUES;
  const isDirty = values.front.trim() !== initial.front.trim() || values.back.trim() !== initial.back.trim();
  const validation = React.useMemo(() => validateValues(values), [values]);

  const canSubmit = validation.isValid && (mode === "create" || isDirty) && !isBusy;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isBusy) {
      onClose();
    }
  };

  const handleChange = (field: "front" | "back") => (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValues = { ...values, [field]: event.target.value };
    setValues(nextValues);
    setErrors(validateValues(nextValues).errors);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextValidation = validateValues(values);
    setErrors(nextValidation.errors);

    if (!nextValidation.isValid) {
      return;
    }

    if (mode === "edit" && !isDirty) {
      return;
    }

    onSubmit({
      front: values.front.trim(),
      back: values.back.trim(),
    });
  };

  const title = mode === "create" ? "Dodaj fiszkę" : "Edytuj fiszkę";
  const description =
    mode === "create"
      ? "Uzupełnij przód i tył fiszki, a następnie zapisz."
      : "Wprowadź zmiany i zapisz, aby zaktualizować fiszkę.";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor={frontId}>
              Przód
            </label>
            <Textarea
              id={frontId}
              value={values.front}
              onChange={handleChange("front")}
              minLength={1}
              maxLength={200}
              aria-invalid={errors.front ? "true" : "false"}
              disabled={isBusy}
            />
            {errors.front ? <p className="text-xs text-destructive">{errors.front}</p> : null}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor={backId}>
              Tył
            </label>
            <Textarea
              id={backId}
              value={values.back}
              onChange={handleChange("back")}
              minLength={1}
              maxLength={500}
              aria-invalid={errors.back ? "true" : "false"}
              disabled={isBusy}
            />
            {errors.back ? <p className="text-xs text-destructive">{errors.back}</p> : null}
          </div>
          {submitError ? (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}
          {mode === "edit" && !isDirty ? (
            <p className="text-xs text-muted-foreground">Brak zmian do zapisania.</p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isBusy}>
              Anuluj
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isBusy ? "Zapisywanie…" : "Zapisz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
