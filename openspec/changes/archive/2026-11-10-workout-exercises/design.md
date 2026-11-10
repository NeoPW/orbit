# Design

## Context

Two new synced tables. Synced tables are derived from `SYNCED_TABLES` in `src/core/db/schema.ts` (`src/core/db/sync-tables.ts`), so push and pull on the device and the server need no code changes. The server's own table list in `server/src/schema.ts` is written by hand and needs the two tables added. Habits are the closest existing feature (repository with `createFields`/`updateFields`/`deleteFields`, a `Sheet` form with project and goal `Select`s), and the phone-only Today screen is the precedent for a screen that exists only in the phone layout.

## Goals / Non-Goals

**Goals:**
- A data model that change 2 (`workout-sessions`) can build on without migrating these tables again.
- No changes to the habits, projects or goals features.

**Non-Goals:**
- Session tables (session exercises, entries): change 2.
- Database-level constraints such as unique names or foreign keys (the project has none; sync must accept any row).

## Decisions

### Schema

```ts
EXERCISE_KINDS = ['strength', 'bodyweight', 'endurance']
DISTANCE_UNITS = ['km', 'm']

exercises: shared + {
  name: text('name').notNull(),
  kind: text('kind', { enum: EXERCISE_KINDS }).notNull(),
  /** Only for `endurance`; null otherwise. */
  distanceUnit: text('distance_unit', { enum: DISTANCE_UNITS }),
}

workouts: shared + {
  name: text('name').notNull(),
  /** JSON array of exercise ids, in the workout's order. */
  exerciseIds: text('exercise_ids', { mode: 'json' }).$type<string[]>().notNull().default([]),
  projectId: text('project_id'),
  goalId: text('goal_id'),
  habitId: text('habit_id'),
}
```

Both go into `SYNCED_TABLES` (`exercises`, `workouts`) and into `server/src/schema.ts` with `server_seq` and its index, like the other tables. The column is named `kind`, not `type`, to avoid confusion with TypeScript's `type`.

**Migrations:** one new app migration from `npm run db:generate` (two `CREATE TABLE`s, no changes to existing tables) and one new server migration from `npm run db:generate:server`. No existing migration is edited or regenerated.

### A workout's exercises as a JSON array, not a join table

`exercise_ids` holds the ordered ids in the workout row, like `habits.weekdays`.
- Saving a workout is one row write, and last-write-wins applies to the whole list. A join table (`workout_exercises` with `sort_order`) would merge concurrent edits from two devices row by row into a list nobody made, and would need batch writes and a third synced table.
- Session exercises in change 2 will be rows, because sets attach to them. A template list has nothing attached, so it can stay a value.

### Deleting an exercise

One `db.batch()`: soft-delete the exercise and update every non-deleted workout whose `exercise_ids` contains it, with the id removed. Reads also filter the list to existing, non-deleted exercises, because sync can bring back a workout version from before the delete. Such a workout may end up with no exercises. It is kept and listed, and its form then requires adding one before saving.

### Links resolved on read, not cleared on delete

`project_id`, `goal_id` and `habit_id` stay as stored when the linked item is deleted. The repository returns a link only when its target exists and is not deleted. The alternative, clearing the link in `deleteHabit`/project/goal delete (as `deleteHabit` does for measures), would touch three other features for a link that nothing acts on until change 2. Change 2 must use the same resolved links when it finishes a session.

### Name uniqueness in the repository

`createExercise`/`updateExercise` reject a name equal (trimmed, case-insensitive) to another non-deleted exercise's name. It is not a unique index: two offline devices can create the same name, and sync must still accept both rows. Duplicates from sync are shown as they are.

### Phone only through the layout, not a platform flag

The Workouts screen follows the Today precedent: a `workouts` route (`/workouts`), a fourth `BottomNav` entry (lucide `Dumbbell` icon), and in `Shell.tsx` a wide window on that route navigates to Home. This keeps it consistent with the mobile-layout spec ("phone" = Android app or a window narrower than 640 px). It also allows testing in a narrow browser window. The earlier idea of a platform capability flag is dropped: it would hide the screen from that test path and add a platform check to feature code.

### Domain and data split

- `src/features/workouts/domain/workouts.ts`: pure validation (`validateExercise`, `validateWorkout`), name normalising, and list helpers (move up/down, remove, the exercises still addable). Tested with Vitest.
- `src/features/workouts/data/exercises-repository.ts` and `workouts-repository.ts`: CRUD, delete-with-removal, and list queries that return resolved exercises and links.
- `src/features/workouts/ui/`: `WorkoutsScreen`, `ExerciseSheet`, `WorkoutSheet`.

No new packages.

## Risks / Trade-offs

- [A device on an older version pulls `exercises`/`workouts` rows it has no table for. The app's `applyPage` would then fail on the unknown table.] → Update the server, the desktop app and the phone before creating the first exercise (see Migration Plan). This is the same as when earlier tables were added.
- [Changing an exercise's type after change 2 has stored entries for it would mismatch the entries.] → Not a problem in this change, since no entries exist yet. Change 2 decides whether the type locks once the exercise is used.
- [JSON list loses one device's edit when two devices edit the same workout offline.] → Accepted: last-write-wins per row is the project's sync model, and a single user rarely edits a template on two devices at once.

## Migration Plan

1. Apply the new server migration to the live D1 database and deploy the server. The browser build is served by it, so it updates with the deploy.
2. Install the new desktop build and the new phone APK.
3. Only then create exercises.

Rollback: the new tables are only added, so an older app version keeps working as long as no exercise or workout rows exist yet.

## Open Questions

- Whether a used exercise's type should be locked: decided in change 2.
