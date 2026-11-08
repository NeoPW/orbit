# Orbit

Personal, local-first app for goals, projects, tasks, habits, focused work and a weekly review. A desktop app first (works offline), with a browser build of the same app and a small Android companion (tasks, focus and the day timeline on the phone).

- Product spec: `docs/SPEC.md`
- Implemented behavior: `openspec/specs/`
- Work in progress: `openspec/changes/`

The Flutter version of the app is kept under the git tag `flutter-final`.

## Using Orbit

- **Home:** today, the focus panel (pick a task or project, 25/50/90 minutes or open-ended), habits due today, To do ranked by importance × urgency, and the active projects with their next steps. **New task** and **Log work** sit next to the date.
- **Plan:** goals with measures, projects and tasks; projects without a goal; backlog; habits; areas; archive. **New** creates a goal, project, task or habit; goals, projects and tasks open as their own pages.
- **Review:** this week's plan and summary, the guided weekly review (look back, projects, goals, score, plan, save), history and last week.
- **Stats:** a month, quarter, year or all time: time worked and daily average, review score, habit adherence, share on goals, trends, the work calendar and heatmap, and panels for habits, projects, tasks and goals.
- **Settings:** reminders, default reminder time, review day and time, deadline lead time, theme and sync.
- **Keyboard:** `?` lists every shortcut, `Ctrl+K` opens the command palette.
- **Android:** a phone companion with Home, the Today timeline and Settings, synced through the server.

## Stack

- [Tauri 2](https://tauri.app) desktop shell (Rust, uses the system webview)
- React + TypeScript frontend, built with [Vite](https://vite.dev)
- Vitest, ESLint and strict TypeScript, all run by `npm run check`

## Setup (once)

1. **Node.js 22.13 or newer.** The repo pins Node 24 in `.node-version`; with [fnm](https://github.com/Schniz/fnm): `fnm install 24 && fnm use`.
2. **Rust**, through [rustup](https://rustup.rs):

   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

3. **Tauri's Linux libraries** (Debian/Ubuntu):

   ```bash
   sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
   ```

4. **Packages:** `npm install`

## Commands

| What | Command |
|---|---|
| Run the desktop app (development, "Orbit Dev") | `npm run desktop` |
| Run in the browser (http://localhost:1420) | `npm run dev` |
| Build the desktop app (`.deb` and AppImage) | `npm run desktop:build` |
| Build the browser version (to `dist/`) | `npm run build` |
| Typecheck, lint and test | `npm run check` |
| Run some tests | `npx vitest run <paths>` |
| Generate a migration after changing `src/core/db/schema.ts` | `npm run db:generate` |
| Generate the matching sync server migration | `npm run db:generate:server` |
| Run the sync server locally (http://localhost:8787) | `npm run server:dev` |
| Check a running sync server | `npm run server:smoke -- <url> <token>` |
| Create a device token | `npm run server:token` |
| Deploy the sync server and the browser build | `npm run server:deploy` |
| Run on Android (emulator or phone, debug) | `npm run android` |
| Build a debug APK (`--target aarch64` or `x86_64`) | `npm run android:build -- --target aarch64` |
| Render the app icons from `assets/icon/orbit.svg` | `npm run icons` |

## Database

Orbit stores its data in SQLite, through Drizzle.

| Where | Location |
|---|---|
| Desktop release | `~/.local/share/dev.neopw.orbit/orbit.db` |
| Desktop development (`npm run desktop`) | `~/.local/share/dev.neopw.orbit.dev/orbit.db` |
| Browser | SQLite WASM in the browser's private file system (OPFS), per origin |

- The desktop database runs in WAL mode, so `orbit.db-wal` and `orbit.db-shm` sit next to it. The Rust side is `src-tauri/src/db.rs`.
- Each browser origin has its own data: `npm run dev` (port 1420) and `vite preview` (port 4173) do not share anything.
- Only one browser tab can hold the database. A further tab shows "Orbit is already open in another tab".
- Without OPFS (for example a Firefox private window) the browser build runs in memory and shows a warning; the data is gone when the tab closes.

**Schema and migrations.** The schema is `src/core/db/schema.ts`. After changing it, run `npm run db:generate`; it writes a migration to `drizzle/` (committed). Review the SQL. The schema version is stored in `PRAGMA user_version`. Never edit a migration that has been applied; generate a new one. There are no foreign keys, because sync applies rows in any order. Writes that belong together use `db.batch()` (one transaction). Tests use `openTestDatabase()` from `src/core/db/testing.ts` (in memory).

**Reset development data.**

- Desktop: close the dev app, then delete `~/.local/share/dev.neopw.orbit.dev/orbit.db*`.
- Browser: clear the site data for that address (DevTools, Application, Storage, Clear site data).

## Sync server

`server/` is a Cloudflare Worker with a D1 database. It stores the rows of every synced table, keeps the newest version of each row (last-write-wins by `updated_at`), lets only devices with a token in, and also serves the browser build (`dist/`). The API is `GET /api/status`, `POST /api/push` and `GET /api/pull?cursor=<n>`, all with `Authorization: Bearer <token>`; push and pull also send `Orbit-Schema-Version`. The app's side of sync is `src/features/sync/` (see Connecting a device).

**Run it locally.** Create `server/.dev.vars` (not committed) with one token per device:

```
DEVICE_TOKENS=desktop=<token>,browser=<token>
```

Create a token with `npm run server:token`. Then `npm run server:dev` builds the browser build, creates the local D1 tables and starts the Worker at http://localhost:8787 (local data lives in `server/.wrangler/`; delete that folder to reset it). `npm run server:smoke -- http://localhost:8787 <token>` checks the API.

**Schema changes.** After `npm run db:generate`, also run `npm run db:generate:server` and commit both; a test fails when the server tables and the app tables differ. The Worker and the apps must be released together, because the server refuses a different schema version: run `npm run server:deploy` (it migrates D1 first) before devices on the new version sync, otherwise they report "different schema version" and wait.

**Devices.** `DEVICE_TOKENS` holds comma-separated `name=token` pairs. To add or remove a device, change the list and set it again (see Deploy). Removing a token locks out only that device.

**Deploy (once, then `npm run server:deploy`).** Needs a free Cloudflare account.

1. `npx wrangler login`
2. `npx wrangler d1 create orbit`, then put the printed `database_id` into `server/wrangler.jsonc`.
3. Create a token per device (`npm run server:token`) and set the secret: `npx wrangler secret put DEVICE_TOKENS -c server/wrangler.jsonc`, entering `desktop=<token>,browser=<token>`. The Worker has to exist first: if wrangler says so, run step 4 before this one.
4. `npm run server:deploy` builds the browser build, applies the D1 migrations to the remote database and deploys the Worker. It prints the address (`https://orbit.<account>.workers.dev`), which serves the browser build.
5. Check it: `npm run server:smoke -- https://orbit.<account>.workers.dev <token>`.

Rollback: `npx wrangler rollback -c server/wrangler.jsonc`. D1 migrations only go forward.

## Connecting a device

Sync is off until a device is connected. Connecting happens in **Settings → Sync**.

1. Enter the **server address** (`https://orbit.<subdomain>.workers.dev`, or `http://localhost:8787` for `npm run server:dev`) and **this device's token** (one of the tokens in the server's `DEVICE_TOKENS`; see Sync server). In the hosted browser build the address is filled in.
2. **Connect.** If the server holds no data, everything on this device is uploaded. If it holds data, Orbit asks for confirmation first: **Replace** deletes this device's data and downloads the server's; **Cancel** leaves the device unconnected and unchanged.
3. A connected device syncs at start, when it returns to the foreground, a few seconds after a change, every 5 minutes while open, and with **Sync now**. It shows when it last synced and why the last sync failed, if it did.
4. **Disconnect** forgets the token and keeps the local data. Connecting again asks for the confirmation again if the server has data.

The address and token are stored in the device's local settings and are never synced. A device and the server must have the same schema version; otherwise syncing waits ("different schema version") until the app or the server is updated.

To check sync by hand, create an area in Plan → Areas on one device and watch it appear on the other.

## Desktop builds

`npm run desktop:build` writes the packages to `src-tauri/target/release/bundle/`:

- `deb/Orbit_<version>_amd64.deb`: install with `sudo dpkg -i <file>`; Orbit then appears in the application launcher.
- `appimage/Orbit_<version>_amd64.AppImage`: runs without installing (`chmod +x` first).

Development runs (`npm run desktop`) are named **Orbit Dev** with the identifier `dev.neopw.orbit.dev`, so they keep their own data (`~/.local/share/dev.neopw.orbit.dev`) and can run next to the installed release (`dev.neopw.orbit`).

The version lives in `package.json`; the desktop app reads it from there.

**Tray and notifications.** Closing the window keeps Orbit running with an icon in the system tray (**Open Orbit**, **Quit**), so reminders and the focus timer keep working; on GNOME the tray needs the AppIndicator extension. Reminders (habits, deadlines, weekly review) and the end of a focus session are shown as desktop notifications while Orbit runs; reminders missed while it was not running are not shown later. Clicking a notification opens its screen, which needs a notification daemon with action support (GNOME, KDE and most others); without it the notification still shows. The browser build shows no notifications, but plays the focus-end sound.
