# Spec Delta

## MODIFIED Requirements

### Requirement: Undo completing a task
After a task is completed, the app SHALL show the message "Task completed" with Undo (see visual-design, "Message cards"). Undo SHALL set the task back to `open`, clear `completed_at`, delete the log entry created by the completion and restore whether it was a next step. Next steps chosen in the next-step prompt SHALL stay.

#### Scenario: Undo
- **WHEN** the user completes a task and clicks Undo
- **THEN** the task is open again and its log entry is gone

### Requirement: Delete task
The user SHALL be able to delete a task after confirming. A deleted task SHALL no longer count as a next step of its project. Log entries created by completing it SHALL remain.

#### Scenario: Delete next-step task
- **WHEN** the user deletes the task that is the project's only next step and confirms
- **THEN** the task is gone and the project has no next step

### Requirement: Task page
Every task SHALL have a page with its own address showing its title, notes, deadline, importance (its own, or the inherited one marked as inherited), status and assignment (the assigned project or goal, clickable to open it, or "Standalone"), marked when it is one of its project's next steps, and the log entries recorded for it, newest first. The page SHALL offer complete (with Undo), reopen, edit, delete, log work and start a focus session, and for an open task of a project "Mark as next step" or "Remove from next steps".

#### Scenario: Open from Home
- **WHEN** the user clicks a task in Home's To do
- **THEN** the task page opens and shows its deadline and assignment

#### Scenario: Open the assigned item
- **WHEN** the user clicks the assigned project on a task page
- **THEN** the project detail opens

#### Scenario: Open the assigned goal
- **WHEN** the user clicks the assigned goal "Get fit" on a task page
- **THEN** the goal page of "Get fit" opens

#### Scenario: Missing task
- **WHEN** the task page of a deleted task is opened
- **THEN** it says the task was not found

#### Scenario: Make next step
- **WHEN** the project "Wedding" has the next step "Draft outline" and the user chooses "Mark as next step" on the page of its open task "Book venue"
- **THEN** "Book venue" and "Draft outline" are both next steps and the page shows the next-step marker

#### Scenario: No next-step action outside projects
- **WHEN** the page of a standalone task is shown
- **THEN** it offers neither "Mark as next step" nor "Remove from next steps"

#### Scenario: Remove from next steps
- **WHEN** the user chooses "Remove from next steps" on the page of a next-step task
- **THEN** the task stays open and is no longer a next step

### Requirement: Assignment to a project or goal
A task SHALL be standalone or assigned to exactly one project or one goal. The assignment SHALL be chosen when creating or editing a task and SHALL be changeable later, including to none. Deleting the project SHALL delete its tasks; deleting the goal SHALL leave its tasks as standalone tasks. A task that leaves its project SHALL no longer be a next step.

#### Scenario: Assign to a goal
- **WHEN** the user creates the task "Book physio" assigned to the goal "Get fit"
- **THEN** the task is assigned to that goal and to no project

#### Scenario: Goal deleted
- **WHEN** a goal with an assigned open task is deleted
- **THEN** the task still exists and is standalone

#### Scenario: Only one assignment
- **WHEN** the user assigns a next-step task of a project to a goal
- **THEN** the task belongs to the goal and no longer to the project, and it is no longer a next step

## ADDED Requirements

### Requirement: Task importance
A task SHALL have an optional importance from 1 to 5, set in the task form. Without its own importance a task SHALL inherit its project's importance, or 3 when it has no project; an inherited importance SHALL be shown as inherited.

#### Scenario: Own importance
- **WHEN** the user sets importance 5 on a task of a project with importance 2
- **THEN** the task shows five of five dots, not marked as inherited

#### Scenario: Inherited from the project
- **WHEN** a task without own importance belongs to a project with importance 4
- **THEN** the task shows four dots marked as inherited

#### Scenario: Standalone default
- **WHEN** a standalone task has no own importance
- **THEN** its importance counts as 3, shown as inherited

### Requirement: Mark next steps
Any open task of a project SHALL be markable and unmarkable as a next step, from the project detail, the task page and the review's projects step. A project SHALL be able to have several next steps at once.

#### Scenario: Second next step
- **WHEN** "Draft outline" is a next step of "Wedding" and the user marks "Book venue" as next step
- **THEN** both are next steps of "Wedding"

#### Scenario: Unmark
- **WHEN** the user removes "Draft outline" from the next steps
- **THEN** it is an open task of "Wedding" that is not a next step

### Requirement: Prompt after the last next step
Completing a next-step task while its project has other open next steps SHALL complete it without a prompt. Completing the project's last open next step (on Home, in the project detail, on the task page or after a focus session) SHALL first ask "What's the next step?": the user SHALL be able to enter a new task (created and marked), pick one or more open tasks of the project (marked), skip (no next step), or cancel. On any choice except cancel the task SHALL be completed as in "Complete task"; cancel SHALL change nothing.

#### Scenario: Other next steps remain
- **WHEN** "Wedding" has the next steps "Draft outline" and "Book venue" and the user completes "Draft outline"
- **THEN** it is completed without a prompt and "Book venue" stays a next step

#### Scenario: New next step
- **WHEN** the user completes the last next step "Draft outline" and enters "Write intro"
- **THEN** "Draft outline" is done and a new open task "Write intro" exists and is a next step

#### Scenario: Pick several
- **WHEN** the user completes the last next step and picks the open tasks "Book venue" and "Send invites"
- **THEN** the old next step is done and both picked tasks are next steps

#### Scenario: Skip
- **WHEN** the user completes the last next step and chooses skip
- **THEN** the task is done and the project has no next step

#### Scenario: Cancel
- **WHEN** the user opens the prompt and cancels it
- **THEN** the task stays open, stays a next step and no log entry is created

## REMOVED Requirements

### Requirement: Choose next step
**Reason**: A project can have several next steps; choosing one no longer replaces another.
**Migration**: Replaced by "Mark next steps".

### Requirement: Next-step prompt
**Reason**: The prompt now comes only after the last open next step and can pick several tasks (SPEC §5 Next steps).
**Migration**: Replaced by "Prompt after the last next step".
