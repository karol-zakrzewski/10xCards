import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ApiErrorVM, ApiRequestState } from "@/lib/viewmodels/flashcardsViewmodels";
import type { FlashcardDTO } from "@/types";
import { FlashcardListItem } from "@/components/flashcards/FlashcardListItem";

interface FlashcardsListProps {
  items: FlashcardDTO[];
  state: ApiRequestState;
  error?: ApiErrorVM;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRetry: () => void;
}

export const FlashcardsList = ({ items, state, error, onEdit, onDelete, onRetry }: FlashcardsListProps) => {
  if (state === "loading") {
    return (
      <div className="grid gap-4">
        <div className="h-24 rounded-xl border border-border bg-card/70" />
        <div className="h-24 rounded-xl border border-border bg-card/70" />
        <div className="h-24 rounded-xl border border-border bg-card/70" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <Alert variant="destructive" className="flex flex-col gap-3">
        <div>
          <AlertTitle>Nie udało się pobrać fiszek</AlertTitle>
          <AlertDescription>{error?.message ?? "Spróbuj ponownie za chwilę."}</AlertDescription>
        </div>
        <div>
          <Button variant="outline" onClick={onRetry}>
            Spróbuj ponownie
          </Button>
        </div>
      </Alert>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
        Brak fiszek spełniających kryteria. Możesz dodać nową fiszkę ręcznie lub wygenerować je z tekstu.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <FlashcardListItem key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
};
