# Spec Delta

## MODIFIED Requirements

### Requirement: Habit list
The Plan screen SHALL have a Habits section listing all habits with their title, linked project and/or goal (left out when there is none), a schedule summary, and whether they are active. Clicking a habit SHALL open its edit form in a sheet; the section SHALL offer "New habit".

#### Scenario: Open habits
- **WHEN** the user opens Plan
- **THEN** the Habits section lists all non-deleted habits, inactive ones visibly marked

#### Scenario: Edit from the list
- **WHEN** the user clicks the habit "Stretch"
- **THEN** its edit form opens in a sheet over Plan
