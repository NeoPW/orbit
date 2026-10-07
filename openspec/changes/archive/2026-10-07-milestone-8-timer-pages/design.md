# Design

## Context

See proposal.md for the motivation. Current state that shapes the approach:

- **Schema 4:** drift with `stepByStep` migrations; generated migration tests live in `test/core/db/migrations/orbit/`. Sync covers 10 tables registered in `lib/core/sync/sync_tables.dart`, and `test/core/sync/schema_sql_test.dart` checks `supabase/schema.sql` against the drift tables.
- **Natural-key IDs:** `naturalKeyId(key)` (UUID v5) is already used for habit checks and weekly reviews. Server primary keys are the bare `id`. That is fine for a single-user project and is the precedent the timer follows.
- **Notifications:** `LocalNotificationScheduler.replaceAll` calls `cancelAll()` and then schedules reminders with IDs 0…n. Anything shown by another path would be wiped on every reschedule. `flutter_local_notifications` 22 supports `ongoing`, `usesChronometer` and `when` on Android, which gives a live counter without app code running.
- **Forms:** objective, KR, project and habit forms are `FormScaffold` pages on `/plan/...` routes (19 call sites push those routes). The task form is an `AlertDialog`, the area form a dialog, and new task a bottom sheet.
- **Plan:**
  - `planSelectionProvider` holds `PlanProject` / `PlanTask`; `openPlanItem` opens in the detail pane at ≥ 1000 px and pushes a route below that.
  - `ProjectDetailScreen` / `TaskScreen` take `onClose` for the pane.
- **Messages:** 8 `SnackBar` calls in 3 files (`complete_task.dart`, `new_task_sheet.dart`, `quick_log_sheet.dart`), shown through `ScaffoldMessenger` at the bottom.
- **Review:**
  - `weekSummaryProvider(weekStart)` already computes any week live.
  - `latestSnapshotsBeforeProvider(weekStart)` gives the previous snapshots.
  - The Review tab uses `reviewWeekProvider`.

## Goals / Non-Goals

**Goals:**
- One timer implementation shared by Home, quick log, sync and the notification, with the elapsed time always derived from `started_at`.
- Objective and KR pages built like the project and task pages: a scaffold-free `…Body`, a page with `onClose` for the Plan pane, and a root-level URL.
- One sheet host for all forms, so each form is written once and shown as a bottom or side sheet by width.
- One message host for all confirmations.

**Non-Goals:**
- No background isolate or notification actions (no stop from the notification).
- No general "undo for any action": only the existing Undo after completing a task, now in the top message.
- No change to the guided weekly review flow; it keeps working on the review week.

## Decisions

### 1. Schema version 5

**Changes:**
- **New table `timers`** (synced, standard sync columns):
  - `project_id` text nullable, `task_id` text nullable (exactly one set, checked in the repository)
  - `started_at` text (ISO UTC).
- **`key_results.step`:** real, not null, default 1.
- **`LogSource.timer`** (`'timer'`): a new enum value. Stored as text, so no migration.

**Migration:**
- `from4To5`: `createTable(timers)` and `addColumn(keyResults, step)`; existing rows get the default 1.
- Generate `drift_schema_v5.json` with `make-migrations`, plus a v4 → v5 data test: KRs keep their values and step = 1, and the timers table is empty.
- `app_database_test` expects version 5.

**`supabase/schema.sql`:** `create table public.timers` with RLS, policy and `sync_guard` trigger like the other tables, and `alter table public.key_results add column if not exists step double precision not null default 1`. The table is registered in `sync_tables.dart` with its columns.

*Alternative:* keep the timer in the local settings table. Rejected: you chose a synced timer.

### 2. Timer model: one row with a fixed ID

- **ID:** the timer row always has `id = naturalKeyId('timer')`.
- **Start:** upserts that row with the target, `started_at = now`, `deleted_at = null`, and `updated_at = now`. Starting while another timer runs first stops the running one in the same transaction.
- **Stop:** in one transaction, soft-deletes the row (`deleted_at`) and inserts the log entry.
- **Discard:** only soft-deletes the row.
- **Running timer:** the row with `deleted_at` null. Exposed as `runningTimerProvider` (stream).

**Why a fixed ID:** it gives "one timer per account" through the existing last-write-wins sync with no extra logic. The later `updated_at` wins on the server and on devices, as the spec requires.

**Repository and rules:**
- `TimerRepository` (`lib/features/timer/data/`): `watchRunning()`, `start(TimerTarget)`, `stop()`, `discard()`.
- Pure domain functions: `elapsed(startedAt, now)`, `loggedMinutes(elapsed)` (the elapsed whole minutes, at least 1), and the `h:mm:ss` / `m:ss` formatting.

**Log entry for a task target:** gets `task_id` plus the task's project or KR, the same as `LogRepository.add` for tasks today.

*Alternative:* a row per timer run, picking the latest open one. Rejected: two devices would leave several open rows that need cleanup rules.

### 3. Timer UI

- **Quick log sheet:** a `SegmentedButton` with "Log" and "Start timer" at the top. In timer mode the duration and note fields are hidden, and tapping a target calls `start`.
- **`TimerCard` on Home (below `TodayHeader`):**
  - target title with icon, and elapsed time from a `Ticker`/`Timer.periodic(1 s)` that only rebuilds the text
  - Stop (FilledButton) and Discard (TextButton).
  - `AnimatedItems` handles appearing and disappearing.
- **Messages:** stop confirms "Logged 45 min on Thesis"; discard confirms "Timer discarded".

### 4. Timer notification

- `NotificationScheduler` gains `showTimer({title, startedAt})` and `cancelTimer()` with a fixed notification ID (`timerNotificationId = 900000`).
- **Android details:** channel "Timer" with low importance (no sound), `ongoing: true`, `autoCancel: false`, `usesChronometer: true`, `when: startedAt.millisecondsSinceEpoch`, `showWhen: true`, payload `/home`.
- **`replaceAll` no longer calls `cancelAll()`:** it cancels pending requests and active notifications whose ID is not the timer's, then schedules as before.
- **`TimerNotificationSync` (keep-alive provider)** watches `runningTimerProvider` and the target title, then shows or cancels the notification. It is independent of the reminders switch.
- **Permission:** when a timer starts and notifications are not allowed, it asks once (the same request as reminders).
- **Web:** the `Noop` scheduler implements both methods as no-ops.

### 5. Objective and KR pages

**Routes:** root-level `/objectives/:id` and `/key-results/:id` (`Routes.objectivePage`, `Routes.keyResultPage`).

**Old form URLs:**
- `/plan/objectives/:id` and `/plan/key-results/:id` become redirects to the pages.
- `/plan/projects/:id` redirects to `/projects/:id`, and `/plan/habits/:id` to `/plan/habits`.
- The `new` URLs redirect to Plan.

**Objective page:** `ObjectiveScreen` + `ObjectivePageBody`.
- header card: title, `formatDateRange`, `StatusChip<ObjectiveStatus>` with menu, `DeadlineChip` (only while active)
- description, KRs as `KeyResultTile` (tap opens the KR page), "Add key result", and assigned open tasks as `TaskTile`.

**KR page:** `KeyResultScreen` + `KeyResultPageBody`.
- header: `OrbitRing` (large), value text, `DeadlineChip`.
- **`KrProgressControls`:**
  - numeric: `IconButton.filledTonal` − / +, with the value in the middle; tapping it opens a small dialog to enter the value
  - boolean: `SwitchListTile` "Done"
  - habit: check-ins text and the linked habit.
  - Writes go through `KeyResultRepository.setProgressValue`. A new `nudge(id, delta)` reads the current value in the same transaction so quick taps don't lose increments.
- Below: linked active projects (`ProjectTile`), open tasks (`TaskTile`), habits, and log entries (`LogRepository.watchForKeyResult`, new).

**Plan pane:** `PlanItem` gains `PlanObjective` and `PlanKeyResult`, and `PlanScreen` renders the matching screen with `onClose`. Overview objective headers and `KeyResultTile` taps go through `openPlanItem`.

**Overdue objective:** a `DeadlineChip(date: endDate, today, leadDays)` on the objective card header in the overview and on the page, only for active objectives.

**KR step:**
- KR form: a "Step" field (numeric only), required and > 0, default 1.
- `KeyResultRepository` create/update take `step`.

### 6. Forms in sheets

**`showFormSheet<T>(context, {required WidgetBuilder builder})`** in `lib/core/widgets/form_sheet.dart`:
- **Below 1000 px:** `showModalBottomSheet(isScrollControlled, useSafeArea, showDragHandle)` with a column limited to 90 % of the screen height.
- **From 1000 px:** `showGeneralDialog` with a right-aligned panel (width 480, full height) sliding in. Animations respect `disableAnimations`.

**`FormScaffold` becomes `FormSheetFrame`:** a header row with the title, Delete (when editing) and Save, then the scrollable fields. Validation and delete confirmation stay in each form.

**Callers:**
- **Form widgets** (`ObjectiveForm`, `KeyResultForm`, `ProjectForm`, `HabitForm`) keep their logic and lose their routes. Callers use `showObjectiveForm(context, {objective})`, `showKeyResultForm(context, {objectiveId, keyResult})`, `showProjectForm`, `showHabitForm`.
- **Task:** `showTaskDialog` becomes `showTaskForm` on the same host, and the new-task sheet is unified with it.
- **Areas:** `showAreaDialog` moves to the host.

**After saving:** a form closes its sheet and shows a message, staying on the screen it was opened from. Creating from Plan doesn't navigate; the message has "Open" for new objectives, projects and tasks.

*Alternative:* keep routes and render them as modal pages. Rejected: a route-based sheet changes the URL and needs a page builder per form; there's no need to deep-link a form.

### 7. More sheet

The ⋮ `PopupMenuButton` becomes an `IconButton(Icons.apps, tooltip: 'More')` that opens a bottom sheet with a 3-column grid of tiles. Each tile is a `Card` with an icon in a tinted circle and a label: Habits, Areas, Archive.

### 8. Task rows without menu

- `TaskTile` drops its `PopupMenuButton` and keeps the checkbox, title, marker, deadline chip and tap.
- **Task page:** "Make next step" is an `OutlinedButton` in its actions row, shown when `task.projectId != null`, the task is open and not the next step. It calls `projectRepository.setNextStep`.
- Delete and edit already exist on the task page.

### 9. Review on the current week

- **`currentWeekProvider`:** the Monday of `todayProvider`.
- **Review tab:**
  - "Week <range>" with `WeekSummaryView(weekStart: currentWeek)`
  - the review button, moved below the summary so it sits directly above the history
  - the history entry
  - a "Last week" `OutlinedButton` at the bottom, pushing `/review/week/:weekStart` (`Routes.reviewWeekPage`), which shows `WeekSummaryView` for any week.
- **Past review screen:** appends `WeekSummaryView(weekStart: review.weekStart)`.
- **KR source in `weekSummaryProvider`:**
  - when the week has a completed review, its snapshots (KR title from `keyResultsProvider`; KRs deleted since are left out) with the change versus the latest snapshot before that week
  - otherwise the current logic.
  - Implemented as a new pure function `snapshotProgressChanges` and a branch in the provider.
- **Look-back step:** the weekly review keeps `reviewWeekProvider`.
- **Live KRs for the review flow:** the KR step and Save read a separate `currentKrProgressProvider(weekStart)` (current values, change since the latest earlier review), not the week summary. Otherwise editing an already completed review would show, and save again, its old snapshots.

### 10. Messages at the top

**`MessageHost`:** wraps the app in `MaterialApp.builder`. It puts a `Stack` over the app with the current message under `SafeArea` at the top.

**`messengerProvider` (keep-alive notifier):**
- `show(Message(text, icon, action?))` replaces the current message and starts a 3-second timer.
- `dismiss()` clears it.
- **Card:** `Material` with 16 px radius, `surfaceContainerHigh`, an icon in the primary color, text, and an optional `TextButton` action.
- **Animation:** slide and fade in from the top, 200 ms, none with `disableAnimations`. A `Dismissible` (direction up) swipes it away.

**Call sites:** the 8 `SnackBar` calls become `ref.read(messengerProvider.notifier).show(...)` or a `showMessage(context, …)` helper. Because the host sits above the navigator, messages survive closing sheets and changing routes.

*Alternative:* `SnackBar` with `margin` pushing it to the top. Rejected: it's fragile with keyboard insets, and auto-dismiss is tied to the `ScaffoldMessenger` of one scaffold.

## Risks / Trade-offs

- [Timer started on two offline devices: the earlier one disappears without a log entry] → This matches the spec's "later start wins". The window is small because sync runs a few seconds after changes.
- [Device clocks differ, so elapsed time and LWW use each device's clock] → This is already accepted for sync (SPEC §7); the timer shows elapsed from `started_at` on every device.
- [`replaceAll` no longer clears everything, so a stale reminder could survive] → It explicitly cancels all pending requests and all active notifications except the timer ID. A test with the fake scheduler checks the timer survives a `replaceAll`.
- [The fixed timer ID would collide between users on the server] → Single-user project with sign-ups disabled, same as weekly reviews. Noted for a future multi-user setup.
- [Removing form routes breaks deep links and tests that push them] → Redirects keep old URLs working; tests move to opening sheets.
- [3 seconds is short for Undo after completing a task] → The spec fixes 3 s. The Undo stays the same action and is easy to adjust.
- [A side sheet on the web may cover the detail pane] → It's modal with a scrim; closing returns to the same pane state.

## Migration Plan

1. Ship schema v5 with `from4To5`, the generated tests and the v4 → v5 data test.
2. **The user re-runs `supabase/schema.sql`** in the SQL Editor before syncing with this version (the new `timers` table and `key_results.step`). An older app version ignores both. A newer app against an old server would fail to push timers until the SQL is run; sync failures are silent and retried.
3. **Rollback:** an older build can't open a v5 database (drift refuses downgrades), so rollback means reinstalling and syncing down. This is acceptable for a personal app and the same as previous milestones.

## Follow-ups for archiving

- `openspec/config.yaml` context: forms open through `showFormSheet` (no form routes), and confirmations go through the message host (no `SnackBar`).
- `docs/SPEC.md` is already updated for milestone 8, including the KR source for past weeks in §5.
