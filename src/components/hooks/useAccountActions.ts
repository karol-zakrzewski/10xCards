import * as React from "react";

import { fetchJson, ApiError } from "@/lib/api/client";
import type { DeletedResponse } from "@/types";
import type { ApiErrorVM, ApiRequestState } from "@/lib/viewmodels/accountViewmodels";

const ME_ENDPOINT = "/api/v1/me";
const SIGN_OUT_ENDPOINT = "/api/v1/auth/sign-out";

const mapApiError = (error: unknown): ApiErrorVM => {
  if (error instanceof ApiError) {
    const fallbackMessage = error.message || "Wystąpił nieoczekiwany błąd.";
    const messageByCode: Record<string, string> = {
      UNAUTHORIZED: "Twoja sesja wygasła. Zaloguj się ponownie.",
      VALIDATION_ERROR: "Potwierdź operację, zaznaczając checkbox.",
      FORBIDDEN: "Nie masz uprawnień do usunięcia konta.",
      DB_ERROR: "Wystąpił błąd serwera. Spróbuj ponownie.",
      AUTH_ERROR: "Wystąpił błąd serwera. Spróbuj ponownie.",
      INTERNAL_ERROR: "Wystąpił błąd serwera. Spróbuj ponownie.",
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

const goTo = (href: string) => {
  window.location.href = href;
};

export const useAccountActions = () => {
  const [deleteState, setDeleteState] = React.useState<ApiRequestState>("idle");
  const [deleteError, setDeleteError] = React.useState<ApiErrorVM | undefined>();
  const [logoutState, setLogoutState] = React.useState<ApiRequestState>("idle");

  const resetDeleteState = React.useCallback(() => {
    setDeleteState("idle");
    setDeleteError(undefined);
  }, []);

  const logout = React.useCallback(() => {
    if (logoutState === "loading") {
      return;
    }

    setLogoutState("loading");
    fetchJson(SIGN_OUT_ENDPOINT, { method: "POST" })
      .catch(() => undefined)
      .finally(() => {
        setLogoutState("success");
        goTo("/login");
      });
  }, [logoutState]);

  const deleteAccount = React.useCallback(async () => {
    if (deleteState === "loading") {
      return false;
    }

    setDeleteState("loading");
    setDeleteError(undefined);

    try {
      const response = await fetchJson<{ data: DeletedResponse }>(ME_ENDPOINT, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirm: true }),
      });

      setDeleteState("success");

      if (response.data.deleted) {
        goTo("/login");
      }

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
  }, [deleteState]);

  return {
    deleteAccount,
    deleteState,
    deleteError,
    resetDeleteState,
    logout,
    logoutState,
  };
};
