import * as React from "react";

import { fetchJson, getAuthorizationHeader, ApiError } from "@/lib/api/client";
import type { FlashcardDTO, PageMeta, PagedResponse } from "@/types";
import type { ApiErrorVM, ApiRequestState, FlashcardsFiltersVM } from "@/lib/viewmodels/flashcardsViewmodels";

const FLASHCARDS_ENDPOINT = "/api/v1/flashcards";

const mapApiError = (error: unknown): ApiErrorVM => {
  if (error instanceof ApiError) {
    const fallbackMessage = error.message || "Wystąpił nieoczekiwany błąd.";
    const messageByCode: Record<string, string> = {
      UNAUTHORIZED: "Twoja sesja wygasła. Zaloguj się ponownie.",
      NOT_FOUND: "Nie znaleziono fiszki.",
      DB_ERROR: "Wystąpił błąd serwera. Spróbuj ponownie.",
    };

    const message = error.code && messageByCode[error.code] ? messageByCode[error.code] : fallbackMessage;

    return {
      httpStatus: error.status,
      code: error.code,
      message,
      details: error.details,
    };
  }

  return {
    message: "Nie udało się połączyć z serwerem.",
  };
};

const buildQuery = (filters: FlashcardsFiltersVM) => {
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
  params.set("sort", filters.sort);
  params.set("order", filters.order);

  return params.toString();
};

const goTo = (href: string) => {
  window.location.href = href;
};

export const useFlashcardsList = (filters: FlashcardsFiltersVM) => {
  const [items, setItems] = React.useState<FlashcardDTO[]>([]);
  const [pageMeta, setPageMeta] = React.useState<PageMeta>({
    page: filters.page,
    limit: filters.limit,
    total: 0,
  });
  const [status, setStatus] = React.useState<ApiRequestState>("idle");
  const [error, setError] = React.useState<ApiErrorVM | undefined>();

  const abortRef = React.useRef<AbortController | null>(null);

  const fetchList = React.useCallback(async () => {
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setError(undefined);

    try {
      const query = buildQuery(filters);
      const response = await fetchJson<PagedResponse<FlashcardDTO>>(
        `${FLASHCARDS_ENDPOINT}${query ? `?${query}` : ""}`,
        {
          headers: {
            ...getAuthorizationHeader(),
          },
          signal: controller.signal,
        }
      );

      setItems(response.data);
      setPageMeta(response.page);
      setStatus("success");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      const mapped = mapApiError(err);
      setError(mapped);
      setStatus("error");

      if (mapped.httpStatus === 401 || mapped.code === "UNAUTHORIZED") {
        goTo("/login");
      }
    }
  }, [filters]);

  React.useEffect(() => {
    fetchList();

    return () => {
      abortRef.current?.abort();
    };
  }, [fetchList]);

  const refresh = React.useCallback(() => {
    fetchList();
  }, [fetchList]);

  return {
    items,
    pageMeta,
    status,
    error,
    refresh,
  };
};
