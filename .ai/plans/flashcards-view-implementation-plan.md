# Plan implementacji widoku Moje fiszki

## 1. Przegląd
Widok „Moje fiszki” pozwala zalogowanemu użytkownikowi przeglądać zapisane fiszki, filtrować je, tworzyć ręcznie nowe, edytować istniejące oraz usuwać je po potwierdzeniu. Widok opiera się o API `/flashcards` i musi respektować walidacje backendu (długości pól, parametry listy), UI w języku polskim oraz minimalny, spójny styl z resztą aplikacji (Astro + React + shadcn/ui).

## 2. Routing widoku
- Ścieżka: `/flashcards`
- Plik: `src/pages/flashcards.astro`
- Layout: `src/layouts/AppShellLayout.astro`
- Główny komponent React: `FlashcardsView` (client:load)

## 3. Struktura komponentów
```
FlashcardsPage (Astro)
└─ AppShellLayout
   └─ FlashcardsView (React)
      ├─ FlashcardsFiltersBar
      ├─ FlashcardsResultsMeta
      ├─ FlashcardsList
      │  └─ FlashcardListItem (xN)
      ├─ PaginationControls
      ├─ FlashcardFormDialog (mode: create)
      ├─ FlashcardFormDialog (mode: edit)
      └─ DeleteFlashcardDialog
```

## 4. Szczegóły komponentów

### FlashcardsPage (Astro)
- Opis komponentu: warstwa routingu, wstrzyknięcie layoutu i mount React.
- Główne elementy: `AppShellLayout`, `FlashcardsView`.
- Obsługiwane interakcje: brak (render statyczny).
- Obsługiwana walidacja: brak.
- Typy: brak.
- Propsy: brak.

### FlashcardsView
- Opis komponentu: główny kontener logiki i stanu listy fiszek, filtrów i modali.
- Główne elementy: sekcja z filtrami, lista/empty/error, paginacja, modale CRUD.
- Obsługiwane interakcje:
  - Zmiana `q`, `source`, `limit`.
  - Zmiana strony (paginacja).
  - Otwieranie/ zamykanie dialogów (dodaj/edytuj/usuń).
  - Zapis nowej fiszki, zapis edycji, potwierdzenie usunięcia.
- Obsługiwana walidacja:
  - Przekazywanie walidacji formularza do dialogów.
  - Reset `page=1` po zmianie `q`/`source`/`limit`.
- Typy:
  - `FlashcardsFiltersVM`, `FlashcardsListState`, `ApiRequestState`, `ApiErrorVM`.
- Propsy:
  - Brak (komponent autonomiczny).

### FlashcardsFiltersBar
- Opis komponentu: pasek filtrów listy fiszek z debounced wyszukiwaniem i limitami.
- Główne elementy:
  - Pole wyszukiwania (input tekstowy).
  - Select `source` (ai-full, ai-edited, manual, „Wszystkie”).
  - Select `limit` (np. 10/20/50/100).
  - Przycisk „Resetuj” (opcjonalnie).
- Obsługiwane interakcje:
  - `onSearchChange` (debounce 300–500 ms).
  - `onSourceChange`.
  - `onLimitChange`.
  - `onReset`.
- Obsługiwana walidacja:
  - `q` po trim: długość 1–200 lub brak parametru.
  - `limit` 1–100.
- Typy:
  - `FlashcardsFiltersVM`.
- Propsy:
  - `filters: FlashcardsFiltersVM`
  - `onFiltersChange(partial)`
  - `isBusy: boolean`

### FlashcardsResultsMeta
- Opis komponentu: informacja „X–Y z total” i liczba wyników.
- Główne elementy: tekst, ewentualnie mały badge.
- Obsługiwane interakcje: brak.
- Obsługiwana walidacja: brak.
- Typy: `PageMeta`.
- Propsy: `pageMeta: PageMeta`.

### FlashcardsList
- Opis komponentu: render listy wyników jako tabela/karty zależnie od responsywności.
- Główne elementy: lista (`ul`/`div`), elementy `FlashcardListItem`, stany empty/error/loading.
- Obsługiwane interakcje:
  - Przekazanie akcji „Edytuj” i „Usuń” do elementów.
  - `onRetry` dla błędów.
- Obsługiwana walidacja: brak (prezentacja).
- Typy: `FlashcardDTO`, `ApiRequestState`, `ApiErrorVM`.
- Propsy:
  - `items: FlashcardDTO[]`
  - `state: ApiRequestState`
  - `error?: ApiErrorVM`
  - `onEdit(id)`
  - `onDelete(id)`
  - `onRetry()`

### FlashcardListItem
- Opis komponentu: pojedyncza fiszka z podglądem, źródłem i akcjami.
- Główne elementy:
  - Card/list item.
  - Skrócony `front` i `back` (np. line-clamp).
  - Badge `source`.
  - Daty (`createdAt`/`updatedAt`).
  - Przyciski „Edytuj” i „Usuń”.
- Obsługiwane interakcje: kliknięcia przycisków akcji.
- Obsługiwana walidacja: brak (prezentacja).
- Typy: `FlashcardDTO`.
- Propsy:
  - `item: FlashcardDTO`
  - `onEdit(id)`
  - `onDelete(id)`

### PaginationControls
- Opis komponentu: nawigacja po stronach listy.
- Główne elementy: przyciski „Poprzednia”, „Następna”, opcjonalnie numer strony.
- Obsługiwane interakcje: `onPageChange(nextPage)`.
- Obsługiwana walidacja:
  - `page >= 1`.
  - `page` nie przekracza maksymalnej strony wyliczonej z `total` i `limit`.
- Typy: `PageMeta`.
- Propsy:
  - `pageMeta: PageMeta`
  - `onPageChange(page)`
  - `isBusy: boolean`

### FlashcardFormDialog
- Opis komponentu: modal do tworzenia i edycji fiszek (wspólny komponent z trybem `create`/`edit`).
- Główne elementy:
  - `Dialog`, `DialogHeader`, `DialogFooter`.
  - `Textarea` dla pól „Przód” i „Tył”.
  - Alert z błędem walidacji (inline).
- Obsługiwane interakcje:
  - Zmiana pól formularza.
  - „Anuluj” → zamknięcie.
  - „Zapisz” → wywołanie `onSubmit`.
- Obsługiwana walidacja:
  - `front`: trim, 1–200 znaków.
  - `back`: trim, 1–500 znaków.
  - `isDirty` (dla edycji) – brak zapisu bez zmian.
- Typy:
  - `FlashcardFormMode`, `FlashcardFormState`, `FlashcardFormValues`, `FlashcardFormErrors`.
- Propsy:
  - `open: boolean`
  - `mode: "create" | "edit"`
  - `initialValues?: FlashcardFormValues`
  - `isBusy: boolean`
  - `submitError?: string`
  - `onClose()`
  - `onSubmit(values)`

### DeleteFlashcardDialog
- Opis komponentu: modal potwierdzenia trwałego usunięcia fiszki.
- Główne elementy:
  - `Dialog`/`AlertDialog` (jeśli zostanie dodany), opis skutków.
  - Przyciski „Anuluj” i „Usuń”.
- Obsługiwane interakcje:
  - Potwierdzenie usunięcia.
  - Blokada zamknięcia podczas requestu.
- Obsługiwana walidacja:
  - Wymuszenie explicit potwierdzenia przed wykonaniem API call.
- Typy: brak dodatkowych.
- Propsy:
  - `open: boolean`
  - `flashcard?: FlashcardDTO`
  - `isBusy: boolean`
  - `error?: string`
  - `onClose()`
  - `onConfirm(id)`

## 5. Typy
- **Istniejące (z `src/types.ts`):**
  - `FlashcardDTO`, `FlashcardSource`, `PageMeta`, `PagedResponse<T>`, `FlashcardCreateCommand`, `FlashcardUpdateCommand`, `DeletedResponse`, `ErrorResponse`.
- **Nowe (ViewModel / UI):**
  - `FlashcardsFiltersVM`:
    - `q: string` (nieztrimowane pole inputu)
    - `source?: FlashcardSource`
    - `page: number`
    - `limit: number`
    - `sort: "created_at"` (stałe na MVP)
    - `order: "desc"` (stałe na MVP)
  - `FlashcardsListState`:
    - `items: FlashcardDTO[]`
    - `pageMeta: PageMeta`
    - `status: ApiRequestState`
    - `error?: ApiErrorVM`
  - `FlashcardFormValues`:
    - `front: string`
    - `back: string`
  - `FlashcardFormErrors`:
    - `front?: string`
    - `back?: string`
  - `FlashcardFormState`:
    - `values: FlashcardFormValues`
    - `errors: FlashcardFormErrors`
    - `isValid: boolean`
    - `isDirty: boolean`
  - `FlashcardFormMode`: `"create" | "edit"`
  - `ApiRequestState`: `"idle" | "loading" | "success" | "error"` (można współdzielić z istniejącym typem z `generateFlashcards.ts`).
  - `ApiErrorVM`: `{ httpStatus?: number; code?: string; message: string; details?: Record<string, unknown> }` (można współdzielić).

## 6. Zarządzanie stanem
- **Lokalny stan w `FlashcardsView`:**
  - `filters` (źródło: URL + stan lokalny do inputów).
  - `listState` (items + pageMeta + status + error).
  - `createDialogOpen`, `editDialogOpen`, `deleteDialogOpen`.
  - `activeFlashcard` (obiekt do edycji/usunięcia).
  - `createState`, `editState`, `deleteState` (można trzymać w `ApiRequestState`).
- **Custom hooki (zalecane):**
  - `useFlashcardsQueryParams` – parsowanie i aktualizacja `q/source/page/limit` w URL (History API). Reset `page=1` po zmianie filtrów.
  - `useDebouncedValue` – opóźnienie aktualizacji `q` do fetchu.
  - `useFlashcardsList` – pobieranie listy z `AbortController`, mapowanie błędów.
  - `useFlashcardMutations` – `create`, `update`, `remove` z obsługą błędów i refetch.

## 7. Integracja API
- **GET `/api/v1/flashcards`**
  - Query: `page`, `limit`, `q`, `source`, `sort`, `order`.
  - Response: `PagedResponse<FlashcardDTO>`.
  - Frontend: budowanie query string tylko z wartościami obecnymi (np. brak `q` gdy puste po trim).
- **POST `/api/v1/flashcards`**
  - Body: `FlashcardCreateCommand` (`front`, `back`).
  - Response: `{ data: FlashcardDTO }`.
  - Po sukcesie: zamknij dialog, reset formularza, refetch listy (opcjonalnie ustaw `page=1`).
- **PATCH `/api/v1/flashcards/{id}`**
  - Body: `FlashcardUpdateCommand` (`front`, `back`).
  - Response: `{ data: FlashcardDTO }`.
  - Po sukcesie: zamknij dialog, refetch listy (bez optymizmu).
- **DELETE `/api/v1/flashcards/{id}`**
  - Response: `{ data: { deleted: true } }` lub `204`.
  - Po sukcesie: zamknij dialog, refetch listy.
- **Autoryzacja:** `getAuthorizationHeader()` z `src/lib/api/client.ts`.
- **Obsługa błędów:** `ApiError` → mapowanie na `ApiErrorVM` (komunikaty PL, 401 → redirect `/login`).

## 8. Interakcje użytkownika
- Wpisywanie w wyszukiwarkę → debounce → aktualizacja URL → odświeżenie listy.
- Zmiana `source`/`limit` → reset `page=1`, refetch.
- Kliknięcie paginacji → zmiana `page` w URL, refetch.
- Kliknięcie „Dodaj fiszkę” → modal z formularzem.
- „Zapisz” w modalu tworzenia → walidacja → POST → refetch.
- Kliknięcie „Edytuj” przy fiszce → modal edycji z wypełnionymi danymi.
- „Zapisz” w modalu edycji → PATCH → refetch.
- Kliknięcie „Usuń” → dialog potwierdzenia → DELETE → refetch.
- Puste wyniki → komunikat + CTA do dodania fiszki.

## 9. Warunki i walidacja
- **Front/Back (create/edit):**
  - `front`: trim, 1–200 znaków.
  - `back`: trim, 1–500 znaków.
  - `isDirty` dla edycji – brak zapisu bez zmian.
- **Filtrowanie:**
  - `q` po trim: 1–200 znaków albo brak parametru.
  - `source` tylko `ai-full | ai-edited | manual`.
  - `limit` 1–100.
  - `page` >= 1.
- **UI:**
  - Blokada przycisków podczas requestów.
  - Reset `page=1` po zmianie `q/source/limit`.

## 10. Obsługa błędów
- `401 Unauthorized`: przekierowanie do `/login`.
- `400 Bad Request`: błędy walidacji w modalu (inline pod polami).
- `404 Not Found`: informacja o braku fiszki (np. po edycji/usunięciu), refetch listy.
- Błędy sieci/500: alert w widoku z przyciskiem „Spróbuj ponownie”.
- Brak wyników: stan empty z CTA.
- Usuwanie: brak optymizmu; dialog blokuje zamknięcie podczas requestu; po sukcesie refetch i opcjonalny komunikat.

## 11. Kroki implementacji
1. Utworzyć stronę `src/pages/flashcards.astro` i osadzić `FlashcardsView` w `AppShellLayout`.
2. Zdefiniować nowe typy ViewModel (`flashcardsViewmodels.ts`) i ewentualnie współdzielone `ApiRequestState`/`ApiErrorVM`.
3. Zaimplementować `useFlashcardsQueryParams` i `useDebouncedValue` (lub prostą logikę debounce w komponencie).
4. Zaimplementować `useFlashcardsList` (GET + mapowanie błędów + AbortController).
5. Zaimplementować `useFlashcardMutations` (POST/PATCH/DELETE + refetch + obsługa 401/400).
6. Zbudować `FlashcardsFiltersBar` i powiązać z URL/stanem.
7. Zbudować `FlashcardsList` + `FlashcardListItem` + `FlashcardsResultsMeta`.
8. Zbudować `PaginationControls` zgodnie z `PageMeta`.
9. Zbudować `FlashcardFormDialog` (create/edit) oraz `DeleteFlashcardDialog`.
10. Zintegrować wszystko w `FlashcardsView` (stany, modale, refetch po mutacjach).
11. Przejść przez scenariusze US-005/US-006/US-007 oraz ręcznie zweryfikować walidacje i obsługę błędów.
