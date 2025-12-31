import { Button } from "@/components/ui/button";

interface SaveAcceptedBarProps {
  acceptedCount: number;
  isSaving: boolean;
  onSave: () => void;
}

export const SaveAcceptedBar = ({ acceptedCount, isSaving, onSave }: SaveAcceptedBarProps) => {
  const isDisabled = acceptedCount === 0 || isSaving;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="text-sm text-muted-foreground">
        {acceptedCount === 0 ? "Zaznacz fiszki do zapisu." : `Do zapisu: ${acceptedCount}`}
      </div>
      <Button onClick={onSave} disabled={isDisabled}>
        {isSaving ? "Zapisywanie…" : "Zapisz zaakceptowane"}
      </Button>
    </div>
  );
};
