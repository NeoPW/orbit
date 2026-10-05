# Proposal

## Why

After milestone 2 the app tracks habits and deadlines, but only while it is open: nothing reminds the user to check a habit or that a deadline is coming. Milestone 3 (`docs/SPEC.md` §9) adds local notifications on Android (SPEC §8), so habits and deadlines reach the user without opening the app. It also adds the local settings (SPEC §4 "Settings") that the reminders need.

## What Changes

- **Habit reminders** (SPEC §8), delivered at the exact minute: every active habit that is due on a day and not yet checked gets a notification at its own reminder time, or at the default reminder time from Settings. Checking the habit cancels that day's reminder.
- **Deadline reminders** (SPEC §8) for the same items Home lists as upcoming deadlines:
  - open tasks of active projects
  - active projects with their own deadline
  - not yet reached KRs of active objectives.

  Each gets one reminder when its own deadline enters the lead time, and one on the day itself, both at the default reminder time.
- **Always up to date:** the reminders are rescheduled whenever habits, habit checks, tasks, projects, KRs, objectives or settings change, and when the app starts or returns to the foreground. They cover the next 14 days.
- **Tapping a reminder** opens the related screen: Home for habits, the project detail for tasks and projects, the KR form for KRs.
- **Android only.** On web nothing is scheduled; Settings explains why. Android 13+ asks for the notification permission on first start.
- **Settings screen** (SPEC §4 Settings), reachable from the Plan tab menu:
  - reminders on/off (default on)
  - default reminder time (default 08:00)
  - deadline lead time in days (default 7, 1–30).

  The lead time also replaces Home's fixed 7 days. Settings are stored locally and never synced.
- **Database schema version 2:** a local-only `settings` table, added by the first drift migration. Existing data is kept.
- The habit form's reminder-time hint changes from "Notifications come in a later milestone" to explain the default time.

## Capabilities

### New Capabilities
- `notifications`: Scheduling, content, updating and opening of habit and deadline reminders on Android, including the permission and the on/off switch.
- `settings`: The local settings (reminders on/off, default reminder time, deadline lead time), their defaults, storage and the Settings screen.

### Modified Capabilities
- `habits`: "Reminder time stored" changes; the reminder time now schedules notifications.
- `home`: Upcoming deadlines use the lead time from Settings instead of a fixed 7 days.
- `local-database`: The schema is version 2 with the local-only settings table, and upgrading from version 1 keeps all data.
- `plan-overview`: The Plan tab menu also opens Settings.

## Impact

- **Dependencies:**
  - `flutter_local_notifications` (scheduling and showing notifications)
  - `timezone` (scheduling at local wall-clock times)
  - `flutter_timezone` (the device's time zone name).
- **Android:**
  - core library desugaring in `android/app/build.gradle.kts` (required by `flutter_local_notifications`)
  - `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED` and `USE_EXACT_ALARM` permissions (`SCHEDULE_EXACT_ALARM` up to Android 12L), plus the plugin's receivers in `AndroidManifest.xml`.
  - `USE_EXACT_ALARM` is granted at install, but Google Play only allows it for alarm and calendar apps. That's fine for a sideloaded personal app; publishing on Play would mean switching to `SCHEDULE_EXACT_ALARM` with a user-granted setting.
- **Data:** schema version 1 → 2 (new table only), with a drift step-by-step migration and a migration test against the v1 snapshot.
- **Code:**
  - new `lib/core/notifications/` (scheduler interface with an Android implementation, behind a conditional import for web)
  - `lib/features/settings/`
  - pure planning functions for reminders.
  - Home's lead-time constant becomes a setting.
- **docs/SPEC.md** updates at archive time:
  - §8: weekly review reminder moved to milestone 4; deadline reminders use the default reminder time
  - §4 Settings: the review day and time come with milestone 4.

## Out of scope

- **Weekly review reminder** and its day/time settings. They come with the review flow in milestone 4.
- **A "Done" action on habit notifications.** Tapping opens Home instead.
- **Notifications on web or desktop.**
- **Per-habit or per-item snooze.**
- **Sync credentials in Settings** (milestone 5).
