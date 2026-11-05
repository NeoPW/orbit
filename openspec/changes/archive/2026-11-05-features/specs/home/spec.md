# Spec Delta

## MODIFIED Requirements

### Requirement: Active projects ordered by score
Home's side column SHALL list all projects with status `active`, ordered by score (importance × urgency, highest first), then by effective deadline (earliest first, none last), then by title. The numeric score SHALL NOT be shown.

#### Scenario: Score beats importance
- **WHEN** project A has importance 5 and no deadline (score 5) and project B has importance 2 and is overdue (score 10)
- **THEN** B is listed before A

#### Scenario: Tie broken by deadline
- **WHEN** two projects have the same score and only one has an effective deadline
- **THEN** the one with the deadline is listed first

### Requirement: Act on a project card
Ticking the checkbox of a next step in the side column SHALL complete that task (see tasks, "Prompt after the last next step"). Clicking the project elsewhere SHALL open the project detail.

#### Scenario: Complete next step from Home
- **WHEN** the user ticks the only next step "Draft outline" of a project and chooses to skip a new next step
- **THEN** the task is done and the project is listed without next steps

#### Scenario: Open detail
- **WHEN** the user clicks a project in the side column outside its next steps
- **THEN** the project detail opens

### Requirement: Today follows the calendar
Home SHALL use the device's local date for "today". When the date changes while the app is open, or when the app returns to the foreground on a later date, Home SHALL recompute the date, due habits, ranks and deadline badges for the new date.

#### Scenario: New day
- **WHEN** a daily habit was checked yesterday and the app is brought back to the foreground today
- **THEN** the habit is listed unchecked

## ADDED Requirements

### Requirement: Home layout
Home SHALL show a main column with, from top to bottom, today's weekday and date with "New task" and "Log work" next to it, the focus panel (see work-timer), "Habits due today" and "To do", and a side column with the active projects. Below 960 pixels window width the side column SHALL move below the main column. A section without items SHALL show an empty state.

#### Scenario: Wide window
- **WHEN** Home is shown in a 1280 pixel wide window
- **THEN** the active projects are shown in a column to the right of the main column

#### Scenario: Empty section
- **WHEN** no habit is due today
- **THEN** "Habits due today" shows an empty state and the other sections are still shown

### Requirement: Task rank
A task's rank SHALL be importance × urgency. Importance SHALL be the task's own, else its project's, else 3. Urgency (see "Project urgency") SHALL come from the task's due date, else its project's effective deadline, else its goal's end date, else 1. Higher ranks come first; ties SHALL be broken by the nearest due date or inherited deadline (none last), then by creation (oldest first).

#### Scenario: Rank
- **WHEN** task A has importance 2 and is overdue (rank 10) and task B has importance 5 and no deadline (rank 5)
- **THEN** A comes before B

#### Scenario: Inherited importance and urgency
- **WHEN** a task without own importance or due date belongs to a project with importance 4 and a deadline in 2 days
- **THEN** its rank is 16

#### Scenario: Goal's end date
- **WHEN** a task without due date is assigned to a goal that ends in 20 days
- **THEN** its urgency is 2

#### Scenario: Tie
- **WHEN** two tasks have the same rank and only one has a due date
- **THEN** the one with the due date comes first

### Requirement: To do on Home
"To do" SHALL list the open next-step tasks of active projects and the open tasks outside projects (standalone or assigned to a goal), ordered by task rank. Each row SHALL show a checkbox that completes the task (with Undo), the title, its project or goal, importance dots, a deadline badge and an action to start a focus session. Clicking the row elsewhere SHALL open the task page.

#### Scenario: Next steps and loose tasks
- **WHEN** an active project has the next step "Draft outline" and the open task "Send invites", and the standalone task "Tax return" is open
- **THEN** To do lists "Draft outline" and "Tax return", but not "Send invites"

#### Scenario: Paused project
- **WHEN** a paused project has an open next step
- **THEN** it is not listed in To do

#### Scenario: Task of a goal
- **WHEN** the open task "Book physio" is assigned to the goal "Get fit"
- **THEN** To do lists it with "Get fit"

### Requirement: Active project entries
Each active project in the side column SHALL show its title, its area color, its deadline badge (see visual-design, "Deadline badge text"; marked when inherited from the goal) and its open next steps as checkbox rows. Values that are not set SHALL be left out.

#### Scenario: Badge in days
- **WHEN** the lead time is 7 days, today is 2026-10-05 and a project's effective deadline is 2026-10-08
- **THEN** it shows "In 3 days"

#### Scenario: No next steps
- **WHEN** an active project has no open next step
- **THEN** it is listed with its title and badges and no next-step rows

### Requirement: Create a task from Home
Home's "New task" SHALL open a sheet to create a task with a title, an optional deadline, an optional importance and an optional assignment (an active project or an active goal). Typing a title and pressing Enter SHALL create a standalone task.

#### Scenario: Title and Enter
- **WHEN** the user clicks "New task", types "Tax return" and presses Enter
- **THEN** an open standalone task "Tax return" exists and is listed in To do

#### Scenario: Assign to a goal
- **WHEN** the user creates the task "Book physio" assigned to the goal "Get fit"
- **THEN** the task belongs to "Get fit" and is listed in To do

## REMOVED Requirements

### Requirement: Home sections
**Reason**: Home has a new layout without the solar system and the deadline section (SPEC §6.1).
**Migration**: Replaced by "Home layout".

### Requirement: Upcoming deadlines display
**Reason**: Deadlines are shown as badges on To do and on the active projects, which are ranked by urgency; deadline reminders notify ahead (see notifications).
**Migration**: None.

### Requirement: Upcoming task deadlines
**Reason**: As "Upcoming deadlines display".
**Migration**: None.

### Requirement: Project card
**Reason**: The active projects are a compact side column with several next steps per project.
**Migration**: Replaced by "Active project entries".

### Requirement: Quick log entry point
**Reason**: Home has "New task" and "Log work" buttons next to the date instead of floating buttons.
**Migration**: See "Home layout" and work-log, "Log work".

### Requirement: Today header
**Reason**: Home starts with the weekday and date only (SPEC §6.1).
**Migration**: See "Home layout".

### Requirement: Tasks on Home
**Reason**: Tasks are ranked together with next steps in To do.
**Migration**: Replaced by "To do on Home" and "Task rank".

### Requirement: New task from Home
**Reason**: The floating button is replaced by a button next to the date, and the form gets importance.
**Migration**: Replaced by "Create a task from Home".

### Requirement: Shooting star
**Reason**: Home no longer has a habits ring in its header for the star to cross.
**Migration**: None.
