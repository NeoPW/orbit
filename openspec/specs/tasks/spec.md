# tasks Specification

## Purpose

Lets the user manage the concrete to-dos of a project: adding, editing, completing and deleting tasks, choosing which open task is the project's next step, and choosing a new next step when the current one is done.

## Requirements

### Requirement: Add task
The user SHALL be able to add a task with a title (required, trimmed), an optional due date and an optional assignment: from the project detail (assigned to that project), from the new-task button on Home, and from the Plan tab's create action. The new task SHALL be open.

#### Scenario: Add task
- **WHEN** the user adds the task "Book venue" with due date 2026-10-20 in a project's detail
- **THEN** an open task "Book venue" due 20-10-2026 is listed in the project's open tasks

#### Scenario: Missing title
- **WHEN** the user tries to add a task with an empty title
- **THEN** no task is created and the title field shows an error

#### Scenario: Standalone task from Home
- **WHEN** the user taps the new-task button on Home, types "Tax return" and saves
- **THEN** an open standalone task "Tax return" exists and is listed in Home's Tasks section

### Requirement: Open task order
The project's open tasks SHALL be ordered by due date (earliest first, tasks without due date last), then by creation time (oldest first). The next-step task SHALL be marked in the list.

#### Scenario: Order
- **WHEN** a project has open tasks A (no due date, created first), B (due 2026-10-20) and C (due 2026-10-10)
- **THEN** they are listed C, B, A

### Requirement: Edit task
The user SHALL be able to edit a task's title, notes, due date and assignment, including clearing the due date and the assignment. A task SHALL NOT be saved without a title.

#### Scenario: Change due date
- **WHEN** the user changes a task's due date from 2026-10-20 to 2026-10-15
- **THEN** the task shows 15-10-2026 and the list order updates

### Requirement: Complete task
Completing an open task SHALL set its status to `done` and `completed_at` to now, remove it from the open tasks, and create a log entry with source `task`, the task, the task's project or KR (if any), the current time, no duration and the task title as note.

#### Scenario: Complete task
- **WHEN** the user completes the task "Book venue"
- **THEN** the task is no longer listed as open and the project's log shows an entry "Book venue" from source task

#### Scenario: Complete a standalone task
- **WHEN** the user completes the standalone task "Tax return"
- **THEN** its task page lists an entry "Tax return" from source task

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

### Requirement: Task assignment
A task SHALL be standalone or assigned to exactly one project, one key result or one objective. The assignment SHALL be chosen when creating or editing a task and SHALL be changeable later, including to none. Deleting the project SHALL delete its tasks; deleting the key result or objective SHALL leave its tasks as standalone tasks.

#### Scenario: Assign to a key result
- **WHEN** the user creates the task "Book physio" assigned to the KR "Run 100 km"
- **THEN** the task is assigned to that KR and to no project or objective

#### Scenario: KR deleted
- **WHEN** a KR with an assigned open task is deleted
- **THEN** the task still exists and is standalone

#### Scenario: Only one assignment
- **WHEN** the user assigns a task that belongs to a project to an objective
- **THEN** the task belongs to the objective and no longer to the project, and if it was the project's next step the project has no next step

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

### Requirement: Reopen task
A done task SHALL be reopenable from its task page. Reopening SHALL set it back to open and clear its completion time; its log entries SHALL stay.

#### Scenario: Reopen
- **WHEN** the user reopens the done task "Book venue"
- **THEN** the task is open again and its earlier log entry is still listed

### Requirement: Log work on a task
The task page SHALL offer "Log work" with an optional duration and note. The entry SHALL belong to the task and, when the task is assigned to a project or KR, also to that project or KR.

#### Scenario: Log on a standalone task
- **WHEN** the user logs 30 minutes on the standalone task "Tax return"
- **THEN** the task page lists a 30-minute manual entry

### Requirement: Task rows
Wherever open tasks are listed as rows (project detail, Plan, objective and KR pages), a row SHALL show a checkbox that completes the task, the title, a next-step marker when it applies and a deadline badge. Tapping the row SHALL open the task page. A row SHALL NOT have its own action menu; editing, deleting and making a task the next step happen on the task page.

#### Scenario: No row menu
- **WHEN** a project's open tasks are listed in its detail
- **THEN** no task row has an action menu, and tapping "Book venue" opens its task page

#### Scenario: Complete from the row
- **WHEN** the user ticks the checkbox of "Book venue"
- **THEN** the task is completed with an Undo offer
