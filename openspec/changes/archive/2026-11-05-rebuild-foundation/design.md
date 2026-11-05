# Design

## Context

The repo holds a complete Flutter app (about 34k lines of Dart, drift, Riverpod, Supabase sync). It is not in use, so nothing needs migrating. The development machine runs Linux with Node.js 22 and npm; it has no Rust toolchain and no WebKitGTK development libraries yet, both of which Tauri needs to build on Linux. The specs that describe Flutter-era behavior stay in place as the brief for the rebuild (see proposal.md, Out of scope).

## Goals / Non-Goals

**Goals:**
- A skeleton where `npm run tauri dev` opens the desktop app and `npm run dev` serves the same app to a browser.
- The folder layout and quality tooling every later change uses.
- A platform layer that later changes extend (database driver, tray, hotkey, notifications) without the app code checking the platform itself.

**Non-Goals:**
- Routing, state management, data fetching, styling approach and UI components: chosen in `app-shell` and `local-database`, where they are first needed.
- Any Tauri plugin beyond what opening a window needs.
- CI, auto-update and code signing of the desktop app.

## Decisions

### Tauri 2 with a Vite + React + TypeScript frontend
Tauri uses the system webview (WebKitGTK on Linux), so the app stays small and the frontend is plain web code that also runs in a browser. Electron was considered: it avoids Rust entirely but bundles Chromium (~150 MB) and offers nothing Orbit needs that Tauri lacks. Tauri 2 can also build Android apps, which keeps that path open for the companion app. React was chosen by the user; Vite is Tauri's default frontend build tool.

### One npm package at the root
`package.json` sits at the repo root with `src/` (frontend) and `src-tauri/` (Rust shell), the layout Tauri's tooling expects. The Cloudflare Worker added in `sync-server` decides there whether it becomes an npm workspace. npm is used because it is already installed; pnpm or bun would be one more tool for no real gain at this size.

### Folder layout
```
src/
  main.tsx, App.tsx     entry point and root component
  core/                 shared code (theme, db, components) — filled by later changes
  features/<feature>/   per feature: data/, domain/, ui/
  platform/             platform detection and, later, per-platform adapters
src-tauri/
  tauri.conf.json       release identity: "Orbit", dev.neopw.orbit
  tauri.dev.conf.json   dev identity: "Orbit Dev", dev.neopw.orbit.dev
  icons/                generated from the Orbit icon
assets/icon/orbit.png   source of the app icon (from web/icons/Icon-512.png)
```
This mirrors the feature-first structure of the Flutter app, so the existing conventions (UI → state → repositories → database, pure domain functions with tests) carry over with new names.

### Development identity through a merged config file
`npm run tauri dev` passes `--config src-tauri/tauri.dev.conf.json`, which overrides only `productName`, the window title and `identifier`. Tauri derives the app data directory from the identifier, so dev and release data stay apart automatically (spec: Development builds beside the release). The alternative, a build-time environment variable read in Rust, needs custom code for the same result.

### Platform detection
`src/platform/platform.ts` exposes `platform: 'desktop' | 'browser'`, decided once at startup with `isTauri()` from `@tauri-apps/api/core`. Later changes add adapters under `src/platform/` (for example the SQLite driver) and pick the implementation there, so feature code never asks which platform it is on. Desktop-only modules are loaded with dynamic `import()` only when the platform is desktop, so the browser build never touches Tauri APIs at startup.

### Quality tooling
- TypeScript in strict mode; `tsc --noEmit` is part of the check.
- ESLint (flat config) with `typescript-eslint` and `eslint-plugin-react-hooks`.
- Vitest for unit tests, configured through the Vite config so tests and app resolve modules the same way.
- `npm run check` runs typecheck, lint and tests; it is what tasks and the final verification run (replacing `flutter analyze` / `flutter test`). Single test files run with `npx vitest run <path>`.

Prettier is left out for now; ESLint covers correctness and the code base is small. It can be added in any later change.

### New packages
| Package | Why |
|---|---|
| `react`, `react-dom` | UI framework (user's choice) |
| `@tauri-apps/api` | Talk to the desktop shell; provides `isTauri()` |
| `@tauri-apps/cli` (dev) | Run and build the desktop app |
| `vite`, `@vitejs/plugin-react` (dev) | Dev server and build for both targets |
| `typescript` (dev) | Type checking |
| `vitest` (dev) | Unit tests |
| `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `globals` (dev) | Linting |

Versions: the current stable release of each at apply time, with exact versions recorded in `package-lock.json` and `Cargo.lock`.
Also `@types/react`, `@types/react-dom` and `@types/node` (dev) for typing.

Two deviations found during apply:
- **TypeScript is pinned to 6.0** (`~6.0`): the current typescript-eslint supports TypeScript below 6.1 only, not TypeScript 7 (the native port). Move to 7 once typescript-eslint supports it.
- **Node 24 is pinned in `.node-version`**: current Vite, Vitest and ESLint need Node 22.13 or newer, and the machine's default was 22.10. fnm picks the pinned version up; `package.json` declares `engines.node >= 22.13`.

### Fonts and assets bundled
Inter and Space Grotesk stay in `assets/fonts` and are served from the bundle, never from Google Fonts, to satisfy "Desktop app works offline". Using them in the UI is part of `app-shell`.

### Product decisions written into docs/SPEC.md
These were agreed with the user while planning the rebuild. `docs/SPEC.md` records them as the target; the feature changes turn them into spec deltas.

- **Platforms (§1, §2)**: desktop app first, works fully offline; browser build of the same app; Android later as a small companion for viewing tasks and tracking time (Tauri mobile or native Kotlin, decided then).
- **Stack (§2)**: Tauri 2, React, TypeScript; SQLite with Drizzle (Tauri SQL plugin on desktop, SQLite WASM in OPFS in the browser); Cloudflare Worker + D1 as sync server, which also serves the browser build; one long secret token per device as the only login (no accounts, Cloudflare Access optional later).
- **Sync (§7)**: keeps the existing rules (local-first, last write wins by `updated_at`, soft deletes, IDs derived from natural keys for habit checks, reviews, the timer and notes), with the Worker in place of Supabase. The server stores rows and has no business logic.
- **Data model (§4)**:
  - `projects.next_step_task_id` removed; `tasks.is_next_step` (bool) added. A project can have several next steps. A flag per task survives concurrent edits under last-write-wins, a list on the project would not.
  - `tasks.importance` (1–5, nullable) added.
  - `timers.planned_minutes` (nullable) added.
  - New `notes` table: `target_type` (`project` | `goal`), `target_id`, `week_start` (Monday), `note`; one note per target and week, ID derived from those three.
- **Derived logic (§5)**:
  - Task rank = importance × urgency. Importance: the task's own, else its project's; goals have no importance, so a task of a goal or a standalone task without its own importance counts as 3. Urgency: from the task's due date, else its project's effective deadline, else its goal's end date, with the existing urgency scale.
  - Completing a next-step task asks "What's the next step?" only when it was the project's last open next step; otherwise it completes without a prompt.
- **Home (§6.1)**, desktop layout: a main column with today's date, the focus panel (pick a task or project, choose 25, 50 or 90 minutes or open-ended, start) and the running timer; below it, habits due today in their own row (not ranked); below that the to-do list: open next-step tasks of active projects plus open tasks outside projects, ranked by task rank. A compact project overview (active projects by score, with their next steps) sits in a side column. Upcoming deadlines, the solar system and the separate project and task sections are gone.
- **Focus mode (§6.1)**: starting focus opens a full-window view with only the task or project, its notes and a large timer. With a planned length, a desktop notification and a sound mark the end, and the timer keeps counting into overtime. Stopping asks "What did you get done?" (saved as the log entry's note), then runs the next-step prompt when the target was a next-step task that is now done.
- **Plan (§6.4)**: full redesign for desktop widths; no planets or solar system in Plan. The detailed layout is designed in its own change.
- **Review (§6.5)**: the review is the main place to update projects and goals: status, next steps, importance, deadline and measures, plus a weekly note per project and per goal, which builds a history shown on the project and goal pages.
- **Solar system (§10)**: kept, but where it appears is an open question, decided later.

## Risks / Trade-offs

- [WebKitGTK renders slightly differently from Chrome, and lags in some web APIs] → Check the desktop app, not only the browser, in every visual change; `local-database` must confirm that OPFS-based SQLite is not needed on the desktop (the desktop uses the native SQLite plugin).
- [Rust and the Tauri system libraries are a one-time setup that needs `sudo`] → Task 1 lists the exact commands for the user to run; nothing else needs root.
- [Specs describe behavior the code no longer has until the rebuild catches up] → Accepted; proposal.md states it, and each rebuild change brings its specs back in line.
- [Removing all requirements of `android-release` and `web-hosting` may leave empty spec files on archive] → Delete those two spec directories during archive if they remain.

## Migration Plan

1. Tag the current `main` as `flutter-final` (local tag; pushing it is the user's choice).
2. Delete the Flutter code in one commit, add the skeleton in the next, so the deletion is easy to review on its own.
3. Rollback: `git checkout flutter-final`. The live site and the Supabase project are not touched by this change.

## Open Questions

- Version number of the new app: start at `0.1.0` unless the user wants to continue the Flutter numbering. Changeable at any time without affecting specs or tasks.
