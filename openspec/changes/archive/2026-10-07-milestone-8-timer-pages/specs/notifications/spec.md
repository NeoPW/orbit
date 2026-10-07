# Spec Delta

## ADDED Requirements

### Requirement: Running timer notification
While a timer runs, the app SHALL show an ongoing notification on Android with what the timer runs for and the elapsed time counting up live, including for a timer started on another device once it has synced. The notification SHALL NOT be dismissible by swiping, SHALL disappear when the timer is stopped or discarded on any device (after sync), and SHALL be shown independently of the reminders setting. Tapping it SHALL open Home.

#### Scenario: Timer started
- **WHEN** the user starts a timer for "Thesis" on the phone
- **THEN** an ongoing notification "Thesis" with a running time counter is shown

#### Scenario: Timer stopped
- **WHEN** the running timer is stopped
- **THEN** the notification disappears

#### Scenario: Reminders off
- **WHEN** reminders are switched off in Settings and a timer runs
- **THEN** the timer notification is still shown

#### Scenario: Rescheduling keeps it
- **WHEN** reminders are rescheduled while a timer runs
- **THEN** the timer notification stays

## MODIFIED Requirements

### Requirement: Open from a reminder
Tapping a notification SHALL open the app on the related screen: Home for a habit reminder and the running timer, the task page for a task reminder, the project detail for a project reminder, the KR page for a KR reminder, and the weekly review for a weekly review reminder. This SHALL also work when the app was not running.

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
- **WHEN** the user taps the deadline reminder of the KR "Run 100 km"
- **THEN** the KR page of "Run 100 km" opens
