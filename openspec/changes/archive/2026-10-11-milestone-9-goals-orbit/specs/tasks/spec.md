# Spec Delta

## ADDED Requirements

### Requirement: Assignment to a project or goal
A task SHALL be standalone or assigned to exactly one project or one goal. The assignment SHALL be chosen when creating or editing a task and SHALL be changeable later, including to none. Deleting the project SHALL delete its tasks; deleting the goal SHALL leave its tasks as standalone tasks.

#### Scenario: Assign to a goal
- **WHEN** the user creates the task "Book physio" assigned to the goal "Get fit"
- **THEN** the task is assigned to that goal and to no project

#### Scenario: Goal deleted
- **WHEN** a goal with an assigned open task is deleted
- **THEN** the task still exists and is standalone

#### Scenario: Only one assignment
- **WHEN** the user assigns a task that belongs to a project to a goal
- **THEN** the task belongs to the goal and no longer to the project, and if it was the project's next step the project has no next step

## MODIFIED Requirements

### Requirement: Complete task
Completing an open task SHALL set its status to `done` and `completed_at` to now, remove it from the open tasks, and create a log entry with source `task`, the task, the task's project or goal (if any), the current time, no duration and the task title as note.

#### Scenario: Complete task
- **WHEN** the user completes the task "Book venue"
- **THEN** the task is no longer listed as open and the project's log shows an entry "Book venue" from source task

#### Scenario: Complete a standalone task
- **WHEN** the user completes the standalone task "Tax return"
- **THEN** its task page lists an entry "Tax return" from source task

#### Scenario: Complete a goal's task
- **WHEN** the user completes the task "Book physio", assigned to the goal "Get fit"
- **THEN** the entry belongs to the task and to "Get fit" and counts as work on "Get fit"

### Requirement: Task page
Every task SHALL have a page showing its title, notes, deadline, status and assignment (the assigned project or goal, tappable to open it, or "Standalone"), marked when it is its project's next step, and the log entries recorded for it, newest first. The page SHALL offer complete (with Undo), reopen, edit, delete and log work, and for an open project task that is not the next step "Make next step". The page SHALL have its own URL.

#### Scenario: Open from Home
- **WHEN** the user taps a task in the Tasks section of Home
- **THEN** the task page opens and shows its deadline and assignment

#### Scenario: Open the assigned item
- **WHEN** the user taps the assigned project on a task page
- **THEN** the project detail opens

#### Scenario: Open the assigned goal
- **WHEN** the user taps the assigned goal "Get fit" on a task page
- **THEN** the goal page of "Get fit" opens

#### Scenario: Missing task
- **WHEN** the task page of a deleted task is opened
- **THEN** it says the task was not found

#### Scenario: Make next step
- **WHEN** the project "Wedding" has the next step "Draft outline" and the user taps "Make next step" on the page of its open task "Book venue"
- **THEN** "Book venue" is the next step and the page shows the next-step marker

#### Scenario: No next-step action outside projects
- **WHEN** the page of a standalone task is shown
- **THEN** it offers no "Make next step"

### Requirement: Log work on a task
The task page SHALL offer "Log work" with an optional duration and note. The entry SHALL belong to the task and, when the task is assigned to a project or goal, also to that project or goal.

#### Scenario: Log on a standalone task
- **WHEN** the user logs 30 minutes on the standalone task "Tax return"
- **THEN** the task page lists a 30-minute manual entry

#### Scenario: Log on a goal's task
- **WHEN** the user logs 20 minutes on the task "Book physio", assigned to "Get fit"
- **THEN** the entry belongs to the task and to "Get fit"

### Requirement: Task rows
Wherever open tasks are listed as rows (project detail, Plan and goal pages), a row SHALL show a checkbox that completes the task, the title, a next-step marker when it applies and a deadline badge. Tapping the row SHALL open the task page. A row SHALL NOT have its own action menu; editing, deleting and making a task the next step happen on the task page.

#### Scenario: No row menu
- **WHEN** a project's open tasks are listed in its detail
- **THEN** no task row has an action menu, and tapping "Book venue" opens its task page

#### Scenario: Complete from the row
- **WHEN** the user ticks the checkbox of "Book venue"
- **THEN** the task is completed with an Undo offer

## REMOVED Requirements

### Requirement: Task assignment
**Reason**: Tasks are assigned to a project or goal; key results and objectives no longer exist.
**Migration**: See "Assignment to a project or goal" above.
