# Design

## Context

The skeleton from `rebuild-foundation` has a platform layer (`src/platform/platform.ts`, `'desktop' | 'browser'`) and no database. The schema is defined in `docs/SPEC.md` §4. Node 24 is pinned (it ships `node:sqlite`, SQLite 3.53, with rows as arrays). Sync comes later (`sync-server`) and needs: client-generated IDs, `updated_at` on every write, soft deletes, and rows that can arrive in any order.

## Goals / Non-Goals

**Goals:**
- One schema and one query layer (Drizzle) for the desktop, the browser and the tests; only the SQL driver differs.
- Prove the browser database (SQLite WASM in OPFS) early, including its failure modes (no storage, second tab).
- The shared record rules (IDs, timestamps, soft delete) as tested helpers that every repository uses.

**Non-Goals:**
- Repositories, reactive queries and state management for features: chosen by the first feature change that needs them.
- Encryption, export and backup of the database file.

## Decisions

### Drizzle over a minimal driver interface
All three platforms implement one small interface, and Drizzle's `sqlite-proxy` runs on top of it:

```
 feature code --> Drizzle (sqlite-proxy) --> SqlDriver
                                              |  query(sql, params, method) -> rows as arrays
                                              |  batch([{sql, params, method}]) -> one transaction
          +-----------------------------------+----------------------------+
          v                                   v                            v
  desktop: Tauri commands            browser: Web Worker            tests: node:sqlite
  (Rust, rusqlite, orbit.db)         (sqlite-wasm, OPFS)            (in memory)
```

Rows travel as arrays, not objects, so joined columns with the same name (every table has `id`) don't overwrite each other. Units of writes that belong together use Drizzle's `db.batch()`, which every driver runs in one transaction (spec: Writes that belong together). `db.transaction()` is not used: over an async proxy, another write could slip in between `BEGIN` and `COMMIT`.

Alternatives: Kysely (equally good, but Drizzle also generates migrations from the schema and was picked while planning the rebuild); raw SQL (no type safety across 13 tables).

### Desktop: own Rust commands with rusqlite, not tauri-plugin-sql
`src-tauri/src/db.rs` opens `orbit.db` in `app.path().app_data_dir()` at startup (WAL mode) and keeps one `rusqlite::Connection` behind a `Mutex`. Two commands: `db_query(sql, params, method)` returns rows as arrays of JSON values, and `db_batch(queries)` runs all queries in one transaction and rolls back on the first error. The app data directory follows the app identity, so `Orbit Dev` and `Orbit` get separate files (spec: Database location).

The official `tauri-plugin-sql` was considered: it returns rows as objects keyed by column name (joins with duplicate names lose values), has no batch-in-one-transaction call and adds an async connection pool that a single-user app doesn't need. The two commands are about 100 lines of Rust. `rusqlite` with the `bundled` feature compiles its own SQLite, so the version doesn't depend on the system.

### Browser: sqlite-wasm with the `opfs-sahpool` VFS in a dedicated worker
`src/platform/db/browser.worker.ts` loads `@sqlite.org/sqlite-wasm`, installs the `opfs-sahpool` VFS and opens `orbit.db`. The main thread talks to it through a small request/response protocol over `postMessage` (`src/platform/db/browser.ts`).
- **Why `opfs-sahpool`:** it needs no cross-origin isolation headers (works on any static host, including the Worker in `sync-server`) and is the fastest OPFS option. Its catch is that only one connection can hold the files, which is exactly the one-tab rule.
- **One tab:** before opening, the main thread requests the Web Lock `orbit-db` with `ifAvailable: true`. If another tab holds it, the app shows the "open in another tab" notice and never starts the worker. The lock is held for the tab's lifetime and released when it closes (spec: One browser tab at a time).
- **Persistence:** on start, `navigator.storage.persist()` is requested. If installing the VFS fails (no OPFS, e.g. Firefox private windows), the worker opens `:memory:` instead and reports `storage: 'memory'`, and the app shows the warning.
- The alternative `opfs` VFS supports several tabs, but requires COOP/COEP headers, is slower, and still needs cross-tab coordination. A leader tab with a BroadcastChannel would also give multi-tab support, at a lot more code. Neither is worth it for a browser build that is the secondary way to use Orbit.
- Vite: the package is excluded from dependency pre-bundling, and the worker is built as an ES module worker. The WASM file is only loaded in the browser build.

### Tests: node:sqlite
`src/platform/db/node.ts` implements the driver with Node's built-in `node:sqlite` (`DatabaseSync`, `setReturnArrays(true)`), in memory. No native dependency to install. Repository and migration tests in later changes use it through `openTestDatabase()`.

### Migrations: drizzle-kit SQL files, own runner, `PRAGMA user_version`
- `drizzle.config.ts` points drizzle-kit at `src/core/db/schema.ts`; `npm run db:generate` writes SQL migrations to `drizzle/` (committed). Applied migrations are never edited; a schema change always adds a new one.
- The runner (`src/core/db/migrate.ts`) loads the SQL files with Vite's `import.meta.glob(..., { query: '?raw', eager: true })` (works in the app and in Vitest), sorts them by their number and compares with `PRAGMA user_version`. Each pending migration runs as one batch: its statements plus `PRAGMA user_version = N`, so the version only moves if the whole migration succeeded (spec: Schema version and migrations).
- Drizzle's own migrators read from the file system or keep a separate journal table; `user_version` is simpler and is what "schema version" means in the spec.
- A failing migration makes `openDatabase()` return an error state; the placeholder shows "The database could not be opened" with the error message.

### Schema conventions (`src/core/db/schema.ts`)
- Table and column names in snake_case, as in `docs/SPEC.md` §4.
- Shared columns from one helper: `id` (text primary key), `created_at`, `updated_at`, `deleted_at`.
- Timestamps as ISO 8601 UTC text (`2026-11-05T10:00:00.000Z`), which sorts correctly as text. Calendar dates as `YYYY-MM-DD` text; times of day as `HH:mm`.
- Booleans as integer 0/1 (Drizzle `mode: 'boolean'`); enumerations as text with TypeScript union types.
- **No foreign-key constraints.** References are plain text columns. Sync applies rows in whatever order they arrive, and soft deletes keep rows around, so database-level references would reject valid states. Integrity is the repositories' job.
- Unique indexes: `habit_checks (habit_id, date)`, `weekly_reviews (week_start)`, `notes (target_type, target_id, week_start)`. Because these records have natural-key IDs, re-creating one that was soft-deleted (re-checking a habit the same day) updates and revives the existing row instead of inserting.
- `settings`: `key` text primary key, `value` text; no shared columns, never synced.
- Habit `weekdays` is a JSON text column with weekday numbers (1 = Monday … 7 = Sunday). Defaults: task `importance` is null (inherited), project `importance` 3, texts `''`, measure `step` 1; a weekly review's `score` is nullable so a draft can exist.

### Record helpers (`src/core/db/records.ts`)
- `newId()`: `crypto.randomUUID()` (v4).
- `naturalId(kind, ...parts)`: UUID v5 from a fixed Orbit namespace UUID and `kind:part1:part2…` (kinds `habit_check`, `weekly_review`, `note`). `TIMER_ID` is `naturalId('timer')`.
- `createFields(clock)`, `updateFields(clock)`, `deleteFields(clock)` return the columns to set; `notDeleted(table)` is the `deleted_at IS NULL` filter every query adds.
- Helpers take a clock (`() => Date`) so tests control time.

### Opening the database (`src/core/db/database.ts`)
`openDatabase()` picks the driver through `src/platform/` (desktop driver loaded with a dynamic import only on the desktop), runs migrations, seeds the default areas when the database was just created (`user_version` was 0), and returns one of:
`{ status: 'ready', db, storage: 'file' | 'opfs' | 'memory', schemaVersion }`, `{ status: 'other-tab' }` or `{ status: 'error', message }`.

Default areas (seeded once, in this order, with the colors of the Flutter app): Job `#1E88E5`, Personal `#8E24AA`, Sport `#43A047`, Uni `#FB8C00`. "Once" is a settings flag (`default_areas_seeded`) written in the same batch as the areas, not "the version was 0": a seed that failed is retried on the next start, and deleted default areas never come back. `migrate` refuses a database whose version is newer than the app's newest migration (error state).

### Placeholder start screen
Until `app-shell` replaces it, `src/App.tsx` shows: the platform, the storage (`file`, `opfs` or `memory`), the schema version, and a start counter that is incremented in the settings table (`app_starts`) on every start. In memory it shows the warning; in a second tab only the notice. This is how persistence is checked by hand on both platforms.

### New packages
| Package | Why |
|---|---|
| `drizzle-orm` | Typed schema and queries, `sqlite-proxy` over our drivers |
| `drizzle-kit` (dev) | Generates SQL migrations from the schema |
| `@sqlite.org/sqlite-wasm` | Official SQLite build for the browser, with OPFS |
| `uuid` | UUID v5 for natural-key IDs (synchronous; `crypto.subtle` is async only) |
| `rusqlite` (Rust, `bundled`) | SQLite on the desktop, with rows as arrays and real transactions |

## Risks / Trade-offs

- [OPFS storage can be cleared by the browser or the user] → `navigator.storage.persist()`; the sync server (next change) holds a copy, so a cleared browser pulls everything again.
- [A second tab cannot be used] → Accepted for the browser build; the notice says why. Revisit with a leader tab if it gets annoying.
- [No foreign keys means orphans are possible] → Repositories delete or detach children explicitly (as `docs/SPEC.md` §5 defines), with tests.
- [`rusqlite` bundled compiles SQLite from C] → Slower first Rust build; build-essential is already installed.
- [Migrations generated by drizzle-kit can contain table rebuilds for some changes] → Review each generated migration before committing; it runs in one transaction either way.

## Migration Plan

New database at version 1; nothing to migrate. Rollback is reverting the change. The development database lives in `~/.local/share/dev.neopw.orbit.dev/orbit.db` and can be deleted at any time during development.
