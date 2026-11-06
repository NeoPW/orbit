# home Specification

## Purpose

Defines the Home tab, the daily view of the app: the habits due today, upcoming deadlines, the active projects in order of score with their next steps, and the entry point for logging work.

## Requirements

### Requirement: Home layout
Home SHALL show a main column with, from top to bottom, today's weekday and date with "New task" and "Log work" next to it, the focus panel (see work-timer), "Habits due today", "To do" and "Done today", and a side column with the "Today" timeline (see day-timeline) above the active projects. Below 960 pixels window width the side column SHALL move below the main column. A section without items SHALL show an empty state, except "Done today", which SHALL be hidden while no task was completed today.

#### Scenario: Wide window
- **WHEN** Home is shown in a 1280 pixel wide window
- **THEN** the Today timeline and below it the active projects are shown in a column to the right of the main column

#### Scenario: Empty section
- **WHEN** no habit is due today
- **THEN** "Habits due today" shows an empty state and the other sections are still shown

#### Scenario: Timeline above projects
- **WHEN** Home is shown
- **THEN** the Today timeline is directly above "Active projects" in the side column

#### Scenario: Nothing done yet
- **WHEN** no task was completed today
- **THEN** "Done today" is not shown

### Requirement: Habits due today on Home
The "Habits due today" section SHALL show every active habit that is due today (see habits) or already checked today as a chip with its title, labeled with the title of its linked project, or of its goal when it has no project, and visibly marked when checked today. Tapping a chip SHALL check or uncheck the habit for today.

#### Scenario: Habit labeled by project
- **WHEN** an active daily habit "Stretch" is linked to project "Marathon"
- **THEN** Home shows an unchecked chip "Stretch" labeled "Marathon"

#### Scenario: Habit labeled by goal
- **WHEN** an active daily habit "Read" is linked only to the goal "Learn Spanish"
- **THEN** Home shows a chip "Read" labeled "Learn Spanish"

#### Scenario: Checked habit stays listed
- **WHEN** a habit with 3 times per week has 2 earlier check-ins this week and the user checks it today
- **THEN** it stays on Home, shown as checked

#### Scenario: Check from Home
- **WHEN** the user taps the chip of an unchecked habit
- **THEN** the habit is shown as checked and a log entry for it exists

### Requirement: Project urgency
A project's urgency SHALL be computed from its effective deadline (see projects) in local calendar days from today: overdue 5, 0 to 3 days 4, 4 to 7 days 3, 8 to 30 days 2, more than 30 days or no effective deadline 1. Task due dates SHALL NOT affect urgency.

#### Scenario: Overdue
- **WHEN** a project's effective deadline was yesterday
- **THEN** its urgency is 5

#### Scenario: Due today
- **WHEN** a project's effective deadline is today
- **THEN** its urgency is 4

#### Scenario: Boundaries
- **WHEN** effective deadlines are 3, 4, 7, 8, 30 and 31 days away
- **THEN** the urgencies are 4, 3, 3, 2, 2 and 1

#### Scenario: No deadline
- **WHEN** a project has no effective deadline
- **THEN** its urgency is 1

#### Scenario: Task due date ignored
- **WHEN** a project has no effective deadline and an open task due tomorrow
- **THEN** its urgency is 1

### Requirement: Active projects ordered by score
Home's side column SHALL list all projects with status `active`, ordered by score (importance × urgency, highest first), then by effective deadline (earliest first, none last), then by title. The numeric score SHALL NOT be shown.

#### Scenario: Score beats importance
- **WHEN** project A has importance 5 and no deadline (score 5) and project B has importance 2 and is overdue (score 10)
- **THEN** B is listed before A

#### Scenario: Tie broken by deadline
- **WHEN** two projects have the same score and only one has an effective deadline
- **THEN** the one with the deadline is listed first

### Requirement: Active project entries
Each active project in the side column SHALL show its title, its area color, its deadline badge (see visual-design, "Deadline badge text"; marked when inherited from the goal) and its open next steps as checkbox rows. Values that are not set SHALL be left out.

#### Scenario: Badge in days
- **WHEN** the lead time is 7 days, today is 2026-10-05 and a project's effective deadline is 2026-10-08
- **THEN** it shows "In 3 days"

#### Scenario: No next steps
- **WHEN** an active project has no open next step
- **THEN** it is listed with its title and badges and no next-step rows

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

### Requirement: Home updates live
Home SHALL update immediately after any change to habits, habit checks, tasks, projects, goals or measures, without a manual refresh.

#### Scenario: Project activated elsewhere
- **WHEN** the user activates a backlog project in the Plan tab and switches to Home
- **THEN** the project is listed under active projects

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

### Requirement: Create a task from Home
Home's "New task" SHALL open a sheet to create a task with a title, an optional deadline, an optional importance and an optional assignment (an active project or an active goal). Typing a title and pressing Enter SHALL create a standalone task.

#### Scenario: Title and Enter
- **WHEN** the user clicks "New task", types "Tax return" and presses Enter
- **THEN** an open standalone task "Tax return" exists and is listed in To do

#### Scenario: Assign to a goal
- **WHEN** the user creates the task "Book physio" assigned to the goal "Get fit"
- **THEN** the task belongs to "Get fit" and is listed in To do

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

### Requirement: Done today on Home
"Done today" SHALL list the tasks completed today (local day), most recently completed first, each with a checked checkbox, its title, its project chip (or goal) and the time it was completed. Unchecking SHALL reopen the task (see tasks, "Reopen task"); clicking the row SHALL open the task page. The list SHALL update live and move to the new day at midnight.

#### Scenario: Completed task
- **WHEN** the user completes "Email supervisor" at 11:20
- **THEN** it leaves "To do" and appears at the top of "Done today" with "11:20"

#### Scenario: Reopen
- **WHEN** the user unchecks "Email supervisor" in "Done today"
- **THEN** the task is open again, leaves "Done today" and is back in "To do"

#### Scenario: Yesterday
- **WHEN** a task was completed yesterday
- **THEN** it is not in "Done today"

### Requirement: Start focus from a habit
Each chip in "Habits due today" SHALL have a small start button beside its check area that starts a focus session on the habit (see work-timer). Clicking the chip itself SHALL still check or uncheck the habit.

#### Scenario: Start from a chip
- **WHEN** the user uses the start button on the chip "Run 5 km"
- **THEN** a focus session for "Run 5 km" starts and the habit's checked state is unchanged

#### Scenario: Chip still checks
- **WHEN** the user clicks the chip "Run 5 km" itself
- **THEN** the habit is checked and no session starts
