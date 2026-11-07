# Design

## Context

The app is a Tauri 2 shell around a React frontend. Data goes through `src/platform/db` (rusqlite via the `db_query`/`db_batch` commands on desktop), sync is a client in `src/features/sync` (it already syncs when the page becomes visible), and `src-tauri/src/lib.rs` is already marked `#[cfg_attr(mobile, tauri::mobile_entry_point)]`. Desktop-only Rust code sits in `notify.rs` (tray, `notify-rust`) and `fit_main_window_to_screen`. `src/platform/platform.ts` knows `desktop | browser`. The development machine has JDK 21 and an Android SDK folder (`~/Android/Sdk`) but no `ANDROID_HOME`, NDK or Rust Android targets set up yet.

## Goals / Non-Goals

**Goals:**
- One codebase: the phone runs the same React code, database code and sync client.
- The phone shows only what a companion needs: Home, Today, Settings.
- Notifications are not in this change, but nothing here blocks them.

**Non-Goals:**
- Native Kotlin screens, widget, tile, Play Store release (see the proposal).

## Decisions

### Tauri mobile, not a Kotlin rewrite
`tauri android init` generates the Android project in `src-tauri/gen/android` (committed apart from its local build output; see Risks). The existing `lib.rs` entry point is reused. Alternative: a native Kotlin app. Rejected for now: it would duplicate the database, sync and timeline code; the native pieces we will need later (alarms, ongoing notification) can be a small Tauri plugin in Kotlin.

### Desktop code behind `cfg(desktop)`
- `notify.rs` (tray, click events, `show_notification`) and `fit_main_window_to_screen` are compiled only with `#[cfg(desktop)]`; the `tray-icon` feature of `tauri` and `notify-rust` move to `[target.'cfg(not(any(target_os = "android", target_os = "ios")))'.dependencies]` so the Android build does not try to compile D-Bus code.
- The `show_notification` command and the notification click listener are registered only on desktop; the frontend already calls them through `src/platform/notify.ts` behind `platform === 'desktop'`, so Android gets a no-op until `android-notifications`.
- `db::open` uses `app_data_dir()`, which on Android is the app's private storage; `rusqlite` with `bundled` compiles with the NDK. No change to the schema.

### Platform detection
`Platform` becomes `'desktop' | 'android' | 'browser'`. `isTauri()` is true on both Tauri targets, so Android is told apart by `navigator.userAgent` containing "Android". No new package (`@tauri-apps/plugin-os` would be one) is added for a single check. `detectPlatform` takes the user agent as a parameter so the three results are unit tested.

### Phone layout by width, not by platform
`useIsPhone()` (in `src/core/ui/`) is a `matchMedia('(max-width: 639px)')` hook. The shell chooses `PhoneShell` (bottom navigation) or the sidebar shell from it, so a narrow browser window and the Android app behave the same and the layout can be tried in the browser. CSS that only changes dimensions uses the same breakpoint as a media query. The viewport meta gets `viewport-fit=cover` and the shell pads with `env(safe-area-inset-*)`.

### Bottom navigation and screens
`BottomNav` has Home, Today and Settings (routes `home`, a new `today`, `settings`). `today` is added to `routes.ts` and is only registered for the phone; on a wide window `/today` redirects to Home (the timeline is already there). Plan and review routes stay but are not linked on the phone; a typed address still opens them (no blocking). The task page and focus mode are reachable from Home; focus mode hides the navigation as it already hides the sidebar.

### Today screen
`TodayScreen` holds a `day` (local date, default today via `useToday`) and renders `DayTimeline` with one `TimelineDay` loaded by `loadTimeline` for that day (same query as `TodayTile`, with the day as a parameter). Pure `shiftDay(day, delta, today)` (tested) returns the new day and never goes beyond `today`. Swipe uses pointer events on the timeline container: a horizontal move over 60 px and mostly horizontal (|dx| > 2 x |dy|) changes the day; vertical scrolling is unaffected. The buttons stay as the accessible alternative.

### Home on the phone
`HomeScreen` renders its existing tiles in one column on the phone: the `TodayTile` and the active projects are left out below the breakpoint (the side column is dropped), `FocusPanel`, habits, To do and Done today stay. The compact To do row's start button is always visible on the phone (the hover rule is a desktop rule). Quick add is an icon button next to the date (the header's "New task" and "Log work" buttons give way to it on the phone) that opens the existing `TaskSheet`, which fills the screen on the phone and saves on Enter.

### Sync
No protocol change. The Settings sync panel (address and token) is reused. Android blocks cleartext HTTP, so the phone needs the HTTPS server (deployed worker); testing against the local `http://localhost:8787` would need `usesCleartextTraffic` and the PC's address, which is for development only and not enabled in the app.

## Risks / Trade-offs

- [Rust Android build is slow and needs the NDK on this machine] -> The first task sets it up and builds a debug APK before any UI work; if it fails, the rest waits.
- [The generated `gen/android` project is large] -> Commit it (Tauri's guidance for reproducible builds) but keep local build output (`.gradle`, `build/`, `local.properties`) out through its own `.gitignore`.
- [The phone's WebView is paused in the background] -> Nothing depends on timers running: the session counts from `started_at`, and sync runs on returning to the foreground. Reminders (a later change) need native alarms for this reason.
- [WebView differences on older Android versions] -> The minimum is the Tauri default (Android 7 / API 24); the timeline uses `color-mix`, so the app requires a current Android System WebView (Chrome 111+), which updates from the Play Store.
- [A single timer row for all devices] -> Starting on the phone replaces the desktop's session after a sync, as already specified.
