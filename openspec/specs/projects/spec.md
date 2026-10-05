# projects Specification

## Purpose

Lets the user manage projects — bodies of work with an area, an optional KR link, an importance, a deadline, a status and a next step — and computes each project's effective deadline.

## Requirements

### Requirement: Create project
The user SHALL be able to create a project with a title (required), optional description, optional area, optional KR link, importance from 1 to 5 (default 3), optional deadline and status (`active`, `backlog`, `paused` or `completed`; default `active`). Only KRs of active objectives SHALL be offered for linking.

#### Scenario: Create active project with KR
- **WHEN** the user creates an active project linked to a KR of an active objective
- **THEN** the project appears under that KR in the Plan tab

#### Scenario: Create backlog project
- **WHEN** the user creates a project with status backlog
- **THEN** the project appears in the Backlog and not in the objectives section

#### Scenario: Missing title
- **WHEN** the user tries to save a project without a title
- **THEN** the project is not saved and the title field shows an error

### Requirement: Edit project
The user SHALL be able to change every field of a project. Changes SHALL be reflected immediately wherever the project is shown.

#### Scenario: Change KR link
- **WHEN** the user moves an active project from KR A to KR B
- **THEN** the project is shown under KR B and no longer under KR A

### Requirement: Status changes
The user SHALL be able to change a project's status between `active`, `backlog`, `paused` and `completed`. The Plan tab SHALL update immediately to show the project in the section that matches its new status.

#### Scenario: Pause an active project
- **WHEN** the user sets an active project's status to paused
- **THEN** the project disappears from the objectives section and appears in the Backlog

#### Scenario: Complete a project
- **WHEN** the user sets a project's status to completed
- **THEN** the project appears in the Archive and nowhere else in the Plan tab

### Requirement: Effective project deadline
A project's effective deadline SHALL be its own deadline if set, otherwise the effective deadline of its linked KR, otherwise none. The project SHALL show its effective deadline and indicate when it is inherited from the KR.

#### Scenario: Own deadline
- **WHEN** a project has deadline 2026-10-20 and its KR's effective deadline is 2026-12-31
- **THEN** the project's effective deadline is 2026-10-20

#### Scenario: Inherited from KR deadline
- **WHEN** a project has no deadline and its KR has deadline 2026-11-15
- **THEN** the project's effective deadline is 2026-11-15, marked as inherited

#### Scenario: Inherited from objective end date
- **WHEN** a project has no deadline and its KR has no deadline and the KR's objective ends 2026-12-31
- **THEN** the project's effective deadline is 2026-12-31, marked as inherited

#### Scenario: No deadline anywhere
- **WHEN** a project has no deadline and no KR
- **THEN** the project has no effective deadline and shows none

### Requirement: Next step
The user SHALL be able to set a project's next step as text in the project form. Setting it when none exists SHALL create an open task for the project and link it as the next step; changing the text SHALL update that task's title; clearing it SHALL remove the link and leave the task as an open task of the project.

#### Scenario: Set first next step
- **WHEN** the user enters "Draft outline" as next step of a project without one and saves
- **THEN** an open task "Draft outline" exists for the project and is the project's next step

#### Scenario: Change next step
- **WHEN** the user changes the next step text to "Write intro" and saves
- **THEN** the same task now has the title "Write intro" and no new task is created

#### Scenario: Clear next step
- **WHEN** the user clears the next step text and saves
- **THEN** the project has no next step and the task remains open

### Requirement: Delete project
The user SHALL be able to delete a project after confirming. Deleting SHALL soft-delete the project and its tasks; habits linked to the project SHALL keep existing without the project link.

#### Scenario: Delete project
- **WHEN** the user deletes a project and confirms
- **THEN** the project and its tasks are no longer shown, and its habits remain without a project link
