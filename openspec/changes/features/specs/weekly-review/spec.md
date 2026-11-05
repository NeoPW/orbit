# Spec Delta

## MODIFIED Requirements

### Requirement: Projects step
The projects step SHALL go through every active project with its open tasks. For each, the user SHALL be able to change its status (active, paused, backlog, completed), mark and unmark next steps, add a task as next step, change its importance and deadline, and write its weekly note for the review week (see weekly-notes). Changes SHALL be applied immediately, as anywhere else in the app.

#### Scenario: Pause a project
- **WHEN** the user pauses the project "Garden" in the projects step
- **THEN** "Garden" has status paused and appears in the Backlog

#### Scenario: New next step
- **WHEN** the user adds "Order seeds" as next step of "Garden"
- **THEN** "Order seeds" is an open task of "Garden" and one of its next steps

#### Scenario: Importance and deadline
- **WHEN** the user sets the importance of "Garden" to 4 and its deadline to 2026-11-01
- **THEN** "Garden" has importance 4 and deadline 01-11-2026

#### Scenario: Weekly note
- **WHEN** the user writes "Beds prepared" for "Garden"
- **THEN** the note of "Garden" for the review week is "Beds prepared"

### Requirement: Goals step
The goals step SHALL list every active goal with its progress and, below it, its measures. The user SHALL be able to change the goal's status, a numeric measure's current value and a boolean measure's achieved state, and write the goal's weekly note for the review week; changes SHALL be applied immediately. Habit measures SHALL be shown with their progress but not be editable.

#### Scenario: Update a numeric value
- **WHEN** the user changes "Run 100 km" from 40 to 55 in the goals step
- **THEN** the measure's current value is 55 and the progress of its goal updates

#### Scenario: Habit measure read-only
- **WHEN** an active goal has a habit measure
- **THEN** it is shown with its progress and no input

#### Scenario: Goal without measures
- **WHEN** an active goal has no measures
- **THEN** it is listed without a percentage and without inputs

#### Scenario: Complete a goal
- **WHEN** the user sets "Get fit" to completed in the goals step
- **THEN** "Get fit" is completed and listed in the Archive

#### Scenario: Goal note
- **WHEN** the user writes "Two runs missed" for "Get fit"
- **THEN** the note of "Get fit" for the review week is "Two runs missed"
