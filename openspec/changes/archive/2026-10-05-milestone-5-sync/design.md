# Design

## Context

- **Local schema:** version 3, with ten synced tables. Every table has the shared columns `id` (UUID), `created_at`, `updated_at`, `deleted_at`, and every repository write sets `updated_at` and soft-deletes. That was decided in milestone 1 so this milestone needs no local migration.
- **Storage format:**
  - timestamps are ISO-8601 UTC text (`2026-10-05T12:00:00.000Z`)
  - calendar dates are `YYYY-MM-DD`
  - booleans are SQLite integers
  - weekdays are text such as `1,3,5`
  - there are no SQL foreign keys.
- **Unique natural keys:** `habit_checks(habit_id, date)` and `weekly_reviews(week_start)` are unique locally, including soft-deleted rows.
- **Settings:** local-only key-value rows, never synced.
- **App start:** `main()` is async already (notification setup) and builds the app around a `ProviderContainer`.
- **Supabase values:** they live in the git-ignored `supabase.json` in the project root (the user has created it). The template `supabase.example.json` has to be recreated.

See `proposal.md` for motivation and `specs/` for the required behavior.

## Goals / Non-Goals

**Goals:**
- One generic sync engine that works for all ten tables from drift's table metadata, with no hand-written per-table mapping.
- Correct last-write-wins even when the two devices sync in any order or are offline for a while.
- A sync that can be tested without a network: the server side sits behind an interface with an in-memory fake.

**Non-Goals:**
- No realtime, no field-level merge, no multi-account support (proposal, Out of scope).
- No local schema migration; sync state uses the settings table.

## Decisions

### 1. Package and configuration

| Package | Kind | Justification |
|---|---|---|
| `supabase_flutter` (2.18.x) | runtime | Supabase auth with persisted session (Android and web) and the PostgREST client for upserts and selects. Named in the project stack. |

**Configuration.** `String.fromEnvironment('SUPABASE_URL')` and `'SUPABASE_ANON_KEY'` are read in `lib/core/sync/supabase_config.dart` and passed with `flutter run --dart-define-from-file=supabase.json`.
- `supabase.json` is git-ignored. `supabase.example.json` (placeholders) is committed and `README.md` explains both.
- Only the publishable/anon key is used. The secret/service-role key must never appear in the app; RLS is what protects the data.
- When either value is empty, `Supabase.initialize` is skipped, `syncConfiguredProvider` is false, and the app behaves as in milestone 4.
- *Added during implementation:* `SupabaseConfig.url` cuts a pasted API endpoint (`…/rest/v1/`, `…/auth/v1`, trailing slashes) back to the project URL. The first real sign-in failed with "Invalid path specified in request URL" because the REST endpoint had been copied as the project URL.
- *Added during implementation:* `android.permission.INTERNET` in the main `AndroidManifest.xml`. Flutter only declares it for debug and profile builds, so release builds would otherwise have no network.

### 2. Server schema (`supabase/schema.sql`)

One SQL file, idempotent where practical (`create table if not exists`, `drop policy if exists`), run once in the SQL Editor. For each of the ten tables:
- **Columns:** the same names as local, with Postgres types:
  - `id uuid primary key`
  - timestamps `timestamptz`
  - calendar dates `date`
  - booleans `boolean`
  - numbers `integer` / `double precision`
  - enums, weekdays and text as `text`.
- **`user_id uuid not null default auth.uid() references auth.users on delete cascade`**, plus an index on `(user_id, server_updated_at)`.
- **`server_updated_at timestamptz not null default clock_timestamp()`.**
- **Row-level security** enabled, with one policy `for all using (user_id = auth.uid()) with check (user_id = auth.uid())`.
- **A shared trigger function `sync_guard()`, `before insert or update`:**
  - on update, if `new.updated_at <= old.updated_at`, it returns `null`, so a stale write is skipped and last-write-wins is enforced on the server
  - otherwise it sets `new.user_id = auth.uid()` (on insert, if null) and `new.server_updated_at = clock_timestamp()`.
- **No unique constraints on natural keys.** Duplicates are prevented by deterministic IDs (decision 6). Unique constraints would make a push fail outright.
- **No foreign keys between entity tables**, the same as locally, so rows can arrive in any order.

**Dashboard steps** (documented in `README.md`, done by the user):
1. Run the SQL file.
2. Authentication → Users → "Add user" (email and password, auto-confirm).
3. Authentication → Sign In / Providers → turn off "Allow new users to sign up".

### 3. Sync engine (`lib/core/sync/`)

- **`RemoteStore` interface:**
  - `upsert(table, rows)`
  - `changedSince(table, DateTime serverTime, {limit, offset})`
  - `hasAnyData()`
  - `now()`.

  `SupabaseRemoteStore` implements it with PostgREST. `FakeRemoteStore` (tests) keeps tables in memory and applies the same LWW rule and server timestamps.
- **`SyncTable` descriptors**, built from drift's `TableInfo.$columns`, give the column names and `DriftSqlType`s for each synced table. Conversion between a local row and JSON:
  - `dateTime`: local text ⇄ ISO-8601 UTC. Pulled values are normalized with `DateTime.parse(v).toUtc().toIso8601String()`, because Postgres returns `+00:00` and local queries compare text.
  - `bool`: `0/1` ⇄ `false/true`.
  - everything else as is.

  Rows are read and written with drift's raw `customSelect` / `customInsert`, so converters such as `CalendarDate` and enums never run during sync.
- **Push:** for each table, read rows with `updated_at > last_pushed_at` and upsert them in batches of 500 (`onConflict: id`). `last_pushed_at` advances to the time taken before reading, and only when all tables succeed. Pulled rows that come back up are skipped by the server trigger, which is harmless.
- **Pull:** for each table, page through `server_updated_at > last_pulled_at − 2 minutes`, ordered by `server_updated_at`, 1000 per page. The 2-minute overlap catches rows committed late with an earlier timestamp; re-applying is idempotent.

  For each row, inside one local transaction per page:
  - if the local row is missing or older by `updated_at`, write it with `INSERT … ON CONFLICT(id) DO UPDATE`, keeping the remote `updated_at`
  - for `habit_checks` and `weekly_reviews`, a local row with the same natural key but a different ID (legacy random IDs) is hard-deleted first when the remote row is newer, and the remote row is skipped when the local one is newer.

  `last_pulled_at` is the largest `server_updated_at` seen.
- **Sync state:** keys `sync_last_pushed_at`, `sync_last_pulled_at`, `sync_last_success_at`, `sync_last_error` and `sync_user_id` in the existing local settings table (no migration). Settings rows are never part of push or pull.
- **Single flight:** `SyncService.sync()` returns the running future when a sync is in progress.

### 4. First sign-in (`AccountController`)

1. `signInWithPassword`. On error, show it and stay signed out.
2. If `sync_user_id` is already this user, it's a normal sync. Otherwise this device is new to the account:
   - **`remote.hasAnyData()` is false:** set `last_pushed_at` to the epoch (upload everything), then sync.
   - **The account has data:** show a confirmation dialog: "This replaces the data on this device with your account's data." On confirm, hard-delete all rows of the ten synced tables locally in one transaction, keep settings, reset the watermarks to the epoch, and sync. Nothing is pushed, because nothing is left locally. On cancel, sign out.
3. Store `sync_user_id`.

**Signing out** clears the session and `sync_user_id` and keeps local data, as the specs require.

### 5. Triggers

- A keep-alive `SyncScheduler` notifier, active only while configured and signed in, runs a sync:
  - on sign-in and app start (after the session is restored)
  - on `AppLifecycleState.resumed`
  - 5 s after the last local write, by listening to `db.tableUpdates()` filtered to the ten synced tables. A pull's own writes are ignored while a sync runs, to avoid loops.
  - and its `syncNow()` serves pull-to-refresh and the Settings button.
- **Pull-to-refresh:** a `RefreshIndicator` on Home, Plan (both tabs) and Review calls `syncNow()`. It's only enabled when signed in; otherwise the indicator finishes at once.
- **Failures:** caught and stored in `sync_last_error`, never thrown to the UI. The next trigger retries.

### 6. Deterministic IDs for natural keys

- `HabitCheckRepository.check` uses `Uuid().v5(orbitNamespace, 'habit_check:<habitId>:<date>')` for new rows.
- `ReviewRepository._upsert` uses `'weekly_review:<weekStart>'`.

The existing lookup-by-natural-key (revive) logic stays, so existing random-ID rows keep their IDs. The namespace is a fixed UUID constant in `lib/core/db/ids.dart`.

### 7. UI: "Account & sync" in Settings

| State | Shows |
|---|---|
| Not configured | "Sync is not configured in this build." |
| Signed out | Email and password fields, "Sign in", an error line |
| Signed in | Email, "Last synced dd-mm-yyyy HH:mm" (or "Not synced yet"), "Last sync failed" when the last attempt failed, "Sync now", "Sign out" |

The confirmation in decision 4 is an `AlertDialog` with "Replace" and "Cancel".

### 8. Testing approach

- **Unit tests:** the column conversion (dates, timestamps with `+00:00`, booleans, nulls) and the deterministic IDs (same input gives the same ID, different input a different ID).
- **Sync engine tests** with two in-memory databases (two devices) and one `FakeRemoteStore`:
  - push then pull copies rows
  - an edit on device A shows on device B
  - a soft delete propagates
  - concurrent edits follow last-write-wins in either sync order
  - the same habit checked on both devices ends as one row
  - a legacy natural-key duplicate is resolved
  - settings are not synced
  - a failure in the middle of a push keeps the watermark and loses nothing
  - single flight.
- **First sign-in tests:** an empty account uploads; an account with data plus confirm replaces local data; cancel signs out and leaves data unchanged.
- **Widget tests:** the Settings account section in all three states, a wrong-password error, the replace dialog, and pull-to-refresh on Home calling the scheduler (with a fake).
- **SQL file:** reviewed manually and run in the user's project (tasks). An RLS check with a second user is in the manual verification.

## Risks / Trade-offs

- [Device clocks decide last-write-wins] → Accepted for a single user. A skewed clock could let an older edit win. The 2-minute pull overlap doesn't cover this; it's documented in SPEC §7 at archive.
- [The publishable key is visible in the built app] → It's designed to be public. RLS restricts every table to `auth.uid()`, and sign-ups are disabled, so no second account can be created with it.
- [Replacing local data on a second device can't be undone] → An explicit confirmation names what is replaced. The tasks tell the user to sign in on the phone (real data) first.
- [Free Supabase projects pause when inactive] → Sync then fails silently and is retried. Local use is unaffected (SPEC §7 note).
- [A generic engine bypasses drift converters] → Raw rows mirror the stored text, so no converter runs. The conversion tests cover each column type.
- [Supabase rejects a row, e.g. a schema mismatch after a later local migration] → The whole sync is marked failed and nothing is lost. Future migrations must update `supabase/schema.sql` in the same change. This is noted in `README.md` and `openspec/config.yaml` context at archive.

## Migration Plan

1. Run `supabase/schema.sql` in the Supabase SQL Editor, create the user, disable sign-ups.
2. Put the URL and publishable key into `supabase.json` (already done) and build with `--dart-define-from-file=supabase.json`.
3. Sign in on the phone first. The account is empty, so the phone uploads everything.
4. Sign in in the browser and confirm the replacement. The browser now shows the phone's data.
5. **Rollback:** sign out on both devices (local data stays) or build without `supabase.json`. Dropping the server tables doesn't affect local data.

## Follow-ups for archiving

- **`docs/SPEC.md` §7:**
  - pull by the server-set `server_updated_at` with a 2-minute overlap; LWW is enforced by a server trigger
  - the first-sign-in rule (upload into an empty account, otherwise replace local data after confirmation)
  - deterministic IDs for habit checks and weekly reviews
  - no in-app sign-up (the user is created in the dashboard, sign-ups off)
  - device clocks decide LWW.
- **`docs/SPEC.md` §4 Settings:** sync credentials are kept by the Supabase session, not in the settings table; sync state uses settings keys.
- **`openspec/config.yaml` context:** every future local schema change must update `supabase/schema.sql` in the same change.
