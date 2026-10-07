# Spec Delta

## MODIFIED Requirements

### Requirement: Habit list
The app SHALL provide a Habits screen, reachable from the Plan tab's More sheet, listing all habits with their title, linked project and/or KR (left out when there is none), a schedule summary, and whether they are active. Tapping a habit SHALL open its edit form in a sheet.

#### Scenario: Open habits
- **WHEN** the user opens Habits from the Plan tab
- **THEN** all non-deleted habits are listed, inactive ones visibly marked

#### Scenario: Edit from the list
- **WHEN** the user taps the habit "Stretch"
- **THEN** its edit form opens in a sheet over the Habits screen

### Requirement: Create habit
The user SHALL be able to create a habit with a title (required), an optional link to a project and/or a KR, a schedule type (`daily`, `weekdays` or `times_per_week`), an optional reminder time and an active flag (default on). Only projects that are not completed and KRs of active objectives SHALL be offered for linking.

#### Scenario: Create daily habit
- **WHEN** the user creates a habit "Stretch" linked to a project with schedule daily
- **THEN** the habit appears in the Habits list as active with schedule "Daily"

#### Scenario: No link
- **WHEN** the user saves a habit "Meditate" without a project and without a KR
- **THEN** the habit is saved and appears in the Habits list without any link shown
