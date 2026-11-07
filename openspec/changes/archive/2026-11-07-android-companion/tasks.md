# Tasks

Run under Node 24 (`fnm use`). Each group ends with `npx tsc --noEmit` and its own tests passing; the full `npm run check` runs once, in 5.1.

## 1. Android build

- [x] 1.1 Set up the toolchain on this machine (Android SDK platform and build tools, NDK, `ANDROID_HOME`/`NDK_HOME`, `rustup target add aarch64-linux-android x86_64-linux-android`), run `npm run tauri android init`, and add the scripts `android` (`tauri android dev`) and `android:build` (debug APK) to `package.json`; list the setup in `CLAUDE.md` commands. Commit `src-tauri/gen/android` with a `.gitignore` for `.gradle`, `build/` and `local.properties`.
- [x] 1.2 Gate the desktop Rust code with `#[cfg(desktop)]` in `src-tauri/src/lib.rs` and `notify.rs` (tray, click events, `show_notification`, window fitting), move `notify-rust` and the `tray-icon` feature to the desktop-only dependencies in `src-tauri/Cargo.toml`, and make sure `npm run desktop` still works. Build a debug APK and start it on an emulator or phone ("Install and start", "Android app works offline").
- [x] 1.3 Android identity: app name "Orbit" and the Orbit icon as launcher icons (`gen/android` mipmaps from `src-tauri/icons`), `viewport-fit=cover` in `index.html`, and a theme/background colour for the system bars that matches the app.
- [x] 1.4 Add `android` to `Platform` in `src/platform/platform.ts` (`detectPlatform(userAgent)`), keep the desktop-only modules behind `platform === 'desktop'`, and test "Android platform", "Desktop and browser unchanged" in `platform.test.ts`.

## 2. Phone layout

- [x] 2.1 Add `useIsPhone()` (`src/core/ui/useIsPhone.ts`, `matchMedia` under 640 px) with a test of its pure part, and the `today` route in `src/core/routing/routes.ts` (wide windows redirect it to Home) with its route test.
- [x] 2.2 Add `src/app/BottomNav.tsx` (+ CSS) with Home, Today and Settings and the safe-area padding, and let `src/app/Shell.tsx` use it instead of the `Sidebar` on the phone, without navigation in focus mode. Check "Narrow window", "Wide window", "Switch screen" and "Focus mode without navigation" in the browser at 390 px and 1280 px.
- [x] 2.3 Touch sizes under 640 px: at least 44 px for buttons, checkboxes, `ListRow` and the task start button (always visible, no hover rule) in `Button`, `Checkbox`, `ListRow`, `TaskRow` CSS; the `Sheet` fills the screen. Check "Touch targets" in the browser.
- [x] 2.4 Home on the phone in `src/features/home/ui/HomeScreen.tsx` and its CSS: one column (focus panel, habits, To do, Done today), no Today tile and no active projects, and a quick-add button next to the date that opens `TaskSheet` (Enter saves a title-only task). Check "Home order", "Complete a task" and "Add by title" in the browser.

## 3. Today screen and focus

- [x] 3.1 Add `shiftDay(day, delta, today)` in `src/features/timeline/domain/day-timeline.ts` (never beyond today) with tests ("Not beyond today", "Previous day by button").
- [x] 3.2 Add `src/features/timeline/ui/TodayScreen.tsx` (+ CSS): heading with weekday and date, previous/next buttons, swipe on the timeline (60 px, mostly horizontal), `loadTimeline` for the shown day, live through `useLiveQuery`, and register it for the `today` route. Check "Open Today", "Previous day by button", "Swipe to the previous day" (touch emulation) and "Open a block" in the browser.
- [x] 3.3 Focus on the phone: `FocusPanel`, the stop dialog and `FocusMode` fit a 390 px screen (no horizontal overflow, readable timer, dialog buttons reachable above the keyboard). Check "Start on the phone" and "Stop on the phone" in the browser at 390 px.

## 4. Sync and verification on a device

- [x] 4.1 Make the Settings sync panel usable on the phone (full-width fields, paste of the token, status text) and check that returning to the app triggers a sync on Android (`visibilitychange`); add a test only if a pure part changes. Check "Connect to the server" against the deployed server.
- [x] 4.2 Update `docs/SPEC.md` (§2 platforms table, §9 milestone 6, §10: Tauri mobile chosen; phone Home, Today screen) and `README.md` if it lists the platforms.

## 5. Final verification

- [x] 5.1 Run `npm run check`; it must pass, and `npm run desktop` still starts.
- [x] 5.2 Verify on a phone or emulator with the debug APK: install, offline start, connect to the deployed server, complete a task, quick add a task, start and stop a focus session (also with the screen off), Today with swipe, and that the desktop shows the same data after syncing.
