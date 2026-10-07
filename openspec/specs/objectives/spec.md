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

### Requirement: Objective page
Every objective SHALL have a page with its own URL showing a header with its title, date range, a status chip and a deadline badge for its end date, its description, its key results in sort order with their progress (tapping one opens the KR page), an action to add a key result, and the open tasks assigned to it. The page SHALL offer Edit and Delete. The status chip SHALL offer the other statuses (`active`, `completed`, `archived`) and change the status immediately.

#### Scenario: Open from Plan
- **WHEN** the user taps the objective "Get fit" in the Plan tab on a phone
- **THEN** the objective page opens with its date range, key results and assigned tasks, not the edit form

#### Scenario: Complete from the status chip
- **WHEN** the user chooses "Completed" in the status chip of an active objective
- **THEN** the objective's status is completed and it is listed in the Archive

#### Scenario: Missing objective
- **WHEN** the page of a deleted objective is opened
- **THEN** it says the objective was not found

### Requirement: Objective deadline badge
An active objective SHALL show a deadline badge for its end date wherever it is listed and on its page: amber when the end date is within the deadline lead time, red "Overdue" when the end date has passed, neutral otherwise. Completed and archived objectives SHALL NOT be marked overdue.

#### Scenario: Overdue objective
- **WHEN** today is 2026-10-07 and an active objective ended on 2026-09-30
- **THEN** it shows a red "Overdue" badge

#### Scenario: Ending soon
- **WHEN** the lead time is 7 days and an active objective ends in 3 days
- **THEN** its badge is amber and reads "Due in 3 days"

#### Scenario: Completed objective
- **WHEN** a completed objective's end date has passed
- **THEN** it is not marked overdue
