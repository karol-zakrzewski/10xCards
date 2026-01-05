# API Endpoint Implementation Plan: POST /flashcards

## 1. Przegląd punktu końcowego

- Tworzy pojedynczą manualną fiszkę zapisaną w tabeli `public.flashcards` dla zalogowanego użytkownika.
- Domena biznesowa: szybkie dodawanie własnych kart niezależnie od procesów generacji AI; `generation_id` pozostaje `NULL`, `source="manual"`.

## 2. Szczegóły żądania

- Metoda HTTP: `POST`
- URL: `/api/v1/flashcards`
- Nagłówki: `Content-Type: application/json`; `Authorization` (na czas developmentu brak Bearer) – zwrócić `401`, jeśli brak/nieprawidłowy.
- Parametry: brak query/path.
- Request body (JSON): `{ front: string, back: string }`
- Walidacja (Zod, zgodnie z DB):
  - `front`: string, `.trim()`, długość 1–200 znaków.
  - `back`: string, `.trim()`, długość 1–500 znaków.
  - Odrzucenie pustych po trimie -> `400 VALIDATION_ERROR`.
- Typy wykorzystywane:
  - `FlashcardCreateCommand` (z `src/types.ts`, uzupełniany o `source: "manual"`).
  - `FlashcardDTO` dla odpowiedzi.
  - Nowy `FlashcardCreateInput` (wynik walidacji Zod) w module walidacji.

## 3. Szczegóły odpowiedzi

- Sukces: `201 Created`, body `{ data: FlashcardDTO }`, pola: `id`, `front`, `back`, `source: "manual"`, `generationId: null`, `createdAt`, `updatedAt`.
- Błędy:
  - `400 VALIDATION_ERROR` – niepoprawne `front/back`.
  - `401 UNAUTHORIZED` – brak użytkownika w kontekście.
  - `500 DB_ERROR` / `INTERNAL_ERROR` – problemy serwera/bazy.

## 4. Przepływ danych

1. Handler API (`src/pages/api/v1/flashcards.ts`) odczytuje body, parsuje Zodem.
2. Buduje `FlashcardCreateCommand` z `source: "manual"` i `generation_id = null`.
3. Pobiera `userId` z kontekstu (tymczasowo `DEFAULT_USER_ID`, docelowo z Auth) i przekazuje do serwisu.
4. Serwis `FlashcardService.create` (nowy plik `src/lib/services/flashcards.service.ts`) wykonuje insert do Supabase z `user_id`, `front`, `back`, `source`, `generation_id`.
5. Serwis mapuje wiersz na `FlashcardDTO` (aliasy z `src/types.ts`).
6. Handler zwraca `201` z `{ data }`; w razie błędu mapuje `FlashcardServiceError` na `jsonError`.

## 5. Względy bezpieczeństwa

- Walidacja wejścia ogranicza długość pól do limitów DB, zapobiega pustym i whitespace-only wartościom.
- Brak RLS -> endpoint musi używać klucza serwerowego; nie logować sekretów w odpowiedziach.

## 6. Obsługa błędów

- Walidacja Zod → `jsonError(400, "VALIDATION_ERROR", message)`.
- Błędy Supabase insert → złapanie `error` i zwrócenie `FlashcardServiceError(500, "DB_ERROR", ...)`.
- Niespodziewane wyjątki → `500 INTERNAL_ERROR` z bezpiecznym komunikatem.
- Brak potrzeby logowania do `generation_error_logs` (dotyczy tylko generacji AI); standardowe logowanie serwera/lambda.

## 7. Wydajność

- Pojedynczy insert bez pętli; koszt O(1).
- Indeksy (`flashcards_user_created_idx`) już opisane w DB planie – brak dodatkowych wymagań.
- Brak potrzeby transakcji ani blokad.

## 8. Kroki implementacji

1. Utwórz `src/lib/validation/flashcards.ts` z `flashcardCreateSchema` (Zod) + typ `FlashcardCreateInput`.
2. Dodaj serwis `src/lib/services/flashcards.service.ts`:
   - `FlashcardServiceError` analogiczny do `GenerationServiceError`.
   - Funkcja `createFlashcard({ supabase, userId }, command: FlashcardCreateCommand)` zwracająca `FlashcardDTO`.
   - Helper `mapFlashcardRowToDTO` używający aliasów z `Tables` i `FlashcardDTO`.
3. Utwórz route `src/pages/api/v1/flashcards.ts`:
   - `prerender = false`.
   - Walidacja body schema; budowa command z `source: "manual"`.
   - Pobierz `userId` (teraz `DEFAULT_USER_ID`, TODO: auth) i wywołaj serwis.
   - Zwróć `201` z `{ data }`, błędy mapuj na `jsonError`.
4. Dostosuj eksporty/aliasy w razie potrzeby (np. barrel dla validation/services, jeśli istnieje konwencja).
5. Lokalnie: `npm run lint` + `npx tsc`.
6. Uzupełnij dokumentację, jeśli wymagane (np. `.ai/api-plan.md` lub README) – opcjonalne.
