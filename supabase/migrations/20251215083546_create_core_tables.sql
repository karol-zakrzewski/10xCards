-- migration: create core tables for 10xcards mvp
-- created_at (utc): 2025-12-15 08:35:46
-- purpose:
--   - create the core mvp tables: generations, flashcards, generation_error_logs
--   - add basic constraints and indexes for performance and data integrity
--   - enable row level security and define explicit policies for anon and authenticated roles
-- special considerations:
--   - uses gen_random_uuid() for uuid primary keys (pgcrypto extension)
--   - repetition scheduling (due_at / sm2_state) is intentionally deferred to a later stage
--   - updated_at is maintained via trigger on update for tables that track it

begin;

-- ---------------------------------------------------------------------------
-- extensions / prerequisites
-- ---------------------------------------------------------------------------

-- supabase projects typically have the `extensions` schema; create it defensively for local setups.
create schema if not exists extensions;

-- required for gen_random_uuid()
create extension if not exists "pgcrypto" with schema extensions;

-- ---------------------------------------------------------------------------
-- utility: updated_at trigger function
-- ---------------------------------------------------------------------------

-- updates the `updated_at` column on every row update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- table: public.generations
-- ---------------------------------------------------------------------------

-- stores aggregated metadata for a single ai generation session (audit + metrics).
create table if not exists public.generations (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  model varchar(100) not null,
  generated_count integer not null,
  accepted_unedited_count integer null,
  accepted_edited_count integer null,
  source_text_hash varchar(128) not null,
  source_text_length integer not null check (source_text_length between 1000 and 10000),
  generation_duration integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- keep updated_at current on updates
-- note: we drop the trigger first to keep this migration re-runnable in local development
-- (e.g. `supabase db reset`). this is safe because the trigger is recreated immediately below.
drop trigger if exists generations_set_updated_at on public.generations;
create trigger generations_set_updated_at
before update on public.generations
for each row execute function public.set_updated_at();

-- performance: list generations per user
create index if not exists generations_user_created_idx
  on public.generations (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- table: public.flashcards
-- ---------------------------------------------------------------------------

-- stores saved flashcards (accepted from ai or created manually).
create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  front varchar(200) not null check (length(trim(front)) > 0),
  back varchar(500) not null check (length(trim(back)) > 0),
  source varchar(20) not null check (source in ('ai-full', 'ai-edited', 'manual')),
  generation_id bigint null references public.generations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- keep updated_at current on updates
-- note: we drop the trigger first to keep this migration re-runnable in local development
-- (e.g. `supabase db reset`). this is safe because the trigger is recreated immediately below.
drop trigger if exists flashcards_set_updated_at on public.flashcards;
create trigger flashcards_set_updated_at
before update on public.flashcards
for each row execute function public.set_updated_at();

-- performance: list "my flashcards" per user
create index if not exists flashcards_user_created_idx
  on public.flashcards (user_id, created_at desc);

-- performance: join / filter by generation
create index if not exists flashcards_generation_idx
  on public.flashcards (generation_id);

-- ---------------------------------------------------------------------------
-- table: public.generation_error_logs
-- ---------------------------------------------------------------------------

-- stores failed generation attempts (error audit for troubleshooting and metrics).
create table if not exists public.generation_error_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  model varchar(100) not null,
  source_text_hash varchar(128) not null,
  source_text_length integer not null check (source_text_length between 1000 and 10000),
  error_code varchar(100) not null,
  error_message text not null,
  created_at timestamptz not null default now()
);

-- performance: list error logs per user
create index if not exists generation_error_logs_user_created_idx
  on public.generation_error_logs (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- row level security (rls) and policies
-- ---------------------------------------------------------------------------

-- all tables in public must have rls enabled; access is limited to row owners.
alter table public.flashcards enable row level security;
alter table public.generations enable row level security;
alter table public.generation_error_logs enable row level security;

-- flashcards: owner crud
-- anon: deny all (explicit)
-- note: we drop policies first to keep this migration idempotent when re-applied locally.
-- this is safe because each policy is recreated immediately after the corresponding drop.
drop policy if exists flashcards_select_anon on public.flashcards;
create policy flashcards_select_anon
  on public.flashcards for select to anon
  using (false);

drop policy if exists flashcards_insert_anon on public.flashcards;
create policy flashcards_insert_anon
  on public.flashcards for insert to anon
  with check (false);

drop policy if exists flashcards_update_anon on public.flashcards;
create policy flashcards_update_anon
  on public.flashcards for update to anon
  using (false)
  with check (false);

drop policy if exists flashcards_delete_anon on public.flashcards;
create policy flashcards_delete_anon
  on public.flashcards for delete to anon
  using (false);

-- authenticated: allow owner access
-- note: we drop policies first to keep this migration idempotent when re-applied locally.
-- this is safe because each policy is recreated immediately after the corresponding drop.
drop policy if exists flashcards_select_authenticated on public.flashcards;
create policy flashcards_select_authenticated
  on public.flashcards for select to authenticated
  using (user_id = auth.uid());

drop policy if exists flashcards_insert_authenticated on public.flashcards;
create policy flashcards_insert_authenticated
  on public.flashcards for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists flashcards_update_authenticated on public.flashcards;
create policy flashcards_update_authenticated
  on public.flashcards for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists flashcards_delete_authenticated on public.flashcards;
create policy flashcards_delete_authenticated
  on public.flashcards for delete to authenticated
  using (user_id = auth.uid());

-- generations: owner crud (aggregated metrics)
-- anon: deny all (explicit)
-- note: we drop policies first to keep this migration idempotent when re-applied locally.
-- this is safe because each policy is recreated immediately after the corresponding drop.
drop policy if exists generations_select_anon on public.generations;
create policy generations_select_anon
  on public.generations for select to anon
  using (false);

drop policy if exists generations_insert_anon on public.generations;
create policy generations_insert_anon
  on public.generations for insert to anon
  with check (false);

drop policy if exists generations_update_anon on public.generations;
create policy generations_update_anon
  on public.generations for update to anon
  using (false)
  with check (false);

drop policy if exists generations_delete_anon on public.generations;
create policy generations_delete_anon
  on public.generations for delete to anon
  using (false);

-- authenticated: allow owner access
-- note: we drop policies first to keep this migration idempotent when re-applied locally.
-- this is safe because each policy is recreated immediately after the corresponding drop.
drop policy if exists generations_select_authenticated on public.generations;
create policy generations_select_authenticated
  on public.generations for select to authenticated
  using (user_id = auth.uid());

drop policy if exists generations_insert_authenticated on public.generations;
create policy generations_insert_authenticated
  on public.generations for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists generations_update_authenticated on public.generations;
create policy generations_update_authenticated
  on public.generations for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists generations_delete_authenticated on public.generations;
create policy generations_delete_authenticated
  on public.generations for delete to authenticated
  using (user_id = auth.uid());

-- generation_error_logs: owner select/insert (no update/delete)
-- anon: deny all (explicit)
-- note: we drop policies first to keep this migration idempotent when re-applied locally.
-- this is safe because each policy is recreated immediately after the corresponding drop.
drop policy if exists generation_error_logs_select_anon on public.generation_error_logs;
create policy generation_error_logs_select_anon
  on public.generation_error_logs for select to anon
  using (false);

drop policy if exists generation_error_logs_insert_anon on public.generation_error_logs;
create policy generation_error_logs_insert_anon
  on public.generation_error_logs for insert to anon
  with check (false);

drop policy if exists generation_error_logs_update_anon on public.generation_error_logs;
create policy generation_error_logs_update_anon
  on public.generation_error_logs for update to anon
  using (false)
  with check (false);

drop policy if exists generation_error_logs_delete_anon on public.generation_error_logs;
create policy generation_error_logs_delete_anon
  on public.generation_error_logs for delete to anon
  using (false);

-- authenticated: allow owner select/insert; explicitly deny update/delete
-- note: we drop policies first to keep this migration idempotent when re-applied locally.
-- this is safe because each policy is recreated immediately after the corresponding drop.
drop policy if exists generation_error_logs_select_authenticated on public.generation_error_logs;
create policy generation_error_logs_select_authenticated
  on public.generation_error_logs for select to authenticated
  using (user_id = auth.uid());

drop policy if exists generation_error_logs_insert_authenticated on public.generation_error_logs;
create policy generation_error_logs_insert_authenticated
  on public.generation_error_logs for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists generation_error_logs_update_authenticated on public.generation_error_logs;
create policy generation_error_logs_update_authenticated
  on public.generation_error_logs for update to authenticated
  using (false)
  with check (false);

drop policy if exists generation_error_logs_delete_authenticated on public.generation_error_logs;
create policy generation_error_logs_delete_authenticated
  on public.generation_error_logs for delete to authenticated
  using (false);

-- ---------------------------------------------------------------------------
-- grants
-- ---------------------------------------------------------------------------

-- the api roles need table privileges; rls remains the primary gate.
grant select, insert, update, delete on table public.flashcards to anon, authenticated;
grant select, insert, update, delete on table public.generations to anon, authenticated;
grant select, insert on table public.generation_error_logs to anon, authenticated;

-- identity sequences need privileges for inserts that rely on defaults.
grant usage, select on sequence public.generations_id_seq to anon, authenticated;
grant usage, select on sequence public.generation_error_logs_id_seq to anon, authenticated;

commit;
