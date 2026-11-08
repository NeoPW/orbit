# Proposal

## Why

Two small usability gaps (docs/SPEC.md §6.1 Home, §2 Tech stack):
- The desktop window opens at 1280×800 and has to be enlarged by hand every time.
- Focus on a project can only be started from the focus field with the `# project` syntax. Typing a project's name suggests nothing, and Start then creates a task named like the project.

## What Changes

- **Maximised window:** the desktop window opens maximised, in both the release and the dev build. It is not fullscreen, so the title bar and the panel stay.
- **Projects in the focus field:** while typing without `#`, the focus field also suggests matching active projects, marked "Project" with their colour, after the matching tasks and habits.
  - Picking one, or typing an active project's exact name (when no open task or habit has that title), starts focus on the project. No task is created.
- **Start something else while paused:** while a session is paused, Home's focus panel shows it compactly (title, "Paused", time, Resume, Complete, Focus mode) with the text field and Start below.
  - Starting from the field ends the paused session as today's "One timer at a time" already describes: its time stays logged and its task stays open.
  - `F` puts the cursor in the field while paused, and opens focus mode only while a session runs.
  - On Home, `P` pauses a running session, `R` resumes a paused one and `C` opens the Complete dialog of the session.
- **New tasks (unchanged):** a new title still creates a task. This already exists ("Start with a new task") and is only confirmed by a scenario.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `work-timer`: "Start with a new task" also suggests and starts on projects without `#`.
- `work-timer`: "Focus panel on Home" offers the field while paused.
- `keyboard-shortcuts`:
  - In "Global shortcuts", `F` goes to the field while paused.
  - Adds "Session keys on Home" (`P` pause, `R` resume, `C` complete).
- `app-platforms`: adds "Window opens maximised".

## Impact

- **Config:** `src-tauri/tauri.conf.json` and `tauri.dev.conf.json` (`maximized`).
- **Code:**
  - `src/features/timer/domain/quick-start.ts` and its test
  - `src/features/timer/ui/QuickStartField.tsx` and `FocusPanel.tsx`
  - `src/features/timer/ui/FocusPanel.tsx` and `.module.css` (paused layout) and `src/app/shortcuts/ShortcutProvider.tsx` (`F`)
  - the command palette's "Focus: <text>" through `quickStartPlan`
- **Data:** no schema or data change.

## Out of scope

- Fullscreen mode, remembering the window size, and the phone.
