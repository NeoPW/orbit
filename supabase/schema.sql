-- Orbit: server schema for sync (milestone 5).
--
-- Run once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
-- Safe to run again. Every table mirrors the local drift table of the same
-- name (lib/core/db/tables.dart); change both together.
--
-- Per table:
--   * user_id: the owner, set from the signed-in user.
--   * server_updated_at: set by the server on every accepted write; the app
--     pulls changes by this column.
--   * Row-level security: a user can only see and write their own rows.
--   * sync_guard trigger: an update older than the stored row (by the
--     client's updated_at) is ignored, so the latest edit wins.
-- The local settings table is device-only and has no server table.

create or replace function public.sync_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.updated_at <= old.updated_at then
    return null; -- stale write: keep the newer row
  end if;
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  new.server_updated_at := clock_timestamp();
  return new;
end;
$$;

-- areas
create table if not exists public.areas (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  name text not null,
  color text not null,
  sort_order integer not null,
  server_updated_at timestamptz not null default clock_timestamp()
);
create index if not exists areas_user_server_updated
  on public.areas (user_id, server_updated_at);
alter table public.areas enable row level security;
drop policy if exists "Owner only" on public.areas;
create policy "Owner only" on public.areas
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke all on public.areas from anon;
grant select, insert, update on public.areas to authenticated;
drop trigger if exists areas_sync_guard on public.areas;
create trigger areas_sync_guard
  before insert or update on public.areas
  for each row execute function public.sync_guard();

-- objectives
create table if not exists public.objectives (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  title text not null,
  description text not null default '',
  start_date date not null,
  end_date date not null,
  status text not null,
  sort_order integer not null,
  server_updated_at timestamptz not null default clock_timestamp()
);
create index if not exists objectives_user_server_updated
  on public.objectives (user_id, server_updated_at);
alter table public.objectives enable row level security;
drop policy if exists "Owner only" on public.objectives;
create policy "Owner only" on public.objectives
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke all on public.objectives from anon;
grant select, insert, update on public.objectives to authenticated;
drop trigger if exists objectives_sync_guard on public.objectives;
create trigger objectives_sync_guard
  before insert or update on public.objectives
  for each row execute function public.sync_guard();

-- key_results
create table if not exists public.key_results (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  objective_id uuid not null,
  title text not null,
  description text not null default '',
  measure_type text not null,
  start_value double precision,
  target_value double precision,
  current_value double precision,
  unit text,
  step double precision not null default 1,
  habit_id uuid,
  deadline date,
  sort_order integer not null,
  server_updated_at timestamptz not null default clock_timestamp()
);
-- Added in schema version 5 (step of the KR's − / + buttons).
alter table public.key_results add column if not exists step double precision not null default 1;
create index if not exists key_results_user_server_updated
  on public.key_results (user_id, server_updated_at);
alter table public.key_results enable row level security;
drop policy if exists "Owner only" on public.key_results;
create policy "Owner only" on public.key_results
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke all on public.key_results from anon;
grant select, insert, update on public.key_results to authenticated;
drop trigger if exists key_results_sync_guard on public.key_results;
create trigger key_results_sync_guard
  before insert or update on public.key_results
  for each row execute function public.sync_guard();

-- projects
create table if not exists public.projects (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  title text not null,
  description text not null default '',
  area_id uuid,
  key_result_id uuid,
  status text not null,
  importance integer not null check (importance between 1 and 5),
  deadline date,
  next_step_task_id uuid,
  server_updated_at timestamptz not null default clock_timestamp()
);
create index if not exists projects_user_server_updated
  on public.projects (user_id, server_updated_at);
alter table public.projects enable row level security;
drop policy if exists "Owner only" on public.projects;
create policy "Owner only" on public.projects
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke all on public.projects from anon;
grant select, insert, update on public.projects to authenticated;
drop trigger if exists projects_sync_guard on public.projects;
create trigger projects_sync_guard
  before insert or update on public.projects
  for each row execute function public.sync_guard();

-- tasks
create table if not exists public.tasks (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  project_id uuid,
  key_result_id uuid,
  objective_id uuid,
  title text not null,
  notes text not null default '',
  due_date date,
  status text not null,
  completed_at timestamptz,
  server_updated_at timestamptz not null default clock_timestamp()
);
-- Added in schema version 4 (tasks assigned to a KR or objective).
alter table public.tasks add column if not exists key_result_id uuid;
alter table public.tasks add column if not exists objective_id uuid;
create index if not exists tasks_user_server_updated
  on public.tasks (user_id, server_updated_at);
alter table public.tasks enable row level security;
drop policy if exists "Owner only" on public.tasks;
create policy "Owner only" on public.tasks
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke all on public.tasks from anon;
grant select, insert, update on public.tasks to authenticated;
drop trigger if exists tasks_sync_guard on public.tasks;
create trigger tasks_sync_guard
  before insert or update on public.tasks
  for each row execute function public.sync_guard();

-- habits
create table if not exists public.habits (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  title text not null,
  project_id uuid,
  key_result_id uuid,
  schedule_type text not null,
  weekdays text,
  times_per_week integer,
  reminder_time text,
  active boolean not null default true,
  server_updated_at timestamptz not null default clock_timestamp()
);
create index if not exists habits_user_server_updated
  on public.habits (user_id, server_updated_at);
alter table public.habits enable row level security;
drop policy if exists "Owner only" on public.habits;
create policy "Owner only" on public.habits
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke all on public.habits from anon;
grant select, insert, update on public.habits to authenticated;
drop trigger if exists habits_sync_guard on public.habits;
create trigger habits_sync_guard
  before insert or update on public.habits
  for each row execute function public.sync_guard();

-- habit_checks
create table if not exists public.habit_checks (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  habit_id uuid not null,
  date date not null,
  log_entry_id uuid,
  server_updated_at timestamptz not null default clock_timestamp()
);
create index if not exists habit_checks_user_server_updated
  on public.habit_checks (user_id, server_updated_at);
alter table public.habit_checks enable row level security;
drop policy if exists "Owner only" on public.habit_checks;
create policy "Owner only" on public.habit_checks
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke all on public.habit_checks from anon;
grant select, insert, update on public.habit_checks to authenticated;
drop trigger if exists habit_checks_sync_guard on public.habit_checks;
create trigger habit_checks_sync_guard
  before insert or update on public.habit_checks
  for each row execute function public.sync_guard();

-- log_entries
create table if not exists public.log_entries (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  project_id uuid,
  key_result_id uuid,
  task_id uuid,
  occurred_at timestamptz not null,
  duration_minutes integer,
  note text not null default '',
  source text not null,
  server_updated_at timestamptz not null default clock_timestamp()
);
-- Added in schema version 4 (work logged on a task).
alter table public.log_entries add column if not exists task_id uuid;
create index if not exists log_entries_user_server_updated
  on public.log_entries (user_id, server_updated_at);
alter table public.log_entries enable row level security;
drop policy if exists "Owner only" on public.log_entries;
create policy "Owner only" on public.log_entries
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke all on public.log_entries from anon;
grant select, insert, update on public.log_entries to authenticated;
drop trigger if exists log_entries_sync_guard on public.log_entries;
create trigger log_entries_sync_guard
  before insert or update on public.log_entries
  for each row execute function public.sync_guard();

-- weekly_reviews
create table if not exists public.weekly_reviews (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  week_start date not null,
  score integer check (score between 1 and 10),
  reflection text not null default '',
  plan_next_week text not null default '',
  completed_at timestamptz,
  server_updated_at timestamptz not null default clock_timestamp()
);
create index if not exists weekly_reviews_user_server_updated
  on public.weekly_reviews (user_id, server_updated_at);
alter table public.weekly_reviews enable row level security;
drop policy if exists "Owner only" on public.weekly_reviews;
create policy "Owner only" on public.weekly_reviews
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke all on public.weekly_reviews from anon;
grant select, insert, update on public.weekly_reviews to authenticated;
drop trigger if exists weekly_reviews_sync_guard on public.weekly_reviews;
create trigger weekly_reviews_sync_guard
  before insert or update on public.weekly_reviews
  for each row execute function public.sync_guard();

-- review_kr_snapshots
create table if not exists public.review_kr_snapshots (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  weekly_review_id uuid not null,
  key_result_id uuid not null,
  progress double precision not null,
  server_updated_at timestamptz not null default clock_timestamp()
);
create index if not exists review_kr_snapshots_user_server_updated
  on public.review_kr_snapshots (user_id, server_updated_at);
alter table public.review_kr_snapshots enable row level security;
drop policy if exists "Owner only" on public.review_kr_snapshots;
create policy "Owner only" on public.review_kr_snapshots
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke all on public.review_kr_snapshots from anon;
grant select, insert, update on public.review_kr_snapshots to authenticated;
drop trigger if exists review_kr_snapshots_sync_guard on public.review_kr_snapshots;
create trigger review_kr_snapshots_sync_guard
  before insert or update on public.review_kr_snapshots
  for each row execute function public.sync_guard();

-- timers (added in schema version 5; at most one row, with a fixed ID)
create table if not exists public.timers (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  project_id uuid,
  task_id uuid,
  started_at timestamptz not null,
  server_updated_at timestamptz not null default clock_timestamp()
);
create index if not exists timers_user_server_updated
  on public.timers (user_id, server_updated_at);
alter table public.timers enable row level security;
drop policy if exists "Owner only" on public.timers;
create policy "Owner only" on public.timers
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke all on public.timers from anon;
grant select, insert, update on public.timers to authenticated;
drop trigger if exists timers_sync_guard on public.timers;
create trigger timers_sync_guard
  before insert or update on public.timers
  for each row execute function public.sync_guard();
