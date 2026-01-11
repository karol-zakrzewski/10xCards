# Test Plan — 10xCards (MVP)

## 0. Założenia (potwierdzone)

- Limit długości tekstu źródłowego to **1000–10000 znaków** (frontend + backend + DB).
- Weryfikacja e‑mail **nie jest** zaimplementowana. Po rejestracji użytkownik **nie** jest auto‑logowany — musi przejść do strony logowania i zalogować się przez formularz.
- Brak gotowej konfiguracji testów w repo (brak `npm run test`). Ten plan zakłada dodanie narzędzi testowych zgodnie z sekcją 8.

## 1. Opis systemu

### 1.1 Krótki opis aplikacji i jej celu

10xCards to webowa aplikacja do szybkiego tworzenia fiszek edukacyjnych. Umożliwia:

- generowanie propozycji fiszek z tekstu (AI),
- ręczne tworzenie fiszek,
- przegląd, edycję, akceptację/odrzucenie i zapis fiszek,
- trwałe usuwanie fiszek,
- logowanie, rejestrację i usuwanie konta.
  Dane przechowywane są w Supabase (PostgreSQL) z włączonym RLS.

### 1.2 Architektura wysokiego poziomu

- **Frontend**: Astro (SSR) + React dla interaktywnych komponentów, Tailwind + shadcn/ui.
- **Backend**: API routes w Astro (`src/pages/api/v1/**`) + warstwa usług (`src/lib/services/**`) + walidacje Zod (`src/lib/validation/**`).
- **Baza danych**: Supabase/PostgreSQL z RLS i tabelami `flashcards`, `generations`, `generation_error_logs`.
- **Auth**: Supabase Auth (sesje po stronie serwera w middleware).
- **AI**: Google GenAI (`@google/genai`), model `gemini-2.5-flash`, odpowiedzi walidowane schemą JSON.

### 1.3 Kluczowe komponenty i odpowiedzialności

- **Middleware**: ochrona tras i API, obsługa sesji (`src/middleware/index.ts`).
- **API**:
  - Auth: `POST /api/v1/auth/sign-up`, `POST /api/v1/auth/sign-in`, `POST /api/v1/auth/sign-out`
  - User: `GET /api/v1/me`, `DELETE /api/v1/me`
  - Generations: `POST /api/v1/generations`, `GET /api/v1/generations`, `GET /api/v1/generations/:id`
  - Flashcards: `GET/POST /api/v1/flashcards`, `GET/PATCH/DELETE /api/v1/flashcards/:id`, `POST /api/v1/flashcards/bulkCreate`
  - Error logs: `GET /api/v1/generation-error-logs`
- **Usługi domenowe**: generowanie AI, CRUD fiszek, metryki generacji, usuwanie konta.
- **Walidacje**: Zod (m.in. długości pól, zakresy stronicowania).
- **Schemat danych**: constraints i RLS w migracji SQL.

## 2. Cele testowania

### 2.1 Ryzyka do zminimalizowania

- Naruszenie izolacji danych (RLS, user_id).
- Błędy walidacji danych wejściowych (tekst źródłowy, długości pól).
- Niepoprawna obsługa błędów z AI lub Supabase.
- Niespójność metryk generacji (liczby wygenerowanych i zaakceptowanych kart).
- Usuwanie konta nie czyści powiązanych danych.
- Niewłaściwe przekierowania/ochrona tras (auth).

### 2.2 „Wystarczająco przetestowany” system

System uznajemy za wystarczająco przetestowany, gdy:

- Wszystkie krytyczne scenariusze biznesowe przechodzą testy E2E.
- Każdy endpoint API ma testy walidacji + testy błędów + testy autoryzacji.
- Walidacje wejścia oraz mapowania DTO mają testy jednostkowe.
- RLS uniemożliwia dostęp do danych innych użytkowników (testy integracyjne).
- Obsługa błędów AI i DB zwraca spójny format odpowiedzi.

## 3. Rodzaje testów i ich rola

### 3.1 Testy jednostkowe

- **Cel**: szybka weryfikacja logiki funkcji, walidacji i mapowań.
- **Zakres**: `src/lib/validation/**`, `src/lib/services/**` (logika bez IO), helpery.
- **Granice**: bez realnego Supabase i bez realnych wywołań AI.

### 3.2 Testy integracyjne

- **Cel**: sprawdzenie współdziałania warstw (API → serwisy → DB).
- **Zakres**: API routes, Supabase local (RLS), migracje, CRUD.
- **Granice**: AI provider mockowany/stubowany.

### 3.3 Testy end‑to‑end (E2E)

- **Cel**: weryfikacja realnych przepływów użytkownika w UI.
- **Zakres**: logowanie, generowanie, akceptacja/odrzucenie, zapis, edycja, usuwanie, wylogowanie, usuwanie konta.
- **Granice**: AI mockowane, aby testy były deterministyczne.

### 3.4 Testy regresji

- **Cel**: ochrona funkcjonalności krytycznych przed regresją.
- **Zakres**: re‑run zestawu E2E + testy integracyjne kluczowych API.

### 3.5 Testy niefunkcjonalne

- **Wydajność**: czas odpowiedzi API, czas generacji AI (na mockach) i UI.
- **Bezpieczeństwo**: poprawne RLS, brak możliwości pobrania/zmiany cudzych danych.
- **Stabilność**: odporność na błędy AI, time‑outy, błędy DB.

## 4. Strategia testowania

### 4.1 Podział odpowiedzialności między poziomy

| Obszar                 | Unit             | Integration | E2E |
| ---------------------- | ---------------- | ----------- | --- |
| Walidacje (Zod)        | ✔︎              | –           | –   |
| Serwisy (logika)       | ✔︎              | ✔︎         | –   |
| API routes             | –                | ✔︎         | –   |
| RLS i DB constraints   | –                | ✔︎         | –   |
| UI (formularze, stany) | ✔︎ (komponenty) | –           | ✔︎ |
| Krytyczne przepływy    | –                | –           | ✔︎ |

### 4.2 Test Pyramid / Test Trophy

- Preferujemy **test trophy**: większość w unit + integration, mniejszy zestaw E2E.
- E2E tylko dla ścieżek krytycznych i regresji.

### 4.3 Kolejność i moment uruchamiania

- **PR/CI**: unit + integration (szybkie testy blokujące merge).
- **Nightly / pre‑release**: pełny zestaw E2E.
- **Przed releasem**: regresja + smoke E2E.

## 5. Zakres testów

### 5.1 In‑scope

- API: auth, me, generations, flashcards, error logs.
- Walidacje danych wejściowych (tekst, długości, UUID, paginacja).
- Integracja z Supabase (RLS + migracje + constraints).
- Generowanie AI (mockowane odpowiedzi + walidacja schematu).
- UI w języku polskim: poprawne komunikaty błędów i stany.

### 5.2 Out‑of‑scope (MVP)

- Algorytmy powtórek (SM‑2), pola `due_at` i `sm2_state`.
- Import plików, współdzielenie zestawów, integracje zewnętrzne, mobile.
- Płatności, SSO, content filtering.

## 6. Dane testowe

- **Podejście**: dane syntetyczne, deterministyczne i resetowalne.
- **Reset stanu**: przed każdym test runem czyścimy dane użytkownika testowego (np. przez `supabase db reset` lub truncate w kontrolowanym schemacie).
- **Dane graniczne**:
  - `sourceText`: 1000, 10000, 999, 10001 znaków.
  - `front`: 1, 200, 0, 201.
  - `back`: 1, 500, 0, 501.
  - `items` w bulkCreate: 1 i 100, oraz 0/101.
- **AI**: używać fixture’ów JSON zgodnych ze schemą `flashcardProposalsSchema`.

## 7. Środowiska testowe

### 7.1 Lokalne

- Astro dev server + Supabase lokalny.
- `.env` z kluczami testowymi.

### 7.2 CI/CD

- Ephemeral Supabase (np. lokalny kontener) z migracjami.
- AI provider mockowany (brak zewnętrznych requestów).

### 7.3 Staging

- Jeśli istnieje, E2E smoke testy + monitoring błędów.

## 8. Narzędzia i frameworki (rekomendowane)

- **Unit/Integration**: Vitest + @testing-library/react (dla komponentów React).
- **Mocking**: MSW (mock API/AI).
- **E2E**: Playwright (zgodnie z README).
- **Coverage/raporty**: c8/istanbul, raport HTML w CI.
- **DB/fixtures**: Supabase local + seed scripts.

## 9. Przypadki testowe (wysoki poziom)

### 9.1 Scenariusze biznesowe

- Rejestracja użytkownika (poprawne dane, błędny email/hasło).
- Logowanie/wylogowanie i przekierowania (autoryzacja tras `/generate`, `/flashcards`, `/account`).
- Generowanie fiszek z AI (sukces, błąd provider, pusty response).
- Akceptacja/odrzucenie propozycji i zapis tylko zaakceptowanych.
- Ręczne tworzenie fiszek.
- Edycja fiszek (manual + AI accepted).
- Usuwanie fiszek z potwierdzeniem.
- Usuwanie konta i kaskadowe usunięcie danych.

### 9.2 Scenariusze negatywne i edge cases

- Nieautoryzowany dostęp do API (401).
- Próba dostępu do cudzych fiszek/generacji (404/401 + RLS).
- Niepoprawne parametry paginacji/UUID/id.
- AI zwraca niezgodny JSON (walidacja schematu).
- BulkCreate z nieprawidłowym `generationId` lub `items`.

## 10. Obsługa błędów i wyjątków

- **Format błędu API**: `{ error: { code, message, details? } }`.
- **Klasy błędów**: `GenerationServiceError`, `FlashcardServiceError`, `MeServiceError`, `GoogleAIServiceError`.
- **Testy** muszą pokrywać:
  - błędy walidacji (400),
  - brak autoryzacji (401),
  - brak zasobu (404),
  - błędy DB (500),
  - błędy providerów AI (5xx + logowanie do `generation_error_logs`).

## 11. Kryteria jakości i akceptacji

- **Coverage**:
  - walidacje i serwisy: min. 80% linii,
  - API routes: min. 1 test na happy path + 1 test błędu + 1 test auth.
- **Stabilność testów**: flake rate < 2% w CI.
- **Kompletność**: wszystkie krytyczne scenariusze biznesowe mają testy E2E.

## 12. Automatyzacja testów

- **Automatyzować**: unit, integration i wszystkie krytyczne flow E2E.
- **Manualne**: eksploracyjne testy UI/UX, ocena jakości treści AI, testy wizualne (dopóki brak narzędzi snapshot).
- **Utrzymywalność**:
  - jeden test = jedna odpowiedzialność,
  - spójne nazewnictwo (np. `flashcards.bulkCreate.success`),
  - brak zależności między testami (pełna izolacja danych).

## 13. Instrukcje dla AI / programisty

- Generując testy, opieraj się wyłącznie na tym planie i istniejącym kodzie (bez domysłów).
- Każdy test powinien jasno wskazywać **wejście, oczekiwane wyjście i warunki wstępne**.
- Unikaj realnych wywołań Google GenAI — używaj mocków i fixture’ów.
- Trzymaj się spójnej struktury testów (np. `tests/unit`, `tests/integration`, `tests/e2e`).
- Nazewnictwo testów: `feature.action.expectation` (np. `generations.create.validInput.returns201`).
- Przy dodawaniu nowych funkcjonalności aktualizuj ten plan (sekcje 5, 9, 11).
