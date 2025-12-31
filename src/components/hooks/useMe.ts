import * as React from "react";

import { fetchJson, getAuthorizationHeader, ApiError } from "@/lib/api/client";
import type { MeDTO } from "@/types";
import {
  mapMeDtoToViewModel,
  type ApiErrorVM,
  type ApiRequestState,
  type MeViewModel,
} from "@/lib/viewmodels/accountViewmodels";

const ME_ENDPOINT = "/api/v1/me";

const mapApiError = (error: unknown): ApiErrorVM => {
  if (error instanceof ApiError) {
    const fallbackMessage = error.message || "Wystąpił nieoczekiwany błąd.";
    const messageByCode: Record<string, string> = {
      UNAUTHORIZED: "Twoja sesja wygasła. Zaloguj się ponownie.",
      DB_ERROR: "Wystąpił błąd serwera. Spróbuj ponownie.",
      AUTH_ERROR: "Wystąpił błąd serwera. Spróbuj ponownie.",
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

export const useMe = () => {
  const [data, setData] = React.useState<MeViewModel | undefined>();
  const [status, setStatus] = React.useState<ApiRequestState>("idle");
  const [error, setError] = React.useState<ApiErrorVM | undefined>();

  const abortRef = React.useRef<AbortController | null>(null);

  const fetchMe = React.useCallback(async () => {
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setError(undefined);

    try {
      const response = await fetchJson<{ data: MeDTO }>(ME_ENDPOINT, {
        headers: {
          ...getAuthorizationHeader(),
        },
        signal: controller.signal,
      });

      setData(mapMeDtoToViewModel(response.data));
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
  }, []);

  React.useEffect(() => {
    fetchMe();

    return () => {
      abortRef.current?.abort();
    };
  }, [fetchMe]);

  const refresh = React.useCallback(() => {
    fetchMe();
  }, [fetchMe]);

  return {
    data,
    status,
    error,
    refresh,
  };
};
