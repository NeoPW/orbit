# Proposal

## Why

The first change (`workout-exercises`) added exercises and workouts. They are only templates so far. This change lets the user actually work out with Orbit on the phone. You log your sets with what you did last time already filled in, adapting the workout as you go. The session's time counts as tracked work, so it shows on the timelines, in the week summary and against goals, like any other work.

This change is larger than the project's size rule (about 15 tasks). The user chose to keep it as one change rather than split off editing and the desktop summary.

## What Changes

- **Workout sessions** on the phone: start one from a workout (its exercises copied in) or empty. At most one session runs at a time, and it survives closing the app. Sessions have no pause.
- **Changing the session while it runs:** add an exercise (to the end), remove one (confirming when it has sets), replace one that has no sets yet, and move one up or down. An exercise is in a session at most once.
- **Logging sets:** reps and weight (kg) for strength, reps for bodyweight, distance (in the exercise's unit) and duration for endurance, with the pace shown. Logged sets can be edited and deleted.
- **"Last time":** the inputs of an exercise are filled in from its sets in the most recent finished session that had it, in any workout. The last-time values are shown next to the inputs.
- **Finishing** writes one log entry with `source = workout`. It starts at the session's start, lasts the whole session, is noted with the session's name and is linked to the session's project and goal. If the session has a habit, finishing checks it for the day. **Discarding** removes the session without a log entry.
- **Recent sessions** on the Workouts screen. A finished session can be edited (sets, exercises, start and end time), and its log entry follows. It can also be deleted, which removes its log entry.
- **An exercise's type is locked** once it has sets.
- **Timeline:** a workout entry is drawn from its start (like a timer entry), labelled with the session's name. Clicking it opens a read-only summary of the session, on the desktop and on the phone.
- **Work log:** workout entries show a workout icon. They cannot be deleted from a log entry list, only by deleting the session on the phone.
- `docs/SPEC.md`: §3, §4 (WorkoutSession, SessionExercise, SessionSet; the `workout` log source), §5 (sessions and last time), §6.6a and the timeline in §6.1.

**Out of scope:**
- Pausing a session, a rest timer, supersets, RPE, plate calculator.
- Weight units other than kg; speed (km/h) instead of pace.
- Saving a session's changes back to its workout.
- Progress charts and personal records.
- Editing sessions on the desktop. The desktop only shows the summary.
- Feeding endurance distance into a goal measure.
- Android notifications for a running session.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `workouts`: sessions, sets, last time, finishing and discarding, recent sessions and editing them, the type lock, and the Workouts screen's new parts.
- `day-timeline`: workout entries start at their time, are labelled with the session's name and open the session summary.
- `work-log`: the `workout` source in the list, and workout entries cannot be deleted there.
- `local-database`: the WorkoutSession, SessionExercise and SessionSet tables, and the `workout` log source.
- `sync-server`: the server holds the three new tables.

## Impact

- **Schema** (`src/core/db/schema.ts`): three new synced tables, and `workout` added to `LOG_SOURCES`. One new app migration and one new server migration.
- `src/features/workouts/`: domain (last time, set validation, pace, duration), session repository, session screen, recent sessions, summary dialog.
- **Exercise type lock:** `src/features/workouts/data/exercises-repository.ts` and `ExerciseSheet.tsx`.
- **Timeline:** `src/features/timeline/domain/day-timeline.ts` (`blockTimes`), `src/features/timeline/data/timeline-loader.ts`, `src/features/timeline/ui/DayTimeline.tsx`.
- **Work log:** `src/features/work-log/ui/LogEntryList.tsx`.
- **Finishing** reuses `checkHabit` from `src/features/habits/data/habits-repository.ts` and `insertLogEntryQuery` from the work log.
- Routing and shell: a session route (phone only).
- No new packages.
- **Rollout:** as before, update the server, the desktop app and the phone before the first session is saved.
