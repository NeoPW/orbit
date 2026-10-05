# habits Specification

## Purpose

Lets the user define recurring habits, optionally linked to a project and/or key result, with a schedule and an optional reminder time. Checking habits off is added in a later milestone.

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
