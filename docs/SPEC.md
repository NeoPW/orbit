# Project Tracker: Application Spec

A personal, local-first app for tracking work: projects, tasks, habits and the work done on them, and which goals that work serves, with a weekly review. Single user.

## 1. Goals and non-goals

**Goals**
- Works fully offline; all data lives on the device first.
- Syncs between phone and (later) desktop/web through a backend.
- Mobile is primarily a project and work tracker: see what to do today, check habits, log work quickly.
- See at a glance which goals your projects and work serve.
- Get back into any project quickly via its "next step".
- Weekly review: see the week's work and the progress on your goals, score the week, plan the next.
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
| Android distribution | Signed release APK, installed by hand (no store); development builds install next to it as "Orbit Dev" |
| Web hosting | Static build on Cloudflare Pages (`orbit-neo.pages.dev`, public URL; data stays behind the Supabase login), deployed by hand from a local script |

The app must be fully usable with no backend configured. Sync is an add-on, but it is what connects the phone and the web version: until sync exists, each has its own local data.

Notifications are Android only. The web version is used for planning, logging and reviews on the PC. Layout: bottom navigation on narrow screens, navigation rail on wide screens.

## 3. Core concepts

- **Goal:** what you are working toward, time-boxed (e.g. a quarter). Its progress is tracked by its measures, and projects, tasks and habits can serve it.
- **Measure:** a way to track a goal's progress, belonging to exactly one goal: a number with a target ("Run 100 km"), a yes/no ("Get the certificate") or the check-ins of a habit. A goal can have several measures; they live on the goal's page and are updated there.
- **Project:** a body of work, optionally serving one goal. Has an importance, an optional deadline, a status and a *next step*.
- **Task:** a concrete to-do with its own page, a small project of its own. It can stand alone or be assigned to exactly one project or goal, has an optional deadline and notes, and work can be logged on it. A task of a project can be that project's next step, but tasks are not only next steps.
- **Habit:** a recurring task belonging to a project, a goal, both or neither, with a schedule. Checking it off logs work automatically. A measure can count a habit's check-ins.
- **Log entry:** a record of work done (when, optionally how long, what, for which project, goal or task).
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

### Goal
- `title`, `description`
- `start_date`, `end_date`
- `status`: `active | completed | archived`
- `sort_order`
- `color` nullable (`#RRGGBB`, the color of its planet; when null, one of the space palette by `sort_order`)

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
- `next_step_task_id` nullable
- `completed_at` nullable (set when the status becomes `completed`, cleared when it changes away from it)

### Task
- `project_id` nullable, `goal_id` nullable: at most one of them is set (a task without either is standalone)
- `title`, `notes`
- `due_date` nullable (the task's deadline)
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
- There is at most one row per user: it has a fixed ID, so starting a timer on two devices gives one record (the later start wins). Stopping soft-deletes it.

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
- Reminders on/off (default on), default reminder time (default 08:00; used by habits without own time and by deadline reminders), deadline warning lead time (default 7 days, 1–30), weekly review day and time (default Sunday 18:00), the pinned space image.
- Sync credentials are not settings: the Supabase session keeps the sign-in, and sync bookkeeping (watermarks, last sync, account of the device) uses `sync_*` keys of the settings table.
- Stored in a local-only `settings` key-value table, never synced.

### Moving from objectives and key results
Earlier versions had objectives and key results. Updating moves the existing data over, keeping every ID, so nothing has to be entered again and synced devices end up with the same records:
- Each objective becomes a goal with the same title, description, dates, status, order and color.
- Each key result becomes a measure of its objective's goal, with the same type, values, step, habit and order. KR deadlines and KR colors are dropped: a measure has neither.
- A project linked to a key result now serves that key result's goal.
- Tasks and habits assigned to a key result move to its goal; tasks assigned to an objective move to that goal.
- Log entries on a key result move to its goal.
- Review snapshots of key results become snapshots of the measures with the same IDs.
- Completed projects get `completed_at` from their last update.
- The server is migrated the same way by `supabase/schema.sql`, which must run before the first sync of an updated app (§7).

## 5. Derived logic

### Effective deadline
- Goal: its `end_date`. An active goal past its end date is overdue.
- Project: `project.deadline ?? end_date of its goal ?? none`
- Task: its own `due_date` only; a task does not inherit deadlines from its project or goal.

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
- Checking a habit creates a `HabitCheck` and a `LogEntry` (`source = habit`, linked to the habit's project or goal). Unchecking removes both.

### Progress
- Measure:
  - `numeric`: `(current - start) / (target - start)`, clamped to 0–1
  - `boolean`: 0 or 1
  - `habit`: check-ins of the linked habit since the goal's start date, divided by `target_value`
- Goal: the average progress of its measures. A goal without measures has no progress; it is shown without a percentage.

### Next step
- Marking a project's next-step task as done prompts: "What's the next step?" (create a new task, pick an existing open task, or skip). Cancelling the prompt leaves the task open.

### Timer
- Starting a timer while another runs stops the running one first (and logs it).
- Stopping creates a `LogEntry` (`source = timer`, `occurred_at` = start, linked to the project, or to the task and its project or goal) with the elapsed whole minutes, at least 1. The timer can also be discarded without logging.
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

Bottom navigation with three tabs: **Plan**, **Home**, **Review**. Each of them has a **Settings** button in its top bar.

### 6.1 Home (today)
A dashboard for the day, top to bottom:
1. **Header:** today's weekday and date, the number of tasks due today, and the habits done of due as an orbit ring ("2/4"). When the last habit due today is checked, a shooting star crosses the header once.
2. **Solar system:** a compact, low version of the Plan tab's solar system (§6.7), at full width, with the sun at the left edge and the planets in a row on their orbit arcs: the active goals as labeled planets around a sun, their active projects as moons, and active projects without an active goal as loose asteroids. Tapping a planet opens the goal page, tapping an asteroid its project. Hidden when there are neither active goals nor active projects.
3. **Habits due today:** compact chips, labeled with their project or goal; tapping a chip checks or unchecks it.
4. **Upcoming deadlines:** every open task and active project whose own deadline is overdue or within the warning lead time (default 7 days), sorted by date, overdue first. Projects and tasks with their own card below are listed here too, so nothing overdue is missed.
5. **Active projects:** sorted by score (§5). Each card shows title, area, the goal it serves, deadline badge and the next step as a checkbox. Ticking the next step opens the next-step prompt and marks it done unless the prompt is cancelled. Tapping the card opens the project detail.
6. **Tasks:** open tasks that are not part of a project (standalone, or assigned to a goal), sorted by deadline (overdue first, none last), then by creation. Each shows a checkbox, title, what it is assigned to and a deadline badge; tapping it opens the task page.

Two floating action buttons:
- **Left: new task.** A sheet with title, optional deadline and optional assignment (project or goal). Saving takes two taps for a plain task.
- **Right: quick log.** An optional duration and note on top, then the active projects and the open tasks outside projects (recently used first). Tapping one saves the entry, so a plain log entry takes two taps. A switch at the top changes the sheet to **Start timer**: tapping a project or task then starts a timer for it instead.

While a timer runs, a **timer card** at the top of Home (below the header) shows what it runs for and the elapsed time, counting live, with **Stop** (logs the time) and **Discard**.

### 6.2 Project detail
- A header with title, status chip, area chip, importance dots and deadline badge (marked when taken from the goal), then description and the goal it serves (in the goal's color; tapping it opens the goal page).
- Next step (editable) and open tasks; add, complete and delete tasks; tapping a task opens its task page. The next step is marked in the task list instead of being shown twice. Open tasks are ordered by due date; manual reordering is deferred.
- Habits belonging to this project.
- Log entries for this project (most recent first).
- Status: changed through the status chip in the header, which offers the other statuses (active, paused, backlog, completed).

### 6.3 Task page
- Title, notes, deadline, status and what the task is assigned to (project or goal, tapping it opens that item), or "Standalone".
- Marked when it is its project's next step.
- Actions: complete (with Undo), reopen a done task, edit, delete, log work, and "Make next step" for a project's task that is not its next step.
- Log entries for this task (most recent first).
- Reachable from Home, the project detail, the goal page, the Plan tab, the review summary and deadline reminders.

### 6.4 Plan
- **Solar system:** at the top of the Overview, the full-size solar system of all your work (§6.7); tapping a planet or asteroid opens the goal or project like the list does.
- **Goals list:** for each active goal, a card with its planet (§6.7) as the icon, title, progress, its date range with a deadline badge for its end date (amber within the lead time, red "Overdue" once it has passed), a line "3 measures" that expands to its measures with their progress bars and "Add measure", and the **active** projects serving it. Shown one after another.
- Active projects without a goal are listed in a separate "Projects without a goal" section. Active projects whose goal is not active are also listed there, with the goal's title.
- Only active projects appear in the goals list; backlog and paused projects appear only in the Backlog.
- Open tasks assigned to a goal are listed under it, like projects.
- Create and edit goals, measures, projects, tasks, habits and areas. The create button offers **New task** next to new goal, project and habit; measures are added on the goal page. Creating and editing happen in a **sheet** like the new-task sheet (a bottom sheet on phones, a side sheet on wide screens), not on a separate page.
- A **More** button in the top bar opens a sheet with large tiles for Habits, Areas and Archive; Settings has its own button (§6).
- Tapping a goal, project or task opens its **page** (on wide screens in the detail pane), never the edit form directly; each page has Edit in its top bar. Task rows have no extra menu: their checkbox completes them and tapping opens the page.
- **Goal page:**
  - A header with the goal's planet with its moons, title, progress, date range, status chip and deadline badge, and the description.
  - **Measures:** each with a slim progress bar in the goal's color, its value and controls right in the row: − / + buttons changing a number by its step (tapping the value edits it directly), a done switch for yes/no, and the linked habit's check-ins for a habit measure (read-only). Tapping a measure's title opens its edit sheet; "Add measure" adds one.
  - **Projects** serving the goal: active ones first, then backlog and paused ones with their status chip; completed projects are counted ("3 completed") and found in the Archive. "Add project" creates a project for this goal.
  - Open tasks and habits assigned to the goal.
  - **Work:** the work logged on the goal this week and in total (entries and duration, §5), and the most recent log entries.
- **Colors:** the goal form has a **planet color**, chosen from the space palette (shown as small planets) or **Auto** (§4).
- **Backlog:** all projects with status `backlog` or `paused`, filterable by area. Activating one makes it appear on Home.
- Archive of completed goals and projects.

### 6.5 Review
- **Review week:** on Sunday the Monday–Sunday week ending today, on any other day the previous Monday–Sunday week. One review per week.
- **Week summary**, used in all places below, top to bottom:
  - **Goals:** each active goal with its progress and the change since the last completed review (§5, "Weeks"), its measures with their change below it, and the work logged on it that week.
  - **Work:** work logged per project (count and total duration), grouped by the goal the project serves, then projects without a goal.
  - **Finished:** projects completed and tasks completed that week.
  - **Habits:** adherence per habit (done of expected).
- **Default view**, top to bottom:
  - this week's plan, from the most recently completed review
  - the summary of the **current week** so far, on every day of the week
  - a "Start / Continue / Edit weekly review" button (for the review week, §5: last week until Saturday, the current week on Sunday)
  - the history
  - a **Last week** button at the bottom, opening a page with last week's summary.
- **Guided flow**, shown as full-screen pages with a progress bar and Back / Next:
  1. Look back: the review week's summary.
  2. Projects: go through each active project; update status and next step (applied immediately).
  3. Goals: for each active goal, update the values of its number and yes/no measures (applied immediately).
  4. Score the week (1–10) and write a reflection.
  5. Write the plan for next week.
  6. Save: sets `completed_at` and stores a progress snapshot of each measure of an active goal.

  Score, reflection and plan are kept as a draft when changing steps or leaving, so a review can be continued later. A completed review can be edited and saved again.
- **History:** list of past reviews with score and plan; each opens in full, with that week's summary (goal progress saved with the review).
- Later: longer-term stats (score trends, time per area/goal/project, habit streaks).

### 6.6 Settings
- Reachable from the top bar of Plan, Home and Review.
- Reminders, default reminder time, weekly review day and time, deadline lead time, account and sync.
- **Space images:** all background photos with title and credit (CC BY 4.0) and the license note; pick one to keep it, or "A new image every day" (default). Stored in the local settings.

### 6.7 Design and interaction
The app should feel calm, clear and quick. Guidelines for every screen:
- **Visual identity:** the space-inspired Orbit palette instead of the default Material seed: deep navy "night sky" surfaces (#0B1026), a blue-violet primary, a cyan secondary and an amber color reserved for urgency (red for overdue). **Dark only:** the app ignores the system's light mode. Area colors are accents on cards and chips. Body text meets 4.5:1 contrast. Body text uses **Inter**, headings (page titles, large headlines) **Space Grotesk**; both are bundled so they also work offline. Progress of habits today and review scores is shown as slim orbit rings, measure progress as slim bars.
- **Space background:** behind every screen a Hubble photo (ESA/Hubble, CC BY 4.0, bundled with the app, about a dozen) under a dark gradient so text stays readable. It changes once a day (the same photo on all screens that day) unless one is picked in Settings. Cards, top bars and the navigation are slightly translucent so the photo shows through; sheets and dialogs are opaque. Sheets open above the tab bar and keep their content clear of the phone's navigation bar.
- **Your work as one solar system:** a **sun** in the middle stands for you; each active **goal is a planet** orbiting it, the active **projects serving a goal are its moons**, and active **projects without a goal are loose asteroids**.
  - Planets are in their goal's color, ordered by the goals' order (the first one orbits closest), and labeled with the goal's title. A planet grows brighter with its goal's progress and gets a **ring** once all its measures are reached; a goal without measures stays at medium brightness.
  - Planets have surface structure (bands, craters or continents) that stays the same for each goal. Moons are small cratered bodies in their project's area color (neutral without an area); moons behind the planet pass behind it. With many projects a planet shows at most six moons.
  - Active projects without an active goal are **loose asteroids**: small irregular rocks in their area color, scattered along a belt outside the outermost planet, at most twelve. They are not labeled, to keep the picture calm.
  - In lists and on Home cards, projects stay plain cards, to keep those screens calm.
  - Measure progress bars use their goal's color, so lists match the picture.
  - The space visuals are static: nothing moves continuously. The only motion is the one-off shooting star, which is skipped when the system asks to remove animations.
- **Brand:** the app icon is a glowing planet with a ringed orbit and a cyan moon on a starry night sky (also as an Android adaptive icon and for the web). The launch screen on Android and the web loading screen are the night sky with that planet.
- **Less text, more structure:** metadata as chips, icons and badges instead of text lines. For example importance as dots or stars, status as a colored chip, deadlines as a badge colored by urgency. Absent values are left out instead of written out ("No area", "No deadline").
- **Compact cards and lists:** denser rows, cards for projects and tasks, and no duplicate rows for the same item on one screen.
- **Detail pages:** a header with title, status, area and deadline; actions in the top bar or a menu instead of rows of large buttons.
- **Empty states:** an icon, one line of text and the action that fills the section.
- **Motion:** list changes (checking, completing, reordering by score) animate in and out, and pages open with a short fade transition. Animations take at most 300 ms and are skipped when the system asks to remove animations.
- **Messages:** short confirmations ("Task completed", "Work logged", …) appear at the top of the screen as a compact card with an icon, disappear on their own after 3 seconds and can be swiped away. An action such as Undo or Open is part of the card while it is shown.
- **Wide screens:** from 1000 px on, Plan shows the list and the selected goal, project or task side by side; below that they open as pages.

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
- **Schema changes:** `supabase/schema.sql` can be run again at any time; it creates what is missing and migrates older data (such as objectives and key results to goals and measures, §4) without losing records. It runs before the first sync of an app version that needs it. Devices that still run an older version stop syncing until they are updated; their local data stays.
- The app gets the project URL and publishable key at build time (`--dart-define-from-file=supabase.json`); without them it runs without sync.
- Note: free Supabase projects pause after a period of inactivity. Since data is local-first, a pause only delays sync.

## 8. Notifications

Android only. All scheduled locally with `flutter_local_notifications` as exact alarms, for the next 14 days, and rescheduled whenever relevant data or settings change and when the app starts or returns to the foreground:
- **Habits:** a reminder at each habit's `reminder_time` (or the default reminder time) on every day it is due and not yet checked.
- **Deadlines:** for open tasks (inside or outside projects) and active projects with an own deadline, a reminder at the default reminder time when the deadline enters the lead time, and one on the day itself.
- **Running timer:** while a timer runs, an ongoing notification shows what it runs for and the elapsed time, counting live, also when the timer was started on another device. It disappears when the timer is stopped; tapping it opens Home.
- **Weekly review:** at the configured review day and time (default Sunday 18:00), opening the review flow; skipped when that week's review is already completed.

Tapping a reminder opens its screen: Home for habits, the task page for tasks, the project detail for projects.

## 9. Milestones

1. **Foundation:** Flutter project for Android and web, drift schema with sync columns (working on both platforms), responsive app shell, Plan tab CRUD for areas, objectives, KRs, projects and the backlog.
2. **Home:** tasks and next steps, habits and habit checks, upcoming deadlines, project score sorting, quick log, project detail.
3. **Notifications:** habit and deadline reminders (Android), settings.
4. **Review:** last-week summary, guided weekly review, review history, weekly review reminder and its day/time settings.
5. **Sync:** Supabase schema and RLS, auth, push/pull sync.
6. **Tasks and navigation:** tasks as their own items (assignment to project, KR or objective, task page, log work on tasks), new-task button on Home and in Plan, tasks section on Home, Settings from every main screen.
7. **Design refresh:** the guidelines of §6.7 applied to all screens, Home as a dashboard, review flow as pages, two-pane Plan on wide screens.
8. **Timer and detail pages:** work timer with a running notification, objective and KR pages with KR progress buttons, create and edit in sheets, the Plan More sheet, overdue objectives, the Review tab on the current week with a last-week page and past weeks' summaries, messages at the top.
9. **Goals and Orbit identity:** objectives become goals and key results become measures on the goal page (with the move of existing data on devices and the server), projects, tasks, habits and work linked to goals, the goal page with measures, projects and work, the weekly review around goals and finished projects; the Orbit identity: dark only, Hubble backgrounds with a Space images setting, Space Grotesk headings, one solar system of goals, project moons and asteroids, goal colors, the shooting star, app icon and launch screens.
10. **Later:** stats, optional native desktop builds.

Milestones 1–8 use the names of their time (objectives, key results). The schema includes the sync columns from milestone 1, so adding sync later requires no migration of existing data.

## 10. Open questions

- Habit schedules: are `daily`, `weekdays` and `times_per_week` enough?
- Area list: fixed defaults (Job, Personal, Sport, Uni) or fully user-defined from the start?
