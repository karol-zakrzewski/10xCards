import * as React from "react";

import { fetchJson, getAuthorizationHeader, ApiError } from "@/lib/api/client";
import type { FlashcardCreateCommand, FlashcardDTO, FlashcardUpdateCommand, DeletedResponse } from "@/types";
import type { ApiErrorVM, ApiRequestState, FlashcardFormValues } from "@/lib/viewmodels/flashcardsViewmodels";

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

interface FlashcardMutationsOptions {
  onSuccess?: () => void;
}

const goTo = (href: string) => {
  window.location.href = href;
};

export const useFlashcardMutations = (options: FlashcardMutationsOptions = {}) => {
  const { onSuccess } = options;

  const [createState, setCreateState] = React.useState<ApiRequestState>("idle");
  const [createError, setCreateError] = React.useState<ApiErrorVM | undefined>();
  const [updateState, setUpdateState] = React.useState<ApiRequestState>("idle");
  const [updateError, setUpdateError] = React.useState<ApiErrorVM | undefined>();
  const [deleteState, setDeleteState] = React.useState<ApiRequestState>("idle");
  const [deleteError, setDeleteError] = React.useState<ApiErrorVM | undefined>();

  const createFlashcard = React.useCallback(
    async (values: FlashcardFormValues) => {
      if (createState === "loading") {
        return null;
      }

      setCreateState("loading");
      setCreateError(undefined);

      try {
        const payload: FlashcardCreateCommand = {
          front: values.front,
          back: values.back,
          source: "manual",
        };

        const response = await fetchJson<{ data: FlashcardDTO }>(FLASHCARDS_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthorizationHeader(),
          },
          body: JSON.stringify(payload),
        });

        setCreateState("success");
        onSuccess?.();
        return response.data;
      } catch (err) {
        const mapped = mapApiError(err);
        setCreateError(mapped);
        setCreateState("error");

        if (mapped.httpStatus === 401 || mapped.code === "UNAUTHORIZED") {
          goTo("/login");
        }

        return null;
      }
    },
    [createState, onSuccess]
  );

  const updateFlashcard = React.useCallback(
    async (id: string, values: FlashcardFormValues) => {
      if (updateState === "loading") {
        return null;
      }

      setUpdateState("loading");
      setUpdateError(undefined);

      try {
        const payload: FlashcardUpdateCommand = {
          front: values.front,
          back: values.back,
        };

        const response = await fetchJson<{ data: FlashcardDTO }>(`${FLASHCARDS_ENDPOINT}/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...getAuthorizationHeader(),
          },
          body: JSON.stringify(payload),
        });

        setUpdateState("success");
        onSuccess?.();
        return response.data;
      } catch (err) {
        const mapped = mapApiError(err);
        setUpdateError(mapped);
        setUpdateState("error");

        if (mapped.httpStatus === 401 || mapped.code === "UNAUTHORIZED") {
          goTo("/login");
        }

        return null;
      }
    },
    [onSuccess, updateState]
  );

  const deleteFlashcard = React.useCallback(
    async (id: string) => {
      if (deleteState === "loading") {
        return false;
      }

      setDeleteState("loading");
      setDeleteError(undefined);

      try {
        const response = await fetchJson<{ data: DeletedResponse }>(`${FLASHCARDS_ENDPOINT}/${id}`, {
          method: "DELETE",
          headers: {
            ...getAuthorizationHeader(),
          },
        });

        setDeleteState("success");
        onSuccess?.();
        return response.data.deleted;
      } catch (err) {
        const mapped = mapApiError(err);
        setDeleteError(mapped);
        setDeleteState("error");

        if (mapped.httpStatus === 401 || mapped.code === "UNAUTHORIZED") {
          goTo("/login");
        }

        return false;
      }
    },
    [deleteState, onSuccess]
  );

  const isBusy = createState === "loading" || updateState === "loading" || deleteState === "loading";

  return {
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    createState,
    updateState,
    deleteState,
    createError,
    updateError,
    deleteError,
    isBusy,
  };
};
