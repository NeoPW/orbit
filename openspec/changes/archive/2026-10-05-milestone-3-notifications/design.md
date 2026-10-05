# Design

## Context

After milestone 2:
- habits have an optional `reminder_time` (`HH:mm` text) that is only displayed
- Home computes due habits (`isHabitDue`) and upcoming deadlines (`buildUpcomingDeadlines`, fixed `deadlineLeadDays = 7`)
- "today" comes from `todayProvider`, which refreshes at midnight and on resume
- the database is schema version 1 with a `drift_schemas/orbit/drift_schema_v1.json` snapshot, and `build.yaml` is already configured for `make-migrations`
- Android uses Flutter's default Gradle setup without desugaring
- `main()` is synchronous and `OrbitApp` creates the router with a fixed initial location.

See `proposal.md` for motivation and `specs/` for the required behavior.

## Goals / Non-Goals

**Goals:**
- What to remind and when, computed by one pure function, unit-tested against the specs' scenarios.
- One place that turns that plan into scheduled notifications. It can be replaced by a fake in tests and is a no-op on web.
- The first schema migration done the drift way (step-by-step helper plus a generated migration test), so later migrations follow the same path.

**Non-Goals:**
- No background work besides the plugin's scheduled alarms and boot receiver. The app recomputes reminders only while it runs.
- No notification actions, no weekly review reminder (proposal, Out of scope).

## Decisions

### 1. Packages and Android setup

| Package | Kind | Justification |
|---|---|---|
| `flutter_local_notifications` (22.x) | runtime | Schedules and shows local notifications on Android and reports taps. Named in the project stack. |
| `timezone` (0.11.x) | runtime | `zonedSchedule` needs time-zone-aware times so reminders stay at the wall-clock time across DST changes. |
| `flutter_timezone` (5.x) | runtime | Reads the device's IANA time zone name to set `tz.local`. |

**Android changes:**
- `android/app/build.gradle.kts`: `isCoreLibraryDesugaringEnabled = true` and the `desugar_jdk_libs` dependency, both required by `flutter_local_notifications`.
- `AndroidManifest.xml`:
  - `POST_NOTIFICATIONS` and `RECEIVE_BOOT_COMPLETED` permissions
  - the plugin's `ScheduledNotificationReceiver` and `ScheduledNotificationBootReceiver`, so scheduled reminders survive a reboot.

**Exact alarms.** Reminders use `AndroidScheduleMode.exactAllowWhileIdle`, with:
- `USE_EXACT_ALARM` (Android 13+), granted at install
- `SCHEDULE_EXACT_ALARM` with `android:maxSdkVersion="32"` for Android 12/12L, where it is granted by default.

If `canScheduleExactNotifications()` still reports false, scheduling falls back to `inexactAllowWhileIdle` rather than failing.

*Why changed during implementation:* the first version used inexact alarms. On the test phone (Samsung, Android 15), Android gave every reminder a one-hour delivery window. Also, any re-plan after the reminder time (for example opening the app) cancelled the still-pending reminder without rescheduling it, because past times aren't planned. Together, reminders effectively never arrived during testing.

*Google Play:* `USE_EXACT_ALARM` is restricted there to alarm and calendar apps. That's irrelevant for this sideloaded personal app. Publishing would mean `SCHEDULE_EXACT_ALARM` plus a Settings button to grant "Alarms & reminders".

Two notification channels, "Habit reminders" and "Deadline reminders", so either can be muted separately in Android's system settings.

### 2. Schema version 2: settings table

New drift table `Settings` (SQL `settings`), **local-only**, without the sync columns:

| Column | Type | Notes |
|---|---|---|
| `key` | TEXT PRIMARY KEY | e.g. `reminders_enabled`, `default_reminder_time`, `deadline_lead_days` |
| `value` | TEXT NOT NULL | encoded per key: `true`/`false`, `HH:mm`, integer |

A key-value table means later settings (the review day and time in milestone 4, sync credentials in milestone 5) need no further migration. Missing keys mean "default". Defaults live in code, so a fresh database needs no seed rows.

**Migration.** `schemaVersion` becomes 2. After adding the table, `dart run drift_dev make-migrations`:
- writes `drift_schemas/orbit/drift_schema_v2.json`
- generates the step-by-step helper (`lib/core/db/schema_versions.dart`) and migration tests under `test/core/db/migrations/`.

The strategy becomes:
- `onCreate` stays as is: `createAll()` creates the new table too, plus the area seed.
- `onUpgrade: stepByStep(from1To2: (m, schema) => m.createTable(schema.settings))`.

The generated test checks v1 → v2 schema equality. A hand-written data test inserts v1 rows (project, habit, log entry) and checks they are unchanged after migrating.

The sync milestone must exclude this table. This is noted in the table's doc comment.

*Alternative considered:* `shared_preferences`. Rejected by the user in favor of one storage system with in-memory tests.

### 3. Settings data

- **`SettingsRepository`** (`features/settings/data/`): `watch() → Stream<AppSettings>` plus `setRemindersEnabled`, `setDefaultReminderTime`, `setDeadlineLeadDays`, each an upsert of one key.
- **`AppSettings`** is an immutable value with defaults: `remindersEnabled = true`, `defaultReminderTime = 08:00`, `deadlineLeadDays = 7`. Unknown or unparsable values fall back to the default.
- **Pure helpers** in `features/settings/domain/`: `validateLeadDays` (1–30) and `parseTimeOfDay`/`formatTimeOfDay` for `HH:mm`. Habits already store that format.
- **`appSettingsProvider`** (stream) feeds Home, the reminder planner and the Settings screen.

**Home** replaces the `deadlineLeadDays` constant with a `leadDays` parameter of `buildUpcomingDeadlines`. The empty text becomes "Nothing due in the next N days".

### 4. Planning reminders (pure)

`features/reminders/domain/plan_reminders.dart`:

```
List<PlannedReminder> planReminders({
  habits, checks /* since weekStart(today) */, projects, keyResults,
  deadlineItems, settings, now /* local DateTime */, horizonDays = 14 })
```

`PlannedReminder` has:
- `at`: local wall-clock date and time
- `kind`: habit or deadline
- `title`, `body`
- `route`: the screen to open.

**Habit reminders.** For each date `d` from today to today + 13 and each active habit:
- The checks-in-week count for `d` is taken from `checks`. Future days have no checks, and the following week starts at 0.
- `isHabitDue(habit, d, checksInWeek:)` must be true, and the habit must not be checked on `d`.
- The time is `reminder_time ?? defaultReminderTime`, and only times after `now` are kept.
- The route is `/home`.

**Deadline candidates.** `buildUpcomingDeadlines` is split:
- `deadlineCandidates(...)` returns every open task of an active project with a due date, every active project with an own deadline, and every KR of an active objective with an own deadline and progress below 1, with no date filter.
- Home filters that list by `≤ today + leadDays`.
- The planner uses the same list, so Home and the reminders can't drift apart.

**Deadline reminders.** For each candidate with deadline `D`, there is one reminder at `D − leadDays` ("Due in N days") and one at `D` ("Due today"), both at `defaultReminderTime`. Only those after `now` and within the horizon are kept. Routes:
- tasks and projects: `/projects/<projectId>`
- KRs: `/plan/key-results/<id>`.

The result is sorted by time and **capped at 400**. Android allows about 500 pending alarms per app, and the plugin's boot receiver needs some headroom.

*Alternative considered:* scheduling repeating daily notifications per habit (`matchDateTimeComponents`). Rejected: a repeating notification can't skip a day that is already checked, or a `weekdays`/`times_per_week` day that isn't due.

### 5. Scheduler

`lib/core/notifications/notification_scheduler.dart` defines:

```
abstract interface class NotificationScheduler {
  Future<void> init(void Function(String route) onTap);
  Future<String?> launchRoute();          // tapped notification that started the app
  Future<void> requestPermission();
  Future<bool> notificationsAllowed();
  Future<void> replaceAll(List<PlannedReminder> reminders);
}
```

`notificationSchedulerProvider` picks the implementation through a conditional import:
- On web, `NoopNotificationScheduler`: `notificationsAllowed()` returns false, everything else does nothing.
- Otherwise, `LocalNotificationScheduler`:
  - `init` initializes the time zones and the plugin
  - `replaceAll` calls `cancelAll()`, then `zonedSchedule` for each reminder with ids 0…n−1 and the route as payload.

Replacing everything is simpler than diffing and is cheap at under 400 entries. The plugin files are only imported on the IO side, as the project conventions require for platform-specific code.

Tests override the provider with a `FakeNotificationScheduler` that records the last list.

### 6. Keeping reminders in sync

A keep-alive `ReminderSync` notifier (`features/reminders/data/`):
- watches `appSettingsProvider`, `habitsProvider`, `habitChecksSinceProvider(today.weekStart)`, `allProjectsProvider`, `keyResultsProvider`, `objectivesProvider`, `openTasksProvider`/`dueTasksProvider`, `habitCheckInsProvider` and `todayProvider`
- once all have values, computes `planReminders(now: clock())`
- debounces by 500 ms, so bursts of writes such as a transaction touching several tables schedule once
- calls `replaceAll`, or `replaceAll([])` when reminders are off
- skips the call when the plan equals the last one it scheduled.

It also re-plans on `AppLifecycleState.resumed`. Time passes and a time zone change must be picked up even when "today" is unchanged.

It is started by a `ReminderSyncScope` widget around the app's router, which simply `ref.watch`es it. The scope is created only when the scheduler is the IO implementation, so widget tests and web stay unaffected.

### 7. Startup, permission and taps

`main()` becomes async:
1. `WidgetsFlutterBinding.ensureInitialized()`
2. create a `ProviderContainer`
3. `scheduler.init(onTap)`
4. read `launchRoute()`
5. `runApp(UncontrolledProviderScope(..., OrbitApp(initialLocation: route ?? '/home')))`.

`onTap` while running goes through a `notificationTapProvider` stream that `OrbitApp` listens to:
- `/home` → `router.go`
- other routes → `router.push`, so back returns to where the user was.

The permission is requested once after startup on Android when reminders are on. Android itself only shows the dialog if the user hasn't decided yet. The Settings screen calls `notificationsAllowed()` to show the "blocked" note.

### 8. Settings screen and entry point

- **Route:** `/plan/settings` (`Routes.settings`), a new entry in the Plan tab's overflow menu after Areas.
- **Screen:** a `ListView` inside `MaxWidthBody` with:
  - a `SwitchListTile` "Reminders", or on web the note "Reminders are only available on Android"
  - "Blocked in Android settings" when not allowed
  - "Default reminder time": a `ListTile` that opens `showTimePicker` (24-hour) and shows `HH:mm`
  - "Deadline lead time": a number field with a "days" suffix and an error for values outside 1–30, saved when valid.
- **Habit form:** the reminder field's helper text becomes "Without a time, the default reminder time is used."

### 9. Testing approach

- Unit tests:
  - `planReminders` for every notifications-spec scenario (own and default time, not due, inactive, weekly target reached, checked today, past time today, 14-day horizon, deadline lead and due-day reminders, lead date passed, inherited deadline, cap of 400)
  - `deadlineCandidates`
  - settings parsing and validation.
- Repository tests for `SettingsRepository` (defaults, upsert, reload).
- Migration tests: the generated v1 → v2 schema test and the data-preservation test.
- Provider tests for `ReminderSync` with the fake scheduler:
  - checking a habit removes today's reminder
  - switching reminders off sends an empty list
  - a debounced burst schedules once.
- Widget tests:
  - the Settings screen (defaults, time picker, lead-time error, web note through an overridden platform flag)
  - the Plan menu entry
  - the Home empty text with lead time 3
  - tap routing through `notificationTapProvider`.
- Manual tests on Android for real delivery, tapping from a closed app, permission and reboot (tasks).

## Risks / Trade-offs

- [The app isn't opened for more than 14 days, so reminders run out] → Accepted. Each start or resume schedules the next 14 days again. This is documented in the Settings screen's reminders subtitle.
- [A re-plan right at a reminder's time cancels it before it is shown, since past times are not planned] → With exact alarms the gap is under a second, so in practice the reminder has fired before a re-plan can cancel it.
- [Vendor battery savers (e.g. Samsung) can still delay or drop alarms of apps they put to sleep] → Exact alarms with `allowWhileIdle` are the strongest option without a foreground service. If it shows up in practice, document how to exempt Orbit from battery optimization.
- [`cancelAll` + reschedule on every change could cause churn] → Debounced, and skipped when the plan is unchanged.
- [The first migration could break existing installs] → The generated migration test against the committed v1 snapshot, the data-preservation test, and a manual upgrade test on the phone with milestone 2 data (tasks).
- [A time zone change while the app is closed keeps old wall-clock times] → Re-planned on the next start or resume.
- [`flutter_local_notifications` on web] → Not imported on web thanks to the conditional import. `flutter build web` stays in the verification tasks.

## Migration Plan

1. Ship schema version 2 with the step-by-step migration. On first start after the update, drift migrates version 1 to 2 by creating the `settings` table. No existing rows change.
2. The settings table starts empty, so every setting has its default until changed.
3. Rollback: a version 2 database can't be opened by the milestone 2 build (drift refuses a downgrade). Rolling back would mean deleting app data. This is acceptable for a personal app, but it is why the upgrade is tested on the phone before relying on it.

## Follow-ups for archiving

**`docs/SPEC.md`:**
- §8: the weekly review reminder moves to milestone 4; deadline reminders fire at the default reminder time on the lead date and the due date; reminders cover 14 days and are Android only.
- §4 Settings: reminders on/off is added; the weekly review day and time come with milestone 4.
- §9: milestone 3 is "habits and deadlines"; the weekly review reminder is part of milestone 4.
