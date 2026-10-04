# Tasks

## 1. Project setup and dependencies

- [x] 1.1 Add runtime packages (`drift`, `drift_flutter`, `flutter_riverpod`, `riverpod_annotation`, `go_router`, `uuid`) and dev packages (`build_runner`, `drift_dev`, `riverpod_generator`) with `flutter pub add`; verify `flutter pub get` succeeds
- [x] 1.2 Add `build.yaml` with drift options (`store_date_time_values_as_text: true`, schema dump location `drift_schemas/`); verify `dart run build_runner build --delete-conflicting-outputs` runs without errors
- [x] 1.3 Exclude generated files (`*.g.dart`) from analysis noise if needed and set the pubspec description to the app's purpose; verify `flutter analyze` passes
- [x] 1.4 Create the folder skeleton from design §2 (`lib/core/{db,router,theme,time,widgets}`, `lib/features/<feature>/{data,domain,ui}`); verify the directories exist

## 2. Web database assets

- [x] 2.1 Write `tool/fetch_web_assets.sh` that reads the `drift` and `sqlite3` versions from `pubspec.lock` and downloads `web/sqlite3.wasm` and `web/drift_worker.js` from the matching GitHub releases; verify running it produces both files and is idempotent
- [x] 2.2 Run the script and commit the two assets; verify both files exist in `web/` and the script prints the versions it used
- [x] 2.3 Document the web assets (purpose, how to update after a drift/sqlite3 upgrade) and the build_runner command in `README.md`; verify the documented command matches the script name

## 3. Core value types and time

- [x] 3.1 Implement `CalendarDate` (year/month/day, equality, comparison, `toIso`/`parse`, `today(clock)`, `addDays`) in `lib/core/time/`; verify unit tests cover parsing, comparison, month/year boundaries and leap day
- [x] 3.2 Add a `clockProvider` (UTC `DateTime Function()`) and `idGeneratorProvider` (UUID v4); verify a unit test that generated IDs are valid v4 UUIDs
- [x] 3.3 Define enhanced enums with `dbValue` (ObjectiveStatus, ProjectStatus, TaskStatus, MeasureType, ScheduleType, LogSource) and a generic text converter; verify unit tests round-trip every value and that `times_per_week` is stored for `ScheduleType.timesPerWeek`
- [x] 3.4 Implement the `CalendarDate` ↔ `TEXT` converter and the weekdays ↔ `"1,3,5"` converter; verify round-trip unit tests including the empty set
- [x] 3.5 Implement `formatDate` (`dd-mm-yyyy`, leading zeros) and `formatDateRange` (`dd-mm-yyyy – dd-mm-yyyy`) in `lib/core/time/`; verify unit tests for `31-12-2026`, `05-03-2026` and a range

## 4. Database schema

- [x] 4.1 Create the `SyncColumns` mixin (`id`, `created_at`, `updated_at`, `deleted_at`) and the nine tables with columns, CHECK constraints and indexes from design §4; verify code generation succeeds
- [x] 4.2 Create `AppDatabase` with `schemaVersion = 1`, `MigrationStrategy.onCreate` (create all and seed Job, Personal, Sport, Uni with sort order 0–3 and colors); verify a test on `NativeDatabase.memory()` finds the four areas in order and all nine tables
- [x] 4.3 Add tests for the unique constraints; verify a duplicate (`habit_id`, `date`) habit check and a duplicate `week_start` weekly review are both rejected
- [x] 4.4 Add a test that reopening an existing database file does not seed again (delete Uni, reopen, still three areas); verify it passes
- [x] 4.5 Export the v1 schema snapshot with `dart run drift_dev make-migrations` (configured in `build.yaml`); verify `drift_schemas/orbit/drift_schema_v1.json` exists
- [x] 4.6 Implement the connection in `lib/core/db/connection.dart` with `driftDatabase(...)` and `DriftWebOptions`, report in-memory web storage via `storageWarningProvider`, and expose `appDatabaseProvider` (keep-alive, closes on dispose); verify `flutter analyze` passes and no `dart:io` import exists outside `lib/core/`

## 5. Domain logic

- [x] 5.1 Implement `effectiveKrDeadline` and `effectiveProjectDeadline` (with `inherited` flag); verify unit tests for own deadline, KR deadline inherited, objective end date inherited, and no deadline anywhere
- [x] 5.2 Implement `krProgress` for numeric/boolean (null for habit); verify unit tests for halfway, decreasing target, beyond target, below start, target equals start (reached and not reached), boolean true/false, habit → null
- [x] 5.3 Implement `validateHabitSchedule` and `scheduleSummary`; verify unit tests for empty weekdays, times per week 0/1/7/8, and the "Mon, Wed, Fri" summary in Monday-first order
- [x] 5.4 Implement `compareProjectsForPlan` and `buildPlanOverview` (grouping under KRs, "without KR" section including KRs of non-active objectives, ordering); verify unit tests for every scenario in the plan-overview spec's Objectives section, Project entries and Projects without a KR requirements

## 6. Repositories

- [x] 6.1 Implement shared repository helpers (insert with id/timestamps, update bumps `updated_at`, soft delete, `deleted_at IS NULL` filter) and test utilities (in-memory DB, fixed clock, sequential IDs); verify a test that create sets equal UTC timestamps and update bumps only `updated_at`
- [x] 6.2 Implement `AreaRepository` (create with `sort_order` append, update, delete unlinking projects, `watchAll`, `isNameTaken` case-insensitive); verify repository tests for each including the unlink on delete
- [x] 6.3 Implement `ObjectiveRepository` (create, update, `watchByStatus`, `countKeyResults`, delete cascading to KRs and unlinking projects/habits); verify repository tests including the cascade and that soft-deleted objectives are not emitted
- [x] 6.4 Implement `KeyResultRepository` (create with per-objective `sort_order`, update, `watchForObjectives`, delete unlinking projects/habits); verify repository tests
- [x] 6.5 Implement `TaskRepository` (create, update title, soft delete by project) for next-step support; verify repository tests
- [x] 6.6 Implement `ProjectRepository` (create, update, `watchByStatus`, backlog query with area filter incl. "no area", archive query, `save` with next-step create/rename/unlink, delete cascading to tasks and unlinking habits); verify repository tests for all three next-step cases and the backlog filter
- [x] 6.7 Implement `HabitRepository` (create, update, `watchAll`, delete unlinking KRs); verify repository tests
- [x] 6.8 Expose all repositories and the Plan stream providers (`planOverviewProvider`, `backlogProjectsProvider(filter)`, `archiveProvider`, `areasProvider`, `habitsProvider`) with `@riverpod`; verify a provider test with an overridden in-memory DB: `planOverviewProvider` emits again after a project's status changes

## 7. App shell, theme and navigation

- [x] 7.1 Replace the counter app: `main.dart` with `ProviderScope`, `app.dart` with `MaterialApp.router`, light and dark Material 3 themes and `ThemeMode.system`; verify the app builds and `test/widget_test.dart` is replaced
- [x] 7.2 Configure go_router with `StatefulShellRoute.indexedStack` (branches `/plan`, `/home`, `/review`, redirect `/` and unknown paths to `/home`) and the Plan sub-routes from design §8; verify a widget test that an unknown path shows Home
- [x] 7.3 Build the responsive shell (`NavigationBar` under 600 px, `NavigationRail` otherwise, destinations in order Plan, Home, Review) with the storage warning banner; verify widget tests at 400 px and 1200 px widths, the destination order, and that resizing keeps the selected tab
- [x] 7.4 Add Home and Review placeholder screens; verify a widget test that each shows the "later milestone" text
- [x] 7.5 Add shared widgets: `confirmDelete` dialog, max-width body (840 px, centered), empty-state widget, area color dot, and a date field (read-only, shows `formatDate`, opens a calendar-only date picker, optional clear button); verify widget tests that cancel returns false and confirm returns true, and that picking 15-11-2026 in the date field shows `15-11-2026`

## 8. Areas UI

- [x] 8.1 Build the Areas screen (list in sort order with colors) and the create/edit dialog with palette swatches and name validation (required, trimmed, unique); verify widget tests for empty name and duplicate name errors
- [x] 8.2 Add delete with confirmation; verify a widget test that confirming removes the area and cancelling keeps it

## 9. Objectives and key results UI

- [x] 9.1 Build the objective form (title, description, start/end date pickers, status) with validation and delete confirmation that names the KR count; verify widget tests for missing title, end before start, and the confirmation text with 3 KRs
- [x] 9.2 Build the KR form with measure-type-dependent fields (numeric: start/target/current/unit; boolean: achieved switch; habit: habit picker + target check-ins), optional deadline, and delete confirmation; verify widget tests that switching measure type shows the right fields and a numeric KR without target is not saved
- [x] 9.3 Build the KR tile: progress bar and value text for numeric/boolean, "Progress available from milestone 2" note for habit KRs; verify a widget test for each measure type

## 10. Projects UI

- [x] 10.1 Build the project form (title, description, area, KR picker limited to KRs of active objectives while keeping an existing link, importance 1–5 default 3, deadline, status default active, next step text) with delete confirmation; verify widget tests for missing title and default values
- [x] 10.2 Show the effective deadline with an "inherited" hint in the form; verify a widget test for a project without its own deadline linked to a KR
- [x] 10.3 Build the project tile (title, area dot and name, importance, effective deadline or "No deadline"); verify a widget test of its content

## 11. Habits UI

- [x] 11.1 Build the Habits screen (title, links or "No link", schedule summary, reminder time, inactive marker); verify widget tests that an inactive habit is marked and an unlinked habit shows "No link"
- [x] 11.2 Build the habit form (title, optional project and/or KR picker, schedule type with weekday chips Monday-first or times-per-week field, optional reminder time picker, active switch) with validation and delete confirmation; verify widget tests that a habit without any link saves successfully, and that no weekday and 8 times per week are rejected

## 12. Plan tab

- [x] 12.1 Build the Plan screen scaffold: app bar overflow menu (Archive, Habits, Areas), `TabBar` with Overview and Backlog, FAB menu (New objective, New project, New habit); verify a widget test that each menu entry navigates to its route
- [x] 12.2 Build the Overview tab: objective cards (title, date range, KRs with progress, active projects under each KR, "Add key result" action, hint when no KRs), "Projects without a KR" section, empty state with "Create objective"; tapping an objective, KR or project opens its edit form; verify a widget test with seeded data showing objective → KR → project
- [x] 12.3 Build the Backlog tab: backlog and paused projects with status chip, area filter chips (All, each area, No area), "Activate" action; verify a widget test that activating moves the project to Overview without reload, and that the "Uni" filter shows only Uni projects
- [x] 12.4 Build the Archive screen (completed/archived objectives and completed projects, newest update first, tap opens edit form); verify a widget test that restoring a project to active removes it from the Archive

## 13. Integration and verification

- [x] 13.1 Run `dart run build_runner build --delete-conflicting-outputs`, `flutter analyze` and `flutter test`; verify analyze reports no issues and all tests pass
- [ ] 13.2 Verify on an Android phone with `flutter run`: create, edit and delete an area, objective, KR (each measure type), project and habit; move a project between active, backlog and paused; restart the app and confirm all data is still there
- [ ] 13.3 Verify in Chrome with `flutter run -d chrome`: repeat the 13.2 flow, reload the page and confirm data persists and the current tab is kept; check no storage warning banner is shown and the browser console has no worker/WASM errors
- [ ] 13.4 Verify that every date shown on Android and in Chrome (objective ranges, deadlines, effective deadlines, date fields) uses `dd-mm-yyyy`, with the browser set to US English
- [x] 13.5 Verify layout in Chrome at phone width (bottom navigation, forms usable) and at desktop width (navigation rail, content limited to a readable width)
- [x] 13.6 Note in the change that `docs/SPEC.md` needs updating: §6 for the navigation order (Plan, Home, Review) and the Plan visibility rule (only active projects in Overview), and §3/§4 for habits whose project/KR link is optional; verify the note is present for the archive step
