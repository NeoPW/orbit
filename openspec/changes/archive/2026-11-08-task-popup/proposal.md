# Proposal

## Why

Clicking a task opens its task page. From Home that switches to the Plan tab, and anywhere else it means leaving the list you were working in, just to look at a task. A popup over the current screen keeps the user where they are (docs/SPEC.md §6.1 Home, §6.3 Task page).

The change touches many specs, but each with a small edit (the user chose one change over a split).

## What Changes

- **Task popup:** a popup in the middle of the screen over the current screen. The tab and the address don't change.
  - **Content:** everything the task page shows:
    - title, chips (project, status, next step, deadline)
    - notes
    - due date, importance and assignment
    - Complete / Reopen, Start focus, Edit, Delete and Mark as next step
    - the log, with its total and "Log work"
  - **Full page:** an "Open page" button leads to the full task page.
  - **Closing:**
    - `Esc`, the close button or a click beside the popup close it.
    - `Esc` closes only the topmost layer: with the edit sheet or a confirmation open on top, it closes that first.
    - Deleting the task closes the popup and shows "Task deleted".
    - Any navigation closes it: opening the assigned project or goal, "Open page", or the sidebar.
  - **Phone:** the popup fills the screen, like the sheets.
- **Shared content and opener:** the task page and the popup show the same content. One app-wide opener lets any screen open the popup, in the same way shortcuts and the palette already open sheets.
- **Opened from:**
  - Home: To do, Done today and the next steps in the project cards
  - task rows on the Plan, project and goal pages and in the review's projects step
  - the completed tasks of the week summary
  - task blocks in every day timeline: Home, the phone's Today screen and the week summary
  - `Enter` on a highlighted To do task
- **`Esc` goes back on detail pages:** on a project, goal or task page, `Esc` returns to the screen the page was opened from, or to Plan when the page was opened by its address.
  - A focused field, popup, sheet or dialog takes `Esc` first.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `tasks`: adds "Task popup".
- `home`: adds "Open tasks on Home" (To do, Done today and the project cards' next steps open the popup).
- `day-timeline`: "Open from a block" and "Today screen on the phone" open a task in the popup.
- `keyboard-shortcuts`:
  - In "To do list keys", `Enter` opens the popup.
  - Adds "Esc goes back on detail pages".
- `tasks`: "Task rows" open the popup, including in the review's projects step.
- `goals`: in "Tasks and habits on the goal page", a task opens the popup.
- `project-detail`: in "Next steps and open tasks in detail", a task opens the popup.
- `plan-overview`: in "Plan layout" and "Goals in Plan", a task opens the popup.
- `week-summary`: in "Completed tasks", a task opens the popup.

## Impact

- **Code:**
  - `src/features/tasks/ui/`: the content of `TaskPage.tsx` moves into `TaskDetails.tsx`, plus new `TaskPopup.tsx` (with its provider and `useOpenTask`) and its CSS.
  - `src/app/Shell.tsx`: wraps the screens in the provider.
  - `src/features/home/ui/HomeScreen.tsx`
  - `src/features/tasks/ui/TaskRow.tsx`: an optional `onOpen`.
  - `src/features/timeline/ui/DayTimeline.tsx`
  - `src/features/review/ui/WeekSummaryView.tsx` and `ProjectsStep.tsx`
  - the plan and goal screens that open tasks
  - `src/app/shortcuts/` (`Esc` back)
- **Data:** no schema or data change. No new dependencies.
- **Docs:** `docs/SPEC.md` §6.1, §6.3 and the keyboard section.

## Out of scope

- The command palette and `/tasks/<id>` addresses keep opening the task page.
- Projects keep their page.
- Keyboard shortcuts inside the popup, and keeping the popup in the address.
