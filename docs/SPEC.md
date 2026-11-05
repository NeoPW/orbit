# Project Tracker: Application Spec

A personal, local-first app for tracking work: projects, tasks, habits and the work done on them, and which goals that work serves, with focused work sessions and a weekly review. Single user.

## 1. Goals and non-goals

**Goals**
- A desktop app first: the main place to plan, work and review is the PC, and it works fully offline. All data lives on the device first.
- The same app also runs in a browser, for using it on another computer.
- Later, a small Android companion app to look at tasks and track time.
- Syncs between the desktop, the browser and the phone through a small server of its own.
- See at a glance what to do today, ranked by what matters most, and start focused work on it in one step.
- See at a glance which goals your projects and work serve.
- Get back into any project quickly via its next steps.
- Weekly review: see the week's work, then update projects and goals in one place, score the week and plan the next.
- Notifications for habits, deadlines, the end of a focus session and the weekly review.
- Pleasant to use: a clear visual hierarchy, little text noise, and few clicks for daily actions (see §6.7).

**Non-goals (for now)**
- Multi-user, sharing, collaboration.
- A cap on the number of active projects (explicitly not wanted).
- Rich text, file attachments, calendar integration.
- Windows and macOS builds.
- Advanced statistics (later milestone).

## 2. Tech stack

| Concern | Choice |
|---|---|
| Desktop app | Tauri 2 (Rust shell, system webview). Linux packages: `.deb` and AppImage. Development runs as "Orbit Dev" with their own data |
| Frontend | React + TypeScript, built with Vite. The same frontend is the browser build |
| Local database | SQLite with Drizzle: the Tauri SQL plugin on the desktop, SQLite WASM in OPFS in the browser |
| Sync server | Cloudflare Worker + D1 (SQLite), free plan. The Worker also serves the browser build |
| Login | One long secret token per device, entered once; no accounts. Cloudflare Access can be put in front of the browser build later |
| Sync | Custom, last-write-wins per row (see §7) |
| Notifications | Desktop notifications from the Tauri app while it runs (§8) |
| Android (later) | A companion app for tasks and time tracking; Tauri mobile or native Kotlin, decided when it is built |
| Quality | Strict TypeScript, ESLint, Vitest (`npm run check`) |

The app must be fully usable with no sync server configured. Sync is an add-on, but it is what connects the desktop, the browser and the phone: until sync exists, each has its own local data.

Desktop-only features (native SQLite, tray, global hotkey, notifications) are reached through one platform layer; the browser build works without them. Fonts and images are bundled, never loaded from the network.

## 3. Core concepts

- **Goal:** what you are working toward, time-boxed (e.g. a quarter). Its progress is tracked by its measures, and projects, tasks and habits can serve it.
- **Measure:** a way to track a goal's progress, belonging to exactly one goal: a number with a target ("Run 100 km"), a yes/no ("Get the certificate") or the check-ins of a habit. A goal can have several measures; they live on the goal's page and are updated there or in the weekly review.
- **Project:** a body of work, optionally serving one goal. Has an importance, an optional deadline, a status and any number of **next steps**.
- **Task:** a concrete to-do with its own page, a small project of its own. It can stand alone or be assigned to exactly one project or goal, has an optional deadline, an optional importance and notes, and work can be logged on it. Tasks of a project can be marked as its next steps; tasks are not only next steps.
- **Habit:** a recurring task belonging to a project, a goal, both or neither, with a schedule. Checking it off logs work automatically. A measure can count a habit's check-ins.
- **Log entry:** a record of work done (when, optionally how long, what, for which project, goal or task).
- **Timer / focus session:** a running stopwatch for work on a project or task, optionally with a planned length. At most one runs at a time, also across devices. Stopping it logs the elapsed time as a log entry.
- **Weekly note:** a short "where does this stand" note on a project or goal for one week, written in the weekly review. Together they form the project's or goal's history.
- **Weekly review:** a per-week record with a score, a reflection and a plan for next week.

Projects belong to an **area** (e.g. Job, Personal, Sport, Uni), a user-defined list.

## 4. Data model

All synced tables share these columns:
- `id` UUID (generated on the client)
- `created_at`, `updated_at` (UTC timestamps)
- `deleted_at` nullable (soft delete; needed for sync)

The server stores the same tables with the same columns, plus a server-set change number (`server_seq`) used to find changes since the last pull (§7).

### Area
- `name`, `color`, `sort_order`

### Goal
- `title`, `description`
- `start_date`, `end_date`
- `status`: `active | completed | archived`
- `sort_order`
- `color` nullable (`#RRGGBB`; when null, one of the palette by `sort_order`)

### Measure
- `goal_id`
- `title`, `description`
- `measure_type`: `numeric | boolean | habit`
- `start_value`, `target_value`, `current_value`, `unit` (for numeric)
- `step` (for numeric): the amount the − / + buttons change `current_value` by, default 1
- `habit_id` nullable (for habit measures; progress = check-ins counted against target)
- `sort_order`

### Project
- `title`, `description`
- `area_id` nullable
- `goal_id` nullable
- `status`: `active | backlog | paused | completed`
- `importance`: integer 1–5
- `deadline` nullable
- `completed_at` nullable (set when the status becomes `completed`, cleared when it changes away from it)

A project's next steps are its tasks with `is_next_step` set (see Task); the project itself stores no next step.

### Task
- `project_id` nullable, `goal_id` nullable: at most one of them is set (a task without either is standalone)
- `title`, `notes`
- `due_date` nullable (the task's deadline)
- `importance` nullable: integer 1–5; when null, the task's importance is inherited (§5, Task rank)
- `is_next_step`: bool, default false; only meaningful for a task of a project. A project can have several next steps. The flag lives on the task so that marking next steps on two devices before they sync keeps both.
- `status`: `open | done`
- `completed_at` nullable

### Habit
- `title`
- `project_id` nullable, `goal_id` nullable (either, both or neither)
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
- `project_id` nullable, `goal_id` nullable, `task_id` nullable
- `occurred_at`
- `duration_minutes` nullable
- `note`
- `source`: `manual | habit | task | timer`

### Timer
- `project_id` nullable, `task_id` nullable: exactly one of them is set
- `started_at` (UTC)
- `planned_minutes` nullable: the planned length of a focus session (25, 50 or 90 from the quick choices, or any other number); null for an open-ended session
- There is at most one row: it has a fixed ID, so starting a timer on two devices gives one record (the later start wins). Stopping soft-deletes it.

### Note
- `target_type`: `project | goal`
- `target_id`
- `week_start` (Monday, local date)
- `note` (text)
- One note per target and week: the ID is derived from (`target_type`, `target_id`, `week_start`), so the same note written on two devices is one record.

### WeeklyReview
- `week_start` (Monday, local date), unique
- `score`: integer 1–10
- `reflection` (text)
- `plan_next_week` (text)
- `completed_at` nullable (a review without it is a draft)

### ReviewMeasureSnapshot
- `weekly_review_id`, `measure_id`
- `progress` (0–1, the measure's progress when the review was saved)

### Settings (local only, not synced)
- Reminders on/off (default on), default reminder time (default 08:00; used by habits without own time and by deadline reminders), deadline lead time (default 7 days, 1–30), weekly review day and time (default Sunday 18:00).
- Sync server address and the device's token; sync bookkeeping (watermarks, last sync).
- Stored in a local-only key-value table, never synced.

## 5. Derived logic

### Effective deadline
- Goal: its `end_date`. An active goal past its end date is overdue.
- Project: `project.deadline ?? end_date of its goal ?? none`
- Task: its own `due_date` only; a task does not inherit deadlines from its project or goal for display. (For ranking, see Task rank.)

### Urgency
Measured in local calendar days from today to a deadline:

| Deadline | Urgency |
|---|---|
| Overdue | 5 |
| ≤ 3 days | 4 |
| ≤ 7 days | 3 |
| ≤ 30 days | 2 |
| > 30 days or none | 1 |

### Project score (project overview ordering)
- `score = importance × urgency`, urgency from the project's effective deadline. Task due dates do not affect a project's score.
- Sort by score descending; ties broken by nearest effective deadline (none last), then title.
- The numeric score is not shown; a deadline badge ("due in 3 days", "overdue") makes the ordering self-explanatory.

### Task rank (Home to-do ordering)
- `rank = importance × urgency`
- **Importance:** the task's own `importance`; else, for a task of a project, the project's importance; else 3 (goals have no importance, so a task of a goal or a standalone task without its own importance counts as 3).
- **Urgency:** from the task's `due_date`; else from its project's effective deadline; else from its goal's end date; else 1.
- Sort by rank descending; ties broken by nearest due date or inherited deadline (none last), then creation (oldest first).
- The numeric rank is not shown; importance and deadline appear as dots and a badge.

### Habits
- A habit is "due today" if:
  - `daily`: always
  - `weekdays`: today is in `weekdays`
  - `times_per_week`: this week's check-ins < `times_per_week` (Monday-based week)
- Checking a habit creates a `HabitCheck` and a `LogEntry` (`source = habit`, linked to the habit's project or goal). Unchecking removes both.

### Progress
- Measure:
  - `numeric`: `(current - start) / (target - start)`, clamped to 0–1
  - `boolean`: 0 or 1
  - `habit`: check-ins of the linked habit since the goal's start date, divided by `target_value`
- Goal: the average progress of its measures. A goal without measures has no progress; it is shown without a percentage.

### Next steps
- Any open task of a project can be marked or unmarked as a next step; a project can have several.
- Completing a next-step task while the project has other open next steps completes it without a prompt.
- Completing the project's **last** open next step prompts: "What's the next step?": create a new task, pick one or more existing open tasks, or skip (no next step). Cancelling the prompt leaves the task open.

### Timer and focus
- Starting a timer while another runs stops the running one first (and logs it).
- With `planned_minutes`, the end of the planned time is marked by a desktop notification and a sound; the timer keeps counting into overtime and is not stopped automatically.
- Stopping asks "What did you get done?"; the answer becomes the log entry's note. It then creates a `LogEntry` (`source = timer`, `occurred_at` = start, linked to the project, or to the task and its project or goal) with the elapsed whole minutes, at least 1. When the session ran for a task that is completed at that point and was a next step, the next-step prompt follows.
- The timer can also be discarded without logging.
- The elapsed time is computed from `started_at`, so the timer keeps running while the app is closed.

### Work per goal
- Work on a goal is every log entry linked to the goal itself, to one of its projects, or to a task of the goal or of one of its projects. Work is counted per entry and by total duration.
- A project's work counts for the goal it serves now, also for weeks before it was linked.

### Weeks
- The **current week** is the Monday–Sunday week containing today; **last week** is the one before.
- The **review week** (for the weekly review) is on Sunday the current week, on any other day last week.
- A week's summary is computed from the stored log entries, habit checks, completed tasks and completed projects, so it stays available for every past week. Habit adherence uses the habits' current schedules.
- **Goal progress in a week:** a past week shows the progress saved with its completed review; a week without a completed review (the current week, or last week before it is reviewed) shows the current progress. The **change** is measured against the most recent completed review before that week. Without such a review, no change is shown.

### Completing tasks and projects
- Marking a task done always creates a `LogEntry` (`source = task`, the task title as note, linked to the task and to its project or goal). An Undo right after completing reopens the task and removes the entry.
- A done task can be reopened from its task page; its log entries stay.
- Setting a project's status to `completed` sets its `completed_at`; that is the week it counts as finished in.

## 6. Screens

Three main destinations: **Home**, **Plan** and **Review**, plus **Settings**. The navigation itself (on the desktop and in narrow browser windows) is designed in the app shell change.

### 6.1 Home (today)
Desktop layout with a main column and a side column.

**Main column**, top to bottom:
1. **Today:** the weekday and date.
2. **Focus panel:** pick a task or project (the to-do list below and the active projects are offered), choose a planned length (25, 50 or 90 minutes, or open-ended) and start. While a timer runs, the panel shows what it runs for, the elapsed time counting live (and the overtime after a planned length), **Stop** and **Discard**, and a button to enter focus mode again.
3. **Habits due today:** in their own row, as compact chips labeled with their project or goal; clicking a chip checks or unchecks it. Habits are not ranked with tasks.
4. **To do:** the open next-step tasks of active projects and the open tasks outside projects (standalone or assigned to a goal), ranked by task rank (§5). Each row shows a checkbox, the title, its project or goal, importance dots and a deadline badge; a row can be started as a focus session directly. Clicking a row opens the task page.

**Side column:** a compact overview of the active projects, ordered by project score (§5), each with its title, area color, deadline badge and its next steps. Clicking a project opens its detail.

Also on Home: **New task** (title, optional deadline, importance and assignment; saving a plain task takes a title and Enter) and **Log work** (record work done without a timer: optional duration and note, then the project or task).

**Focus mode:** starting a focus session opens a full-window view showing only the task or project, its notes and a large timer (with the planned length and overtime, if set), with Stop and Discard. Stopping follows §5 (Timer and focus).

### 6.2 Project detail
- A header with title, status chip, area chip, importance dots and deadline badge (marked when taken from the goal), then description and the goal it serves (clicking it opens the goal page).
- **Next steps** (marked in the task list instead of being shown twice) and the open tasks; add, complete and delete tasks, mark and unmark next steps; clicking a task opens its task page. Open tasks are ordered by due date; manual reordering is deferred.
- **Weekly notes:** the project's notes, newest week first.
- Habits belonging to this project.
- Log entries for this project (most recent first).
- Status: changed through the status chip in the header, which offers the other statuses (active, paused, backlog, completed).

### 6.3 Task page
- Title, notes, deadline, importance (its own, or shown as inherited), status and what the task is assigned to (project or goal, clicking it opens that item), or "Standalone".
- Marked when it is one of its project's next steps.
- Actions: complete (with Undo), reopen a done task, edit, delete, log work, start a focus session, and "Mark as next step" / "Remove from next steps" for a project's task.
- Log entries for this task (most recent first).

### 6.4 Plan
Redesigned for desktop widths; the detailed layout is designed in its own change. What it contains:
- **Goals:** each active goal with its color, title, progress, date range with a deadline badge for its end date, its measures with progress bars, the **active** projects serving it and its open tasks.
- Active projects without a goal, and active projects whose goal is not active (showing the goal's title), in their own section.
- **Backlog:** all projects with status `backlog` or `paused`, filterable by area. Activating one makes it active.
- **Archive** of completed goals and projects.
- **Habits** and **Areas** lists.
- Create and edit goals, measures, projects, tasks, habits and areas. Clicking a goal, project or task opens its page; each page has Edit.
- **Goal page:** header with title, progress, date range, status and deadline badge, and the description; **measures** with progress bars and their controls in the row (− / + by step, direct editing of the value, a done switch for yes/no, read-only check-ins for a habit measure); the **projects** serving the goal (active first, then backlog and paused; completed ones counted); open tasks and habits of the goal; **work** logged on the goal this week and in total (§5); its **weekly notes**, newest first.
- No planets or other space visuals in Plan.

### 6.5 Review
The review is the main place where projects and goals are updated.
- **Review week:** on Sunday the Monday–Sunday week ending today, on any other day the previous Monday–Sunday week. One review per week.
- **Week summary**, used in all places below, top to bottom:
  - **Goals:** each active goal with its progress and the change since the last completed review (§5, "Weeks"), its measures with their change below it, and the work logged on it that week.
  - **Work:** work logged per project (count and total duration), grouped by the goal the project serves, then projects without a goal.
  - **Finished:** projects completed and tasks completed that week.
  - **Habits:** adherence per habit (done of expected).
- **Default view**, top to bottom:
  - this week's plan, from the most recently completed review
  - the summary of the **current week** so far, on every day of the week
  - a "Start / Continue / Edit weekly review" button (for the review week, §5)
  - the history
  - a **Last week** button, opening a page with last week's summary.
- **Guided flow**, as full pages with a progress indicator and Back / Next:
  1. **Look back:** the review week's summary: the work done.
  2. **Projects:** go through each active project and update it: status, next steps (mark, unmark, add), importance and deadline, and write its weekly note. Changes apply immediately.
  3. **Goals:** for each active goal, update its status and the values of its number and yes/no measures, and write its weekly note. Changes apply immediately.
  4. Score the week (1–10) and write a reflection.
  5. Write the plan for next week.
  6. Save: sets `completed_at` and stores a progress snapshot of each measure of an active goal.

  Score, reflection and plan are kept as a draft when changing steps or leaving, so a review can be continued later. Weekly notes are saved as they are written. A completed review can be edited and saved again.
- **History:** list of past reviews with score and plan; each opens in full, with that week's summary (goal progress saved with the review) and the weekly notes of that week.
- Later: longer-term stats (score trends, time per area/goal/project, habit streaks).

### 6.6 Settings
- Reminders, default reminder time, weekly review day and time, deadline lead time.
- **Sync:** the server address and this device's token, the time of the last successful sync and whether the last attempt failed, and "Sync now".

### 6.7 Design and interaction
The app should feel calm, clear and quick. The visual design is redefined for the desktop in the app shell change; these guidelines hold for every screen:
- **Desktop first:** layouts use the width of a desktop window (columns, side panels) and still work in a narrower browser window. Keyboard use is first-class: Enter saves forms, Escape closes them.
- **Visual identity (starting point):** dark, with the Orbit palette (deep navy surfaces, a blue-violet primary, a cyan secondary, amber reserved for urgency and red for overdue). Body text uses **Inter**, headings **Space Grotesk**; both are bundled. Body text meets 4.5:1 contrast.
- **Less text, more structure:** metadata as chips, icons and badges instead of text lines: importance as dots, status as a colored chip, deadlines as a badge colored by urgency. Absent values are left out instead of written out ("No area", "No deadline").
- **Compact lists:** dense rows and no duplicate rows for the same item on one screen.
- **Detail pages:** a header with title, status, area and deadline; actions in the header or a menu instead of rows of large buttons.
- **Empty states:** an icon, one line of text and the action that fills the section.
- **Motion:** list changes animate in and out briefly (at most 300 ms), skipped when the system asks to reduce motion.
- **Messages:** short confirmations ("Task completed", "Work logged", …) appear as a compact card that disappears on its own after 3 seconds; an action such as Undo is part of the card while it is shown.

## 7. Sync

- Local SQLite is the source of truth for the UI; the app never waits on the network.
- Every change updates `updated_at`; local changes since the last upload are found by it.
- Sync cycle:
  1. **Push:** send all rows changed since the last complete upload.
  2. **Pull:** fetch, page by page, the rows with a change number after the cursor of the last pull (the server numbers every stored row, so no overlap is needed); apply each if newer than the local copy (last-write-wins per row, by `updated_at`).
  3. Store the new watermarks (in the local settings).
- The server enforces last-write-wins too: it ignores an incoming row whose `updated_at` is not newer than the stored one. Device clocks therefore decide which edit wins. Apart from that, the server has no business logic: it stores rows.
- Deletes are soft (`deleted_at`) so they propagate. Local settings are never synced.
- Habit checks, weekly reviews, the timer and weekly notes get IDs derived from their natural key (habit + date, week start, the fixed timer ID, target + week), so the same record created on two devices is one record.
- Trigger sync on app start, when the app comes back to the foreground, a few seconds after local changes, and with "Sync now" in Settings. Failures are silent, retried later and shown in Settings.
- **Server:** a Cloudflare Worker with a D1 database, one table per entity. Every request carries the device's token (`Authorization: Bearer …`); the Worker compares it with a secret and refuses anything else. There are no accounts and no sign-up.
- **First connection of a device:** if the server has no data, the device uploads its data; otherwise the device's local data is replaced by the server's after a confirmation.
- The Worker also serves the browser build; the browser build holds no data of its own until its token is entered.

## 8. Notifications

Desktop notifications, shown by the Tauri app while it runs (it can keep running in the tray). The browser build shows none.
- **Habits:** a reminder at each habit's `reminder_time` (or the default reminder time) on every day it is due and not yet checked.
- **Deadlines:** for open tasks and active projects with an own deadline, a reminder at the default reminder time when the deadline enters the lead time, and one on the day itself.
- **Focus session:** at the end of a session's planned length, a notification and a sound (§5).
- **Weekly review:** at the configured review day and time (default Sunday 18:00), opening the review flow; skipped when that week's review is already completed.

Clicking a reminder opens its screen: Home for habits, the task page for tasks, the project detail for projects. The Android companion will get its own notifications, including an ongoing one for the running timer.

## 9. Milestones

The app is rebuilt from scratch in this order, one OpenSpec change each (features in small batches):

1. **Rebuild foundation:** Tauri + React + TypeScript skeleton, desktop and browser builds, platform layer, quality tooling, this spec.
2. **Local database:** Drizzle schema with the sync columns, the Tauri SQLite plugin on the desktop and SQLite WASM in the browser.
3. **Sync server:** Cloudflare Worker + D1, token login, push/pull sync, deploy of the Worker and the browser build.
4. **App shell:** navigation, theme, shared components, messages.
5. **Features**, in batches: areas, goals and measures; projects and tasks (with next steps and task importance); habits; work log, timer and focus mode; Home; Plan; Review with weekly notes; Settings; desktop notifications.
6. **Android companion:** tasks and time tracking on the phone.
7. **Later:** stats, Windows/macOS builds.

## 10. Open questions

- Solar system: the solar system of goals (planets), projects (moons) and loose projects (asteroids) is kept as an idea, but where it appears in the new app is decided later.
- Android companion: Tauri mobile (shares the TypeScript code) or native Kotlin (best for the timer notification, a quick-settings tile and a widget).
- Habit schedules: are `daily`, `weekdays` and `times_per_week` enough?
- Area list: fixed defaults (Job, Personal, Sport, Uni) or fully user-defined from the start?
