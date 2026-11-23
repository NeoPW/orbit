# Design: habit-improvements

## Context

- `checkHabit(db, clock, habitId, date)` and `uncheckHabit` already take a local date; the check has a natural ID per (habit, date). Only the log entry's `occurredAt` is hard-wired to "now".
- `listHabitsForToday(db, today)` already evaluates `isDue` and the checked state for any date it is given.
- Streaks and weekly adherence are computed from check dates, so a check dated yesterday counts without changes.
- `startTimer(db, clock, target)` is the single place every start goes through (`useStartFocus`, command palette, focus panel); it writes `plannedMinutes: null`.
- The limit notification (desktop and Android) is derived from the timer row in `notifications/data/reminder-input.ts`, so a limit set at start is scheduled without extra work.

## Goals / Non-Goals

**Goals:** check yesterday's habits from the habit's sheet on desktop and phone; a habit duration that becomes the session's limit at every entry point.

**Non-Goals:** checks for older dates, a countdown view, auto-complete at the limit, interval timers.

## Decisions

### Schema: `habits.duration_minutes`
- New nullable `integer('duration_minutes')` on `habits` in `src/core/db/schema.ts`. `npm run db:generate` adds `drizzle/0009_*.sql` (`ALTER TABLE habits ADD duration_minutes integer`), `npm run db:generate:server` the matching server migration. No backfill; existing habits have no duration.
- Validation in the repository's `validate` (via a small domain function): empty → null, else a whole number from 1 to 1440, the same range as the custom time limit in `TimeLimit.tsx`.

### Late check: the log entry's time
- `checkHabit` gets the entry's `occurredAt` from a pure domain function `checkTime(date, today, reminderTime, now)`: for today it stays "now"; for an earlier date it is that date at the habit's reminder time, else 12:00, converted from local time to UTC.
- Alternative considered: the current time of day on yesterday's date. Rejected: arbitrary on the timeline. The reminder time is the user's own idea of when the habit happens; noon is a neutral fallback.
- The repository does not enforce "only today and yesterday"; the UI offers only those two dates. The spec limit is a UI rule, so no repository guard is needed.

### "Done yesterday" in the habit sheet
- `HabitSheet` shows the toggle above the form when editing an existing habit (not when creating). It calls `checkHabit`/`uncheckHabit` with yesterday's local date immediately; it is not part of the form's Save, so Cancel does not undo it.
- When to offer it: a pure domain function `offeredYesterday(habit, yesterday, checkedYesterday)`: the habit is active and scheduled on that weekday (`daily` always, `weekdays` when yesterday is in the set, `times_per_week` always, ignoring the weekly count), or it is already checked yesterday (so it can be unchecked). Ignoring the weekly count avoids hiding the toggle for a `times_per_week` habit whose target was reached with today's check.
- The sheet loads yesterday's checked state through the habits repository (a small `isChecked(db, habitId, date)` query).
- Same component on the phone (the sheet is full screen there), so no separate phone work.

### Starting with the habit's duration
- `startTimer` sets `plannedMinutes` to the habit's `durationMinutes` when the target is a habit (read in the same function before the batch); otherwise null. Putting it there covers every entry point at once.

## Risks / Trade-offs

- **Older builds clear the duration**: the server upsert writes every column it knows from the pushed row, so a device on a build without the column that saves a habit sends no `duration_minutes` and clears it. Same accepted trade-off as earlier column additions (`tasks.sort_order`): update desktop, browser and phone together.
