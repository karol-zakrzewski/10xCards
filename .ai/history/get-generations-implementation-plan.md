# API Endpoint Implementation Plan: GET /generations

## 1. Przegląd punktu końcowego

- Lista metryk generacji użytkownika (agregaty + audyt) z paginacją i sortowaniem po `created_at`.
- Ścieżka Astro: `src/pages/api/v1/generations.ts` (ten sam plik, nowy handler `GET`).
- Dane źródłowe: tabela `public.generations` z bez RLS (patrz `.ai/db-plan.md`).
- Typy po stronie aplikacji: `GenerationListItemDTO`, `PagedResponse<T>`, `PageMeta`, `ErrorResponse` (patrz `src/types.ts`).

## 2. Szczegóły żądania

- Metoda HTTP: `GET`
- URL: `/api/v1/generations` (mapuje na spec `/generations`).
- Parametry zapytania (wszystkie opcjonalne, z domyślnymi wartościami i walidacją):
  - `page`: liczba całkowita ≥ 1, domyślnie 1.
  - `limit`: liczba całkowita 1–100, domyślnie 20.
  - `sort`: dozwolone tylko `created_at` (domyślnie); inne wartości odrzucane walidacją.
  - `order`: `asc | desc`, domyślnie `desc`.
- Body: brak.
- Nagłówki: `Authorization` (sesja Supabase / Bearer JWT) przekazywana przez `locals.supabase` (bez RLS).

## 3. Wykorzystywane typy

- DTO: `GenerationListItemDTO`, `PagedResponse<GenerationListItemDTO>`, `PageMeta`, `ErrorResponse` (`src/types.ts`).
- Modele bazodanowe: `Tables<"generations">` z `src/db/database.types` (kolumny: id, user_id , model, generated_count, accepted_unedited_count, accepted_edited_count, source_text_length, generation_duration, created_at).
- Schemat walidacji: nowy `generationListQuerySchema` w `src/lib/validation/generations.ts` (Zod) dla query params.

## 4. Szczegóły odpowiedzi

- Sukces `200 OK`:
  ```json
  {
    "data": [
      {
        "id": 123,
        "model": "gemini-2.5-flash",
        "generatedCount": 12,
        "acceptedUneditedCount": 7,
        "acceptedEditedCount": 2,
        "sourceTextLength": 2500,
        "generationDurationMs": 1840,
        "createdAt": "2025-12-18T12:34:56.000Z"
      }
    ],
    "page": { "page": 1, "limit": 20, "total": 57 }
  }
  ```
- Błędy:
  - `400 Bad Request` przy błędnych parametrach (payload `ErrorResponse`).
  - `401 Unauthorized` gdy brak/nieprawidłowa sesja Supabase.
  - `500 Internal Server Error` dla nieoczekiwanych błędów.

## 5. Przepływ danych

1. Odczytaj `page`, `limit`, `sort`, `order` z `URLSearchParams` i zwaliduj przez `generationListQuerySchema` (ustawia domyślne).
2. Oblicz `offset = (page-1) * limit`.
3. Użyj `locals.supabase` (uwierzytelniona instancja) i bez RLS, aby pobrać rekordy użytkownika:
   ```ts
   const query = supabase
     .from("generations")
     .select(
       "id, model, generated_count, accepted_unedited_count, accepted_edited_count, source_text_length, generation_duration, created_at",
       { count: "exact" }
     )
     .eq("user_id", userId)
     .order("created_at", { ascending: order === "asc" })
     .range(offset, offset + limit - 1);
   ```
4. Zmapuj wiersze na `GenerationListItemDTO` (snake_case → camelCase).
5. Zbuduj `PagedResponse` z `count` → `total`, `page`, `limit`.
6. Zwróć `200` z JSON.
7. Błędy Supabase → `500` z kodem `DB_ERROR` + `details` (message). Brak logowania do `generation_error_logs` (dotyczy tylko generacji, nie listy).

## 6. Względy bezpieczeństwa

- Autentykacja: korzystaj z `locals.supabase` (sesja użytkownika), nie używaj `DEFAULT_USER_ID` w GET.
- Walidacja wejścia: Zod odrzuca wartości spoza zakresów (page<1, limit>100, nieobsługiwany `sort`).
- Brak możliwości sortowania po innych kolumnach → minimalizacja SQL injection / skanowania.
- Dane w odpowiedzi nie zawierają PII (tylko metryki).
- Obsługa CORS zgodnie z konfiguracją Astro (bez zmian).

## 7. Obsługa błędów

- `400 VALIDATION_ERROR`: zwracaj przy Zod parse fail (z komunikatem).
- `401 UNAUTHORIZED`: jeśli `locals.supabase` nie ma sesji lub Supabase zwróci `auth error`.
- `500 DB_ERROR`: błąd zapytania Supabase (z `details: { hint: error.message }`).
- `500 INTERNAL_ERROR`: inne wyjątki.
- Format błędu: `ErrorResponse` (code, message, opcjonalnie details).
- Logowanie: serwerowe logi (console.warn/error) dla 5xx; brak wpisu do `generation_error_logs` (nie dotyczy listowania).

## 8. Rozważania dotyczące wydajności

- Limit 100 na stronę, domyślnie 20.
- Indeks `(user_id, created_at desc)` już zdefiniowany w `.ai/db-plan.md` — wykorzystywany przez zapytanie.
- Wybór tylko potrzebnych kolumn, bez `count(*)` w payload (Supabase `count: "exact"` zwraca liczbę osobno).
- Brak joinów → szybkie zapytanie.

## 9. Etapy wdrożenia

1. **Walidacja**: dodaj `generationListQuerySchema` w `src/lib/validation/generations.ts` (Zod) z domyślnymi wartościami i zakresami; eksportuj typ `GenerationListQuery`.
2. **Serwis**: dodaj funkcję `listGenerations({ supabase, userId, page, limit, order }): Promise<PagedResponse<GenerationListItemDTO>>` w `src/lib/services/generations.service.ts`; użyj wyżej opisanego zapytania i mapowania.
3. **Endpoint**: w `src/pages/api/v1/generations.ts` dodaj handler `GET`:
   - sparsuj query → schema → `params`.
   - pobierz `userId` z `locals.supabase.auth.getUser()` (fallback na błąd 401).
   - wywołaj `listGenerations`; obsłuż błędy (`GenerationServiceError` lub db error).
   - zwróć `200` z JSON `PagedResponse`.
4. **Błędy**: ujednolić `jsonError` helper (reuse z POST) i stosować kody: 400/401/500.
5. **Typy**: jeśli potrzeba, dopisz eksport `GenerationListItemDTO` reuse (już jest).
6. **Test ręczny**: `npm run dev`, żądanie `GET /api/v1/generations?page=1&limit=10&order=desc`;
7. **Dokumentacja**: uzupełnij README (jeśli wymagane) o nowy endpoint.
