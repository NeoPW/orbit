# Design

## Context

There is one `timers` row per account (fixed `TIMER_ID`, synced last-write-wins): `started_at`, `planned_minutes` and what it runs for. Stopping writes one `log_entries` row (`source = timer`, `occurred_at` = start, whole minutes) and soft-deletes the timer. The timeline draws each timer entry from `occurred_at` for its duration and adds the running timer as a striped block. The end-of-session reminder fires at `started_at + planned_minutes`.

## Goals / Non-Goals

**Goals:** pause, resume, complete and discard on the one timer row; limit on the session's worked time; merging of stretches only when drawing.

**Non-Goals:** a separate sessions table; rewriting or joining log entries; changing review totals (they already sum entries).

## Decisions

### Timer row holds the session (schema)

Three columns on `timers`, all nullable or defaulted, so existing rows stay valid:

| Column | Type | Meaning |
|---|---|---|
| `paused_at` | text, null | Set while paused; null while running. |
| `worked_seconds` | integer, not null, default 0 | Exact time of the earlier stretches of this session, in seconds (not their rounded entries). |
| `last_entry_id` | text, null | The entry of the last logged stretch (Complete while paused puts the note there). |

`started_at` becomes the start of the current stretch, and `planned_minutes` becomes the session's time limit (no rename, so no data migration: a timer running at upgrade keeps its planned length as its limit). Worked time = `worked_seconds` + (running ? elapsed since `started_at` : 0). Seconds rather than the entries' whole minutes, so a 20-second stretch adds 20 seconds, not the entry's minimum of 1 minute, and rounding does not add up over many pauses.

Migration: `npm run db:generate` (drizzle `0003_*`, three `ALTER TABLE timers ADD COLUMN`) and `npm run db:generate:server`; `SCHEMA_VERSION` becomes 4, so the Worker is deployed together with the apps (README "Schema changes").

Alternative: a `focus_sessions` table with one row per stretch. Rejected: the log entries already are the stretches, and a second synced table doubles the conflict cases for no visible gain.

### Repository operations

All in `timer-repository.ts`, each one `db.batch` so the entry and the timer change land together:
- `startTimer(target)`: if a session runs, log its running stretch; then upsert the timer with `worked_seconds = 0`, `paused_at = null`, `last_entry_id = null`, `planned_minutes = null`.
- `pauseTimer()`: running only; insert the stretch entry, set `paused_at = now`, `worked_seconds +=` the stretch's exact seconds, `last_entry_id`.
- `resumeTimer()`: paused only; `started_at = now`, `paused_at = null`.
- `completeTimer(note, { markHabitDone })`: running → insert the stretch with the note; paused → update the note of `last_entry_id` when the note is not empty; soft-delete the timer; then complete the task (existing `completeTask`) or check the habit.
- `discardTimer()`: soft-delete the timer, no entry (the running stretch is dropped; logged ones stay).
- `setTimerLimit(minutes | null)`: update `planned_minutes`.

Stop disappears; the stretch-entry builder (`logTimerQuery`) is shared by start, pause and complete.

### Merge when drawing

A pure function in `timeline/domain/day-timeline.ts`, `mergeStretches(items, maxGapMinutes = 10)`, runs in `loadTimeline` after the items are built: it sorts timer items (and the running one) by start, and joins consecutive ones with the same target key (task, else habit, else project) whose gap is ≤ 10 minutes. The joined item keeps the first id, spans first start to last end, sums `minutes`, joins non-empty notes with " · ", and is `running` if its last part runs. Manual entries carry no timer key and never merge. Because entries store whole minutes, a computed end can be up to a minute early; the 10-minute window absorbs that.

Alternative: extend the previous entry on a quick resume. Rejected: it rewrites a synced entry and would need the gap rule in the data, while the user only asked for the drawing to merge.

### Limit reminder

`reminder-input.ts` passes the running session's worked seconds and limit; `planReminders` fires at `started_at + (limit × 60 − worked_seconds)` seconds, only when running and `limit × 60 > worked_seconds`, keyed by `focus:<started_at>:<limit>` so a changed limit or a resumed stretch plans anew. Sound (`playChime`) and desktop notification stay as they are.

### Total time worked

The task and project pages already load their entries for the Log section (a project's by `project_id`, which its tasks' and habits' entries carry too), so the Log section header sums those (`totalMinutes` in `work-log/domain`) and shows the total next to "Log work"; no extra query. Plan's Habits section loads all habit totals with one grouped `SUM(duration_minutes)` by `habit_id` (`habitTotals`) and shows each at the row's right end. Formatting reuses the work log's duration format. Both read through `useLiveQuery`, so totals update with every write.

### UI

- `FocusPanel` loses the length segments; `StartFocusButton` becomes a plain button; `useStartFocus` drops `startWithLastLength` and the `focusMinutes` setting (the stored key is ignored, not deleted).
- `useStopTimer` becomes `useSessionActions`: pause and resume (no dialog), complete (the existing `StopDialog`, renamed `CompleteDialog`, title stays "What did you get done?"), discard (confirmation only while running).
- `FocusMode`: header with Leave on the left and a Discard icon button on the right; Pause/Resume and Complete under the timer; a "Time limit" menu (15, 30, 45, 60, 90, Custom…, No limit) where Custom opens a small minutes field.
- `TimerReadout` shows worked time and "Paused" from the view; it ticks only while running.

## Risks / Trade-offs

- [A pause on one device and a resume on another before syncing] → last write wins on the one row, as today; the stretch entries are separate rows and are kept.
- [Many short pauses create many entries] → acceptable; they merge on the timeline and sum correctly in reviews.
- [Display merge across sessions] → two separate sessions on the same task less than 10 minutes apart also draw as one block; accepted, it matches what the user sees as continuous work.
- [Server and apps must move to schema 4 together] → deploy the Worker in the same step as the apps.
