# objectives Specification

## Purpose

Lets the user define time-boxed objectives they are working toward, move them through their lifecycle (active, completed, archived) and remove them.

## Requirements

### Requirement: Create objective
The user SHALL be able to create an objective with a title, an optional description, a start date and an end date. Title, start date and end date are required; the end date SHALL NOT be before the start date. New objectives have status `active` and are added after existing objectives.

#### Scenario: Create valid objective
- **WHEN** the user creates an objective "Get fit" from 2026-10-01 to 2026-12-31
- **THEN** the objective is saved with status active and appears in the Plan tab

#### Scenario: Missing title
- **WHEN** the user tries to save an objective without a title
- **THEN** the objective is not saved and the title field shows an error

#### Scenario: End before start
- **WHEN** the user picks an end date earlier than the start date
- **THEN** the objective is not saved and the date fields show an error

### Requirement: Edit objective
The user SHALL be able to edit an objective's title, description, dates and status (`active`, `completed`, `archived`), with the same validation as on creation.

#### Scenario: Change end date
- **WHEN** the user changes an objective's end date
- **THEN** the effective deadline of its KRs without their own deadline changes accordingly

#### Scenario: Complete objective
- **WHEN** the user sets an objective's status to completed
- **THEN** the objective disappears from the Plan tab's objectives section and appears in the Archive

### Requirement: Delete objective together with its key results
The user SHALL be able to delete an objective after confirming. The confirmation SHALL state that its key results (with their count) are deleted as well. Deleting SHALL soft-delete the objective and all its key results; projects and habits linked to those key results SHALL keep existing without the KR link.

#### Scenario: Confirmation names KRs
- **WHEN** the user starts deleting an objective with 3 key results
- **THEN** the confirmation states that the objective and its 3 key results will be deleted

#### Scenario: Linked projects survive
- **WHEN** the user deletes an objective whose KR has a linked active project, and confirms
- **THEN** the objective and KR are gone and the project appears under "Projects without a KR"

#### Scenario: Cancel delete
- **WHEN** the user cancels the delete confirmation
- **THEN** the objective and its key results are unchanged
