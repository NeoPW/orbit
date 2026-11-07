# Proposal

## Why

Daily use on the desktop still needs the mouse for almost everything: creating a task, logging work, switching screens, starting a session on a To do item, pausing and completing in focus mode. Orbit is used many times a day, so the common actions should be one key away, and everything else reachable from one searchable command palette.

## What Changes

- **Global shortcuts** (desktop and browser, never while typing in a field or while a dialog or sheet is open): `T` new task, `F` the focus field on Home (or focus mode while a session exists), `L` log work, `Shift+H` Home, `Shift+P` Plan, `Shift+R` Review, `Shift+S` Settings, `?` an overlay listing all shortcuts, `Ctrl+K` the command palette. New task and Log work open as sheets over the current screen.
- **To do list on Home:** `J`/`K` or the arrow keys move a highlight; `Space` starts focus on the highlighted task, `X` completes it, `Enter` opens it; `1`–`9` start focus on the 1st–9th To do task directly.
- **Focus mode:** `Space` pause/resume, `Enter` complete (opens the dialog, where `Enter` confirms), `Esc` leave (unchanged), `Delete` discard (with the confirmation while running), `L` opens the time limit menu, `+`/`−` raise or lower the limit by 5 minutes.
- **Command palette (`Ctrl+K`)** filtered by typing: create a task, project, goal, habit or area and log work; go to Home, Plan, Review, Settings or any project, goal or task by name; start focus on any open task, active habit or active project, also with `title # project` like Home's field; while a session exists pause/resume, complete and set the limit; switch the theme and sync now. Each entry shows its shortcut.
- **Hints:** buttons and navigation entries with a shortcut show it in their tooltip, for example "New task (T)".

Out of scope: a system-wide hotkey that works while Orbit is in the background (needs a Tauri plugin; later), shortcuts on the phone (no keyboard), customising shortcuts, keyboard navigation of lists other than Home's To do.

The user chose one change for this, although it is larger than the usual size (two new capabilities, about 15 tasks).

References: docs/SPEC.md §6.1 (Home, focus mode), §6.7 (Design and interaction: keyboard use is first-class).

## Capabilities

### New Capabilities

- `keyboard-shortcuts`: the global shortcuts, when they are active, the shortcut overlay and hints, the To do list keys on Home and the focus mode keys.
- `command-palette`: the `Ctrl+K` palette, its entries (create, go to, focus, session, theme, sync) and how it filters and runs them.

### Modified Capabilities

None. Existing behaviour stays; the shortcuts and the palette add new ways to reach it.

## Impact

- New: `src/app/shortcuts/` (key matching as a pure function, the global listener, the overlay, an app-level sheet host for New task and Log work), `src/features/palette/` (entries, filtering, the palette dialog).
- Changed: `src/app/Shell.tsx` (listener, sheet host, palette, overlay), `src/features/home/ui/HomeScreen.tsx` and `src/features/tasks/ui/TaskRow.tsx` (highlight and keys), `src/features/timer/ui/FocusMode.tsx` and `TimeLimit.tsx` (keys, menu opened from outside), `src/features/timer/ui/FocusPanel.tsx` (focus request), `src/app/Sidebar.tsx` and buttons with shortcuts (tooltips).
- Docs: `docs/SPEC.md` §6.1, §6.7.
- No schema change, no new packages.
