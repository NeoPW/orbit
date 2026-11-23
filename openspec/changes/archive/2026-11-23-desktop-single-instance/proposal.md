# Proposal

## Why

Closing Orbit's window hides it to the tray, which is wanted (reminders and the focus timer keep working). But starting Orbit again from the launcher then starts a second process with its own tray icon and its own database connection, instead of bringing back the window that is already there. Over a day this leaves several Orbits running and several icons in the tray. Usage feedback calls this out as clutter.

## What Changes

- **One desktop Orbit at a time.** Starting the desktop app while it already runs SHALL NOT start a second app. The running one shows its window (unhidden, unminimised, focused) on the page it was on, and the new start ends.
- **Release and development stay separate.** "Orbit Dev" (its own application identity, see "Development builds beside the release") counts as a different app: a development run starts next to a running release, and the other way round. Two development runs at the same time are also prevented.
- The `.deb` install and the AppImage share the release identity, so they count as the same app.
- `docs/SPEC.md` §2 (Tech stack), which mentions the tray, gains one sentence that only one desktop Orbit runs at a time.

**Out of scope:**
- Quitting on close, or a setting to choose between hiding and quitting.
- Passing anything from the second start to the running app (command-line arguments, deep links, opening a specific page).
- Android and the browser build. Android already keeps one instance per app, and a browser can have several tabs open, as today.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `app-platforms`: a new requirement "Single desktop instance". "Keeps running in the tray" and "Development builds beside the release" are not changed.

## Impact

- `src-tauri/src/lib.rs`: register the single-instance plugin first on the desktop builder; its callback reuses `notify::show_main_window`.
- `src-tauri/Cargo.toml`: new desktop-only dependency `tauri-plugin-single-instance` (see design.md).
- No frontend, database, sync or migration changes.
