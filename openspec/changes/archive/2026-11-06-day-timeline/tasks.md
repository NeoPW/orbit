# Tasks

Run under Node 24 (`fnm use`). Each group ends with `npx tsc --noEmit` and its own tests passing; the full `npm run check` runs once, in 4.2.

## 1. Focus defaults and dropdown

- [x] 1.1 In `src/features/settings/data/settings.ts` make `focusMinutes` `number | null` (default `null` = open-ended, stored `'none'` or absent, valid 1–1440, an older 25 reads as 30 and 50 as 60). Test "Open-ended by default" and "Older stored length" in `settings.test.ts`.
- [x] 1.2 In `src/features/timer/ui/` (`FocusPanel.tsx`, `StartFocusButton.tsx`, `useStartFocus.ts`) offer 30, 60, 90 and Open-ended, select the stored choice (open-ended by default), and save every choice including open-ended. Test "Last choice remembered" and "Open-ended remembered" at the lowest level that fits (`useStartFocus` helpers or the settings test); check "Open-ended by default" and "Start from the focus panel" in the browser.
- [x] 1.3 Rebuild `src/core/ui/components/Select.tsx` as the styled dropdown of the design (same props, optional `color` per option, groups, keyboard, type-ahead, outside click, `position: fixed` popup that works in a Sheet). Give the focus panel's options the project colours (the panel's `Select` calls in `FocusPanel.tsx`). Add the variants to the gallery. Check "Styled list", "Keyboard", "Escape", "In a sheet" and "Outside click" in the browser (focus panel and the task form).
- [x] 1.4 Add `src/features/timer/domain/quick-start.ts` (`parseQuickStart`, `matchTasks`, `resolveProject`, `quickStartPlan`) as in the design. Test "Suggestions" (matching), "New task in a project", "New standalone task", "Existing task typed", "Project only", "Project prefix" and "Unknown project" in `quick-start.test.ts`.
- [x] 1.5 Add `listOpenTasks` (open tasks with project title and colour) to `src/features/tasks/data/tasks-repository.ts` with a test; add `src/features/timer/ui/QuickStartField.tsx` and use it instead of the `Select` in `FocusPanel.tsx` (task suggestions, project suggestions after `#`, error, Enter starts, create then start). Check "Suggestions", "Pick with the keyboard", "Project suggestions", "New task in a project" and "Start from the focus panel" (`# Thesis` with 60 min) in the browser.
- [x] 1.6 Give the options of the task form's "Assigned to" dropdown (`src/features/tasks/ui/TaskSheet.tsx`) the project and goal colours. Check "Styled list" in the browser.

- [x] 1.7 Log work start time: `parseStartTime` in `src/features/work-log/domain/work-log.ts` with tests; `addManualEntry` in `log-repository.ts` takes the occurrence time; a start-time field (`TimeField`) in `LogWorkSheet.tsx` and in the project detail's log form. Test "No start time", "Start time", "Start without duration" and "Start in the future".
- [x] 1.8 Tab accepts the highlighted (else first) suggestion in `src/features/timer/ui/QuickStartField.tsx`; check "Tab completes", "Tab with the second highlighted" in the browser.

## 2. Timeline logic and data

- [x] 2.1 Add `src/features/timeline/domain/day-timeline.ts`: `blockTimes` (timer starts at its time, others end at it), `layoutDay` (lanes and overlap groups), `axisFor` (06:00–22:00, extended by whole hours) and the minimum block height rule. Test "Timer entry", "Manual entry", "Two at once", "Default range", "Early work" and "Another day" in `day-timeline.test.ts`.
- [x] 2.2 Add `src/features/timeline/data/timeline-loader.ts` with `loadTimeline(db, from, to)` as in the design (label, colour, target, markers, the running timer as an item). Test "Label", "Project colour", "Task of a project", "No project", "Task completed" (marker) and "Running" in `timeline-loader.test.ts`.

## 3. Views

- [x] 3.1 Add `src/features/timeline/ui/DayTimeline.tsx` and its CSS module: hour grid and axis, blocks tinted in their colour with rail, markers, the now line, striped running blocks, tooltip with note and duration, clicking opens the task, project or goal, empty state; for one day and for seven days on a shared axis. Add it to the gallery. Check "Nothing logged", "Now line" and "Open the task" in the browser.
- [x] 3.2 Add the "Today" tile above "Active projects" in `src/features/home/ui/HomeScreen.tsx` (live through `useLiveQuery`, `useToday`, `useNow(60000)`). Check "Timeline above projects" and "Log work" (a block appears without reload) in the browser.
- [x] 3.3 Add the "Days" section (seven columns, weekday and date headings, future days empty) to `src/features/review/ui/WeekSummaryView.tsx`, using one `loadTimeline` for the week range. Check "A week of work", "Past review" and "Colours match the projects" in the browser (review screen and a past review).
- [x] 3.4 Redesign the entries in `DayTimeline.tsx` and its CSS module: block content (title; project and time range when two lines fit), minimum height of one line (pass the minimum minutes to `layoutDay`, update `day-timeline.test.ts`), dots without text in a strip at the column's left edge (no stacking), tooltip for dots. Check "Label", "Short block", "Task completed", "Habit checked" and "Dot details" in the browser, on Home and in the week view.
- [x] 3.5 Add `listDoneToday` to `src/features/home/data/home-queries.ts` with a test ("Completed task", "Yesterday"), and the "Done today" tile below "To do" in `HomeScreen.tsx`, hidden when empty, unchecking calls `reopenTask`. Check "Completed task", "Reopen" and "Nothing done yet" in the browser.

## 4. Focus on habits

- [x] 4.1 Add `habit_id` to `timers` and `log_entries` in `src/core/db/schema.ts`, generate the migrations (`npm run db:generate`, `npm run db:generate:server`), add `{ habitId }` to `LogTarget`, `habitLinks`, and carry `habitId` through `startTimer`/`stopTimer` in `timer-repository.ts` and `checkHabit` in `habits-repository.ts`. Tests: "Habit session logged", "Start from a habit chip" (repository level), migration test in `migrate.test.ts` still passing.
- [x] 4.2 Habit in `timer-view.ts`, `FocusMode`/`FocusPanel` running view and `StopDialog.tsx`/`useStopTimer.tsx`: "Mark as done today" (default on, hidden when checked). Test "Mark habit done on stop", "Habit not marked", "Habit already checked".
- [x] 4.3 Habits in the focus field: `quick-start.ts` (`kind`, habit plan), suggestions with the "Habit" mark in `QuickStartField.tsx`, `listActiveHabits` for `FocusPanel.tsx`, and a start button on each chip in `HomeScreen.tsx`. Tests "Habit suggested" and plan tests in `quick-start.test.ts`; check "Start from a habit chip" and "Chip still checks" in the browser.
- [x] 4.4 Habit label, colour and target in `timeline-loader.ts`; test "Habit session" in `timeline-loader.test.ts`.

## 5. Docs and verification

- [x] 5.1 Update `docs/SPEC.md` (§5 Timer and focus: lengths and default; §6.1 Home: the Today timeline; §6.5 week summary: work by day) and add entries with times today (a timer entry, manual entries, a completed task) to `src/features/settings/data/example-data.ts` so the view is not empty; keep its test passing.
- [x] 5.2 Update `docs/SPEC.md` §6.1 Home: the focus panel's text field (suggestions, `title # project`) and "Done today"; the timeline's blocks and dots.
- [x] 5.3 Update `docs/SPEC.md`: §4 (`habit_id` on LogEntry and Timer), §5 Timer and focus (habit sessions, mark done on stop), §6.1 (habit chip start, Tab in the focus field) and Log work (start time).
- [x] 5.4 Run `npm run check`; it must pass.
- [x] 5.5 Verify in `npm run desktop` with the example data (also a habit session started from a chip and stopped with "Mark as done today", Log work with a start time, Tab in the focus field, and a migrated database): Home's Today tile (blocks and dots), a running session appearing as a block, the review's seven days in two themes, the focus field (suggestions, `# project`, open-ended by default), "Done today", and the dropdown in a form.
