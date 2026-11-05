# Tasks

## 1. Logic (pure, tested)

- [x] 1.1 Add `src/core/routing/routes.ts`: `Route` union (home, plan, review, settings), `parsePath` (`/` and unknown → home with redirect) and `pathOf`. Test the "Unknown path" and "Root path" scenarios in `routes.test.ts`.
- [x] 1.2 Add `src/core/dates/format.ts` with `formatDate` and `formatDateRange` on `yyyy-mm-dd` strings. Test leading zeros and a range (`app-shell` "Date display format") in `format.test.ts`.
- [x] 1.3 Add `src/core/dates/deadline.ts` with `daysUntil`, `deadlineBadge` and `DEFAULT_LEAD_DAYS`. Test the four "Deadline badge text" scenarios plus "Tomorrow" in `deadline.test.ts`.
- [x] 1.4 Add `src/core/ui/messages/messenger.ts` (`createMessenger`: show, dismiss, pause, resume, action). With fake timers, test auto dismiss, pointer over (pause and resume restart 3 s), close, action, and replaced (full 3 s again) in `messenger.test.ts`.

## 2. Theme and base

- [x] 2.1 Run `npm install lucide-react`; `package.json` lists it.
- [x] 2.2 Add `src/core/ui/theme.css` with:
  - color, area, spacing, radius, type and motion tokens;
  - `@font-face` for Inter (400–700) and Space Grotesk from `assets/fonts/`;
  - base body and heading styles, `:focus-visible` ring, reduced-motion override.

  Import it in `src/main.tsx`. Check in DevTools that the fonts load from the bundle.
- [x] 2.3 Add the loading screen: night sky and planet inline in `index.html`, and the navy `backgroundColor` for the window in `src-tauri/tauri.conf.json`. Throttle the network in the browser and check there is no white screen while loading.

## 3. Shared components

- [x] 3.1 Add `Button` (primary, secondary, ghost, danger), `IconButton` (with accessible label and tooltip) and `TextField` (input and textarea, label, error) in `src/core/ui/components/` with CSS Modules. Check them in the gallery (3.5).
- [x] 3.2 Add `Chip` (status, area color accent), `ImportanceDots` (n of 5, accessible label), `DeadlineBadge` (uses `deadlineBadge`), `EmptyState` (icon, line, action) and `PageHeader` (Space Grotesk title, actions). Check them in the gallery.
- [x] 3.3 Add `Sheet` (native `<dialog>`, right side, title, Save, optional Delete, scrolls; Enter submits, Escape and close discard) and `ConfirmDialog`. In the gallery, check "Enter saves", "Escape discards" and "Discard by closing".
- [x] 3.4 Add `MessageProvider`, `useMessages` and `MessageHost` in `src/core/ui/messages/`: top center, icon, line, action, close button, `role="status"`, pause on hover and focus. Check "Position" and "Survives closing a sheet" with a gallery button that saves a sheet and shows a message.
- [x] 3.5 Add the dev-only gallery at `/dev/components` (`src/app/dev/ComponentGallery.tsx`, routed only when `import.meta.env.DEV`). It shows every component from 3.1–3.4 in its states. `npm run build` must not include it; check that `dist/` has no gallery chunk.

## 4. Shell and screens

- [x] 4.1 Add `src/core/routing/useRoute.ts` (`useSyncExternalStore` over `popstate`, `navigate` with `pushState`, `replaceState` for redirects). Check by hand that "Back" and "Reload keeps destination" work in the browser.
- [x] 4.2 Add `src/app/AppRoot.tsx`, `ServicesContext` and `StartScreen`. They contain the database loading from `src/App.tsx`, without the start counter, and full-window messages for other tab and error. Replace `src/App.tsx` and update `src/main.tsx`. Check "Second tab" by opening a second tab, and "Failed start" by temporarily throwing in the open path.
- [x] 4.3 Add `src/app/Shell.tsx` and `Sidebar.tsx`:
  - Home, Plan, Review, and Settings at the foot, with lucide icons;
  - labels at ≥ 960 px, icons with tooltips below;
  - selected state, keyboard reachable;
  - storage warning banner and `MessageHost`.

  Check the "Wide window", "Narrow window", "Resize keeps destination" and "Keyboard" scenarios by resizing the browser.
- [x] 4.4 Add `src/features/{home,plan,review}/ui/*Screen.tsx` with `PageHeader` and an `EmptyState` (no "Coming soon"). `TestAreas` moves into the Plan screen and is restyled with shared components. Check "Placeholder destinations" on Review.
- [x] 4.5 Move the sync scheduler into `src/features/sync/ui/SyncRunner.tsx`, mounted in `AppRoot`, with context for state, `syncNow` and data version. Rework `SyncPanel` into the "Sync" section of `src/features/settings/ui/SettingsScreen.tsx` with shared components. Run `npx vitest run src/features/sync`, then check that a change made on Plan syncs while Settings is closed.

## 5. Docs and verification

- [x] 5.1 Update `docs/SPEC.md`: §6 now describes the sidebar navigation and paths, and §6.7 drops "redefined in the app shell change". Update the UI conventions note in `openspec/config.yaml`. Update `README.md` if it describes the start screen.
- [x] 5.2 Run `npm run check`; it must pass.
- [x] 5.3 Verify in `npm run dev` (Chrome and Firefox) and `npm run desktop`:
  - navigation, back, forward, reload, unknown path;
  - fonts offline, focus rings, messages, sheet;
  - Settings → Sync connect and Sync now, and the loading screen.

  Then build with `npm run desktop:build`, open `/plan` and reload to confirm the Tauri fallback (design risk).
