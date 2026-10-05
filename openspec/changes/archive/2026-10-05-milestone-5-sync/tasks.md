# Tasks

## 1. Configuration and dependency

- [x] 1.1 Add `supabase_flutter` with `flutter pub add`; verify `flutter pub get` succeeds and `flutter analyze` reports no issues
- [x] 1.2 Recreate `supabase.example.json` (placeholder URL and publishable key), keep `/supabase.json` in `.gitignore`, add `lib/core/sync/supabase_config.dart` reading both values with `String.fromEnvironment` and a `syncConfiguredProvider`; verify `git check-ignore supabase.json` succeeds, the example file is tracked, and a unit test shows "not configured" for empty values
- [x] 1.3 Initialize Supabase in `main()` only when configured; verify the app tests still pass without values and `flutter build web` succeeds with and without `--dart-define-from-file=supabase.json`

## 2. Server schema

- [x] 2.1 Write `supabase/schema.sql`: ten tables mirroring the local columns with Postgres types, `user_id` default `auth.uid()`, `server_updated_at`, index on `(user_id, server_updated_at)`, RLS with an owner-only policy, and the `sync_guard()` trigger (skip older updates, set `server_updated_at`); verify every local column of the ten tables appears in the file by a unit test that compares drift's column names with the SQL
- [x] 2.2 Document the Supabase setup in `README.md` (run the SQL file, add the user with auto-confirm, disable sign-ups, `supabase.json`, run commands with `--dart-define-from-file`, publishable vs. secret key); verify the documented file names and commands match the repo

## 3. Deterministic IDs

- [x] 3.1 Add the namespace constant and `naturalKeyId(String key)` (UUID v5) to `lib/core/db/ids.dart`; use it for new habit checks (`habit_check:<habitId>:<date>`) and weekly reviews (`weekly_review:<weekStart>`); verify unit tests for stable and distinct IDs and the existing habit-check and review repository tests still pass

## 4. Sync engine

- [x] 4.1 Implement `SyncTable` descriptors from drift metadata for the ten tables and the row ⇄ JSON conversion (timestamps normalized to UTC ISO text, booleans, nulls); verify unit tests for each column type including a `+00:00` timestamp from the server
- [x] 4.2 Define `RemoteStore` and implement `FakeRemoteStore` (in-memory tables, server timestamps, the LWW guard); verify unit tests that an older update is ignored and `changedSince` returns rows by server time
- [x] 4.3 Implement push (rows with `updated_at` after the watermark, batches of 500, watermark advanced only on full success) and the sync state keys in the settings table; verify engine tests that a new and an edited row are uploaded, a soft delete is uploaded, and a failing upsert keeps the watermark
- [x] 4.4 Implement pull (paged by `server_updated_at` with a 2-minute overlap, apply when missing or newer, keep remote `updated_at`, natural-key duplicates for habit checks and weekly reviews); verify two-device engine tests: an edit on A appears on B, a delete propagates, LWW holds in both sync orders, the same habit checked on both devices ends as one row, a legacy duplicate is resolved, and settings are not synced
- [x] 4.5 Implement `SyncService.sync()` (push then pull, single flight, store last success time or error, never throw); verify tests for single flight, a stored error on failure, and last success time on success
- [x] 4.6 Implement `SupabaseRemoteStore` (PostgREST upsert with `onConflict: id`, paged select by `server_updated_at`, `hasAnyData`); verify `flutter analyze` passes and a compile-only test constructs it

## 5. Account and first sign-in

- [x] 5.1 Implement `AccountController` (session state, sign in with password, first-sign-in rule: upload into an empty account, otherwise confirm and replace local data, cancel signs out; sign out keeps data; `sync_user_id`) behind an auth interface with a fake for tests; verify tests for the three first-sign-in cases, a returning user, a wrong password and sign-out keeping local data
- [x] 5.2 Build the "Account & sync" section in Settings (not configured, signed out with form and error, signed in with email, last synced / failed, Sync now, Sign out) and the replace confirmation dialog; verify widget tests for all three states, the wrong-password error and the dialog's Replace and Cancel

## 6. Triggers

- [x] 6.1 Implement `SyncScheduler` (sync on sign-in and start, on resume, 5 s after writes to synced tables ignoring the sync's own writes, `syncNow()`), active only when configured and signed in; verify provider tests with a fake service: a write triggers one debounced sync, a sync's own pull writes trigger none, and nothing runs when signed out
- [x] 6.2 Add pull-to-refresh to Home, the Plan tabs and Review calling `syncNow()` when signed in; verify a widget test that pulling down on Home calls the scheduler and the indicator ends

## 7. Integration and verification

- [x] 7.1 Run `dart run build_runner build --delete-conflicting-outputs`, `flutter analyze`, `flutter test`, `flutter build web` and `flutter build apk --debug`; verify analyze reports no issues, all tests pass and both builds succeed
- [x] 7.2 In the Supabase dashboard, run `supabase/schema.sql`, create the user and disable sign-ups; verify the ten tables exist with RLS enabled and the user is listed
- [x] 7.3 On the phone, build with `--dart-define-from-file=supabase.json` and sign in; verify the account was empty, the phone's data appears in the Supabase tables, and Settings shows "Last synced"
- [x] 7.4 In Chrome, sign in and confirm the replacement; verify the browser shows the phone's data, then edit on each side and check the change arrives on the other after a sync (also a delete and a habit check), and a reload keeps the session
- [x] 7.5 Verify offline behavior on the phone (airplane mode: edit, see "Last sync failed", reconnect, change uploads) and that a sign-up attempt with the publishable key is rejected
- [x] 7.6 Confirm `design.md` "Follow-ups for archiving" lists the `docs/SPEC.md` (§7, §4) and `openspec/config.yaml` updates; verify the list is present before archiving
