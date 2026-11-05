# Tasks

## 1. Schema and record rules

- [ ] 1.1 Install `drizzle-orm`, `@sqlite.org/sqlite-wasm` and `uuid`, and `drizzle-kit` as a dev dependency; add the script `db:generate` (`drizzle-kit generate`) to `package.json`. Verify: `npm ls drizzle-orm drizzle-kit @sqlite.org/sqlite-wasm uuid` lists all four.
- [ ] 1.2 Write `src/core/db/schema.ts` with the shared columns helper and all tables from `docs/SPEC.md` §4 (design: schema conventions): areas, goals, measures, projects (no next-step column), tasks (`importance`, `is_next_step`), habits, habit_checks, log_entries, timers (`planned_minutes`), notes, weekly_reviews, review_measure_snapshots, settings; the three unique indexes; no foreign keys. Add `drizzle.config.ts` (dialect sqlite, out `drizzle/`) and run `npm run db:generate`. Verify: `drizzle/0000_*.sql` has 13 `CREATE TABLE` and 3 `CREATE UNIQUE INDEX` statements and no `REFERENCES`, and `npm run typecheck` passes.
- [ ] 1.3 Write `src/core/db/records.ts` (design: record helpers: `newId`, `naturalId`, `TIMER_ID`, `createFields`, `updateFields`, `deleteFields`, `notDeleted`) and `src/core/db/records.test.ts` covering the scenarios of "Record identity and timestamps" (create sets identity, update bumps `updated_at`, deterministic habit check ID, deterministic note ID, fixed timer ID). Verify: `npx vitest run src/core/db/records.test.ts` passes.

## 2. Driver, migrations and opening (tested on Node)

- [ ] 2.1 Write the driver interface `src/platform/db/driver.ts` (`query`, `batch`), the Node driver `src/platform/db/node.ts` on `node:sqlite` with array rows, and `src/core/db/drizzle.ts`, which wraps any driver in Drizzle's `sqlite-proxy` with batch support. Test in `src/platform/db/node.test.ts`: a join of two tables returns both `id` columns, and a batch of two inserts whose second is rejected stores neither (scenario "One write of a unit fails"). Verify: `npx vitest run src/platform/db` passes.
- [ ] 2.2 Write the migration runner `src/core/db/migrate.ts` (design: migrations; migrations passed in, defaulting to the bundled `drizzle/*.sql`) and `src/core/db/migrate.test.ts` covering: fresh install (12 entity tables + settings, `user_version` 1), opening at the current version runs nothing, upgrade with an extra test migration keeps existing rows, failing migration leaves no partial changes and the old version, unique habit check / weekly review / note, and a project saved as `backlog` stored as text. Verify: `npx vitest run src/core/db/migrate.test.ts` passes.
- [ ] 2.3 Write `src/core/db/database.ts` (`openDatabase` with its three result states, design: opening the database), `src/core/db/seed.ts` (default areas with their colors) and `openTestDatabase()` for tests. Test in `src/core/db/database.test.ts` (Node driver on a temporary file): the first open creates Job, Personal, Sport, Uni in that order; after soft-deleting Uni and opening again, Uni is still deleted and nothing is re-seeded; a failing migration gives `status: 'error'`. Verify: `npx vitest run src/core/db` passes.

## 3. Desktop

- [ ] 3.1 Add `rusqlite` (feature `bundled`) to `src-tauri/Cargo.toml` and write `src-tauri/src/db.rs` (design: desktop): open `orbit.db` in the app data directory in WAL mode at setup, commands `db_query` and `db_batch` returning rows as arrays, register them in `src-tauri/src/lib.rs`. Add Rust unit tests in `db.rs` for value conversion (null, integer, real, text) and batch rollback. Verify: `cargo test --manifest-path src-tauri/Cargo.toml` passes.
- [ ] 3.2 Write the desktop driver `src/platform/db/desktop.ts` (Tauri `invoke` of the two commands) and the driver selection in `src/platform/db/index.ts` (desktop driver loaded with a dynamic import only on the desktop). Verify: `npm run typecheck` passes and the browser build (`npm run build`) contains no reference to the desktop driver in its startup chunk.
- [ ] 3.3 Show the database state on the placeholder in `src/App.tsx` (design: placeholder start screen): storage, schema version and the `app_starts` counter from the settings table, the memory warning, the other-tab notice and the error state. Verify: `npm run desktop` shows storage `file`, schema version 1 and a counter that goes up by one after closing and starting again, and `~/.local/share/dev.neopw.orbit.dev/orbit.db` exists.

## 4. Browser

- [ ] 4.1 Write the browser worker `src/platform/db/browser.worker.ts` (sqlite-wasm, `opfs-sahpool`, fallback to `:memory:`) and the driver `src/platform/db/browser.ts` (request/response over `postMessage`, `navigator.storage.persist()`), and configure Vite for it in `vite.config.ts` (exclude `@sqlite.org/sqlite-wasm` from pre-bundling, ES module worker). Verify: `npm run dev` in Chrome shows storage `opfs` and schema version 1, the counter goes up on each reload, and the console has no errors.
- [ ] 4.2 Add the one-tab rule in `src/platform/db/browser.ts` with the Web Lock `orbit-db` (`ifAvailable`), before the worker starts. Verify: with Orbit open in one Chrome tab, a second tab shows the other-tab notice and its counter does not change; after closing the first tab, reloading the second shows the database and the counter.

## 5. Docs

- [ ] 5.1 Document the database in `README.md` (where it lives on the desktop and in the browser, the one-tab rule, `npm run db:generate` and "never edit an applied migration", how to reset the development database), add `db:generate` to the commands in `CLAUDE.md`, and in `openspec/config.yaml` replace the "Planned" database line with the actual setup (Drizzle over `src/platform/db` drivers, migrations in `drizzle/`, `db.batch()` for writes that belong together, no foreign keys, tests with `openTestDatabase()`), keeping the context short. Verify: the README commands run as written, and `openspec instructions proposal --change local-database --json` shows the new context.

## 6. Verification

- [ ] 6.1 Run `npm run check` and `cargo test --manifest-path src-tauri/Cargo.toml`. Verify: both pass.
- [ ] 6.2 Desktop: run `npm run desktop:build`, install the `.deb` (user) and start Orbit, and run `npm run desktop` at the same time. Verify: both show storage `file` and schema version 1; their counters go up independently across restarts; the release uses `~/.local/share/dev.neopw.orbit/orbit.db` and the development run `~/.local/share/dev.neopw.orbit.dev/orbit.db`; with the network off, the counter still goes up.
- [ ] 6.3 Browser: run `npm run build` and `npx vite preview`, and open it in Chrome and Firefox. Verify: storage `opfs` and the counter survives reloads in both; a second tab shows the other-tab notice; a Firefox private window shows storage `memory` with the warning; the preview (port 4173) and the dev server (port 1420) have separate counters.
