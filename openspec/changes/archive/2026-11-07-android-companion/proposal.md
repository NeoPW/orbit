# Proposal

## Why

Orbit's main use is at the desktop, but tasks, the running focus session and the day's work are most useful at hand: ticking a task off, starting a focus session or checking what was done today while away from the computer. `docs/SPEC.md` (§1, §2 "Android (later)", §9 milestone 6, §10) plans a small Android companion for tasks and time tracking. The sync client and server already exist, so a phone can be one more device of the same data. This is the first of two Android changes (notifications follow in `android-notifications`).

## What Changes

- **Android build:** the Tauri app builds for Android (a debug APK first, a signed release later), named "Orbit" with the Orbit icon, using the same React frontend, database code and sync client as the desktop app. Desktop-only Rust code (tray, desktop notifications, window sizing) is compiled only on desktop.
- **Platform:** the app reports `android` when it runs in the Android app (next to `desktop` and `browser`); desktop-only features stay off.
- **Phone layout:** below 640 px width the app shows a single column with a bottom navigation (Home, Today, Settings) instead of the sidebar, respects the system bars (safe areas), and has touch-sized controls. The same layout applies to a narrow browser window.
- **Home on the phone:** focus panel (start with the field, running session with Stop), habits due today, To do (complete a task, start focus, no hover needed), Done today, and a quick-add button for a new task.
- **Today screen:** the day timeline for one day with previous/next day buttons and a horizontal swipe.
- **Sync on the phone:** the existing Settings sync panel (server address and device token) works on the phone; sync runs on returning to the app.
- **Focus on the phone:** start and stop sessions as on desktop; the session keeps its start time while the app is in the background or closed.

## Capabilities

### New Capabilities

- `mobile-layout`: the phone layout of the app (bottom navigation, single column, safe areas, touch targets, which screens exist on the phone, quick add).

### Modified Capabilities

- `app-platforms`: an installable Android app and the `android` platform.
- `day-timeline`: one day with day navigation (buttons and swipe) on the phone.
- `work-timer`: starting and stopping a focus session on the phone, which keeps counting in the background.

## Out of scope

- Notifications of any kind (habit reminders at the habit's time, deadline reminders, the ongoing timer notification, the end of a session): the next change, `android-notifications`.
- Plan screens (goals, projects, areas, habits editing), the weekly review, measures, and the theme/example-data settings on the phone.
- Home-screen widget, quick-settings tile, share-sheet capture.
- Publishing: Play Store, a signed release build and auto-update (a debug APK installed with `adb` is enough for now).
- Changes to the database schema or the sync protocol.

## Impact

- **Code:**
  - `src-tauri/` (`lib.rs`, `notify.rs` gated with `cfg(desktop)`, `Cargo.toml`, a generated `gen/android` project, `tauri.conf.json`, capabilities), `package.json` scripts.
  - `src/platform/platform.ts`, a phone detection hook in `src/core/`, `src/app/Shell.tsx` and a new bottom navigation, `src/features/home/ui/HomeScreen*`, a new `src/features/timeline/ui/TodayScreen.tsx`, `src/features/timer/ui/FocusMode*`, `Sheet` and `TaskRow` touch sizes.
- **Dependencies:** no npm packages. Build tooling on the development machine: Android SDK platform and build tools, the NDK, JDK 21 and the Rust Android targets (`aarch64-linux-android`, `x86_64-linux-android` for the emulator).
- **Docs:** `docs/SPEC.md` (§2 platforms, §9 milestone 6, §10 decision: Tauri mobile), `CLAUDE.md` commands.
- **Server:** the phone needs the sync server over HTTPS (a deployed server); the local dev server on `http://localhost:8787` is not reachable from a phone.
