<conversation_summary>
<decisions>
1. W MVP przechowujemy sesje generowania w tabeli `generation_sessions` (powiązanie z użytkownikiem z Supabase Auth), w tym pełny `input_text` oraz `model`.
2. Wygenerowane fiszki **nie** są automatycznie zapisywane do bazy; stan podglądu/edycji/akceptacji/odrzucenia jest utrzymywany tylko po stronie klienta.
3. Do bazy trafiają wyłącznie fiszki zaakceptowane (AI) lub utworzone ręcznie (manual) – zapis AI odbywa się jako batch save w transakcji.
4. Odrzucenie fiszki loguje event `rejected` z `flashcard_id = NULL`.
5. Ręczne fiszki nie przechodzą przez akceptację – są automatycznie „zaakceptowane” (przy zapisie inicjujemy SM-2).
6. Wszystkie zapisane fiszki są w jednej tabeli `flashcards` i mają pole `source` o 3 stanach: `ai-full`, `ai-edited`, `manual`.
7. Reguły `source`: `manual` dla ręcznych; `ai-full` dla AI zaakceptowanych bez edycji; `ai-edited` dla AI edytowanych przed akceptacją; brak przejścia z `ai-edited` do `ai-full`.
8. `source` jest przechowywane jako `text` + CHECK (`source IN (...)`) dla prostszych migracji.
9. `sm2_state` jest przechowywane jako string zawierający JSON o stabilnym schemacie, z wersją `v=1`; minimalne pola: `v`, `repetitions`, `interval_days`, `ease_factor`. `due_at` to `timestamptz` w UTC.
10. Usuwanie fiszek po zapisaniu jest miękkie przez `deleted_at`; standardowe zapytania filtrują `deleted_at IS NULL`.
11. Podstawowe indeksy: `flashcards (user_id, due_at)`, `events (user_id, ts)`.
12. Eventy są tylko do odczytu i dopisywania (brak usuwania eventów).
13. Użytkownicy są zarządzani wyłącznie przez Supabase Auth (bez własnej tabeli `users`).
14. W MVP zakładamy, że konflikty równoczesnej edycji tej samej fiszki nie wystąpią (brak specjalnej obsługi).
</decisions>

<matched_recommendations>
1. Wprowadzić `generation_sessions` do grupowania generacji i audytu (pełny input + model).
2. Utrzymać jedną tabelę docelową `flashcards` dla zapisanych fiszek oraz jawne `source` (z CHECK) do analityki i spójności.
3. Przechowywać `due_at` jako `timestamptz` (UTC) i planować zapytania „due today” pod indeks `(user_id, due_at)`.
4. Traktować eventy jako append-only (select/insert), by metryki były stabilne.
5. Dodać soft delete przez `deleted_at` i konsekwentne filtrowanie `deleted_at IS NULL`.
6. Ustalić `sm2_state` jako wersjonowany JSON (w stringu) z minimalnym zestawem pól dla SM-2.
7. Dodać CHECK na treść fiszek: `length(trim(front)) > 0` i `length(trim(back)) > 0`.
</matched_recommendations>

<database_planning_summary>
a. Główne wymagania schematu
- Supabase PostgreSQL z Supabase Auth; dostęp do danych tylko po zalogowaniu (RLS).
- Fiszki AI: generacja → podgląd/edycja/akceptacja/odrzucenie w UI → batch save tylko zaakceptowanych do `flashcards`.
- Fiszki manual: zapis natychmiast do `flashcards` i od razu inicjowany SM-2.
- SM-2: `due_at` jako `timestamptz` (UTC), `sm2_state` jako JSON w stringu (wersja `v=1`).
- Soft delete fiszek: `deleted_at` + filtr `deleted_at IS NULL` w standardowych widokach.

b. Kluczowe encje i relacje
- `auth.users` (Supabase) 1:N `generation_sessions` (kolumny m.in. `user_id`, `input_text`, `model`, `created_at`).
- `auth.users` (Supabase) 1:N `flashcards` (m.in. `user_id`, `front`, `back`, `source`, `due_at`, `sm2_state`, `deleted_at`).
- `auth.users` (Supabase) 1:N `events` (m.in. `user_id`, `generation_session_id`, `flashcard_id` NULLable, `event_type`, `ts`, oraz `model` dla `generated`).
- `generation_sessions` 1:N `events` dla zdarzeń związanych z generacją; `flashcard_id` jest NULL m.in. dla `rejected` (i w praktyce także dla eventów, które dotyczą fiszek „przed zapisem”, jeśli nie ma trwałego ID).

c. Bezpieczeństwo i skalowalność
- RLS: `flashcards` pozwala właścicielowi na CRUD; `events` pozwala właścicielowi na `select/insert` (bez `delete`).
- Indeksy: `flashcards (user_id, due_at)` dla widoków powtórek; `events (user_id, ts)` pod metryki i audyt.
- Ograniczenia spójności (MVP): CHECK na `front/back` po `trim`, CHECK na `source IN ('ai-full','ai-edited','manual')`.

d. Obszary do dalszego etapu (DDL + RLS)
- Konkretne definicje kolumn, typów (`uuid`, `timestamptz`, `text`, itp.), FK do `auth.users`, polityki RLS (select/insert/update/delete) oraz indeksy zgodne z powyższymi decyzjami.
</database_planning_summary>

<unresolved_issues>
1. Jak identyfikować „per-fiszka” eventy `generated` (i inne przed zapisem), skoro nie ma jeszcze `flashcard_id` – czy wystarczy `generation_session_id + kolejność`, czy trzeba dodać np. `card_index` / snapshot treści w evencie.
2. Czy event `accepted` ma być logowany w momencie kliknięcia (przed zapisem) czy dopiero po udanym batch save (gdy istnieje `flashcard_id`) – obecne decyzje implikują logowanie po zapisie dla spójności identyfikatora.
</unresolved_issues>
</conversation_summary>
