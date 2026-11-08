## ADDED Requirements

### Requirement: Reminders on Android
The Android app SHALL schedule its habit reminders, deadline reminders and the end of a focus session (see "Habit reminders", "Deadline reminders", "End of a focus session") with the Android system, so they are shown at their time also while the app is closed or in the background. They SHALL be scheduled again after the phone restarts.

The app SHALL plan the reminders from now until 7 days ahead. It SHALL replace all reminders it scheduled before whenever it runs and something changes:
- at start and on returning to the foreground
- after any change to habits, habit checks, tasks, projects or settings, also from a sync
- at midnight while open

The weekly review reminder SHALL NOT be scheduled on the phone. With reminders switched off, no habit or deadline reminder SHALL be scheduled, but the end of a focus session SHALL still be.

#### Scenario: Habit reminder while closed
- **WHEN** the habit "Stretch" is due today at 18:00, the app was opened at 9:00 and closed again
- **THEN** a notification "Stretch" is shown at 18:00 although the app is not running

#### Scenario: Checked on the phone
- **WHEN** the user checks "Stretch" on the phone at 12:00
- **THEN** no reminder for "Stretch" is shown at 18:00 that day

#### Scenario: Several days ahead
- **WHEN** the app was last opened on Monday and the daily habit "Read" has the reminder time 21:00
- **THEN** its reminder is shown on Monday to Sunday at 21:00 even if the app is not opened again

#### Scenario: After a restart
- **WHEN** the phone restarts at 15:00 and the habit "Stretch" is due at 18:00
- **THEN** the reminder for "Stretch" is still shown at 18:00 without the app being opened

#### Scenario: Reminders switched off
- **WHEN** the user switches reminders off on the phone
- **THEN** all habit and deadline reminders scheduled by the phone are removed

#### Scenario: Time limit while closed
- **WHEN** a session with a 30-minute limit was started on the phone at 10:00 and the app was closed
- **THEN** the notification for the end of the session is shown at 10:30

#### Scenario: Paused before the limit
- **WHEN** that session is paused at 10:20
- **THEN** no notification for its end is shown at 10:30

### Requirement: Check before showing on Android
When a habit or deadline reminder scheduled by the phone is due, the phone SHALL first ask the sync server (see sync-server, "Reminder check") whether it is still needed, and SHALL show it only when the answer is yes. It SHALL show the reminder without the answer when:
- the phone is not connected to a server
- the request fails
- no answer comes within 5 seconds

The end of a focus session SHALL be shown without asking.

#### Scenario: Checked on the desktop
- **WHEN** the habit "Stretch" is due on the phone at 18:00, the user checked it on the desktop at 17:55 and the desktop synced, and the phone app was not opened since the morning
- **THEN** no reminder for "Stretch" is shown on the phone

#### Scenario: Task done on the desktop
- **WHEN** the task "Book venue" has a deadline reminder on the phone and was completed on the desktop before that time
- **THEN** no reminder for "Book venue" is shown on the phone

#### Scenario: Offline
- **WHEN** the habit "Stretch" is due at 18:00 and the phone has no connection
- **THEN** the reminder for "Stretch" is shown

### Requirement: Ongoing focus notification on Android
While a focus session exists, the Android app SHALL show an ongoing notification that cannot be swiped away. It SHALL name what the session runs for and read:
- "Running since HH:mm" while it runs, from the start of the current stretch
- "Paused · N min" while it is paused, with the worked time

It SHALL be updated when the session is paused, resumed or changed (also from a sync while the app runs), and removed when the session is completed or discarded. Tapping it SHALL open focus mode.

#### Scenario: Running
- **WHEN** a session for "Thesis" is started on the phone at 10:15
- **THEN** an ongoing notification "Thesis" with "Running since 10:15" is shown

#### Scenario: Paused
- **WHEN** that session is paused with 25 minutes worked
- **THEN** the notification reads "Paused · 25 min"

#### Scenario: Completed
- **WHEN** the session is completed
- **THEN** the ongoing notification is removed

#### Scenario: Tap
- **WHEN** the user taps the ongoing notification
- **THEN** the app opens in focus mode

### Requirement: Notification permission on Android
On Android versions that require it, the app SHALL ask for the permission to show notifications at its first start while reminders are on, and again when the user switches reminders on. Without the permission it SHALL schedule nothing. Settings SHALL then say that notifications are blocked for Orbit in the Android settings.

#### Scenario: First start
- **WHEN** the app starts for the first time on Android 14
- **THEN** Android asks whether Orbit may send notifications

#### Scenario: Denied
- **WHEN** the user denied the permission
- **THEN** no notifications come, and the Reminders section in Settings says that notifications are blocked for Orbit

## MODIFIED Requirements

### Requirement: Open from a notification
Clicking a notification SHALL show the window and open the related screen: Home for a habit reminder, the task page for a task reminder, the project detail for a project reminder, the guided weekly review for the review reminder, and focus mode for the end of a focus session. On the phone, tapping a notification SHALL open the app with:
- Home for a habit reminder
- the task popup over Home for a task reminder
- Home for a project reminder
- focus mode for the end of a focus session and for the ongoing focus notification

#### Scenario: Click a task reminder
- **WHEN** the user clicks the reminder of the task "Book venue" while the window is in the tray
- **THEN** the window is shown with the task page of "Book venue"

#### Scenario: Click the weekly review reminder
- **WHEN** the user clicks the weekly review reminder
- **THEN** the guided weekly review opens

#### Scenario: Tap a task reminder on the phone
- **WHEN** the user taps the reminder of the task "Book venue" on the phone while the app is closed
- **THEN** the app opens on Home with the task popup of "Book venue"

### Requirement: End of a focus session
When a running focus session's worked time reaches its time limit (see work-timer, "Time limit"), the desktop app SHALL show a notification with what the session runs for and the limit, whatever the reminders switch, and the app SHALL play a short sound, also in the browser. On Android this notification SHALL be scheduled with the system (see "Reminders on Android") and SHALL use the system's notification sound. The timer SHALL keep running. A paused session SHALL NOT reach its limit; a limit set at or below the worked time SHALL give no notification.

#### Scenario: 25 minutes over
- **WHEN** a session for "Thesis" with a 25-minute limit reaches 25 minutes worked
- **THEN** a notification "Thesis: 25 minutes done" is shown, a sound plays and the timer goes on into overtime

#### Scenario: Limit after a pause
- **WHEN** a session with a 30-minute limit logged 20 minutes, was paused and is resumed at 11:00
- **THEN** the notification and sound come at 11:10

#### Scenario: Open-ended session
- **WHEN** a session without a time limit runs for 2 hours
- **THEN** no notification or sound comes

#### Scenario: Limit already passed
- **WHEN** the user sets a 15-minute limit on a session with 20 minutes worked
- **THEN** no notification or sound comes and the timer shows 5 minutes overtime
