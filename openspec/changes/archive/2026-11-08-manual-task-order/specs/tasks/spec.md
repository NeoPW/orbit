## MODIFIED Requirements

### Requirement: Open task order
The project's open tasks SHALL be listed with the next steps first, each group in the project's task order. The task order SHALL be, until the user reorders the list, by due date (earliest first, tasks without due date last), then by creation time (oldest first). After the user has reordered the list, tasks with a manual position SHALL come first in that order, and the other tasks (for example new ones) after them, by due date and then creation time. The next-step tasks SHALL be marked in the list.

#### Scenario: Order
- **WHEN** a project has open tasks A (no due date, created first), B (due 2026-10-20) and C (due 2026-10-10) and has never been reordered
- **THEN** they are listed C, B, A

#### Scenario: New task after a manual order
- **WHEN** the user has put A before B and C in a project and then adds D with the due date 2026-10-01
- **THEN** the list reads A, B, C, D

## ADDED Requirements

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
The project's open task list SHALL offer "Reset order" once it has a manual order. It SHALL remove the manual positions of the project's open tasks, so the list returns to due date and creation order.

#### Scenario: Reset
- **WHEN** a reordered project's list is reset
- **THEN** the tasks are listed by due date, then by creation time, and "Reset order" is no longer offered

### Requirement: Manual position when a task moves
A task's manual position SHALL belong to the project it is in. Assigning the task to another project, to a goal or to nothing SHALL remove it, so the task is listed after the manually ordered tasks of its new project.

#### Scenario: Move to another project
- **WHEN** a task with a manual position is assigned to another project that has manually ordered tasks
- **THEN** it is listed after those tasks
