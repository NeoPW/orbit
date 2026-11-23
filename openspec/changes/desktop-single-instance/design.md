# Design

## Context

The desktop app (`src-tauri/src/lib.rs`) sets up the database, the window size and the tray, and hides the main window on close (`notify::on_window_event`). `notify::show_main_window` already shows, unminimises and focuses the main window; the tray uses it. Nothing stops a second process from starting, so each launcher start adds a process, a tray icon and a second SQLite connection to the same database file.

The release identifier is `dev.neopw.orbit` (`tauri.conf.json`); development runs use `dev.neopw.orbit.dev` (`tauri.dev.conf.json`).

## Goals / Non-Goals

**Goals:**
- A second start hands over to the running app and exits before it opens the database, a window or a tray icon.

**Non-Goals:**
- Forwarding command-line arguments or deep links to the running app (the callback ignores them).
- Any change on Android, where the plugin is not built.

## Decisions

### Use `tauri-plugin-single-instance`
New package: **`tauri-plugin-single-instance` (2.x)**, the official Tauri plugin for exactly this. On Linux it claims a D-Bus name derived from the app identifier; a second start finds the name taken, calls the running app's callback and exits.

Alternatives considered:
- A lock file or socket written by hand: has to handle stale locks after a crash and a message channel to the running app, which the plugin already does.
- Doing nothing in Rust and relying on the launcher (`SingleMainWindow` in the `.desktop` file): only some desktops honour it, and it doesn't cover the AppImage.

It goes in the desktop-only `[target.'cfg(not(any(target_os = "android", target_os = "ios")))'.dependencies]` section of `Cargo.toml`, next to `notify-rust`.

### Register it first, under `#[cfg(desktop)]`
The plugin must be the first plugin on the builder, so the second process exits before `setup` runs (no database open, no tray). Its callback calls the existing `notify::show_main_window(app)`, so a second start behaves like clicking the tray icon. The window keeps its page because hiding never unloads the webview.

### Dev and release separated by identifier
The D-Bus name comes from the identifier, so "Orbit Dev" (`dev.neopw.orbit.dev`) and the release (`dev.neopw.orbit`) never see each other. The `.deb` and the AppImage share the release identifier and so count as one app; this is intended (one database, see "Development builds beside the release").

## Risks / Trade-offs

- [No D-Bus session bus (unusual desktop, some sandboxes)] → the plugin can't claim the name. Orbit should then still start normally, without the single-instance guarantee. Verify this during apply (start with `DBUS_SESSION_BUS_ADDRESS` unset); if the plugin fails hard instead, log and carry on without it.
- [A second start of `npm run desktop` while one runs] → it already fails at the Vite port before the app starts; that stays as it is. The dev scenario is checked by starting the built dev binary a second time.
- [Plugin must be registered first] → a later refactor that adds a plugin above it would break the guarantee. Leave a comment at the registration.
