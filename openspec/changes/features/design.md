# Design

## Context

After `app-shell`, the app has:
- the shell, routing for four destinations, a first set of shared components, messages and the sync runner;
- the complete schema from `local-database` (every column of SPEC §4 exists, so there is no migration);
- `db` writes through a driver that calls `onWrite` after writes to synced tables;
- `naturalId()` for habit checks, weekly reviews, notes and the timer.

Nothing reads or writes feature data yet, except the placeholder `TestAreas`. The desktop shell has only `core:default` permissions, no tray and no notifications.

This change is applied over several sessions, group by group (see proposal). The decisions below are the ones every group relies on.

## Goals / Non-Goals

**Goals:**
- One pattern for data access, live updates and "today" that every feature uses.
- Domain rules (rank, urgency, due habits, progress, next steps, review week, summaries, reminders) as pure, tested functions.
- Every write that belongs together in one `db.batch()`, so sync never sees half a change.

**Non-Goals:**
- Fine-grained cache invalidation, pagination or virtualised lists. Data is one person's: hundreds of rows, not millions.
- Component tests in a DOM. Behavior lives in domain and data modules with tests, and the UI is checked by hand and with the scripted Chrome checks used in `app-shell`.

## Decisions

### Repositories and live queries
- Each feature has `data/<feature>-repository.ts` with plain async functions taking `db` (and a `Clock` for writes): `listActiveGoals(db)`, `completeTask(db, clock, id, choice)`, and so on.
- Queries leave out soft-deleted rows with `notDeleted()`.
- Writes set `updatedAt` with `updateFields()`. Unlinking (for example clearing `goal_id` on projects when a goal is deleted) also updates `updatedAt`, so it syncs.
- Screens read through `useLiveQuery(load, deps)` in `src/core/db/live.ts`:
  - it runs `load(db)` and runs it again after every local write (`onWrite`), after every sync (`dataVersion`) and after local settings change;
  - runs are coalesced to one per animation frame, and the previous data stays shown while reloading.
- Alternative: per-table subscriptions or a query cache library. More code, or a dependency, for no visible gain at this data size.

### Local settings store
- `src/features/settings/data/settings.ts` reads and writes typed keys in the local `settings` table, with defaults from SPEC §4: reminders on, 08:00, lead time 7, Sunday 18:00. It also keeps the last chosen focus length.
- These writes do not pass `onWrite` (the table is not synced), so the store notifies its own listeners. `useSettings()` and `useLiveQuery` subscribe to it.
- `DEFAULT_LEAD_DAYS` stays only as the default. `DeadlineBadge` takes the lead time from `useSettings()`.

### Today and now
- `useToday()` gives the local `yyyy-mm-dd`. It updates at local midnight, and on focus and visibility when the date has changed.
- `useNow(intervalMs)` ticks only where something counts live: the focus panel and focus mode.
- Domain functions take `today` or `now` as parameters and never read the clock.

### Routes
`Route` gains these routes (all through `parsePath`/`pathOf`):
- `goal`, `project` and `task`, with an `id`;
- `review-flow` (with a `step` query), `review-history` with an `id`, and `review-last-week`;
- `focus`.

Focus mode is a route (`/focus`), so that clicking the focus-end notification can open it and Escape is a plain "back". The sidebar's selected destination comes from a `sectionOf(route)` function, which is tested.

### Multi-row writes in one batch
These writes each go through one `db.batch()`, and each has a repository test:
- **Complete task:** set the task done, insert the log entry, mark the next steps chosen in the prompt.
- **Undo completing a task:** reopen the task, delete its log entry, restore its next-step flag.
- **Check a habit:** insert the habit check (natural ID) and its log entry. **Uncheck:** delete both.
- **Delete a log entry from a habit:** delete the entry and its habit check.
- **Stop the timer:** insert the log entry and soft-delete the timer.
- **Start a timer while another runs:** log the running one, then upsert the timer row.
- **Delete a goal:** soft-delete the goal and its measures; clear `goal_id` on its projects, tasks and habits.
- **Delete a project:** soft-delete the project and its tasks; clear `project_id` on its habits.
- **Delete a habit:** clear `habit_id` on its measures.
- **Delete an area:** clear `area_id` on its projects.
- **Save a review:** set `completed_at`, soft-delete the old snapshots, insert new snapshots for the measures of active goals.

### The timer row
- There is one row with `TIMER_ID`. Starting upserts it: it sets `deleted_at` back to null, along with `started_at`, the target and `planned_minutes`. Stopping and discarding soft-delete it.
- Two devices starting before a sync resolve by last-write-wins, as the work-timer spec asks.
- The planned length last chosen is a local setting, used by the start action on To do rows.

### Next steps as a pure decision
- `nextStepOutcome(task, openNextStepsOfProject)` decides between "complete directly" and "ask". It is tested.
- One `useCompleteTask()` hook runs the flow for every place that completes a task: To do, the side column, project detail, task page and after a focus session. It shows the prompt dialog, completes the task, and shows "Task completed" with Undo.

### Shared components, second set
In `src/core/ui/components/`:
- `DateField` and `TimeField`: text inputs for `dd-mm-yyyy` and `HH:mm` with parsing and errors, plus a small calendar popover for dates. WebKitGTK's native date and time inputs show neither our format nor a usable picker. Parsing is pure and tested.
- `NumberField`, `Select` (native `<select>` with option groups, for assignments), `Switch`, `Checkbox`, `ColorPicker` (swatches and an optional "Auto"), `WeekdayPicker`, `SegmentedControl` (focus lengths, schedule type, measure type).
- `Menu`: a positioned list with arrow keys, Escape and click-outside, used by status chips, "New" and overflow actions.
- `ProgressBar`, `ListRow` and `Section`.
- `AnimatedList`: rows fade in, and fade and collapse out within 200 ms. A removed row is kept until its exit animation ends. Reduced motion skips all of it through the motion tokens.

The gallery (`/dev/components`) gets every new component.

### Palettes
- `src/core/ui/palette.ts` holds 8 area colors and 8 goal colors. All of them have at least 3:1 contrast against the surfaces, as accents.
- `goalColor(goal, indexInOrder)` gives the own color or the palette color by position. It is tested.

### Weekly review and notes
- A review row's ID is `naturalId('weekly_review', weekStart)`, and a note's is `naturalId('note', type, id, weekStart)`. Both are upserts.
- The draft (score, reflection, plan) is saved when the step changes and when the flow is left.
- A note is saved 500 ms after typing stops, and at once on blur and unmount. An emptied note is soft-deleted.
- Week summaries are pure functions over the rows of the week (`summarizeWeek(rows, week, today)`). The repository loads log entries by the UTC range of the local week, and habit checks and completed tasks by local date.

### Desktop notifications, tray and sound
- **Planning reminders:** `planReminders(data, settings, now, until)` is a pure, tested function. It returns `{ key, at, title, body, route }` for the habit, deadline and review reminders and for the end of the focus session.
- **Runner:** `ReminderRunner`, mounted once in `AppRoot` like `SyncRunner`:
  - it plans until the next midnight and sets one `setTimeout` for the next reminder;
  - it plans again after writes, syncs, settings changes and midnight;
  - a 30-second check notices a clock jump (wake from sleep);
  - it keeps the keys it has shown this day, so planning again never shows a reminder twice;
  - reminders whose time has passed are skipped, as the spec asks.
- **Delivery:** `src/platform/notify.ts` is a no-op in the browser. On the desktop it invokes the Rust command `show_notification(title, body, route)`.
- **Rust side:**
  - `notify-rust` shows the notification with a default action and waits for it on a thread. On a click it shows and focuses the window and emits `notification-clicked` with the route; the frontend navigates.
  - `tauri-plugin-notification` does not report clicks on Linux, hence `notify-rust`.
- **Tray:** the Tauri `tray-icon` feature, with "Open Orbit" and "Quit".
  - `CloseRequested` is prevented and the window hidden, so the app keeps running.
  - In dev builds the same behavior applies, so it can be checked.
- **Sound:** the focus-end sound is a short chime from the Web Audio API. No audio file is needed, and it works in the browser too.

### Dependencies
- `notify-rust` (Rust): desktop notifications with click actions on Linux, which the Tauri notification plugin lacks.
- No new npm packages. The `tray-icon` feature of `tauri` is not a new crate.

## Risks / Trade-offs

- [The change is very large] → Task groups are ordered so the app works after each group. Each group ends with `npx tsc --noEmit` and its own tests passing; the full `npm run check` runs once, at the end. Apply can pause between groups.
- [Coarse live queries reload too much] → Writes are rare and queries are small, and runs are coalesced per frame. If a screen gets slow, add a table filter to `useLiveQuery` later.
- [A notification daemon without action support (rare on Linux desktops)] → The notification still shows; clicking it then does nothing. This is documented in the README.
- [Reminders are missed while the app is not running] → Accepted by the spec. The tray keeps the app running after the window is closed.
- [Hand-made date and time fields] → Parsing is pure and tested. The calendar is a simple month grid without ranges.

## Migration Plan

- No schema or data migration.
- Data the user creates in the placeholder (test areas) stays: they are real areas.
- Rollback is reverting the change. The desktop shell's tray and close behavior go with it.
