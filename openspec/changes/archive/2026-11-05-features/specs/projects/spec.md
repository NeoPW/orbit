# Spec Delta

## MODIFIED Requirements

### Requirement: Create a project
The user SHALL be able to create a project with a title (required), optional description, optional area, optional goal it serves, importance from 1 to 5 (default 3), optional deadline and status (`active`, `backlog`, `paused` or `completed`; default `active`). Only active goals SHALL be offered.

#### Scenario: Create active project for a goal
- **WHEN** the user creates an active project serving an active goal
- **THEN** the project appears under that goal in Plan and in Home's active projects

#### Scenario: Create backlog project
- **WHEN** the user creates a project with status backlog
- **THEN** the project appears in the Backlog and not in the goals section

#### Scenario: Missing title
- **WHEN** the user tries to save a project without a title
- **THEN** the project is not saved and the title field shows an error

## REMOVED Requirements

### Requirement: Next step
**Reason**: A project no longer has one next step entered as text; its next steps are its tasks marked as next steps, and a project can have several (SPEC §4 Task, §5 Next steps).
**Migration**: See tasks, "Mark next steps" and "Prompt after the last next step".
