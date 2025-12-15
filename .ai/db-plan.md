# Schemat bazy danych (PostgreSQL / Supabase) — 10xCards MVP

## 1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

### `public.flashcards`

Przechowuje **zapisane** fiszki (zaakceptowane z AI lub utworzone ręcznie). Hard delete (brak `deleted_at`).

| Kolumna | Typ | Ograniczenia | Opis |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, `DEFAULT gen_random_uuid()` | Id fiszki |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | Właściciel fiszki (Supabase Auth) |
| `front` | `varchar(200)` | NOT NULL, CHECK `length(trim(front)) > 0` | Przód fiszki |
| `back` | `varchar(500)` | NOT NULL, CHECK `length(trim(back)) > 0` | Tył fiszki |
| `source` | `varchar(20)` | NOT NULL, CHECK `source IN ('ai-full','ai-edited','manual')` | Pochodzenie fiszki |
| `generation_id` | `bigint` | NULL, FK → `public.generations(id)` ON DELETE SET NULL | Powiązana generacja AI (opcjonalnie) |
| `created_at` | `timestamptz` | NOT NULL, `DEFAULT now()` | Utworzono |
| `updated_at` | `timestamptz` | NOT NULL, `DEFAULT now()` | Zmieniono (trigger) |


---

### `public.generations`

Agreguje pojedynczą sesję generowania fiszek przez AI (metryki i audyt). Relacja 1:N z `flashcards` przez `generation_id`.

| Kolumna | Typ | Ograniczenia | Opis |
| --- | --- | --- | --- |
| `id` | `bigint` | PK, `GENERATED ALWAYS AS IDENTITY` | Id generacji |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | Właściciel generacji |
| `model` | `varchar(100)` | NOT NULL | Id/model z OpenRouter |
| `generated_count` | `integer` | NOT NULL | Liczba fiszek wygenerowanych |
| `accepted_unedited_count` | `integer` | NULL | Liczba zaakceptowanych bez edycji |
| `accepted_edited_count` | `integer` | NULL | Liczba zaakceptowanych po edycji |
| `source_text_hash` | `varchar(128)` | NOT NULL | Hash tekstu wejściowego |
| `source_text_length` | `integer` | NOT NULL, CHECK `source_text_length BETWEEN 1000 AND 10000` | Długość tekstu wejściowego |
| `generation_duration` | `integer` | NOT NULL | Czas generacji (ms) |
| `created_at` | `timestamptz` | NOT NULL, `DEFAULT now()` | Utworzono |
| `updated_at` | `timestamptz` | NOT NULL, `DEFAULT now()` | Zmieniono (trigger) |

---

### `public.generation_error_logs`

Loguje nieudane próby generacji.

| Kolumna | Typ | Ograniczenia | Opis |
| --- | --- | --- | --- |
| `id` | `bigint` | PK, `GENERATED ALWAYS AS IDENTITY` | Id logu błędu |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | Właściciel |
| `model` | `varchar(100)` | NOT NULL | Model |
| `source_text_hash` | `varchar(128)` | NOT NULL | Hash tekstu wejściowego |
| `source_text_length` | `integer` | NOT NULL, CHECK `source_text_length BETWEEN 1000 AND 10000` | Długość tekstu |
| `error_code` | `varchar(100)` | NOT NULL | Kod błędu |
| `error_message` | `text` | NOT NULL | Treść błędu |
| `created_at` | `timestamptz` | NOT NULL, `DEFAULT now()` | Utworzono |

## 2. Relacje między tabelami

- `auth.users (1) — (N) public.flashcards` przez `flashcards.user_id`
- `auth.users (1) — (N) public.generations` przez `generations.user_id`
- `auth.users (1) — (N) public.generation_error_logs` przez `generation_error_logs.user_id`
- `public.generations (1) — (N) public.flashcards` przez `flashcards.generation_id`

## 3. Indeksy


**Dla list i edycji:**

- `(user_id, created_at DESC)` pod widok „Moje fiszki”
- `(generation_id)` pod łączenie z generacjami

**Dla metryk/audytu:**

- `generations (user_id, created_at DESC)`
- `generation_error_logs (user_id, created_at DESC)`

Przykładowe DDL (do migracji):

```sql
-- flashcards
create index if not exists flashcards_user_created_idx
  on public.flashcards (user_id, created_at desc);

create index if not exists flashcards_generation_idx
  on public.flashcards (generation_id);

-- generations
create index if not exists generations_user_created_idx
  on public.generations (user_id, created_at desc);

-- generation_error_logs
create index if not exists generation_error_logs_user_created_idx
  on public.generation_error_logs (user_id, created_at desc);
```

## 4. Zasady PostgreSQL (RLS)

Założenie: wszystkie tabele w `public` z włączonym RLS; dostęp tylko do danych użytkownika (`auth.uid()`).

```sql
-- FLASHCARDS: owner CRUD
alter table public.flashcards enable row level security;

create policy "flashcards_select_own"
  on public.flashcards for select
  using (user_id = auth.uid());

create policy "flashcards_insert_own"
  on public.flashcards for insert
  with check (user_id = auth.uid());

create policy "flashcards_update_own"
  on public.flashcards for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "flashcards_delete_own"
  on public.flashcards for delete
  using (user_id = auth.uid());

-- GENERATIONS: owner CRUD (agregaty metryk)
alter table public.generations enable row level security;

create policy "generations_select_own"
  on public.generations for select
  using (user_id = auth.uid());

create policy "generations_insert_own"
  on public.generations for insert
  with check (user_id = auth.uid());

create policy "generations_update_own"
  on public.generations for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "generations_delete_own"
  on public.generations for delete
  using (user_id = auth.uid());

-- GENERATION_ERROR_LOGS: owner select/insert
alter table public.generation_error_logs enable row level security;

create policy "generation_error_logs_select_own"
  on public.generation_error_logs for select
  using (user_id = auth.uid());

create policy "generation_error_logs_insert_own"
  on public.generation_error_logs for insert
  with check (user_id = auth.uid());
```

## 5. Dodatkowe uwagi i decyzje projektowe

- `source` jest `varchar + CHECK` (zamiast ENUM) dla prostszych migracji: `ai-full`, `ai-edited`, `manual`.
- Mechanizm powtórek (SM-2) jest poza zakresem core MVP; pola `due_at` i `sm2_state` zostaną dodane w kolejnej iteracji.
- Metryki i audyt generacji trzymane agregacyjnie w `generations` (jak w schemacie porównawczym); brak tabeli zdarzeń.
- `generation_id` w `flashcards` zachowuje relację do źródłowej generacji (jak w schemacie porównawczym).
- Hard delete: brak `deleted_at`; usuwanie fizyczne.
- `updated_at`: rekomendowany trigger aktualizujący pole przy `UPDATE` (np. `set updated_at = now()`).
- Wymagane funkcje/extension: `gen_random_uuid()` (zwykle `pgcrypto` w Supabase).
