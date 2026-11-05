# Proposal

## Why

The sync server is deployed (`sync-server`), but no app talks to it yet, so the desktop app and the browser still keep separate data (`docs/SPEC.md` §1, §2). This change adds the app's side of sync (§7) and completes milestone 3 (§9). The phone companion will later reuse the same engine.

## What Changes

- **Connect a device** (§6.6, §7): enter the server address and this device's token. The app checks the token with the server's status request.
  - If the server holds no data, the device uploads everything.
  - If it holds data, the app asks for confirmation and then replaces the device's local data with the server's. Cancelling leaves the device unconnected with its data unchanged.
  - Disconnecting stops sync and keeps the local data. Address and token are local settings, never synced.
- **Sync engine** (§7):
  - **Push:** upload the rows changed since the last upload, found by `updated_at`, in chunks the server accepts.
  - **Pull:** download pages by cursor and apply each row when the local copy is missing or older (last-write-wins).
  - The upload and download positions are kept in the local settings, so an interrupted first upload continues where it stopped.
- **When sync runs:** at app start, when the app returns to the foreground, a few seconds after a local change to synced data, every 5 minutes while the app is open, and with "Sync now". Only one sync runs at a time.
- **Failures and status:** failures are silent and retried at the next trigger. The app shows when the last sync succeeded and whether the last attempt failed, with a short reason: no connection, token refused, a different schema version, or a server error.
- Until the app shell and Settings screen exist, the connect form, confirmation, status and "Sync now" sit on the placeholder start screen, like the database state in `local-database`. No feature screens exist yet, so the placeholder also lists the areas and has an "Add test area" button. That makes sync checkable by hand between the desktop and the browser.
- Before a token is entered, the browser build keeps working on its own local data. On connecting to a server with data, that data is replaced after confirmation. This replaces the SPEC §7 line "the browser build holds no data of its own until its token is entered". **`docs/SPEC.md` §7 needs this update, and the 5-minute interval added to its triggers.**
- **BREAKING (spec):** the Supabase account model is replaced: no email and password, no build-time connection settings.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `account`: email/password sign-in and build-time Supabase settings are replaced by connecting with a server address and a device token entered in the app. The device stays connected across restarts, and disconnecting keeps the local data.
- `sync`:
  - "First sign-in on a device" becomes "First connection of a device".
  - "When sync runs" is replaced by "Sync triggers", which adds the 5-minute interval and drops pull-to-refresh for now.
  - "Failures and status" shows the failure reason and no longer names the Settings section.
  - "Sync across the upgrade" is replaced by "Same schema version as the server".
  - New: "Interrupted upload continues" and "Changes during a sync".
  - "Local-first" says connected instead of signed in.

## Out of scope

- The Settings screen and its "Account & sync" section (feature change "Settings"); this change uses the placeholder screen.
- Pull-to-refresh on Home, Plan and Review. It comes with those screens, which will call the same "sync now" entry point.
- Showing synced data in feature screens (no feature screens exist yet). Sync is verified with the database itself and with tests.
- Purging soft-deleted rows, sync of local settings, conflict resolution beyond last-write-wins.
- The Android companion's sync.
- Server changes: the API from `sync-server` is used as it is.

## Impact

- Code:
  - New `src/features/sync/` (API client, push, pull, first connection, scheduler, placeholder UI).
  - `server/src/tables.ts` moves to `src/core/db/sync-tables.ts`, shared by the app and the server.
  - The app's database gets a write notification for synced tables (`src/core/db/`).
  - `src/App.tsx` shows the sync panel.
- Dependencies: none new.
- Docs: `README.md` (connecting a device), `docs/SPEC.md` §6.6 and §7, the `sync` spec's Purpose ("signed-in" → "connected").
