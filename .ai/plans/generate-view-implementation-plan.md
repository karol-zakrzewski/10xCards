# Plan implementacji widoku Generowanie fiszek (`/generate`)

## 1. Przegląd

Widok „Generowanie” umożliwia zalogowanemu użytkownikowi wklejenie tekstu źródłowego, wygenerowanie propozycji fiszek przez AI, a następnie ich przegląd (akceptacja/odrzucenie/cofnięcie odrzucenia), edycję w modalu oraz zapis wyłącznie zaakceptowanych fiszek do bazy przez endpoint bulk.

Zakładamy, że:

- stan propozycji „przed zapisem” jest wyłącznie po stronie klienta (bez persystencji po odświeżeniu),
- UI działa w języku polskim,
- walidacja długości `sourceText` jest zgodna z API (obecnie 1000–10000 znaków),
- zapisywanie fiszek po generacji odbywa się przez endpoint bulk (spec: `POST /flashcards:bulkCreate`; aktualny routing w repo: `POST /flashcards/bulkCreate`).

> Uwaga o rozbieżności wymagań: część dokumentacji produktu wspomina limit 1000 znaków, ale walidacja API i plan UI są w zakresie 1000–10000. Dla spójności implementacji przyjmij zakres zgodny z walidacją API (`src/lib/validation/generations.ts`).

## 2. Routing widoku

- Ścieżka: `/generate`
- Typ: strona Astro, która renderuje interaktywny komponent React.
- Dostęp: widok chroniony (wymaga aktywnej sesji). W przypadku braku sesji / 401 należy przekierować do `/login`.

Proponowana struktura routingu:

- `src/pages/generate.astro` – route dla widoku
- Widok osadzony w „App Shell” (layout po zalogowaniu). Jeśli App Shell nie istnieje jeszcze, należy dodać go jako część prac przygotowawczych (minimalny wrapper z nawigacją i miejscem na treść).

## 3. Struktura komponentów

Proponowane drzewo komponentów (wysoki poziom):

```
GenerateRoute (Astro: src/pages/generate.astro)
└─ AppShellLayout (Astro/React wrapper)
   └─ GenerateFlashcardsView (React)
      ├─ SourceTextSection
      │  ├─ SourceTextTextarea
      │  └─ GenerateControls
      ├─ GenerationStatusBanner
      ├─ ProposalsSection
      │  ├─ ProposalsHeader (liczniki)
      │  ├─ ProposalsGrid
      │  │  └─ ProposalCard (xN)
      │  └─ SaveAcceptedBar
      └─ EditProposalDialog
```

## 4. Szczegóły komponentów

Poniżej komponenty, które powinny wystarczyć do wydajnego wdrożenia widoku oraz utrzymania spójności z wymaganiami.

### 4.1. `GenerateRoute` (`src/pages/generate.astro`)

- Opis komponentu: strona routingu; dostarcza layout i osadza Reactowy widok.
- Główne elementy:
  - wrapper layoutu,
  - mount React (`client:load` lub `client:visible` – rekomendowane `client:load`, bo UX zależy od natychmiastowej interakcji).
- Obsługiwane zdarzenia: brak (Astro-level).
- Warunki walidacji: brak.
- Typy: brak.
- Propsy: brak.

### 4.2. `AppShellLayout`

- Opis komponentu: stały układ po zalogowaniu (nawigacja + kontener treści + globalne toasty). Widok `/generate` jest jedną z zakładek.
- Główne elementy:
  - nawigacja: „Generowanie” (`/generate`), „Moje fiszki” (`/flashcards`), „Panel użytkownika” (`/account`) + disabled „Sesja powtórek — Wkrótce”,
  - kontener treści (`<main>`),
  - (opcjonalnie) globalny provider toastów.
- Obsługiwane zdarzenia:
  - klik w pozycje nawigacji (routing),
  - (opcjonalnie) wylogowanie w menu użytkownika.
- Warunki walidacji:
  - brak renderowania części „app” bez sesji (guard na poziomie layoutu lub strony),
  - reakcja na 401 z API: redirect do `/login`.
- Typy:
  - `MeDTO` (opcjonalnie, jeśli layout pokazuje email),
  - `ErrorResponse` (obsługa błędów).
- Propsy:
  - `children: React.ReactNode` / `<slot />` (w zależności od implementacji layoutu).

### 4.3. `GenerateFlashcardsView`

- Opis komponentu: główny, stanowy komponent widoku; trzyma „sesję generowania” i koordynuje API + interakcje na propozycjach.
- Główne elementy:
  - `SourceTextSection`,
  - `GenerationStatusBanner`,
  - `ProposalsSection`,
  - `EditProposalDialog`.
- Obsługiwane zdarzenia:
  - zmiana `sourceText`,
  - klik „Generuj”, „Wyczyść”, „Zapisz zaakceptowane”,
  - akcje na kartach propozycji: accept/unaccept, refuse, undo, edit.
- Warunki walidacji (szczegółowe):
  - `sourceText`: po `trim()` długość **min 1000, max 10000** (blokada generowania + błąd inline),
  - blokada kolejnej generacji: gdy istnieje jakakolwiek propozycja w bieżącej sesji (niezależnie od statusu),
  - zapis: dozwolony tylko gdy `acceptedCount > 0` oraz istnieje `generationId`.
- Typy (DTO i ViewModel):
  - DTO: `GenerationCreateCommand`, `GenerationSummaryDTO`, `FlashcardProposalDTO`, `BulkFlashcardsCreateCommand`, `BulkFlashcardsCreateResultDTO`, `ErrorResponse`,
  - ViewModel: `FlashcardProposalVM`, `GenerationSessionVM`, `ApiRequestState`.
- Propsy:
  - brak (komponent strony); ewentualnie `initialSourceText?: string` (opcjonalnie, jeśli kiedyś dodasz deep link).

### 4.4. `SourceTextSection`

- Opis komponentu: sekcja z textarea + licznik + walidacja + podstawowe CTA.
- Główne elementy:
  - `<textarea>` (lub shadcn `Textarea`),
  - licznik znaków (aktualny + zakres 1000–10000),
  - komunikat walidacyjny inline,
  - przyciski: „Generuj”, „Wyczyść”, (opcjonalnie) „Dodaj fiszkę ręcznie”.
- Obsługiwane zdarzenia:
  - `onChange` textarea,
  - `onClick` generuj/wyczyść.
- Warunki walidacji:
  - `sourceText` poza zakresem: „Generuj” disabled + komunikat,
  - istnieją propozycje w sesji: „Generuj” disabled + komunikat dlaczego.
- Typy:
  - `SourceTextValidationVM`,
  - `ApiRequestState` (do disabled/loading na przyciskach).
- Propsy:
  - `value: string`
  - `onChange: (value: string) => void`
  - `validation: SourceTextValidationVM`
  - `canGenerate: boolean`
  - `isGenerating: boolean`
  - `onGenerate: () => void`
  - `onClear: () => void`
  - `disableGenerateReason?: string` (tekst pomocniczy/tooltip)

### 4.5. `GenerationStatusBanner`

- Opis komponentu: prezentuje stan „loading / error / success” w sposób czytelny i dostępny.
- Główne elementy:
  - banner/alert (shadcn `Alert` lub prosty `<div role="status">`),
  - opcjonalny przycisk „Spróbuj ponownie” (tylko gdy brak aktywnych propozycji).
- Obsługiwane zdarzenia:
  - `onRetry` (opcjonalnie).
- Warunki walidacji:
  - nie dotyczy (to prezentacja stanu).
- Typy:
  - `ApiErrorVM` (zmapowany błąd z `ErrorResponse`).
- Propsy:
  - `state: ApiRequestState`
  - `error?: ApiErrorVM`
  - `onRetry?: () => void`

### 4.6. `ProposalsSection`

- Opis komponentu: sekcja listy propozycji + liczników + CTA zapisu.
- Główne elementy:
  - nagłówek z licznikami („Akceptowane: X / Wygenerowane: Y”),
  - grid/lista `ProposalCard`,
  - pasek zapisu `SaveAcceptedBar`.
- Obsługiwane zdarzenia:
  - przekazuje akcje do `ProposalCard`,
  - klik „Zapisz zaakceptowane”.
- Warunki walidacji:
  - `Save` disabled gdy `acceptedCount === 0`,
  - `Save` disabled w trakcie requestu.
- Typy:
  - `FlashcardProposalVM[]`,
  - `GenerationSessionVM` (tylko potrzebne pola: `acceptedCount`, `generatedCount`).
- Propsy:
  - `proposals: FlashcardProposalVM[]`
  - `acceptedCount: number`
  - `generatedCount: number`
  - `isSaving: boolean`
  - `onAcceptToggle: (id: string) => void`
  - `onRefuse: (id: string) => void`
  - `onUndo: (id: string) => void`
  - `onEdit: (id: string) => void`
  - `onSaveAccepted: () => void`

### 4.7. `ProposalCard`

- Opis komponentu: prezentuje jedną propozycję fiszki wraz z akcjami statusu i edycji.
- Główne elementy:
  - karta (`Card`) z `front/back`,
  - akcje ikonowe: accept/unaccept, refuse, undo, edit,
  - status wizualny:
    - `pending`: neutralny,
    - `accepted`: subtelna zielona ramka,
    - `refused`: wyszarzenie + tylko undo.
- Obsługiwane zdarzenia:
  - `onAcceptToggle`, `onRefuse`, `onUndo`, `onEdit`.
- Warunki walidacji:
  - zgodnie z regułami dostępności akcji:
    - `pending`: accept/refuse/edit enabled,
    - `accepted`: acceptToggle/edit enabled; refuse opcjonalnie,
    - `refused`: tylko undo enabled.
  - w trakcie zapisu: wszystkie akcje disabled (żeby nie rozjechać payloadu).
- Typy:
  - `FlashcardProposalVM`.
- Propsy:
  - `proposal: FlashcardProposalVM`
  - `disabled?: boolean`
  - `onAcceptToggle: (id: string) => void`
  - `onRefuse: (id: string) => void`
  - `onUndo: (id: string) => void`
  - `onEdit: (id: string) => void`

### 4.8. `SaveAcceptedBar`

- Opis komponentu: dolny pasek/sekcja z przyciskiem zapisu zaakceptowanych fiszek oraz krótką informacją o stanie.
- Główne elementy:
  - przycisk „Zapisz zaakceptowane”,
  - loader + tekst „Zapisywanie…”,
  - hint „Zaznacz fiszki do zapisu” gdy `acceptedCount=0`.
- Obsługiwane zdarzenia:
  - `onSave`.
- Warunki walidacji:
  - disabled gdy `acceptedCount=0`,
  - disabled gdy `isSaving=true`.
- Typy:
  - brak nowych (wystarczy licznik + state).
- Propsy:
  - `acceptedCount: number`
  - `isSaving: boolean`
  - `onSave: () => void`

### 4.9. `EditProposalDialog`

- Opis komponentu: modal edycji propozycji (tylko lokalnie), z walidacją `front/back` zgodną z API i logiką ustawiania `source` na `ai-edited` tylko po zapisie zmian.
- Główne elementy:
  - dialog (shadcn `Dialog`),
  - formularz z polami „Przód” i „Tył”,
  - CTA: „Anuluj” / „Zapisz zmiany”.
- Obsługiwane zdarzenia:
  - `onOpenChange`,
  - `onChange` pól,
  - `onSubmit`.
- Warunki walidacji:
  - `front`: po `trim()` długość **1–200**,
  - `back`: po `trim()` długość **1–500**,
  - blokada submit gdy niepoprawne lub gdy brak zmian (opcjonalnie),
  - po submit:
    - aktualizacja propozycji w stanie sesji,
    - ustawienie `isEdited` na podstawie porównania z wartościami bazowymi (patrz typy).
- Typy:
  - `FlashcardProposalVM`,
  - `FlashcardEditDraftVM`.
- Propsy:
  - `open: boolean`
  - `proposal?: FlashcardProposalVM` (wybrana propozycja)
  - `onClose: () => void`
  - `onSave: (id: string, next: { front: string; back: string }) => void`

## 5. Typy

Poniżej typy wymagane do implementacji widoku. Część istnieje już w `src/types.ts`, część to nowe ViewModel’e dla UI.

### 5.1. Typy istniejące (DTO / Command)

- `GenerationCreateCommand`
  - `sourceText: string`
- `GenerationSummaryDTO`
  - `id: number`
  - `generatedCount: number`
  - `generationDurationMs: number`
  - `createdAt: string`
- `FlashcardProposalDTO`
  - `id: string`
  - `front: string`
  - `back: string`
  - `source: "ai-full" | "ai-edited" | "manual"` (dla propozycji z generacji oczekujemy `ai-full`)
- `BulkFlashcardsCreateCommand`
  - `generationId: number`
  - `items: BulkFlashcardsCreateItemCommand[]`
- `BulkFlashcardsCreateItemCommand`
  - `front: string`
  - `back: string`
  - `source: "ai-full" | "ai-edited"`
- `BulkFlashcardsCreateResultDTO`
  - `created: FlashcardDTO[]`
  - `generation: GenerationAcceptanceStatsDTO` (struktura jak w `src/types.ts`)
- `ErrorResponse`
  - `error.code: string`
  - `error.message: string`
  - `error.details?: Record<string, unknown>`

### 5.2. Nowe typy ViewModel (do utworzenia na frontendzie)

Rekomendowane (w nowym module np. `src/lib/viewmodels/generateFlashcards.ts` lub lokalnie w komponencie, jeśli repo nie ma konwencji):

- `type ProposalStatus = "pending" | "accepted" | "refused"`

- `interface FlashcardProposalVM`
  - `id: string` – z API
  - `base: { front: string; back: string }` – wartości otrzymane z generacji (do porównania)
  - `current: { front: string; back: string }` – aktualne wartości (po edycjach)
  - `status: ProposalStatus` – stan decyzji użytkownika
  - `isEdited: boolean` – pochodna: `current != base`
  - `sourceForSave: "ai-full" | "ai-edited"` – pochodna: `isEdited ? "ai-edited" : "ai-full"`

- `interface GenerationSessionVM`
  - `sourceText: string`
  - `generationId: number | null`
  - `generatedCount: number` – z `generation.generatedCount`
  - `proposals: FlashcardProposalVM[]`
  - `acceptedCount: number` – pochodna z `proposals`

- `type ApiRequestState = "idle" | "loading" | "success" | "error"`

- `interface ApiErrorVM`
  - `httpStatus?: number` (jeśli dostępne)
  - `code?: string` (np. `VALIDATION_ERROR`, `UNAUTHORIZED`, `PROVIDER_ERROR`)
  - `message: string`
  - `details?: Record<string, unknown>`

- `interface SourceTextValidationVM`
  - `trimmedLength: number`
  - `min: 1000`
  - `max: 10000`
  - `isValid: boolean`
  - `errorMessage?: string`

- `interface FlashcardEditDraftVM`
  - `front: string`
  - `back: string`
  - `frontError?: string`
  - `backError?: string`
  - `isValid: boolean`

## 6. Zarządzanie stanem

Zakładamy zarządzanie stanem lokalnie w obrębie widoku (bez globalnego store). Widok ma charakter jednorazowej sesji, która po odświeżeniu nie musi być zachowana.

### 6.1. Sugerowane zmienne stanu w `GenerateFlashcardsView`

- `sourceText: string`
- `generationId: number | null`
- `generatedCount: number`
- `proposals: FlashcardProposalVM[]`
- `generateState: ApiRequestState` + `generateError?: ApiErrorVM`
- `saveState: ApiRequestState` + `saveError?: ApiErrorVM`
- `editDialogOpen: boolean`
- `editingProposalId: string | null`
- `editDraft: FlashcardEditDraftVM` (lub wyliczany na podstawie `proposal.current`)

### 6.2. Custom hook (zalecane)

Warto wydzielić logikę sesji do hooka (ułatwia testowanie i utrzymanie):

- `useGenerationSession()`
  - trzyma stan sesji: `sourceText`, `generationId`, `proposals`, liczniki
  - udostępnia akcje: `setSourceText`, `clearSession`, `setProposalsFromApi`, `toggleAccept`, `refuse`, `undo`, `openEdit`, `applyEdit`

Osobno (albo w tym samym hooku) można dodać:

- `useApiClient()` – wrapper na `fetch` + mapowanie `ErrorResponse` do `ApiErrorVM`.

## 7. Integracja API

Bazowa ścieżka: `/api/v1`.

### 7.1. `POST /generations`

- Cel: uruchomienie generacji i pobranie propozycji.
- Request body (JSON): `GenerationCreateCommand`
  - `{ sourceText: string }`
- Response (201):
  - `{ generation: GenerationSummaryDTO, proposals: FlashcardProposalDTO[] }`
- Błędy:
  - `400` – walidacja `sourceText` (inline przy textarea),
  - `401` – redirect do `/login`,
  - `429` – toast/alert o limicie + możliwość ponowienia po czasie,
  - `502` – komunikat „Błąd dostawcy AI” + możliwość ponowienia.

Uwagi implementacyjne:

- Front powinien wysyłać `Content-Type: application/json`.
- Docelowo należy dołączać `Authorization: Bearer <supabase_access_token>` (nawet jeśli aktualna implementacja backendu nie zawsze tego wymaga), żeby zachować zgodność z kontraktem i przyszłym włączeniem auth.

### 7.2. `POST /flashcards:bulkCreate` (spec) / `POST /flashcards/bulkCreate` (aktualny routing w repo)

- Cel: zapis tylko zaakceptowanych fiszek oraz aktualizacja statystyk generacji.
- Request body: `BulkFlashcardsCreateCommand`
  - `generationId: number`
  - `items: Array<{ front: string; back: string; source: "ai-full" | "ai-edited" }>`
- Response (201):
  - `{ data: BulkFlashcardsCreateResultDTO }`
- Błędy:
  - `400` – walidacja (puste `items`, błędne długości, zbyt dużo itemów, duplikaty),
  - `401` – brak tokenu → redirect do `/login`,
  - `404` – `generationId` nie istnieje lub nie należy do użytkownika.

Uwagi implementacyjne:

- W tym repo endpoint jest obecnie wystawiony jako `POST /api/v1/flashcards/bulkCreate` (Astro file-based routing: `src/pages/api/v1/flashcards/bulkCreate.ts`). Jeśli chcesz zachować nazwę ze specyfikacji (`/flashcards:bulkCreate`), dodaj alias/rewriter albo drugi route, ale frontend na start powinien wołać ścieżkę, która realnie działa.

- Payload buduj wyłącznie z propozycji w statusie `accepted`.
- `source` ustawiaj na podstawie `isEdited` (patrz `FlashcardProposalVM.sourceForSave`).
- Przed wysłaniem warto wykonać deduplikację po znormalizowanym `(front, back)` (trim + lowerCase) żeby ograniczyć ryzyko `400` „duplikaty”.

### 7.3. Wspólny klient API (rekomendacja)

Dodaj prosty wrapper:

- `fetchJson<T>(url, init) -> Promise<T>`
  - dla `!res.ok`: spróbuj sparsować `ErrorResponse` i rzuć błąd domenowy (`ApiErrorVM`),
  - dla `401`: ujednolić obsługę (np. custom error `UNAUTHORIZED`).

## 8. Interakcje użytkownika

1. Użytkownik wpisuje/wkleja tekst w textarea:
   - UI aktualizuje licznik,
   - UI pokazuje błąd inline jeśli `trim().length` poza zakresem 1000–10000,
   - „Generuj” jest disabled dopóki dane nie są poprawne.
2. Użytkownik klika „Generuj”:
   - UI przechodzi w loading,
   - blokuje krytyczne akcje (ponowne generowanie, zapis, edycję),
   - po sukcesie: wyświetla listę propozycji i licznik „Akceptowane: 0 / Wygenerowane: Y”,
   - po błędzie: pokazuje komunikat zgodnie z kodem.
3. Użytkownik akceptuje propozycje:
   - klik „Akceptuj” ustawia `status=accepted`,
   - ponowny klik (na accepted) cofa do `pending`.
4. Użytkownik odrzuca propozycje:
   - klik „Odrzuć” ustawia `status=refused`,
   - w stanie refused dostępne jest tylko „Cofnij” (`undo` → `pending`).
5. Użytkownik edytuje propozycję:
   - klik „Edytuj” otwiera modal,
   - po zapisie zmian:
     - `proposal.current` ulega zmianie,
     - `isEdited` jest aktualizowane,
     - status propozycji pozostaje bez zmian (pending/accepted/refused – zgodnie z decyzją UX; rekomendacja: nie zmieniaj statusu automatycznie).
6. Użytkownik klika „Zapisz zaakceptowane”:
   - jeśli `acceptedCount=0` → przycisk disabled,
   - jeśli `acceptedCount>0`:
     - UI wysyła request bulk (w repo: `POST /api/v1/flashcards/bulkCreate`),
     - w trakcie requestu blokuje akcje na listach i w modalu,
     - po sukcesie: czyści sesję (sourceText, proposals, generationId) + toast sukcesu,
     - opcjonalnie pokazuje CTA „Przejdź do Moje fiszki”.
7. Użytkownik klika „Wyczyść”:
   - natychmiast resetuje całą sesję generowania bez ostrzeżeń (zgodnie z UI planem).

## 9. Warunki i walidacja

### 9.1. Warunki walidowane w UI (przed requestem)

- `sourceText`:
  - waliduj na `trim()`:
    - min 1000, max 10000,
  - brak automatycznego przycinania do limitu (jeśli > 10000, pokaż błąd).
- „Generuj”:
  - disabled, gdy `sourceText` niepoprawne,
  - disabled, gdy istnieją propozycje w bieżącej sesji (dowolny status).
- „Zapisz zaakceptowane”:
  - disabled, gdy `acceptedCount=0`,
  - disabled, gdy brak `generationId`,
  - disabled w trakcie requestu.
- Edycja propozycji w dialogu:
  - `front.trim()` 1–200,
  - `back.trim()` 1–500.

### 9.2. Warunki wynikające z API (do odzwierciedlenia w UI)

- `bulkCreate.items`:
  - min 1, max 100,
  - każdy element musi spełnić walidację `front/back`,
  - `source` tylko `ai-full` lub `ai-edited`.
- `generationId`:
  - dodatnia liczba całkowita (safe integer).

## 10. Obsługa błędów

Rekomendowany podział:

- Błędy walidacji (400, `VALIDATION_ERROR`):
  - `sourceText`: inline pod textarea,
  - `front/back` w modalu: inline przy polach,
  - `bulkCreate` (np. duplikaty): toast + podpowiedź („Usuń duplikaty i spróbuj ponownie”).
- `401 UNAUTHORIZED`:
  - natychmiastowy redirect do `/login`,
  - opcjonalnie toast „Sesja wygasła”.
- `404 NOT_FOUND` (bulkCreate):
  - toast „Nie znaleziono generacji (możliwe, że sesja wygasła)” + CTA „Wyczyść” (reset sesji).
- `429`:
  - toast/alert o limicie, bez resetu sesji (użytkownik może spróbować później).
- `502 PROVIDER_ERROR`:
  - toast/alert „Błąd dostawcy AI”,
  - możliwość ponowienia (tylko jeśli brak aktywnych propozycji; w przeciwnym razie najpierw „Wyczyść”).
- Błędy sieci / JSON parse:
  - komunikat ogólny „Nie udało się połączyć z serwerem”.

## 11. Kroki implementacji

1. Utwórz route `src/pages/generate.astro` i osadź w nim Reactowy `GenerateFlashcardsView` (z layoutem docelowym App Shell).
2. Dodaj (jeśli brak) minimalny App Shell:
   - nawigacja (linki do `/generate`, `/flashcards`, `/account`),
   - miejsce na treść,
   - miejsce na toasty.
3. Dodaj potrzebne prymitywy UI (shadcn/Radix) dla widoku:
   - `Textarea`, `Card`, `Badge`/`Chip`, `Dialog`, (opcjonalnie) `Tooltip`, `Alert`.
4. Zaimplementuj `GenerateFlashcardsView` wraz z podziałem na komponenty sekcji:
   - `SourceTextSection`, `ProposalsSection`, `ProposalCard`, `EditProposalDialog`.
5. Zaimplementuj ViewModel sesji:
   - mapowanie `FlashcardProposalDTO -> FlashcardProposalVM` z `base/current/status/isEdited/sourceForSave`.
6. Zaimplementuj walidację `sourceText` i blokady CTA:
   - zakres 1000–10000 (trim),
   - blokada ponownego generowania przy aktywnych propozycjach.
7. Dodaj klienta API (helper dla `fetch`) i integrację:
   - `POST /api/v1/generations`,
   - `POST /api/v1/flashcards/bulkCreate` (aktualny routing w repo; ewentualnie alias do nazwy ze spec).
8. Dodaj mapowanie błędów na UI (inline/toast/redirect), zgodnie z sekcją 10.
9. Dodaj logikę zapisu zaakceptowanych:
   - budowa `items` wyłącznie z `accepted`,
   - deduplikacja,
   - reset sesji po sukcesie.
10. Zweryfikuj dostępność (a11y):
    - `aria-label` dla ikonowych akcji,
    - poprawny focus management w dialogu,
    - stany disabled i komunikaty.
11. Uruchom walidację jakości:
    - `npm run lint`,
    - `npm run build`.
