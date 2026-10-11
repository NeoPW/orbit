# Spec Delta

## MODIFIED Requirements

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

### Requirement: Reminders stay up to date
The scheduled reminders SHALL reflect the current habits, habit checks, tasks, projects, goals, weekly reviews and settings: they SHALL be recomputed after any change to them, when the app starts and when it returns to the foreground. Reminders SHALL be scheduled for the next 14 days.

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

#### Scenario: Former KR reminders
- **WHEN** the app is updated while deadline reminders of key results are scheduled
- **THEN** those reminders are removed at the next recompute

### Requirement: Open from a reminder
Tapping a notification SHALL open the app on the related screen: Home for a habit reminder and the running timer, the task page for a task reminder, the project detail for a project reminder, and the weekly review for a weekly review reminder. This SHALL also work when the app was not running.

#### Scenario: Tap a task reminder
- **WHEN** the user taps the reminder of the task "Book venue"
- **THEN** the app opens the task page of "Book venue"

#### Scenario: Tap a habit reminder while the app is closed
- **WHEN** the app is not running and the user taps a habit reminder
- **THEN** the app starts on Home

#### Scenario: Tap the weekly review reminder
- **WHEN** the user taps the weekly review reminder
- **THEN** the guided weekly review opens

#### Scenario: Tap a KR reminder
- **WHEN** the user taps a deadline reminder of the key result "Run 100 km" that was shown before the update
- **THEN** the goal page of the goal it now belongs to opens
