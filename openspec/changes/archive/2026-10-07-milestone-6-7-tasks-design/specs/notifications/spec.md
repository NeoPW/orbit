# Spec Delta

## MODIFIED Requirements

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
