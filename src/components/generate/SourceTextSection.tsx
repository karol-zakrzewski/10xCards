import * as React from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { SourceTextValidationVM } from "@/lib/viewmodels/generateFlashcards";

interface SourceTextSectionProps {
  value: string;
  onChange: (value: string) => void;
  validation: SourceTextValidationVM;
  canGenerate: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
  onClear: () => void;
  disableGenerateReason?: string;
  isBusy?: boolean;
}

export const SourceTextSection = ({
  value,
  onChange,
  validation,
  canGenerate,
  isGenerating,
  onGenerate,
  onClear,
  disableGenerateReason,
  isBusy = false,
}: SourceTextSectionProps) => {
  const textareaId = React.useId();
  const hintId = React.useId();
  const errorId = React.useId();
  const reasonId = React.useId();

  const describedBy = [hintId, validation.errorMessage ? errorId : null, disableGenerateReason ? reasonId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="grid gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="grid gap-2">
        <label htmlFor={textareaId} className="text-sm font-medium">
          Tekst źródłowy
        </label>
        <Textarea
          id={textareaId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Wklej tekst, z którego chcesz wygenerować fiszki..."
          className="min-h-[220px]"
          aria-invalid={validation.errorMessage ? "true" : "false"}
          aria-describedby={describedBy || undefined}
          disabled={isBusy}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span id={hintId}>
            {validation.trimmedLength} / {validation.min}–{validation.max} znaków
          </span>
          <span>Wklej tekst i kliknij „Generuj”.</span>
        </div>
        {validation.errorMessage ? (
          <p id={errorId} className="text-xs text-destructive">
            {validation.errorMessage}
          </p>
        ) : null}
        {disableGenerateReason ? (
          <p id={reasonId} className="text-xs text-muted-foreground">
            {disableGenerateReason}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={onGenerate} disabled={!canGenerate || isGenerating}>
          {isGenerating ? "Generowanie…" : "Generuj"}
        </Button>
        <Button variant="outline" onClick={onClear} disabled={isBusy}>
          Wyczyść
        </Button>
      </div>
    </section>
  );
};
