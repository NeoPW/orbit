# notifications Specification

## Purpose

Reminds the user on Android of habits that are due and of upcoming deadlines through local notifications, kept up to date with the data and settings, and opening the related screen when tapped.

## Requirements

### Requirement: Habit reminders
For every active habit and every date on which it is due (see habits, "Habit due today") and not checked, the app SHALL schedule a notification on that date at the habit's reminder time, or at the default reminder time (see settings) when the habit has none. The notification SHALL show the habit's title and the title of its linked project or KR, if any.

#### Scenario: Own reminder time
- **WHEN** an active daily habit "Stretch" has reminder time 07:30
- **THEN** a notification "Stretch" is scheduled for 07:30 on each upcoming day

#### Scenario: Default reminder time
- **WHEN** an active daily habit has no reminder time and the default reminder time is 08:00
- **THEN** its notifications are scheduled for 08:00

#### Scenario: Not due
- **WHEN** a habit has weekdays Monday, Wednesday and Friday
- **THEN** no notification is scheduled for it on Tuesdays

#### Scenario: Inactive habit
- **WHEN** a habit is inactive
- **THEN** no notification is scheduled for it

#### Scenario: Weekly target reached
- **WHEN** a habit with 2 times per week has been checked twice this week
- **THEN** no notification is scheduled for it for the rest of the week

### Requirement: No reminder for a checked habit
Checking a habit SHALL cancel its reminder for that date. Unchecking it before the reminder time SHALL schedule the reminder again.

#### Scenario: Checked before the reminder
- **WHEN** a habit with reminder time 18:00 is checked at 09:00
- **THEN** no reminder for it is shown at 18:00 that day

#### Scenario: Unchecked again
- **WHEN** the user unchecks that habit at 10:00
- **THEN** the 18:00 reminder is scheduled again

### Requirement: Deadline reminders
For each open task (of an active project, or outside projects), each active project with an own deadline and each KR of an active objective with progress below 1 and an own deadline, the app SHALL schedule two notifications at the default reminder time: one on the date the deadline enters the lead time (deadline minus lead time days), showing "Due in N days", and one on the deadline date, showing "Due today". Reminders whose time has already passed SHALL NOT be scheduled.

#### Scenario: Task due date
- **WHEN** the lead time is 7 days, the default reminder time is 08:00 and an open task of an active project is due 2026-10-20
- **THEN** reminders are scheduled for 2026-10-13 08:00 ("Due in 7 days") and 2026-10-20 08:00 ("Due today")

#### Scenario: Lead date already passed
- **WHEN** it is 2026-10-15 and the task is due 2026-10-20 with a lead time of 7 days
- **THEN** only the reminder on 2026-10-20 is scheduled

#### Scenario: Completed task
- **WHEN** the task is completed
- **THEN** its reminders are no longer scheduled

#### Scenario: Inherited deadline
- **WHEN** an active project has no own deadline and inherits one from its KR
- **THEN** no reminder is scheduled for the project itself

#### Scenario: Standalone task
- **WHEN** the standalone task "Tax return" is due 2026-10-20
- **THEN** its reminders are scheduled like those of a project task

### Requirement: Reminders stay up to date
The scheduled reminders SHALL reflect the current habits, habit checks, tasks, projects, key results, objectives, weekly reviews and settings: they SHALL be recomputed after any change to them, when the app starts and when it returns to the foreground. Reminders SHALL be scheduled for the next 14 days.

#### Scenario: Deadline moved
- **WHEN** a project's deadline is changed from 2026-10-20 to 2026-10-25
- **THEN** no reminder remains for 2026-10-20 and reminders exist for the new date

#### Scenario: Habit deactivated
- **WHEN** a habit is switched to inactive
- **THEN** its scheduled reminders are removed

#### Scenario: Horizon
- **WHEN** a daily habit is active
- **THEN** reminders are scheduled for it for today (if the time has not passed) and the following 13 days, and not beyond

#### Scenario: Review day changed
- **WHEN** the review day is changed from Sunday to Monday
- **THEN** the review reminders move to Mondays

### Requirement: Open from a reminder
Tapping a notification SHALL open the app on the related screen: Home for a habit reminder, the task page for a task reminder, the project detail for a project reminder, the KR's edit form for a KR reminder, and the weekly review for a weekly review reminder. This SHALL also work when the app was not running.

#### Scenario: Tap a task reminder
- **WHEN** the user taps the reminder of the task "Book venue"
- **THEN** the app opens the task page of "Book venue"

#### Scenario: Tap a habit reminder while the app is closed
- **WHEN** the app is not running and the user taps a habit reminder
- **THEN** the app starts on Home

#### Scenario: Tap the weekly review reminder
- **WHEN** the user taps the weekly review reminder
- **THEN** the guided weekly review opens

### Requirement: Android only
Reminders SHALL only be scheduled on Android. In the browser the app SHALL NOT schedule or request notifications.

#### Scenario: Web
- **WHEN** the app runs in Chrome
- **THEN** no notification permission is requested and nothing is scheduled

### Requirement: Notification permission
On Android versions that require a runtime permission for notifications, the app SHALL ask for it on start while reminders are switched on and the permission has not been decided. When the permission is denied, the Settings screen SHALL say that notifications are blocked in the system settings.

#### Scenario: First start on Android 13
- **WHEN** the app starts for the first time on Android 13 with reminders on
- **THEN** the system asks whether Orbit may send notifications

#### Scenario: Permission denied
- **WHEN** the user denied the permission
- **THEN** Settings shows that notifications are blocked in the system settings

### Requirement: Reminders can be switched off
When reminders are switched off in Settings, all scheduled reminders SHALL be cancelled and none SHALL be scheduled until they are switched on again.

#### Scenario: Switch off
- **WHEN** the user switches reminders off
- **THEN** no reminder is scheduled any more

#### Scenario: Switch on again
- **WHEN** the user switches reminders on again
- **THEN** the habit and deadline reminders for the next 14 days are scheduled

### Requirement: Weekly review reminder
The app SHALL schedule a reminder on every review day within the next 14 days at the review time (see settings), unless the review of the week that would be reviewed on that day (see weekly-review, "Review week") is already completed. It SHALL read "Weekly review" and name the week.

#### Scenario: Sunday evening
- **WHEN** the review day is Sunday, the review time is 18:00 and the week of 2026-10-05 has no completed review
- **THEN** a reminder is scheduled for 2026-10-11 18:00

#### Scenario: Already reviewed
- **WHEN** the review of that week is completed before Sunday 18:00
- **THEN** no reminder is shown that Sunday
