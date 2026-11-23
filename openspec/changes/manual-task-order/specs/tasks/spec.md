# Spec Delta

## MODIFIED Requirements

### Requirement: Open task order
The project's open tasks SHALL be listed with the next steps first, each group in the project's task order. The task order SHALL be, until the user reorders the list, by time added (oldest first); due dates SHALL NOT change the order. After the user has reordered the list, tasks with a manual position SHALL come first in that order, and the other tasks (for example new ones) after them, by time added. The next-step tasks SHALL be marked in the list.

#### Scenario: Order
- **WHEN** a project has open tasks A (no due date, added first), B (due 2026-10-20, added second) and C (due 2026-10-10, added last) and has never been reordered
- **THEN** they are listed A, B, C

#### Scenario: New task after a manual order
- **WHEN** the user has put C before A and B in a project and then adds D with the due date 2026-10-01
- **THEN** the list reads C, A, B, D

### Requirement: Reset the task order
The project's open task list SHALL offer "Reset order" once it has a manual order. It SHALL remove the manual positions of the project's open tasks, so the list returns to the order in which the tasks were added.

#### Scenario: Reset
- **WHEN** a reordered project's list is reset
- **THEN** the tasks are listed by time added, oldest first, and "Reset order" is no longer offered

### Requirement: Task page
Every task SHALL have a page with its own address showing its title, notes, deadline, status and assignment (the assigned project or goal, clickable to open it, or "Standalone"), marked when it is one of its project's next steps, and the log entries recorded for it, newest first. The page SHALL offer complete (with Undo), reopen, edit, delete, log work and start a focus session, and for an open task of a project "Mark as next step" or "Remove from next steps".

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

#### Scenario: Log on a goal's task
- **WHEN** the user logs 20 minutes on the task "Book physio", assigned to "Get fit"
- **THEN** the entry belongs to the task and to "Get fit"

#### Scenario: No importance
- **WHEN** the page of any task is shown
- **THEN** it shows no importance dots and its edit form has no importance field

### Requirement: Task popup
A task SHALL be openable in a popup centred over the current screen, which stays in place behind it. The tab and the address SHALL NOT change.

The popup SHALL show the same content as the task page (see "Task page"): title, status, notes, deadline, assignment, next-step marker, the actions (Complete or Reopen, Start focus, Edit, Delete, Mark as next step) and the log with its total and "Log work". It SHALL also offer "Open page", which opens the task page.

Closing:
- `Esc`, the close button and a click beside the popup SHALL close it.
- While a sheet or confirmation opened from the popup is shown, `Esc` SHALL close only that.
- Deleting the task SHALL close the popup and show "Task deleted".
- Any navigation SHALL close the popup, for example opening the assigned project or goal, "Open page" or the sidebar.

On the phone the popup SHALL fill the screen.

#### Scenario: Close with Esc
- **WHEN** the popup of a task is open and the user presses `Esc`
- **THEN** the popup closes and the screen behind it is unchanged

#### Scenario: Close beside the popup
- **WHEN** the user clicks outside the popup
- **THEN** the popup closes

#### Scenario: Esc in the edit sheet
- **WHEN** the user pressed Edit in the popup and presses `Esc` in the sheet
- **THEN** the sheet closes without saving and the popup stays open

#### Scenario: Complete in the popup
- **WHEN** the user presses Complete in the popup of an open task
- **THEN** the task is completed with Undo and the popup shows it as done

#### Scenario: Delete in the popup
- **WHEN** the user deletes the task from the popup and confirms
- **THEN** the popup closes and "Task deleted" is shown

#### Scenario: Open page
- **WHEN** the user presses "Open page" in the popup
- **THEN** the popup closes and the task page opens

#### Scenario: Open the assigned project
- **WHEN** the user clicks the assigned project "Portfolio site" in the popup
- **THEN** the popup closes and the project detail of "Portfolio site" opens

## REMOVED Requirements

### Requirement: Task importance
**Reason**: Importance is removed from tasks and projects; the user orders tasks by hand instead (see home, "To do order" and "Reorder To do").
**Migration**: Existing importance values stay in the database unused and are no longer shown, edited or synced into any ordering. Nothing to do for the user.
