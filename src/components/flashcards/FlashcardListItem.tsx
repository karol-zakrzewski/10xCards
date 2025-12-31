import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FlashcardDTO } from "@/types";

interface FlashcardListItemProps {
  item: FlashcardDTO;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("pl-PL", { year: "numeric", month: "short", day: "numeric" });
};

const sourceLabels: Record<FlashcardDTO["source"], string> = {
  "ai-full": "AI • bez zmian",
  "ai-edited": "AI • po edycji",
  manual: "Manualna",
};

export const FlashcardListItem = React.memo(({ item, onEdit, onDelete }: FlashcardListItemProps) => {
  const handleEdit = React.useCallback(() => onEdit(item.id), [item.id, onEdit]);
  const handleDelete = React.useCallback(() => onDelete(item.id), [item.id, onDelete]);

  const createdAt = formatDate(item.createdAt);
  const updatedAt = formatDate(item.updatedAt);
  const showUpdated = item.updatedAt && item.updatedAt !== item.createdAt;

  return (
    <article className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge variant="secondary">{sourceLabels[item.source]}</Badge>
        <div className="text-xs text-muted-foreground">
          <span>Utworzono: {createdAt}</span>
          {showUpdated ? <span className="ml-3">Zaktualizowano: {updatedAt}</span> : null}
        </div>
      </div>
      <div className="grid gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Przód</p>
          <p className="line-clamp-2 text-sm text-foreground">{item.front}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tył</p>
          <p className="line-clamp-2 text-sm text-foreground">{item.back}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={handleEdit}>
          Edytuj
        </Button>
        <Button size="sm" variant="destructive" onClick={handleDelete}>
          Usuń
        </Button>
      </div>
    </article>
  );
});

FlashcardListItem.displayName = "FlashcardListItem";
