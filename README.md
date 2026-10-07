# orbit

Personal, local-first app for objectives, key results, projects, tasks, habits, work logs and a weekly review. Flutter, targeting Android and the web.

- Product spec: `docs/SPEC.md`
- Implemented behavior: `openspec/specs/`
- Work in progress: `openspec/changes/`

## Commands

| What | Command |
|---|---|
| Run on phone | `flutter run` |
| Run in the browser | `flutter run -d chrome` |
| Code generation (drift, riverpod) | `dart run build_runner build --delete-conflicting-outputs` |
| Analyze | `flutter analyze` |
| Test | `flutter test` |
| Update web database assets | `tool/fetch_web_assets.sh` |

Run code generation after changing drift tables or `@riverpod` providers. Generated files (`*.g.dart`, `*.drift.dart`) are committed.

## Database

Data is stored locally with [drift](https://drift.simonbinder.eu/), opened through `drift_flutter`:

- **Android:** native SQLite.
- **Web:** SQLite compiled to WebAssembly, running in a web worker and persisted in browser storage (OPFS or IndexedDB). If the browser offers no persistent storage, the app falls back to an in-memory database and shows a warning banner.

### Web assets

The browser build needs two files in `web/`:

- `web/sqlite3.wasm`: SQLite compiled to WebAssembly, from the [sqlite3.dart releases](https://github.com/simolus3/sqlite3.dart/releases) (`sqlite3-<version>`).
- `web/drift_worker.js`: drift's web worker, from the [drift releases](https://github.com/simolus3/drift/releases) (`drift-<version>`).

Both must match the `sqlite3` and `drift` versions in `pubspec.lock`, and both are committed so a fresh checkout runs in Chrome straight away.

**After upgrading `drift` or `sqlite3`** (any change to their versions in `pubspec.lock`), run:

```bash
tool/fetch_web_assets.sh
```

It reads both versions from `pubspec.lock`, downloads the matching files into `web/` and prints the versions it used. Commit the updated files together with the `pubspec.lock` change.

## Sync (Supabase)

The phone and the browser sync through a [Supabase](https://supabase.com) project. Without the steps below the app works fully offline; sync is simply not offered.

### 1. Server schema

In the Supabase dashboard, open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and run it. It creates one table per synced entity with row-level security (each user only sees their own rows) and a trigger that keeps the newest version of every row. Running it again is safe.

Every change to the local drift tables (`lib/core/db/tables.dart`) must update `supabase/schema.sql` in the same change; `test/core/sync/schema_sql_test.dart` fails otherwise.

**After an update that changes `supabase/schema.sql`** (for example schema version 4: task assignment and work logged on tasks), run the file again in the SQL Editor before syncing with the new app version. New columns are added with `add column if not exists`, so existing data stays. Until then, sync fails quietly and is retried; nothing local is lost.

### 2. Your user

- **Authentication → Users → Add user → Create new user:** your email and password, with **Auto Confirm User** on.
- **Authentication → Sign In / Providers:** turn off **Allow new users to sign up**. The app has no sign-up; this keeps anyone else from creating an account with the app's public key.

### 3. Connection values

Copy the template and fill in the two values:

```bash
cp supabase.example.json supabase.json
```

- `SUPABASE_URL`: **Project Settings → Data API → Project URL** (`https://<ref>.supabase.co`), without `/rest/v1`.
- `SUPABASE_ANON_KEY`: **Project Settings → API Keys**, the **publishable** key (`sb_publishable_…`), or the legacy **anon** key (`eyJ…`).

Never use the **secret** key (`sb_secret_…`) or the legacy **service_role** key: they bypass row-level security. `supabase.json` is git-ignored.

### 4. Run with sync

Pass the file to every run or build:

```bash
flutter run --dart-define-from-file=supabase.json
flutter run -d chrome --dart-define-from-file=supabase.json
flutter build apk --dart-define-from-file=supabase.json
```

Then sign in under **Plan → ⋮ → Settings → Account & sync**. Sign in on the device with your real data first: an empty account receives that device's data. Signing in on another device afterwards replaces that device's local data with the account's (after a confirmation).
