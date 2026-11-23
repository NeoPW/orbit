# Tasks

## 1. Single instance

- [x] 1.1 Add `tauri-plugin-single-instance` (2.x) to the desktop-only dependency section of `src-tauri/Cargo.toml` (next to `notify-rust`). Verify `cargo check --manifest-path src-tauri/Cargo.toml` passes and `Cargo.lock` gains the plugin.
- [x] 1.2 In `src-tauri/src/lib.rs`, register the plugin as the first plugin on the builder under `#[cfg(desktop)]`, with a callback that calls `notify::show_main_window` and ignores the arguments; add a comment that it must stay first. Verify `cargo check` passes and the Android build still compiles (`npm run android:build -- --target x86_64`, or at least `cargo check --target x86_64-linux-android` if the toolchain is set up).

## 2. Docs

- [x] 2.1 In `docs/SPEC.md` §2 (Tech stack, the desktop-only features line), add one sentence that only one desktop Orbit runs at a time and starting it again shows the running window. Verify by reading the section.

## 3. Verification

- [ ] 3.1 In the desktop app (`npm run desktop:build`, then start the built release binary): close the window to the tray on a non-Home page, start Orbit again, and check the window comes back on that page with one process (`pgrep -fc orbit`) and one tray icon; repeat with the window minimised ("Start again while hidden in the tray", "Start again while the window is open").
- [ ] 3.2 With the release running, start `npm run desktop` and check "Orbit Dev" opens its own window and tray icon; start the dev binary (`src-tauri/target/debug/orbit`) again and check the running "Orbit Dev" window is focused instead ("Development run next to the release", "Second development run").
- [ ] 3.3 Start the release with `DBUS_SESSION_BUS_ADDRESS` unset and check Orbit still opens (design.md risk); if it doesn't, make the plugin's failure non-fatal and note it in design.md.
- [ ] 3.4 Check the browser build still starts (`npm run dev`, no console errors), then run `npm run check` and fix any failures.
