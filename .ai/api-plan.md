# REST API Plan

> Założenia:
>
> - API jest wystawione jako endpointy serwerowe Astro (np. `src/pages/api/v1/**`) i komunikuje się z Supabase (PostgreSQL + Auth + RLS) oraz OpenRouter.
> - Stan “fiszek przed zapisem” (zaakceptowane/odrzucone/edytowane propozycje) jest przechowywany po stronie klienta; API zapisuje do bazy tylko zaakceptowane fiszki.
> - Długość tekstu wejściowego do generacji jest walidowana w zakresie **1000–10000 znaków** (spójnie z ograniczeniami w DB).

## 1. Zasoby

- **Fiszki (`flashcards`)** → tabela `public.flashcards`
- **Generacje AI (`generations`)** → tabela `public.generations`
- **Logi błędów generacji (`generation_error_logs`)** → tabela `public.generation_error_logs`
- **Bieżący użytkownik (`me`)** → Supabase Auth (`auth.users`) + sesja (brak własnej tabeli `users`)

## 2. Punkty końcowe

### Konwencje wspólne

- Bazowa ścieżka: `/api/v1`
- Nagłówki:
  - `Content-Type: application/json`
  - `Authorization: Bearer <supabase_access_token>` (zalecane)
  - Opcjonalnie: `Idempotency-Key: <uuid>` dla operacji POST, które mogą być retried (szczególnie generacja).
- Paginacja list (klasyczna):
  - Parametry zapytania: `page` (>= 1) oraz `limit` (1–100)
  - Odpowiedź zawsze zawiera metadane: `{ page, limit, total }` (gdzie `total` to liczba wszystkich rekordów dla danego filtra)
- Format błędu (wspólny):
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Opis błędu dla użytkownika",
      "details": { "field": "front", "reason": "TOO_LONG" }
    }
  }
  ```

### 2.1. Generacje AI (`generations`)

#### POST `/generations`

- Opis: Uruchamia generację fiszek przez AI, i zwraca propozycje do akceptacji (bez zapisu fiszek).
- Parametry zapytania: brak
- Request JSON:
  ```json
  {
    "sourceText": "string"
  }
  ```
- Response JSON:
  ```json
  {
    "generation": {
      "id": 123,
      "generatedCount": 12,
      "generationDurationMs": 1840,
      "createdAt": "2025-12-18T12:34:56.000Z"
    },
    "proposals": [{ "id": "uuid", "front": "string", "back": "string", "source": "ai-full" }]
  }
  ```
- Kody sukcesu:
  - `201 Created` – generacja utworzona i zwrócono propozycje
- Kody błędów:
  - `400 Bad Request` – błędny payload/`sourceText` poza zakresem
  - `401 Unauthorized` – brak/niepoprawny token
  - `429 Too Many Requests` – limit generacji (rate limit)
  - `502 Bad Gateway` – błąd dostawcy AI (OpenRouter); dodatkowo zapis do `public.generation_error_logs`

#### GET `/generations`

- Opis: Lista generacji użytkownika (metryki + audyt).
- Parametry zapytania:
  - `page` (>= 1, domyślnie 1)
  - `limit` (1–100, domyślnie 20)
  - `sort` = `created_at` (domyślnie)
  - `order` = `desc|asc` (domyślnie `desc`)
- Response JSON:
  ```json
  {
    "data": [
      {
        "id": 123,
        "model": "openrouter/model-id",
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
- Kody sukcesu: `200 OK`
- Kody błędów: `401 Unauthorized`

#### GET `/generations/{id}`

- Opis: Pobiera szczegóły jednej generacji (bez propozycji – te są tylko po stronie klienta).
- Parametry zapytania: brak
- Response JSON:
  ```json
  {
    "data": {
      "id": 123,
      "generatedCount": 12,
      "acceptedUneditedCount": 7,
      "acceptedEditedCount": 2,
      "sourceTextLength": 2500,
      "generationDurationMs": 1840,
      "createdAt": "2025-12-18T12:34:56.000Z",
      "updatedAt": "2025-12-18T12:40:01.000Z"
    }
  }
  ```
- Kody sukcesu: `200 OK`
- Kody błędów:
  - `401 Unauthorized`
  - `404 Not Found` – brak zasobu lub nie należy do użytkownika (RLS)

### 2.2. Fiszki (`flashcards`)

#### GET `/flashcards`

- Opis: Lista zapisanych fiszek użytkownika (widok “Moje fiszki”).
- Parametry zapytania:
  - `page` (>= 1, domyślnie 1)
  - `limit` (1–100, domyślnie 20)
  - `q` (opcjonalnie; wyszukiwanie po `front/back`, np. ILIKE)
  - `source` (opcjonalnie) = `ai-full|ai-edited|manual`
  - `generationId` (opcjonalnie; filtr po `generation_id`)
  - `sort` = `created_at|updated_at` (domyślnie `created_at`)
  - `order` = `desc|asc` (domyślnie `desc`)
- Response JSON:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "front": "string",
        "back": "string",
        "source": "manual",
        "generationId": 123,
        "createdAt": "2025-12-18T12:34:56.000Z",
        "updatedAt": "2025-12-18T12:34:56.000Z"
      }
    ],
    "page": { "page": 1, "limit": 20, "total": 120 }
  }
  ```
- Kody sukcesu: `200 OK`
- Kody błędów: `401 Unauthorized`

#### POST `/flashcards`

- Opis: Tworzy pojedynczą fiszkę (manualną).
- Request JSON:
  ```json
  {
    "front": "string",
    "back": "string"
  }
  ```
- Response JSON:
  ```json
  {
    "data": {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "source": "manual",
      "generationId": null,
      "createdAt": "2025-12-18T12:34:56.000Z",
      "updatedAt": "2025-12-18T12:34:56.000Z"
    }
  }
  ```
- Kody sukcesu: `201 Created`
- Kody błędów:
  - `400 Bad Request` – walidacja `front/back`
  - `401 Unauthorized`

#### POST `/flashcards:bulkCreate`

- Opis: Zapisuje **zaakceptowane** fiszki po generacji AI; tworzy rekordy w `public.flashcards` i aktualizuje metryki w `public.generations`.
- Request JSON:
  ```json
  {
    "generationId": 123,
    "items": [
      { "front": "string", "back": "string", "source": "ai-edited" },
      { "front": "string", "back": "string", "source": "ai-full" }
    ]
  }
  ```
- Response JSON:
  ```json
  {
    "data": {
      "created": [
        {
          "id": "uuid",
          "front": "string",
          "back": "string",
          "source": "ai-full",
          "generationId": 123,
          "createdAt": "2025-12-18T12:34:56.000Z",
          "updatedAt": "2025-12-18T12:34:56.000Z"
        }
      ],
      "generation": {
        "id": 123,
        "acceptedUneditedCount": 7,
        "acceptedEditedCount": 2,
        "updatedAt": "2025-12-18T12:40:01.000Z"
      }
    }
  }
  ```
- Kody sukcesu: `201 Created`
- Kody błędów:
  - `400 Bad Request` – walidacja/`items` puste/duplikaty/`generationId` brak
  - `401 Unauthorized`
  - `404 Not Found` – `generationId` nie istnieje lub nie należy do użytkownika (RLS)
  - `409 Conflict` – opcjonalnie: konflikt idempotencji (gdy użyto `Idempotency-Key`)

#### GET `/flashcards/{id}`

- Opis: Pobiera pojedynczą fiszkę.
- Response JSON:
  ```json
  {
    "data": {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "source": "ai-edited",
      "generationId": 123,
      "createdAt": "2025-12-18T12:34:56.000Z",
      "updatedAt": "2025-12-18T12:34:56.000Z"
    }
  }
  ```
- Kody sukcesu: `200 OK`
- Kody błędów:
  - `401 Unauthorized`
  - `404 Not Found`

#### PATCH `/flashcards/{id}`

- Opis: Edytuje fiszkę (manualną lub AI).
- Request JSON:
  ```json
  {
    "front": "string",
    "back": "string"
  }
  ```
- Response JSON: jak w `GET /flashcards/{id}`
- Kody sukcesu: `200 OK`
- Kody błędów:
  - `400 Bad Request` – walidacja `front/back`
  - `401 Unauthorized`
  - `404 Not Found`

#### DELETE `/flashcards/{id}`

- Opis: Trwale usuwa fiszkę (hard delete).
- Parametry zapytania: brak
- Response JSON:
  ```json
  { "data": { "deleted": true } }
  ```
- Kody sukcesu: `200 OK` (lub `204 No Content`)
- Kody błędów:
  - `401 Unauthorized`
  - `404 Not Found`

### 2.3. Logi błędów generacji (`generation_error_logs`)

> Uwaga: w MVP można ograniczyć dostęp do tej funkcji tylko do ekranu “historia generowania” lub ukryć w UI; endpointy są przydatne diagnostycznie i do analizy jakości.

#### GET `/generation-error-logs`

- Opis: Lista błędów generacji dla użytkownika.
- Parametry zapytania:
  - `page` (>= 1, domyślnie 1)
  - `limit` (1–100, domyślnie 20)
  - `sort` = `created_at` (domyślnie)
  - `order` = `desc|asc` (domyślnie `desc`)
- Response JSON:
  ```json
  {
    "data": [
      {
        "id": 456,
        "model": "openrouter/model-id",
        "sourceTextHash": "hex-or-base64",
        "sourceTextLength": 2500,
        "errorCode": "OPENROUTER_TIMEOUT",
        "errorMessage": "string",
        "createdAt": "2025-12-18T12:34:56.000Z"
      }
    ],
    "page": { "page": 1, "limit": 20, "total": 3 }
  }
  ```
- Kody sukcesu: `200 OK`
- Kody błędów: `401 Unauthorized`

### 2.4. Bieżący użytkownik (`me`) i konto

#### GET `/me`

- Opis: Zwraca informacje o zalogowanym użytkowniku (np. email) oraz podstawowe wskaźniki.
- Response JSON:
  ```json
  {
    "data": {
      "user": { "id": "uuid", "email": "user@example.com" },
      "stats": {
        "flashcardsCount": 120,
        "generationsCount": 15
      }
    }
  }
  ```
- Kody sukcesu: `200 OK`
- Kody błędów: `401 Unauthorized`

#### DELETE `/me`

- Opis: Usuwa konto użytkownika wraz z danymi (przez Supabase Auth; kaskadowo usuwa rekordy przez FK `ON DELETE CASCADE`).
- Parametry zapytania: brak
- Request JSON (opcjonalnie, do potwierdzenia):
  ```json
  { "confirm": true }
  ```
- Response JSON:
  ```json
  { "data": { "deleted": true } }
  ```
- Kody sukcesu: `200 OK`
- Kody błędów:
  - `400 Bad Request` – brak potwierdzenia
  - `401 Unauthorized`
  - `403 Forbidden` – jeśli brak uprawnień do self-delete (wymaga implementacji po stronie backendu z service role / admin API)

## 3. Uwierzytelnianie i autoryzacja

- **Mechanizm**: Supabase Auth (JWT). API wymaga `Authorization: Bearer <token>` dla wszystkich endpointów poza ewentualnymi publicznymi (w MVP brak publicznych).
- **Autoryzacja danych**:
  - Podstawowy enforcement na poziomie DB: **RLS** na tabelach `public.flashcards`, `public.generations`, `public.generation_error_logs` (tylko `user_id = auth.uid()`).
  - Warstwa API nie przyjmuje `user_id` w payloadach; `user_id` jest ustalany wyłącznie na podstawie sesji użytkownika.
- **Zasady dostępu (MVP)**:
  - Użytkownik ma dostęp tylko do własnych fiszek, generacji i logów błędów.
  - Brak współdzielenia fiszek, brak widoków admin.

## 4. Walidacja i logika biznesowa

### 4.1. Walidacja (spójna z DB)

#### `flashcards`

- `front`: wymagane, `trim(front).length > 0`, maks. 200 znaków
- `back`: wymagane, `trim(back).length > 0`, maks. 500 znaków
- `source`: zawsze jedno z `ai-full|ai-edited|manual` (dla `POST /flashcards` ustawiane jako `manual`; dla bulk ustawiane na podstawie flagi `edited`)
- `generationId`: opcjonalne; jeśli podane, musi wskazywać generację użytkownika

#### `generations`

- `model`: wymagane (identyfikator modelu OpenRouter)
- `sourceTextLength`: wymagane, **1000–10000** (API nie przycina automatycznie tekstu; odrzuca spoza zakresu)
- `generatedCount`: wymagane, liczba > 0
- `generationDurationMs`: wymagane, liczba całkowita >= 0
- `acceptedUneditedCount` / `acceptedEditedCount`: aktualizowane tylko po zapisie zaakceptowanych fiszek

#### `generation_error_logs`

- Tworzone tylko po stronie backendu przy błędzie integracji z AI; `sourceTextLength` również **1000–10000**

### 4.2. Logika biznesowa (mapowanie na API)

1. **Generowanie AI**:
   - `POST /generations`:
     - waliduje `sourceText` (długość),
     - wywołuje OpenRouter,
     - mapuje odpowiedź na listę `{front, back}`,
     - zapisuje metryki do `public.generations`,
     - w razie błędu zapisuje do `public.generation_error_logs` i zwraca komunikat.

2. **Przegląd / akceptacja / odrzucenie propozycji**:
   - realizowane po stronie klienta (API nie przechowuje propozycji przed zapisem),
   - zapis odbywa się dopiero przez `POST /flashcards:bulkCreate` z listą zaakceptowanych pozycji.

3. **Zapis fiszek po generacji + statystyki akceptacji**:
   - `POST /flashcards:bulkCreate`:
     - tworzy fiszki z `generationId`,
     - ustawia `source` na `ai-full` lub `ai-edited`,
     - aktualizuje `generations.accepted_unedited_count` i `generations.accepted_edited_count`.

4. **CRUD fiszek (Moje fiszki)**:
   - `GET /flashcards` – lista + paginacja/filtry
   - `POST /flashcards` – tworzenie manualne
   - `PATCH /flashcards/{id}` – edycja
   - `DELETE /flashcards/{id}` – trwałe usunięcie (potwierdzenie w UI)

### 4.3. Bezpieczeństwo i wydajność (zalecenia implementacyjne)

- **Rate limiting**:
  - `POST /generations`: limit per użytkownik (np. 10/min) + per IP (np. 30/min) dla ochrony kosztów.
  - `POST /flashcards:bulkCreate`: limit wielkości `items` (np. max 50) i rozmiaru payloadu.
- **Ochrona przed nadużyciami**:
  - walidacja rozmiaru `sourceText`, `front`, `back` na wejściu,
  - limit czasu dla requestów do OpenRouter (timeout) + bezpieczne komunikaty błędów.
- **Paginacja `page/limit`**:
  - implementowana jako `LIMIT/OFFSET` + query zliczające (`total`) dla tych samych filtrów.
- **Spójność danych**:
  - `POST /flashcards:bulkCreate` wykonuje zapis fiszek + update metryk generacji w jednej transakcji (jeśli warstwa używa SQL RPC) lub z kontrolą błędów i retry (jeśli używa SDK).
- **Zasady prywatności**:
  - API nigdy nie zwraca `user_id` dla rekordów domenowych, o ile nie jest to potrzebne w UI (w MVP nie jest).
