# Spec Delta

## ADDED Requirements

### Requirement: Weekly review reminder
The app SHALL schedule a reminder on every review day within the next 14 days at the review time (see settings), unless the review of the week that would be reviewed on that day (see weekly-review, "Review week") is already completed. It SHALL read "Weekly review" and name the week.

#### Scenario: Sunday evening
- **WHEN** the review day is Sunday, the review time is 18:00 and the week of 2026-10-05 has no completed review
- **THEN** a reminder is scheduled for 2026-10-11 18:00

#### Scenario: Already reviewed
- **WHEN** the review of that week is completed before Sunday 18:00
- **THEN** no reminder is shown that Sunday

## MODIFIED Requirements

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
Tapping a notification SHALL open the app on the related screen: Home for a habit reminder, the project detail for a task or project reminder, the KR's edit form for a KR reminder, and the weekly review for a weekly review reminder. This SHALL also work when the app was not running.

#### Scenario: Tap a task reminder
- **WHEN** the user taps the reminder of a task of project "Thesis"
- **THEN** the app opens the detail of "Thesis"

#### Scenario: Tap a habit reminder while the app is closed
- **WHEN** the app is not running and the user taps a habit reminder
- **THEN** the app starts on Home

#### Scenario: Tap the weekly review reminder
- **WHEN** the user taps the weekly review reminder
- **THEN** the guided weekly review opens
