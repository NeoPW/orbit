# Proposal

## Why

Home shows what to do, but not what already happened today (neither the work nor the tasks completed), and the weekly review lists work as totals only. A day view that plots the work done, coloured by project, makes the day (and the week) readable at a glance. While trying the app, the focus controls also needed fixes: the dropdown is the browser's unstyled native one, the default length should be open-ended, and 25/50 minutes should be 30/60 (`docs/SPEC.md` §5 Timer and focus, §6.1, §6.5).

## What Changes

- **Day timeline on Home:** a "Today" tile above "Active projects" in the side column. It shows the hours of the day vertically and plots the work already logged today as blocks.
  - A block for each log entry with a duration (focus sessions and tracked time), coloured like its project (a task's block takes its project's colour, a goal-only entry the goal's colour, anything else is neutral), showing what it was for, its project and its time range; never shorter than one line.
  - Entries without a duration (a completed task, a habit check) are small dots without text at their time; details on hover.
  - A running focus session is drawn as a live block up to the current time; a line marks "now".
  - Overlapping blocks sit side by side.
  - Clicking a block opens its task or project.
  - It is a view only: no planning of future time.
- **Days of the week in the review:** the same view for each day, as seven columns Monday–Sunday on one shared hour axis, in the week summary. It therefore appears in the review's default view, the guided review's look-back step, last week and every past review.
- **Focus defaults:**
  - The planned lengths are 30, 60 and 90 minutes or open-ended (instead of 25, 50 and 90).
  - Open-ended is the default; the last choice is remembered, including open-ended. A stored 25 or 50 becomes 30 or 60.
- **Focus quick start:** the focus panel's dropdown becomes a text field with suggestions of open tasks. Text that matches no task creates a task when starting: `title # project` puts it in that project (with project suggestions after `#`), without `#` it is standalone; `# project` alone starts on the project.
- **Tab completes** the highlighted (else the first) suggestion in the focus field.
- **Focus on habits:** habits appear in the focus field's suggestions and in a start button on each habit chip. A habit session logs time on the habit (a block on the timeline, counted for its project and goal) and the stop dialog offers "Mark as done today" (on by default). **Schema:** `habit_id` on timers and log entries.
- **Log work with a start time:** an optional start time; empty keeps today's behaviour (the work ended now).
- **Done today on Home:** the tasks completed today, below "To do", with reopen by unchecking.
- **Dropdown fields:** the shared `Select` becomes a styled dropdown (a button and a popup list) with option groups, keyboard use, and optional colour dots on options (project and goal colours in the task form), so every form's dropdown is styled.
- **BREAKING (spec):** "25, 50 or 90 minutes" and "default 25" in work-timer become 30, 60, 90 and open-ended by default.

## Capabilities

### New Capabilities

- `day-timeline`: the plotted work of a day (on Home) and of the days of a week (in the review), with block timing, colours, markers, overlap, the running session and live updates.

### Modified Capabilities

- `work-log`: optional start time when logging work.

- `home`: the side column gets the "Today" tile above the active projects; the main column gets "Done today".
- `week-summary`: the summary includes the work of each day of the week.
- `work-timer`: planned lengths 30/60/90/open-ended, open-ended by default, last choice remembered; the focus panel's text field with suggestions and starting with a new task.
- `visual-design`: dropdown fields.

## Out of scope

- Planning future time, calendar events, dragging or resizing blocks, and creating entries on the timeline.
- A timeline on other screens (project, goal and task pages keep their lists).
- Zooming, scrolling to other days on Home (the review has the past days).
- Changing how log entries are created or what their times mean (the timeline interprets the stored times).
- Schema changes other than `habit_id` on timers and log entries: log entries already hold the time and the duration.
- Giving habits notes, assignment or importance like tasks (habits keep their current fields), setting due date or importance from the focus field, and assigning to a goal with `#`.

## Size

This change is larger than the project's rule (about 5 delta specs and 15 tasks): the focus quick start and "Done today" were folded in at the user's request instead of a separate change.

## Impact

- **Code:**
  - New `src/features/timeline/` (domain, data, UI).
  - New `src/features/timer/domain/quick-start.ts` and `src/features/timer/ui/QuickStartField.tsx`.
  - Changes in `src/features/home/{data/home-queries.ts,ui/HomeScreen*}`, `src/features/review/ui/WeekSummaryView*`, `src/features/timer/ui/{FocusPanel,StartFocusButton,useStartFocus}`, `src/features/tasks/{data/tasks-repository.ts,ui/TaskSheet.tsx}`, `src/features/settings/data/settings.ts` and `src/core/ui/components/Select*`.
- **Dependencies:** none.
- **Schema:** `timers.habit_id` and `log_entries.habit_id` (nullable text, no foreign keys), migrations for the app (`npm run db:generate`) and the server (`npm run db:generate:server`); the server must be redeployed (`npm run server:deploy`) before devices sync the new columns.
- **Docs:** `docs/SPEC.md` (§5 Timer and focus, §6.1 Home incl. focus field and Done today, §6.5 week summary); the example data (`example-data.ts`) gets entries with times today, so the view is not empty.
