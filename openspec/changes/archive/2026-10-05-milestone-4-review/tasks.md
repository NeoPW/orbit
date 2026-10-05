# Tasks

## 1. Schema version 3

- [x] 1.1 Add the `ReviewKrSnapshots` table (sync columns, `weekly_review_id` indexed, `key_result_id`, `progress`), bump `schemaVersion` to 3, run `dart run drift_dev make-migrations` and add `from2To3` creating the table; verify `drift_schemas/orbit/drift_schema_v3.json` exists and the generated migration tests pass
- [x] 1.2 Add a v2→v3 data test (settings rows and a weekly review unchanged, snapshot table present), point the v1 data test at the current version, and update `test/core/db/app_database_test.dart` for version 3 and ten entity tables; verify all database tests pass

## 2. Settings: review day and time

- [x] 2.1 Add `reviewDay` (ISO weekday, default 7) and `reviewTime` (default 18:00) to `AppSettings` with storage keys, fallbacks and `SettingsRepository` setters; verify unit and repository tests for defaults, stored values and invalid values falling back
- [x] 2.2 Add a "Weekly review" section to the Settings screen with a review day dropdown and a review time tile (24-hour picker); verify widget tests for the defaults (Sunday, 18:00) and choosing Saturday 10:00

## 3. Week logic

- [x] 3.1 Implement `reviewWeekStart` in `lib/features/review/domain/`; verify unit tests for the Sunday, Monday and Saturday scenarios and a week crossing the new year
- [x] 3.2 Implement `workPerProject`; verify unit tests for count and duration (incl. entries without duration), "No project", ordering and entries just outside the week (Sunday before, Monday after)
- [x] 3.3 Implement `habitAdherence`; verify unit tests for daily, weekdays (2 of 3), times per week (4 of 3), created mid-week (4 of 4), created after the week (left out) and inactive habits
- [x] 3.4 Implement `completedTasksInWeek` and `krProgressChanges`; verify unit tests for local completion dates at the week edges, the "+15" change, no earlier snapshot, and KRs of non-active objectives left out
- [x] 3.5 Implement `buildWeekSummary` combining the above; verify a unit test with one item of each kind

## 4. Data access

- [x] 4.1 Add `LogRepository.watchBetween` and `TaskRepository.watchCompletedBetween` (UTC range of local days) and `KeyResultRepository.setProgressValue`; verify repository tests for the range boundaries and that `setProgressValue` updates only the value and `updated_at`
- [x] 4.2 Implement `ReviewRepository` (`watchForWeek`, `watchCompleted`, `watchLatestSnapshotsBefore`, `saveDraft`, `complete`) with providers; verify repository tests: draft create and update, revive of a soft-deleted row, a draft of a completed review keeps `completed_at`, `complete` replaces snapshots, history order, and latest snapshot per KR before a week
- [x] 4.3 Implement `reviewWeekProvider` and `weekSummaryProvider(weekStart)`; verify a provider test that a new log entry in the week updates the summary and the review week follows `todayProvider`

## 5. Review tab and history

- [x] 5.1 Replace the Review placeholder with `ReviewScreen` (plan card, start/continue/edit button, week summary, history tile) and update `test/core/router/app_shell_test.dart`; verify widget tests for "No plan yet", the plan shown, the three button labels and that Review is no longer a placeholder
- [x] 5.2 Build `WeekSummaryView` (work per project, habit adherence, completed tasks, KR progress with "since last review" change, empty texts); verify widget tests for each section with seeded data
- [x] 5.3 Add routes `/review/history` and `/review/history/:id` with the history list and read-only detail; verify widget tests for newest-first order and the full detail

## 6. Guided review

- [x] 6.1 Add the root-level route `/review/weekly` and `WeeklyReviewScreen` with the six-step `Stepper` (vertical below 600 px, horizontal otherwise), loading an existing draft or completed review of the review week; verify widget tests for the step order and prefilled values
- [x] 6.2 Build the projects step (active projects with next step, status menu, set/change next step); verify widget tests that pausing a project and setting a next step take effect immediately
- [x] 6.3 Build the key results step (numeric value field saved when valid, boolean switch, habit KRs read-only); verify widget tests for updating 40 → 55 and the read-only habit KR
- [x] 6.4 Build the score (chips 1–10, reflection), plan and save steps; save drafts on step change and when leaving; save completes with snapshots and returns to Review; verify widget tests that a draft survives leaving and reopening, saving without a score is blocked, and saving completes the review and shows "Edit weekly review"

## 7. Review reminder

- [x] 7.1 Extend `planReminders` with the review reminder (review day and time, skipped for completed review weeks, route `/review/weekly`) and add completed reviews to `ReminderSync`'s inputs; verify unit tests for the "Sunday evening", "Already reviewed" and "Review day changed" scenarios and a provider test that completing the review removes the reminder

## 8. Integration and verification

- [x] 8.1 Run `dart run build_runner build --delete-conflicting-outputs`, `flutter analyze`, `flutter test`, `flutter build web` and `flutter build apk --debug`; verify analyze reports no issues, all tests pass and both builds succeed
- [x] 8.2 On the Android phone with the milestone 3 data, update with `flutter run`; verify the app starts, all data is still there and Settings shows the review defaults
- [x] 8.3 On Android, do a full weekly review: summary values match the week, pause a project and update a KR in the steps, leave and continue the draft, save; verify the plan appears on the Review tab, the review is in the history, and a review reminder set a few minutes ahead arrives (and not once the week is reviewed), opening the review when tapped
- [x] 8.4 In Chrome, repeat the weekly review flow at phone and desktop width (stepper layout, readable width) and reload on the review screen; verify the draft is kept and the console has no errors
- [x] 8.5 Confirm `design.md` "Follow-ups for archiving" lists the `docs/SPEC.md` updates (§4, §6.4, §8); verify the list is present before archiving
