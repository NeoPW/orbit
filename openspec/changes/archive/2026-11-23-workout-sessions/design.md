# Design

## Context

See proposal.md for the why. This builds on `workout-exercises`: `exercises` and `workouts` tables, `src/features/workouts/` with the domain, two repositories and the phone-only Workouts screen (gated by the phone layout like Today). Precedents used here:
- **Habits** for writes that belong together: `checkHabit` creates a check and its log entry in one batch.
- **The timer** for "one at a time": a single row, `completeTimer` checks a habit with `checkHabit(…, localToday(clock()))`.
- **The task popup** for a dialog opened from the timeline: a context provider (`TaskPopupProvider`, `useOpenTask`) and a native `<dialog>` with `showModal()`.

The timeline turns log entries into blocks in `loadTimeline` (`describe()` picks label, colour and target), `blockTimes` decides whether an entry starts or ends at `occurred_at`, and `DayTimeline.openTarget` handles clicks.

## Goals / Non-Goals

**Goals:**
- A session's work is an ordinary log entry, so the week summary, Stats, goal work and the timelines need no workout-specific code beyond the timeline label and click.
- Session data that a later change (progress, records) can query without migrating.

**Non-Goals:**
- Sharing the focus timer: a workout session and a focus session can run at the same time; they are unrelated.
- Showing a running session on another device's timeline.

## Decisions

### Schema

```ts
LOG_SOURCES = ['manual', 'habit', 'task', 'timer', 'workout']   // enum widened (text column, no SQL change)

workoutSessions: shared + {
  workoutId: text('workout_id'),            // the workout it started from; null for an empty session
  name: text('name').notNull(),
  startedAt: text('started_at').notNull(),  // UTC
  endedAt: text('ended_at'),                // null while running
  projectId, goalId, habitId: text(...),    // copied from the workout's resolved links at start
  logEntryId: text('log_entry_id'),         // set when finished
}

sessionExercises: shared + {
  sessionId: text('session_id').notNull(),
  exerciseId: text('exercise_id').notNull(),
  position: integer('position').notNull(),  // 0, 1, 2 … within the session
}

sessionSets: shared + {
  sessionExerciseId: text('session_exercise_id').notNull(),
  position: integer('position').notNull(),
  reps: integer('reps'),                    // strength, bodyweight
  weightKg: real('weight_kg'),              // strength
  distance: real('distance'),               // endurance, in the exercise's unit
  durationSeconds: integer('duration_seconds'),  // endurance
}
```

All three go into `SYNCED_TABLES` and `server/src/schema.ts` (with `server_seq` and its index). **Migrations:** one new app migration (three `CREATE TABLE`s; the `source` enum lives only in TypeScript, so widening it needs no SQL) and one new server migration. No existing migration is touched.

### Rows, not JSON, for session exercises and sets

Unlike a workout's `exercise_ids`, session exercises and sets are rows. Sets need their own identity (edit or delete one set, query "last time" across sessions). A session's exercise list also has rows hanging off it. Conflicting edits from two devices are unlikely, because a session is edited on one phone.

**Positions** are integers. A move swaps two rows' positions in one batch. A remove soft-deletes the row (and its sets) and leaves a gap. Reads order by position, so gaps don't matter. Adding takes `max(position) + 1`. Replace updates `exercise_id` on the same row, which keeps its position.

### One running session

"Running" means `ended_at IS NULL` and not deleted. `startSession` refuses (returns the running one's id) when one exists, and the UI never offers a second start. Two phones starting offline could produce two running sessions after sync. The UI then shows the most recently started one, and the other stays running until it is opened from its address and finished or discarded. This is accepted as rare for a single user with one phone.

### Finishing and editing write the log entry in one batch

- **finishSession:** in one `db.batch()`, set `ended_at` and insert the log entry (`insertLogEntryQuery`: `occurred_at = started_at`, `duration_minutes = max(1, round((end − start) / 60 000))`, `note = name`, `project_id`, `goal_id`, `habit_id = null`, `source = 'workout'`), then set `log_entry_id`. If the session has a habit that still exists, `checkHabit(db, clock, habitId, localToday(clock()))` follows (as `completeTimer` does). `checkHabit` writes its own marker entry, so the habit check behaves exactly like any other check. The log entry gets `habit_id = null` so the timeline does not label the block with the habit.
- **Editing a finished session** (name, start, end) updates the session and its log entry in one batch. Set and exercise edits don't change the entry.
- **deleteSession / discardSession:** soft-delete the session, its session exercises and their sets (and, for a finished one, its log entry) in one batch. The habit check stays.

### "Last time" in a pure function

The repository loads, for the session's exercise ids, the sets of all other finished, non-deleted sessions, joined to their session's `started_at` and the session exercise's `exercise_id`. The domain function `lastTime(exerciseId, rows)` picks the most recently started session that has sets for that exercise and returns its sets in order. `prefill(lastSets, loggedSets)` applies the position rule from the spec. Both are tested without a database. The amount of data is small (one user), so no index or SQL window function is needed.

### Durations and pace in the domain

`parseDuration('28:40' | '1:05:00')` gives seconds or an error. `formatSetDuration`, `pace(distance, seconds, unit)` gives `"5:30 /km"` or `"2:00 /100 m"`, and `formatSet(kind, set, unit)` gives `"8 × 60 kg"`, `"12 reps"` or `"5.2 km in 28:40"`. `validateSet(kind, input)` returns the spec's messages. These live in a new `src/features/workouts/domain/sessions.ts`. They are separate from `work-log`'s `parseDuration`, which parses minutes like "1h 30".

### Type lock

`exerciseHasSets(db, exerciseId)` checks for any non-deleted set whose non-deleted session exercise points at the exercise, inside a non-deleted session. `updateExercise` keeps the stored `kind` and `distance_unit` when the exercise has sets (so a stale form can't change them), and `ExerciseSheet` disables both controls and shows the line.

### Timeline

- `blockTimes`: `source === 'timer' || source === 'workout'` starts at `occurred_at`.
- `loadTimeline` loads the non-deleted sessions whose `log_entry_id` is among the day's entries. For a workout entry, `describe` uses the entry's note (the session's name; it is updated when the session is renamed) as label, keeps the project/goal colour, and sets the target to `{ workoutSessionId }`, or null when no session is found.
- `TimelineTarget` gains `{ workoutSessionId: string }`, and `DayTimeline.openTarget` opens the summary through a new `WorkoutSummaryProvider` / `useOpenWorkoutSummary` (mounted in `Shell.tsx` next to `TaskPopupProvider`, for the desktop and phone layouts). The dialog is a native `<dialog>` that is itself the flex container, with no percentage heights (see WebKit note in memory: auto-height dialogs).

### Work log list

`LogEntryList`'s `SOURCES` gains `workout: { icon: Dumbbell, label: 'Workout' }`, and the delete button is not rendered for `source === 'workout'`. `deleteLogEntry` itself is unchanged.

### Phone UI

- **Route** `workout-session` (`/workouts/sessions/:id`), section `workouts`, phone only (added to the Shell's wide-window redirect).
- **`WorkoutsScreen`** gains a running-session tile at the top (name, live running time via `useNow`, Continue), start buttons on workout rows, "Empty session", and the Recent sessions section.
- **`SessionScreen`** has the name field, the running time (or start/end time fields for a finished session), and one card per exercise. Each card shows last time, logged sets (tap to edit or delete in a small sheet), an input row filled from `prefill` with "Log set", and a menu with move up/down, replace and remove. Below the cards: "Add exercise". At the bottom: Finish and Discard for a running session, Delete for a finished one.
- **Inputs:** numbers through `inputMode="decimal"` / `"numeric"` text fields, so the phone shows a number keypad. 44 px touch targets.

No new packages.

## Risks / Trade-offs

- [An older device pulls rows of the new tables, or a `workout` log entry it has no icon for, and fails or breaks.] → As before: deploy the server, update the desktop and the phone, then start the first session. The older desktop's `LogEntryList` would also miss the `workout` icon, which is another reason to update first.
- [A forgotten running session logs hours of "work" when finished late.] → Fix it afterwards by editing the end time of the finished session. A reminder is out of scope.
- [Two running sessions after an offline conflict.] → Accepted (see above). Each can still be finished or discarded from its own address.
- [Last time is computed in memory over all sets of the exercise.] → Fine for one user's history; revisit if it ever gets slow.

## Migration Plan

1. Apply the new server migration to the live D1 database and deploy the server (this also updates the browser build).
2. Install the new desktop build and phone APK.
3. Then start the first session.

Rollback: the tables are only added, and the `workout` source only appears once a session is finished.
