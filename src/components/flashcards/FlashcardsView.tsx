import * as React from "react";

import { Button } from "@/components/ui/button";
import { FlashcardFormDialog } from "@/components/flashcards/FlashcardFormDialog";
import { DeleteFlashcardDialog } from "@/components/flashcards/DeleteFlashcardDialog";
import { FlashcardsFiltersBar } from "@/components/flashcards/FlashcardsFiltersBar";
import { FlashcardsList } from "@/components/flashcards/FlashcardsList";
import { FlashcardsResultsMeta } from "@/components/flashcards/FlashcardsResultsMeta";
import { PaginationControls } from "@/components/flashcards/PaginationControls";
import { useDebouncedValue } from "@/components/hooks/useDebouncedValue";
import { useFlashcardsList } from "@/components/hooks/useFlashcardsList";
import { useFlashcardsQueryParams } from "@/components/hooks/useFlashcardsQueryParams";
import { useFlashcardMutations } from "@/components/hooks/useFlashcardMutations";
import type { FlashcardDTO } from "@/types";
import type { FlashcardFormValues, FlashcardsFiltersVM } from "@/lib/viewmodels/flashcardsViewmodels";

const FlashcardsView = () => {
  const { filters, setFilters } = useFlashcardsQueryParams();
  const [searchInput, setSearchInput] = React.useState(filters.q);

  React.useEffect(() => {
    setSearchInput(filters.q);
  }, [filters.q]);

  const debouncedSearch = useDebouncedValue(searchInput, 400);

  React.useEffect(() => {
    if (debouncedSearch === filters.q) {
      return;
    }
    setFilters({ q: debouncedSearch });
  }, [debouncedSearch, filters.q, setFilters]);

  const listFilters = React.useMemo<FlashcardsFiltersVM>(
    () => ({ ...filters, q: debouncedSearch }),
    [debouncedSearch, filters]
  );

  const { items, pageMeta, status, error, refresh } = useFlashcardsList(listFilters);
  const {
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    createState,
    updateState,
    deleteState,
    createError,
    updateError,
    deleteError,
    isBusy: isMutating,
  } = useFlashcardMutations({
    onSuccess: refresh,
  });

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [activeFlashcard, setActiveFlashcard] = React.useState<FlashcardDTO | undefined>();

  const isListLoading = status === "loading";
  const isBusy = isListLoading || isMutating;

  React.useEffect(() => {
    if (updateError?.code === "NOT_FOUND" || deleteError?.code === "NOT_FOUND") {
      refresh();
    }
  }, [deleteError?.code, refresh, updateError?.code]);

  const handleFiltersChange = React.useCallback(
    (partial: Partial<FlashcardsFiltersVM>) => {
      const keys = Object.keys(partial);
      const hasOnlySearch = keys.length === 1 && keys[0] === "q";
      if ("q" in partial) {
        setSearchInput(partial.q ?? "");
      }
      if (!hasOnlySearch) {
        setFilters(partial);
      }
    },
    [setFilters]
  );

  const handlePageChange = React.useCallback(
    (page: number) => {
      setFilters({ page });
    },
    [setFilters]
  );

  const handleOpenCreate = React.useCallback(() => {
    setCreateOpen(true);
  }, []);

  const handleEdit = React.useCallback(
    (id: string) => {
      const item = items.find((entry) => entry.id === id);
      if (!item) {
        return;
      }
      setActiveFlashcard(item);
      setEditOpen(true);
    },
    [items]
  );

  const handleDelete = React.useCallback(
    (id: string) => {
      const item = items.find((entry) => entry.id === id);
      if (!item) {
        return;
      }
      setActiveFlashcard(item);
      setDeleteOpen(true);
    },
    [items]
  );

  const handleCloseCreate = React.useCallback(() => {
    if (isMutating) {
      return;
    }
    setCreateOpen(false);
  }, [isMutating]);

  const handleCloseEdit = React.useCallback(() => {
    if (isMutating) {
      return;
    }
    setEditOpen(false);
    setActiveFlashcard(undefined);
  }, [isMutating]);

  const handleCloseDelete = React.useCallback(() => {
    if (isMutating) {
      return;
    }
    setDeleteOpen(false);
    setActiveFlashcard(undefined);
  }, [isMutating]);

  const handleCreateSubmit = React.useCallback(
    async (values: FlashcardFormValues) => {
      const result = await createFlashcard(values);
      if (result) {
        setCreateOpen(false);
      }
    },
    [createFlashcard]
  );

  const handleEditSubmit = React.useCallback(
    async (values: FlashcardFormValues) => {
      if (!activeFlashcard) {
        return;
      }
      const result = await updateFlashcard(activeFlashcard.id, values);
      if (result) {
        setEditOpen(false);
        setActiveFlashcard(undefined);
      }
    },
    [activeFlashcard, updateFlashcard]
  );

  const handleDeleteConfirm = React.useCallback(
    async (id: string) => {
      const result = await deleteFlashcard(id);
      if (result) {
        setDeleteOpen(false);
        setActiveFlashcard(undefined);
      }
    },
    [deleteFlashcard]
  );

  return (
    <section className="grid gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Moje fiszki</h1>
          <p className="text-sm text-muted-foreground">Zarządzaj zapisanymi fiszkami, filtruj i edytuj wpisy.</p>
        </div>
        <Button onClick={handleOpenCreate} disabled={isMutating}>
          Dodaj fiszkę
        </Button>
      </header>

      <FlashcardsFiltersBar
        filters={{ ...filters, q: searchInput }}
        onFiltersChange={handleFiltersChange}
        isBusy={isBusy}
      />

      <FlashcardsResultsMeta pageMeta={pageMeta} />

      <FlashcardsList
        items={items}
        state={status}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRetry={refresh}
      />

      <PaginationControls pageMeta={pageMeta} onPageChange={handlePageChange} isBusy={isBusy} />

      <FlashcardFormDialog
        open={createOpen}
        mode="create"
        isBusy={createState === "loading"}
        submitError={createError?.message}
        onClose={handleCloseCreate}
        onSubmit={handleCreateSubmit}
      />
      <FlashcardFormDialog
        open={editOpen}
        mode="edit"
        initialValues={
          activeFlashcard
            ? {
                front: activeFlashcard.front,
                back: activeFlashcard.back,
              }
            : undefined
        }
        isBusy={updateState === "loading"}
        submitError={updateError?.message}
        onClose={handleCloseEdit}
        onSubmit={handleEditSubmit}
      />
      <DeleteFlashcardDialog
        open={deleteOpen}
        flashcard={activeFlashcard}
        isBusy={deleteState === "loading"}
        error={deleteError?.message}
        onClose={handleCloseDelete}
        onConfirm={handleDeleteConfirm}
      />
    </section>
  );
};

export default FlashcardsView;
