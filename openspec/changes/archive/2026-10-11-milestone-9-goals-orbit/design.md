# Design

## Context

- **Code today (on `experiment/space-theme`, commit `3c67b32`):**
  - Objectives live in `lib/features/objectives`, key results in `lib/features/key_results` (repository, `kr_progress.dart`, `kr_deadline.dart`, KR page, form and tile).
  - Projects, tasks, habits and log entries point at them through `key_result_id` and, for tasks, `objective_id`. Weekly reviews store `review_kr_snapshots`.
  - The Plan overview (`plan_overview.dart`) builds objectives → KRs → projects. Home, review, reminders, timer and quick log read KRs in many places.
- **Database:** drift schema **v6**. v6 added `objectives.color` and `key_results.color` in the experiment, and your phone and Supabase already run it.
  - Migrations use `stepByStep`, with generated schema snapshots (`drift_schemas/`, `test/core/db/migrations/`).
  - Sync reads every drift table generically (`syncTables`). `schema_sql_test` checks that `supabase/schema.sql` mirrors the local tables.
- **Sync:** global push/pull watermarks, last-write-wins by `updated_at`, enforced on the server by the `sync_guard` trigger, which ignores an update whose `updated_at` is not newer.
- **Experiment code reused here:**
  - `lib/core/space`: `paintPlanet`, `paintStar`, the space background and images, `ShootingStar`, `space_colors.dart`.
  - The planet color picker, the sheet fixes and the dark theme.
- **Experiment code replaced:** the per-objective `StarSystem`, the Home star-system row and `objective_system.dart`.

## Goals / Non-Goals

**Goals:**
- One rename pass from objectives to goals, and from key results to measures, through data, domain, UI, routes and tests. No "objective" or "KR" names stay in the code, except in the migration and redirects.
- A lossless data move on devices and the server that keeps IDs and `updated_at`, so synced devices agree without re-uploading.
- One pure-Dart layer for everything derived (measure and goal progress, work per goal, review changes, solar layout), unit-tested without Flutter.

**Non-Goals:**
- Keeping old app versions syncing after the server is migrated.
- Animating the solar system.
- Reworking parts of the review or Home that the specs don't touch.

## Decisions

### 1. New `goals` feature, old features deleted
`lib/features/goals/` holds both goals and measures:
- `data/`: `goal_repository.dart`, `measure_repository.dart`
- `domain/`: `measure_progress.dart`, `goal_progress.dart`, `goal_work.dart`
- `ui/`: goal page and body, goal form, measure form, and a measure row with inline controls.

`lib/features/objectives` and `lib/features/key_results` are removed. Measures are not a feature of their own because they only exist on the goal page.
*Alternative:* rename only the UI labels and keep the tables and classes. Rejected: the model really changes (no KR pages or deadlines, projects linked to goals), and two vocabularies would stay forever.

### 2. Schema v7 (drift)
**New tables:**
- `goals`: the `objectives` columns, keeping `color`.
- `measures`: `goal_id`, title, description, `measure_type`, start/target/current/unit, step, `habit_id`, `sort_order`. No deadline and no color.
- `review_measure_snapshots`: `weekly_review_id`, `measure_id`, progress.
- Indexes on `measures.goal_id` and `review_measure_snapshots.weekly_review_id`.

**Changed tables:**
- `projects`: `goal_id` replaces `key_result_id`, and `completed_at` is new. Index `projects_goal_id`.
- `tasks`: `goal_id` replaces `key_result_id` and `objective_id`. Index `tasks_goal_id`.
- `habits`: `goal_id` replaces `key_result_id`.
- `log_entries`: `goal_id` replaces `key_result_id`.

**Removed tables:** `objectives`, `key_results`, `review_kr_snapshots`.

### 3. Local migration `from6To7`
It runs in the migration transaction, in this order:
1. **Create the new tables** (and their indexes).
2. **Copy the data with plain SQL**, every row including soft-deleted ones and keeping `id`, `created_at`, `updated_at` and `deleted_at`:
   - `INSERT INTO goals … SELECT … FROM objectives`
   - `INSERT INTO measures (…, goal_id, …) SELECT …, objective_id, … FROM key_results`
   - snapshots from `review_kr_snapshots`.
3. **Rebuild the changed tables** with `alterTable(TableMigration(...))`. It recreates each table and copies rows through column transformers:
   - `projects.goal_id = (SELECT objective_id FROM key_results WHERE id = key_result_id)`
   - `projects.completed_at = CASE WHEN status = 'completed' THEN updated_at END`
   - `tasks.goal_id = COALESCE(objective_id, (SELECT objective_id FROM key_results WHERE id = key_result_id))`
   - habits and log entries like projects.
4. **Drop the old tables last**, because the transformers still read `key_results`.

`updated_at` is left unchanged everywhere: the server is migrated the same way, so nothing needs to be uploaded and nothing looks newer than it is.
*Alternative:* bump `updated_at` so devices re-upload the moved data. Rejected: it would make the server migration pointless, and moved rows could override edits made on another device.

### 4. Server migration in `supabase/schema.sql`
The script stays re-runnable:
- **Create** `goals`, `measures` and `review_measure_snapshots`, with RLS, grants and `sync_guard` like the other tables.
- **Add** the new columns with `add column if not exists`. The `create table` statements show the final columns, as `schema_sql_test` expects.
- **Move the data** in a `DO $$ … $$` block that only runs while `public.objectives` still exists. It:
  - inserts goals, measures and snapshots from the old tables (keeping `user_id`, `on conflict (id) do nothing`)
  - updates `goal_id` and `completed_at` on projects, tasks, habits and log entries **with their `sync_guard` triggers disabled**. Otherwise the guard drops these updates because `updated_at` doesn't change.
  - drops the old columns and tables.

New rows get a fresh `server_updated_at`, so devices pull them. They match the local rows by `updated_at`, so they're skipped. Updated rows keep their `server_updated_at` and aren't pulled again.
*Alternative:* let devices upload the moved data and drop the old tables. Rejected: project links would only arrive from whichever device synced first, and old devices would re-create objectives.

### 5. Progress and work as pure functions
- **`measureProgress`:** moved from `kr_progress.dart`, unchanged. Habit measures count check-ins since the goal's start date.
- **`goalProgress`:** the average of its measures' progress, or `null` without measures. `null` means "no percentage".
- **`goalWork(goal, projects, tasks, entries, range)`:** an entry counts when its `goal_id` is the goal, or its project serves the goal, or its task is assigned to the goal or to one of the goal's projects. Used on the goal page (this week and total) and in the week summary.
- **`allMeasuresReached`:** for the planet ring; requires at least one measure and every progress at 1.

### 6. Week summary
`week_summary.dart` replaces `KrProgressChange` with `GoalProgressChange`, which holds the goal, its progress, its change, and its measures with their changes.
- **Week with a completed review:** goals come from that review's measure snapshots, grouped by the measure's goal.
- **Other weeks:** active goals and their current progress.
- **The change:** compares against the most recent earlier completed review that has snapshots for the goal's measures. The goal's change is its progress minus the average of the earlier snapshots of the measures that existed then.
- **Finished projects:** projects whose `completed_at` falls in the week.
- **Work per project:** grouped by the project's current goal.

### 7. Solar system rendering
**Placement:** `lib/core/space/solar_system.dart` has a pure layout function (`solarLayout(size, planets, asteroids)`) and a widget drawn with one `CustomPainter`.
- **Sun:** `paintStar` in the middle.
- **Planets:** one flat ellipse orbit per goal (inner to outer in goal order); positions are spread by golden angle in goal order (not per ID, which could put two planets on top of each other), so they're stable across runs.
- **Moons:** around their planet, as in the experiment.
- **Asteroids:** on a belt ellipse beyond the outermost orbit. Each is a 7-point polygon with radii jittered from its project ID's seed.

**Interaction:** planet labels and tap targets are positioned widgets on top, as in the experiment's detailed view, and asteroids get 32 px tap targets.
- **Size:** full width, 240 px tall (280 px with more than four goals).
- **Updates:** no ticker; it repaints only when its inputs change.
- **Data:** a `solarSystemProvider` on Home combines the plan overview (active goals with progress and their active projects) with the active projects without an active goal.

*Alternative:* render with `Stack` widgets per body. Rejected: orbits and the drawing order behind/in front need one canvas anyway.

### 8. Goal page and Plan
- **Goal page:** `GoalPageBody` (scaffold-free for the detail pane) replaces the objective page and has these sections:
  - a header with a small `SolarSystem`-style planet with its moons, drawn with the same painter
  - measures as rows with inline controls (reusing the KR page's − / + / value / switch logic)
  - projects (active, then backlog/paused, then a "N completed" count)
  - tasks and habits
  - work.
- **Plan overview:** `GoalPlan { goal, progress, measures, projects, tasks }` replaces `ObjectivePlan` / `KeyResultPlan`. "Projects without a goal" replaces "Projects without a KR".

### 9. Routes and redirects
- **New route:** `/goals/:id`.
- **Objective links:** `redirectOldPath` maps `/objectives/:id` to `/goals/:id`.
- **KR links:** `/key-results/:id` (and the old KR form paths) can't be resolved without the database, so they map to a small `MeasureRedirectScreen`. It looks the measure up, opens its goal with `go`, or shows "Goal not found".
- **Reminders:** old KR reminders get no new schedule, because the next recompute replaces all pending notifications. A tapped old one goes through the same redirect.

### 10. Colors and theme
- **Colors:** `space_colors.dart` keeps the palette and `colorOfGoal`. KR shades and KR colors go away.
- **Theme:** dark only, so `lightTheme`, `OrbitPalette.light` and `OrbitColors.light` are removed and the theme tests are adjusted.

### 11. No new packages
Everything uses Flutter, drift, Riverpod and go_router, which are already in the project.

## Risks / Trade-offs

- **[Server migration runs after a device has already upgraded and synced]** → Until the server has the new tables, uploads fail (missing tables) and the push watermark doesn't move, so nothing is lost. The tasks run the SQL before installing the new build.
- **[An old app version keeps editing after the server is migrated]** → Its pushes fail on dropped tables and columns; its edits stay local. After updating, the local migration moves them and they upload because their `updated_at` is newer.
- **[`TableMigration` loses data through a wrong transformer]** → Migration tests insert v6 data with the generated schema classes and check every moved column, including soft-deleted rows. A backup is copied from the phone before installing (task).
- **[A KR deadline is lost]** → Accepted. Projects fall back to the goal's end date. The summary in tasks lists your affected KRs before migrating.
- **[Goal change in the review compares different measure sets]** → The comparison only uses measures that have an earlier snapshot. A goal whose measures were all added later shows no change.
- **[A crowded solar system with many goals or projects]** → At most six moons per planet and twelve asteroids. Labels are ellipsized at 120 px, and the height grows with more than four goals.

## Migration Plan

1. Back up the phone's database (copy `orbit.sqlite` via `adb run-as`) and export the Supabase tables (CSV from the dashboard).
2. Run the updated `supabase/schema.sql` in the SQL editor and check that the counts of goals, measures and links match the old tables.
3. Install the new build on the phone and open it. The local migration runs; then sync and check that nothing is re-uploaded or changed.
4. Update the web version.

**Rollback:** reinstall the v6 build together with the backed-up database, and restore the server tables from the export. A v7 database can't be opened by v6.
