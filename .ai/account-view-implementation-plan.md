# Plan implementacji widoku Panel użytkownika

## 1. Przegląd
Widok „Panel użytkownika” prezentuje dane konta (email) oraz podstawowe statystyki (liczba fiszek i generacji) i udostępnia akcje wylogowania oraz usunięcia konta. Widok działa po zalogowaniu, korzysta z App Shell i komunikuje się z API `GET /me` oraz `DELETE /me`.

## 2. Routing widoku
- Ścieżka: `/account`
- Plik routingu: `src/pages/account.astro` (Astro + `AppShellLayout` + React view `client:load`).

## 3. Struktura komponentów
```
AccountPage (Astro)
└─ AccountView (React)
   ├─ AccountHeader
   ├─ AccountProfileCard
   ├─ AccountStatsCard
   │  ├─ AccountStatItem (x2)
   ├─ AccountActionsCard
   │  ├─ Button (Wyloguj)
   │  ├─ Button (Usuń konto)
   └─ DeleteAccountDialog
      ├─ Checkbox (potwierdzenie)
      ├─ Alert (błędy)
      └─ Button (Usuń / Anuluj)
```

## 4. Szczegóły komponentów

### AccountView
- Opis komponentu: Kontener logiki widoku; pobiera dane `/me`, zarządza stanem ładowania/błędów, steruje dialogiem usunięcia i wylogowaniem.
- Główne elementy: nagłówek + sekcje w układzie grid (np. `div` z `grid gap-6`), komponenty kartowe (`Card`).
- Obsługiwane interakcje:
  - Mount → `GET /me`.
  - Klik „Wyloguj” → akcja wylogowania i przekierowanie.
  - Klik „Usuń konto” → otwarcie dialogu.
  - Potwierdzenie w dialogu → `DELETE /me`.
- Obsługiwana walidacja:
  - Blokada akcji „Usuń” bez zaznaczonego checkboxa (wymóg `confirm: true`).
  - Blokada zamknięcia dialogu podczas requestu usunięcia.
- Typy: `MeDTO`, `MeViewModel`, `ApiRequestState`, `ApiErrorVM`, `DeletedResponse`.
- Propsy: brak (top‑level view).

### AccountHeader
- Opis komponentu: Prosty nagłówek sekcji (tytuł + opis podtytułowy).
- Główne elementy: `h1`, `p`.
- Obsługiwane interakcje: brak.
- Obsługiwana walidacja: brak.
- Typy: brak.
- Propsy: `title: string`, `subtitle?: string`.

### AccountProfileCard
- Opis komponentu: Karta z danymi profilu (email).
- Główne elementy: `Card`, `CardHeader`, `CardContent`, tekst email.
- Obsługiwane interakcje: brak.
- Obsługiwana walidacja: brak.
- Typy: `AccountUserVM`.
- Propsy: `user: AccountUserVM`, `isLoading: boolean` (do placeholdera/loadera).

### AccountStatsCard
- Opis komponentu: Karta ze statystykami użytkownika.
- Główne elementy: `Card`, `CardContent`, lista statystyk (np. `dl` lub grid).
- Obsługiwane interakcje: brak.
- Obsługiwana walidacja: brak.
- Typy: `AccountStatsVM`.
- Propsy: `stats: AccountStatsVM`, `isLoading: boolean`.

### AccountStatItem
- Opis komponentu: Pojedyncza metryka (etykieta + wartość).
- Główne elementy: `div`, `span`, opcjonalnie `Badge`.
- Obsługiwane interakcje: brak.
- Obsługiwana walidacja: brak.
- Typy: `{ label: string; value: number | string }`.
- Propsy: `label`, `value`, `isLoading?: boolean`.

### AccountActionsCard
- Opis komponentu: Karta z CTA (Wyloguj, Usuń konto).
- Główne elementy: `Card`, `Button`.
- Obsługiwane interakcje:
  - Klik „Wyloguj”.
  - Klik „Usuń konto”.
- Obsługiwana walidacja: blokady przycisków podczas aktywnego requestu.
- Typy: `ApiRequestState`.
- Propsy: `onLogout`, `onOpenDelete`, `isBusy`.

### DeleteAccountDialog
- Opis komponentu: Dialog destrukcyjny z checkboxem potwierdzającym i obsługą błędów.
- Główne elementy: `Dialog`, `DialogHeader`, `DialogContent`, `Alert`, `input type="checkbox"`, `Button`.
- Obsługiwane interakcje:
  - Zmiana checkboxa.
  - Klik „Usuń konto” → `onConfirm`.
  - Klik „Anuluj” → `onClose` (tylko gdy `isBusy=false`).
- Obsługiwana walidacja:
  - Wymagane `confirm=true` (checkbox zaznaczony) przed enable „Usuń”.
  - Blokada zamknięcia dialogu podczas requestu.
- Typy: `ApiErrorVM`.
- Propsy: `open`, `isBusy`, `error`, `confirmed`, `onConfirm`, `onClose`, `onConfirmChange`.

## 5. Typy

### DTO (istniejące)
- `MeDTO` (`src/types.ts`)
  - `user: MeUserDTO` → `{ id: string; email: string }`
  - `stats: MeStatsDTO` → `{ flashcardsCount: number; generationsCount: number }`
- `DeletedResponse` → `{ deleted: true }`
- `ErrorResponse` → `{ error: { code: string; message: string; details?: Record<string, unknown> } }`

### ViewModel (nowe)
- `AccountUserVM`
  - `id: string`
  - `email: string`
  - `emailLabel: string` (np. „Email”)
- `AccountStatsVM`
  - `flashcardsCount: number`
  - `generationsCount: number`
  - `flashcardsLabel: string` (np. „Liczba fiszek”)
  - `generationsLabel: string` (np. „Liczba generacji”)
- `MeViewModel`
  - `user: AccountUserVM`
  - `stats: AccountStatsVM`
- `AccountRequestState` → alias `ApiRequestState` (`"idle" | "loading" | "success" | "error"`).
- `AccountErrorVM` → alias `ApiErrorVM` (wykorzystanie istniejącego modelu).

## 6. Zarządzanie stanem
- Lokalny state w `AccountView`:
  - `meState: ApiRequestState`
  - `meError?: ApiErrorVM`
  - `meData?: MeViewModel`
  - `deleteState: ApiRequestState`
  - `deleteError?: ApiErrorVM`
  - `deleteDialogOpen: boolean`
  - `deleteConfirmed: boolean`
  - `logoutState: ApiRequestState` (opcjonalnie, jeśli wylogowanie ma loader)
- Custom hook (zalecane): `useMe()`
  - Odpowiada za `GET /me`, mapowanie błędów i zwraca `data`, `status`, `error`, `refresh`.
- Custom hook (zalecane): `useAccountActions()`
  - Odpowiada za `DELETE /me` i logikę wylogowania (np. `signOut`), zwraca `deleteAccount`, `deleteState`, `deleteError`.

## 7. Integracja API

### GET `/api/v1/me`
- Wywołanie: na mount `AccountView` (w hooku `useMe`).
- Headers: `Authorization` z `getAuthorizationHeader()`.
- Typ odpowiedzi: `fetchJson<{ data: MeDTO }>`.
- Mapowanie na VM:
  - `MeDTO.user.email` → `AccountUserVM.email`.
  - `MeDTO.stats.*` → `AccountStatsVM.*`.
- Reakcja na błędy:
  - `401` → redirect do `/login`.
  - `500`/`DB_ERROR` → komunikat w `Alert`.

### DELETE `/api/v1/me`
- Wywołanie: po potwierdzeniu w dialogu.
- Body: `{ "confirm": true }`.
- Headers: `Content-Type: application/json` + `Authorization`.
- Typ odpowiedzi: `fetchJson<{ data: DeletedResponse }>`.
- Po sukcesie:
  - wylogowanie (Supabase Auth `signOut` jeśli dostępne),
  - przekierowanie do `/login` lub `/register` (zgodnie z UI‑plan).

## 8. Interakcje użytkownika
- Wejście na `/account` → widok ładuje dane użytkownika i statystyki.
- Klik „Wyloguj” → czyści sesję + redirect do `/login`.
- Klik „Usuń konto” → otwiera dialog.
- Zaznaczenie checkboxa → aktywuje przycisk „Usuń konto”.
- Klik „Usuń konto” → wysyła `DELETE /me`, pokazuje loader i blokuje zamknięcie dialogu.
- Sukces usunięcia → wylogowanie i przekierowanie, opcjonalny komunikat.

## 9. Warunki i walidacja
- `DELETE /me` wymaga `confirm=true`:
  - UI wymusza zaznaczenie checkboxa przed aktywacją przycisku.
  - W przypadku `400 VALIDATION_ERROR` pokazuje błąd inline w dialogu.
- Wszystkie requesty wymagają `Authorization`:
  - brak lub `401` → redirect do `/login`.
- Podczas `deleteState === "loading"`:
  - przycisk „Usuń” i „Anuluj” disabled,
  - blokada zamknięcia dialogu.

## 10. Obsługa błędów
- `401 UNAUTHORIZED` → komunikat „Sesja wygasła” + redirect.
- `400 VALIDATION_ERROR` → inline w dialogu (np. „Potwierdź operację, zaznaczając checkbox”).
- `403 FORBIDDEN` → komunikat o braku uprawnień do self‑delete.
- `500 DB_ERROR/AUTH_ERROR` → ogólny komunikat „Wystąpił błąd serwera. Spróbuj ponownie.”
- Błędy sieci → komunikat „Nie udało się połączyć z serwerem.”

## 11. Kroki implementacji
1. Utwórz stronę `src/pages/account.astro` z `Layout` i `AppShellLayout` oraz `AccountView client:load`.
2. Dodaj folder `src/components/account/` i komponent `AccountView.tsx` (logika + layout sekcji).
3. Zaimplementuj `AccountHeader`, `AccountProfileCard`, `AccountStatsCard`, `AccountActionsCard`.
4. Dodaj `DeleteAccountDialog` na wzór `DeleteFlashcardDialog` z checkboxem i blokadą zamknięcia w trakcie requestu.
5. Utwórz `src/lib/viewmodels/accountViewmodels.ts` i zdefiniuj `MeViewModel`, `AccountUserVM`, `AccountStatsVM` (oraz re‑export `ApiRequestState`/`ApiErrorVM`).
6. Zaimplementuj hook `useMe` (GET `/me`) z mapowaniem błędów i redirectem na `401`.
7. Zaimplementuj hook `useAccountActions` (DELETE `/me` + sign‑out) z obsługą błędów (`400/403/500`).
8. Dodaj logikę wylogowania (preferowane: Supabase Auth `signOut`; fallback: usunięcie tokenów z `localStorage` i redirect `/login`).
9. Dodaj komunikaty błędów w `Alert` w kartach i w dialogu.
10. Sprawdź zachowanie w stanach: ładowanie, błąd, sukces; upewnij się, że dialog nie zamyka się w trakcie usuwania konta.
11. (Opcjonalnie) Dodaj prosty placeholder/szkielet w kartach na czas `meState === "loading"`.
