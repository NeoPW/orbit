# Tasks

## 1. Prerequisites

- [x] 1.1 (User, manual) Install the Rust toolchain with rustup (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`) and the Tauri Linux libraries (`sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev`). Verify: `cargo --version` prints a version, and `pkg-config --modversion webkit2gtk-4.1` prints a version.

## 2. Remove the Flutter app

- [x] 2.1 Tag the current `main` HEAD as `flutter-final` (local tag only), and copy `web/icons/Icon-512.png` to `assets/icon/orbit.png`. Verify: `git tag -l flutter-final` lists the tag, and `file assets/icon/orbit.png` shows a 512 × 512 PNG.
- [x] 2.2 Delete `lib/`, `test/`, `android/`, `web/`, `drift_schemas/`, `supabase/`, `supabase.json`, `supabase.example.json`, `pubspec.yaml`, `pubspec.lock`, `analysis_options.yaml`, `build.yaml`, `orbit.iml`, `tool/` and `docs/milestone-1-foundation.md`, plus the untracked `build/` and `.dart_tool/`. Replace the Flutter entries in `.gitignore` with Node, Vite, Rust and Tauri ones (`node_modules/`, `dist/`, `src-tauri/target/`, `src-tauri/gen/`). Keep `assets/`. Commit as `chore: remove the flutter app`. Verify: `git ls-files | grep -E '\.dart$|pubspec|supabase'` prints nothing, and `assets/fonts`, `assets/space` and `assets/icon` still exist.

## 3. App skeleton

- [x] 3.1 Scaffold the frontend (design: folder layout): `package.json` (name `orbit`, version `0.1.0`, private), `index.html` (title "Orbit", favicon from `assets/icon/orbit.png`), `vite.config.ts` (React plugin, fixed dev port 1420 with `strictPort`, `src-tauri/` ignored by the watcher), `tsconfig.json` in strict mode, `src/main.tsx`, `src/App.tsx` (a placeholder that shows "Orbit"), and empty `src/core/` and `src/features/` (with `.gitkeep`). Verify: `npm run build` writes `dist/`, and `npm run dev` serves a page titled "Orbit" with the Orbit favicon.
- [x] 3.2 Add the quality tooling (design: quality tooling): `eslint.config.js` (typescript-eslint, react-hooks), Vitest configured in `vite.config.ts`, and the scripts `typecheck`, `lint`, `test` (`vitest run --passWithNoTests`) and `check` (all three). Verify: `npm run check` passes.
- [x] 3.3 Add the Tauri 2 shell in `src-tauri/` (`Cargo.toml`, `build.rs`, `src/main.rs`, `src/lib.rs`, `capabilities/default.json`, `tauri.conf.json`): product name "Orbit", identifier `dev.neopw.orbit`, version from `package.json`, one window titled "Orbit" at 1280 × 800, minimum 800 × 600, resizable; dev URL `http://localhost:1420`, frontend dist `../dist`, bundle targets `deb` and `appimage`. Generate `src-tauri/icons/` with `npx tauri icon assets/icon/orbit.png`. Verify: `npx tauri build --debug --bundles deb` succeeds.
- [x] 3.4 Add `src-tauri/tauri.dev.conf.json` (product name and window title "Orbit Dev", identifier `dev.neopw.orbit.dev`) and the scripts `desktop` (`tauri dev --config src-tauri/tauri.dev.conf.json`) and `desktop:build` (`tauri build`). Verify: `npm run desktop` opens a window titled "Orbit Dev" showing the app, and its webview data is created under `~/.local/share/dev.neopw.orbit.dev`, not `~/.local/share/dev.neopw.orbit`.
- [x] 3.5 Rewrite `README.md` (what Orbit is, the stack, the one-time setup from 1.1, a commands table) and the Commands and Token budget sections of `CLAUDE.md` (`npm run desktop`, `npm run dev`, `npm run desktop:build`, `npm run check`, single tests with `npx vitest run <paths>`; remove the Flutter, build_runner, release and deploy commands; keep the Sonnet/Opus advice). Verify: every command in both files runs as written.

## 4. Platform detection

- [x] 4.1 Add `src/platform/platform.ts` (design: platform detection) exporting the platform (`'desktop' | 'browser'`) decided with `isTauri()`, and show it in the placeholder in `src/App.tsx`. Add `src/platform/platform.test.ts` covering both spec scenarios by stubbing what `isTauri()` checks. Verify: `npx vitest run src/platform` passes; `npm run desktop` shows "desktop", and `npm run dev` in Chrome shows "browser" with no console errors.

## 5. Product spec and project context

- [x] 5.1 Rewrite the `context` in `openspec/config.yaml` for the new stack (Tauri 2, React, TypeScript; folder layout and layering from design.md; pure domain functions with Vitest tests; the existing data, date and UI conventions that still apply, without Flutter widget names), keeping it short. In `rules`, replace `flutter analyze` with `npm run check` and "verify the change on Android and in Chrome" with "verify the change in the desktop app and in the browser". Verify: `openspec instructions proposal --change rebuild-foundation --json` still runs and shows the new context, and `grep -i flutter openspec/config.yaml` prints nothing.
- [x] 5.2 Update `docs/SPEC.md` §1 (goals: desktop first, offline, Android companion later), §2 (tech stack table and platform notes), §7 (sync with the Cloudflare Worker and D1, token login), §8 (notifications on the desktop) and §9/§10 (milestones become the rebuild order from proposal.md; open questions: solar system placement, Android technology), following design.md (product decisions). Verify: `grep -inE 'flutter|dart|drift|riverpod|supabase' docs/SPEC.md` finds nothing in these sections.
- [x] 5.3 Update `docs/SPEC.md` §3–§6 with the product decisions from design.md: data model (`is_next_step`, task `importance`, `planned_minutes`, `notes`, no `next_step_task_id`), derived logic (task rank, next-step prompt only after the last next step), Home, focus mode, Plan and Review. Verify: each bullet under design.md "Product decisions written into docs/SPEC.md" maps to a statement in SPEC.md, and `grep -n 'next_step_task_id\|solar system' docs/SPEC.md` only shows the open question in §10.

## 6. Verification

- [x] 6.1 Run `npm run check` and `npm run build`. Serve the build with `npx vite preview` and open it in Chrome and in Firefox. Verify: checks pass; in both browsers the tab shows "Orbit" with the Orbit icon, the app shows "browser", and the console has no errors.
- [x] 6.2 Run `npm run desktop:build`. Install the `.deb` (`sudo dpkg -i …`, user) and start Orbit from the launcher; then start the AppImage. Verify: the launcher shows "Orbit" with the Orbit icon; the window is titled "Orbit", opens at 1280 × 800 and stops shrinking at 800 × 600; with the network turned off the app starts and looks the same; a development run (`npm run desktop`) can run at the same time without using `~/.local/share/dev.neopw.orbit`. Commit the skeleton as `feat: rebuild orbit on tauri and react`.
