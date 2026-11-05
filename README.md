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

## Desktop builds

`npm run desktop:build` writes the packages to `src-tauri/target/release/bundle/`:

- `deb/Orbit_<version>_amd64.deb`: install with `sudo dpkg -i <file>`; Orbit then appears in the application launcher.
- `appimage/Orbit_<version>_amd64.AppImage`: runs without installing (`chmod +x` first).

Development runs (`npm run desktop`) are named **Orbit Dev** with the identifier `dev.neopw.orbit.dev`, so they keep their own data (`~/.local/share/dev.neopw.orbit.dev`) and can run next to the installed release (`dev.neopw.orbit`).

The version lives in `package.json`; the desktop app reads it from there.
