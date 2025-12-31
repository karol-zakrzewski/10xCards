import { Button } from "@/components/ui/button";
import type { PageMeta } from "@/types";

interface PaginationControlsProps {
  pageMeta: PageMeta;
  onPageChange: (page: number) => void;
  isBusy?: boolean;
}

export const PaginationControls = ({ pageMeta, onPageChange, isBusy = false }: PaginationControlsProps) => {
  const { page, limit, total } = pageMeta;
  const safeLimit = limit > 0 ? limit : 1;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const canGoBack = page > 1;
  const canGoNext = page < totalPages;

  const handlePrev = () => {
    if (!canGoBack) {
      return;
    }
    onPageChange(page - 1);
  };

  const handleNext = () => {
    if (!canGoNext) {
      return;
    }
    onPageChange(page + 1);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-sm text-muted-foreground">
        Strona {page} z {totalPages}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handlePrev} disabled={!canGoBack || isBusy}>
          Poprzednia
        </Button>
        <Button variant="outline" size="sm" onClick={handleNext} disabled={!canGoNext || isBusy}>
          Następna
        </Button>
      </div>
    </div>
  );
};
