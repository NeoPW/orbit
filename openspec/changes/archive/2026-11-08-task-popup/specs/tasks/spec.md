## ADDED Requirements

### Requirement: Task popup
A task SHALL be openable in a popup centred over the current screen, which stays in place behind it. The tab and the address SHALL NOT change.

The popup SHALL show the same content as the task page (see "Task page"): title, status, notes, deadline, importance, assignment, next-step marker, the actions (Complete or Reopen, Start focus, Edit, Delete, Mark as next step) and the log with its total and "Log work". It SHALL also offer "Open page", which opens the task page.

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

## MODIFIED Requirements

### Requirement: Task rows
Wherever open tasks are listed as rows (project detail, Plan, goal pages and the review's projects step), a row SHALL show a checkbox that completes the task, the title, a next-step marker when it applies and a deadline badge. Tapping the row SHALL open the task in the task popup (see "Task popup"). A row SHALL NOT have its own action menu; editing, deleting and making a task the next step happen in the task popup or on the task page.

#### Scenario: No row menu
- **WHEN** a project's open tasks are listed in its detail
- **THEN** no task row has an action menu, and tapping "Book venue" opens its task popup

#### Scenario: Complete from the row
- **WHEN** the user ticks the checkbox of "Book venue"
- **THEN** the task is completed with an Undo offer
