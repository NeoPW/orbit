# Spec Delta

## Purpose

Lets the user manage the concrete to-dos of a project: adding, editing, completing and deleting tasks, choosing which open task is the project's next step, and choosing a new next step when the current one is done.

## ADDED Requirements

### Requirement: Add task
In the project detail the user SHALL be able to add a task with a title (required, trimmed) and an optional due date. The new task SHALL be open and belong to the project.

#### Scenario: Add task
- **WHEN** the user adds the task "Book venue" with due date 2026-10-20
- **THEN** an open task "Book venue" due 20-10-2026 is listed in the project's open tasks

#### Scenario: Missing title
- **WHEN** the user tries to add a task with an empty title
- **THEN** no task is created and the title field shows an error

### Requirement: Open task order
The project's open tasks SHALL be ordered by due date (earliest first, tasks without due date last), then by creation time (oldest first). The next-step task SHALL be marked in the list.

#### Scenario: Order
- **WHEN** a project has open tasks A (no due date, created first), B (due 2026-10-20) and C (due 2026-10-10)
- **THEN** they are listed C, B, A

### Requirement: Edit task
The user SHALL be able to edit an open task's title, notes and due date, including clearing the due date. A task SHALL NOT be saved without a title.

#### Scenario: Change due date
- **WHEN** the user changes a task's due date from 2026-10-20 to 2026-10-15
- **THEN** the task shows 15-10-2026 and the list order updates

### Requirement: Complete task
Completing an open task SHALL set its status to `done` and `completed_at` to now, remove it from the open tasks, and create a log entry with source `task`, the task's project, the current time, no duration and the task title as note.

#### Scenario: Complete task
- **WHEN** the user completes the task "Book venue"
- **THEN** the task is no longer listed as open and the project's log shows an entry "Book venue" from source task

### Requirement: Undo completing a task
After a task is completed, the app SHALL offer an Undo action for a few seconds. Undo SHALL set the task back to `open`, clear `completed_at` and delete the log entry created by the completion. Undo SHALL NOT change the project's next step.

#### Scenario: Undo
- **WHEN** the user completes a task and taps Undo
- **THEN** the task is open again and its log entry is gone

### Requirement: Delete task
The user SHALL be able to delete a task after confirming. Deleting the project's next-step task SHALL leave the project without a next step. Log entries created by completing it SHALL remain.

#### Scenario: Delete next-step task
- **WHEN** the user deletes the task that is the project's next step and confirms
- **THEN** the task is gone and the project has no next step

### Requirement: Choose next step
The user SHALL be able to make any open task of the project its next step, and to set a next step by entering a new task title. The previous next-step task, if any, SHALL stay an open task.

#### Scenario: Pick existing task
- **WHEN** the project's next step is "Draft outline" and the user makes the open task "Book venue" the next step
- **THEN** "Book venue" is the next step and "Draft outline" is still an open task

### Requirement: Next-step prompt
Completing the project's next-step task, on Home or in the project detail, SHALL first ask "What's the next step?". The user SHALL be able to enter a new task (created and linked), pick another open task of the project (linked), skip (no next step), or cancel. On any choice except cancel the task SHALL be completed as in "Complete task". Cancel SHALL change nothing.

#### Scenario: New next step
- **WHEN** the user completes the next step "Draft outline" and enters "Write intro"
- **THEN** "Draft outline" is done, a new open task "Write intro" exists and is the next step

#### Scenario: Pick open task
- **WHEN** the user completes the next step and picks the open task "Book venue"
- **THEN** the old next step is done and "Book venue" is the next step

#### Scenario: Skip
- **WHEN** the user completes the next step and chooses skip
- **THEN** the task is done and the project has no next step

#### Scenario: Cancel
- **WHEN** the user opens the prompt and cancels it
- **THEN** the task stays open, stays the next step and no log entry is created
