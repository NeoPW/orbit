# Design

## Context

- **Database:** schema version 3, with `supabase/schema.sql` mirroring it. A test (`test/core/sync/schema_sql_test.dart`) fails when they diverge.
- **Tasks today:** `tasks` has `project_id` (nullable) only, and `log_entries` has `project_id` and `key_result_id`.
  - `TaskRepository.create/update/complete/undoComplete/delete` and `ProjectRepository.completeNextStep` exist.
  - Deleting an objective or KR unlinks projects and habits through `clearReference`; deleting a project soft-deletes its tasks.
- **UI:** Material 3 with `ColorScheme.fromSeed(indigo)` and the system font. Screens are built from `ListTile`s with text subtitles. Shared widgets live in `lib/core/widgets/` (`SectionHeading`, `EmptyState`, `MaxWidthBody`, `AreaDot`).
  - Project detail lists fields as text lines plus a row of status buttons.
  - The weekly review uses a Material `Stepper`.
- **Routing:**
  - Settings is `/plan/settings`, opened from Plan's ⋮ menu.
  - Project detail and the weekly review are root-level routes.
  - Reminders route tasks to `/projects/<id>`.
- **Tests:** 496 tests, many asserting exact texts that this change replaces ("No area", "Importance 3", "Status: Active", stepper titles).

See `proposal.md` for motivation and `specs/` for the required behavior.

## Goals / Non-Goals

**Goals:**
- One task model: standalone or assigned to one project, KR or objective. Rules such as one assignment, unlinking, and leaving a project clearing its next step live in the repository and are unit-tested.
- A small set of shared, themed building blocks, used by every screen so the new look is consistent and testable:
  - palette and theme extension
  - Inter text theme
  - chips and badges
  - orbit ring
  - empty state
  - animated list
  - two-pane scaffold.
- Keep the domain functions (score, urgency, deadlines, reminders) intact and only extend them.

**Non-Goals:**
- No bottom-sheet editing beyond the new quick-create task sheet, no swipe actions, no Undo instead of confirm dialogs (proposal, Out of scope).
- No logo or app icon.
- No new packages: Inter is bundled; transitions and animations use Flutter's own widgets.

## Decisions

### 1. Schema version 4

| Table | New column | Notes |
|---|---|---|
| `tasks` | `key_result_id` TEXT NULL | indexed |
| `tasks` | `objective_id` TEXT NULL | indexed |
| `log_entries` | `task_id` TEXT NULL | indexed |

- **Migration:** `schemaVersion = 4`; `make-migrations` writes `drift_schema_v4.json` and the generated tests; `from3To4` adds the three columns and indexes with `m.addColumn` / `m.createIndex`.
- **Data test:** a v3 database with tasks and log entries keeps all values, and the new columns are null.
- **Server:** `supabase/schema.sql` gets the columns in its `create table` blocks (the schema test stays green) plus `alter table … add column if not exists …` lines, so re-running the file upgrades an existing project. `README.md` notes that the SQL has to be re-run after this update. Until it is, sync fails and is retried; no local data is lost.

### 2. Task model and repository

- **`TaskAssignment`** (sealed, `features/tasks/domain/`): `Standalone`, `InProject(id)`, `ForKeyResult(id)`, `ForObjective(id)`. It maps to the three columns with at most one set.
- **`TaskRepository`:**
  - `create({title, notes, dueDate, assignment})`
  - `update(task, {assignment})`: when a task leaves a project whose next step it was, the project's `next_step_task_id` is cleared in the same transaction
  - `reopen(id)`
  - `watch(id)`
  - `watchOpenOutsideProjects()` (for Home, ordered by due date, nulls last, then `created_at`)
  - `watchOpenAssigned()` (for Plan)
  - `complete` now writes the log entry with `task_id` and the task's `project_id`/`key_result_id`.
- **Deletes:**
  - `KeyResultRepository.delete` and `ObjectiveRepository.delete` (including the KRs it removes) also `clearReference(tasks, key_result_id / objective_id)`
  - project deletion keeps soft-deleting its tasks.
- **`LogRepository`:**
  - `add`/`createManual` accept `taskId`
  - `watchForTask(id)`
  - `watchLastLoggedAt` returns separate maps for projects and tasks.

### 3. Routes and navigation

| Route | Screen | Notes |
|---|---|---|
| `/tasks/:id` | Task page | root level, like project detail; the URL survives a reload |
| `/settings` | Settings | root level, moved from `/plan/settings` |

- Settings is opened by a shared `SettingsButton` (gear) in the app bars of Plan, Home and Review, and removed from Plan's ⋮ menu. Back returns to the tab it came from.
- Task reminders and Home deadline rows route to `/tasks/<id>`; project and KR routes are unchanged.
- **Two-pane Plan:** at ≥ 1000 px, `PlanScreen` uses a `TwoPane` widget, with the list (max 560 px) on the left and the detail on the right. A `planSelectionProvider` holds the selected project or task, and tapping in Plan sets it instead of pushing. The detail pane renders the project and task pages themselves (`ProjectDetailScreen` / `TaskScreen` with an `onClose` callback that shows a close button instead of back and clears the selection), so the page and the pane share one implementation, app-bar actions included. Their scaffold-free bodies `ProjectDetailBody` / `TaskPageBody` are still separate widgets. Below 1000 px, taps push the routes as today.

### 4. Home

- **Header:** the date ("Monday, 05-10-2026"); an `OrbitRing` with habits checked of due ("2/4"); "N tasks due" (open tasks due today or overdue, in or outside projects).
- **Habits:** a `Wrap` of `HabitChip`s (filled when checked, the project or KR label as a second line); tapping toggles the check.
- **Upcoming deadlines:**
  - `buildUpcomingDeadlines` gets a filter for Home that drops `DeadlineKind.project` and tasks outside projects, which carry their badge on their own card
  - `deadlineCandidates`, used by reminders, adds open tasks outside projects; their route is `/tasks/<id>`.
- **Project cards:** an area color accent strip, area chip, deadline badge, importance dots, and the next step as a `CheckboxListTile`-style row.
- **Tasks section:** `homeTasksProvider` (open tasks outside projects with their assignment label); a `TaskCard` with checkbox, title, assignment label and deadline badge.
- **Two FABs:** `floatingActionButtonLocation: centerFloat` with a full-width `Row` of `FloatingActionButton.extended`s, "Task" on the left and "Log" on the right, with distinct `heroTag`s.
- **`showNewTaskSheet`:** a modal bottom sheet with title (autofocus), `DateField` and an assignment picker grouped as Projects / Key results / Objectives (active only). Save creates the task, closes the sheet and shows a snackbar with "Open".

### 5. Quick log with tasks

`orderQuickLogProjects` becomes `orderQuickLogTargets(projects, tasks, lastLogged)`: projects first, then open tasks outside projects, each group recent-first, then by title. The sheet shows two small headings ("Projects", "Tasks"), and a task entry also gets the task's KR.

### 6. Visual system (`lib/core/theme/`, `lib/core/widgets/`)

**Palette** (`orbit_palette.dart`): `ColorScheme`s built explicitly, not with `fromSeed`, plus an `OrbitColors` `ThemeExtension` for `urgent` (amber), `overdue` (red) and `ring` track colors.

| Role | Dark | Light |
|---|---|---|
| surface (background) | `#0B1026` night navy | `#F4F5FB` lavender grey |
| surfaceContainer (cards) | `#141B3A` | `#FFFFFF` |
| surfaceContainerHigh | `#1C2550` | `#ECEEF8` |
| outlineVariant | `#2C3566` | `#D9DCEC` |
| onSurface | `#E7E9F7` | `#141936` |
| onSurfaceVariant | `#A6ACCF` | `#525A82` |
| primary (blue-violet) | `#8F9DFF` | `#4A57D6` |
| onPrimary | `#0B1026` | `#FFFFFF` |
| secondary (cyan) | `#4FD8E8` | `#0A8FA3` |
| urgent (amber) | `#FFB547` | `#B86E00` |
| overdue / error | `#FF6B6B` | `#C93C3C` |

**Typography:** Inter Regular, Medium, SemiBold and Bold (static TTFs from the official `rsms/inter` release, OFL licence included) in `assets/fonts/`, declared as family `Inter` in `pubspec.yaml`. `TextTheme` changes:
- smaller `bodyLarge` (15)
- `titleMedium` and `titleLarge` in SemiBold
- labels in Medium
- `headlineSmall` for the Home date.

**Component themes:**
- cards: no elevation, 16 px radius, `surfaceContainer`
- chips: compact, 8 px radius
- `ListTile`: dense, 12 px horizontal padding
- app bar: flat, title in `titleLarge`
- `NavigationBar`: indicator in `primaryContainer`
- inputs: filled, 12 px radius
- page transitions: `FadeForwardsPageTransitionsBuilder` on all platforms.

**Widgets:**
- `StatusChip` (colored per status, optional menu of the other statuses)
- `ImportanceDots` (five dots)
- `DeadlineBadge` (replaces the private `_Badge`; urgent when within the lead time, overdue in red)
- `AreaChip`
- `OrbitRing` (`CustomPainter`, track plus arc plus a small "planet" dot at the arc's end)
- `EmptyState` (icon, line, optional action), restyled
- `AnimatedItems`: a keyed column that animates added and removed children with `SizeTransition` + `FadeTransition`, 250 ms, zero when `MediaQuery.disableAnimations`
- `TwoPane`.

**Text clean-up:** "No area", "No deadline", "No key result", "Importance N", "Status: X" and "Own deadline / Effective" lines are removed everywhere in favor of these widgets. Only "No next step" stays, because it prompts an action.

### 7. Detail pages and review

- **Project detail:** a header card with title, `StatusChip` (with a menu that replaces the status buttons), `AreaChip`, `ImportanceDots` and `DeadlineBadge` (with "from key result" when inherited), then description and KR. Tasks come next in one list, the next step first with a flag marker and not repeated in its own section. Then habits and the log. Edit stays in the app bar.
- **Task page:** the same header pattern (title, status chip, deadline badge, assignment chip linking to the item, next-step marker), then notes, actions in the app bar (edit, delete) plus a primary "Complete" / "Reopen" button, "Log work", and the log list.
- **Weekly review:** a `PageView` with `NeverScrollableScrollPhysics`, a `LinearProgressIndicator` with "Step 3 of 6 · Key results" above, and Back / Next (Save on the last page) in a bottom bar. Draft saving moves from the stepper callbacks to page changes. The step content widgets are reused as they are.

### 8. Testing approach

- **Unit tests:**
  - task assignment mapping and repository rules (one assignment, leaving a project clears its next step, KR or objective delete unlinks, reopen, complete logs `task_id`)
  - deadline candidates and the Home filter
  - Home task order
  - quick-log target order
  - palette contrast: a test computes WCAG contrast for onSurface and onSurfaceVariant on surface and surfaceContainer in both themes (≥ 4.5).
- **Migration:** the generated v1/v2/v3 → v4 tests and the v3 → v4 data test.
- **Widget tests:**
  - task page (fields, open the assigned item, reopen, log work, not found)
  - Home (header ring, habit chip toggles, the tasks section, the two FABs, the new-task sheet creating a standalone task, a project not repeated under deadlines)
  - project detail (status chip menu, next step not duplicated, a task tap opens its page)
  - Plan (New task in the menu, tasks under a KR, two panes at 1400 px and a page at 400 px)
  - settings button on all three tabs
  - review pages (progress "Step 3 of 6", draft kept)
  - `AnimatedItems` with animations disabled
  - no "No area" text on cards.
- **Existing tests:** tests that assert replaced texts are updated in the group that changes the screen, not at the end.

## Risks / Trade-offs

- [The large UI change breaks many widget tests at once] → Screens are redone one group at a time, each group updating its own tests before the next starts.
- [The server schema must be re-run for the new columns; until then pushes fail] → `README.md` and the tasks say so. `alter table … if not exists` makes re-running safe. Sync failures are silent and retried, and nothing local is lost.
- [Two FABs can cover the last list item] → The list gets bottom padding for both buttons; the buttons are compact (extended with short labels).
- [A custom palette can miss contrast in places] → The contrast test covers the main text pairs; badge and chip colors are checked by eye on the phone and in Chrome (tasks).
- [Inter adds about 1 MB of fonts (4 static weights)] → Acceptable for offline use. A variable font would be smaller, but static weights render identically on Android and web.
- [The two-pane layout duplicates page logic] → Avoided by extracting scaffold-free `…Body` widgets used by both the page and the pane.

## Migration Plan

1. Re-run the updated `supabase/schema.sql` in the Supabase SQL Editor. It adds the three columns; existing rows get null.
2. Install the new build. drift migrates the local database 3 → 4 on start; existing tasks keep their project.
3. Rollback: a version 4 database can't be opened by the milestone 5 build. The upgrade is checked on the phone first (tasks).

## Follow-ups for archiving

- **`docs/SPEC.md`:**
  - §6.7: record the concrete palette and Inter, and that animations respect reduced motion
  - §6.1: the Home deadline filter (projects and tasks outside projects only as card badges) and the header contents.
- **`openspec/config.yaml` context:** UI conventions: use the shared chips, badges and empty-state widgets, and no placeholder texts for unset values.
