# Proposal

## Why

After milestone 1 the app is a planning tool only: the Home tab is a placeholder, tasks exist only as a project's next-step text, habits cannot be checked and no work can be logged. Milestone 2 (`docs/SPEC.md` §9) turns the app into the daily tracker the product is meant to be on the phone (SPEC §1): see what to do today, check habits, log work in two taps and get back into a project through its next step.

## What Changes

- **Home tab** (SPEC §6.1) replaces the placeholder, top to bottom:
  - habits due today with checkboxes, labeled by project or KR
  - upcoming deadlines: open tasks, active projects and KRs of active objectives whose *own* deadline is overdue or within 7 days, sorted by date
  - active projects sorted by score (SPEC §5: importance × urgency), each card showing title, area, a deadline badge and the next step
  - a quick-log button.
- **Project score** (SPEC §5): urgency comes only from the project's effective deadline. Task due dates do not raise urgency (this answers the open question in SPEC §10).
- **Project detail** (SPEC §6.2), opened from Home and from the Plan tab's Overview and Backlog:
  - all project fields, with own and effective deadline
  - the next step and the open tasks
  - the project's habits and its log entries, most recent first
  - status actions: activate, pause, move to backlog, complete.
- **Tasks**:
  - add, edit (title, notes, due date), complete and delete tasks of a project, and choose which open task is the next step
  - completing a task always creates a log entry (`source = task`) automatically, with an Undo action
  - completing the next step opens the next-step prompt (SPEC §5): new task, pick an existing open task, or skip.
- **Habit checks** (SPEC §5):
  - the "due today" rules for `daily`, `weekdays` and `times_per_week`
  - checking a habit creates a HabitCheck and a log entry (`source = habit`); unchecking removes both.
- **Habit KR progress** (SPEC §5): check-ins of the linked habit since the objective's start date divided by the KR's target. This replaces the "Progress available from milestone 2" note in the Plan tab.
- **Work log**:
  - quick log from Home: choosing a project saves the entry (recently used projects first), with an optional duration and note entered beforehand
  - "Log work" from project detail
  - deleting a log entry; deleting a habit's log entry also unchecks the habit for that day.

## Capabilities

### New Capabilities
- `home`: The Home tab: habits due today, upcoming deadlines, active projects ordered by score with deadline badges and next steps, and the quick-log entry point.
- `project-detail`: The project detail screen: fields, effective deadline, next step, open tasks, habits, log entries and status actions.
- `tasks`: Tasks of a project: create, edit, complete with automatic log entry and undo, delete, due dates, choosing the next step and the next-step prompt.
- `work-log`: Log entries: quick log, logging from project detail, listing a project's entries and deleting entries.

### Modified Capabilities
- `habits`: Adds the "due today" rules and checking/unchecking a habit for today, which creates/removes a HabitCheck and its log entry.
- `key-results`: Replaces "Habit KR progress not yet available" with the habit KR progress calculation.
- `app-shell`: Home is no longer a placeholder; only Review still is.
- `plan-overview`: Tapping a project in the Overview or the Backlog opens its project detail instead of its edit form.

## Impact

- **Code:** new feature folders `lib/features/home/` (replacing the placeholder screen) and `lib/features/log/`. Additions to `tasks`, `habits`, `projects`, `key_results` and `plan`. New routes for project detail. Small changes to the Plan tab (KR tile, project taps).
- **Data:** no schema change. The schema stays at version 1; HabitCheck and LogEntry tables from milestone 1 get repositories.
- **Dependencies:** none expected.
- **docs/SPEC.md** needs updating when this change is archived:
  - §5: completing a task always creates a log entry
  - §6.2: task reordering is deferred
  - §10: the task-deadline question is answered (no effect on urgency)
  - §6.1: quick log saves when a project is chosen.

## Out of scope

- **Reordering tasks** (SPEC §6.2). It needs a `sort_order` column and a schema migration; open tasks are ordered by due date, then creation time.
- **Settings screen** (SPEC §4 Settings). The deadline warning lead time is fixed at 7 days.
- **Notifications** (milestone 3). Reminder times stay display-only.
- **Weekly review** (milestone 4). The Review tab remains a placeholder.
- **Sync and authentication** (milestone 5).
- **Logging work against a KR without a project**, and editing log entries. Entries can be deleted and logged again.
- **Tasks without a project.** All tasks are created from a project's detail screen.
- **Checking habits for past days.** Only today can be checked.
- **Reopening completed tasks** other than through the Undo action right after completing. Completed tasks are not listed.
