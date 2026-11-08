# Tasks

## 1. Window

- [x] 1.1 Set `"maximized": true` on the main window in `src-tauri/tauri.conf.json` and `src-tauri/tauri.dev.conf.json`.
  - Verify: `npm run desktop` opens maximised (checked by the user).

## 2. Projects in the focus field

- [x] 2.1 In `src/features/timer/domain/quick-start.ts`, make `quickStartPlan` without `#` use the open task, else the habit, else the active project with that exact name.
  - Verify: tests in `quick-start.test.ts` for "Project name typed" and a task winning over a project of the same name.
- [x] 2.2 Suggest matching projects after tasks and habits without `#` in `QuickStartField.tsx`, marked "Project" with their colour. Picking one starts on the project (`FocusPanel.tsx` keeps a picked project).
  - Verify: "Project suggested without #" and "New standalone task", checked in the browser.

## 3. Start while paused

- [x] 3.1 In `src/features/timer/ui/FocusPanel.tsx` (and `.module.css`), while the session is paused show it compactly (title, "Paused", time, Resume, Complete, Focus mode) above the field and Start (`Idle`); starting replaces the paused session (`startTimer` already ends it).
  - Verify: "Paused session", "Start something else while paused" and "No field while running", checked in the browser.
- [x] 3.2 Make `F` open focus mode only while a session runs, and go to the field while paused, in `src/app/shortcuts/ShortcutProvider.tsx`.
  - Verify: "Focus field while paused", checked in the browser.

- [x] 3.3 Add `R` (resume) and `C` (complete) for the session on Home: matcher entries in `src/app/shortcuts/keys.ts` (home scope, listed in `SHORTCUTS`), a `sessionRequest` in `requests.ts` sent by `ShortcutProvider.tsx` only while a session exists, and handled by the paused and running panels in `FocusPanel.tsx`.
  - Verify: tests in `keys.test.ts`, and "Resume with R", "Complete with C" and "No session" checked in the browser.

- [x] 3.4 Add `P` (pause a running session) on Home in the same way (`keys.ts`, `ShortcutProvider.tsx`, `FocusPanel.tsx`).
  - Verify: a test in `keys.test.ts`, and "Pause with P" checked in the browser.

## 4. Docs and verification

- [x] 4.1 Update `docs/SPEC.md` §6.1 (the focus field suggests projects, the field while paused, `F`, `R` and `C`) and the desktop window.
- [x] 4.2 Run `npm run check`.
