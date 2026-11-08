# Tasks

## 1. Popup

- [x] 1.1 Move the content of `src/features/tasks/ui/TaskPage.tsx` (header with actions, details, log, edit sheet and delete confirmation) into `TaskDetails.tsx`, with an `onDeleted` callback. `TaskPage` renders it and keeps its current navigation after a delete.
  - Verify: the task page looks and works as before (browser), and `npx vitest run src/features/tasks` passes.
- [x] 1.2 Add `src/features/tasks/ui/TaskPopup.tsx` and `.module.css`:
  - a provider with `useOpenTask()`, rendered in `src/app/Shell.tsx` next to `AppSheets`
  - a modal `<dialog>` centred over the screen (full screen below 640 px) with the title, a close button, "Open page" and `TaskDetails`
  - closing: `Esc` (native cancel, so a sheet on top closes first), the close button, a backdrop click and any route change; a delete closes it with "Task deleted"
  - Verify: the scenarios of "Task popup", checked in the browser.

## 2. Where it opens

- [x] 2.1 Use `useOpenTask` in `src/features/home/ui/HomeScreen.tsx`:
  - To do, through a new optional `onOpen` on `TaskRow.tsx`
  - Done today and the project cards' next steps
  - `Enter` on a highlighted task
  - Verify: the scenarios of "Open tasks on Home" and "Open highlighted", checked in the browser.
- [x] 2.2 Make the popup the default of `TaskRow` (project detail, Plan and goal pages), and use `useOpenTask` for the other task lists:
  - Plan's goal tasks, the goal page and the review's projects step (`src/features/review/ui/ProjectsStep.tsx`)
  - the completed tasks in `src/features/review/ui/WeekSummaryView.tsx`
  - Find them with `grep -rn "name: 'task'" src`; only the palette, "Open page" and redirects keep navigating.
  - Verify: in the browser, a task opens in the popup from Plan, a project, a goal, the review step and the week summary.
- [x] 2.3 Open task blocks in the popup in `src/features/timeline/ui/DayTimeline.tsx` (`openTarget` for tasks). Project and goal blocks keep opening their pages.
  - Verify: "Open the task" on Home and in the week summary, checked in the browser.

## 3. Esc goes back

- [x] 3.1 On project, goal and task pages, make `Esc` go back in `src/app/shortcuts/` (`keys.ts`: a new `go-back` action for the detail scope; `ShortcutProvider.tsx`):
  - With an earlier in-app history entry, `history.back()`; otherwise navigate to Plan.
  - Nothing happens while a field has focus or a dialog is open.
  - Verify: tests in `keys.test.ts` for the matcher, and the scenarios "Back to Home", "Popup first" and "Opened by address" checked in the browser.

## 4. Docs and verification

- [x] 4.1 Update `docs/SPEC.md`: §6.1, §6.2, §6.3, §6.4 and §6.5 (tasks open in the popup), and the keyboard section (`Enter` and `Esc` back).
- [x] 4.2 Run `npm run check`.
- [x] 4.3 Verify in the browser (desktop and phone width) and in the desktop app:
  - `Esc`, the close button and a click beside the popup close it
  - `Esc` in the edit sheet keeps the popup open
  - Complete, Delete, "Open page" and the project link work
  - the popup closes on sidebar navigation
  - `Esc` goes back from project, goal and task pages
