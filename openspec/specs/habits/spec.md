# habits Specification

## Purpose

Lets the user define recurring habits, optionally linked to a project and/or key result, with a schedule and an optional reminder time. Habits that are due can be checked off for today, which logs the work.

## Requirements

### Requirement: Habit list
The app SHALL provide a Habits screen, reachable from the Plan tab, listing all habits with their title, linked project and/or KR (or "No link"), a schedule summary, and whether they are active.

#### Scenario: Open habits
- **WHEN** the user opens Habits from the Plan tab
- **THEN** all non-deleted habits are listed, inactive ones visibly marked

### Requirement: Create habit
The user SHALL be able to create a habit with a title (required), an optional link to a project and/or a KR, a schedule type (`daily`, `weekdays` or `times_per_week`), an optional reminder time and an active flag (default on). Only projects that are not completed and KRs of active objectives SHALL be offered for linking.

#### Scenario: Create daily habit
- **WHEN** the user creates a habit "Stretch" linked to a project with schedule daily
- **THEN** the habit appears in the Habits list as active with schedule "Daily"

#### Scenario: No link
- **WHEN** the user saves a habit "Meditate" without a project and without a KR
- **THEN** the habit is saved and appears in the Habits list marked "No link"

### Requirement: Schedule fields depend on schedule type
For `weekdays` the user SHALL pick at least one weekday (Monday first). For `times_per_week` the user SHALL enter a whole number from 1 to 7. For `daily` no extra field is shown.

#### Scenario: Weekdays without a day
- **WHEN** the user selects weekdays and picks no day
- **THEN** the habit is not saved and the weekday picker shows an error

#### Scenario: Weekdays saved
- **WHEN** the user selects weekdays and picks Monday, Wednesday and Friday
- **THEN** the habit's schedule summary shows "Mon, Wed, Fri"

#### Scenario: Times per week out of range
- **WHEN** the user selects times per week and enters 8
- **THEN** the habit is not saved and the field shows an error

### Requirement: Reminder time stored
The user SHALL be able to set or clear a reminder time of day for a habit. In this milestone the time is stored and displayed only; no notification is scheduled.

#### Scenario: Set reminder time
- **WHEN** the user sets a reminder time of 07:30 and saves
- **THEN** the habit shows the reminder time 07:30

### Requirement: Edit and deactivate habit
The user SHALL be able to edit every field of a habit, including switching it inactive and active again.

#### Scenario: Deactivate
- **WHEN** the user switches a habit's active flag off and saves
- **THEN** the habit is shown as inactive in the Habits list

### Requirement: Delete habit
The user SHALL be able to delete a habit after confirming. A habit KR that was linked to the deleted habit SHALL keep existing without a linked habit.

#### Scenario: Delete habit linked to KR
- **WHEN** the user deletes a habit that a habit KR is linked to, and confirms
- **THEN** the habit is gone and the KR has no linked habit

### Requirement: Habit due today
An active habit SHALL be due on a date when: for `daily`, always; for `weekdays`, the date's weekday is one of its weekdays; for `times_per_week`, it has fewer check-ins than `times_per_week` in that date's week, where weeks start on Monday. Inactive habits SHALL never be due.

#### Scenario: Daily
- **WHEN** an active habit has schedule daily
- **THEN** it is due every day

#### Scenario: Weekday not selected
- **WHEN** a habit has weekdays Monday, Wednesday and Friday and today is Tuesday
- **THEN** it is not due today

#### Scenario: Times per week reached
- **WHEN** a habit has 3 times per week and was checked on Monday, Tuesday and Wednesday
- **THEN** it is not due on Thursday of that week

#### Scenario: New week
- **WHEN** a habit has 3 times per week and was checked 3 times last week
- **THEN** it is due on Monday of the following week

#### Scenario: Inactive habit
- **WHEN** a daily habit is inactive
- **THEN** it is not due

### Requirement: Check habit
Checking a habit for today SHALL create a habit check for the habit and today's local date, and a log entry with source `habit`, the habit's linked project and KR (if any), the current time, no duration and the habit's title as note. A habit SHALL have at most one check per date.

#### Scenario: Check habit
- **WHEN** the user checks the habit "Run" linked to project "Marathon"
- **THEN** a check for today exists and a log entry "Run" from source habit is listed for "Marathon"

#### Scenario: No duplicate check
- **WHEN** a habit is already checked today and a check is requested again
- **THEN** there is still exactly one check and one log entry for today

### Requirement: Uncheck habit
Unchecking a habit for today SHALL remove today's habit check and the log entry created with it.

#### Scenario: Uncheck
- **WHEN** the user unchecks a habit that was checked today
- **THEN** the check and its log entry are gone
