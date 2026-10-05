# Proposal

## Why

The phone and the browser each keep their own local database, so the app can't be used for its intended split: tracking on the phone, planning and reviewing on the PC (`docs/SPEC.md` §1, §2). Milestone 5 (SPEC §9) connects them through Supabase: an account, a server copy of the data, and a sync that keeps the app local-first (SPEC §7).

## What Changes

- **Connection:** the app reads the Supabase URL and publishable key from `supabase.json` at build time (`--dart-define-from-file`, the file is git-ignored, `supabase.example.json` is the template). Without them, sync is disabled and the app works as before.
- **Account** (email and password):
  - signing in and out happens in a new "Account & sync" section of Settings
  - the session is kept across restarts and reloads
  - there is no sign-up in the app; the single user is created in the Supabase dashboard, with public sign-ups switched off.
- **Server schema:** a versioned SQL file in the repo, pasted once into the Supabase SQL Editor. It creates:
  - one table per synced entity (areas, objectives, key results, projects, tasks, habits, habit checks, log entries, weekly reviews, review KR snapshots), mirroring the local columns plus `user_id` and a server-set `server_updated_at`
  - row-level security so each user only sees their own rows
  - a trigger that ignores updates older than the stored row (last-write-wins).
- **Sync** (SPEC §7):
  - **Push:** local rows changed since the last push are upserted.
  - **Pull:** rows changed on the server since the last pull (by `server_updated_at`) are applied locally if newer than the local copy.
  - Deletes travel as soft deletes. Local settings are never synced.
  - **When:** on start, on resume, a few seconds after local changes, by pull-to-refresh on Home, Plan and Review, and with a "Sync now" button.
  - Failures are silent, retried later, and shown in Settings with the time of the last successful sync.
- **First sign-in on a device:** if the account has no data yet, the device uploads all its data. If it already has data, the user confirms that the device's local data is replaced by the account's.
- **Duplicate-safe records:** new habit checks and weekly reviews get IDs derived from their natural key (habit + date, week start). The same check made offline on two devices then becomes one record.

## Capabilities

### New Capabilities
- `account`: Supabase connection setup, sign-in and sign-out with email and password, session persistence, and the not-configured state.
- `sync`: The server schema and access rules, push/pull with last-write-wins, the first-sign-in rules, sync triggers, status and failure handling, and what isn't synced.

### Modified Capabilities
- `local-database`: Record identity: habit checks and weekly reviews get IDs derived from their natural key instead of random UUID v4.
- `settings`: The Settings screen gains the "Account & sync" section.

## Impact

- **Dependencies:** `supabase_flutter` (auth, session storage, PostgREST client). It brings `shared_preferences` and `app_links` with it.
- **New files:**
  - `supabase/schema.sql` (server schema, RLS, triggers)
  - `supabase.example.json`
  - `lib/core/sync/` (Supabase client setup, the sync engine with per-table column mapping)
  - `lib/features/account/` (state and UI).
- **Changed code:**
  - `main.dart` (Supabase init when configured)
  - the Settings screen
  - `HabitCheckRepository` and `ReviewRepository` (deterministic IDs)
  - Home, Plan and Review (pull-to-refresh)
  - `README.md` (setup steps).
- **Local data:** no schema change (still version 3). Sync state (last push and pull, the signed-in user) is stored in the existing local settings table.
- **Supabase project (manual, documented in the tasks):**
  - run `supabase/schema.sql`
  - create the user
  - disable sign-ups.
- **docs/SPEC.md** updates at archive time:
  - §7 (pull by `server_updated_at` with overlap, the server-side LWW trigger, first-sign-in rule, deterministic IDs for natural keys, no in-app sign-up)
  - §4 Settings (sync credentials are kept by the Supabase session, not in the settings table).

## Out of scope

- **Real-time updates** (Supabase Realtime). Changes from the other device arrive at the next sync.
- **Sign-up, password reset and email changes in the app.** These are done in the Supabase dashboard.
- **Multiple accounts on one device**, and switching accounts without replacing local data.
- **Conflict resolution beyond last-write-wins per row.** There is no field-level merge.
- **Syncing local settings and reminder schedules.** Each device keeps its own.
- **Native desktop builds** (milestone 6).
