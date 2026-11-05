# Proposal

## Why

The Flutter app no longer fits how Orbit is meant to be used: the main place to work is the PC, offline, in a real desktop app, with the phone only as a small companion for tasks and time tracking. Flutter's web output feels foreign in a browser, Supabase pauses the free project after a few days without use, and Dart is not a language worth keeping for this project. The app is not in use, so it can be rebuilt from scratch without migrating data. This first change replaces the stack and records the product decisions the rebuild follows, so every later change builds on a correct spec.

## What Changes

- **BREAKING** Remove the Flutter app: `lib/`, `test/`, `android/`, `web/`, `pubspec.*`, drift schemas, the Supabase schema and configuration, and the Flutter build and deploy scripts. The last Flutter commit is tagged `flutter-final` first, so the old code stays one checkout away.
- **BREAKING** Retire the signed Android APK and the Cloudflare Pages deploy. Android returns later as a companion app (its own change); the web deploy returns with the sync server (§2 of `docs/SPEC.md`, change `sync-server`).
- Add the new skeleton: Tauri 2 desktop shell with a Vite + React + TypeScript frontend. The same frontend builds as a desktop app (Linux) and as a static site that runs in the browser.
- Add a small platform layer that tells the app whether it runs on the desktop or in the browser, so desktop-only features (tray, global hotkey, notifications, native SQLite) can be added behind it later.
- Add the quality tooling the rest of the rebuild relies on: strict TypeScript, ESLint, Vitest, and one `check` command that runs them.
- Update `docs/SPEC.md` for the rebuild:
  - §2 Tech stack: Tauri 2, React, TypeScript, SQLite with Drizzle (Tauri plugin on desktop, SQLite WASM in the browser), Cloudflare Worker + D1 for sync, one bearer token per device.
  - §1 Goals: desktop first and offline; Android becomes a later companion for tasks and time tracking.
  - §4/§5 Data model and derived logic: multiple next steps per project (`tasks.is_next_step`, `projects.next_step_task_id` removed), optional task importance and task rank (importance × urgency, inherited from project or goal), planned length on the timer, a generic weekly `notes` table for projects and goals.
  - §6 Screens: new desktop Home (focus mode, habits due today in their own row, ranked to-do list, compact project overview on the side), Plan redesigned for desktop without the solar system, Review as the main place to update projects and goals, with weekly notes.
  - §7 Sync, §8 Notifications, §9 Milestones (the rebuild order), §10 Open questions (where the solar system goes, Android technology).
- Update `openspec/config.yaml` (context and the rules that name Flutter tools), `CLAUDE.md`, `README.md` and `.gitignore` for the new stack.

## Capabilities

### New Capabilities

- `app-platforms`: the app as a desktop application (Linux bundle named Orbit, with its icon) and as a browser build from the same code, and how the app detects which of the two it runs on.

### Modified Capabilities

- `android-release`: removed. The Flutter APK build no longer exists; the Android companion app gets its own capability in a later change.
- `web-hosting`: removed. The Cloudflare Pages deploy of the Flutter build no longer exists; hosting returns as part of the sync server change.

## Out of scope

- Any feature of the app (Home, Plan, Review, tasks, habits, timer, …): each is rebuilt in its own later change, which also updates its spec where the behavior changes.
- The local database and schema (change `local-database`), sync and the Cloudflare Worker (change `sync-server`), navigation, theme and shared components (change `app-shell`).
- Updating the other specs that describe Flutter-era behavior (`local-database`, `sync`, `account`, `notifications`, `visual-design`, `app-shell`, `solar-system` and the feature specs). Until their rebuild changes land, `openspec/specs/` describes behavior the code does not have yet; the feature specs serve as the brief for the rebuild.
- Windows and macOS desktop builds.
- Taking down the live Flutter site at `orbit-neo.pages.dev` and deleting the Supabase project; that happens when the sync server replaces them.

## Impact

- Code: everything Flutter-specific is deleted; new `package.json`, `src/`, `src-tauri/`, `index.html`, Vite, TypeScript, ESLint and Vitest configuration.
- Tooling: Node.js (npm) and a Rust toolchain plus the Tauri Linux system libraries are needed to build the desktop app; Flutter is no longer needed.
- Docs and workflow: `docs/SPEC.md`, `openspec/config.yaml`, `CLAUDE.md`, `README.md`.
- Kept: `assets/fonts` and `assets/space` (reused by `app-shell` and the solar system later) and the Orbit icon, which becomes the desktop app icon.
