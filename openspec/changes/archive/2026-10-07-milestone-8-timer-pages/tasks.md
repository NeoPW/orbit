# Tasks

## 1. Schema version 5

- [x] 1.1 Add the `timers` table (`project_id`, `task_id`, `started_at` plus sync columns) and `key_results.step` (real, default 1) to the drift tables, add `LogSource.timer`, bump `schemaVersion` to 5, run `dart run drift_dev make-migrations` and add `from4To5`; verify `drift_schema_v5.json` exists and the generated migration tests pass
- [x] 1.2 Add a v4→v5 data test (KRs unchanged with step 1, timers table empty) and update `test/core/db/app_database_test.dart` to version 5; verify all database tests pass
- [x] 1.3 Add `public.timers` (RLS, policy, `sync_guard` trigger) and `key_results.step` (in `create table` and as `alter table … add column if not exists`) to `supabase/schema.sql`, register `timers` in `sync_tables.dart`, and note the SQL re-run in `README.md`; verify `test/core/sync/schema_sql_test.dart` and the sync engine tests pass, including a test that a timer row and a KR step round-trip through push and pull with the fake remote

## 2. Messages at the top

- [x] 2.1 Build the message host (`messengerProvider`, `MessageHost` in `MaterialApp.builder`): card at the top with icon, text and optional action, replaced by a new message, gone after 3 s, swipe up to dismiss, no animation with `disableAnimations`; verify widget tests for position (top of the screen), auto dismiss after 3 s, swipe away, replace, and the action firing
- [x] 2.2 Replace the 8 `SnackBar` calls (complete task with Undo, new task with Open, quick log) with the message host; verify the existing tests for Undo, "Task created" and "Work logged" pass against the new host and `grep -r SnackBar lib` finds nothing

## 3. Forms in sheets

- [x] 3.1 Build `showFormSheet` (bottom sheet below 1000 px, right side sheet from 1000 px) and `FormSheetFrame` (title, Delete when editing, Save, scrolling fields); verify widget tests at 400 px (bottom sheet) and 1400 px (side sheet), and that closing without Save leaves data unchanged
- [x] 3.2 Move the objective, KR (with the new Step field, required > 0) and project forms to sheets (`showObjectiveForm`, `showKeyResultForm`, `showProjectForm`) and update their callers; verify the existing form tests, rewritten to open sheets, pass, plus tests for the default step 1 and the invalid step 0
- [x] 3.3 Move the habit, task (new and edit, unifying the new-task sheet) and area forms to sheets and update their callers; verify the habit, task-dialog, new-task and areas tests pass after switching to sheets
- [x] 3.4 Remove the form routes and add redirects (`/plan/objectives/:id` and `/plan/key-results/:id` to the new pages, `/plan/projects/:id` to `/projects/:id`, `/plan/habits/:id` to `/plan/habits`, the `new` URLs to Plan); verify router tests for each old URL and that no code pushes a removed route

## 4. Objective and KR pages

- [x] 4.1 Add `KeyResultRepository.nudge(id, delta)` (transactional), `step` on create and update, and `LogRepository.watchForKeyResult`; verify repository tests for nudge up and down (also past start and target), two quick nudges, and KR log entries
- [x] 4.2 Build the KR page (`/key-results/:id`, `KeyResultScreen` + `KeyResultPageBody`): header with ring, value and deadline badge, progress controls (numeric − / + by step plus entering the value, boolean done switch, habit read-only), linked projects, tasks, habits and log entries, Edit and Delete, "not found"; verify widget tests for each scenario of "Key result page" and "Progress controls"
- [x] 4.3 Build the objective page (`/objectives/:id`, `ObjectiveScreen` + `ObjectivePageBody`): header with date range, status chip with menu and deadline badge (active only), KRs (tap opens the KR page), Add key result, assigned open tasks, Edit and Delete, "not found"; verify widget tests for opening it, completing from the status chip and the missing objective
- [x] 4.4 Show the objective deadline badge in the Plan overview and on the page (amber within lead time, red "Overdue", none for completed); verify widget tests for an overdue, an ending-soon and a completed objective

## 5. Plan

- [x] 5.1 Make objective and KR taps open their pages through `openPlanItem` (new `PlanObjective` / `PlanKeyResult` in the detail pane at ≥ 1000 px); verify widget tests at 400 px (page) and 1400 px (pane) for a KR and an objective, and update the "Edit by tapping" test
- [x] 5.2 Replace the ⋮ menu with the More button and sheet (tiles for Habits, Areas, Archive); verify widget tests that each tile opens its screen
- [x] 5.3 Make the Archive open the objective page and the project detail; verify the archive restore test via the status chip
- [x] 5.4 Remove the task row menu (`TaskTile`) and add "Make next step" to the task page (open project task that is not the next step); verify widget tests for "No row menu", "Make next step" and its absence on a standalone task, with the project-detail and task-tile tests updated
- [x] 5.5 Show habit links without "No link" and open habits in the edit sheet from the Habits screen; verify the habits list tests

## 6. Work timer

- [x] 6.1 Implement the timer domain (elapsed, logged minutes with a minimum of 1, `m:ss` / `h:mm:ss`) and `TimerRepository` (fixed ID `naturalKeyId('timer')`, `start` stopping a running timer first, `stop` logging with source `timer` at the start time with the target's links, `discard`, `watchRunning`); verify unit tests for the formatting and minutes and repository tests for start, switch, stop (project and KR-assigned task), discard and restart after stop
- [x] 6.2 Add the "Log" / "Start timer" switch to quick log (duration and note hidden in timer mode); verify widget tests for "Start timer mode" and "Log is the default" with the existing quick log tests passing
- [x] 6.3 Build the Home timer card (live elapsed time, Stop, Discard, between header and habits) with the stop and discard messages; verify widget tests for the running card, its position, Stop logging the entry, Discard and no card without a timer
- [x] 6.4 Add `showTimer` / `cancelTimer` to the notification scheduler (ongoing, chronometer, own channel and ID, payload `/home`), make `replaceAll` keep the timer notification, and add the timer notification sync (independent of the reminders setting, permission asked when starting); verify tests with the fake scheduler: shown on start with the target title, cancelled on stop, kept by `replaceAll`, shown with reminders off, and tapping routes to Home
- [x] 6.5 Verify the timer across devices with the sync engine tests: a timer pulled from the server shows on Home, a remote deletion ends it, and the later of two starts wins

## 7. Review

- [x] 7.1 Make the week summary use the snapshots of a week's completed review for its KRs (pure function plus provider branch); verify unit tests for a reviewed past week, the current week and KRs deleted since the review
- [x] 7.2 Change the Review tab to the current week, add the "Last week" button and the week page (`/review/week/:weekStart`), and add the week summary to the past review screen; verify widget tests for "Current week on a Monday", "Open last week" and "Work of a past week", with the existing Review tab tests updated

## 8. Integration and verification

- [x] 8.1 Run `dart run build_runner build --delete-conflicting-outputs`, `flutter analyze`, `flutter test`, `flutter build web` and `flutter build apk --debug`; verify analyze reports no issues, all tests pass and both builds succeed
- [x] 8.2 Re-run `supabase/schema.sql` in the Supabase SQL Editor; verify the `timers` table and `key_results.step` exist
- [x] 8.3 On the phone (installed over the milestone 7 build with `--dart-define-from-file=supabase.json`) and in Chrome: verify data is intact after the v5 migration, a timer started on the phone shows the ongoing notification with a live counter, shows in the browser after sync and can be stopped there (entry logged, notification gone), KR − / + work on the KR page, forms open as bottom sheets on the phone and side sheets on desktop, the More sheet, an overdue objective's red badge, the Review tab on the current week with Last week, and messages at the top disappearing after 3 s
- [x] 8.4 Confirm `design.md` "Follow-ups for archiving" lists the `openspec/config.yaml` updates; verify the list is present before archiving
