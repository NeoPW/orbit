# Milestone 1: Foundation

Input brief for `/opsx:propose`. Full product context: `docs/SPEC.md`.

## Goal

Set up the app's technical foundation and the **Plan** tab, so objectives, key results, projects, areas and habits can be created and managed, all stored locally. After this milestone the app is usable as a structured planning tool on the phone, even without the Home and Review features.

## In scope

### 1. Project structure and dependencies
- Feature-first folder structure as described in `openspec/config.yaml`.
- Riverpod, drift with `drift_flutter`, go_router, uuid. Code generation via build_runner.
- **Database on both platforms:** one database setup that uses native SQLite on Android and sqlite3 WASM with browser storage on web. Add the required web assets (`sqlite3.wasm`, drift worker) to `web/` and document in the design how they are obtained and updated.
- Material 3 theme with light and dark mode (follows the system setting).
- App shell with three destinations: **Home**, **Plan**, **Review**. Bottom navigation on narrow screens, navigation rail on wide screens (browser on PC). Home and Review show a placeholder in this milestone.

### 2. Complete database schema
Create drift tables for **all** entities from `docs/SPEC.md` §4, even those whose UI comes later, so later milestones don't need migrations for existing data:
Area, Objective, KeyResult, Project, Task, Habit, HabitCheck, LogEntry, WeeklyReview.

- Shared columns on every table: `id` (UUID v4), `created_at`, `updated_at`, `deleted_at`.
- Enums (statuses, measure type, schedule type, log source) stored as text.
- `updated_at` is set on every write; deletes are soft deletes.
- Schema version 1, with drift's migration setup in place for later versions.
- On first launch, seed default areas: Job, Personal, Sport, Uni (editable and deletable).

### 3. Repositories
One repository per entity needed in this milestone (Area, Objective, KeyResult, Project, Task for next steps, Habit), exposed through Riverpod providers, offering:
- create, update, soft delete
- reactive streams (watch) for lists and single items
- queries needed by the Plan tab (e.g. KRs by objective, projects by KR, backlog projects)

### 4. Domain logic in this milestone
- **Effective deadline** (SPEC §5): KR → `kr.deadline ?? objective.end_date`; project → `project.deadline ?? effective KR deadline ?? none`. Pure function with unit tests.
- **KR progress** for `numeric` and `boolean` KRs (SPEC §5). `habit` KRs show "progress available from milestone 2" for now, since habit checks come later.

### 5. Plan tab UI
- **Objectives section:** for each objective with status `active`: title and date range, then its key results with progress bars, and under each KR the projects linked to it (title, status, importance, effective deadline). Shown one after another, as in SPEC §6.3.
- **Projects without a KR:** their own section below.
- **Backlog:** projects with status `backlog` or `paused`, filterable by area. A project can be activated from here.
- **Archive:** completed/archived objectives and completed projects, reachable from the Plan tab (e.g. a menu entry), read-only list is enough.
- **Create/edit forms** for: objective, key result (fields depend on measure type), project (incl. area, KR link, importance 1–5, deadline, status), habit (title, project or KR link, schedule type with weekdays or times-per-week, optional reminder time, active flag), area (name, color).
- **Project next step:** in the project form or a simple project detail, the user can set the next step as a text; this creates a Task and sets `next_step_task_id`. (Full project detail with task list comes in milestone 2.)
- Delete actions use soft delete and ask for confirmation. Deleting an objective asks what happens to its KRs (delete as well); projects linked to a deleted KR keep existing without a KR.

## Out of scope (later milestones)
- Home screen content: habits due today, deadlines, project scoring, quick log (milestone 2)
- Project detail with task list and log history (milestone 2)
- Habit checking and habit-based KR progress (milestone 2)
- Notifications (milestone 3)
- Weekly review and stats (milestone 4)
- Supabase sync, authentication (milestone 5)
- Native desktop builds (milestone 6, optional)
- Sharing data between phone and web (comes with sync)

## Acceptance criteria
- The app runs on an Android phone via `flutter run` and in Chrome via `flutter run -d chrome`.
- Objectives, KRs, projects, habits and areas can be created, edited and deleted, and data survives an app restart on Android and a page reload on web.
- The layout is usable at phone width and at desktop browser width.
- The Plan tab shows objectives → KRs → projects in the described structure, and projects without a KR separately.
- Moving a project between active, backlog and paused updates the Plan tab immediately.
- Effective deadline and KR progress are covered by unit tests, including edge cases (no deadline anywhere, KR without own deadline, target equal to start value, values beyond target).
- Repository tests run against an in-memory drift database.
- `flutter analyze` reports no issues; `flutter test` passes.
