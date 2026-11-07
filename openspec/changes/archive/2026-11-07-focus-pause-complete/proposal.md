# Proposal

## Why

A focus session can only be stopped (with a dialog) or discarded, so breaks and switching away cost the session: stopping ends it, and the planned length has to be picked before starting. Tracking time on a task should work like a stopwatch with pause and resume, end with "complete" when the work is done, and leave the time limit to the moment it matters.

## What Changes

- **Pause and resume** replace Stop: Pause logs the stretch since the last start or resume as a log entry (a block on the timeline), without a dialog, and leaves the session paused; Resume starts the next stretch. The session stays (running or paused) when focus mode is left.
- **Resumed stretches merge on the timeline:** timer blocks of the same task, habit or project with at most 10 minutes between them are drawn as one block from the first start to the last end; its minutes are the sum of the stretches (the pause is not counted).
- **Complete** ends the session with the existing "What did you get done?" dialog: a task is marked done, a habit is checked for today ("Mark as done today", on by default, as now), a project session just ends. The note goes on the last logged stretch.
- **Discard** moves to the top-right corner of focus mode and discards only the running stretch, then ends the session; stretches already logged stay.
- **BREAKING (UI):** the 30/60/90/open-ended choice before starting is removed, and with it the remembered last length; every start is without limit. Focus mode instead offers a **time limit** for the session (its worked time); reaching it gives the existing end-of-session notification and sound, and the timer keeps running into overtime.
- The timer record gets a paused state, the exact time (seconds) already worked in the session and the last logged entry (schema change with migrations for the app and the sync server). Log entries stay in whole minutes; the session's worked time and its limit are exact, so a short pause does not jump to the next minute.
- **Total time worked** is shown on a task's page, a project's page (including its tasks and habits) and on the right of each habit in Plan's Habits section, summed from its log entries.

Out of scope: totals per period (week, month) and on goals or areas, editing or splitting logged stretches, merging blocks in the data (the merge is display only), Android notifications for the limit (comes with `android-notifications`), a session history view, changes to Log work.

References: docs/SPEC.md §4 (Timer), §5 (Timer and focus), §6.1 (Home focus panel, focus mode, Today timeline), §7 (focus session notification).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `work-timer`: start without a planned length; pause, resume, complete and discard replace stop and discard; a time limit set in focus mode; focus panel, focus mode, sync and phone wording follow.
- `day-timeline`: timer blocks of the same item with a gap of at most 10 minutes are drawn as one block, including the running stretch.
- `notifications`: the end-of-session notification and sound fire when the session's worked time reaches its time limit, only while it runs.
- `work-log`: total time worked shown for a task, a project and a habit.

## Impact

- Schema: `timers` gets `paused_at`, `worked_seconds`, `last_entry_id` (`src/core/db/schema.ts`, `drizzle/`, `server/migrations/`); `SCHEMA_VERSION` goes to 4, so the server has to be deployed with the apps.
- Code: `src/features/timer/` (domain, repository, view, FocusPanel, FocusMode, StopDialog → complete dialog, useStopTimer, useStartFocus, StartFocusButton), `src/features/timeline/` (merge of blocks), `src/features/notifications/` (limit-based end of session), `src/features/settings/data/settings.ts` (drop `focusMinutes`), `src/features/home/ui/HomeScreen.tsx` and the task page start actions.
- Code for totals: a query in `src/features/work-log/data/`, `src/features/tasks/ui/TaskPage.tsx`, `src/features/projects/ui/ProjectPage.tsx`, `src/features/habits/ui/HabitsSection.tsx`.
- Docs: `docs/SPEC.md` §4, §5, §6.1, §6.2 (pages, Plan), §7.
- No new packages.
