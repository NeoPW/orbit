# Proposal

## Why

Working out is a big goal, and tracking it means switching to a separate fitness app that knows nothing about Orbit's goals, habits or logged time. This change is the first of two that bring simple workout tracking into Orbit on the phone. It adds the building blocks: exercises and workouts (lists of exercises). The second change, `workout-sessions`, will add doing a workout: logging sets with what you did last time filled in, and the session's time as tracked work.

## What Changes

- New **exercises**, each with a name and a type: **strength** (reps × weight), **bodyweight** (reps) or **endurance** (distance + duration). An endurance exercise has a distance unit (km or m), e.g. km for running and cycling, m for swimming.
- New **workouts**: a name and an ordered list of exercises, with an optional project, goal and habit. A workout is only a starting point; the session in change 2 can deviate from it.
- A **Workouts** screen on the phone (new fourth bottom-navigation entry), listing workouts and exercises, with full-screen sheets to create, edit and delete them.
- Workouts are a phone feature: the screen exists only in the phone layout (like Today). The desktop and wide browser windows get no workout UI in this change.
- Both new tables are synced like every other table (device and sync server).
- `docs/SPEC.md` gets the new concepts, data model entries and the phone screen (§1, §3, §4, §6). The phone is no longer only a "small companion": it now has a feature of its own.

**Out of scope** (this change):
- Workout sessions, sets, "last time" values, timing, log entries and the habit check: change 2 (`workout-sessions`).
- Showing workouts on the desktop timeline and a read-only summary there: change 2.
- An exercise library or import, exercise notes, images, muscle groups.
- Progress charts, personal records, rest timer, supersets, RPE, plate calculator.
- Feeding endurance distance into a goal measure.
- Creating a new exercise from inside the workout sheet (create it in the Exercises list first).
- Any workout UI on the desktop.

## Capabilities

### New Capabilities
- `workouts`: exercises and workouts, and their screen on the phone (change 2 adds sessions to it).

### Modified Capabilities
- `mobile-layout`: the bottom navigation gets a fourth entry, Workouts, and the phone's screens include the Workouts screen.
- `local-database`: the database gets the Exercise and Workout tables.
- `sync-server`: the server holds tables for exercises and workouts.

## Impact

- Schema (`src/core/db/schema.ts`): two new synced tables, `exercises` and `workouts`; a new app migration and a new server migration (forward only).
- New feature folder `src/features/workouts/` (domain, data, ui).
- Routing (`src/core/routing/routes.ts`), shell (`src/app/Shell.tsx`) and bottom navigation (`src/app/BottomNav.tsx`).
- Sync needs no code changes: synced tables are derived from the schema.
- No new packages.
- Related sections of `docs/SPEC.md`: §1 Goals, §3 Core concepts, §4 Data model, §6 Screens (phone).
