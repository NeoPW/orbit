# Tasks

## 1. Time and formatting helpers

- [x] 1.1 Add `weekStart(CalendarDate)` (Monday of the week) to `lib/core/time/calendar_date.dart`; verify unit tests for a Monday, a Sunday and a week crossing a month and a year boundary
- [x] 1.2 Add `formatTime(DateTime)` (local `HH:mm`, leading zeros) to `lib/core/time/date_format.dart`; verify unit tests for 07:05 and 23:59
- [x] 1.3 Implement `todayProvider` in `lib/core/time/today.dart` (keep-alive Notifier, midnight `Timer`, refresh on `AppLifecycleState.resumed`, notifies only on a date change); verify a provider test with an overridable clock that advancing past midnight and calling the resume refresh emits the new date, and a same-day refresh emits nothing

## 2. Work log data and domain

- [x] 2.1 Implement `validateDuration` (empty or whole number 1–1440) and `formatDuration` ("45 min", "1 h 30 min", "2 h") in `lib/features/log/domain/duration.dart`; verify unit tests for empty, 0, 1, 1440, 1441, "abc", 45, 60, 90
- [x] 2.2 Implement `orderQuickLogProjects(projects, lastLoggedAt)` in `lib/features/log/domain/quick_log_order.dart`; verify the work-log "Recent first" scenario (B, A, C) and title order for never-logged projects
- [x] 2.3 Implement `LogRepository` (`createManual`, private shared insert helper, `watchForProject` newest first, `watchLastLoggedAt`, `delete`) with its Riverpod providers; verify repository tests for manual create fields (source manual, `occurred_at` from the clock), ordering, last-logged map, and that deleted entries are not emitted

## 3. Habit checks and habit KR progress

- [x] 3.1 Implement `isHabitDue` in `lib/features/habits/domain/habit_due.dart`; verify unit tests for every scenario of the habits spec "Habit due today" requirement (daily, weekday not selected, times per week reached, new week, inactive)
- [x] 3.2 Implement `HabitCheckRepository` (`watchSince`, `check`, `uncheck`) creating and removing the habit log entry in one transaction; verify repository tests: check creates check + log entry with the habit's project/KR and title, no duplicate on a second check, uncheck removes both, re-check after uncheck revives the soft-deleted row without a unique-constraint error
- [x] 3.3 Make `LogRepository.delete` also soft-delete the habit check linked by `log_entry_id`; verify a repository test that deleting a habit log entry leaves the habit unchecked for that date
- [x] 3.4 Add `KeyResultRepository.watchHabitCheckIns()` (grouped SQL count of live checks of the linked habit with `date >= objective.start_date`); verify repository tests for the start-date boundary, soft-deleted checks ignored, and a habit KR without habit counting 0
- [x] 3.5 Extend `krProgress` with the habit case (`checkIns / target` clamped, no habit or no target → 0, never null); verify unit tests for the key-results "Habit KR progress" scenarios (halfway, beyond target, no linked habit) and that the existing numeric/boolean tests still pass
- [x] 3.6 Pass habit check-ins into `buildPlanOverview` / `planOverviewProvider` and show "N / target check-ins · P%" or "No habit linked" in `KeyResultTile` instead of the milestone note; verify updated tile tests for both texts and a provider test that checking the linked habit raises the KR's progress

## 4. Tasks and next steps

- [x] 4.1 Extend `TaskRepository` with `create` (title, due date), `update` (title, notes, due date), `watchOpenForProject` (due date earliest first, none last, then creation time) and `watchOpenWithDueDate` (open tasks of active projects with project title); update its doc comment; verify repository tests for the tasks spec "Order" scenario and that tasks of paused projects are excluded from `watchOpenWithDueDate`
- [x] 4.2 Add `complete(taskId) → logEntryId` and `undoComplete(taskId, logEntryId)`; verify repository tests: complete sets done, `completed_at` and a task log entry (project, title as note, no duration); undo restores open, clears `completed_at` and removes that log entry
- [x] 4.3 Add `TaskRepository.delete` clearing `next_step_task_id` on the project that points to the task; verify a repository test for the "Delete next-step task" scenario and that the task's completion log entries remain
- [x] 4.4 Define `NextStepChoice` in `lib/features/tasks/domain/` and add `ProjectRepository.setNextStep`, `setNextStepFromTitle` and `completeNextStep(projectId, choice) → logEntryId`; verify repository tests for new task, existing task, skip, and that the previous next-step task stays open when another is chosen
- [x] 4.5 Build `task_dialog.dart` (add/edit: title required, notes, date field with clear); verify widget tests for the missing-title error and for saving a due date shown as `dd-mm-yyyy`
- [x] 4.6 Build `next_step_prompt.dart` (new title, pick an open task of the project, skip, cancel → null); verify widget tests that each option returns the matching `NextStepChoice` and cancel returns null
- [x] 4.7 Build the shared `complete_task.dart` helper (plain task → complete; next-step task → prompt first; then a "Task completed" snackbar with Undo); verify widget tests that Undo reopens the task and removes its log entry, and that cancelling the prompt changes nothing and creates no log entry
- [x] 4.8 Build `task_tile.dart` (checkbox, title, due date, next-step marker, menu: edit, make next step, delete with confirmation); verify widget tests for the next-step marker and that "make next step" switches the marker

## 5. Project detail

- [x] 5.1 Add the root-level route `/projects/:id` (`Routes.projectDetail`) to the router; verify a router widget test that opening `/projects/<id>` shows the detail and a reload-style start at that location shows it again
- [x] 5.2 Build `project_detail_screen.dart` info section (title, description, area, KR, importance, status, own and effective deadline with inherited marker, edit action pushing the edit form) and the "Project not found" state; verify widget tests for the inherited-deadline scenario and the not-found text
- [x] 5.3 Add the next step and open tasks section (add task, task tiles, completion through `complete_task.dart`); verify a widget test that adding a task shows it without reload and completing the next step opens the prompt
- [x] 5.4 Add the habits section (schedule summary, inactive marker, "No habits", tap opens the habit form); verify a widget test for the "Linked habit" scenario
- [x] 5.5 Add the status actions (Activate, Pause, Move to backlog, Complete without the current status); verify widget tests for the three project-detail status scenarios
- [x] 5.6 Change project taps in `overview_tab.dart` and `backlog_tab.dart` to open the project detail (Archive keeps the edit form); verify updated Plan tab widget tests that tapping a project in Overview and in Backlog opens the detail

## 6. Work log UI

- [x] 6.1 Build `log_entry_tile.dart` (date `dd-mm-yyyy`, time `HH:mm`, duration, note, source) and the log section in project detail with delete-after-confirm and "Nothing logged yet"; verify widget tests for the "1 h 30 min" display and that deleting a habit entry unchecks the habit
- [x] 6.2 Build `log_work_dialog.dart` (project preset, duration, note, save) and the detail's "Log work" action; verify a widget test for the "Log from detail" scenario
- [x] 6.3 Build `quick_log_sheet.dart` (duration and note on top, active projects ordered by `orderQuickLogProjects`, tap saves and closes with a confirmation, empty text without active projects); verify widget tests for the two-tap scenario, duration and note saved, invalid duration error, and the no-active-projects text

## 7. Home

- [x] 7.1 Implement `urgency`, `projectScore` and `compareProjectsForHome` in `lib/features/home/domain/project_score.dart`; verify unit tests for every home spec "Project urgency" scenario and the two ordering scenarios
- [x] 7.2 Implement `deadlineBadge` in `lib/features/home/domain/deadline_badge.dart`; verify unit tests for overdue, today, tomorrow, 3 days, 30 days and 31+ days (`DueOn`)
- [x] 7.3 Implement `buildUpcomingDeadlines` with `deadlineLeadDays = 7` in `lib/features/home/domain/upcoming_deadlines.dart`; verify unit tests for every home spec "Upcoming deadlines content" scenario and the overdue-first sort
- [x] 7.4 Implement `homeHabitsProvider`, `upcomingDeadlinesProvider` and `homeProjectsProvider` in `lib/features/home/data/home_providers.dart` on top of `todayProvider`; verify provider tests with a fixed today: a habit checked yesterday is unchecked after the date changes, and a project activated in the repository appears in `homeProjectsProvider`
- [x] 7.5 Build the habits section (checkbox, title, project/KR label, empty text); verify widget tests for the "Habit labeled by project" and "Check from Home" scenarios
- [x] 7.6 Build the upcoming deadlines section (kind, date, project title for tasks, overdue marker, taps to project detail or KR form); verify widget tests for the overdue marker and opening a task's project
- [x] 7.7 Build `home_project_card.dart` (title, area, badge text, next step or "No next step"; next-step tap uses `complete_task.dart`, card tap opens detail); verify widget tests for "Due in 3 days", "Due 31-12-2026", "No next step" and the "Complete next step from Home" scenario
- [x] 7.8 Replace the Home placeholder with `home_screen.dart` (sections in order inside `MaxWidthBody`, FAB opening quick log); update `test/core/router/app_shell_test.dart` so only Review is a placeholder; verify widget tests for the section order and that the FAB opens quick log

## 8. Integration and verification

- [x] 8.1 Run `dart run build_runner build --delete-conflicting-outputs`, `flutter analyze` and `flutter test`; verify analyze reports no issues, all tests pass and `drift_schemas/` is unchanged (schema still v1)
- [x] 8.2 Verify on an Android phone with `flutter run`: check and uncheck a habit, see a habit KR's progress change, add/edit/complete/delete tasks incl. the next-step prompt and Undo, quick log in two taps, log work from detail, delete a log entry, change project status from detail; restart the app and confirm all data is still there
- [x] 8.3 Verify in Chrome with `flutter run -d chrome`: repeat the 8.2 flow, reload on a project detail and confirm it reopens, and check the console has no errors
- [x] 8.4 Verify Home and project detail at phone width and desktop width in Chrome (content limited to a readable width, FAB and dialogs usable), and that all new dates use `dd-mm-yyyy` and times `HH:mm`
- [x] 8.5 Confirm `design.md` "Follow-ups for archiving" lists the `docs/SPEC.md` updates (§5, §6.1, §6.2, §10) and the habits Purpose update; verify the list is present before archiving
