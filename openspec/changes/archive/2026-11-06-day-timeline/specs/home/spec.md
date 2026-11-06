# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
