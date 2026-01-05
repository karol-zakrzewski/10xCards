# Architektura UI dla 10xCards (MVP)

## 1. Przegląd struktury UI

10xCards to aplikacja webowa dostępna wyłącznie po zalogowaniu. Interfejs jest minimalistyczny, w języku polskim, oparty o Astro (routing/strony) oraz React (interakcje), z komponentami shadcn/ui i Tailwind.

**Główne założenia architektoniczne UI (MVP):**

- **Dwie strefy routingu:**
  - **Publiczna (Auth):** ekrany logowania i rejestracji.
  - **Chroniona (App):** stały layout aplikacji z nawigacją i 3 aktywnymi widokami: „Generowanie”, „Moje fiszki”, „Panel użytkownika”.
- **Brak trwałości sesji generowania po odświeżeniu:** propozycje „przed zapisem” są przechowywane tylko w pamięci (React state/Context), bez ostrzeżeń o utracie.
- **Źródło prawdy danych domenowych:** API + refetch po mutacjach (bez optymistycznych aktualizacji dla CRUD fiszek i akcji destrukcyjnych).
- **Strategia błędów:** walidacje i błędy szczegółowe inline; błędy ogólne jako toast. Dla 401/wygaśniętej sesji: przejście do auth.
- **Dostępność jako baseline:** poprawne focus management (Dialog/AlertDialog), aria-label na ikonowych akcjach, czytelne stany disabled, nawigacja klawiaturą.

**Proponowany schemat ścieżek (jedno „namespace” po zalogowaniu):**

- Public: `/login`, `/register`
- Chronione: `/generate`, `/flashcards`, `/account`
- Nawigacja zawiera również element disabled: „Sesja powtórek — Wkrótce” (bez aktywnej trasy w MVP lub trasa bez dostępu).

### 1.1. Kluczowe wymagania (z PRD + notatki) → konsekwencje dla UI

- **Generowanie z tekstu 1000–10000 znaków:** licznik znaków + walidacja inline + blokada „Generuj” poza zakresem; brak automatycznego przycinania.
- **Propozycje po generacji wymagają jawnej decyzji:** statusy lokalne (do decyzji/zaakceptowana/odrzucona), widoczny licznik „Akceptowane: X / Wygenerowane: Y”, „Zapisz zaakceptowane” zablokowany, gdy X=0, "Zapisz wszystkie", zablokowany gdy trwa zapisywanie fiszek.
- **Blokada kolejnej generacji:** jeśli istnieją aktywne propozycje (zaakceptowane/odrzucone/edytowane), nie wolno generować ponownie; użytkownik musi „Zapisz” lub „Wyczyść”.
- **„Odrzuć” = ukryj z Undo:** brak trwałego usuwania propozycji; odrzucenie ma mieć łatwe cofnięcie w obrębie sesji.
- **Edycja w modalu:** jeden modal z trzema trybami: „Dodaj” (POST `/flashcards`), „Edytuj” (PATCH `/flashcards/{id}`), „Edytuj propozycję” (tylko lokalnie). Reguła: „ai-edited” tylko jeśli użytkownik zatwierdzi zmianę w modalu.
- **MVP „Moje fiszki”:** wyszukiwanie `q` + filtr `source` + paginacja; parametry `q/source/page/limit` w URL i mapowanie 1:1 na GET `/flashcards` (debounce dla `q`, reset `page=1` przy zmianie filtrów).
- **Akcje destrukcyjne:** AlertDialog z jednoznacznym opisem trwałości, loaderem i blokadą zamknięcia w trakcie requestu.
- **Panel użytkownika:** profil (email) + statystyki z GET `/me`, wylogowanie, usunięcie konta z checkboxem potwierdzenia, czytelna obsługa 400/403.
- **Po POST `/flashcards:bulkCreate`:** reset całej sesji generowania + toast sukcesu.
- **Poza MVP:** „Historia generowania” i ekran logów błędów generacji (mimo istnienia endpointów).

### 1.2. Mapowanie historyjek użytkownika (PRD) → widoki

| ID     | Skrót celu               | Główne widoki / elementy UI                                                    |
| ------ | ------------------------ | ------------------------------------------------------------------------------ |
| US-001 | Rejestracja              | `/register` (formularz e-mail + hasło, komunikaty inline, toast sukcesu)       |
| US-002 | Logowanie + redirect     | `/login` → redirect do `/generate`                                             |
| US-003 | Generowanie AI           | `/generate` (pole tekstowe, walidacja 1000–10000, loading, błędy)              |
| US-004 | Przegląd i decyzja       | `/generate` (lista propozycji, akcje edit/accept/refuse+undo, „Zapisz”)        |
| US-005 | Edycja fiszek            | `/flashcards` (modal „Edytuj”), `/generate` (modal „Edytuj propozycję”)        |
| US-006 | Usuwanie fiszek          | `/flashcards` (AlertDialog + DELETE)                                           |
| US-007 | Ręczne tworzenie         | `/flashcards` (CTA „Dodaj fiszkę”), opcjonalnie `/generate` (CTA alternatywne) |
| US-008 | Sesja nauki (po MVP)     | Element disabled w nawigacji: „Sesja powtórek — Wkrótce”                       |
| US-009 | Autoryzacja i prywatność | Guard dla `/*`, reakcja na 401/403, brak ekspozycji danych innych użytkowników |

## 2. Lista widoków

Poniżej lista minimalnych widoków (routes) oraz elementów dialogowych (modal/dialog) niezbędnych do realizacji MVP.

### 2.1. Landing / Router startowy

- **Nazwa widoku:** Start (redirect)
- **Ścieżka widoku:** `/`
- **Główny cel:** przekierowanie użytkownika zależnie od stanu sesji.
- **Kluczowe informacje:** brak (stan przejściowy).
- **Kluczowe komponenty widoku:** ekran ładowania (skeleton/spinner) na czas sprawdzenia sesji.
- **UX, dostępność i bezpieczeństwo:**
  - Brak migotania między publicznym a chronionym UI (krótki stan „loading”).
  - Jeśli brak sesji: redirect do `/login`; jeśli jest: redirect do `/generate`.

### 2.2. Auth — Logowanie

- **Nazwa widoku:** Logowanie
- **Ścieżka widoku:** `/login`
- **Główny cel:** umożliwić zalogowanie i wejście do aplikacji.
- **Kluczowe informacje do wyświetlenia:** formularz (email, hasło), link do rejestracji, komunikaty błędów.
- **Kluczowe komponenty widoku:**
  - Formularz logowania (shadcn/ui inputs + button).
  - Inline błędy walidacji (np. wymagane pola) oraz błędy z backendu (np. nieprawidłowe dane).
  - Stan ładowania przy submit (disabled + spinner).
- **Integracja z API:** Supabase Auth (sign-in), a następnie routing do `/generate`.
- **UX, dostępność i bezpieczeństwo:**
  - Poprawne atrybuty `type=email/password`, obsługa Enter, focus na pierwszym polu.
  - Dla 401/niepowodzenia: czytelny komunikat bez ujawniania szczegółów.

### 2.3. Auth — Rejestracja

- **Nazwa widoku:** Rejestracja
- **Ścieżka widoku:** `/register`
- **Główny cel:** utworzyć konto i zalogować użytkownika.
- **Kluczowe informacje do wyświetlenia:** formularz (email, hasło), link do logowania, potwierdzenie sukcesu.
- **Kluczowe komponenty widoku:** analogiczne do logowania (walidacje inline, loading).
- **Integracja z API:** Supabase Auth (sign-up), następnie redirect do `/generate`.
- **UX, dostępność i bezpieczeństwo:**
  - Jasna informacja o minimalnych wymaganiach hasła (jeśli stosowane).
  - Nie wymagamy potwierdzenia e-mail w MVP (zgodnie z decyzją z sesji).

### 2.4. App Shell (Layout po zalogowaniu)

- **Nazwa widoku:** Layout aplikacji
- **Ścieżka widoku:** `/*` (wrapper dla widoków)
- **Główny cel:** zapewnić stałą strukturę (nawigacja + miejsce na treść), spójną obsługę stanów globalnych.
- **Kluczowe informacje do wyświetlenia:** nawigacja (aktywny stan), ewentualnie skrócone dane użytkownika (np. email) w menu.
- **Kluczowe komponenty widoku:**
  - Nawigacja główna (3 aktywne pozycje + 1 disabled „Wkrótce”).
  - Kontener treści (Outlet) + globalny system toastów.
  - Globalne granice błędów (dla awarii UI) oraz obsługa 401 (wymuszenie przejścia do auth).
- **UX, dostępność i bezpieczeństwo:**
  - Czytelne oznaczenie aktywnej pozycji; element disabled niedostępny dla kliknięcia (i z opisem „Wkrótce”).
  - Brak renderowania danych domenowych bez aktywnej sesji.

### 2.5. Generowanie fiszek (AI + propozycje)

- **Nazwa widoku:** Generowanie
- **Ścieżka widoku:** `/generate`
- **Główny cel:** wygenerować propozycje fiszek z tekstu, umożliwić przegląd/edycję/decyzję i zapisać zaakceptowane.
- **Kluczowe informacje do wyświetlenia:**
  - Pole `sourceText` + licznik znaków (1000–10000) i walidacja inline.
  - Status generacji (idle/loading/sukces/błąd).
  - Licznik: „Akceptowane: X / Wygenerowane: Y”.
  - Lista propozycji (karty).
- **Kluczowe komponenty widoku:**
  - Sekcja „Tekst źródłowy”: textarea + licznik + komunikaty walidacyjne.
  - CTA: „Generuj” (disabled poza zakresem i przy aktywnych propozycjach), „Wyczyść” (reset sesji), opcjonalnie „Dodaj fiszkę ręcznie”.
  - Sekcja „Propozycje”: grid kart propozycji z akcjami ikonowymi (edit/accept/refuse).
  - CTA: „Zapisz zaakceptowane” (disabled gdy X=0; w trakcie requestu: disabled + loader).
  - Dialog: modal „Edytuj propozycję” (lokalny).
- **Integracja z API:**
  - `POST /generations` (tworzy generację i zwraca listę propozycji).
  - `POST /flashcards:bulkCreate` (zapis zaakceptowanych: `generationId` + `items`).
  - (Opcjonalnie, manual): `POST /flashcards` dla „Dodaj fiszkę ręcznie”.
- **UX, dostępność i bezpieczeństwo:**
  - **Blokada kolejnej generacji:** jeśli istnieją propozycje w sesji (dowolny status), „Generuj” jest disabled z czytelnym wyjaśnieniem (tooltip/tekst pomocniczy).
  - **„Wyczyść” w generowaniu (MVP):** natychmiast resetuje całą sesję generowania (sourceText, generationId, propozycje, liczniki) bez dodatkowych ostrzeżeń o utracie (zgodnie z decyzją z sesji).
  - **Stany kart propozycji:**
    - `pending` (do decyzji): neutralny wygląd.
    - `accepted`: subtelna zielona ramka + czytelna informacja statusu.
    - `refused`: wyszarzenie i mniejsza widoczność; zamiast „Odrzuć” dostępne „Cofnij”.
  - **Reguły dostępności akcji na propozycjach (MVP, spójny model):**
    - `pending`: dostępne `accept`, `refuse`, `edit`.
    - `accepted`: dostępne `accept` jako „anuluj akceptację” (powrót do `pending`) oraz `edit`; `refuse` opcjonalnie (jeśli dostępne, to zmienia na `refused`).
    - `refused`: dostępne tylko `undo` (powrót do `pending`); pozostałe akcje disabled.
  - **Undo (odrzucenie):** odrzucenie nie usuwa danych; UI zapewnia szybkie cofnięcie w obrębie sesji (np. przycisk/ikona „Cofnij” na karcie oraz/lub toast z akcją).
  - Ikonowe przyciski mają `aria-label` i logiczne disabled (np. w trakcie zapisu).
  - Obsługa błędów:
    - `400` (walidacja `sourceText`): inline przy polu.
    - `429`: komunikat o limicie + sugestia ponowienia po czasie.
    - `502`: komunikat „Błąd dostawcy AI” + możliwość ponowienia (gdy brak aktywnych propozycji).
    - `401`: przejście do `/login`.

### 2.6. Moje fiszki (lista + filtr + paginacja)

- **Nazwa widoku:** Moje fiszki
- **Ścieżka widoku:** `/flashcards`
- **Główny cel:** przeglądać zapisane fiszki, filtrować, edytować, usuwać oraz dodawać ręcznie.
- **Kluczowe informacje do wyświetlenia:**
  - Lista fiszek (front/back w skrócie), źródło (`ai-full/ai-edited/manual`), metadane (np. daty).
  - Liczba wyników i paginacja (page/limit/total).
  - Aktualne filtry: `q`, `source`, `page`, `limit` (widoczne w URL).
- **Kluczowe komponenty widoku:**
  - Pasek filtrów:
    - wyszukiwarka `q` (debounce),
    - select `source`,
    - select `limit`,
    - reset filtrów (opcjonalnie).
  - Lista wyników (tabela lub lista kart zależnie od responsywności).
  - Paginacja (kontrolki + informacja „X–Y z total”).
  - CTA: „Dodaj fiszkę” → modal „Dodaj”.
  - Akcje na elemencie: „Edytuj” → modal „Edytuj”; „Usuń” → AlertDialog „Usuń fiszkę”.
- **Integracja z API:**
  - `GET /flashcards` z parametrami mapowanymi 1:1 z URL (`q/source/page/limit`).
  - `POST /flashcards` (manual create) z refetch listy po sukcesie.
  - `PATCH /flashcards/{id}` z refetch po sukcesie.
  - `DELETE /flashcards/{id}` z refetch po sukcesie.
- **UX, dostępność i bezpieczeństwo:**
  - `q` debounced; przy zmianie `q` lub `source` reset `page=1`.
  - Puste wyniki/nowy użytkownik: stan „Brak fiszek” z CTA „Dodaj fiszkę” oraz podpowiedzią użycia generowania.
  - Loader dla pobierania listy oraz dla mutacji; w przypadku błędów 400: inline w modalu; 404: czytelna informacja; 401: przejście do auth.
  - Usuwanie bez optymizmu: dialog blokuje zamknięcie podczas requestu; po sukcesie refetch + toast.

### 2.7. Panel użytkownika (konto)

- **Nazwa widoku:** Panel użytkownika
- **Ścieżka widoku:** `/account`
- **Główny cel:** wyświetlić dane konta i statystyki oraz umożliwić wylogowanie/usunięcie konta.
- **Kluczowe informacje do wyświetlenia:**
  - Email użytkownika.
  - Statystyki z API (np. liczba fiszek, liczba generacji).
- **Kluczowe komponenty widoku:**
  - Sekcja „Profil” (email).
  - Sekcja „Statystyki” (karty/metryki).
  - CTA: „Wyloguj”.
  - CTA: „Usuń konto” → AlertDialog z checkboxem potwierdzenia.
- **Integracja z API:**
  - `GET /me` (user + stats).
  - `DELETE /me` (usunięcie konta; wymaga potwierdzenia).
  - Supabase Auth: sign-out.
- **UX, dostępność i bezpieczeństwo:**
  - Usunięcie konta jako akcja destrukcyjna: checkbox „Rozumiem, że operacja jest nieodwracalna” + loader + blokada zamknięcia w trakcie requestu.
  - Obsługa błędów:
    - `400` (brak potwierdzenia): inline w dialogu.
    - `403`: komunikat o braku uprawnień (np. jeśli backend nie zezwala na self-delete).
    - `401`: przejście do auth.

### 2.8. Widoki poza MVP (zaplanowane / ukryte)

Te widoki nie są częścią MVP UI, ale API je przewiduje. W MVP: brak linków lub elementy ukryte/feature-flag.

- **Historia generowania:** lista generacji (`GET /generations`) i szczegóły (`GET /generations/{id}`).
- **Logi błędów generacji:** lista (`GET /generation-error-logs`).

## 3. Mapa podróży użytkownika

### 3.1. Ścieżka podstawowa: generowanie → decyzje → zapis

1. Użytkownik wchodzi na `/`:
   - Jeśli niezalogowany → `/login`.
   - Jeśli zalogowany → `/generate`.
2. W `/generate` użytkownik wkleja `sourceText`.
3. UI waliduje długość (1000–10000) i pokazuje licznik znaków; „Generuj” aktywuje się dopiero po spełnieniu warunków.
4. Użytkownik klika „Generuj”:
   - UI pokazuje loading i blokuje interakcje krytyczne.
   - Sukces: pojawia się lista propozycji + licznik „Akceptowane: 0 / Wygenerowane: Y”.
   - Błąd: UI pokazuje inline/ toast zależnie od typu błędu (np. 429, 502).
5. Użytkownik przegląda propozycje:
   - „Akceptuj” oznacza propozycję jako accepted.
   - „Odrzuć” ukrywa/wygasza propozycję i udostępnia „Cofnij”.
   - „Edytuj” otwiera modal, w którym można zmienić front/back; zatwierdzenie zmian ustawia `source=ai-edited`.
6. UI blokuje ponowną generację, dopóki istnieją propozycje w sesji.
7. Użytkownik klika „Zapisz zaakceptowane”:
   - Jeśli `X=0` → przycisk disabled (wskazówka dlaczego).
   - Jeśli `X>0` → request `POST /flashcards:bulkCreate`.
8. Po sukcesie:
   - Reset sesji generowania (input + propozycje + liczniki).
   - Toast potwierdzający zapis.
   - (Opcjonalnie) CTA/link do `/flashcards`.

### 3.2. Alternatywa: ręczne dodanie fiszki

1. Użytkownik wchodzi na `/flashcards` (lub korzysta z CTA w `/generate`).
2. Klika „Dodaj fiszkę” → modal w trybie „Dodaj”.
3. Wpisuje „Przód” i „Tył”; walidacje inline zgodne z API.
4. Zatwierdza → `POST /flashcards`, po sukcesie: zamknięcie modalu + refetch listy + toast.

### 3.3. Zarządzanie fiszkami: wyszukiwanie, edycja, usuwanie

1. Użytkownik w `/flashcards` ustawia `q/source/limit`:
   - UI aktualizuje URL i pobiera dane z `GET /flashcards`.
2. Edycja:
   - Akcja „Edytuj” → modal „Edytuj” → `PATCH /flashcards/{id}` → refetch.
3. Usuwanie:
   - Akcja „Usuń” → AlertDialog (opis trwałości) → `DELETE /flashcards/{id}` → refetch.

### 3.4. Konto: statystyki, wylogowanie, usunięcie konta

1. Użytkownik w `/account` widzi email i statystyki z `GET /me`.
2. „Wyloguj” kończy sesję i kieruje do `/login`.
3. „Usuń konto”:
   - Otwiera AlertDialog z checkboxem.
   - Po potwierdzeniu → `DELETE /me`.
   - Po sukcesie: wylogowanie + przejście do `/register` lub `/login` + toast.

## 4. Układ i struktura nawigacji

**Po zalogowaniu** aplikacja korzysta ze stałego layoutu (App Shell), w którym nawigacja jest zawsze widoczna:

- **Pozycje aktywne (MVP):**
  - „Generowanie” → `/generate`
  - „Moje fiszki” → `/flashcards`
  - „Panel użytkownika” → `/account`
- **Pozycja disabled (po MVP):**
  - „Sesja powtórek — Wkrótce” (disabled, bez nawigacji lub z informacyjnym ekranem bez funkcji)

**Zachowania nawigacji i layoutu:**

- Aktywna pozycja jest wyraźnie oznaczona.
- Layout responsywny: na mobile nawigacja jako topbar/bottom bar; na desktop jako sidebar/topbar (bez wpływu na logikę).
- Dla bezpieczeństwa: każda trasa w `/*` wymaga sesji; brak sesji lub 401 z API powoduje przejście do auth.

## 5. Kluczowe komponenty

Komponenty poniżej są współdzielone między widokami lub stanowią krytyczne „building blocks” MVP.

- **AppShellLayout:** stały layout po zalogowaniu (nawigacja + outlet + toasty).
- **AuthForms:** formularze logowania i rejestracji (wspólne walidacje, obsługa loading i błędów).
- **SourceTextComposer:** textarea z licznikiem znaków i walidacją 1000–10000; opis blokad „Generuj”.
- **GenerationProposalsList + ProposalCard:** prezentacja propozycji (statusy pending/accepted/refused), ikonowe akcje, obsługa Undo.
- **FlashcardModal (3 tryby):**
  - „Dodaj” (manual create),
  - „Edytuj” (edycja zapisanej fiszki),
  - „Edytuj propozycję” (edycja lokalna propozycji + reguła `ai-edited` tylko po zatwierdzeniu).
- **FlashcardsFiltersBar:** kontrolki `q/source/limit` zsynchronizowane z URL (debounce dla `q`).
- **Pagination:** kontrolki paginacji zgodne z `page/limit/total` z API.
- **DestructiveConfirmDialogs:**
  - „Usuń fiszkę” (AlertDialog, blokada zamknięcia w trakcie requestu),
  - „Usuń konto” (AlertDialog + checkbox + obsługa 400/403).
- **GlobalErrorHandling (UI-level):**
  - mapowanie błędów API na inline/toast,
  - wspólna reakcja na 401 (wymuszenie ścieżki auth),
  - fallback UI dla błędów nieobsłużonych (boundary).

### 5.1. Walidacje domenowe w UI (spójne z API)

- `sourceText`: 1000–10000 znaków (inline w generowaniu; blokada „Generuj” poza zakresem).
- `front`: wymagane; max 200 znaków (inline w modalu).
- `back`: wymagane; max 500 znaków (inline w modalu).
- Błędy walidacji z API (format `error.details`) są mapowane bezpośrednio na konkretne pola w UI, aby użytkownik zawsze wiedział „co i gdzie poprawić”.
