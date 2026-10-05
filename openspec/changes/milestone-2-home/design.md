# Design

## Context

Milestone 1 left a working foundation:
- the drift schema v1 with all nine tables
- repositories for areas, objectives, KRs, projects, habits and a minimal `TaskRepository` (create, rename, delete by project), used only for next steps
- the Plan tab and a placeholder Home screen
- pure domain functions for effective deadlines, KR progress and habit schedules.

`HabitCheck` and `LogEntry` have tables but no repositories. Combined screen state is built in providers with `combineAsync` over stream providers (`plan_providers.dart`), and tests use an in-memory database with a fixed clock and sequential IDs (`test/helpers/`).

See `proposal.md` for motivation and `specs/` for the required behavior. This design covers how the new behavior fits into that structure.

## Goals / Non-Goals

**Goals:**
- All ordering, due and urgency rules from the specs as pure functions with unit tests: habit due, urgency/score, deadline badge, upcoming deadlines, habit KR progress, quick-log ordering, duration validation/format.
- Every multi-row write in one repository transaction:
  - check/uncheck a habit
  - complete or undo a task
  - complete the next step with the prompt's choice
  - delete a log entry.
- A single notion of "today" that Home and its providers share and that tests can fix.

**Non-Goals:**
- No schema change; `schemaVersion` stays 1 and `drift_schemas/` is unchanged.
- No new packages.
- No generic "service" layer: cross-entity writes stay in repositories, as in milestone 1 (for example `ProjectRepository` already owns a `TaskRepository`).

## Decisions

### 1. Packages and schema

No new packages. Everything uses drift, Riverpod, go_router and Flutter's own widgets (SnackBar with action, bottom sheet, dialogs).

**No schema changes, no migration.** All needed columns exist in v1:
- `habit_checks.log_entry_id` links a check to the log entry it created, so unchecking and deleting a habit log entry can find each other.
- Completing a task stores no link to its log entry. Undo uses the log entry ID that the completion returns, held by the UI for the duration of the snackbar (decision 4).

*Alternative considered:* adding `tasks.log_entry_id` or `log_entries.task_id` so completed tasks could be reopened later with their log entry removed. Rejected: it needs the first migration, and reopening outside Undo is out of scope.

### 2. Repositories

New and extended repositories. Each takes `AppDatabase`, `Clock` and `IdGenerator`, as before.

| Repository | Location | New methods |
|---|---|---|
| `LogRepository` | `features/log/data/` | `createManual({projectId, durationMinutes, note})`, `watchForProject(projectId)` (newest first), `watchLastLoggedAt()` (map project ID → latest `occurred_at`, one grouped query), `delete(id)` (also soft-deletes the habit check whose `log_entry_id` is `id`) |
| `HabitCheckRepository` | `features/habits/data/` | `watchSince(CalendarDate from)` (live checks with `date >= from`), `check(habit, date)`, `uncheck(habitId, date)` |
| `TaskRepository` | `features/tasks/data/` (extended) | `create(projectId, title, dueDate)`, `update(task)` (title, notes, due date), `watchOpenForProject(projectId)`, `watchOpenWithDueDate()` (open tasks of active projects that have a due date, joined with their project title), `complete(taskId) → logEntryId`, `undoComplete(taskId, logEntryId)`, `delete(taskId)` (clears `next_step_task_id` on a project pointing to it) |
| `ProjectRepository` | extended | `setNextStep(projectId, taskId?)`, `setNextStepFromTitle(projectId, title)`, `completeNextStep(projectId, NextStepChoice) → logEntryId` |
| `KeyResultRepository` | extended | `watchHabitCheckIns()` (map KR ID → count, decision 6) |

`NextStepChoice` is a sealed class in `features/tasks/domain/`: `NewNextStep(title)`, `ExistingNextStep(taskId)`, `NoNextStep()`. The prompt dialog returns one, or null for cancel. `completeNextStep` completes the task (with its log entry) and applies the choice in one transaction.

All log entry inserts share one private helper (`_insertLogEntry`) in `LogRepository`. `HabitCheckRepository` and `TaskRepository` use a `LogRepository` built on the same database, the way `ProjectRepository` builds a `TaskRepository` in milestone 1.

**Checking and the unique constraint.** `habit_checks(habit_id, date)` is unique across soft-deleted rows (milestone 1 design §4). `check` therefore:
1. looks up any row for (habit, date), alive or not
2. returns early if it is alive (no duplicate, spec "No duplicate check")
3. otherwise inserts the log entry, then either revives the soft-deleted row (clears `deleted_at`, sets the new `log_entry_id`, bumps `updated_at`) or inserts a new row.

`uncheck` soft-deletes the alive check and its log entry. The log entry gets source `habit`, the habit's `project_id` and `key_result_id`, `occurred_at = clock()`, no duration and the habit title as note.

### 3. Pure domain functions

| Function | File | Notes |
|---|---|---|
| `weekStart(CalendarDate)` | `core/time/calendar_date.dart` | Monday of the date's week |
| `isHabitDue(habit fields, date, checksInWeek)` | `features/habits/domain/habit_due.dart` | Rules from the habits spec; inactive → false |
| `urgency(EffectiveDeadline?, today)`, `projectScore(importance, urgency)`, `compareProjectsForHome` | `features/home/domain/project_score.dart` | Table from the home spec; ties by deadline, then title |
| `deadlineBadge(CalendarDate, today) → DeadlineBadge` | `features/home/domain/deadline_badge.dart` | Sealed: `Overdue`, `DueToday`, `DueTomorrow`, `DueInDays(n)`, `DueOn(date)`. Text is built in the UI |
| `buildUpcomingDeadlines(tasks, projects, keyResults, objectives, krProgress, today)` | `features/home/domain/upcoming_deadlines.dart` | Filters by own deadline ≤ today + 7, sorts by date then title |
| `krProgress(..., habitCheckIns)` | `features/key_results/domain/kr_progress.dart` | Habit case: `checkIns / target` clamped; no habit or no target → 0. Never null any more |
| `orderQuickLogProjects(projects, lastLoggedAt)` | `features/log/domain/quick_log_order.dart` | Recently logged first, then title |
| `validateDuration(String) / formatDuration(int)` | `features/log/domain/duration.dart` | 1–1440 minutes; "45 min", "1 h 30 min", "2 h" |
| `formatTime(DateTime)` | `core/time/date_format.dart` | Local `HH:mm` |

The upcoming-deadlines lead time is a constant `deadlineLeadDays = 7` in the home domain, so a later Settings screen can replace it with a provider.

### 4. Undo for completed tasks

`TaskRepository.complete` returns the new log entry's ID. The widget that completed the task shows a `SnackBar` ("Task completed") with an Undo action. The action calls `undoComplete(taskId, logEntryId)`, which sets the task back to open, clears `completed_at` and soft-deletes that log entry, in one transaction. The same applies after the next-step prompt (`completeNextStep` also returns the ID). Undo doesn't touch `next_step_task_id` (tasks spec).

*Alternative considered:* a confirmation dialog before completing. Rejected: it adds a tap to the most frequent action; Undo makes mistakes cheap instead.

### 5. "Today"

A keep-alive `todayProvider` (Notifier in `core/time/today.dart`) holds `CalendarDate.today(clock)`. It refreshes:
- with a `Timer` set to the next local midnight
- on `AppLifecycleState.resumed`, through an `AppLifecycleListener`.

It only notifies when the date actually changed. Home providers watch it, so a new day recomputes due habits, deadlines and urgencies (home spec "Today follows the calendar"). Tests override it with a fixed date.

### 6. Providers

In `features/home/data/home_providers.dart`, built with `combineAsync` like `planOverviewProvider`:

- **`homeHabitsProvider`:** active habits plus checks since `weekStart(today)`. It produces the habits that are due today or checked today, each with `checkedToday`, its label (project title, else KR title) and today's check.
- **`upcomingDeadlinesProvider`:** combines:
  - open tasks with a due date (active projects only)
  - active projects, KRs and objectives
  - KR progress
  - `today`.
- **`homeProjectsProvider`:** active projects with area, effective deadline (needs KRs and objectives), next-step task and the score order.

**Habit KR progress** comes from a single SQL query in `KeyResultRepository.watchHabitCheckIns()`. It joins habit KRs with their objective and counts the live checks of the linked habit with `date >= objective.start_date`. Dates are ISO text, so string comparison is date comparison. The result is a `Map<krId, int>`, watched by `planOverviewProvider` and `upcomingDeadlinesProvider` and passed into `krProgress`. This replaces the `null` progress for habit KRs in `buildPlanOverview` and in `KeyResultTile`.

*Alternative considered:* loading all checks into Dart and counting there. Rejected: the grouped query keeps the stream small and doesn't grow with history.

### 7. Routing and screens

**Project detail** is a root-level route `/projects/:id` (`Routes.projectDetail(id)`). Like the forms, it is on the root navigator: it covers the navigation bar, keeps its URL on reload, and is reachable from both Home and Plan with `context.push`. The edit form stays at `/plan/projects/:id`; the detail's edit action pushes it.

These change their project tap target from the edit form to the detail:
- `overview_tab.dart` (Overview)
- `backlog_tab.dart` (Backlog).

The Archive keeps opening the edit form (plan-overview spec, unchanged).

**New UI files:**

- **`features/home/ui/`:**
  - `home_screen.dart` (replaces the placeholder; `MaxWidthBody`, FAB)
  - `home_habits_section.dart`
  - `upcoming_deadlines_section.dart`
  - `home_project_card.dart`.
- **`features/projects/ui/`:** `project_detail_screen.dart`, with sections for info, next step and open tasks, habits, log, and status actions.
- **`features/tasks/ui/`:**
  - `task_tile.dart` (checkbox, due date, next-step marker, menu: edit, make next step, delete)
  - `task_dialog.dart` (add/edit)
  - `next_step_prompt.dart` (returns `NextStepChoice?`)
  - `complete_task.dart` (shared helper that runs the completion or prompt and shows the Undo snackbar, used by Home and detail).
- **`features/log/ui/`:**
  - `quick_log_sheet.dart` (modal bottom sheet; duration and note fields on top, project list below; tapping a project validates and saves)
  - `log_work_dialog.dart`
  - `log_entry_tile.dart`.

**Quick log and log work** are modal (bottom sheet / dialog) without their own URL. On web a reload closes them, which is acceptable for a short entry.

### 8. Testing approach

- Unit tests for every function in decision 3, including the boundary scenarios from the home, habits, key-results and work-log specs.
- Repository tests on the in-memory database for:
  - check/uncheck/re-check (revive path)
  - no duplicate check
  - complete/undo
  - completeNextStep with each choice
  - task delete clearing the next step
  - log delete removing its habit check
  - `watchLastLoggedAt`
  - `watchHabitCheckIns` (start-date boundary, deleted checks ignored).
- Provider tests with a fixed `todayProvider` for Home ordering and the "new day" refresh.
- Widget tests for Home sections, project card, next-step prompt (including cancel), project detail status actions, quick log two-tap and duration error, and the Plan tab project tap opening the detail.
- Existing tests that change:
  - the Home placeholder test (app shell)
  - the habit KR tile note
  - Plan tab project taps.

## Risks / Trade-offs

- [Undo is only available while the snackbar is shown; afterwards a completed task cannot be reopened] → Accepted for this milestone (out of scope in the proposal). Its log entry can still be deleted from the project detail.
- [Deleting a task-completion log entry or a habit's log entry from the list removes the evidence of work] → Deletion asks for confirmation. For habit entries the check is removed with it, so Home and KR progress stay consistent.
- [Midnight timer doesn't fire while a browser tab or the app is suspended] → The resume listener refreshes "today" as well. Home is always correct after returning to the app.
- [Home combines many streams; any write recomputes it] → Data volumes are single-user and small; the domain functions are linear. Habit KR check-ins are counted in SQL, not in Dart.
- [Reviving soft-deleted habit checks changes `created_at` semantics: the row keeps its original `created_at`] → Acceptable; sync compares `updated_at`, which is bumped.
- [Root-level project detail hides the navigation bar on desktop] → Same as the existing forms; the back button returns to Home or Plan with the tab state kept by `StatefulShellRoute`.

## Migration Plan

No database migration (schema stays at version 1). Existing data from milestone 1 is used as is: projects keep their next-step tasks, habits start without checks. Rollback is reverting the change's commits; no data is written in a format milestone 1 can't read.

## Follow-ups for archiving

**`docs/SPEC.md`:**
- §5 (completing a task always creates a log entry)
- §6.1 (quick log saves when a project is chosen; the next step is completed through the prompt, which can be cancelled)
- §6.2 (task reordering deferred)
- §10 (task due dates don't affect urgency; remove the open question).

**`openspec/specs/habits/spec.md` Purpose** still says checking habits comes in a later milestone. Update it by hand after the sync, since a delta can't change an existing Purpose.
