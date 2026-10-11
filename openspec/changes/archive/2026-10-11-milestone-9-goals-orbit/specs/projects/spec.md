# Spec Delta

## ADDED Requirements

### Requirement: Effective deadline from the goal
A project's effective deadline SHALL be its own deadline if set, otherwise the end date of the goal it serves, otherwise none. The project SHALL show its effective deadline and indicate when it is inherited from the goal.

#### Scenario: Own deadline
- **WHEN** a project has deadline 2026-10-20 and its goal ends 2026-12-31
- **THEN** the project's effective deadline is 2026-10-20

#### Scenario: Inherited from the goal
- **WHEN** a project has no deadline and its goal ends 2026-12-31
- **THEN** the project's effective deadline is 2026-12-31, marked as inherited

#### Scenario: No deadline anywhere
- **WHEN** a project has no deadline and serves no goal
- **THEN** the project has no effective deadline and shows none

### Requirement: Edit a project
The user SHALL be able to change every field of a project. Changes SHALL be reflected immediately wherever the project is shown.

#### Scenario: Change goal
- **WHEN** the user moves an active project from goal A to goal B
- **THEN** the project is shown under goal B and no longer under goal A

#### Scenario: Keep a goal that is no longer active
- **WHEN** the user edits a project that serves a completed goal
- **THEN** the form still shows that goal and saving keeps it

### Requirement: Create a project
The user SHALL be able to create a project with a title (required), optional description, optional area, optional goal it serves, importance from 1 to 5 (default 3), optional deadline and status (`active`, `backlog`, `paused` or `completed`; default `active`). Only active goals SHALL be offered.

#### Scenario: Create active project for a goal
- **WHEN** the user creates an active project serving an active goal
- **THEN** the project appears under that goal in the Plan tab and as its moon on Home

#### Scenario: Create backlog project
- **WHEN** the user creates a project with status backlog
- **THEN** the project appears in the Backlog and not in the goals section

#### Scenario: Missing title
- **WHEN** the user tries to save a project without a title
- **THEN** the project is not saved and the title field shows an error

### Requirement: Completion date
Setting a project's status to `completed` SHALL record the completion time; changing the status away from `completed` SHALL clear it. The week of the completion time is the week the project counts as finished in (see week-summary).

#### Scenario: Complete
- **WHEN** the user completes the project "Garden" on Tuesday 2026-10-13
- **THEN** "Garden" has a completion time on 2026-10-13

#### Scenario: Reopen
- **WHEN** the user sets the completed project "Garden" back to active
- **THEN** it has no completion time

## MODIFIED Requirements

### Requirement: Status changes
The user SHALL be able to change a project's status between `active`, `backlog`, `paused` and `completed`. The Plan tab SHALL update immediately to show the project in the section that matches its new status.

#### Scenario: Pause an active project
- **WHEN** the user sets an active project's status to paused
- **THEN** the project disappears from the goals section and appears in the Backlog

#### Scenario: Complete a project
- **WHEN** the user sets a project's status to completed
- **THEN** the project appears in the Archive and nowhere else in the Plan tab

## REMOVED Requirements

### Requirement: Create project
**Reason**: Projects serve a goal instead of a key result.
**Migration**: See "Create a project" above.

### Requirement: Edit project
**Reason**: Projects serve a goal instead of a key result.
**Migration**: See "Edit a project" above.

### Requirement: Effective project deadline
**Reason**: Projects inherit their goal's end date; KR deadlines no longer exist.
**Migration**: See "Effective deadline from the goal" above.
