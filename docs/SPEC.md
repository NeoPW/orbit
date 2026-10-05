# Project Tracker: Application Spec

A personal, local-first app for tracking objectives, key results, projects, tasks, habits and work done, with a weekly review. Inspired by OKRs and a focus/weekly-review workflow. Single user.

## 1. Goals and non-goals

**Goals**
- Works fully offline; all data lives on the device first.
- Syncs between phone and (later) desktop/web through a backend.
- Mobile is primarily a tracker: see what to do today, check habits, log work quickly.
- Get back into any project quickly via its "next step".
- Weekly review: see last week's work, score the week, plan the next.
- Notifications for habits, deadlines and the weekly review.

**Non-goals (for now)**
- Multi-user, sharing, collaboration.
- A cap on the number of active projects (explicitly not wanted).
- Rich text, file attachments, calendar integration.
- Advanced statistics (later milestone).

## 2. Tech stack

| Concern | Choice |
|---|---|
| Framework | Flutter (Dart). Targets: Android (phone) and web (PC, in the browser) |
| Local database | SQLite via `drift` + `drift_flutter` (native SQLite on Android, sqlite3 WASM on web) |
| State management | Riverpod (default; can be swapped during planning) |
| Notifications | `flutter_local_notifications` (scheduled locally, no push server) |
| Backend | Supabase (Postgres + Auth + Row Level Security), free tier |
| Sync | Custom, last-write-wins per row (see §7) |

The app must be fully usable with no backend configured. Sync is an add-on, but it is what connects the phone and the web version: until sync exists, each has its own local data.

Notifications are Android only. The web version is used for planning, logging and reviews on the PC. Layout: bottom navigation on narrow screens, navigation rail on wide screens.

## 3. Core concepts

- **Objective:** what you are working toward, time-boxed (e.g. a quarter).
- **Key Result (KR):** a measurable outcome belonging to an objective.
- **Project:** a body of work, optionally linked to a KR. Has an importance, an optional deadline, a status and a *next step*.
- **Task:** a concrete to-do, usually belonging to a project. One task per project can be marked as its next step.
- **Habit:** a recurring task belonging to a project or KR or none, with a schedule. Checking it off logs work automatically. A KR can be measured by a habit.
- **Log entry:** a record of work done (when, optionally how long, what, for which project/KR).
- **Weekly review:** a per-week record with a score, a reflection and a plan for next week.

Projects belong to an **area** (e.g. Job, Personal, Sport, Uni), a user-defined list.

## 4. Data model

All synced tables share these columns:
- `id` UUID (generated on the client)
- `created_at`, `updated_at` (UTC timestamps)
- `deleted_at` nullable (soft delete; needed for sync)

Server-side, every table also has `user_id` (Supabase auth user), protected by RLS.

### Area
- `name`, `color`, `sort_order`

### Objective
- `title`, `description`
- `start_date`, `end_date`
- `status`: `active | completed | archived`
- `sort_order`

### KeyResult
- `objective_id`
- `title`, `description`
- `measure_type`: `numeric | boolean | habit`
- `start_value`, `target_value`, `current_value`, `unit` (for numeric)
- `habit_id` nullable (for habit-measured KRs; progress = check-ins counted against target)
- `deadline` nullable (defaults to the objective's `end_date` when null)
- `sort_order`

### Project
- `title`, `description`
- `area_id` nullable
- `key_result_id` nullable
- `status`: `active | backlog | paused | completed`
- `importance`: integer 1–5
- `deadline` nullable
- `next_step_task_id` nullable

### Task
- `project_id` nullable
- `title`, `notes`
- `due_date` nullable
- `status`: `open | done`
- `completed_at` nullable

### Habit
- `title`
- `project_id` nullable, `key_result_id` nullable
- `schedule_type`: `daily | weekdays | times_per_week`
- `weekdays`: set of weekdays (for `weekdays`)
- `times_per_week`: integer (for `times_per_week`)
- `reminder_time` nullable (local time of day)
- `active`: bool

### HabitCheck
- `habit_id`, `date` (local calendar date)
- `log_entry_id`
- Unique per (`habit_id`, `date`)

### LogEntry
- `project_id` nullable, `key_result_id` nullable
- `occurred_at`
- `duration_minutes` nullable
- `note`
- `source`: `manual | habit | task`

### WeeklyReview
- `week_start` (Monday, local date), unique
- `score`: integer 1–10
- `reflection` (text)
- `plan_next_week` (text)
- `completed_at` nullable

### Settings (local only, not synced)
- Habit reminder default time, weekly review day and time, deadline warning lead time (default 7 days), sync credentials.

## 5. Derived logic

### Effective deadline
- KR: `kr.deadline ?? objective.end_date`
- Project: `project.deadline ?? effective deadline of its KR ?? none`

### Project score (home screen ordering)
- `score = importance × urgency`
- Urgency from the project's effective deadline, measured in local calendar days from today:

| Effective deadline | Urgency |
|---|---|
| Overdue | 5 |
| ≤ 3 days | 4 |
| ≤ 7 days | 3 |
| ≤ 30 days | 2 |
| > 30 days or none | 1 |

- Sort by score descending; ties broken by nearest effective deadline (none last), then title.
- Each project card shows a deadline badge ("due in 3 days", "overdue") so the ordering is self-explanatory. The numeric score is not shown.

### Habits
- A habit is "due today" if:
  - `daily`: always
  - `weekdays`: today is in `weekdays`
  - `times_per_week`: this week's check-ins < `times_per_week` (Monday-based week)
- Checking a habit creates a `HabitCheck` and a `LogEntry` (`source = habit`, linked to the habit's project/KR). Unchecking removes both.

### KR progress
- `numeric`: `(current - start) / (target - start)`, clamped to 0–1
- `boolean`: 0 or 1
- `habit`: check-ins of the linked habit since the objective's start date, divided by `target_value`

### Next step
- Marking a project's next-step task as done prompts: "What's the next step?" (create a new task, pick an existing open task, or skip).

### Completing tasks
- Marking a task done may optionally create a `LogEntry` (`source = task`).

## 6. Screens

Bottom navigation with three tabs: **Plan**, **Home**, **Review**.

### 6.1 Home (today)
Order from top to bottom:
1. **Habits due today:** checkboxes, grouped or labeled by project.
2. **Upcoming deadlines:** tasks, projects and KRs whose *own* deadline is overdue or within the warning lead time (default 7 days), sorted by date. Inherited deadlines are not listed separately here, to avoid duplicates.
3. **Active projects:** sorted by score (§5). Each card shows title, area, deadline badge and the next step. Tapping the next step marks it done (with the next-step prompt). Tapping the card opens the project detail.

A floating action button opens **quick log**: pick a project (recently used first), optional duration, note. The goal is two taps for a log entry.

### 6.2 Project detail
- Title, description, area, linked KR, importance, deadline (own and effective), status.
- Next step (editable) and open tasks; add, complete, reorder tasks.
- Habits belonging to this project.
- Log entries for this project (most recent first).
- Actions: activate / pause / move to backlog / complete.

### 6.3 Plan
- **Objectives list:** for each active objective, its key results (with progress bars), and under each KR the **active** projects linked to it. Shown one after another.
- Active projects with no KR are listed in a separate "Projects without a KR" section. Active projects whose KR belongs to a non-active objective are also listed there, with the KR's title.
- Only active projects appear in the objectives list; backlog and paused projects appear only in the Backlog.
- Create and edit objectives, KRs, projects, habits and areas.
- **Backlog:** all projects with status `backlog` or `paused`, filterable by area. Activating one makes it appear on Home.
- Archive of completed objectives and projects.

### 6.4 Review
- **Default view:** last week at a glance:
  - work logged per project (count and total duration)
  - habit adherence per habit
  - tasks completed
  - KR progress changes
- **"Start weekly review"** button opens the guided flow:
  1. Look back: last week's summary (auto-filled from the logs).
  2. Projects: go through each active project; update status and next step.
  3. Key results: update values of numeric/boolean KRs.
  4. Score the week (1–10) and write a reflection.
  5. Write the plan for next week.
  6. Save (sets `completed_at`).
- **History:** list of past reviews with score and plan.
- Later: longer-term stats (score trends, time per area/project, habit streaks).

## 7. Sync

- Local SQLite is the source of truth for the UI; the app never waits on the network.
- Every change updates `updated_at` and marks the row dirty locally.
- Sync cycle:
  1. **Push:** upsert all dirty rows to Supabase.
  2. **Pull:** fetch rows with `updated_at > last_pulled_at`; apply each if newer than the local copy (last-write-wins per row).
  3. Store the new `last_pulled_at`.
- Deletes are soft (`deleted_at`) so they propagate.
- Trigger sync on app start, on resume, debounced after local changes, and via pull-to-refresh. Failures are silent and retried later.
- Supabase: one table per entity, RLS policy `user_id = auth.uid()`, email login.
- Note: free Supabase projects pause after a period of inactivity. Since data is local-first, a pause only delays sync.

## 8. Notifications

All scheduled locally with `flutter_local_notifications`, rescheduled whenever relevant data or settings change:
- **Habits:** daily reminder at each habit's `reminder_time` (or the default time) if it is due and not yet checked.
- **Deadlines:** a reminder when a task, project or KR deadline is within the lead time, and on the day itself.
- **Weekly review:** at the configured day and time (e.g. Sunday evening), opening the review flow.

## 9. Milestones

1. **Foundation:** Flutter project for Android and web, drift schema with sync columns (working on both platforms), responsive app shell, Plan tab CRUD for areas, objectives, KRs, projects and the backlog.
2. **Home:** tasks and next steps, habits and habit checks, upcoming deadlines, project score sorting, quick log, project detail.
3. **Notifications:** habits, deadlines, weekly review.
4. **Review:** last-week summary, guided weekly review, review history.
5. **Sync:** Supabase schema and RLS, auth, push/pull sync.
6. **Later:** stats, optional native desktop builds.

The schema includes the sync columns from milestone 1, so adding sync later requires no migration of existing data.

## 10. Open questions

- Should task deadlines also raise their project's urgency, or only project/KR deadlines?
- Habit schedules: are `daily`, `weekdays` and `times_per_week` enough?
- Area list: fixed defaults (Job, Personal, Sport, Uni) or fully user-defined from the start?
