# notifications Specification

## Purpose

Reminds the user on Android of habits that are due and of upcoming deadlines through local notifications, kept up to date with the data and settings, and opening the related screen when tapped.

## Requirements

### Requirement: Habit reminders
For every active habit and every date on which it is due (see habits, "Habit due today") and not checked, the app SHALL show a notification on that date at the habit's reminder time, or at the default reminder time (see settings) when the habit has none. The notification SHALL show the habit's title and the title of its linked project or goal, if any.

#### Scenario: Own reminder time
- **WHEN** an active daily habit "Stretch" has reminder time 07:30
- **THEN** a notification "Stretch" is shown at 07:30 on each day it is not yet checked

#### Scenario: Default reminder time
- **WHEN** an active daily habit has no reminder time and the default reminder time is 08:00
- **THEN** its notifications are shown at 08:00

#### Scenario: Not due
- **WHEN** a habit has weekdays Monday, Wednesday and Friday
- **THEN** no notification is shown for it on Tuesdays

#### Scenario: Inactive habit
- **WHEN** a habit is inactive
- **THEN** no notification is shown for it

#### Scenario: Weekly target reached
- **WHEN** a habit with 2 times per week has been checked twice this week
- **THEN** no notification is shown for it for the rest of the week

### Requirement: No reminder for a checked habit
Checking a habit SHALL cancel its reminder for that date. Unchecking it before the reminder time SHALL schedule the reminder again.

#### Scenario: Checked before the reminder
- **WHEN** a habit with reminder time 18:00 is checked at 09:00
- **THEN** no reminder for it is shown at 18:00 that day

#### Scenario: Unchecked again
- **WHEN** the user unchecks that habit at 10:00
- **THEN** the 18:00 reminder is scheduled again

### Requirement: Deadline reminders
For each open task (of an active project, or outside projects) and each active project with an own deadline, the app SHALL schedule two notifications at the default reminder time: one on the date the deadline enters the lead time (deadline minus lead time days), showing "Due in N days", and one on the deadline date, showing "Due today". Reminders whose time has already passed SHALL NOT be scheduled.

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
- **WHEN** an active project has no own deadline and inherits one from its goal
- **THEN** no reminder is scheduled for the project itself

#### Scenario: Standalone task
- **WHEN** the standalone task "Tax return" is due 2026-10-20
- **THEN** its reminders are scheduled like those of a project task

### Requirement: Reminders follow changes
The reminders SHALL reflect the current habits, habit checks, tasks, projects, weekly reviews and settings: they SHALL be recomputed after any change to them (also from a sync), when the app starts, at midnight and when the computer wakes up.

#### Scenario: Deadline moved
- **WHEN** a project's deadline is changed from 2026-10-20 to 2026-10-25
- **THEN** no reminder is shown on 2026-10-20 and reminders follow for the new date

#### Scenario: Habit deactivated
- **WHEN** a habit is switched to inactive
- **THEN** no further reminder is shown for it

#### Scenario: Review day changed
- **WHEN** the review day is changed from Sunday to Monday
- **THEN** the review reminder comes on Monday

### Requirement: Open from a notification
Clicking a notification SHALL show the window and open the related screen: Home for a habit reminder, the task page for a task reminder, the project detail for a project reminder, the guided weekly review for the review reminder, and focus mode for the end of a focus session.

#### Scenario: Click a task reminder
- **WHEN** the user clicks the reminder of the task "Book venue" while the window is in the tray
- **THEN** the window is shown with the task page of "Book venue"

#### Scenario: Click the weekly review reminder
- **WHEN** the user clicks the weekly review reminder
- **THEN** the guided weekly review opens

### Requirement: Desktop notifications while running
Reminders SHALL be shown as desktop notifications by the desktop app while it runs, also while its window is hidden in the tray. A reminder whose time passed while the app was not running SHALL NOT be shown later. The browser build SHALL NOT request permission for or show notifications.

#### Scenario: Window in the tray
- **WHEN** the window is closed to the tray and a habit's reminder time comes
- **THEN** the habit reminder is shown

#### Scenario: App not running
- **WHEN** the app was not running at 08:00 and is started at 09:00
- **THEN** the 08:00 reminders of that day are not shown

#### Scenario: Browser
- **WHEN** the app runs in Chrome
- **THEN** no notification permission is requested and no notification is shown

### Requirement: Reminders can be switched off
When reminders are switched off in Settings, no habit, deadline or weekly review reminder SHALL be shown until they are switched on again. The end of a focus session SHALL still be notified.

#### Scenario: Switch off
- **WHEN** the user switches reminders off
- **THEN** no reminder is shown any more

#### Scenario: Switch on again
- **WHEN** the user switches reminders on again
- **THEN** the habit, deadline and weekly review reminders are shown again from then on

### Requirement: Weekly review reminder
The app SHALL show a reminder on the review day at the review time (see settings), unless the review of the week that would be reviewed on that day (see weekly-review, "Review week") is already completed. It SHALL read "Weekly review" and name the week.

#### Scenario: Sunday evening
- **WHEN** the review day is Sunday, the review time is 18:00 and the week of 2026-10-05 has no completed review
- **THEN** a reminder is shown on 2026-10-11 at 18:00

#### Scenario: Already reviewed
- **WHEN** the review of that week is completed before Sunday 18:00
- **THEN** no reminder is shown that Sunday

### Requirement: End of a focus session
When a focus session with a planned length reaches that length, the desktop app SHALL show a notification with what the session runs for and the planned length, whatever the reminders switch, and the app SHALL play a short sound, also in the browser. The timer SHALL keep running.

#### Scenario: 25 minutes over
- **WHEN** a 25-minute session for "Thesis" reaches 25 minutes
- **THEN** a notification "Thesis: 25 minutes done" is shown, a sound plays and the timer goes on into overtime

#### Scenario: Open-ended session
- **WHEN** a session without planned length runs for 2 hours
- **THEN** no notification or sound comes
