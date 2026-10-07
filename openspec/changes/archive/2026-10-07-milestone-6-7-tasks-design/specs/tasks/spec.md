# Spec Delta

## ADDED Requirements

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
Every task SHALL have a page showing its title, notes, deadline, status and assignment (the assigned project, KR or objective, tappable to open it, or "Standalone"), marked when it is its project's next step, and the log entries recorded for it, newest first. The page SHALL offer complete (with Undo), reopen, edit, delete and log work. The page SHALL have its own URL.

#### Scenario: Open from Home
- **WHEN** the user taps a task in the Tasks section of Home
- **THEN** the task page opens and shows its deadline and assignment

#### Scenario: Open the assigned item
- **WHEN** the user taps the assigned project on a task page
- **THEN** the project detail opens

#### Scenario: Missing task
- **WHEN** the task page of a deleted task is opened
- **THEN** it says the task was not found

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

## MODIFIED Requirements

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
