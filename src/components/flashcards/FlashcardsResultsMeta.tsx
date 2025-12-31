import type { PageMeta } from "@/types";

interface FlashcardsResultsMetaProps {
  pageMeta: PageMeta;
}

export const FlashcardsResultsMeta = ({ pageMeta }: FlashcardsResultsMetaProps) => {
  const { page, limit, total } = pageMeta;
  const safeTotal = Number.isFinite(total) ? total : 0;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 1;
  const start = safeTotal === 0 ? 0 : (page - 1) * safeLimit + 1;
  const end = Math.min(page * safeLimit, safeTotal);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
      <span>{safeTotal === 0 ? "Brak wyników" : `${start}–${end} z ${safeTotal}`}</span>
      <span>
        Łącznie: <strong className="font-semibold text-foreground">{safeTotal}</strong>
      </span>
    </div>
  );
};
