# Proposal

## Why

Every feature of the rebuild stores its data locally first (`docs/SPEC.md` §1, §2, §4), and the new skeleton has no database yet. The browser database (SQLite compiled to WebAssembly, kept in the browser's private file storage) is the riskiest part of the new stack, so it is proven now, before any feature depends on it. The schema starts fresh at version 1 with the data model decided for the rebuild: several next steps per project, task importance, a planned length on the timer and weekly notes.

## What Changes

- Add the local database on both platforms, with the same schema and the same query code:
  - **Desktop:** an SQLite file in the app's data directory, so development runs ("Orbit Dev") and the installed release keep separate databases.
  - **Browser:** SQLite WASM stored in the browser's origin private file system (OPFS), with a request for persistent storage. When that storage is unavailable (for example in a private window), the app runs on an in-memory database and shows a warning. Only one tab can hold the database; a second tab says that Orbit is open in another tab.
- Add the full schema from `docs/SPEC.md` §4 as schema version 1: areas, goals, measures, projects, tasks, habits, habit checks, log entries, timers, notes, weekly reviews, review measure snapshots and the local-only settings table.
- **BREAKING** Start schema versioning again at version 1 with forward-only migrations. The old drift versions 1–7 and their upgrade paths, including the move from objectives and key results to goals and measures, are dropped: there is no data to migrate.
- Add the shared record rules every repository builds on: client-generated UUIDs (UUID v5 from the natural key for habit checks, weekly reviews and notes; a fixed ID for the timer), UTC timestamps, soft delete, enumerations stored as text, calendar dates without time.
- Create the default areas (Job, Personal, Sport, Uni) when the database is created.
- Show the database's state on the placeholder start screen (storage, schema version, a start counter kept in the settings), so persistence can be checked on both platforms until the app shell replaces the placeholder.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `local-database`: persistence on the desktop and in the browser instead of Android and Flutter web; database location per app identity; browser storage warning, persistent-storage request and one-tab rule; schema version 1 with the notes table and the new task and timer fields; natural-key IDs for notes and a fixed timer ID; migrations restart at version 1; the objectives-to-goals upgrade is removed.

## Out of scope

- Repositories, providers and UI for any entity (areas, goals, projects, tasks, …): they come with each feature change. This change only provides the database, the schema and the shared record rules.
- Sync, the sync server and the server-side `server_updated_at` column (change `sync-server`).
- The settings screen and the meaning of individual settings (feature changes); this change only provides the settings table.
- The app shell, theme and a styled warning banner (change `app-shell`); this change shows the warning and the other-tab notice in plain form on the placeholder.
- Exporting or backing up the database file.

## Impact

- Code: new `src/core/db/` (schema, migrations, migration runner, record helpers, seeding, opening the database), database drivers under `src/platform/` (desktop, browser worker, Node for tests), Rust commands in `src-tauri/` for SQLite on the desktop, generated SQL migrations in `drizzle/`.
- Dependencies: `drizzle-orm`, `drizzle-kit` (dev), `@sqlite.org/sqlite-wasm`, `uuid`; Rust crate `rusqlite` (bundled SQLite).
- Docs: `README.md` (database section), `openspec/config.yaml` context (the database is no longer "planned").
