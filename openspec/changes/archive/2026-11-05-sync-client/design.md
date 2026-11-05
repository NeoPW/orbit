# Design

## Context

- **Server API** (from `sync-server`): `GET /api/status`, `POST /api/push` (≤ 500 rows, ≤ 1 MB, last-write-wins), `GET /api/pull?cursor=` (pages of 1000, `more`). All requests carry a Bearer token; push and pull also carry `Orbit-Schema-Version` (409 when it differs). Rows travel as objects keyed by database column name, with stored values.
- **App database:** `openDatabase()` wraps a platform `SqlDriver` in Drizzle and returns `{ db }`. Local settings live in the key-value `settings` table, which is never synced.
- **App screen:** `src/App.tsx` is a placeholder until `app-shell`, and no feature screens or repositories exist yet. The desktop webview has no CSP (`csp: null`), and the server allows any origin, so `fetch` works from the desktop, the dev server and the hosted build.

## Goals / Non-Goals

**Goals:**
- One sync engine on top of `SqlDriver`, tested on Node against the real server code (`handleApi` with a Node database): two simulated devices, no mocks of the protocol.
- Robust to device clock differences between devices and to interruptions; never loses a local change.

**Non-Goals:**
- Live updates of feature screens after a pull (no feature screens yet; the first feature change decides how queries refresh).
- Background sync while the app is closed.

## Decisions

### Layout
```
src/core/db/sync-tables.ts      moved from server/src/tables.ts (column names per synced table), shared
src/core/db/writes.ts           write notification for synced tables (driver wrapper)
src/features/sync/
  data/api.ts                   fetch client: status / push / pull, errors as reasons
  data/state.ts                 sync keys in the settings table
  data/push.ts  data/pull.ts    collect + chunk + upload; apply pages
  data/connect.ts               first connection: check, upload all or replace
  data/engine.ts                one sync cycle (push, then pull), records success / failure
  domain/chunks.ts              split rows into server-sized parts (pure)
  domain/format.ts              dd-mm-yyyy HH:mm (pure)
  scheduler.ts                  triggers, debounce, interval, single flight
  ui/SyncPanel.tsx              placeholder UI: connect, confirm, status, Sync now, disconnect
```
`openDatabase()` also returns the raw `driver`. The engine works with plain SQL over it, like the server, because rows travel with database column names and stored values; Drizzle's property names and value mapping would only get in the way.

### Finding local changes: `updated_at` against a local-clock watermark
`sync_pushed_until` (ISO text) holds the local time at which the last complete upload **started**. A push selects every row with `updated_at >= sync_pushed_until` from every synced table (all rows when it is empty). It sorts them by `updated_at` and sends them in chunks of at most 500 rows and about 900 KB of JSON. After each stored chunk, it saves the watermark as `min(startedAt, updated_at of the first row not yet sent)`, and after the last chunk as `startedAt`. Rows tied on `updated_at` with the first unsent row are sent again, which the server ignores.
- Why the start time and not the largest `updated_at` sent: rows pulled from a device whose clock runs ahead carry future timestamps. If the watermark followed them, later local edits with an earlier local time would never be uploaded. Local edits always get `updated_at` = local now, which is ≥ the start of any earlier push (spec: Changes during a sync).
- `>=` instead of `>`: a row written in the same millisecond as the boundary is sent again rather than missed. The server ignores it (same version).
- Pulled rows newer than the watermark are uploaded once more on the next push. The server ignores them; this costs a little traffic and saves a "dirty" column in every table.
- Interrupted upload: the per-chunk watermark makes the next sync start after the last stored chunk (spec: Interrupted upload continues).

Alternative: a `dirty` flag or a change-log table written on every local write. It is more exact, but it needs a schema change in all 12 tables or triggers, and the watermark is what SPEC §7 describes.

### Applying a pull page: same upsert as the server, one transaction per page
For each page, one batch:
1. An upsert per table: `INSERT … SELECT value ->> '$.col' … FROM json_each(?) WHERE true ON CONFLICT (id) DO UPDATE SET … WHERE excluded.updated_at > t.updated_at`.
2. The new cursor written to `sync_cursor`.

Rows and cursor are stored together or not at all, so a page is never half-applied. Deleted rows are applied like any other row. The local unique indexes (habit check, review, note) cannot clash, because those rows have natural-key IDs. If one ever did, the batch fails, the sync shows a failure, and nothing is half-applied.

### One sync cycle
`status` is not called on every sync. A cycle is: push all chunks → pull until `more` is false → save `sync_last_success = now` and clear `sync_last_failure`. Any error stops the cycle, and `sync_last_failure = { at, reason }` is saved. Reasons come from `api.ts`:

| Situation | Reason |
|---|---|
| `fetch` throws, or times out after 30 s | `offline` |
| 401 | `token` |
| 409 | `version` |
| anything else | `server` |

The engine writes through the raw driver, so its own writes do not notify the scheduler (no loop).

### First connection (`connect.ts`)
1. `check(url, token)`: `GET /api/status`. A failure gives `offline` or `token` for the form's error, and nothing is saved.
2. `hasData: false`: one batch saves `sync_url` and `sync_token` and clears the cursor and `sync_pushed_until` (so everything is uploaded), then the scheduler runs a sync.
3. `hasData: true`: the UI shows the confirmation (inline, with Replace / Cancel). Native `confirm()` is unreliable in the Tauri webview. On Replace, one batch deletes all rows of the 12 synced tables, saves url and token, sets the cursor to 0 and `sync_pushed_until` to now, and then the sync pulls everything. Local settings, including `default_areas_seeded`, stay, so the default areas are not seeded again. Cancel saves nothing.
4. Disconnect deletes the six `sync_*` keys and stops the scheduler. Connecting again is a first connection (spec: Disconnect).

### Write notification for synced tables (`src/core/db/writes.ts`)
`withWriteNotification(driver, onWrite)` wraps a driver. After a successful `query` or `batch`, it calls `onWrite` when a statement is an `insert into` / `update` / `delete from` on a synced table name (Drizzle quotes names: `insert into "areas"`). `openAppDatabase()` builds the app's Drizzle `db` on the wrapped driver and gives the raw driver to sync. Writes to `settings` don't match, so the spec's "local settings do not trigger a sync" holds.

### Scheduler
- `createSyncScheduler({ run, setTimeout/setInterval, now })` keeps one promise: a trigger during a run sets `again`, and after the run exactly one more follows.
- Triggers:
  - `start()` runs a sync at once and sets the 5-minute interval.
  - `document` `visibilitychange` (to visible) and `window` `focus` each trigger a sync, collapsed by the single flight.
  - A write notification restarts a 3-second debounce timer.
  - `syncNow()` returns the run's promise, so the UI can show "Syncing…".
- Everything stops on disconnect. Timers are injected for tests (Vitest fake timers).

### Placeholder UI
`SyncPanel` sits under the database state in `App.tsx` and has three states:
- **Not connected:** address field (the page origin in the browser unless the host is `localhost` / `127.0.0.1`; empty on the desktop), password field for the token, and Connect. Errors appear below.
- **Confirm:** "The server already holds data. Replace this device's data with it?" with Replace and Cancel.
- **Connected:** the address, "Last synced dd-mm-yyyy HH:mm", "Last sync failed: no connection / token refused / different schema version / server error", "Sync now" and "Disconnect".

A small `TestAreas` block lists the non-deleted areas and has "Add test area" (name `Test HH:mm:ss`), written through Drizzle so that it triggers the debounce. It exists only so sync can be checked by hand, and `app-shell` removes it with the placeholder.

### No new packages
`fetch`, `AbortSignal.timeout` and Vitest fake timers cover everything.

## Risks / Trade-offs

- [Device clock jumps backward] → Edits with an `updated_at` before the watermark would not be uploaded. Accepted: SPEC §7 already lets clocks decide. System clocks are NTP-synced.
- [Re-uploading pulled rows once] → A little traffic, ignored by the server. The free plan counts no writes for ignored rows, since nothing is written.
- [Replace on first connection deletes local unsynced data] → Only after an explicit confirmation that says so (spec).
- [Pull applies rows while feature code might be writing] → Both go through the same driver. Each page is one transaction, and last-write-wins resolves the rest.
- [No feature screens refresh after a pull] → Out of scope, as above. The placeholder re-reads its area list after each sync.

## Migration Plan

No schema change. Existing devices start unconnected and keep working as before. Connect the desktop app first (its data is uploaded to the empty server), then the browser (it confirms and gets the desktop's data). Rollback: revert the change. The server keeps the uploaded rows, and disconnecting leaves local data as it is.
