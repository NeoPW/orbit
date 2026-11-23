# Spec Delta

## MODIFIED Requirements

### Requirement: Create a project
The user SHALL be able to create a project with a title (required), optional description, optional area, optional goal it serves, optional deadline and status (`active`, `backlog`, `paused` or `completed`; default `active`). Only active goals SHALL be offered. The project form SHALL have no importance field.

#### Scenario: Create active project for a goal
- **WHEN** the user creates an active project serving an active goal
- **THEN** the project appears under that goal in Plan and in Home's active projects

#### Scenario: Create backlog project
- **WHEN** the user creates a project with status backlog
- **THEN** the project appears in the Backlog and not in the goals section

#### Scenario: Missing title
- **WHEN** the user tries to save a project without a title
- **THEN** the project is not saved and the title field shows an error
