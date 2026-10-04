# Design

## Context

The repo contains the unmodified `flutter create` counter app (`lib/main.dart`, `test/widget_test.dart`), with Android (`dev.neopw.orbit`) and web targets, Flutter 3.47 / Dart SDK `^3.13.5`, `flutter_lints` only. `openspec/specs/` is empty, so every capability in this change is new. See `proposal.md` for motivation and `specs/` for the required behavior. Project conventions (feature-first folders, UI → providers → repositories → drift, pure domain logic, UTC timestamps, local calendar dates) are taken as given.

## Goals / Non-Goals

**Goals:**
- One database code path for Android and web, with the web assets reproducible from a script.
- A schema that milestones 2–5 can build on with additive migrations only. Sync (milestone 5) must not need to rewrite IDs, timestamps or enum values.
- Repositories that are testable against an in-memory database, with deterministic time and IDs in tests.
- Plan-tab grouping and sorting computed by pure functions, so the rules from the specs are unit tested.

**Non-Goals:**
- No dirty-tracking or sync metadata beyond the shared columns (milestone 5 decides how to mark dirty rows).
- No repositories for HabitCheck, LogEntry or WeeklyReview yet; their tables exist only.
- No local Settings table yet (SPEC §4). It is local-only and gets added by an additive migration when the first setting is needed.
- No localization; UI strings are English. Dates use a fixed `dd-mm-yyyy` display format (§8), not the locale's.

## Decisions

### 1. Packages

Versions are the latest compatible at implementation time (`flutter pub add`). At the time of writing: drift / drift_dev 2.35, drift_flutter 0.3, flutter_riverpod 3.x, riverpod_annotation / riverpod_generator 4.x, go_router 18, uuid 4.

| Package | Kind | Justification |
|---|---|---|
| `drift` | runtime | Typed SQLite access with reactive queries and migrations. Required by the project stack. |
| `drift_flutter` | runtime | Opens the drift database on Android (native SQLite) and on web (sqlite3 WASM + worker) from one call. |
| `flutter_riverpod` | runtime | State management and dependency injection; providers can be overridden in tests. |
| `riverpod_annotation` | runtime | Annotations for generated providers. |
| `go_router` | runtime | URL-based routing with a stateful shell for the three tabs, so web reload keeps the tab. |
| `uuid` | runtime | Client-side UUID v4 generation for record IDs. |
| `build_runner` | dev | Runs code generation. |
| `drift_dev` | dev | Generates drift table and query code; also creates schema snapshots for migration tests. |
| `riverpod_generator` | dev | Generates providers from `@riverpod` functions and classes. |

Not added: `intl` (the only date format is a fixed `dd-mm-yyyy`, a few lines of Dart), `flutter_localizations` (a European locale would give `dd/mm/yyyy`, not the wanted dashes), `freezed` (drift data classes are enough), `riverpod_lint`/`custom_lint` (extra analyzer plugin, not needed), a color picker (fixed palette).

### 2. Folder structure

```
lib/
  main.dart                      ProviderScope + OrbitApp
  app.dart                       MaterialApp.router, themes
  core/
    db/                          AppDatabase, tables, converters, connection, seed
    router/                      go_router config, app shell (nav bar / rail)
    theme/                       light + dark ColorScheme.fromSeed
    time/                        CalendarDate, Clock provider
    widgets/                     confirm dialog, max-width body, empty state, area color dot
  features/
    areas/        data/ ui/
    objectives/   data/ ui/
    key_results/  data/ domain/ ui/      domain: kr progress, effective KR deadline
    projects/     data/ domain/ ui/      domain: effective project deadline
    tasks/        data/                  next-step support only
    habits/       data/ domain/ ui/      domain: schedule validation + summary
    plan/         domain/ ui/            domain: buildPlanOverview (grouping/sorting)
    home/         ui/                    placeholder
    review/       ui/                    placeholder
```
Tests mirror this under `test/`.

### 3. Database connection on Android and web

`lib/core/db/connection.dart` calls `driftDatabase(name: 'orbit', web: DriftWebOptions(sqlite3Wasm: Uri.parse('sqlite3.wasm'), driftWorker: Uri.parse('drift_worker.js'), onResult: ...))`. `drift_flutter` picks native SQLite on Android and the best available WASM storage on web (OPFS, IndexedDB, or in-memory as a last resort). `onResult` reports the chosen storage. If it is in-memory, a `storageWarningProvider` is set and the shell shows a persistent `MaterialBanner` (spec: local-database, "Warning when browser storage is unavailable").

No COOP/COEP headers are required: without cross-origin isolation drift falls back to IndexedDB-backed storage, which persists across reloads. This keeps `flutter run -d chrome` working with no extra flags.

**Web assets.** `web/sqlite3.wasm` and `web/drift_worker.js` are committed to the repo so a fresh checkout runs in Chrome without extra steps. They must match the `sqlite3` and `drift` versions in `pubspec.lock`. A script `tool/fetch_web_assets.sh` reads both versions from `pubspec.lock` and downloads:
- `sqlite3.wasm` from the GitHub release `sqlite3-<sqlite3 version>` of `simolus3/sqlite3.dart`
- `drift_worker.js` from the GitHub release `drift-<drift version>` of `simolus3/drift`

**Updating:** after any upgrade that changes `drift` or `sqlite3` in `pubspec.lock`, run `tool/fetch_web_assets.sh` and commit the two files. This is documented in `README.md`.

*Alternative considered:* compile the worker ourselves with `dart compile js`. Rejected: more moving parts, and drift publishes a matching prebuilt worker for each release.

### 4. Schema (version 1)

All tables are new; no migration from earlier data. Column names are snake_case in SQL (drift default) and match SPEC §4 so the Supabase schema can mirror them later.

**Shared columns (every table):** `id TEXT PRIMARY KEY` (UUID v4), `created_at`, `updated_at` (timestamps, UTC), `deleted_at` (nullable timestamp). These are declared once in a drift mixin `SyncColumns`.

| Table | Columns (besides shared) | Constraints / indexes |
|---|---|---|
| `areas` | `name` text, `color` text (`#RRGGBB`), `sort_order` int | |
| `objectives` | `title`, `description` (text, default ''), `start_date`, `end_date` (date), `status` (enum text), `sort_order` int | index `status` |
| `key_results` | `objective_id` text, `title`, `description`, `measure_type` (enum text), `start_value`, `target_value`, `current_value` (real, nullable), `unit` (text, nullable), `habit_id` (text, nullable), `deadline` (date, nullable), `sort_order` int | index `objective_id` |
| `projects` | `title`, `description`, `area_id` (nullable), `key_result_id` (nullable), `status` (enum text), `importance` int (CHECK 1–5), `deadline` (date, nullable), `next_step_task_id` (nullable) | index `status`, `key_result_id`, `area_id` |
| `tasks` | `project_id` (nullable), `title`, `notes`, `due_date` (date, nullable), `status` (enum text), `completed_at` (timestamp, nullable) | index `project_id` |
| `habits` | `title`, `project_id` (nullable), `key_result_id` (nullable), `schedule_type` (enum text), `weekdays` (text, nullable), `times_per_week` (int, nullable), `reminder_time` (text `HH:mm`, nullable), `active` bool | |
| `habit_checks` | `habit_id`, `date` (date), `log_entry_id` (nullable) | UNIQUE(`habit_id`, `date`) |
| `log_entries` | `project_id`, `key_result_id` (both nullable), `occurred_at` (timestamp), `duration_minutes` (int, nullable), `note` text, `source` (enum text) | index `occurred_at` |
| `weekly_reviews` | `week_start` (date), `score` int (nullable, CHECK 1–10), `reflection`, `plan_next_week` (text), `completed_at` (timestamp, nullable) | UNIQUE(`week_start`) |

Value encoding:
- **Timestamps** use drift `dateTime()` with `store_date_time_values_as_text: true` in `build.yaml`, so they are stored as ISO-8601 strings with a UTC offset. They are always written as UTC.
- **Calendar dates** are a small immutable `CalendarDate` value class (`year`, `month`, `day`, comparison, `today(clock)`), stored as `TEXT 'YYYY-MM-DD'` through a `TypeConverter`. This keeps dates separate from timestamps and avoids time-zone shifts (spec: "Calendar dates are time-zone independent").
- **Enums** are Dart enhanced enums with an explicit `dbValue` (`active`, `times_per_week`, …), stored through one generic text converter. Values match SPEC §4. Using drift's `textEnum` would store Dart names such as `timesPerWeek`.
- **Weekdays** are stored as comma-separated ISO weekday numbers (`"1,3,5"`, Monday = 1) and converted to a `Set<int>`.
- **KR measure fields:** `numeric` uses start/target/current/unit. `boolean` stores achieved as `current_value` 1/0, with start = 0 and target = 1. `habit` uses `target_value` (check-ins) and `habit_id`.
- Nullable `score` on weekly reviews allows a draft review before scoring (milestone 4). SPEC requires 1–10 once set.

**No SQL foreign-key constraints.** Reference columns are plain indexed text. Reasons: rows are never hard-deleted, and sync (milestone 5) will apply pulled rows in arbitrary order, which enforced FKs would reject. Referential behavior on delete (unlinking, cascading soft deletes) is done explicitly in repositories, inside transactions.

**Unique constraints and soft delete:** `habit_checks(habit_id, date)` and `weekly_reviews(week_start)` are unique across soft-deleted rows too. Milestone 2/4 must therefore revive a soft-deleted row (clear `deleted_at`) instead of inserting a new one. This is noted here so those milestones don't have to rediscover it.

**Migrations.** `schemaVersion = 1`. `MigrationStrategy.onCreate` runs `createAll()` and then seeds the default areas: Job, Personal, Sport, Uni with sort order 0–3 and distinct palette colors. Because seeding happens only in `onCreate`, it never runs again (spec scenario "Deleted default area stays deleted"). `onUpgrade` uses drift's step-by-step migration helper (`stepByStep`) once version 2 exists. `drift_dev schema dump` exports `drift_schemas/drift_schema_v1.json` now, so future migrations can be tested against the v1 snapshot.

### 5. Repositories

One class per entity in `features/<x>/data/`: `AreaRepository`, `ObjectiveRepository`, `KeyResultRepository`, `ProjectRepository`, `TaskRepository`, `HabitRepository`. Each takes `AppDatabase`, a `Clock` (`DateTime Function()` returning UTC) and an `IdGenerator`, all provided by Riverpod and overridden in tests. This makes timestamps and IDs deterministic in tests.

- **Entity types:** repositories return drift's generated data classes (`Area`, `Objective`, `KeyResult`, …). Writes go through explicit repository methods (for example `create({required String title, …})` and `update(Project)`), so widgets never see drift companions or queries. *Alternative:* separate domain models with mapping. Rejected for now: double the types for no current benefit.
- **Shared helpers:** inserts set `id`, `created_at = updated_at = clock()`. Every update sets `updated_at`. `softDelete` sets `deleted_at` and `updated_at`. Every query filters `deleted_at IS NULL`.
- **Cross-entity effects** (each in one transaction, and every touched row gets a new `updated_at`):
  - `ObjectiveRepository.delete`: soft-delete the objective and its KRs; set `key_result_id = null` on projects and habits that pointed to those KRs.
  - `KeyResultRepository.delete`: soft-delete the KR; unlink projects and habits.
  - `ProjectRepository.delete`: soft-delete the project and its tasks; unlink habits (`project_id = null`).
  - `HabitRepository.delete`: soft-delete the habit; set `habit_id = null` on KRs.
  - `AreaRepository.delete`: soft-delete the area; set `area_id = null` on projects.
  - `ProjectRepository.save(project, nextStepText)`: create a task and link it, update its title, or unlink, as the projects spec describes.
- **Queries for the Plan tab** (all `watch…` streams): areas ordered by `sort_order`; objectives by status set; KRs of a set of objective IDs; projects by status set; habits; `countKeyResults(objectiveId)` for the delete confirmation; `isAreaNameTaken(name, excludeId)`.
- `sort_order` on create is `max(sort_order) + 1` within the scope (all areas, all objectives, or KRs of one objective).

### 6. Providers

Riverpod with code generation (`@riverpod`). `appDatabaseProvider` is keep-alive and closes the database on dispose; tests override it with `AppDatabase(NativeDatabase.memory())`. Repository providers are keep-alive. UI reads `StreamProvider`s such as `activeObjectivesProvider`, `backlogProjectsProvider(areaFilter)` and `archiveProvider`.

The Plan overview is one provider that combines four streams (active objectives, their KRs, active projects, areas) and passes them to the pure function `buildPlanOverview(...)` in `features/plan/domain/`. This function groups projects under KRs, sends active projects whose KR is missing or belongs to a non-active objective to the "without KR" section, computes effective deadlines and applies the ordering rule. It has unit tests for every ordering and grouping scenario in the plan-overview spec. Drift re-emits these streams after every write to the watched tables, so the "live updates" requirement needs no manual refresh.

### 7. Domain functions (pure Dart, unit tested)

- `effectiveKrDeadline(CalendarDate? krDeadline, CalendarDate objectiveEnd)` → `CalendarDate`
- `effectiveProjectDeadline(CalendarDate? projectDeadline, CalendarDate? krEffectiveDeadline)` → `EffectiveDeadline?` (date plus `inherited` flag)
- `krProgress(measureType, start, target, current)` → `double?` (null for `habit`). Implements the clamping and target-equals-start rules from the key-results spec, comparing with a small epsilon to avoid floating-point surprises.
- `validateHabitSchedule(...)` / `scheduleSummary(...)`: weekday and times-per-week rules and the "Mon, Wed, Fri" text.
- `compareProjectsForPlan(...)`: importance desc, effective deadline asc (none last), then title (case-insensitive).

### 8. Navigation and UI

- **Router:** `StatefulShellRoute.indexedStack` with branches in destination order `/plan`, `/home`, `/review` (each tab keeps its state). `/` and unknown paths still redirect to `/home`, so the app starts on Home even though Plan is the first destination. Plan sub-routes: `/plan/archive`, `/plan/habits`, `/plan/areas`, `/plan/objectives/new`, `/plan/objectives/:id`, `/plan/objectives/:id/key-results/new`, `/plan/key-results/:id`, `/plan/projects/new`, `/plan/projects/:id`, `/plan/habits/new`, `/plan/habits/:id`. Forms are full pages on every width. They are simple and keep URLs reloadable on web.
- **Shell:** a `LayoutBuilder` uses a `NavigationBar` when the width is under 600 and a `NavigationRail` otherwise (Material 3 compact-width breakpoint). Both are driven by `StatefulNavigationShell.currentIndex`, so resizing keeps the tab.
- **Plan screen:** an app bar with an overflow menu (Archive, Habits, Areas) and a `TabBar` with **Overview** (objectives section, then "Projects without a KR") and **Backlog** (area filter chips: All, each area, No area; each entry has an "Activate" action). A FAB opens a menu: New objective / New project / New habit. "Add key result" sits inside each objective card. Body content is wrapped in a `ConstrainedBox(maxWidth: 840)` and centered.
- **Project entries** show title, area (color dot and name), importance, and the effective deadline with an "inherited" hint. The brief also lists *status*, but with the chosen visibility rule (only active projects in Overview) status would always read "active". Status is therefore shown only in Backlog (backlog/paused) and Archive.
- **Delete:** forms have a delete action in the app bar that opens a shared `confirmDelete(context, message)` dialog. The objective dialog includes the KR count.
- **Habit links are optional:** a habit may have a project, a KR, both or neither. SPEC §3/§4 describe habits as belonging to a project or KR, but unlinked habits fit general habits (e.g. "Meditate"), and deletes already leave habits without a link. Unlinked habits show "No link"; milestone 2 (Home grouping) and milestone 4 (per-project review stats) need an "Other"/"Unassigned" bucket for them.
- **Date display:** one pure function `formatDate(CalendarDate)` in `lib/core/time/` returns `dd-mm-yyyy` with leading zeros, and `formatDateRange` joins two dates with ` – `. All widgets use these instead of `MaterialLocalizations` date formatting. Storage stays ISO `YYYY-MM-DD` (§4) because it sorts correctly as text and matches Postgres `date` for sync. Date fields are read-only text fields showing `formatDate(...)` that open `showDatePicker` with `initialEntryMode: DatePickerEntryMode.calendarOnly`. This avoids the picker's typed-input mode, which follows the locale (`mm/dd/yyyy` in US English). A clear button resets optional dates.
- **Theme:** `ColorScheme.fromSeed` with one seed color for light and dark, and `ThemeMode.system`.
- **Area palette:** about ten fixed Material colors, chosen with selectable color swatches in the area dialog. Areas are created and edited in a dialog from the Areas screen.

### 9. Testing approach

- Unit tests: `CalendarDate`, converters, all domain functions from §7, `buildPlanOverview`.
- Repository tests: in-memory `NativeDatabase.memory()` with a fixed clock and sequential IDs. They cover create/update/soft-delete timestamps, the soft-delete filter, each cross-entity effect, next-step handling, area-name uniqueness, unique constraints on `habit_checks` and `weekly_reviews`, and seeding (fresh DB has 4 areas).
- Widget tests (in-memory DB through a provider override): the shell shows a `NavigationBar` at 400 px width and a `NavigationRail` at 1200 px; Plan tab shows objective → KR → project; activating a backlog project moves it to Overview.
- Manual verification on an Android device and in Chrome, including restart/reload persistence.

## Risks / Trade-offs

- [Web assets drift out of sync with `pubspec.lock` after an upgrade, so the worker fails to load] → The fetch script derives versions from the lockfile; README documents the step; the in-memory fallback warning makes a failure visible instead of silently losing data.
- [IndexedDB fallback is slower than OPFS] → Acceptable for single-user data volumes; COOP/COEP headers can be added at deploy time later to enable OPFS.
- [No enforced foreign keys allow dangling references, e.g. a project pointing to a deleted KR] → All deletes go through repositories that unlink references in a transaction; queries treat a reference to a missing or soft-deleted row as unset.
- [Unique constraints include soft-deleted rows] → Documented in §4; later milestones revive soft-deleted rows instead of inserting.
- [Exposing drift data classes to the UI couples UI to the table shape] → Acceptable for a single-developer app; a mapping layer can be added per feature later without changing specs.
- [Riverpod / go_router major versions move fast] → Pin to the versions resolved at implementation time in `pubspec.lock`; no API from pre-release channels.
- [A project linked to a KR of a completed objective could otherwise disappear from the Plan tab] → Covered explicitly by the plan-overview spec ("Projects without a KR" also lists these).

## Migration Plan

Greenfield: the counter template is replaced; there is no user data to migrate. The schema starts at version 1 with a v1 schema snapshot exported for future migration tests. Rollback is reverting the commits; the on-device database can be cleared by uninstalling the app or clearing site data.

## Open Questions

- Exact palette colors and the seed color for the theme. These can be chosen during implementation without affecting specs or tasks.
