# Proposal

## Why

Sync is what connects the desktop app, the browser and the later phone (`docs/SPEC.md` §1, §2). Until it exists, each one keeps its own data. Its server side can be built and tested without any app UI: a small Cloudflare Worker with a D1 database that stores rows and enforces last-write-wins (§7). The server comes first so that the app's sync engine (next change, `sync-client`) has a real API to work against. The same Worker also serves the browser build (§2, §7), so this change also gives the browser build a hosted address.

## What Changes

- Add a Cloudflare Worker (`server/`) with a D1 database that holds one table per synced entity, with the same columns as the device (`docs/SPEC.md` §4), plus a server-set change number used to find changes since the last pull. The server schema is derived from the app's schema, and a test fails when the two differ.
- Add token login (§2, §7): every API request carries a device token (`Authorization: Bearer …`). The Worker accepts a request only when the token is one of the device tokens set as a Worker secret, one per device. There are no accounts and no sign-up.
- Add the sync API (§7):
  - **Push:** upload changed rows of any synced table. The server keeps an incoming row only when its `updated_at` is newer than the stored row's (last-write-wins). Soft-deleted rows are stored like any other row.
  - **Pull:** download the rows changed since a cursor, in pages, with the next cursor.
  - **Status:** whether the server holds any data and which schema version it expects. Devices use it for their first connection (`sync-client`) and to check their token.
  - A device whose schema version differs from the server's is refused, so neither side can drop columns the other has.
- Serve the browser build from the same Worker: API calls under `/api/`, everything else from the built app, with fallback to the app's start page. The API also answers cross-origin requests from the desktop app and the dev server.
- Add scripts to run the Worker locally with a local D1, to apply D1 migrations and to deploy, plus README steps for setting up Cloudflare and creating device tokens.

## Capabilities

### New Capabilities

- `sync-server`: the sync server's behavior: token check, push with last-write-wins, pull by cursor, status, schema version check, server tables, and serving the browser build.

### Modified Capabilities

- `sync`: remove "Server tables per user" (the server is single-user with device tokens; replaced by `sync-server`) and "Server migration" (the objectives-to-goals move on the old Supabase server; the new server starts empty). The device-side requirements stay as they are and are rewritten in `sync-client`.

## Out of scope

- The app's side of sync: the push/pull engine, watermarks in the local settings, first connection of a device (upload or replace after confirmation), when sync runs, failure handling and "last synced" status (change `sync-client`).
- Entering the server address and token in the app, and the `account` spec (Supabase sign-in), which `sync-client` replaces.
- The "the browser build holds no data until its token is entered" rule (§7), which is client behavior (`sync-client`).
- Cloudflare Access in front of the browser build (§2: later).
- Purging soft-deleted rows, backups or export of the D1 database.
- Rate limiting beyond what Cloudflare does by default.

## Impact

- Code: new `server/` (Worker entry, router, auth, push, pull, status, D1 driver, server schema, wrangler config, D1 migrations). `src/core/db/schema.ts` is refactored so the server schema can reuse each table's columns; the app's tables and migrations stay unchanged.
- Dependencies: `wrangler` (dev).
- Build and tooling: `npm run check` also typechecks and tests `server/`; new scripts `server:dev`, `server:deploy`, `server:migrate`, `server:token`, `server:smoke`, `db:generate:server`.
- External: a Cloudflare account (free plan) with one Worker and one D1 database; device tokens as a Worker secret.
- Docs: `README.md` (sync server section), `CLAUDE.md` commands, `openspec/config.yaml` context (the server is no longer "planned"). `docs/SPEC.md` §4 and §7 need updating: the server's change marker becomes a change number instead of `server_updated_at` (see design).
