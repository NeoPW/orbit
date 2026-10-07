# Tasks

## 1. Schema version 4

- [x] 1.1 Add `tasks.key_result_id`, `tasks.objective_id` and `log_entries.task_id` (indexed) to the drift tables, bump `schemaVersion` to 4, run `dart run drift_dev make-migrations`, and add `from3To4` (add columns and indexes); verify `drift_schema_v4.json` exists and the generated migration tests pass
- [x] 1.2 Add a v3→v4 data test (tasks and log entries unchanged, new columns null) and update `test/core/db/app_database_test.dart` to version 4; verify all database tests pass
- [x] 1.3 Add the three columns to `supabase/schema.sql` (in the `create table` blocks and as `alter table … add column if not exists` with indexes) and note in `README.md` that the SQL must be re-run after this update; verify `test/core/sync/schema_sql_test.dart` passes and the sync engine tests still pass

## 2. Task model and data

- [x] 2.1 Implement `TaskAssignment` (standalone / project / KR / objective) and extend `TaskRepository` (`create` and `update` with assignment, clearing the project's next step when a task leaves it, `reopen`, `watch`, `watchOpenOutsideProjects`, `watchOpenAssigned`); verify repository tests for each assignment, one-assignment-only, leaving a project, reopen keeping log entries, and the order of open tasks outside projects
- [x] 2.2 Write the task link on log entries: `complete` logs `task_id` plus the task's project or KR, `LogRepository.add`/`createManual` take `taskId`, and add `watchForTask` and per-task last-logged times; verify repository tests for a standalone task's completion entry and a manual entry on a task
- [x] 2.3 Unlink tasks when their KR or objective is deleted (including KRs removed with an objective); verify repository tests that such tasks become standalone and project deletion still deletes its tasks

## 3. Visual system

- [x] 3.1 Add the Inter font files (Regular, Medium, SemiBold, Bold) and the OFL licence under `assets/fonts/`, declare the family in `pubspec.yaml`; verify `flutter build web` succeeds and a widget test finds `fontFamily: 'Inter'` in the theme
- [x] 3.2 Implement the Orbit palette (dark and light `ColorScheme`s, `OrbitColors` extension), the Inter text theme and component themes (cards, chips, list tiles, app bar, navigation, inputs, page transitions) in `lib/core/theme/`; verify a contrast unit test (onSurface and onSurfaceVariant on surface and surfaceContainer ≥ 4.5 in both themes) and that the app-shell theme tests pass
- [x] 3.3 Build the shared widgets `StatusChip` (with optional status menu), `ImportanceDots`, `DeadlineBadge` (urgent and overdue colors), `AreaChip`, `OrbitRing` and the restyled `EmptyState` (icon, line, action); verify widget tests for each (labels, colors from the theme extension, menu without the current status, ring fraction)
- [x] 3.4 Build `AnimatedItems` (animated insert and remove, no animation when `disableAnimations`) and `TwoPane`; verify widget tests that a removed item animates out over time and disappears immediately with animations disabled, and that `TwoPane` shows both panes at 1400 px

## 4. Navigation and settings

- [x] 4.1 Move Settings to the root-level route `/settings`, add a shared `SettingsButton` to the app bars of Plan, Home and Review, and remove Settings from Plan's ⋮ menu; verify widget tests that each tab's button opens Settings and back returns to that tab, and the Plan menu test is updated
- [x] 4.2 Add the root-level route `/tasks/:id` and route task deadline reminders and Home deadline rows there; verify a router test for the URL (reload) and an updated reminder planner test for the task route

## 5. Task page and creating tasks

- [x] 5.1 Build the task page (`TaskPageBody` plus page): header with title, status chip, deadline badge, assignment chip (tappable) or "Standalone", next-step marker; notes; Complete with Undo / Reopen; edit and delete in the app bar; Log work; log entries; "Task not found"; verify widget tests for each spec scenario of "Task page", "Reopen task" and "Log work on a task"
- [x] 5.2 Extend the task form (dialog) with the assignment picker (active projects, KRs of active objectives, active objectives, or none); verify widget tests for assigning to a KR, clearing the assignment and the missing-title error
- [x] 5.3 Build the new-task sheet (title, deadline, assignment; saves a standalone task with only a title) and add "New task" to Plan's create menu; verify widget tests for creating a standalone task from the sheet and the Plan menu entry

## 6. Home dashboard

- [x] 6.1 Add the Home domain changes: the deadline filter for Home (no projects or tasks outside projects), `deadlineCandidates` including open tasks outside projects, the today-header counts and `homeTasksProvider` ordering; verify unit and provider tests for the home spec scenarios "Project not repeated", "Order", "Project tasks not repeated" and the header counts, and updated reminder tests for "Standalone task"
- [x] 6.2 Rebuild Home: header (date, orbit ring, tasks due), habit chips, deadline rows with badges, project cards (accent, chips, dots, next-step checkbox), the Tasks section with `TaskCard`s and empty state, `AnimatedItems` for the lists, and the two FABs (Task left, Log right) with bottom padding; verify widget tests for the home spec scenarios (section order, chips toggling, badges, next-step checkbox, task tap opens its page, both buttons) with existing Home tests updated
- [x] 6.3 Extend quick log with open tasks outside projects (two groups, recent first) and log task entries with the task's KR; verify unit tests for `orderQuickLogTargets` and widget tests for "Log on a task" and the empty text

## 7. Plan, project detail and review

- [x] 7.1 Redesign the project detail (`ProjectDetailBody` plus page): header with status chip menu, area chip, importance dots and deadline badge (inherited marker), tasks with the next step first and not duplicated, task tap opens its page; remove the status buttons and text lines; verify updated widget tests for the project-detail spec scenarios
- [x] 7.2 Redesign the Plan overview and backlog: objective cards with orbit-ring KR progress and tasks under objectives and KRs, project tiles with chips instead of text, empty states; verify widget tests for "Tasks under a KR" and that no "No area" / "Importance" text appears, with existing Plan tests updated
- [x] 7.3 Add the two-pane Plan at ≥ 1000 px (`planSelectionProvider`, project and task bodies on the right) and keep page navigation below; verify widget tests at 1400 px (detail next to the list) and 400 px (page)
- [x] 7.4 Replace the review stepper with full-screen pages (progress bar "Step N of 6 · name", Back / Next / Save bar, drafts saved on page change), restyle the Review tab and the summary (orbit ring for KRs, completed tasks with assignment opening their task page); verify updated weekly-review tests and new tests for the progress text and opening a completed task
- [x] 7.5 Restyle the remaining screens (Areas, Habits, Archive, forms, Settings, history) with the shared widgets and remove placeholder texts; verify their widget tests pass after updating changed texts

## 8. Integration and verification

- [x] 8.1 Run `dart run build_runner build --delete-conflicting-outputs`, `flutter analyze`, `flutter test`, `flutter build web` and `flutter build apk --debug`; verify analyze reports no issues, all tests pass and both builds succeed
- [x] 8.2 Re-run `supabase/schema.sql` in the Supabase SQL Editor; verify the new columns exist on `tasks` and `log_entries`
- [x] 8.3 On the phone, install over the milestone 5 build with `--dart-define-from-file=supabase.json`; verify data is intact (migration to v4), sync works, a task created on Home with a KR appears in Plan under that KR and on the other device, a task reminder opens the task page, and Settings opens from all three tabs
- [x] 8.4 Check the new design on the phone (dark and light mode) and in Chrome at phone and desktop width: palette and Inter applied, no placeholder texts, Home dashboard, project detail header and status chip, review pages, two-pane Plan at desktop width, animations (and none with "Remove animations" on); verify by screenshots that are compared with the "before" screenshots
- [x] 8.5 Confirm `design.md` "Follow-ups for archiving" lists the `docs/SPEC.md` (§6.7, §6.1) and `openspec/config.yaml` updates; verify the list is present before archiving
