# Tasks

## 1. Schema and sync

- [x] 1.1 In `src/core/db/schema.ts`, add `EXERCISE_KINDS`, `DISTANCE_UNITS`, the `exercises` and `workouts` column factories and tables (as in design.md), and add both to `SYNCED_TABLES`. Run `npm run db:generate` and check that the new migration in `drizzle/` only creates the two tables. Update the table count in the "Fresh install" test and add the "Workout tables added" scenario in `src/core/db/migrate.test.ts` (or `database.test.ts`, wherever "Fresh install" lives). Verify with `npx vitest run src/core/db`.
- [x] 1.2 In `server/src/schema.ts`, add `exercises` and `workouts` with `server_seq` and its index; run `npm run db:generate:server` and check the new migration in `server/migrations/`. Add the "Workouts round trip" scenario to the server round-trip test (`server/src/pull.test.ts` or `api.test.ts`, next to "Daily notes round trip"). Verify with `npx vitest run server/src`.

## 2. Domain

- [x] 2.1 Create `src/features/workouts/domain/workouts.ts` with `validateExercise` (name required, "Enter a name"; duplicate name ignoring case and spaces, "An exercise with this name exists"), `validateWorkout` (name required; "Add at least one exercise"), `moveUp`/`moveDown`/`remove` on an id list, and `addableExercises` (exercises not yet in the list). Test the "Name required", "Duplicate name", "No exercises", "Exercise only once" and "Move up" scenarios in `workouts.test.ts`. Verify with `npx vitest run src/features/workouts/domain`.

## 3. Repositories

- [x] 3.1 Create `src/features/workouts/data/exercises-repository.ts`: `listExercises` (by name), `createExercise`/`updateExercise` (validated; `distanceUnit` kept only for endurance, default `km`), and `deleteExercise` (one batch: soft-delete plus removing the id from every workout's `exerciseIds`). Test "Create a strength exercise", "Swimming in meters", "Unit dropped for other types" and "Removed from workouts" in `exercises-repository.test.ts`. Verify with `npx vitest run src/features/workouts/data`.
- [x] 3.2 Create `src/features/workouts/data/workouts-repository.ts`: `listWorkouts` (by name, each with its resolved exercises in order, skipping deleted or unknown ids, and its links resolved to existing non-deleted project, goal and habit, else null), `getWorkout`, `createWorkout`/`updateWorkout` (validated) and `deleteWorkout`. Also add a link-options loader (non-completed projects, active goals, active habits, plus the current links). Test "Create a workout", "Link a habit" and "Deleted habit" in `workouts-repository.test.ts`. Verify with `npx vitest run src/features/workouts/data`.

## 4. Phone UI

- [x] 4.1 Add the `workouts` route (`/workouts`, section `workouts`) in `src/core/routing/routes.ts` with a case in `routes.test.ts`; add the Workouts entry (lucide `Dumbbell`) to `src/app/BottomNav.tsx` between Today and Settings; in `src/app/Shell.tsx`, register the screen and send a wide window on `workouts` to Home (like `todayOnWide`). Verify with `npx vitest run src/core/routing` and in a narrow browser window ("Open Workouts", "Wide window").
- [x] 4.2 Create `src/features/workouts/ui/ExerciseSheet.tsx`: name `TextField`, type `SegmentedControl` (Strength / Bodyweight / Endurance), unit `SegmentedControl` (km / m) only for endurance, and delete with a `ConfirmDialog` that says it is removed from workouts. Verify with `npx tsc --noEmit` and in the app ("Edit an exercise").
- [x] 4.3 Create `src/features/workouts/ui/WorkoutSheet.tsx`: name, the exercise list with up/down/remove buttons (44 px touch targets), an "Add exercise" `Select` of `addableExercises`, Project/Goal/Habit `Select`s with "None", field errors from the repository, and delete with a `ConfirmDialog`. Verify with `npx tsc --noEmit` and in the app (create "Push day", reorder, link a habit).
- [x] 4.4 Create `src/features/workouts/ui/WorkoutsScreen.tsx` (+ `.module.css`, theme tokens only): `PageHeader`, then the Workouts and Exercises `Section`s with "New" buttons, rows (workout: name and exercise names; exercise: name and type, with the unit for endurance) that open the sheets, and `EmptyState`s with the create action. Verify with `npx tsc --noEmit` and in the app ("Empty screen").

## 5. Product spec

- [x] 5.1 Update `docs/SPEC.md`: §1 (the Android app gets workouts, no longer only a small companion), §3 (Exercise and Workout concepts; sessions follow in change 2), §4 (the Exercise and Workout data model) and §6 (the Workouts screen on the phone and the fourth bottom-navigation entry). Verify by reading the changed sections against the specs of this change.

## 6. Verification

- [ ] 6.1 Check the change in the desktop app (`npm run desktop`: no Workouts entry in the sidebar, the app works as before) and in the browser (`npm run dev`) at phone width (< 640 px): create exercises of each type, create and edit a workout, delete an exercise used in a workout.
- [x] 6.2 Run `npm run check` and fix any failures.
