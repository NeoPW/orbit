# Spec Delta

## ADDED Requirements

### Requirement: Task rows
Wherever open tasks are listed as rows (project detail, Plan, objective and KR pages), a row SHALL show a checkbox that completes the task, the title, a next-step marker when it applies and a deadline badge. Tapping the row SHALL open the task page. A row SHALL NOT have its own action menu; editing, deleting and making a task the next step happen on the task page.

#### Scenario: No row menu
- **WHEN** a project's open tasks are listed in its detail
- **THEN** no task row has an action menu, and tapping "Book venue" opens its task page

#### Scenario: Complete from the row
- **WHEN** the user ticks the checkbox of "Book venue"
- **THEN** the task is completed with an Undo offer

## MODIFIED Requirements

### Requirement: Task page
Every task SHALL have a page showing its title, notes, deadline, status and assignment (the assigned project, KR or objective, tappable to open it, or "Standalone"), marked when it is its project's next step, and the log entries recorded for it, newest first. The page SHALL offer complete (with Undo), reopen, edit, delete and log work, and for an open project task that is not the next step "Make next step". The page SHALL have its own URL.

#### Scenario: Open from Home
- **WHEN** the user taps a task in the Tasks section of Home
- **THEN** the task page opens and shows its deadline and assignment

#### Scenario: Open the assigned item
- **WHEN** the user taps the assigned project on a task page
- **THEN** the project detail opens

#### Scenario: Missing task
- **WHEN** the task page of a deleted task is opened
- **THEN** it says the task was not found

#### Scenario: Make next step
- **WHEN** the project "Wedding" has the next step "Draft outline" and the user taps "Make next step" on the page of its open task "Book venue"
- **THEN** "Book venue" is the next step and the page shows the next-step marker

#### Scenario: No next-step action outside projects
- **WHEN** the page of a standalone task is shown
- **THEN** it offers no "Make next step"
