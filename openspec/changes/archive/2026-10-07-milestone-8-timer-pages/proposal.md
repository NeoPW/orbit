# Proposal

## Why

Using the app every day shows gaps and friction:
- **Time tracking:** work can only be logged after the fact. There is no way to start a timer when beginning work.
- **Objectives and KRs:** they have no page of their own. Tapping one opens its edit form, and recording KR progress means editing the KR. An objective past its end date looks like any other.
- **Creating things:** objectives, projects and habits open a full-screen form page, while a new task is a quick sheet. The ⋮ menu for Habits, Areas and Archive looks out of place, and task rows carry a menu next to an already tappable row.
- **Review tab:** it shows the review week, which is last week for six days out of seven. You can't follow the current week, and past reviews only show score, reflection and plan, not what happened that week.
- **Messages:** confirmations appear at the bottom (where they cover the floating buttons), stay too long and look plain.

`docs/SPEC.md` was updated for this as milestone 8 (§3, §4, §5, §6.1, §6.3–§6.5, §6.7, §8, §9).

## What Changes

**Work timer** (SPEC §3, §4 Timer, §5 Timer, §6.1, §8)
- Quick log gets a **Start timer** switch: tapping a project or task then starts a timer for it.
- **One timer at a time.** Starting another one logs and stops the running one.
- **Synced** across devices: one record per account with a fixed ID, so the later start wins.
- **Keeps running while the app is closed.** The elapsed time is computed from the start time.
- **Timer card on Home:** shows the live elapsed time, with Stop and Discard.
- **Stopping** creates a log entry with source `timer`: the elapsed whole minutes (at least 1), timestamped at the start.
- **Ongoing notification on Android:** shows what the timer runs for and a live counter, also for a timer started on the other device.

**Objective and KR pages** (SPEC §4 KeyResult, §6.4, §8)
- Tapping an objective or KR opens its **page**, not the edit form. On wide screens it opens in the Plan detail pane.
- **Objective page:**
  - header: title, date range, status chip with status menu, deadline badge
  - description, its KRs with progress, and the open tasks assigned to it.
- **KR page:**
  - header: progress ring, value, deadline badge
  - **progress controls:**
    - numeric: − / + buttons by the KR's new **step** (default 1), and editing the value directly
    - boolean: a done switch
    - habit: read-only
  - linked projects, open tasks and habits, and the KR's log entries.
- **Overdue objectives:** active objectives show a deadline badge for their end date in the Plan overview and on their page: amber within the lead time, red "Overdue" after it.
- KR deadline reminders open the KR page.

**Plan interaction** (SPEC §6.3, §6.4)
- **Forms in sheets:** creating and editing objectives, KRs, projects, habits, areas and tasks happens in a sheet: a bottom sheet on phones, a side sheet on wide screens. The full-screen form pages and their URLs go away; old form URLs redirect to the matching page.
- **More sheet:** a **More** button opens a sheet with large tiles for Habits, Areas and Archive, replacing the ⋮ menu.
- **Task rows without a menu:** the checkbox completes the task and tapping opens its page. "Make next step" moves to the task page.
- **Archive:** opens objectives and projects on their page; the status is changed there.

**Review** (SPEC §5 Weeks, §6.5)
- **Current week:** the Review tab shows the current week so far on every day. A **Last week** button at the bottom opens a page with last week's summary.
- **Weekly review unchanged:** the "Start / Continue / Edit weekly review" button and the guided review still work on the review week.
- **Past reviews** show that week's summary too. For a week with a completed review, KR progress comes from that review's snapshots.

**Messages** (SPEC §6.7)
- Confirmations ("Task completed", "Work logged", …) appear at the top as a compact card with an icon.
- They disappear after 3 seconds and can be swiped away. An action such as Undo or Open stays on the card while it is shown.

## Capabilities

### New Capabilities
- `work-timer`: the running work timer. Covers starting from quick log, one timer per account, stopping (logging) and discarding, the Home timer card and syncing between devices.

### Modified Capabilities
- `key-results`: the KR page with progress controls, the step field in the KR form, and the habit KR text matching the ring display.
- `objectives`: the objective page with a status menu, and the deadline badge for the end date (overdue).
- `plan-overview`:
  - objective deadline badge
  - objectives and KRs open their page (also in the detail pane)
  - forms in sheets
  - the More sheet
  - the Archive opens pages.
- `tasks`: "Make next step" on the task page; task rows without a menu.
- `habits`: the habit list shows links without a "No link" placeholder (aligning the spec with milestone 7).
- `work-log`: the Start timer switch in quick log.
- `home`: the timer card in the section order.
- `notifications`: the ongoing running-timer notification; KR reminders open the KR page.
- `weekly-review`: the Review tab on the current week, the Last week page, and the past review showing its week summary.
- `week-summary`: summaries for any week, with KR progress from the week's review snapshots.
- `visual-design`:
  - messages at the top with auto-dismiss
  - forms as sheets
  - objectives and KRs in the two-pane layout.
- `local-database`: schema version 5 (timer table, KR step).
- `sync`: the timer table on the server; the timer's fixed ID as a natural key.

## Impact

- **Data:**
  - Schema 4 → 5, adding the `timers` table and `key_results.step` (default 1). This is a step-by-step drift migration with tests.
  - `supabase/schema.sql` gains the table (with RLS and the sync trigger) and the column. **The user re-runs it in the SQL Editor** before syncing with the new version.
  - Log entries get the new source value `timer` (stored as text, no migration).
- **Code:**
  - new `lib/features/timer/` (repository, providers, domain, Home card)
  - notifications (a separate ongoing notification that rescheduling leaves alone)
  - sync table registry
  - new objective and KR pages with root routes
  - a shared form-sheet host replacing `FormScaffold` pages
  - Plan screen (More sheet, selection for objectives and KRs)
  - task tile, quick log, Review tab, past review screen, week summary for any week
  - a top message host replacing the 8 `SnackBar` calls.
- **Dependencies:** none. The live counter in the notification uses `flutter_local_notifications`' chronometer.
- **Tests:**
  - widget tests that open forms by URL or look for the ⋮ menu, the task menu, snackbars or the Review tab's week change
  - migration tests for v5.

## Out of scope

- **Stop or pause from the notification:** this needs the app to act in the background without opening it. Tapping the notification opens Home, where the timer card has Stop.
- **Pausing a timer and editing a running timer's start time.**
- **Statistics, charts and native desktop builds** (milestone 9).
- **History of KR values** beyond the snapshots saved with reviews.
- **Habit adherence of past weeks under the schedule at that time.** It keeps using the current schedule (SPEC §5).
