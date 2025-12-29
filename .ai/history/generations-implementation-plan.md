# API Endpoint Implementation Plan: POST /api/v1/generations

## 1. Przegląd punktu końcowego

Uruchamia generację propozycji fiszek z dostarczonego tekstu, zapisuje metryki w `public.generations`, zwraca obiekt generacji i propozycje do akceptacji, bez tworzenia fiszek w `flashcards`.

## 2. Szczegóły żądania

- Metoda HTTP: `POST`
- Struktura URL: `/api/v1/generations`
- Nagłówki:
  - Wymagane: `Content-Type: application/json`
  - Wymagane (dla autoryzacji): `Authorization: Bearer <supabase_access_token>`
- Parametry zapytania: brak
- Request Body (JSON):
  - `sourceText: string` – wymagane; długość 1000–10000 znaków po `trim`

## 3. Wykorzystywane typy

- Wejście: `GenerationCreateCommand` (z `src/types.ts`)
- Wyjście: `GenerationSummaryDTO` + `FlashcardProposalDTO[]` (wykorzystać istniejące typy w `src/types.ts`)
- Błąd: `ErrorResponse` (wspólny format)
- Dane wewnętrzne:
  - Rekord `generations` (Insert)
  - Rekord `generation_error_logs` (Insert) przy błędach AI
  - Pomocniczy obiekt serwisowy: `{ userId, model, generatedCount, generationDurationMs, sourceTextHash, sourceTextLength }`

## 4. Szczegóły odpowiedzi

- Sukces `201 Created`:
  ```json
  {
    "generation": {
      "id": number,
      "generatedCount": number,
      "generationDurationMs": number,
      "createdAt": "ISO timestamp"
    },
    "proposals": [
      { "id": "uuid", "front": "string", "back": "string", "source": "ai-full" }
    ]
  }
  ```
- Błędy:
  - `400 Bad Request` – walidacja (schema, zakres długości)
  - `401 Unauthorized` – brak/niepoprawny token
  - `429 Too Many Requests` – limit generacji
  - `502 Bad Gateway` – błąd dostawcy AI (z logiem w `generation_error_logs`)
  - `500 Internal Server Error` – inne nieoczekiwane błędy

## 5. Przepływ danych

1. API route (Astro server endpoint) pobiera `locals.supabase` i `Authorization` header → walidacja usera via `supabase.auth.getUser()`.
2. Parsowanie i walidacja body Zod → `GenerationCreateCommand`.
3. Service `generations.service.ts`:
   - Oblicz `source_text_length` i `source_text_hash` (np. SHA256).
   - Wywołaj zmockowany provider AI (OpenRouter) z `sourceText`, zmierz czas (`generation_duration`).
   - Zmapuj wynik na `proposals` (`front`, `back`, `source: "ai-full"`), policz `generated_count`.
   - Zapisz metrykę w `public.generations` (fields: `user_id`, `model`, `generated_count`, `generation_duration`, `source_text_hash`, `source_text_length`).
4. Zwrot DTO z nowego `generation` rekordu + `proposals` (propozycje nie zapisane w DB).
5. W przypadku błędu AI: zapis do `generation_error_logs`, zwrot `502`.

## 6. Względy bezpieczeństwa

- Autoryzacja: wymagany Bearer Supabase access token; RLS wymusza `user_id` zgodny z `auth.uid()`.
- Dane wejściowe: Zod + długość + trim; odrzucić nie-JSON / duże payloady.

## 7. Obsługa błędów

- Mapowanie wyjątków:
  - Walidacja Zod → `400` z `VALIDATION_ERROR`.
  - Brak usera → `401`.
  - Rate-limit (zewn./wewn.) → `429`.
  - Błąd AI (timeout, 5xx) → log do `generation_error_logs`, `502` z `PROVIDER_ERROR`.
  - Inne błędy DB/parse → `500` z `INTERNAL_ERROR`.
- Format błędu: `{ error: { code, message, details? } }` zgodnie ze specyfikacją.
- Logowanie serwerowe (console.warn/error) bez danych wrażliwych.

## 8. Rozważania dotyczące wydajności

- Ograniczenie długości inputu (10000) ogranicza koszt zapytań do AI.
- Pomiar czasu generacji po stronie aplikacji, zapis do DB.
- Minimalizacja round-tripów do DB: pojedynczy insert do `generations`; brak zapisu propozycji.

## 9. Etapy wdrożenia

1. Dodaj `src/lib/services/generations.service.ts` z funkcją `generateFromText` (przyjmuje command, context z supabase, userId, idempotencyKey). Wewnątrz: walidacja biznesowa, hash, wywołanie AI, insert generation, map DTO.
2. Dodaj walidację (Zod) dla body w `src/lib/validation/generations.ts` lub w route.
3. Utwórz endpoint `src/pages/api/v1/generations.ts`:
   - Pobierz `locals.supabase`, nagłówki, body.
   - Walidacja Zod → command.
   - Autoryzacja użytkownika z Supabase; 401 jeśli brak.
   - Wywołaj service; mapuj błędy na HTTP status.
4. Dodaj helper `logGenerationError` w service zapisujący do `generation_error_logs` przy błędach AI.
5. Upewnij się, że typy w `src/types.ts` pokrywają payload odpowiedzi (re-use istniejących DTO).
6. Dodaj util do hash/time w `src/lib/utils.ts` lub `src/lib/crypto.ts` (SHA256, timer).
7. Zapewnij zgodny format odpowiedzi i błędów (201/400/401/429/502/500).
8. Na Etapie developmentu odpowiedzi z modelu powinny być zmockowane.
