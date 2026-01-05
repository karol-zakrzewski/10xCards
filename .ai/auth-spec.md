# Specyfikacja architektury auth (US-001, US-002, US-010)

## 0. Kontekst i założenia

- Zakres: rejestracja, logowanie, wylogowanie i usuwanie konta użytkownika zgodnie z PRD (US-001, US-002, US-010) i stackiem z `.ai/tech-stack.md`.
- Brak własnej tabeli `users`; źródłem prawdy jest Supabase Auth.
- Aplikacja działa w trybie SSR (`output: "server"`, adapter Node), więc autoryzacja i przekierowania muszą działać po stronie serwera.
- Nie naruszamy istniejących przepływów (generowanie fiszek, lista fiszek, panel konta) – jedynie je zabezpieczamy i podpinamy pod sesję użytkownika.

---

## 1. Architektura interfejsu użytkownika

### 1.1 Podział na strefy

**Strefa publiczna (non-auth)**

- `/` – landing z CTA do logowania/rejestracji.
- `/login` – logowanie.
- `/register` – rejestracja.

**Strefa chroniona (auth)**

- `/generate` – generowanie fiszek.
- `/flashcards` – lista fiszek.
- `/account` – panel użytkownika i usuwanie konta.

### 1.2 Layouty i strony Astro

**Nowe layouty/rozszerzenia**

- `Layout.astro` – bazowy shell HTML (bez logiki auth).
- `AppShellLayout.astro` – tylko dla strefy auth (nawigacja, header aplikacji).
- `PublicLayout.astro` – lekki layout z linkami „Zaloguj” / „Zarejestruj”.

**Strony**

- `src/pages/login.astro`
  - SSR guard: jeśli użytkownik zalogowany → redirect do `/generate`.
  - Renderuje `LoginView` jako React (`client:load`).
- `src/pages/register.astro`
  - SSR guard: jeśli użytkownik zalogowany → redirect do `/generate`.
  - Renderuje `RegisterView` (`client:load`).
- `src/pages/generate.astro`, `src/pages/flashcards.astro`, `src/pages/account.astro`
  - SSR guard: jeśli brak sesji → redirect do `/login?redirectTo=...`.
  - Używają `AppShellLayout.astro` i istniejących widoków React.

**Zmiany w `AppShellLayout.astro`**

- Dodanie stanu „zalogowany” (np. poprzez przekazanie `userEmail` z Astro).
- przycisk „Wyloguj” w headerze, aby nie wymuszać wejścia w panel.

### 1.3 Komponenty React i odpowiedzialności

**Nowe komponenty (client-side)**

- `src/components/auth/LoginView.tsx`
  - Formularz e-mail/hasło.
  - Walidacja klienta, obsługa błędów z API.
  - Po sukcesie: redirect do `/generate` albo `redirectTo` z query.
- `src/components/auth/RegisterView.tsx`
  - Formularz e-mail/hasło.
  - Walidacja klienta, obsługa błędów z API.
  - Po sukcesie: automatyczne zalogowanie i redirect do `/generate`.

**Rozszerzane istniejące komponenty**

- `src/components/hooks/useAccountActions.ts`
  - Zamiast czyszczenia localStorage → wywołanie endpointu `POST /api/v1/auth/sign-out`.
  - Po sukcesie: redirect do `/login`.
- `src/components/hooks/useMe.ts`
  - Pobiera dane użytkownika po stronie client przez `/api/v1/me` (cookies, `credentials: "include"`).
  - Przy 401: redirect do `/login`.

### 1.4 Walidacja i komunikaty błędów

**Walidacja klienta (React)**

- Email: wymagany, poprawny format.
- Hasło: wymagane, min. 6 znaków (zgodne z domyślnymi wymaganiami Supabase).

**Przykładowe komunikaty**

- Rejestracja: „Podaj poprawny adres e-mail.” / „Hasło musi mieć co najmniej 6 znaków.”
- Logowanie: „Nieprawidłowy e-mail lub hasło.”
- Sesja wygasła: „Twoja sesja wygasła. Zaloguj się ponownie.”
- Usuwanie konta: „Potwierdź operację, zaznaczając checkbox.”

### 1.5 Kluczowe scenariusze UI

- **Rejestracja** → utworzenie konta → zalogowanie → redirect do `/generate`.
- **Logowanie** → redirect do `/generate`.
- **Wejście na stronę chronioną bez sesji** → redirect do `/login?redirectTo=...`.
- **Wylogowanie** → wyczyszczenie sesji (cookie) → redirect do `/login`.
- **Usuwanie konta** → potwierdzenie → usunięcie danych → logout i redirect do `/login`.
- **Sesja wygasła w trakcie pracy** → komunikat + redirect do `/login`.

---

## 2. Logika backendowa

### 2.1 Endpointy API (Astro `src/pages/api/v1/...`)

**Nowe endpointy auth**

- `POST /api/v1/auth/sign-up`
  - Body: `{ email, password }`
  - Tworzy użytkownika i sesję Supabase.
  - Ustawia cookies (`sb-access-token`, `sb-refresh-token`).
- `POST /api/v1/auth/sign-in`
  - Body: `{ email, password }`
  - Loguje użytkownika i ustawia cookies.
- `POST /api/v1/auth/sign-out`
  - Usuwa sesję Supabase i czyści cookies.

**Istniejące endpointy do aktualizacji**

- `GET /api/v1/me`
  - Weryfikuje sesję z cookies.
  - Zwraca `{ user: { id, email }, stats: { flashcardsCount, generationsCount } }`.
- `DELETE /api/v1/me`
  - Weryfikuje sesję i `confirm=true`.
  - Usuwa dane użytkownika oraz konto w Supabase Auth.
- Wszystkie inne endpointy w `src/pages/api/v1/*`
  - Wymagają uwierzytelnienia (401 bez sesji).
  - Identyfikują użytkownika na podstawie `locals.user` (z middleware).

### 2.2 Kontrakty (skrót)

- `POST /api/v1/auth/sign-up`
  - `200 { data: { user: { id, email } } }` lub `400/409/500`.
- `POST /api/v1/auth/sign-in`
  - `200 { data: { user: { id, email } } }` lub `401/500`.
- `POST /api/v1/auth/sign-out`
  - `200 { data: { signedOut: true } }`.
- `GET /api/v1/me`
  - `200 { data: MeDTO }`.
- `DELETE /api/v1/me`
  - `200 { data: { deleted: true } }`.

### 2.3 Modele danych

- Supabase Auth: `auth.users` (bez dodatkowej tabeli).
- Aplikacja: istniejące tabele `flashcards`, `generations`, `generation_error_logs` powiązane z `user_id`.

### 2.4 Walidacja danych wejściowych (Zod)

- `sign-up` / `sign-in`: email + hasło (min length, format).
- `delete` konta: `confirm === true`.
- Wszystkie endpointy auth i `me` zwracają spójne kody błędów (`UNAUTHORIZED`, `VALIDATION_ERROR`, `AUTH_ERROR`, `DB_ERROR`).

### 2.5 Obsługa wyjątków

- `jsonError(...)` jako standardowa odpowiedź błędu.
- Mapowanie błędów Supabase na kody domenowe:
  - `auth/invalid-login-credentials` → `INVALID_CREDENTIALS`.
  - `auth/user-already-exists` → `EMAIL_IN_USE`.
  - Brak sesji → `UNAUTHORIZED`.

### 2.6 SSR i renderowanie (Astro)

- W plikach stron chronionych: `export const prerender = false;` (jawne SSR).
- `login`/`register`: SSR guard i ewentualny redirect.
- `astro.config.mjs` już używa `output: "server"` i adaptera Node, więc logika auth może korzystać z `Astro.locals` i cookies.

---

## 3. System autentykacji (Supabase Auth + Astro)

### 3.1 Sesje i storage

- **Docelowo cookies (HttpOnly)** jako storage sesji (`sb-access-token`, `sb-refresh-token`).
- Po stronie client nie przechowujemy tokenów w `localStorage` (zmniejszenie ryzyka XSS).
- `fetch` z `credentials: "include"` dla wywołań do API.

### 3.2 Middleware (Astro)

W `src/middleware/index.ts`:

- Tworzy **server-side Supabase client** oparty o cookies z requestu.
- Weryfikuje sesję i ustawia:
  - `locals.supabase` – klient użytkownika (z tokenem),
  - `locals.user` – obiekt użytkownika (id, email),
  - `locals.adminSupabase` – klient z service-role (tylko dla operacji admin).
- Dla ścieżek chronionych (np. `/generate`, `/flashcards`, `/account`, `/api/v1/*`) brak sesji = 302 do `/login` albo 401 (dla API).

### 3.3 Autoryzacja i RLS

- Wszystkie zapytania do tabel `flashcards`, `generations`, `generation_error_logs` wykonywane w kontekście **użytkownika** (token z sesji), żeby działały RLS.
- Dodatkowe filtrowanie po `user_id` zostaje zachowane jako warstwa bezpieczeństwa aplikacyjnego (nie zastępuje RLS).

### 3.4 Usuwanie konta (US-010)

- Endpoint `DELETE /api/v1/me`:
  - Weryfikuje sesję.
  - Usuwa dane użytkownika:
    - `flashcards`, `generations`, `generation_error_logs` (najlepiej w transakcji).
  - Usuwa użytkownika w Supabase Auth przez `admin.deleteUser(userId)` (wymaga `SUPABASE_SERVICE_ROLE_KEY`).
- Po sukcesie: wylogowanie i wyczyszczenie cookies.

---

## 4. Wpływ na istniejące moduły (bez naruszenia zachowania)

- **Generowanie fiszek**: logika pozostaje bez zmian; jedynie userId pochodzi z sesji, a nie z `DEFAULT_USER_ID`.
- **Moje fiszki**: działa jak dotychczas, ale tylko dla zalogowanego użytkownika (RLS + session guard).
- **Panel użytkownika**:
  - `GET /api/v1/me` korzysta z sesji i zwraca prawdziwe dane użytkownika.
  - `DeleteAccountDialog` pozostaje UI-only; logika usuwania realizowana po stronie API.

---

## 5. Lista nowych/zmienianych modułów (referencyjnie)

**Nowe**

- `src/pages/login.astro`
- `src/pages/register.astro`
- `src/components/auth/LoginView.tsx`
- `src/components/auth/RegisterView.tsx`
- `src/pages/api/v1/auth/sign-in.ts`
- `src/pages/api/v1/auth/sign-up.ts`
- `src/pages/api/v1/auth/sign-out.ts`
- `src/lib/auth/server.ts` (tworzenie klienta Supabase z cookies)
- `src/lib/auth/browser.ts` (klient Supabase dla React – opcjonalnie)

**Zmieniane**

- `src/middleware/index.ts` – inicjalizacja sesji i `locals.user`.
- `src/pages/api/v1/me.ts` – pobieranie userId z sesji.
- Serwisy `flashcards.service.ts`, `generations.service.ts`, `generationErrorLogs.service.ts` – userId z sesji.
- `src/lib/api/client.ts` – `credentials: "include"`, rezygnacja z localStorage tokens.
- `src/components/hooks/useAccountActions.ts` – wylogowanie przez API.
- `src/components/hooks/useMe.ts` – obsługa 401 i redirect.

---

## 6. Wymagania konfiguracyjne

- `.env`:
  - `SUPABASE_URL`
  - `SUPABASE_KEY` (anon)
  - `SUPABASE_SERVICE_ROLE_KEY` (tylko serwer; do usuwania konta)

---

## 7. Kryteria zgodności z PRD

- US-001: formularz rejestracji e-mail + hasło, walidacja, auto-login po sukcesie.
- US-002: logowanie przekierowuje do `/generate`, błędne dane → komunikat.
- US-010: usuwanie konta w panelu użytkownika, kasuje konto i dane.
