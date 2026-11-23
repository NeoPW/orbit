# Spec Delta

## MODIFIED Requirements

### Requirement: Projects step
The projects step SHALL go through every active project with its open tasks. For each, the user SHALL be able to change its status (active, paused, backlog, completed), mark and unmark next steps, add a task as next step, change its deadline, and write its weekly note for the review week (see weekly-notes). Changes SHALL be applied immediately, as anywhere else in the app.

#### Scenario: Pause a project
- **WHEN** the user pauses the project "Garden" in the projects step
- **THEN** "Garden" has status paused and appears in the Backlog

#### Scenario: New next step
- **WHEN** the user adds "Order seeds" as next step of "Garden"
- **THEN** "Order seeds" is an open task of "Garden" and one of its next steps

#### Scenario: Importance and deadline
- **WHEN** the user sets the deadline of "Garden" to 2026-11-01
- **THEN** "Garden" has deadline 01-11-2026, and the step offers no importance control

#### Scenario: Weekly note
- **WHEN** the user writes "Beds prepared" for "Garden"
- **THEN** the note of "Garden" for the review week is "Beds prepared"
