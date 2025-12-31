import type { MeDTO } from "@/types";
import type { ApiErrorVM, ApiRequestState } from "@/lib/viewmodels/generateFlashcards";

export type { ApiErrorVM, ApiRequestState };

export interface AccountUserVM {
  id: string;
  email: string;
  emailLabel: string;
}

export interface AccountStatsVM {
  flashcardsCount: number;
  generationsCount: number;
  flashcardsLabel: string;
  generationsLabel: string;
}

export interface MeViewModel {
  user: AccountUserVM;
  stats: AccountStatsVM;
}

export const mapMeDtoToViewModel = (dto: MeDTO): MeViewModel => {
  return {
    user: {
      id: dto.user.id,
      email: dto.user.email,
      emailLabel: "Email",
    },
    stats: {
      flashcardsCount: dto.stats.flashcardsCount,
      generationsCount: dto.stats.generationsCount,
      flashcardsLabel: "Liczba fiszek",
      generationsLabel: "Liczba generacji",
    },
  };
};
