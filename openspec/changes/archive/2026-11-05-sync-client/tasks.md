# Tasks

## 1. Shared groundwork

- [x] 1.1 Move `server/src/tables.ts` to `src/core/db/sync-tables.ts` and update its importers (`server/src/push.ts`, `server/src/pull.ts`, `server/src/schema.test.ts`). Return the raw `driver` from `openDatabase()` in `src/core/db/database.ts` as well. Verify: `npx vitest run server src/core/db` passes and `npm run typecheck` passes.
- [x] 1.2 Write `src/core/db/writes.ts` (`withWriteNotification`, design: write notification) and use it in `src/core/db/app-database.ts` (app `db` on the wrapped driver; raw driver exposed for sync). Test in `src/core/db/writes.test.ts`: an insert, update and delete on `areas` notify; a write to `settings`, a select and a failed write do not (spec: Local settings do not trigger a sync). Verify: `npx vitest run src/core/db/writes.test.ts` passes.
- [x] 1.3 Write `src/features/sync/domain/chunks.ts` (≤ 500 rows and ≈ 900 KB per part, keeping `updated_at` order) and `src/features/sync/domain/format.ts` (`dd-mm-yyyy HH:mm`, local time) with tests in the same folder: 1200 rows → 500/500/200; large rows split by size; 2026-10-05 14:05 → `05-10-2026 14:05` (spec: Last synced). Verify: `npx vitest run src/features/sync/domain` passes.

## 2. Sync engine (tested on Node against the real server code)

- [x] 2.1 Write `src/features/sync/data/api.ts` (status / push / pull with Bearer token and `Orbit-Schema-Version`, 30 s timeout, failure reasons `offline` / `token` / `version` / `server`) and `src/features/sync/data/state.ts` (the six `sync_*` settings keys). Add a test helper `src/features/sync/data/testing.ts` that gives a `fetch` routing to `handleApi` with a Node server database, and a fake device (`openTestDatabase()` + raw driver). Test in `api.test.ts` that each HTTP outcome (thrown fetch, 401, 409, 500) maps to its reason. Verify: `npx vitest run src/features/sync/data/api.test.ts` passes.
- [x] 2.2 Write `src/features/sync/data/push.ts` (watermark and chunked upload, design: finding local changes) with `push.test.ts`. Cover: 1200 changed records are all stored; after a failure following the first part, the next push sends only the rest (spec: Interrupted upload continues); a row pulled with a future `updated_at` does not stop a later local edit from being uploaded; a deleted record is uploaded. Verify: `npx vitest run src/features/sync/data/push.test.ts` passes.
- [x] 2.3 Write `src/features/sync/data/pull.ts` (apply pages with the cursor in one batch, design: applying a pull page) with `pull.test.ts`: a missing row is inserted, a newer one replaces, an older one is ignored, a deleted row hides the local record, the local settings are untouched, and a failing page leaves neither rows nor cursor changed. Verify: `npx vitest run src/features/sync/data/pull.test.ts` passes.
- [x] 2.4 Write `src/features/sync/data/engine.ts` (one cycle, last success / failure, design: one sync cycle) with `engine.test.ts` using two fake devices and one server. Cover:
  - a rename on one device reaches the other (spec: Change on the other device);
  - a delete propagates;
  - the lead-time setting stays local;
  - concurrent edits end with the later title on both;
  - the same habit check on both gives one record;
  - two timers give one, the later one;
  - an offline sync records `offline` and the change is uploaded at the next sync;
  - a removed token records `token` and keeps local data;
  - a different schema version records `version`, keeps a new goal, and uploads it once versions match;
  - a rename during the pull phase is on the server after the next sync;
  - a successful sync records its time and clears the failure.

  Verify: `npx vitest run src/features/sync/data/engine.test.ts` passes.
- [x] 2.5 Write `src/features/sync/data/connect.ts` (check, upload-all, replace, disconnect, design: first connection) with `connect.test.ts`. Cover:
  - an empty server gets all records, deleted ones included;
  - with server data and confirmation, local synced data is replaced, nothing is uploaded, settings are kept and default areas are not re-seeded on the next open;
  - cancel leaves the device unconnected and unchanged;
  - a refused token and an unreachable server give their errors and save nothing;
  - disconnect forgets the token, keeps the data, and the next connect asks for confirmation again.

  Verify: `npx vitest run src/features/sync/data/connect.test.ts` passes.

## 3. Triggers

- [x] 3.1 Write `src/features/sync/scheduler.ts` (design: scheduler) with `scheduler.test.ts` on Vitest fake timers. Cover:
  - `start()` runs a sync, and so does a restart (spec: Restart);
  - a write notification leads to a sync within a few seconds;
  - five notifications within two seconds give one sync;
  - visibility to visible and window focus each trigger a sync;
  - a sync runs every 5 minutes;
  - "Sync now" during a run gives exactly one more run;
  - after `stop()` nothing runs.

  Verify: `npx vitest run src/features/sync/scheduler.test.ts` passes.

## 4. Placeholder UI

- [x] 4.1 Write `src/features/sync/ui/SyncPanel.tsx` (not connected / confirm / connected, design: placeholder UI) and the `TestAreas` block, wire the scheduler and both into `src/App.tsx`, and put the address suggestion in a small pure function with a test (`src/features/sync/domain/address.ts`: hosted origin → suggested, `localhost` / `127.0.0.1` / desktop → empty; spec: Server address suggested in the browser). Verify: `npx vitest run src/features/sync/domain` passes, and `npm run dev` shows the connect form with an empty address field.
- [x] 4.2 Document connecting a device in `README.md` (where the form is, which token to use, what the confirmation means, how to disconnect). Update `docs/SPEC.md`: §7 (5-minute interval; the browser build works locally until connected, replaced on confirmation) and §6.6. Change the Purpose of `openspec/specs/sync/spec.md` ("signed-in" → "connected") and of `openspec/specs/account/spec.md` (device token instead of Supabase). Verify: the README steps work as written in 5.2.

## 5. Verification

- [x] 5.1 Run `npm run check`. Verify: it passes.
- [x] 5.2 Verify by hand against the deployed server (or `npm run server:dev`). Do these in order:
  1. Connect `npm run desktop`, which uploads to an empty server.
  2. Connect the hosted browser build in Chrome. It asks for confirmation; after Replace, it shows the desktop's areas.
  3. "Add test area" on the desktop appears in the browser after it regains focus or within 5 minutes, and the reverse.
  4. Offline on the desktop: adding an area shows "Last sync failed: no connection", and the area arrives after reconnecting.
  5. Disconnect keeps the areas.
  6. In Firefox, cancelling the confirmation leaves its own data.

  Verify: every step behaves as described, and no error dialog appears.
