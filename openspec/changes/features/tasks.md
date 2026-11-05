# Tasks

Each group ends with `npx tsc --noEmit` and its own tests passing (`npx vitest run <paths>`), so apply can pause after any group. Run under Node 24 (`fnm use`).

## 1. Foundations

- [x] 1.1 Add `src/core/db/live.ts`:
  - `useLiveQuery(load, deps)`, reloading after `onWrite`, sync `dataVersion` and settings changes;
  - runs coalesced per frame, previous data kept while reloading.

  Test the coalescing reloader (`createReloader`) in `live.test.ts`.
- [x] 1.2 Add `src/features/settings/data/settings.ts` (typed keys and SPEC §4 defaults, lead time 1–30, last focus length, its own listeners) and `useSettings()`. `DeadlineBadge` takes the lead time from it. Test the "Default values", "Settings stored locally" and "Invalid lead time" scenarios in `settings.test.ts`.
- [x] 1.3 Add `src/core/dates/today.ts` with `useToday()` and `useNow(ms)`, and the pure `msUntilMidnight` and `addDays`, tested in `today.test.ts`.
- [x] 1.4 Extend `src/core/routing/routes.ts`:
  - `goal`, `project`, `task` with ids;
  - `review-flow` (with step), `review-history` with id, `review-last-week`, `focus`;
  - `sectionOf(route)`.

  The sidebar uses `sectionOf`. Add `src/app/NotFound.tsx`. In `routes.test.ts`, test the detail paths, "Reload a project page" (parse round trip) and "Sidebar on a task page".
- [x] 1.5 Add `src/core/ui/palette.ts` (8 area colors, 8 goal colors) and `goalColor()`. Test "Back to Auto" (color by position) in `palette.test.ts`.
- [x] 1.6 Add `src/core/dates/parse.ts` (`parseDate` for `dd-mm-yyyy`, `parseTime` and `formatTime` for `HH:mm`), tested in `parse.test.ts`. Add `DateField` (with calendar popover) and `TimeField` in `src/core/ui/components/`.
- [x] 1.7 Add `NumberField`, `Select`, `Switch`, `Checkbox`, `SegmentedControl`, `WeekdayPicker` and `ColorPicker` (swatches and optional Auto) in `src/core/ui/components/`.
- [x] 1.8 Add `Menu` (arrows, Enter, Escape returns focus, click outside), `ProgressBar`, `ListRow`, `Section` and `AnimatedList` (enter and exit within 200 ms, none with reduced motion).
- [x] 1.9 Add all components from 1.6–1.8 to `src/app/dev/ComponentGallery.tsx`. Check them with the scripted Chrome check (menu keyboard, date field parsing errors, switch, reduced motion).

## 2. Areas

- [x] 2.1 Add `src/features/areas/data/areas-repository.ts`:
  - list in sort order;
  - create (trimmed, unique case-insensitive, added last), update;
  - delete (clears `area_id` on projects, in one batch).

  Test "Create valid area", "Empty name", "Duplicate name", "Rename area" and "Confirm delete" in `areas-repository.test.ts`.
- [x] 2.2 Add `src/features/areas/ui/AreaSheet.tsx` (name, color swatches, Delete with confirmation) and the Areas section in `src/features/plan/ui/PlanScreen.tsx`. Remove `TestAreas.tsx`. Check "Open areas" and "Cancel delete" in the browser.

## 3. Goals and measures

- [x] 3.1 Add `src/features/goals/domain/`:
  - goal validation (title, end not before start);
  - measure validation (numeric fields required, step > 0, habit target > 0);
  - measure progress (numeric, boolean, habit) and goal progress.

  Test every scenario of measures' "Numeric measure progress", "Boolean measure progress", "Habit measure progress" (except "Updates after check"), "Step size", goals' "Goal progress", "Missing title" and "End before start".
- [x] 3.2 Add `src/features/goals/data/goals-repository.ts`:
  - create (status active, added last), update, set status;
  - delete in one batch (goal and measures soft-deleted; `goal_id` cleared on projects, tasks and habits);
  - list active goals with their measures, get by id.

  Test "Create valid goal", "Linked projects survive", "Assigned task survives" and "Complete goal".
- [x] 3.3 Add `src/features/goals/data/measures-repository.ts`: add (last), update, delete, step up and down, set value, set done. Test "Add measure to goal", "Plus button", "Minus button", "Enter the value", "Done switch" and "Default step".
- [x] 3.4 Add `GoalSheet` (title, description, date fields, color swatches with Auto, status) and `MeasureSheet` (type picker, fields for the type, Delete with confirmation) in `src/features/goals/ui/`. Check "Numeric fields", "Boolean fields" and "Habit fields" in the gallery or the app.
- [x] 3.5 Add `src/features/goals/ui/GoalPage.tsx` at `/goals/:id`:
  - header (color, title, progress bar, date range, status chip menu, deadline badge);
  - description;
  - measure rows with − / + / value / done controls;
  - Edit, and Delete with a confirmation naming the measure count;
  - not found.

  Check "Open from Plan", "Complete from the status chip", "Confirmation names measures", "Missing goal" and "Measure changed" (live).
- [x] 3.6 Add the Goals section of Plan (goal color, title, progress, date range, badge, measures with bars, empty state with "New goal") and Plan's "New" menu with Goal. Check "Goal with measures and projects" (measures part), "Non-active goals hidden", "Goal without measures", "No active goals", "Overdue goal in the list" and "Measure in the goals list".

## 4. Projects

- [x] 4.1 Add `src/features/projects/domain/`: effective deadline (own, else the goal's end, marked inherited), urgency, score, project order (score, deadline, title) and Plan order (importance, deadline, title). Test home's "Project urgency" and "Active projects ordered by score", projects' "Effective deadline from the goal", and plan-overview's "Project ordering".
- [x] 4.2 Add `src/features/projects/data/projects-repository.ts`:
  - create, update, set status (sets and clears `completed_at`);
  - delete in one batch (project and its tasks; `project_id` cleared on habits);
  - lists by status, by goal, without an active goal.

  Test "Complete", "Reopen", "Delete project", "Change goal" and "Keep a goal that is no longer active".
- [x] 4.3 Add `src/features/projects/ui/ProjectSheet.tsx` (title, description, area, goal limited to active goals but keeping the current one, importance, deadline, status, Delete). Check "Missing title" and "Keep a goal that is no longer active".
- [x] 4.4 Add `src/features/projects/ui/ProjectPage.tsx` at `/projects/:id`:
  - header (status chip menu, area chip, importance dots, deadline badge marked when inherited);
  - description and goal link;
  - Edit and not found.

  Check "Inherited deadline", "Open the goal", "Edit", the "Status actions" scenarios and "Deleted from edit form".
- [x] 4.5 In Plan:
  - projects under goals, "Projects without a goal", Backlog (area filter including "No area", Activate) and Archive (completed and archived goals, completed projects);
  - "New" → Project.

  On the goal page, the Projects section ("N completed", Add project with the goal preselected). Check the plan-overview "Backlog", "Activate from backlog", "Archive" and "Projects without a goal" scenarios, and goals' "Projects on the goal page".

## 5. Tasks and next steps

- [x] 5.1 Add `src/features/tasks/domain/`:
  - inherited importance;
  - task rank (with urgency fallbacks);
  - open task order, with next steps first in the detail;
  - `nextStepOutcome` (complete directly or ask).

  Test tasks' "Task importance" and "Open task order", home's "Task rank" and the decision part of "Prompt after the last next step".
- [x] 5.2 Add `src/features/tasks/data/tasks-repository.ts`:
  - create, update (leaving a project clears the next-step flag);
  - mark and unmark as next step;
  - complete in one batch (done, log entry, chosen next steps or a new task);
  - undo (reopen, delete entry, restore flag);
  - reopen, delete.

  Test "Add task", "Complete task" (all three), "Undo", "Delete next-step task", "Reopen", "Second next step", "Unmark", "New next step", "Pick several", "Skip", "Only one assignment" and "Goal deleted".
- [x] 5.3 Add `src/features/tasks/ui/TaskSheet.tsx` (title, notes, due date, importance or inherited, assignment select of active projects and active goals plus the current one, Delete). Check "Missing title" and "Change due date".
- [x] 5.4 Add `src/features/tasks/ui/useCompleteTask.ts` and `NextStepPrompt.tsx`: new task, pick several, skip, cancel. Show "Task completed" with Undo. Check "Cancel" and "Other next steps remain" in the app.
- [x] 5.5 Add `TaskRow` (checkbox, title, next-step marker, importance dots, deadline badge, click opens the task page) inside `AnimatedList`. Use it in:
  - project detail: next steps first, Add task, empty state;
  - goal page: tasks and habits section (tasks);
  - Plan: tasks under goals.

  Check "Next steps first", "Not shown twice", "No row menu" and "Complete from the row".
- [x] 5.6 Add `src/features/tasks/ui/TaskPage.tsx` at `/tasks/:id`:
  - all fields, with inherited importance marked;
  - complete or reopen, Edit, Delete, "Mark as next step" or "Remove from next steps";
  - not found;
  - "New" → Task in Plan.

  Log work and start focus are wired in 7.3 and 8.4. Check the "Task page" scenarios except the focus parts.

## 6. Habits

- [x] 6.1 Add `src/features/habits/domain/` (`isDue`, schedule summary such as "Mon, Wed, Fri", validation). Test "Habit due today" (all scenarios), "Weekdays without a day", "Weekdays saved" and "Times per week out of range".
- [x] 6.2 Add `src/features/habits/data/habits-repository.ts`:
  - create, update, delete (clears `habit_id` on measures);
  - check (natural ID, check and log entry in one batch, idempotent), uncheck;
  - check-ins since a date (for habit measures).

  Test "Check habit", "Check a goal's habit", "No duplicate check", "Uncheck" and "Delete habit linked to a measure".
- [x] 6.3 Add:
  - `HabitSheet` (links to non-completed projects and active goals, schedule fields, reminder time, active);
  - the Habits section of Plan and "New" → Habit;
  - habits on the project detail and the goal page;
  - the habit picker in `MeasureSheet`.

  Check "Create daily habit", "Link to a goal", "Deactivate", "Set reminder time", "Clear reminder time", the habits list scenarios and "Linked habit".

## 7. Work log

- [x] 7.1 Add `src/features/work-log/domain/`:
  - duration format ("1 h 30 min") and validation (1–1440);
  - recently used first;
  - work on a goal (entries of the goal, its projects and its tasks; this week and total).

  Test "Duration format", "Invalid duration", "Recent first" and the three "Work on a goal" scenarios.
- [x] 7.2 Add `src/features/work-log/data/log-repository.ts` (add manual, list by project, task or goal, delete together with a habit check). Test "Delete manual entry" and "Delete habit entry".
- [x] 7.3 Add `LogWorkSheet` and `LogEntryList` (date, time, duration, note, source icon, delete with confirmation). Wire them to:
  - Home's "Log work" (sheet with projects and loose tasks);
  - "Log work" on the project detail (project preselected) and the task page (task preselected);
  - the goal page's Work section.

  Check "Two clicks", "With duration and note", "Nothing to log on", "Log on a task", "Log from detail", "Log on a standalone task", "Log on a goal's task" and "Newest first".

## 8. Timer and focus

- [x] 8.1 Add `src/features/timer/domain/` (elapsed as `m:ss` / `h:mm:ss`, overtime, whole minutes at least 1). Test "Running timer", "Overtime" and "Very short timer".
- [x] 8.2 Add `src/features/timer/data/timer-repository.ts`:
  - start (upsert `TIMER_ID`; log the running timer first);
  - stop with note in one batch;
  - discard;
  - read the running timer with its target.

  Test "Stop after 45 minutes", "Timer for a task", "Stop note", "Switch to another project", "Discard" and "Started on both devices" (last write wins).
- [x] 8.3 Add `FocusPanel` (choose a To do task or an active project, 25/50/90/open-ended, Start; running state with Stop, Discard and "Focus mode") and `StopDialog` ("What did you get done?", then the next-step prompt when it applies). Check "Start from the focus panel", "No timer", "Keeps running while closed" and "Task completed while timing".
- [x] 8.4 Add `src/features/timer/ui/FocusMode.tsx` at `/focus` (title, notes, large timer, planned length and overtime, Stop, Discard, Escape goes back). Add the start action on the task page and on To do rows (last chosen length). Check "Open focus mode", "Leave without stopping" and "Start from a row".

## 9. Home

- [x] 9.1 Add `src/features/home/data/home-queries.ts`:
  - To do (open next steps of active projects and loose tasks, ranked);
  - active projects by score with their open next steps;
  - habits due today or checked today.

  Test "Next steps and loose tasks", "Paused project", "Task of a goal" and "Checked habit stays listed".
- [x] 9.2 Rewrite `src/features/home/ui/HomeScreen.tsx`:
  - weekday and date with "New task" and "Log work";
  - focus panel, habit chips, To do rows;
  - the active projects side column (moves below at < 960 px), with empty states.

  Check "Wide window", "Empty section", the habit chip scenarios, "Badge in days", "No next steps", "Complete next step from Home", "Open detail" and "New day".
- [x] 9.3 Add the "New task" sheet on Home (Enter with only a title creates a standalone task; deadline, importance, assignment). Check "Title and Enter" and "Assign to a goal".

## 10. Weekly notes and review

- [x] 10.1 Add `src/features/review/domain/`:
  - review week, current and last week, week range format;
  - `summarizeWeek`: work per project grouped by goal, habit adherence, completed tasks, finished projects, goal progress and change from snapshots.

  Test every "Review week" and week-summary scenario except the live and tap ones.
- [x] 10.2 Add `src/features/notes/data/notes-repository.ts` (upsert with natural ID, emptied → deleted, list by target, list by week) and `NoteField` (saves 500 ms after typing, on blur and on unmount). Show the notes on the project detail and the goal page. Test "Change a note", "Two devices" (same ID), "Empty note" and "Newest first".
- [x] 10.3 Add `src/features/review/data/reviews-repository.ts`:
  - get or create the draft (natural ID), save the draft;
  - save in one batch (completed, snapshots replaced);
  - history list.

  Test "Save", "Edit a completed review", "Continue later" (draft kept) and "History order".
- [x] 10.4 Rewrite `src/features/review/ui/ReviewScreen.tsx`:
  - this week's plan, the current week's `WeekSummary`;
  - the Start, Continue or Edit button, the history list;
  - "Last week" at `/review/last-week`.

  Check the "Review tab" and "Last week page" scenarios.
- [x] 10.5 Add the guided flow at `/review/flow`:
  - six steps with a progress bar, Back and Next, the draft saved on step change and on leaving;
  - projects step: status, next steps, add a next step, importance, deadline, note;
  - goals step: status, measures, note;
  - score and plan, then save (blocked without a score).

  Check the "Guided review steps", "Projects step", "Goals step", "Missing score" and "Leave the step" scenarios.
- [x] 10.6 Add the past review page at `/review/history/:id` (score, reflection and plan in full, the week's summary from snapshots, the week's notes). Check "Open a past review" (both specs) and "Work of a past week".

## 11. Settings, notifications and tray

- [x] 11.1 Add the Reminders section to `src/features/settings/ui/SettingsScreen.tsx`:
  - switch, default time, review day and time, lead time with error;
  - the browser note instead of the switch.

  Check "Open settings", "Fresh install", "Change default time", "Valid lead time", "Change review day" and "Settings in the browser".
- [x] 11.2 Add `src/features/notifications/domain/plan-reminders.ts` (habit, deadline, review and focus-end reminders up to a time; passed and already shown ones left out; switch off). Test every scenario of "Habit reminders", "No reminder for a checked habit", "Deadline reminders", "Weekly review reminder", "Reminders can be switched off" and "End of a focus session".
- [x] 11.3 Add:
  - `ReminderRunner` (mounted in `AppRoot`), which plans again after writes, sync, settings, midnight and wake;
  - `src/platform/notify.ts` (a no-op in the browser);
  - the Web Audio chime for the end of a focus session.

  Check "Browser" and, in the browser, the focus-end sound.
- [x] 11.4 In `src-tauri/`:
  - add `notify-rust`, the `tray-icon` feature, and the tray with "Open Orbit" and "Quit";
  - hide the window on close;
  - add the `show_notification` command, which emits `notification-clicked` with the route;
  - update the capabilities.

  Listen for the event in `AppRoot` and navigate. Check "Close the window", "Open again", "Quit", "Window in the tray", "Click a task reminder" and "Click the weekly review reminder" in `npm run desktop`.

## 12. Docs and verification

- [x] 12.1 Update the docs:
  - `README.md`: using the app, the tray, and that a notification daemon with action support is needed for clicks;
  - `docs/SPEC.md` §6.4 (the layout is decided) and §9 (milestone 5 done);
  - the Purpose lines of `openspec/specs/app-shell` and `openspec/specs/visual-design`;
  - remove leftover placeholder comments.
- [x] 12.2 Run `npm run check`; it must pass.
- [x] 12.3 Verify a full day and a weekly review in `npm run dev` (Chrome and Firefox) and in `npm run desktop`:
  - create an area, a goal with measures, a project, tasks with next steps and a habit;
  - run a focus session and log work;
  - do the review;
  - check that sync carries everything to the other device.

  Then check tray and notifications in a `npm run desktop:build` package.
