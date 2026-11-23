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
The project's open tasks SHALL be listed with the next steps first, each group in the project's task order. The task order SHALL be, until the user reorders the list, by time added (oldest first); due dates SHALL NOT change the order. After the user has reordered the list, tasks with a manual position SHALL come first in that order, and the other tasks (for example new ones) after them, by time added. The next-step tasks SHALL be marked in the list.

#### Scenario: Order
- **WHEN** a project has open tasks A (no due date, added first), B (due 2026-10-20, added second) and C (due 2026-10-10, added last) and has never been reordered
- **THEN** they are listed A, B, C

#### Scenario: New task after a manual order
- **WHEN** the user has put C before A and B in a project and then adds D with the due date 2026-10-01
- **THEN** the list reads C, A, B, D

### Requirement: Edit task
The user SHALL be able to edit a task's title, notes, due date and assignment, including clearing the due date and the assignment. A task SHALL NOT be saved without a title.

#### Scenario: Change due date
- **WHEN** the user changes a task's due date from 2026-10-20 to 2026-10-15
- **THEN** the task shows 15-10-2026 and the list order updates

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

### Requirement: Reopen task
A done task SHALL be reopenable from its task page. Reopening SHALL set it back to open and clear its completion time; its log entries SHALL stay.

#### Scenario: Reopen
- **WHEN** the user reopens the done task "Book venue"
- **THEN** the task is open again and its earlier log entry is still listed

### Requirement: Log work on a task
The task page SHALL offer "Log work" with an optional duration and note. The entry SHALL belong to the task and, when the task is assigned to a project or goal, also to that project or goal.

#### Scenario: Log on a standalone task
- **WHEN** the user logs 30 minutes on the standalone task "Tax return"
- **THEN** the task page lists a 30-minute manual entry

#### Scenario: Log on a goal's task
- **WHEN** the user logs 20 minutes on the task "Book physio", assigned to "Get fit"
- **THEN** the entry belongs to the task and to "Get fit"

### Requirement: Task rows
Wherever open tasks are listed as rows (project detail, Plan, goal pages and the review's projects step), a row SHALL show a checkbox that completes the task, the title, a next-step marker when it applies and a deadline badge. Tapping the row SHALL open the task in the task popup (see "Task popup"). A row SHALL NOT have its own action menu; editing, deleting and making a task the next step happen in the task popup or on the task page.

#### Scenario: No row menu
- **WHEN** a project's open tasks are listed in its detail
- **THEN** no task row has an action menu, and tapping "Book venue" opens its task popup

#### Scenario: Complete from the row
- **WHEN** the user ticks the checkbox of "Book venue"
- **THEN** the task is completed with an Undo offer

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

### Requirement: Reorder open tasks
The user SHALL be able to move a task of a project's open task list to another place in its group (the next steps, or the other tasks), by dragging its handle or, with the handle focused, with `Alt+↑` and `Alt+↓`. Moving SHALL be possible only within the group; marking or unmarking a task as a next step SHALL move it to the other group, to the end of it. The new order SHALL be kept, shown at once and synced with the other devices.

#### Scenario: Drag a task up
- **WHEN** the open tasks are A, B and C and the user drags C above A
- **THEN** the list reads C, A, B and stays so after a reload

#### Scenario: Keyboard
- **WHEN** the handle of B is focused and the user presses `Alt+↑`
- **THEN** B moves one place up and keeps the focus

#### Scenario: Next steps stay on top
- **WHEN** the user drags a task that is not a next step above a next step
- **THEN** it ends at the top of the other tasks, below the next steps

#### Scenario: Mark as next step
- **WHEN** the user marks the task "Send invites" as a next step in a list that has been reordered
- **THEN** it appears at the end of the next steps

### Requirement: Reset the task order
The project's open task list SHALL offer "Reset order" once it has a manual order. It SHALL remove the manual positions of the project's open tasks, so the list returns to the order in which the tasks were added.

#### Scenario: Reset
- **WHEN** a reordered project's list is reset
- **THEN** the tasks are listed by time added, oldest first, and "Reset order" is no longer offered

### Requirement: Manual position when a task moves
A task's manual position SHALL belong to the project it is in. Assigning the task to another project, to a goal or to nothing SHALL remove it, so the task is listed after the manually ordered tasks of its new project.

#### Scenario: Move to another project
- **WHEN** a task with a manual position is assigned to another project that has manually ordered tasks
- **THEN** it is listed after those tasks

### Requirement: Project suggestions in the new task title
When the user creates a task, typing `#` in the title SHALL suggest the active projects whose name contains the text after the last `#` (all active projects while nothing follows it), with their colours, as the focus panel does. Picking one by click, tap, or the arrow keys and Enter or Tab SHALL set "Assigned to" to that project and leave only the text before `#` in the title. Editing an existing task SHALL NOT suggest projects.

#### Scenario: Suggest projects
- **WHEN** the user types "Draft intro # port" in the title of a new task and "Portfolio site" is active
- **THEN** "Portfolio site" is suggested with its colour

#### Scenario: Pick a project
- **WHEN** the user picks "Portfolio site" from the suggestions for "Draft intro # port"
- **THEN** the title reads "Draft intro" and "Assigned to" shows "Portfolio site"

#### Scenario: Editing keeps the #
- **WHEN** the user edits the task "Fix issue" and types "Fix issue #12" as its title and saves
- **THEN** no project is suggested and the task is titled "Fix issue #12"

### Requirement: Project typed in the new task title
Saving a new task whose title contains `#` SHALL save the text before the last `#` as the title and assign the project that the text after it names: the active project with that name (ignoring case), else the only active project starting with it. This SHALL replace the choice in "Assigned to". When no project matches, the form SHALL show "No project named …" under the title and save nothing.

#### Scenario: Unique prefix
- **WHEN** the user types "Draft intro # chap" in a new task, "Chapter 4: Evaluation" is the only active project starting with "chap", and presses Enter
- **THEN** the task "Draft intro" is created in "Chapter 4: Evaluation"

#### Scenario: Unknown project
- **WHEN** the user types "Draft intro # garden" in a new task, no active project matches "garden", and saves
- **THEN** the form shows "No project named garden" and no task is created

#### Scenario: Overrides the preselected project
- **WHEN** the user adds a task in the detail of "Thesis" and types "Update CV # portfolio site" and saves
- **THEN** the task "Update CV" belongs to "Portfolio site"

### Requirement: Next-step prompt from the keyboard
When the project has other open tasks, the next-step prompt SHALL open with the first of them highlighted, in the project's task order; otherwise the cursor SHALL be in the new-task field. The up and down arrows SHALL move the highlight through the tasks, and up from the first task into the new-task field and down from it back to the first task. Typing a character while a task is highlighted SHALL put it into the new-task field.

#### Scenario: Highlight on open
- **WHEN** the user completes the last next step of a project with the open tasks "Book venue" and "Send invites"
- **THEN** the prompt opens with "Book venue" highlighted

#### Scenario: Move down
- **WHEN** "Book venue" is highlighted and the user presses the down arrow
- **THEN** "Send invites" is highlighted

#### Scenario: Type a new task
- **WHEN** a task is highlighted and the user types "Write intro" and presses Enter
- **THEN** "Write intro" is created as the next step and the old next step is done

#### Scenario: No other tasks
- **WHEN** the user completes the last open task of a project, which was its last next step
- **THEN** the prompt opens with the cursor in the new-task field

### Requirement: Pick a next step with one click
In the next-step prompt, Enter on the highlighted task or a click (tap) on a task SHALL pick it, together with the tasks already selected, and complete the old next step at once. Ctrl+Enter on the highlighted task, Ctrl+click on a task or its checkbox SHALL add it to the selection or remove it, without completing. Complete SHALL pick the selected tasks.

#### Scenario: Enter picks
- **WHEN** "Send invites" is highlighted in the prompt and the user presses Enter
- **THEN** the old next step is done, "Send invites" is the next step and the prompt is closed

#### Scenario: Click picks
- **WHEN** the user clicks "Book venue" in the prompt
- **THEN** the old next step is done and "Book venue" is the next step

#### Scenario: Select several
- **WHEN** the user presses Ctrl+Enter on "Book venue", moves down and presses Enter on "Send invites"
- **THEN** the old next step is done and both "Book venue" and "Send invites" are next steps

#### Scenario: Ctrl+click does not complete
- **WHEN** the user Ctrl+clicks "Book venue" in the prompt
- **THEN** "Book venue" is selected, the prompt stays open and the old next step is still open
