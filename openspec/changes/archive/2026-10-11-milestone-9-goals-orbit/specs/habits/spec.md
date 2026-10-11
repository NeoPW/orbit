# Spec Delta

## ADDED Requirements

### Requirement: Delete a habit
The user SHALL be able to delete a habit after confirming. A habit measure that was linked to the deleted habit SHALL keep existing without a linked habit.

#### Scenario: Delete habit linked to a measure
- **WHEN** the user deletes a habit that a habit measure is linked to, and confirms
- **THEN** the habit is gone and the measure has no linked habit

## MODIFIED Requirements

### Requirement: Habit list
The app SHALL provide a Habits screen, reachable from the Plan tab's More sheet, listing all habits with their title, linked project and/or goal (left out when there is none), a schedule summary, and whether they are active. Tapping a habit SHALL open its edit form in a sheet.

#### Scenario: Open habits
- **WHEN** the user opens Habits from the Plan tab
- **THEN** all non-deleted habits are listed, inactive ones visibly marked

#### Scenario: Edit from the list
- **WHEN** the user taps the habit "Stretch"
- **THEN** its edit form opens in a sheet over the Habits screen

### Requirement: Create habit
The user SHALL be able to create a habit with a title (required), an optional link to a project and/or a goal, a schedule type (`daily`, `weekdays` or `times_per_week`), an optional reminder time and an active flag (default on). Only projects that are not completed and active goals SHALL be offered for linking.

#### Scenario: Create daily habit
- **WHEN** the user creates a habit "Stretch" linked to a project with schedule daily
- **THEN** the habit appears in the Habits list as active with schedule "Daily"

#### Scenario: No link
- **WHEN** the user saves a habit "Meditate" without a project and without a goal
- **THEN** the habit is saved and appears in the Habits list without any link shown

#### Scenario: Link to a goal
- **WHEN** the user creates a habit "Read" linked to the goal "Learn Spanish"
- **THEN** the habit is listed on the page of "Learn Spanish"

### Requirement: Check habit
Checking a habit for today SHALL create a habit check for the habit and today's local date, and a log entry with source `habit`, the habit's linked project and goal (if any), the current time, no duration and the habit's title as note. A habit SHALL have at most one check per date.

#### Scenario: Check habit
- **WHEN** the user checks the habit "Run" linked to project "Marathon"
- **THEN** a check for today exists and a log entry "Run" from source habit is listed for "Marathon"

#### Scenario: Check a goal's habit
- **WHEN** the user checks the habit "Read" linked to the goal "Learn Spanish"
- **THEN** the log entry belongs to "Learn Spanish" and counts as work on it

#### Scenario: No duplicate check
- **WHEN** a habit is already checked today and a check is requested again
- **THEN** there is still exactly one check and one log entry for today

## REMOVED Requirements

### Requirement: Delete habit
**Reason**: Habit measures replace habit key results.
**Migration**: See "Delete a habit" above.
