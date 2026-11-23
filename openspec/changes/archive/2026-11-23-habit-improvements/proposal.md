# Proposal: habit-improvements

## Why

Two gaps from daily use: a habit done yesterday but not ticked can no longer be checked, so its streak breaks and the work is missing from the log; and habits that take a fixed time (stretching for 20 minutes, reading for 30) need the time limit set by hand in focus mode every time, which is clumsy on the phone.

## What Changes

- The habit's sheet (opened from a habit in Plan, on a project or on a goal) gets a "Done yesterday" toggle that checks or unchecks the habit for yesterday at once, separately from saving the form. It is offered when the habit is active and scheduled yesterday, or already checked yesterday. Only yesterday can be checked late, not older days. Works the same on desktop and phone (docs/SPEC.md §5 Habits, §6.3 Plan).
- A late check is a normal habit check dated yesterday; its log entry is placed on yesterday at the habit's reminder time, else at 12:00. Streaks and weekly targets count it like any other check.
- Habits get an optional duration in whole minutes, set in the habit form and shown in the habit's schedule summary (docs/SPEC.md §4 Habit).
- Starting a focus session for a habit with a duration, from any entry point (focus panel, habit chip, command palette, on desktop and phone), starts it with that duration as its time limit. The limit can still be changed or removed in focus mode, and the existing limit notification and sound follow from it (docs/SPEC.md §5 Timer and focus).
- `docs/SPEC.md` needs updating: §4 Habit (`duration_minutes`), §5 Habits (late check for yesterday), §5 Timer and focus and §6.1 ("a session starts without a time limit" gets the habit exception), the habit sheet in §6.3.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `habits`: optional duration on a habit; checking and unchecking a habit for yesterday from its sheet.
- `work-timer`: a session for a habit with a duration starts with that time limit.

## Out of scope

- Checking habits for days before yesterday, or editing past checks from Stats.
- A separate habit page; the toggle lives in the existing habit sheet.
- Any change to Home's "Habits due today".
- A countdown display, automatic completion or automatic pause when the habit's duration is reached (the timer keeps running into overtime as today).
- Round or interval timers with sounds (for stretching or workouts); they stay on the feedback list.
- Changing how habits relate to tasks.

## Impact

- Schema: new nullable column `habits.duration_minutes`; new app migration in `drizzle/` and server migration in `server/migrations/`.
- Code: `src/features/habits/` (repository input and validation, check date for yesterday, `HabitSheet` with the duration field and the "Done yesterday" toggle, `HabitsSection` summary), `src/features/timer/data/timer-repository.ts` (`startTimer` reads the habit's duration).
- Sync: the column syncs like the others; a device still on an older build that saves a habit clears its duration (see design).
