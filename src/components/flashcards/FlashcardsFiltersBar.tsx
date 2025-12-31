import * as React from "react";

import { Button } from "@/components/ui/button";
import type { FlashcardsFiltersVM } from "@/lib/viewmodels/flashcardsViewmodels";

interface FlashcardsFiltersBarProps {
  filters: FlashcardsFiltersVM;
  onFiltersChange: (partial: Partial<FlashcardsFiltersVM>) => void;
  isBusy?: boolean;
}

const DEFAULT_LIMIT = 20;

export const FlashcardsFiltersBar = ({ filters, onFiltersChange, isBusy = false }: FlashcardsFiltersBarProps) => {
  const searchId = React.useId();
  const sourceId = React.useId();
  const limitId = React.useId();

  const handleSearchChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFiltersChange({ q: event.target.value });
    },
    [onFiltersChange]
  );

  const handleSourceChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      onFiltersChange({ source: value ? (value as FlashcardsFiltersVM["source"]) : undefined });
    },
    [onFiltersChange]
  );

  const handleLimitChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = Number.parseInt(event.target.value, 10);
      if (Number.isNaN(value)) {
        return;
      }
      onFiltersChange({ limit: value });
    },
    [onFiltersChange]
  );

  const handleReset = React.useCallback(() => {
    onFiltersChange({
      q: "",
      source: undefined,
      limit: DEFAULT_LIMIT,
      page: 1,
    });
  }, [onFiltersChange]);

  const canReset =
    filters.q.trim().length > 0 ||
    filters.source !== undefined ||
    filters.page !== 1 ||
    filters.limit !== DEFAULT_LIMIT;

  return (
    <section className="grid gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="grid flex-1 gap-2" role="search" aria-label="Wyszukiwarka fiszek">
          <label htmlFor={searchId} className="text-sm font-medium">
            Wyszukaj
          </label>
          <input
            id={searchId}
            type="search"
            value={filters.q}
            onChange={handleSearchChange}
            placeholder="Szukaj po przodzie lub tyle fiszki..."
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isBusy}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor={sourceId} className="text-sm font-medium">
            Źródło
          </label>
          <select
            id={sourceId}
            value={filters.source ?? ""}
            onChange={handleSourceChange}
            className="h-10 min-w-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isBusy}
          >
            <option value="">Wszystkie</option>
            <option value="ai-full">AI — bez zmian</option>
            <option value="ai-edited">AI — po edycji</option>
            <option value="manual">Manualne</option>
          </select>
        </div>
        <div className="grid gap-2">
          <label htmlFor={limitId} className="text-sm font-medium">
            Limit
          </label>
          <select
            id={limitId}
            value={filters.limit}
            onChange={handleLimitChange}
            className="h-10 min-w-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isBusy}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button variant="outline" onClick={handleReset} disabled={!canReset || isBusy}>
            Resetuj
          </Button>
        </div>
      </div>
    </section>
  );
};
