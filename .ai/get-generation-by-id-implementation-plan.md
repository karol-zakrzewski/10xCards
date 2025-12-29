# API Endpoint Implementation Plan: GET /generations/{id}

## 1. Przegląd punktu końcowego

Udostępnia szczegóły jednej generacji AI użytkownika na podstawie `id`, bez propozycji fiszek; służy do widoku detalu/metryk generacji.

## 2. Szczegóły żądania

- Metoda HTTP: GET
- URL: `/api/v1/generations/{id}`
- Parametry:
  - Wymagane path: `id` (bigint > 0)
  - Opcjonalne: brak
- Body: brak
- Nagłówki: `Authorization: Bearer <access_token>` (Supabase); `Content-Type` nieistotny (brak body)

## 3. Wykorzystywane typy

- DTO: `GenerationDetailDTO` (src/types.ts)
- Error payload: `ErrorResponse` + helper `jsonError` (src/lib/api/responses.ts)
- Supabase typy: `Tables<"generations">` z `db/database.types`
- Nowa funkcja serwisowa: `getGenerationById` (nazwa robocza) zwracająca `GenerationDetailDTO`

## 3. Szczegóły odpowiedzi

- 200 OK
  ```json
  { "data": GenerationDetailDTO }
  ```
- 400 Bad Request – invalid id (nieint, <=0)
- 401 Unauthorized – brak/nieprawidłowy token
- 404 Not Found – brak rekordu lub nie należy do użytkownika
- 500 Internal Server Error – błąd DB/nieoczekiwany

## 4. Przepływ danych

1. API route parsuje path `id` → walidacja → błąd 400 jeśli niepoprawne.
2. Pobiera `supabase` z `locals` i `userId` z sesji auth (docelowo) / fallback `DEFAULT_USER_ID`.
3. Wywołuje `getGenerationById({ supabase, userId, id })`.
4. Service wykonuje `select ... single()` z filtrem `eq("user_id", userId)` i `eq("id", id)`; mapuje wiersz do `GenerationDetailDTO`.
5. Brak rekordu → rzuca `GenerationServiceError` (404, `NOT_FOUND`).
6. Sukces → API zwraca `{ data: dto }` 200.
7. Błąd DB → `GenerationServiceError` 500 lub 500 generic; API opakowuje `jsonError`.

## 5. Względy bezpieczeństwa

- Autentykacja: nie wymagany bearer token; Ze względu na brak zaimplementowanej autentykacji skorzystaj z DEFAULT_USER_ID jeśli jest potrzebny id usera
- Autoryzacja: filtr `user_id` w zapytaniu; RLS off → to jedyna ochrona przed wyciekiem danych.
- Walidacja path: tylko dodatnie liczby całkowite; odrzuć wartości spoza zakresu JS safe int.
- Dane w odpowiedzi: brak pól wrażliwych, nie logować pełnych rekordów przy błędach.

## 6. Obsługa błędów

- 400: parse/validation error path `id` (zod/schema) → `jsonError(400,"VALIDATION_ERROR", ...)`.
- 404: zapytanie `single()` zwraca null → `GenerationServiceError(404,"NOT_FOUND",...)`.
- 500: supabase error (status >=500) → `GenerationServiceError(500,"DB_ERROR",...)`; fallback `INTERNAL_ERROR`.
- Brak logowania do `generation_error_logs` (tylko provider errors tam trafiają).

## 7. Rozważania dotyczące wydajności

- Minimalny payload; brak N+1.

## 8. Etapy wdrożenia

1. Walidacja path: dodać schema `generationIdParamSchema = z.object({ id: z.coerce.number().int().positive() })` w `src/lib/validation/generations.ts` lub lokalnie w route.
2. Service: w `generations.service.ts` utworzyć `getGenerationById({ supabase, userId, id })`:
   - `select` wymaganych kolumn (`id, generated_count,..., updated_at`)
   - `.eq("id", id).eq("user_id", userId).single()`
   - mapowanie do `GenerationDetailDTO`
   - błędy → `GenerationServiceError` (404, 500)
3. API route: w `src/pages/api/v1/generations.ts` dodać handler `export const GET_BY_ID` lub rozdzielić plik (np. `generations/[id].ts`) zgodnie z Astro routing:
   - pobrać `id` z `params`, zwalidować
   - wyciągnąć `userId` (docelowo z auth; tymczasowo `DEFAULT_USER_ID`)
   - wywołać service, zwrócić `{ data }`, status 200
   - obsłużyć `GenerationServiceError` / fallback 500 `jsonError`
4. Typy/DTO: upewnić się, że `GenerationDetailDTO` użyte w response; brak nowych typów.
5. Test manualny: curl GET `/api/v1/generations/1` z ważnym tokenem; scenariusze 200, 404, 400, 401.
6. Dokumentacja: dodać opis do `.ai/api-plan.md` (sekcja istnieje) i ewentualnie README routes.
7. (Opcjonalnie) Indeks: zaplanować migrację na `(user_id, id)` jeśli potrzebne po profilowaniu.
