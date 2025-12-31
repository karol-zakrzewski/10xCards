import * as React from "react";

import type { FlashcardSource } from "@/types";
import type { FlashcardsFiltersVM } from "@/lib/viewmodels/flashcardsViewmodels";

const DEFAULT_LIMIT = 20;
const DEFAULT_FILTERS: FlashcardsFiltersVM = {
  q: "",
  page: 1,
  limit: DEFAULT_LIMIT,
  sort: "created_at",
  order: "desc",
};

const VALID_SOURCES = new Set<FlashcardSource>(["ai-full", "ai-edited", "manual"]);

const clamp = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
};

const parseIntParam = (value: string | null, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return parsed;
};

const getFiltersFromSearch = (search: string, base: FlashcardsFiltersVM): FlashcardsFiltersVM => {
  const params = new URLSearchParams(search);
  const sourceParam = params.get("source");
  const source =
    sourceParam && VALID_SOURCES.has(sourceParam as FlashcardSource) ? (sourceParam as FlashcardSource) : undefined;
  const page = Math.max(1, parseIntParam(params.get("page"), base.page));
  const limit = clamp(parseIntParam(params.get("limit"), base.limit), 1, 100);
  const q = params.get("q") ?? base.q;

  return {
    ...base,
    q,
    source,
    page,
    limit,
    sort: "created_at",
    order: "desc",
  };
};

const buildSearch = (filters: FlashcardsFiltersVM) => {
  const params = new URLSearchParams();
  const trimmedQuery = filters.q.trim();
  if (trimmedQuery.length >= 1 && trimmedQuery.length <= 200) {
    params.set("q", trimmedQuery);
  }
  if (filters.source) {
    params.set("source", filters.source);
  }
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));
  return params.toString();
};

const normalizeFilters = (filters: FlashcardsFiltersVM) => {
  const source = filters.source && VALID_SOURCES.has(filters.source) ? filters.source : undefined;
  const page = Math.max(1, Number.isNaN(filters.page) ? 1 : Math.floor(filters.page));
  const limit = clamp(Number.isNaN(filters.limit) ? DEFAULT_LIMIT : Math.floor(filters.limit), 1, 100);

  return {
    ...filters,
    source,
    page,
    limit,
    sort: "created_at",
    order: "desc",
  };
};

export const useFlashcardsQueryParams = (overrides?: Partial<FlashcardsFiltersVM>) => {
  const getInitialFilters = React.useCallback(() => {
    if (typeof window === "undefined") {
      return normalizeFilters({ ...DEFAULT_FILTERS, ...overrides });
    }

    const base = normalizeFilters({ ...DEFAULT_FILTERS, ...overrides });
    return getFiltersFromSearch(window.location.search, base);
  }, [overrides]);

  const [filters, setFilters] = React.useState<FlashcardsFiltersVM>(getInitialFilters);

  const syncUrl = React.useCallback((next: FlashcardsFiltersVM) => {
    if (typeof window === "undefined") {
      return;
    }

    const search = buildSearch(next);
    const nextUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname;
    window.history.replaceState(null, "", nextUrl);
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handlePopState = () => {
      const base = normalizeFilters({ ...DEFAULT_FILTERS, ...overrides });
      setFilters(getFiltersFromSearch(window.location.search, base));
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [overrides]);

  const updateFilters = React.useCallback(
    (partial: Partial<FlashcardsFiltersVM>) => {
      setFilters((current) => {
        const shouldResetPage = "q" in partial || "source" in partial || "limit" in partial;
        const next = normalizeFilters({ ...current, ...partial });
        const nextWithPage = shouldResetPage ? { ...next, page: 1 } : next;
        syncUrl(nextWithPage);
        return nextWithPage;
      });
    },
    [syncUrl]
  );

  return {
    filters,
    setFilters: updateFilters,
  };
};
