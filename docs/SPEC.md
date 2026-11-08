# Project Tracker: Application Spec

A personal, local-first app for tracking work: projects, tasks, habits and the work done on them, and which goals that work serves, with focused work sessions and a weekly review. Single user.

## 1. Goals and non-goals

**Goals**
- A desktop app first: the main place to plan, work and review is the PC, and it works fully offline. All data lives on the device first.
- The same app also runs in a browser, for using it on another computer.
- A small Android companion app to look at tasks and track time.
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
| Android | A companion app for tasks and time tracking: the same Tauri app and frontend built for Android (Tauri mobile), with native SQLite in the app's storage; native Kotlin only where Android needs it (notifications, later a widget and a quick-settings tile) |
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
- **Timer / focus session:** a stopwatch for work on a project, task or habit that can be paused and resumed, optionally with a time limit. At most one exists at a time, also across devices. Each stretch of work is logged as a log entry when it is paused or completed.
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
- `color` nullable: a palette slot (`pc0`…`pc7`) of the colour theme (§6.7); a new project gets the least used slot, and a project without one shows a slot derived from its id
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
- `project_id` nullable, `goal_id` nullable, `task_id` nullable, `habit_id` nullable (the habit a focus session or a check belongs to)
- `occurred_at`
- `duration_minutes` nullable
- `note`
- `source`: `manual | habit | task | timer`

### Timer
- `project_id` nullable, `task_id` nullable, `habit_id` nullable: exactly one of them is set
- `started_at` (UTC): the start of the current stretch (resuming sets it again)
- `planned_minutes` nullable: the session's time limit in worked minutes (set in focus mode); null for no limit
- `paused_at` nullable: set while the session is paused
- `worked_seconds`: the exact time of the earlier stretches of the session in seconds, not their rounded entries (default 0)
- `last_entry_id` nullable: the log entry of the last logged stretch
- There is at most one row: it has a fixed ID, so starting a session on two devices gives one record (the later start wins). Completing or discarding soft-deletes it.

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

### MeasureChange
- `measure_id`, `from_value` (nullable), `to_value`; `created_at` is the time of the change.
- One row per change of a numeric measure's value or a yes/no measure's achieved state (not for creating a measure, saving the same value, or changing the type). Insert-only; it gives the value of a measure at any moment since the history began.

### ReviewMeasureSnapshot
- `weekly_review_id`, `measure_id`
- `progress` (0–1, the measure's progress when the review was saved)

### Settings (local only, not synced)
- Reminders on/off (default on), default reminder time (default 08:00; used by habits without own time and by deadline reminders), deadline lead time (default 7 days, 1–30), weekly review day and time (default Sunday 18:00), weekly hour target (whole hours 1–168, default none).
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
- **Streaks:** a habit has a current and a best streak. For `daily` and `weekdays` habits it counts consecutive due days that were checked (days not due are skipped and checks on them ignored; days before the habit was created are not counted); for `times_per_week` it counts consecutive weeks that reached the target. Today, or the current week, still open does not break the current streak.

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
- Starting a session while another exists logs the other one's running stretch (a paused one just ends). A session starts without a time limit.
- **Pause** logs the stretch since the last start or resume as a `LogEntry` (`source = timer`, `occurred_at` = the stretch's start, whole minutes, at least 1, linked to the project, or to the task and its project or goal, or to the habit and its project or goal), without a dialog, and leaves the session paused. **Resume** starts a new stretch. The session may be left (focus mode closed, app closed) while running or paused.
- **Complete** asks "What did you get done?"; a running stretch is logged with the answer as its note, for a paused session a non-empty answer is set on the last logged stretch. It then ends the session: a task is marked done, for a habit that is not yet checked today the dialog offers "Mark as done today" (on by default), which checks the habit, and a project is left as it is. When the completed task was its project's last next step, the next-step prompt follows.
- **Discard** (top right of focus mode) drops only the running stretch and ends the session; stretches logged by pausing stay. A paused session is discarded without a confirmation.
- With a time limit (worked minutes, set in focus mode: 15, 30, 45, 60, 90, custom or none), reaching it while running is marked by a desktop notification and a sound; the timer keeps counting into overtime and does not pause automatically.
- The worked time is `worked_seconds` plus the time since `started_at` while running (exact to the second, while each entry is whole minutes), so the timer keeps running while the app is closed.

### Work per goal
- Work on a goal is every log entry linked to the goal itself, to one of its projects, or to a task of the goal or of one of its projects. Work is counted per entry and by total duration.
- A project's work counts for the goal it serves now, also for weeks before it was linked.

### Weeks
- The **current week** is the Monday–Sunday week containing today; **last week** is the one before.
- The **review week** (for the weekly review) is on Sunday the current week, on any other day last week.
- A week's summary is computed from the stored log entries, habit checks, completed tasks and completed projects, so it stays available for every past week. Habit adherence uses the habits' current schedules.
- **Goal progress in a week:** a past week shows the progress saved with its completed review; a week without a completed review (the current week, or last week before it is reviewed) shows the current progress.
- **Change in a week:** the value of each measure at the start of the week (Monday 00:00) and at its end (now, for the current week), from the `measure_changes` history; a habit measure counts its check-ins by date. A goal's change is the difference of its progress between those two moments, in percentage points. A change made before the history began is not known and shows no change.
- **Time in a week:** the sum of the week's log entry durations. An entry belongs to a project directly, through its task or through its habit, to an area through its project, and to a goal as in "Work per goal". The daily average divides by the days up to today in the current week, else by 7. The 4-week average of a week is the mean of that week and the 3 before it.

### Completing tasks and projects
- Marking a task done always creates a `LogEntry` (`source = task`, the task title as note, linked to the task and to its project or goal). An Undo right after completing reopens the task and removes the entry.
- A done task can be reopened from its task page; its log entries stay.
- Setting a project's status to `completed` sets its `completed_at`; that is the week it counts as finished in.

## 6. Screens

Four main destinations: **Home**, **Plan**, **Review** and **Stats**, plus **Settings**. They sit in a sidebar on the left, with Settings at its foot: icons and labels from a window width of 960 px, icons with tooltips below. Each has its own path (`/home`, `/plan`, `/review`, `/stats`, `/settings`), so reload, back and forward work; `/` and unknown paths open Home. Forms open in a side sheet on the right (full width below 600 px).

### 6.1 Home (today)
Desktop layout with a main column and a side column.

**Main column**, top to bottom:
1. **Today:** the weekday and date.
2. **Focus panel:** a text field "What are you working on?" that suggests matching open tasks and active habits (with their project colour and name), then matching active projects (marked "Project"; picking one, or typing a project's exact name, focuses on the project) while typing (Tab accepts the highlighted or first suggestion), and Start (no length is chosen; sessions start without a time limit). Text that is not an existing task creates one when starting: `title # project` puts the new task in that project (after `#` the active projects are suggested; a prefix is enough when it is unique), without `#` it is a standalone task, and `# project` alone starts on the project itself. An unknown project name shows an error and disables Start. While a session runs, the panel shows what it runs for, the worked time counting live (with the time limit and overtime if set), **Pause**, **Complete**, and a button to enter focus mode again. While it is paused, the panel shows it compactly (marked Paused, with **Resume**, **Complete** and focus mode) above the field and Start, so something else can be started; that ends the paused session (its time stays logged, its task stays open). On Home, `P` pauses a running session, `R` resumes a paused one and `C` opens the Complete dialog of the session.
3. **Habits due today:** in their own row, as compact chips labeled with their project or goal; clicking a chip checks or unchecks it, and its small start button starts a focus session on the habit (a habit is like a recurring task: it can be focused on and its time is logged on it). Habits are not ranked with tasks.
4. **To do:** the open next-step tasks of active projects and the open tasks outside projects (standalone or assigned to a goal), ranked by task rank (§5). Each row shows a checkbox, the title, its project or goal, importance dots and a deadline badge; a row can be started as a focus session directly. Clicking a row opens the task in the task popup (§6.3). On the desktop Home works from the keyboard: `J`/`K` or the up and down arrows move a highlight through the To do list (wrapping around at both ends), the left and right arrows through the habits due today, `1`–`9` highlight the 1st–9th task and `Shift+1`–`Shift+9` the 1st–9th habit; `Space` starts focus on the highlighted task or habit, `X` completes the task or checks the habit, `Enter` opens the task popup or checks the habit.
5. **Done today:** the tasks completed today, newest first, each with a checked checkbox (unchecking reopens it), its title, project chip and completion time; hidden while nothing was completed today.

**Side column:**
1. **Today:** the work already logged today, plotted as blocks on an hour axis (06:00–22:00, extended for earlier or later work), colored like their project and labeled with the task, project or goal. A timer entry starts at its time, any other entry ends at its time (the work was done before it was logged); entries without a duration (a completed task, a habit check) are small dots at the left edge of the column, without text (details on hover), so only focus sessions and tracked time are blocks; a block shows its title, its time range and project when it is high enough; a running focus session is a striped block growing to the current time (a paused one has none); timer blocks of the same task, habit or project with at most 10 minutes between them are drawn as one block from the first start to the last end, counting only the worked minutes; overlapping blocks sit side by side; a line marks now. Clicking a block opens its task, project or goal. A view only, no planning.
2. A compact overview of the active projects, ordered by project score (§5), each with its title, area color, deadline badge and its next steps. Clicking a project opens its detail.

Also on Home: **New task** (title, optional deadline, importance and assignment; saving a plain task takes a title and Enter) and **Log work** (record work done without a timer: optional start time, duration and note, then the project or task; without a start time the work ended now, with one it ended at the start plus the duration).

**Focus mode:** starting a focus session opens a full-window view showing only the task, habit or project, its notes and a large timer (with the time limit and overtime, if set), a "Time limit" menu, **Pause** or **Resume** and **Complete**, with **Discard** in the top-right corner. Pause and Resume have no dialog; Complete follows §5 (Timer and focus). Leaving focus mode keeps the session as it is. Keys: `Space` pause/resume, `Enter` complete (Enter in the dialog confirms), `Esc` leave, `Delete` discard, `L` the time limit menu, `+`/`−` the limit 5 minutes longer or shorter.

### 6.2 Project detail
- A header with title, status chip, area chip, importance dots and deadline badge (marked when taken from the goal), then description and the goal it serves (clicking it opens the goal page).
- **Next steps** (marked in the task list instead of being shown twice) and the open tasks; add, complete and delete tasks, mark and unmark next steps; clicking a task opens the task popup. Open tasks are ordered by due date; manual reordering is deferred.
- **Weekly notes:** the project's notes, newest week first.
- Habits belonging to this project.
- Log entries for this project (most recent first), with the total time worked on it (including its tasks and habits) in the section header.
- Status: changed through the status chip in the header, which offers the other statuses (active, paused, backlog, completed).

### 6.3 Task page and popup
A task opens in a **popup** centred over the current screen (full screen on the phone) wherever it is clicked in a list: Home (To do, Done today, the project cards' next steps), the project, goal and Plan pages, the review (projects step and completed tasks) and the task blocks of the day timelines. The popup shows the content below plus **Open page**, which opens the task page at its own address (also reached from the command palette and by address). `Esc`, the close button and a click beside the popup close it; the edit sheet or a confirmation opened from it closes first on `Esc`; any navigation (the assigned project or goal, Open page, the sidebar) closes it; deleting the task closes it.

- Title, notes, deadline, importance (its own, or shown as inherited), status and what the task is assigned to (project or goal, clicking it opens that item), or "Standalone".
- Marked when it is one of its project's next steps.
- Actions: complete (with Undo), reopen a done task, edit, delete, log work, start a focus session, and "Mark as next step" / "Remove from next steps" for a project's task.
- Log entries for this task (most recent first), with the total time worked on it in the section header.

### 6.4 Plan
Designed for desktop widths: one page with sections (Goals, Projects without a goal, Backlog, Habits, Areas, Archive) and a **New** menu; goals, projects and tasks open as their own pages. What it contains:
- **Goals:** each active goal with its color, title, progress, date range with a deadline badge for its end date, its measures with progress bars, the **active** projects serving it and its open tasks.
- Active projects without a goal, and active projects whose goal is not active (showing the goal's title), in their own section.
- **Backlog:** all projects with status `backlog` or `paused`, filterable by area. Activating one makes it active.
- **Archive** of completed goals and projects.
- **Habits** (each with its total time worked at the right) and **Areas** lists.
- Create and edit goals, measures, projects, tasks, habits and areas. Clicking a goal or project opens its page, clicking a task its popup; each page has Edit.
- **Goal page:** header with title, progress, date range, status and deadline badge, and the description; **measures** with progress bars and their controls in the row (− / + by step, direct editing of the value, a done switch for yes/no, read-only check-ins for a habit measure); the **projects** serving the goal (active first, then backlog and paused; completed ones counted); open tasks and habits of the goal; **work** logged on the goal this week and in total (§5); its **weekly notes**, newest first.
- No planets or other space visuals in Plan.

### 6.5 Review
The review is the main place where projects and goals are updated.
- **Calendar weeks:** weeks are named by their ISO number, "CW 45", with the date range beside it where there is room.
- **Review week:** on Sunday the Monday–Sunday week ending today, on any other day the previous Monday–Sunday week. One review per week.
- **Week summary as a dashboard**, used on the Review tab, a past review's page and step 1 of the guided review:
  - **Figures** across the top: time worked (against the weekly hour target when set), daily average, time on goals, habits kept (check-ins counted up to what each habit expects, of all expected) and done (tasks completed, projects finished).
  - **Panels** in a 12-column grid when the summary is at least 1100 px wide, stacked in this order below that: goals (7 columns) beside the plan (5), time by area / goal / project (5) beside the recent weeks (7), the days across the full width, then habits, done this week and the history in three equal columns (two without the history). Panels side by side end at the same height, whatever their content. Without the plan panel, goals take the whole row. At 1440 × 900 the header, figures and first two rows fit without scrolling.
  - **Goals:** each active goal with its progress (the week's gain as a lighter segment), its change in the week (§5, "Weeks") and its work that week on one line; below it only the measures that changed ("7 → 9 / 10 km", "+2"); all measures stay on the goal page.
  - **Time by** as bars (a switch; unassigned time as "Other"); **recent weeks** as 8 bars with the 4-week average line and headline.
  - **Days:** the seven day timelines side by side on one hour axis (as on Home), each headed with its weekday, date and hours worked; the hours scroll inside the panel.
  - **Habits:** kept of due per habit; **done this week:** the completed tasks and finished projects, newest first.
- **Review tab:** a header with the week switcher (‹ week ›, and "This week" while another week is shown; the week is kept in the address) and the "Start / Continue / Edit weekly review" button for the review week (§5; its tooltip names the week), then the dashboard of the **shown week** (the current week so far, unless another is chosen) with two panels of its own: the plan for the shown week (written in the completed review of the week before; each review keeps its plan) and the history (the latest 5 reviews with week and score, "Show all" for every one).
- **Guided flow**, as full pages with a progress indicator and Back / Next:
  1. **Look back:** the review week's summary: the work done.
  2. **Projects:** go through each active project and update it: status, next steps (mark, unmark, add), importance and deadline, and write its weekly note. Changes apply immediately.
  3. **Goals:** for each active goal, update its status and the values of its number and yes/no measures, and write its weekly note. Changes apply immediately.
  4. Score the week (1–10) and write a reflection.
  5. Write the plan for next week.
  6. Save: sets `completed_at` and stores a progress snapshot of each measure of an active goal.

  Score, reflection and plan are kept as a draft when changing steps or leaving, so a review can be continued later. Weekly notes are saved as they are written. A completed review can be edited and saved again.
- **History:** list of past reviews with score and plan; each opens in full, with that week's summary (goal progress saved with the review) and the weekly notes of that week.
- Later: longer-term stats (score trends, habit streaks).

### 6.5a Stats

A desktop screen (`/stats`, `Shift+S`) for how work, review scores, habits and focus on goals develop over calendar periods. The header has the **period picker**: month, quarter, year or all time, with ‹ › to step to the previous or next period of the same kind (› is disabled on the current one). The default is the current month; the period is kept in the address (`?period=2026-11`, `2026-Q4`, `2026`, `all`) and an invalid or future one shows the current month. "All time" starts at the earliest log entry, habit check or completed review.
- **Figures:** time worked, daily average (up to today for the current period), average review score (one decimal, with "4 of 5 weeks reviewed"), habit adherence (check-ins kept out of expected, as in the week summary) and share of time on goals. Daily average, score and the two shares show their change from the previous period of the same kind (percent, difference, percentage points); none for all time.
- **Trends:** four small charts (hours, review score, habit adherence, share on goals), one point per week for a month or quarter and one per month for a year or all time; the current week or month is marked "so far" and a missing value breaks the line.
- **Weeks and periods:** values kept per week (score, habits) count for the period holding the week's Thursday; time is counted by the date of each entry, so a week's point shows the whole week while the figures use exact dates.
- **Work calendar:** a full year of days, one column per week, shaded in four steps by the time worked as a share of the busiest day; the days of the shown period are emphasised, the others dimmed. For all time it shows the 53 weeks up to the current week.
- **When you work:** a weekday × hour heatmap of the shown period; an entry's time is spread over the hours between its start and end (as on the day timeline).
- **Habits:** every active habit with its current and best streak, check-ins kept of expected in the period and the time logged on it, longest current streak first; a habit opens its calendar of checked, missed (a due, unchecked day before today) and neutral days.
- **Time by:** the period's time grouped by area, goal or project, as in the week summary (same switch, colours and attribution).
- **Projects:** the projects with time in the period, most first, each with its time in the period and in total (all time) and, for a completed project, the days from creation to completion.
- **Tasks:** tasks completed and created in the period, the median time from creation to completion (days, or hours under a day) and a chart of tasks completed per week or month. Output is counted in tasks, not projects, so a long project does not look like a failure.
- **Goals:** the active goals that had started by the end of the period, each with its progress at the period's end, its change in the period (points), a small chart of its progress per week or month (rebuilt from the measures' value history and the habit check-ins) and a **projected finish**: the date it reaches 100 % if the pace of the last 28 days (or since its start, when shorter; under 7 days is "too early to tell") continued, compared with its end date ("N days before / after the deadline"). A goal at 100 % reads "Complete"; one without progress "No progress lately".

### 6.6 Settings
- Reminders, default reminder time, weekly review day and time, deadline lead time.
- **Review:** the weekly hour target (empty for none), shown in the week summary.
- **Sync:** the server address and this device's token, the time of the last successful sync and whether the last attempt failed (and why: no connection, token refused, different schema version, server error), "Sync now" and "Disconnect".

### 6.7 Design and interaction
The app should feel calm, clear and quick. These guidelines hold for every screen; the shared components and design tokens that implement them are in `src/core/ui/` (in development, `/dev/components` shows them all):
- **Desktop first:** the desktop window opens maximised; layouts use the width of a desktop window (columns, side panels) and still work in a narrower browser window. Keyboard use is first-class: Enter saves forms, Escape closes them.
- **Keyboard shortcuts** (desktop and browser; never while typing in a field or while a dialog, sheet or menu is open, and never with Ctrl/Alt/Meta except `Ctrl+K` and `Ctrl+,`): `T` new task, `L` log work (both as sheets over the current screen), `F` Home's focus field (or focus mode while a session runs), `Shift+H` / `Shift+P` / `Shift+R` / `Shift+S` Home, Plan, Review, Stats, `Ctrl+,` Settings, `?` an overlay listing all shortcuts, `Ctrl+K` the command palette. Buttons and navigation entries show their shortcut in the tooltip or as a hint. `Esc` in a field outside a dialog or sheet leaves the field. On a project, goal or task page `Esc` goes back to the screen it was opened from (to Plan when it was opened by its address).
- **Command palette** (`Ctrl+K`): a search field over a list of commands, filtered by every typed word: create a task, project, goal, habit or area and log work; go to Home, Plan, Review, Stats, Settings or any project, goal or open task; start focus on any open task, active habit or active project, or on the typed text as Home's focus field reads it (`title # project`); while a session exists pause/resume, complete and set the time limit; switch the theme; sync now (when connected). Each entry shows its kind and shortcut; arrows move, Enter or a click runs, Esc closes.
- **Visual identity:** dark only, clean and modular: tiles (14–20 px radii, 1 px borders) on a calm ground, no textures or illustrations. All text is **Inter** (bundled), with tabular numerals for timers.
- **Colour themes:** five dark themes (Slate, Forest, Ember, Plum, Graphite), switchable live from the sidebar and Settings; only colours change. Each theme has a ground, surfaces, one accent, red for overdue, amber for soon and eight project colours. The choice is a local setting.
- **Slate cards:** in the default theme the tiles have the colour of the ground and are set apart by their outline (inner surfaces one step lighter); its eight project colours are vivid (orange, blue, green, purple, pink, teal, lime, sand); project headers keep their tint, and To do rows are outlined clearly in their project colour.
- **Colour coding:** every project has its own colour (a slot of the theme palette), shown the same everywhere it appears: a rail and tint on its tile and page, a chip with its name on its tasks and habits, a rail on its next steps. Goals use the same palette; areas stay small chips with a dot. The name always accompanies the colour. Body text meets 4.5:1 contrast. Keyboard focus shows a visible ring; pointer clicks do not.
- **Phone layout:** below 640 px width (the Android app and narrow browser windows) the app is one column with a bottom navigation (Home, Today, Settings) instead of the sidebar, clear of the system bars, with touch targets of at least 44 px and no hover-only controls. Home drops the timeline and the active projects (the timeline is the Today screen, one day at a time with previous/next and swipe); Plan, Review and Stats are desktop screens.
- **Dropdowns:** a field that picks one value from a list is a styled dropdown (a field-like button and a popup list on the app's own surface), not the browser's native select. It supports groups, optional colour dots (project colours), the keyboard (arrows, Enter, Escape, type-ahead) and works inside sheets.
- **Less text, more structure:** metadata as chips, icons and badges instead of text lines: importance as dots, status as a colored chip, deadlines as a badge colored by urgency ("Overdue" in red; "Today", "Tomorrow" or "In N days" in amber within the lead time; otherwise the date). Absent values are left out instead of written out ("No area", "No deadline").
- **Compact lists:** dense rows and no duplicate rows for the same item on one screen.
- **Detail pages:** a header with title, status, area and deadline; actions in the header or a menu instead of rows of large buttons.
- **Empty states:** an icon, one line of text and the action that fills the section.
- **Motion:** list changes animate in and out briefly (at most 300 ms), skipped when the system asks to reduce motion.
- **Messages:** short confirmations ("Task completed", "Work logged", …) appear as a compact card at the top of the window that disappears on its own after 3 seconds (not while the pointer is on it or it has focus) and has a close button; an action such as Undo is part of the card while it is shown, and a new message replaces the current one.

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
- Trigger sync on app start, when the app comes back to the foreground, a few seconds after local changes, every 5 minutes while the app is open, and with "Sync now" in Settings (and pull-to-refresh on the phone). Failures are silent, retried later and shown in Settings.
- **Server:** a Cloudflare Worker with a D1 database, one table per entity. Every request carries the device's token (`Authorization: Bearer …`); the Worker compares it with a secret and refuses anything else. There are no accounts and no sign-up.
- **First connection of a device:** if the server has no data, the device uploads its data; otherwise the device's local data is replaced by the server's after a confirmation.
- **Reminder check:** `POST /api/reminder-check` answers whether a habit reminder (habit + date), a task or a project reminder is still needed, from the rows the server holds (an unknown id is needed). The phone asks it when a reminder is due (§8).
- The Worker also serves the browser build; the browser build works on its own local data until its token is entered; connecting to a server that has data replaces that local data after the confirmation.

## 8. Notifications

Desktop notifications, shown by the Tauri app while it runs (it can keep running in the tray). The browser build shows none.
- **Habits:** a reminder at each habit's `reminder_time` (or the default reminder time) on every day it is due and not yet checked.
- **Deadlines:** for open tasks and active projects with an own deadline, a reminder at the default reminder time when the deadline enters the lead time, and one on the day itself.
- **Focus session:** when the worked time reaches the session's time limit, a notification and a sound (§5).
- **Weekly review:** at the configured review day and time (default Sunday 18:00), opening the review flow; skipped when that week's review is already completed.

Clicking a reminder opens its screen: Home for habits, the task page for tasks, the project detail for projects.

**On Android** the phone reminds on its own (each device has its own Reminders switch):
- Habit and deadline reminders and the end of a focus session are handed to Android's alarm service for the next 7 days whenever the app runs (start, resume, any change or sync, midnight), replacing the earlier ones, so they come while the app is closed; they are set again after a restart. No weekly review reminder (the review is not on the phone).
- **Check before showing:** when a habit or deadline reminder is due, the phone asks the server (§7) whether it is still needed (habit unchecked that day, task open, project active) and shows it only then; without a server, a connection or an answer within 5 seconds it shows it anyway.
- **Ongoing notification** while a session exists: "Thesis · Running since 10:15" or "Paused · 25 min"; removed when the session ends; tapping opens focus mode.
- Tapping a reminder opens Home for a habit or project, the task popup over Home for a task, focus mode for the end of a session.
- The app asks for the notification permission (Android 13+) while reminders are on; when it is denied, Settings says so. Settings on the phone show the reminders switch, the default reminder time and the lead time.
- Implemented by the app's own Android plugin (`src-tauri/src/reminders.rs` and the Kotlin `reminders` package), since a reminder has to run code when it is due.

## 9. Milestones

The app is rebuilt from scratch in this order, one OpenSpec change each (features in small batches):

1. **Rebuild foundation:** Tauri + React + TypeScript skeleton, desktop and browser builds, platform layer, quality tooling, this spec.
2. **Local database:** Drizzle schema with the sync columns, the Tauri SQLite plugin on the desktop and SQLite WASM in the browser.
3. **Sync server:** Cloudflare Worker + D1, token login, push/pull sync, deploy of the Worker and the browser build.
4. **App shell:** navigation, theme, shared components, messages.
5. **Features** (one change, `features`): areas, goals and measures; projects and tasks (with next steps and task importance); habits; work log, timer and focus mode; Home; Plan; Review with weekly notes; Settings; desktop notifications.
6. **Android companion** (Tauri mobile): phone layout below 640 px (bottom navigation Home, Today, Settings), Home with focus, habits, To do and Done today, quick add, the Today timeline with day navigation and swipe, sync with the deployed server; then Android notifications (habit and deadline reminders checked with the server before showing, the ongoing timer notification) — done.
7. **Later:** Windows/macOS builds. Stats are done: the Stats tab with periods, figures and trends, habit streaks, the work calendar and heatmap, time and task breakdowns, goal progress and projected finish.

## 10. Open questions

- Solar system: the solar system of goals (planets), projects (moons) and loose projects (asteroids) is kept as an idea, but where it appears in the new app is decided later.
- Habit schedules: are `daily`, `weekdays` and `times_per_week` enough?
- Area list: fixed defaults (Job, Personal, Sport, Uni) or fully user-defined from the start?
- **Branding: decided.** The name stays Orbit. The icon is two crossed, tapered rings woven over and under each other, in the app's indigo and off-white on a tile in the colours of the app's ground; it is drawn by `scripts/make-icons.mjs` (`npm run icons`), which renders the desktop, web and Android icons. The earlier planet icon is retired.
