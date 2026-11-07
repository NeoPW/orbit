# Tasks

## 1. Shortcut core

- [x] 1.1 Shortcut table and `matchShortcut` in `src/app/shortcuts/keys.ts` (global, Home To do and focus mode contexts; not while typing, in a dialog or with Ctrl/Alt/Meta except Ctrl+K; Space/Enter left to buttons and links); tests in `keys.test.ts` for the "Shortcuts only when not typing" scenarios and the key mapping.
- [x] 1.2 `AppSheets` context and host in `src/app/shortcuts/AppSheets.tsx` (task, log, project, goal, habit, area) and the focus-field request bus in `src/app/shortcuts/requests.ts`.
- [x] 1.3 `ShortcutProvider` in `src/app/shortcuts/ShortcutProvider.tsx`, mounted in `src/app/Shell.tsx`: T, L, F (field or focus mode), Shift+H/P/R/S, `?`, Ctrl+K; `FocusPanel.tsx` focuses its field on request.

## 2. Overlay and hints

- [x] 2.1 Shortcut overlay `src/app/shortcuts/ShortcutOverlay.tsx` (grouped from the table, `?` and Esc close).
- [x] 2.2 Shortcut hints in tooltips: "New task (T)" and "Log work (L)" on Home (`HomeScreen.tsx`), the sidebar entries (`src/app/Sidebar.tsx`), Pause/Resume/Complete/Discard/Time limit in `FocusMode.tsx`.

## 3. Home To do and focus mode

- [x] 3.1 To do highlight and keys in `src/features/home/ui/HomeScreen.tsx` and a `highlighted` row style in `src/features/tasks/ui/TaskRow.tsx` (+ `.module.css`): J/K/arrows, Space start, X complete, Enter open, 1–9 start; clear on click elsewhere.
- [x] 3.2 `stepLimit` in `src/features/timer/domain/timer.ts` with tests for "Raise the limit", "Lower to no limit" and "Plus without a limit".
- [x] 3.3 Focus mode keys in `src/features/timer/ui/FocusMode.tsx` (Space, Enter, Delete, L, +/−) and an externally openable menu in `TimeLimit.tsx`; complete and limit requests from the palette.

## 4. Command palette

- [x] 4.1 Entries and filter in `src/features/palette/entries.ts` (create, go to, focus incl. free text last, session only with a session, themes, sync only when connected; max 50); tests in `entries.test.ts` for the palette scenarios.
- [x] 4.2 `src/features/palette/CommandPalette.tsx` (+ `.module.css`): dialog with search field and listbox, arrows/Enter/click/Esc, kind and shortcut per entry; loads its data when opened; runs entries through `navigate`, `AppSheets`, `useStartFocus`, the quick-start plan, the session functions, the theme setting and `syncNow`.
- [x] 4.3 Open the palette with Ctrl+K from `ShortcutProvider` (also from a text field, not over a dialog).

## 5. Docs and verification

- [x] 5.1 Update `docs/SPEC.md` §6.1 (To do keys, focus mode keys) and §6.7 (global shortcuts, overlay, command palette).
- [x] 5.2 Run `npm run check`; it must pass.
- [ ] 5.3 Verify in the desktop app (WebKitGTK) and the browser: every global shortcut, typing letters in fields does nothing else, To do keys, focus mode keys, the palette's create, go to, focus (also `# project`), session, theme and sync entries; the phone layout is unchanged.
