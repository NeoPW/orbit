# Tasks

## 1. Schema v7 and data move

- [x] 1.1 In `tables.dart` add `Goals` (objective columns with `color`), `Measures` (no deadline, no color), `ReviewMeasureSnapshots` and their indexes; replace `key_result_id` / `objective_id` with `goal_id` on projects, tasks, habits and log entries; add `projects.completed_at`; remove `Objectives`, `KeyResults`, `ReviewKrSnapshots`; bump `schemaVersion` to 7, run `dart run drift_dev make-migrations` and write `from6To7` as in design §3; verify `drift_schema_v7.json` exists and the generated migration tests pass
- [x] 1.2 Add v6→v7 data tests with the generated v6 schema: objective → goal (color kept), KR → measure (values, step, habit kept; deadline and color gone), project/task/habit/log links moved (task with KR and task with objective), snapshot moved, `completed_at` from `updated_at`, soft-deleted rows stay soft-deleted, `updated_at` unchanged; update `app_database_test.dart` to version 7; verify all database tests pass
- [x] 1.3 Update `supabase/schema.sql` per design §4 (new tables with RLS, grants, `sync_guard`; new columns in `create table` and as `add column if not exists`; the guarded `DO` block moving data with the projects/tasks/habits/log_entries guards disabled, then dropping old columns and tables) and add a note to `README.md` that the script must run before the new version syncs; verify `schema_sql_test.dart` passes
- [x] 1.4 Add sync engine tests with the fake remote: a goal with color and a measure with step round-trip through push and pull, and a pulled goal with the same `updated_at` as the local row changes nothing; verify the sync tests pass

## 2. Goals and measures: domain and data

- [x] 2.1 Create `lib/features/goals/domain/`: `measure_progress.dart` (moved from `kr_progress.dart`, habit check-ins since the goal's start), `goal_progress.dart` (average or `null`, `allMeasuresReached`); verify unit tests for every scenario of "Numeric/Boolean/Habit measure progress" and "Goal progress"
- [x] 2.2 Add `goal_work.dart` (entries linked to the goal, its projects, or tasks of the goal or its projects; count and duration for a date range); verify unit tests for "Work through a project", "Work on an assigned task" and "Project linked later"
- [x] 2.3 Build `GoalRepository` (create with optional color after existing goals, update, status, delete with its measures while clearing `goal_id` on projects, tasks and habits, `countMeasures`, watch providers) and `MeasureRepository` (create after existing, update with type normalization, delete, `nudge`, `setValue`, `setAchieved`); verify repository tests with an in-memory database, including delete keeping linked projects and tasks
- [x] 2.4 Delete `lib/features/objectives` and `lib/features/key_results` and point projects, tasks, habits, log, timer and reminders at goals (`goalId`), with `colorOfGoal` in `space_colors.dart` (KR shades removed); verify `flutter analyze` passes and `grep -rn "KeyResult\|Objective\|keyResult\|objective" lib` finds only the migration and redirects

## 3. Projects, tasks, habits, log and timer on goals

- [x] 3.1 Projects: goal picker in the project form (active goals, plus the current one when it is no longer active), effective deadline from the goal's end date, `completed_at` set on completing and cleared on reopening; verify tests for "Create a project", "Edit a project", "Effective deadline from the goal" and "Completion date"
- [x] 3.2 Tasks: assignment to a project or goal in the task form, task page showing and opening the goal, completing and logging work linking the goal, deleting a goal leaving its tasks standalone; verify the task tests rewritten for goals, including "Assign to a goal", "Goal deleted", "Open the assigned goal" and "Log on a goal's task"
- [x] 3.3 Habits: link to a project and/or goal in the form and the Habits list, checking logs to the goal, deleting a habit leaving its measure without a habit; verify the habit tests including "Link to a goal", "Check a goal's habit" and "Delete habit linked to a measure"
- [x] 3.4 Timer and quick log: stopping a task timer links the task's project or goal; verify the work-timer test "Timer for a task" with a goal-assigned task

## 4. Goal page and forms

- [x] 4.1 Goal form in a sheet (title, description, dates, planet color with Auto, status when editing, delete with the measure count in the confirmation) and measure form in a sheet (type-dependent fields, step > 0, delete); verify widget tests for create, validation errors, color and Auto, the delete confirmation and the measure fields per type
- [x] 4.2 Build `/goals/:id` with `GoalScreen` and scaffold-free `GoalPageBody`: header (planet with moons, title, progress, dates, status chip, deadline badge), description, measures with inline controls (− / + by step, tap value to enter, done switch, habit read-only, title opens the edit sheet, "Add measure"), "not found"; verify widget tests for "Goal page", "Record progress on the goal page" and "Goal page updates live"
- [x] 4.3 Add the projects section (active first, backlog/paused with chip, "N completed", "Add project" preselecting the goal), tasks and habits, and the work section (this week, total, recent entries); verify widget tests for "Projects on the goal page", "Tasks and habits on the goal page" and "Work on a goal"

## 5. Plan

- [x] 5.1 Rewrite `plan_overview.dart` to `GoalPlan` (goal, progress, measures, active projects, open tasks) and "Projects without a goal" (no goal, or a non-active goal with its title); verify unit tests for the ordering and every scenario of "Goals section" and "Projects without a goal"
- [x] 5.2 Update the Overview tab (goal cards with planet, progress, measure rings in the goal color, projects, tasks, empty states), the create menu ("New goal"), `openPlanItem` with `PlanGoal` for page and detail pane, and the Archive (goals); verify widget tests for the Plan tab, the detail pane at 1400 px, "Measure in the goals list" and the Archive

## 6. Routes and redirects

- [x] 6.1 Map `/objectives/:id` to `/goals/:id` in `redirectOldPath`, and `/key-results/:id` and the old KR form paths to a `MeasureRedirectScreen` that opens the measure's goal or shows "Goal not found"; verify router tests for "Old objective link", "Old key result link", "Unknown key result", "Old form URL" and "KR in the detail pane"

## 7. Home

- [x] 7.1 Implement `solarLayout` as a pure function (orbits in goal order, golden-angle positions by goal order, at most six moons per planet, belt of at most twelve asteroids with seeded irregular shapes, ring flag); verify unit tests for order, caps, stable positions and the ring rule
- [x] 7.2 Build the `SolarSystem` widget (sun, orbits, planets with labels and tap targets, moons, asteroids with tap targets, no ticker), a provider combining active goals, their active projects and projects without an active goal, and put it below the today header instead of the star-system row; verify widget tests for every scenario of the solar-system spec
- [x] 7.3 Update Home: habits labeled by goal, upcoming deadlines with tasks only, project card showing its goal, Tasks section and new-task sheet with goals; verify the Home tests rewritten for goals, including "Habit labeled by goal", "Goal shown" and "Assign to a goal"
- [x] 7.4 Keep the shooting star; verify the existing tests for "Last habit checked", "Already done on opening" and "Reduced motion" pass

## 8. Review

- [x] 8.1 Rewrite the week summary domain: `GoalProgressChange` from measure snapshots or current progress, change against the latest earlier review with snapshots, work per goal, work per project grouped by goal, finished projects by `completed_at`; verify unit tests for every scenario of "Goals in the summary", "Goal progress of a week", "Finished projects" and "Work per project"
- [x] 8.2 Store measure snapshots for every measure of an active goal when saving a review (replacing them on re-save); verify review repository tests for "Save" and "Edit a completed review"
- [x] 8.3 Update the summary view (goals, work grouped by goal, finished projects and tasks, habits) and replace the KR step with the Goals step; verify widget tests for the step order, "Goals step" scenarios and the summary on the Review tab, last week page and a past review

## 9. Reminders

- [x] 9.1 Remove KR deadline reminders and recompute on goal and measure changes; verify the reminder tests rewritten without KRs, including "Inherited deadline" from a goal and "Former KR reminders"

## 10. Orbit identity cleanup

- [x] 10.1 Remove the light theme (`lightTheme`, `OrbitPalette.light`, `OrbitColors.light`), the per-objective `StarSystem`, `objective_system.dart` and `home_star_systems.dart`; verify the theme and widget tests for "Dark theme", "Dark mode surfaces" and "System in light mode" pass
- [x] 10.2 Check the experiment's space background, Space images screen, translucent surfaces, opaque sheets and sheet insets against the specs; verify the tests for "Space background", "Space images", "Translucent surfaces" and "Sheets clear of the system and tab bars" pass, adding any that are missing

## 12. Feedback

- [x] 12.1 Plan tab: collapse each goal card's measures to "N measures", expandable, with "Add measure" inside; verify widget tests for "Measures collapsed by default" and "Add a measure from the Plan tab"
- [x] 12.2 Planets with seeded surfaces (bands, craters, patches) and bigger cratered moons, far moons behind the planet (`lib/core/space/planets.dart`, `solar_system.dart`); verify by screenshot and the existing solar-system tests
- [x] 12.3 Slim `OrbitRing` (no end marker) and measure progress as a bar in the goal color (`orbit_ring.dart`, `measure_tile.dart`, `measure_row.dart`); verify by screenshot and the measure tests
- [x] 12.4 Upcoming deadlines include active projects and tasks outside projects (`upcoming_deadlines.dart`, section UI); verify unit tests for "Project not repeated" and "Overdue task outside projects"
- [x] 12.6 Move the full solar system to the top of the Plan Overview (taps use `openPlanItem`) and show a compact one on Home (full width, ~150 px high, sun at the left edge, planets in a row on their orbit arcs) (`lib/features/plan/ui/work_solar_system.dart`, `solar_system.dart`, `home_screen.dart`, `overview_tab.dart`); verify widget tests for "Shown", "Compact on Home" and "Nothing to show"
- [x] 12.5 Trim the test suite: remove duplicate and trivial tests (same behavior covered at another level, generated-code checks), keeping one test per spec scenario; verify `flutter test` passes and the count drops noticeably

## 11. Docs and verification

- [x] 11.1 Update `openspec/config.yaml` context (goals and measures instead of objectives and KRs, dark only, Space Grotesk) and `docs/SPEC.md` (asteroids for projects without an active goal); verify `openspec validate milestone-9-goals-orbit --strict` passes
- [x] 11.2 Run `flutter analyze` and `flutter test`; verify no warnings and all tests pass
- [x] 11.3 Back up the phone database (`adb exec-out run-as … cat`) and export the Supabase tables, list the KR deadlines that will be dropped, then run `supabase/schema.sql` in the SQL editor; verify the counts of goals, measures and goal links on the server equal the old objective, KR and link counts
- [x] 11.4 Install the new build with `--dart-define-from-file=supabase.json` on the phone, check the migrated data (goals, measures, links, solar system), sync, and check nothing changed on either side; then run it in Chrome against the migrated server; verify both by screenshots and a manual pass through Home, Plan, a goal page and the Review tab
