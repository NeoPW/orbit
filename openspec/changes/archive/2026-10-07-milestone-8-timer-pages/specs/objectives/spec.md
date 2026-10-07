# Spec Delta

## ADDED Requirements

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
