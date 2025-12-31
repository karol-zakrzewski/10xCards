import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ApiErrorVM, ApiRequestState } from "@/lib/viewmodels/generateFlashcards";

interface GenerationStatusBannerProps {
  state: ApiRequestState;
  error?: ApiErrorVM;
  onRetry?: () => void;
}

export const GenerationStatusBanner = ({ state, error, onRetry }: GenerationStatusBannerProps) => {
  if (state === "idle") {
    return null;
  }

  if (state === "loading") {
    return (
      <Alert>
        <AlertTitle>Generowanie w toku</AlertTitle>
        <AlertDescription>AI przygotowuje propozycje fiszek. To może potrwać chwilę.</AlertDescription>
      </Alert>
    );
  }

  if (state === "error") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Nie udało się wygenerować fiszek</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <span>{error?.message ?? "Wystąpił nieoczekiwany błąd."}</span>
          {onRetry ? (
            <Button variant="outline" className="w-fit" onClick={onRetry}>
              Spróbuj ponownie
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <AlertTitle>Generowanie zakończone</AlertTitle>
      <AlertDescription>Możesz teraz przejrzeć propozycje i wybrać najlepsze fiszki.</AlertDescription>
    </Alert>
  );
};
