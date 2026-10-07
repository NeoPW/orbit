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
- Pleasant to use: a clear visual hierarchy, little text noise, and few taps for daily actions (see §6.7).

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
- **Task:** a concrete to-do with its own page, a small project of its own. It can stand alone or be assigned to exactly one project, key result or objective, has an optional deadline and notes, and work can be logged on it. A task of a project can be that project's next step, but tasks are not only next steps.
- **Habit:** a recurring task belonging to a project or KR or none, with a schedule. Checking it off logs work automatically. A KR can be measured by a habit.
- **Log entry:** a record of work done (when, optionally how long, what, for which project, KR or task).
- **Timer:** a running stopwatch for work on a project or task. At most one runs at a time, also across devices. Stopping it logs the elapsed time as a log entry.
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
- `step` (for numeric): the amount the − / + buttons change `current_value` by, default 1
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
- `project_id` nullable, `key_result_id` nullable, `objective_id` nullable: at most one of them is set (a task without any is standalone)
- `title`, `notes`
- `due_date` nullable (the task's deadline)
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
- `project_id` nullable, `key_result_id` nullable, `task_id` nullable
- `occurred_at`
- `duration_minutes` nullable
- `note`
- `source`: `manual | habit | task | timer`

### Timer
- `project_id` nullable, `task_id` nullable: exactly one of them is set
- `started_at` (UTC)
- There is at most one row per user: it has a fixed ID, so starting a timer on two devices gives one record (the later start wins). Stopping soft-deletes it.

### WeeklyReview
- `week_start` (Monday, local date), unique
- `score`: integer 1–10
- `reflection` (text)
- `plan_next_week` (text)
- `completed_at` nullable (a review without it is a draft)

### ReviewKrSnapshot
- `weekly_review_id`, `key_result_id`
- `progress` (0–1, the KR's progress when the review was saved)

### Settings (local only, not synced)
- Reminders on/off (default on), default reminder time (default 08:00; used by habits without own time and by deadline reminders), deadline warning lead time (default 7 days, 1–30), weekly review day and time (default Sunday 18:00).
- Sync credentials are not settings: the Supabase session keeps the sign-in, and sync bookkeeping (watermarks, last sync, account of the device) uses `sync_*` keys of the settings table.
- Stored in a local-only `settings` key-value table, never synced.

## 5. Derived logic

### Effective deadline
- Objective: its `end_date`. An active objective past its end date is overdue.
- KR: `kr.deadline ?? objective.end_date`
- Project: `project.deadline ?? effective deadline of its KR ?? none`
- Task: its own `due_date` only; a task does not inherit deadlines from its project, KR or objective.

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

- Task due dates do not affect urgency; only the project's effective deadline counts.
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
- Marking a project's next-step task as done prompts: "What's the next step?" (create a new task, pick an existing open task, or skip). Cancelling the prompt leaves the task open.

### Timer
- Starting a timer while another runs stops the running one first (and logs it).
- Stopping creates a `LogEntry` (`source = timer`, `occurred_at` = start, linked to the project, or to the task and its project or KR) with the elapsed whole minutes, at least 1. The timer can also be discarded without logging.
- The elapsed time is computed from `started_at`, so the timer keeps running while the app is closed.

### Weeks
- The **current week** is the Monday–Sunday week containing today; **last week** is the one before.
- The **review week** (for the weekly review) is on Sunday the current week, on any other day last week.
- A week's summary is computed from the stored log entries, habit checks and completed tasks, so it stays available for every past week. Habit adherence uses the habits' current schedules. KR progress of a past week comes from the snapshots of that week's completed review; a week without a completed review (the current week, or last week before it is reviewed) shows the current progress.

### Completing tasks
- Marking a task done always creates a `LogEntry` (`source = task`, the task title as note, linked to the task and to its project or KR). An Undo right after completing reopens the task and removes the entry.
- A done task can be reopened from its task page; its log entries stay.

## 6. Screens

Bottom navigation with three tabs: **Plan**, **Home**, **Review**. Each of them has a **Settings** button in its top bar.

### 6.1 Home (today)
A dashboard for the day, top to bottom:
1. **Header:** today's weekday and date, the number of tasks due today, and the habits done of due as an orbit ring ("2/4").
2. **Habits due today:** compact chips, labeled with their project or KR; tapping a chip checks or unchecks it.
3. **Upcoming deadlines:** KRs and tasks inside projects whose *own* deadline is overdue or within the warning lead time (default 7 days), sorted by date. Active projects and tasks outside projects are not listed here: their deadline is shown as a badge on their own card below, so nothing appears twice.
4. **Active projects:** sorted by score (§5). Each card shows title, area, deadline badge and the next step as a checkbox. Ticking the next step opens the next-step prompt and marks it done unless the prompt is cancelled. Tapping the card opens the project detail.
5. **Tasks:** open tasks that are not part of a project (standalone, or assigned to a KR or objective), sorted by deadline (overdue first, none last), then by creation. Each shows a checkbox, title, what it is assigned to and a deadline badge; tapping it opens the task page.

Two floating action buttons:
- **Left: new task.** A sheet with title, optional deadline and optional assignment (project, KR or objective). Saving takes two taps for a plain task.
- **Right: quick log.** An optional duration and note on top, then the active projects and the open tasks outside projects (recently used first). Tapping one saves the entry, so a plain log entry takes two taps. A switch at the top changes the sheet to **Start timer**: tapping a project or task then starts a timer for it instead.

While a timer runs, a **timer card** at the top of Home (below the header) shows what it runs for and the elapsed time, counting live, with **Stop** (logs the time) and **Discard**.

### 6.2 Project detail
- A header with title, status chip, area chip, importance dots and deadline badge (marked when taken from the KR), then description and linked KR.
- Next step (editable) and open tasks; add, complete and delete tasks; tapping a task opens its task page. The next step is marked in the task list instead of being shown twice. Open tasks are ordered by due date; manual reordering is deferred.
- Habits belonging to this project.
- Log entries for this project (most recent first).
- Status: changed through the status chip in the header, which offers the other statuses (active, paused, backlog, completed).

### 6.3 Task page
- Title, notes, deadline, status and what the task is assigned to (project, KR or objective, tapping it opens that item), or "Standalone".
- Marked when it is its project's next step.
- Actions: complete (with Undo), reopen a done task, edit, delete, log work, and "Make next step" for a project's task that is not its next step.
- Log entries for this task (most recent first).
- Reachable from Home, the project detail, the Plan tab, the review summary and deadline reminders.

### 6.4 Plan
- **Objectives list:** for each active objective, its date range with a deadline badge for its end date (amber within the lead time, red "Overdue" once it has passed), its key results (progress as orbit rings), and under each KR the **active** projects linked to it. Shown one after another.
- Active projects with no KR are listed in a separate "Projects without a KR" section. Active projects whose KR belongs to a non-active objective are also listed there, with the KR's title.
- Only active projects appear in the objectives list; backlog and paused projects appear only in the Backlog.
- Open tasks assigned to a KR or an objective are listed under it, like projects.
- Create and edit objectives, KRs, projects, tasks, habits and areas. The create button offers **New task** next to new objective, project and habit. Creating and editing happen in a **sheet** like the new-task sheet (a bottom sheet on phones, a side sheet on wide screens), not on a separate page.
- A **More** button in the top bar opens a sheet with large tiles for Habits, Areas and Archive; Settings has its own button (§6).
- Tapping an objective, KR, project or task opens its **page** (on wide screens in the detail pane), never the edit form directly; each page has Edit in its top bar. Task rows have no extra menu: their checkbox completes them and tapping opens the page.
- **Objective page:** a header with title, date range, status chip and deadline badge, the description, its key results with progress, and the open tasks assigned to it.
- **KR page:** a header with title, progress ring, current and target value and deadline badge, then progress controls: − / + buttons changing the current value by the KR's step plus editing the value directly (numeric), a done switch (boolean), or the linked habit's check-ins (habit, read-only). Below: the linked projects, open tasks and habits, and the log entries on the KR.
- **Backlog:** all projects with status `backlog` or `paused`, filterable by area. Activating one makes it appear on Home.
- Archive of completed objectives and projects.

### 6.5 Review
- **Review week:** on Sunday the Monday–Sunday week ending today, on any other day the previous Monday–Sunday week. One review per week.
- **Default view**, top to bottom:
  - this week's plan, from the most recently completed review
  - the **current week** so far, on every day of the week: work logged per project (count and total duration), habit adherence per habit (done of expected), tasks completed, KR progress with the change since the previous completed review
  - a "Start / Continue / Edit weekly review" button (for the review week, §5: last week until Saturday, the current week on Sunday)
  - the history
  - a **Last week** button at the bottom, opening a page with last week's summary.
- **Guided flow**, shown as full-screen pages with a progress bar and Back / Next:
  1. Look back: the week summary.
  2. Projects: go through each active project; update status and next step (applied immediately).
  3. Key results: update values of numeric/boolean KRs (applied immediately).
  4. Score the week (1–10) and write a reflection.
  5. Write the plan for next week.
  6. Save: sets `completed_at` and stores a progress snapshot of each KR of an active objective.

  Score, reflection and plan are kept as a draft when changing steps or leaving, so a review can be continued later. A completed review can be edited and saved again.
- **History:** list of past reviews with score and plan; each opens in full, with that week's summary (work logged, habits, tasks completed, and the KR progress saved with the review).
- Later: longer-term stats (score trends, time per area/project, habit streaks).

### 6.6 Settings
- Reachable from the top bar of Plan, Home and Review.
- Reminders, default reminder time, weekly review day and time, deadline lead time, account and sync.

### 6.7 Design and interaction
The app should feel calm, clear and quick. Guidelines for every screen:
- **Visual identity:** the space-inspired Orbit palette instead of the default Material seed: deep navy "night sky" surfaces in dark mode (#0B1026) and light lavender-grey ones in light mode (#F4F5FB), a blue-violet primary, a cyan secondary and an amber color reserved for urgency (red for overdue). Area colors are accents on cards and chips. Body text meets 4.5:1 contrast in both themes. Text uses **Inter**, bundled with the app so it also works offline, with bold titles and smaller, muted secondary text. Progress (habits today, KRs, review scores) is shown as orbit rings. A logo and app icon are a later branding step.
- **Less text, more structure:** metadata as chips, icons and badges instead of text lines. For example importance as dots or stars, status as a colored chip, deadlines as a badge colored by urgency. Absent values are left out instead of written out ("No area", "No deadline").
- **Compact cards and lists:** denser rows, cards for projects and tasks, and no duplicate rows for the same item on one screen.
- **Detail pages:** a header with title, status, area and deadline; actions in the top bar or a menu instead of rows of large buttons.
- **Empty states:** an icon, one line of text and the action that fills the section.
- **Motion:** list changes (checking, completing, reordering by score) animate in and out, and pages open with a short fade transition. Animations take at most 300 ms and are skipped when the system asks to remove animations.
- **Messages:** short confirmations ("Task completed", "Work logged", …) appear at the top of the screen as a compact card with an icon, disappear on their own after 3 seconds and can be swiped away. An action such as Undo or Open is part of the card while it is shown.
- **Wide screens:** from 1000 px on, Plan shows the list and the selected project or task side by side; below that they open as pages.

## 7. Sync

- Local SQLite is the source of truth for the UI; the app never waits on the network.
- Every change updates `updated_at`; local changes since the last upload are found by it.
- Sync cycle:
  1. **Push:** upsert all rows changed since the last complete upload.
  2. **Pull:** fetch rows with a server-set `server_updated_at` after the last pull (minus a 2-minute overlap); apply each if newer than the local copy (last-write-wins per row, by `updated_at`).
  3. Store the new watermarks (in the local settings table).
- The server enforces last-write-wins too: a trigger ignores an update whose `updated_at` is not newer than the stored row. Device clocks therefore decide which edit wins.
- Deletes are soft (`deleted_at`) so they propagate. Local settings are never synced.
- Habit checks and weekly reviews get IDs derived from their natural key (habit + date, week start), so the same record created on two devices is one record.
- Trigger sync on app start, on resume, a few seconds after local changes, via pull-to-refresh and with "Sync now" in Settings. Failures are silent, retried later and shown in Settings.
- **First sign-in on a device:** an empty account receives the device's data; otherwise the device's local data is replaced by the account's after a confirmation.
- Supabase: one table per entity (`supabase/schema.sql`), RLS policy `user_id = auth.uid()`, email and password login. There is no sign-up in the app: the single user is created in the dashboard and sign-ups are disabled.
- The app gets the project URL and publishable key at build time (`--dart-define-from-file=supabase.json`); without them it runs without sync.
- Note: free Supabase projects pause after a period of inactivity. Since data is local-first, a pause only delays sync.

## 8. Notifications

Android only. All scheduled locally with `flutter_local_notifications` as exact alarms, for the next 14 days, and rescheduled whenever relevant data or settings change and when the app starts or returns to the foreground:
- **Habits:** a reminder at each habit's `reminder_time` (or the default reminder time) on every day it is due and not yet checked.
- **Deadlines:** for open tasks (inside or outside projects), active projects and KRs with an own deadline, a reminder at the default reminder time when the deadline enters the lead time, and one on the day itself.
- **Running timer:** while a timer runs, an ongoing notification shows what it runs for and the elapsed time, counting live, also when the timer was started on another device. It disappears when the timer is stopped; tapping it opens Home.
- **Weekly review:** at the configured review day and time (default Sunday 18:00), opening the review flow; skipped when that week's review is already completed.

Tapping a reminder opens its screen: Home for habits, the task page for tasks, the project detail for projects, the KR page for KRs.

## 9. Milestones

1. **Foundation:** Flutter project for Android and web, drift schema with sync columns (working on both platforms), responsive app shell, Plan tab CRUD for areas, objectives, KRs, projects and the backlog.
2. **Home:** tasks and next steps, habits and habit checks, upcoming deadlines, project score sorting, quick log, project detail.
3. **Notifications:** habit and deadline reminders (Android), settings.
4. **Review:** last-week summary, guided weekly review, review history, weekly review reminder and its day/time settings.
5. **Sync:** Supabase schema and RLS, auth, push/pull sync.
6. **Tasks and navigation:** tasks as their own items (assignment to project, KR or objective, task page, log work on tasks), new-task button on Home and in Plan, tasks section on Home, Settings from every main screen.
7. **Design refresh:** the guidelines of §6.7 applied to all screens, Home as a dashboard, review flow as pages, two-pane Plan on wide screens.
8. **Timer and detail pages:** work timer with a running notification, objective and KR pages with KR progress buttons, create and edit in sheets, the Plan More sheet, overdue objectives, the Review tab on the current week with a last-week page and past weeks' summaries, messages at the top.
9. **Later:** stats, optional native desktop builds.

The schema includes the sync columns from milestone 1, so adding sync later requires no migration of existing data.

## 10. Open questions

- Habit schedules: are `daily`, `weekdays` and `times_per_week` enough?
- Area list: fixed defaults (Job, Personal, Sport, Uni) or fully user-defined from the start?
