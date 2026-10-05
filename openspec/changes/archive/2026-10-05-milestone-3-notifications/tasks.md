# Tasks

## 1. Dependencies and Android setup

- [x] 1.1 Add `flutter_local_notifications`, `timezone` and `flutter_timezone` with `flutter pub add`; verify `flutter pub get` succeeds and `flutter analyze` reports no issues
- [x] 1.2 Enable core library desugaring (`isCoreLibraryDesugaringEnabled` and the `desugar_jdk_libs` dependency) in `android/app/build.gradle.kts`; verify `flutter build apk --debug` succeeds
- [x] 1.3 Add the `POST_NOTIFICATIONS` and `RECEIVE_BOOT_COMPLETED` permissions and the plugin's `ScheduledNotificationReceiver` / `ScheduledNotificationBootReceiver` to `AndroidManifest.xml`; verify `flutter build apk --debug` still succeeds

## 2. Schema version 2 and settings data

- [x] 2.1 Add the local-only `Settings` table (`key` primary key, `value`) without sync columns, with a doc comment that sync must skip it; bump `schemaVersion` to 2; run `dart run drift_dev make-migrations` and wire `onUpgrade` to the generated `stepByStep(from1To2: …createTable(settings))`; verify `drift_schemas/orbit/drift_schema_v2.json` and the generated migration test exist and the generated test passes
- [x] 2.2 Add a migration data test: a v1 database with a project, a habit and a log entry is migrated to v2 with those rows unchanged and the settings table present; update `test/core/db/app_database_test.dart` for version 2 and the settings table; verify both pass
- [x] 2.3 Implement `AppSettings` (defaults: reminders on, 08:00, 7 days), `validateLeadDays` (1–30) and `parseTimeOfDay`/`formatTimeOfDay` in `lib/features/settings/domain/`; verify unit tests for defaults, 0/1/30/31/"x" lead days, and `HH:mm` round trips including invalid text falling back to the default
- [x] 2.4 Implement `SettingsRepository` (`watch`, `setRemindersEnabled`, `setDefaultReminderTime`, `setDeadlineLeadDays`) and `appSettingsProvider`; verify repository tests: an empty table gives the defaults, each setter upserts and `watch` emits the new value, and an unparsable stored value reads as its default

## 3. Lead time on Home

- [x] 3.1 Split `buildUpcomingDeadlines` into `deadlineCandidates` (no date filter) and a lead-day filter taking `leadDays`; remove the `deadlineLeadDays` constant; verify the existing upcoming-deadline tests pass with `leadDays: 7` and new tests cover the home spec "Shorter lead time" scenario and that candidates include deadlines beyond the lead time
- [x] 3.2 Make `upcomingDeadlinesProvider` use `appSettingsProvider`'s lead time and show "Nothing due in the next N days"; verify a Home widget test with lead time 3 for the "Shorter lead time" scenario and that the default still says 7 days

## 4. Settings screen

- [x] 4.1 Add the route `/plan/settings` (`Routes.settings`) and a "Settings" entry in the Plan tab menu; verify the Plan menu widget test opens Settings
- [x] 4.2 Build the Settings screen: reminders switch, default reminder time (24-hour time picker, shown `HH:mm`) and lead time field (error outside 1–30, saved when valid); verify widget tests for the defaults, picking 07:15, and the error for 0 and 31 with nothing saved
- [x] 4.3 Show "Reminders are only available on Android" instead of the switch when reminders are unsupported, and "Blocked in Android settings" when not allowed, using the scheduler provider; verify widget tests with a fake scheduler for both notes
- [x] 4.4 Change the habit form's reminder-time helper text to "Without a time, the default reminder time is used."; verify the habit form widget test finds the new text

## 5. Reminder planning

- [x] 5.1 Define `PlannedReminder` (time, kind, title, body, route) and implement the habit part of `planReminders` in `lib/features/reminders/domain/plan_reminders.dart`; verify unit tests for own and default time, not due, inactive, weekly target reached, checked today, a past time today, the label from project/KR, and the 14-day horizon
- [x] 5.2 Add the deadline part (lead-date "Due in N days" and due-date "Due today" at the default time, routes to project detail or KR form) and the cap of 400 earliest reminders; verify unit tests for the "Task due date", "Lead date already passed", "Completed task" and "Inherited deadline" scenarios, a KR route, and the cap
- [x] 5.3 Return no reminders when reminders are switched off; verify a unit test

## 6. Scheduler and sync

- [x] 6.1 Define `NotificationScheduler`, `NoopNotificationScheduler`, a `FakeNotificationScheduler` test helper and `notificationSchedulerProvider` with a conditional import that keeps the plugin out of web builds; verify `flutter analyze` passes and `flutter build web` succeeds
- [x] 6.2 Implement `LocalNotificationScheduler` (time zone setup via `flutter_timezone`, plugin init with tap callback, two channels, `launchRoute`, `requestPermission`, `notificationsAllowed`, `replaceAll` with `cancelAll` + `zonedSchedule` in `inexactAllowWhileIdle` mode); verify `flutter build apk --debug` succeeds
- [x] 6.3 Implement the `ReminderSync` notifier (watch the inputs, plan with the clock, 500 ms debounce, skip unchanged plans, re-plan on resume, empty list when switched off); verify provider tests with the fake scheduler: checking a habit removes today's reminder, switching off sends an empty list, a burst of writes schedules once, and an unchanged plan is not sent again
- [x] 6.4 Make `main()` async: initialize the scheduler, start `OrbitApp` at the launch route (default `/home`), add `ReminderSyncScope` on the IO platform, request the permission once when reminders are on, and route taps through `notificationTapProvider` (`/home` → go, others → push); verify a widget test that a tap event for a project detail route opens that detail and one for `/home` shows Home, and that the existing app tests still pass
- [x] 6.5 Schedule exactly: add `USE_EXACT_ALARM` and `SCHEDULE_EXACT_ALARM` (max SDK 32) to the manifest, use `exactAllowWhileIdle` when `canScheduleExactNotifications()` allows it and fall back to inexact otherwise; verify `flutter build apk --debug` succeeds and, on the phone, `adb shell dumpsys alarm` lists Orbit's alarms without a delivery window

## 7. Integration and verification

- [x] 7.1 Run `dart run build_runner build --delete-conflicting-outputs`, `flutter analyze`, `flutter test` and `flutter build web`; verify analyze reports no issues, all tests pass and the web build succeeds
- [x] 7.2 On the Android phone with the milestone 2 data installed, update to this build with `flutter run`; verify the app starts, all existing objectives, projects, habits and log entries are still there, and Settings shows the defaults
- [x] 7.3 On Android, verify: the permission dialog appears on first start; a habit with a reminder time a few minutes ahead notifies, and checking it before that time prevents the notification; a task due within the lead time notifies at the default time (set it a few minutes ahead); tapping a reminder opens the right screen, also with the app closed; switching reminders off stops them; reminders still arrive after a phone restart
- [x] 7.4 In Chrome, verify Settings shows the Android-only note, the lead time changes Home's upcoming deadlines, no permission prompt appears and the console has no errors
- [x] 7.5 Confirm `design.md` "Follow-ups for archiving" lists the `docs/SPEC.md` updates (§8, §4 Settings, §9); verify the list is present before archiving
