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
| `model` | `varchar(100)` | NOT NULL | Id/model z Google Gemini |
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

## 4. Zasady dostępu (RLS)

Decyzja: **RLS nie będzie włączane na żadnej z tabel**. Dostęp aplikacji będzie kontrolowany wyłącznie na warstwie backendu (service role / serwerowe API), więc w migracjach pomijamy `alter table ... enable row level security` oraz polityki.

## 5. Dodatkowe uwagi i decyzje projektowe

- `source` jest `varchar + CHECK` (zamiast ENUM) dla prostszych migracji: `ai-full`, `ai-edited`, `manual`.
- Mechanizm powtórek (SM-2) jest poza zakresem core MVP; pola `due_at` i `sm2_state` zostaną dodane w kolejnej iteracji.
- Metryki i audyt generacji trzymane agregacyjnie w `generations` (jak w schemacie porównawczym); brak tabeli zdarzeń.
- `generation_id` w `flashcards` zachowuje relację do źródłowej generacji (jak w schemacie porównawczym).
- Hard delete: brak `deleted_at`; usuwanie fizyczne.
- `updated_at`: rekomendowany trigger aktualizujący pole przy `UPDATE` (np. `set updated_at = now()`).
- Wymagane funkcje/extension: `gen_random_uuid()` (zwykle `pgcrypto` w Supabase).
