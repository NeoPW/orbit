# Proposal

## Why

The repository is still the default Flutter counter app. Before any of the Home or Review features can be built, the app needs its technical foundation: a local database that works on Android and in the browser, the data model for every entity, and a navigation shell. Milestone 1 (`docs/SPEC.md` §9, brief in `docs/milestone-1-foundation.md`) adds this foundation together with the **Plan** tab, so the app is already usable on the phone as a structured planning tool for objectives, key results, projects, areas and habits.

## What Changes

- Replace the counter template with a feature-first app structure (`lib/core/`, `lib/features/<feature>/{data,domain,ui}`) using Riverpod, drift (`drift_flutter`), go_router and uuid, with build_runner code generation.
- One database setup that uses native SQLite on Android and sqlite3 WASM with browser storage on web; ship `sqlite3.wasm` and the drift worker in `web/`.
- Material 3 theme with light and dark mode following the system setting.
- Responsive app shell with **Home**, **Plan** and **Review** destinations: bottom navigation on narrow screens, navigation rail on wide screens. Home and Review are placeholders.
- Drift schema version 1 with tables for **all** entities in SPEC §4 (Area, Objective, KeyResult, Project, Task, Habit, HabitCheck, LogEntry, WeeklyReview), each with `id` (UUID v4), `created_at`, `updated_at`, `deleted_at`; enums stored as text; soft deletes; migration setup in place. Default areas (Job, Personal, Sport, Uni) seeded on first launch.
- Repositories with create / update / soft delete, reactive watch streams and Plan-tab queries for Area, Objective, KeyResult, Project, Task (next steps only) and Habit, exposed as Riverpod providers.
- Pure domain functions with unit tests for the **effective deadline** and for **KR progress** of `numeric` and `boolean` KRs (SPEC §5). `habit` KRs show a "progress available from milestone 2" note.
- Plan tab (SPEC §6.3): active objectives with their KRs (progress bars) and the active projects linked to each KR; active projects without a KR in their own section; a Backlog of `backlog`/`paused` projects filterable by area, with an activate action; a read-only Archive of completed/archived objectives and completed projects.
- Create/edit forms for objectives, key results (fields depend on measure type), projects (area, KR, importance 1–5, deadline, status, next step), habits (optional project/KR link, schedule, reminder time, active flag) and areas (name, color). Setting a project's next step creates a Task and links it via `next_step_task_id`.
- Delete actions are soft deletes with a confirmation dialog. Deleting an objective also deletes its KRs; projects and habits linked to a deleted KR remain, without the KR link.

## Capabilities

### New Capabilities
- `app-shell`: App startup, Material 3 light/dark theme, and the responsive Home / Plan / Review navigation shell.
- `local-database`: Local persistence on Android and web, the complete schema with sync columns, soft deletes, timestamps, schema versioning and default-area seeding.
- `areas`: Managing the user-defined list of areas (name, color) that projects belong to.
- `objectives`: Creating, editing, completing/archiving and deleting time-boxed objectives.
- `key-results`: Key results of an objective, their measure types, effective deadline and progress calculation.
- `projects`: Projects with area, KR link, importance, deadline, status transitions, effective deadline and next step.
- `habits`: Habit definitions (optional project/KR link, schedule, reminder time, active flag). Checking habits is not part of this change.
- `plan-overview`: The Plan tab's structure: objectives → KRs → projects, projects without a KR, backlog with area filter, and archive.

### Modified Capabilities
<!-- None: no specs exist yet. -->

## Impact

- **Code:** `lib/main.dart` and `test/widget_test.dart` (counter template) are replaced. New code under `lib/core/` (database, router, theme, shared widgets) and `lib/features/` (areas, objectives, key_results, projects, tasks, habits, plan, home, review).
- **Dependencies:** new runtime packages (riverpod, drift, drift_flutter, go_router, uuid and related) and dev packages (build_runner, drift_dev, riverpod_generator). Each is justified in `design.md`.
- **Platforms:** `web/` gains `sqlite3.wasm` and `drift_worker.js`; Android needs no native changes beyond what `drift_flutter` brings.
- **Data:** first schema (version 1). Later milestones add columns or tables through drift migrations without rewriting existing data.

## Out of scope

Deferred to later milestones (see `docs/milestone-1-foundation.md` and SPEC §9):
- Home screen content: habits due today, upcoming deadlines, project score sorting, quick log (milestone 2).
- Project detail with task list and log history; task management beyond the next step (milestone 2).
- Habit checking, HabitCheck/LogEntry writes, and habit-based KR progress (milestone 2). The tables exist but have no repositories or UI yet.
- Notifications (milestone 3).
- Weekly review, review history and stats (milestone 4). The WeeklyReview table exists but is unused.
- Settings screen (habit reminder default, review day, lead time).
- Supabase sync and authentication (milestone 5); sharing data between phone and web.
- Native desktop builds (milestone 6, optional).
- Manual reordering of objectives, KRs or areas (`sort_order` is assigned on create only).
