# Tasks

## 1. Schema and sync

- [x] 1.1 In `src/core/db/schema.ts`, add `'workout'` to `LOG_SOURCES` and the `workoutSessions`, `sessionExercises` and `sessionSets` column factories and tables (as in design.md), and add them to `SYNCED_TABLES` (`workout_sessions`, `session_exercises`, `session_sets`). Run `npm run db:generate` and check that the new migration in `drizzle/` only creates the three tables. In `src/core/db/migrate.test.ts` (and `database.test.ts`), raise the schema version and table count, and add the "Session tables added" and "Workout log source" scenarios. Verify with `npx vitest run src/core/db`.
- [x] 1.2 In `server/src/schema.ts`, add the three tables with `server_seq` and its index; run `npm run db:generate:server` and check the new migration. Add the "Sessions round trip" scenario in `server/src/pull.test.ts`. Verify with `npx vitest run server/src`.

## 2. Domain

- [x] 2.1 Create `src/features/workouts/domain/sessions.ts`: `parseSetDuration` (`m:ss` / `h:mm:ss` → seconds), `validateSet(kind, input)` (the spec's messages), `formatSet(kind, set, unit)`, `pace(distance, seconds, unit)`, `sessionMinutes(start, end)` (rounded, at least 1), `lastTime(exerciseId, rows)` and `prefill(lastSets, loggedSets)`. Test the scenarios of "Log sets" (formats and errors), "Pace of endurance sets", "Last time" (all four) and "Short session" in `sessions.test.ts`. Verify with `npx vitest run src/features/workouts/domain`.

## 3. Repositories

- [x] 3.1 Create `src/features/workouts/data/sessions-repository.ts` with `startSession` (from a workout, copying name, exercises and resolved links, or empty as "Workout"; refuses a second running session), `getRunningSession`, `getSession` (with exercises, deleted exercises included by name, and sets in order), `renameSession`, and the exercise operations `addSessionExercise`, `moveSessionExercise`, `replaceSessionExercise` (only without sets) and `removeSessionExercise` (with its sets, in one batch). Test "Start from a workout", "Start empty", "No second start", "Rename", "Add an exercise", "Replace", "Replace not offered with sets", "Remove with sets" and "Deleted after use" in `sessions-repository.test.ts`. Verify with `npx vitest run src/features/workouts/data`.
- [x] 3.2 In the same file, add `logSet`, `updateSet`, `deleteSet` (validated with `validateSet`) and `loadLastTimeRows` (the sets of other finished sessions for given exercise ids, with their session's start). Test "Strength set", "Endurance set", "Invalid reps" and "From another workout" (via `lastTime`). Verify with `npx vitest run src/features/workouts/data`.
- [x] 3.3 In the same file, add `finishSession` (end, log entry and `log_entry_id` in one batch, then `checkHabit` when the habit exists), `discardSession`, `listRecentSessions` (10 newest finished), `updateFinishedSession` (name, start, end; "End must be after start"; log entry updated in the same batch) and `deleteSession` (session, exercises, sets, log entry; habit check stays). Test "Finish", "Habit checked", "Discard", "Listed after finishing", "Correct the end", "End before start" and "Delete". Verify with `npx vitest run src/features/workouts/data`.
- [x] 3.4 In `exercises-repository.ts`, add `exerciseHasSets` and make `updateExercise` keep the stored type and unit when the exercise has sets; show them disabled with "The type is fixed once the exercise has sets" in `ExerciseSheet.tsx`. Test "Locked" and "Not yet used" in `exercises-repository.test.ts`. Verify with `npx vitest run src/features/workouts/data` and `npx tsc --noEmit`.

## 4. Phone UI

- [x] 4.1 Add the `workout-session` route (`/workouts/sessions/:id`, section `workouts`) in `src/core/routing/routes.ts` with a case in `routes.test.ts`, and add it to the wide-window redirect in `src/app/Shell.tsx`. Verify with `npx vitest run src/core/routing`.
- [x] 4.2 In `WorkoutsScreen.tsx`, add the running-session tile (name, live running time with `useNow`, Continue), start buttons on workout rows and "Empty session" while none runs (starting opens the session screen), and the Recent sessions section (name, date, time range, length; tap opens the session). Verify with `npx tsc --noEmit` and in the app ("Start buttons", "Continue after reopening").
- [x] 4.3 Create `src/features/workouts/ui/SessionScreen.tsx` (+ `.module.css`): name field, running time or start/end time fields (finished), one card per exercise with last time, logged sets (tap → small sheet to edit or delete), the input row filled by `prefill` with "Log set" and the input's error, a card menu (move up/down, replace, remove with confirmation), "Add exercise", and Finish / Discard (running) or Delete (finished) with confirmations. Numeric inputs use `inputMode`; touch targets at least 44 px. Verify with `npx tsc --noEmit` and in the app at phone width (start "Push day", log sets, swap an exercise, finish; edit the end of the finished session; delete it).

## 5. Desktop and timeline

- [x] 5.1 In `src/features/timeline/domain/day-timeline.ts`, let `blockTimes` start `workout` entries at their time (test "Workout" times in `day-timeline.test.ts`). In `timeline-loader.ts`, label workout entries with their note, keep the project/goal colour and target `{ workoutSessionId }` (null when the session is gone); test "Workout" and "Deleted session" in `timeline-loader.test.ts`. Verify with `npx vitest run src/features/timeline`.
- [x] 5.2 Create `src/features/workouts/ui/WorkoutSummary.tsx` (+ `.module.css`): `WorkoutSummaryProvider` and `useOpenWorkoutSummary`, with a native `<dialog>` as its own flex container (no percentage heights) showing the "Summary content". Mount it in `src/app/Shell.tsx` (both layouts) and open it from `DayTimeline.openTarget`. Verify with `npx tsc --noEmit` and in the app ("Open a workout" on the desktop timeline and the phone's Today screen).
- [x] 5.3 In `src/features/work-log/ui/LogEntryList.tsx`, add the `workout` source (lucide `Dumbbell`, "Workout") and leave out the delete button for workout entries. Verify with `npx tsc --noEmit` and on a project page with a workout entry ("Workout source", "Workout entry").

## 6. Product spec

- [x] 6.1 Update `docs/SPEC.md`: §3 (workout session), §4 (WorkoutSession, SessionExercise, SessionSet; `source` gains `workout`), §5 (a new "Workout sessions" part: finishing, last time, editing, deleting), §6.1 (the Today timeline: workout blocks and their summary) and §6.6a (the session screen, running session, recent sessions). Verify by reading the changed sections against this change's specs.

## 7. Verification

- [x] 7.1 Check the change in the browser (`npm run dev`) at phone width (a full session from start to finish, then editing and deleting it) and at desktop width (the workout block on Home's timeline and its summary; a project page's log entries), and in the desktop app (`npm run desktop`, the timeline block and summary in WebKit).
- [x] 7.2 Run `npm run check` and fix any failures.
