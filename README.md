# orbit

Personal, local-first app for goals, projects, tasks, habits, focused work and a weekly review. A desktop app first (works offline), with a browser build of the same app; a small Android companion follows later.

- Product spec: `docs/SPEC.md`
- Implemented behavior: `openspec/specs/`
- Work in progress: `openspec/changes/`

The Flutter version of the app is kept under the git tag `flutter-final`.

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

## Desktop builds

`npm run desktop:build` writes the packages to `src-tauri/target/release/bundle/`:

- `deb/Orbit_<version>_amd64.deb`: install with `sudo dpkg -i <file>`; Orbit then appears in the application launcher.
- `appimage/Orbit_<version>_amd64.AppImage`: runs without installing (`chmod +x` first).

Development runs (`npm run desktop`) are named **Orbit Dev** with the identifier `dev.neopw.orbit.dev`, so they keep their own data (`~/.local/share/dev.neopw.orbit.dev`) and can run next to the installed release (`dev.neopw.orbit`).

The version lives in `package.json`; the desktop app reads it from there.
