# Spec Delta

## ADDED Requirements

### Requirement: Active projects ordered by deadline
Home's side column SHALL list all projects with status `active`, ordered by effective deadline (earliest first, none last), then by time added (oldest first).

#### Scenario: Deadline first
- **WHEN** project A has no deadline and project B has an effective deadline next month
- **THEN** B is listed before A

#### Scenario: Tie broken by time added
- **WHEN** projects A and B have no effective deadline and A was added before B
- **THEN** A is listed before B

### Requirement: To do order
To do SHALL be listed in its own order, independent of the projects' task order. Until the user reorders To do, its tasks SHALL be listed by time added (oldest first). After a reorder, tasks with a Home position SHALL come first, by position, and the others after them, by time added. Once To do has a manual order, marking a task as a next step SHALL put it at the end. Due dates SHALL NOT change the order.

#### Scenario: Time added
- **WHEN** To do has never been reordered and "Tax return" was added before the next step "Draft outline", which is due tomorrow
- **THEN** To do lists "Tax return" before "Draft outline"

#### Scenario: New task goes to the end
- **WHEN** To do was reordered to "Draft outline", "Tax return" and the user adds the standalone task "Call the bank"
- **THEN** To do reads "Draft outline", "Tax return", "Call the bank"

#### Scenario: New next step goes to the end
- **WHEN** To do has a manual order and the user marks the older task "Send invites" as a next step of an active project
- **THEN** "Send invites" is listed last in To do

#### Scenario: Independent of the project order
- **WHEN** the user moves "Book venue" above "Write intro" in their project, and both are next steps listed in To do as "Write intro", "Book venue"
- **THEN** To do still lists "Write intro" before "Book venue"

### Requirement: Reorder To do
The user SHALL be able to move a task of To do to another place in To do by dragging its handle or, with the handle focused, with `Alt+↑` and `Alt+↓`. The new order SHALL be kept, shown at once and synced with the other devices. The tasks behind "Show N more" SHALL NOT be reorderable on Home.

#### Scenario: Drag a task up
- **WHEN** To do lists A, B and C and the user drags C above A
- **THEN** To do reads C, A, B and stays so after a reload

#### Scenario: Keyboard
- **WHEN** the handle of B is focused and the user presses `Alt+↑`
- **THEN** B moves one place up and keeps the focus

#### Scenario: Synced
- **WHEN** the user reorders To do on the desktop and the phone syncs
- **THEN** the phone's To do shows the same order

## MODIFIED Requirements

### Requirement: To do on Home
"To do" SHALL list the open next-step tasks of active projects and the open tasks outside projects (standalone or assigned to a goal), in To do order (see "To do order"). Each row SHALL show a drag handle, a checkbox that completes the task (with Undo), the title, its project or goal, a deadline badge and an action to start a focus session. Clicking the row elsewhere SHALL open the task page.

#### Scenario: Next steps and loose tasks
- **WHEN** an active project has the next step "Draft outline" and the open task "Send invites", and the standalone task "Tax return" is open
- **THEN** To do lists "Draft outline" and "Tax return", but not "Send invites"

#### Scenario: Paused project
- **WHEN** a paused project has an open next step
- **THEN** it is not listed in To do

#### Scenario: Task of a goal
- **WHEN** the open task "Book physio" is assigned to the goal "Get fit"
- **THEN** To do lists it with "Get fit"

### Requirement: Create a task from Home
Home's "New task" SHALL open a sheet to create a task with a title, an optional deadline and an optional assignment (an active project or an active goal). Typing a title and pressing Enter SHALL create a standalone task.

#### Scenario: Title and Enter
- **WHEN** the user clicks "New task", types "Tax return" and presses Enter
- **THEN** an open standalone task "Tax return" exists and is listed in To do

#### Scenario: Assign to a goal
- **WHEN** the user creates the task "Book physio" assigned to the goal "Get fit"
- **THEN** the task belongs to "Get fit" and is listed in To do

### Requirement: More tasks in To do
Directly below the To do list, Home SHALL show a toggle with a down chevron and N, the number of open tasks of active projects that are not next steps (named "Show N more" for screen readers and in its tooltip). Using it SHALL list those tasks below the toggle, grouped by project in the side column's project order and, within a project, in the project's open task order (see tasks, "Open task order"), with the same rows and actions as To do except the drag handle; the toggle SHALL stay in its place, show an up chevron and N (named "Show less") and hide them again. It SHALL start collapsed when Home opens and be hidden when there are no such tasks. While expanded, its tasks SHALL count as To do tasks for the To do list keys (see keyboard-shortcuts), after the others.

#### Scenario: Expand
- **WHEN** an active project has the next step "Draft outline" and the open task "Send invites", and the user uses the toggle showing 1
- **THEN** "Send invites" is listed below the toggle, which is below "Draft outline", with a checkbox, its project and a start action, and the toggle shows an up chevron

#### Scenario: Order of the expanded tasks
- **WHEN** project P is listed before project Q in the side column, P's other open tasks are "B", "A" in its task order and Q has the other open task "C"
- **THEN** the expanded tasks read "B", "A", "C"

#### Scenario: Collapsed at start
- **WHEN** Home opens and active projects have open tasks that are not next steps
- **THEN** those tasks are not listed and the toggle shows a down chevron and their number

#### Scenario: Nothing more
- **WHEN** every open task of the active projects is a next step
- **THEN** no toggle is shown

#### Scenario: Paused project stays hidden
- **WHEN** a paused project has an open task that is not a next step
- **THEN** it is not counted by the toggle and not listed when expanded

#### Scenario: Keys reach the expanded tasks
- **WHEN** To do lists two tasks, the section is expanded with one more task and the user presses `3`
- **THEN** the expanded task is highlighted

### Requirement: Today follows the calendar
Home SHALL use the device's local date for "today". When the date changes while the app is open, or when the app returns to the foreground on a later date, Home SHALL recompute the date, due habits and deadline badges for the new date.

#### Scenario: New day
- **WHEN** a daily habit was checked yesterday and the app is brought back to the foreground today
- **THEN** the habit is listed unchecked

## REMOVED Requirements

### Requirement: Project urgency
**Reason**: Urgency only fed the project score and the task rank, which are removed.
**Migration**: None; deadline badges keep their colours from the lead time (see visual-design).

### Requirement: Active projects ordered by score
**Reason**: Project importance is removed, so there is no score.
**Migration**: Replaced by "Active projects ordered by deadline".

### Requirement: Task rank
**Reason**: Task and project importance are removed; To do follows the user's own order.
**Migration**: Replaced by "To do order" and "Reorder To do". Existing To do lists start in time-added order.
