# home Specification

## Purpose

Defines the Home tab, the daily view of the app: the habits due today, upcoming deadlines, the active projects in order of score with their next steps, and the entry point for logging work.

## Requirements

### Requirement: Home sections
The Home tab SHALL show, from top to bottom, the today header, the solar system (see solar-system), the timer card while a timer runs (see work-timer), and the sections "Habits due today", "Upcoming deadlines", "Active projects" and "Tasks". A section without items SHALL show a short empty state instead of being hidden.

#### Scenario: Section order
- **WHEN** there are due habits, upcoming deadlines, active projects and open tasks outside projects
- **THEN** Home shows habits first, then deadlines, then projects, then tasks

#### Scenario: Empty section
- **WHEN** no habit is due today
- **THEN** the "Habits due today" section shows an empty state and the other sections are still shown

#### Scenario: Timer card position
- **WHEN** a timer runs
- **THEN** the timer card is shown between the solar system and "Habits due today"

#### Scenario: Solar system position
- **WHEN** there is an active goal
- **THEN** the solar system is shown directly below the today header

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

### Requirement: Upcoming deadlines display
Upcoming deadlines SHALL be sorted by date (earliest first), then title. Each item SHALL show its title, whether it is a task or a project, its date and, for a task, its project's title. Overdue items SHALL be marked as overdue. Tapping an item SHALL open its task or project page.

#### Scenario: Overdue marked
- **WHEN** today is 2026-10-05 and a task is due 2026-10-03
- **THEN** the task is listed first and marked as overdue

#### Scenario: Open task's project
- **WHEN** the user taps an upcoming task
- **THEN** its task page opens, which links to the task's project

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
The "Active projects" section SHALL list all projects with status `active`, ordered by score (importance × urgency, highest first), then by effective deadline (earliest first, none last), then by title. The numeric score SHALL NOT be shown.

#### Scenario: Score beats importance
- **WHEN** project A has importance 5 and no deadline (score 5) and project B has importance 2 and is overdue (score 10)
- **THEN** B is listed before A

#### Scenario: Tie broken by deadline
- **WHEN** two projects have the same score and only one has an effective deadline
- **THEN** the one with the deadline is listed first

### Requirement: Project card
Each project card SHALL show the title, the area as a colored chip (when set), the goal it serves (when set), a deadline badge and the next step as a checkbox row. The badge SHALL read "Overdue", "Due today", "Due tomorrow", "Due in N days" up to 30 days, or "Due dd-mm-yyyy" beyond that, based on the effective deadline. Projects without an effective deadline SHALL show no badge. A project without a next step SHALL show "No next step".

#### Scenario: Badge in days
- **WHEN** today is 2026-10-05 and a project's effective deadline is 2026-10-08
- **THEN** its card shows "Due in 3 days"

#### Scenario: Badge far away
- **WHEN** today is 2026-10-05 and a project's effective deadline is 2026-12-31
- **THEN** its card shows "Due 31-12-2026"

#### Scenario: No next step
- **WHEN** an active project has no next step
- **THEN** its card shows "No next step"

#### Scenario: Goal shown
- **WHEN** the active project "Create app" serves the goal "Get job"
- **THEN** its card shows "Get job"

### Requirement: Act on a project card
Ticking the checkbox of a card's next step SHALL open the next-step prompt for completing it (see tasks). Tapping the card elsewhere SHALL open the project detail.

#### Scenario: Complete next step from Home
- **WHEN** the user ticks the next step "Draft outline" and chooses to skip a new next step
- **THEN** the task is done and the card shows "No next step"

#### Scenario: Open detail
- **WHEN** the user taps a project card outside the next step
- **THEN** the project detail opens

### Requirement: Quick log entry point
The Home tab SHALL have a floating button at the bottom right that opens quick log (see work-log).

#### Scenario: Open quick log
- **WHEN** the user taps the quick-log button on Home
- **THEN** the quick log opens

### Requirement: Today follows the calendar
Home SHALL use the device's local date for "today". When the date changes while the app is open, or when the app returns to the foreground on a later date, Home SHALL recompute due habits, upcoming deadlines and urgencies for the new date.

#### Scenario: New day
- **WHEN** a daily habit was checked yesterday and the app is brought back to the foreground today
- **THEN** the habit is listed unchecked

### Requirement: Home updates live
Home SHALL update immediately after any change to habits, habit checks, tasks, projects, goals or measures, without a manual refresh.

#### Scenario: Project activated elsewhere
- **WHEN** the user activates a backlog project in the Plan tab and switches to Home
- **THEN** the project is listed under active projects

### Requirement: Today header
Home SHALL start with a header showing today's date and today's progress: habits checked of habits due today as an orbit ring, and the number of open tasks due today or overdue.

#### Scenario: Progress
- **WHEN** 1 of 3 habits due today is checked and 2 tasks are due today
- **THEN** the header shows a ring with "1/3" and "2 tasks due"

### Requirement: Tasks on Home
Below the active projects, Home SHALL list the open tasks that are not part of a project (standalone or assigned to a goal), ordered by deadline (overdue first, none last), then by creation. Each task SHALL show a checkbox, its title, what it is assigned to and its deadline badge. Ticking the checkbox SHALL complete it (with Undo); tapping elsewhere SHALL open its task page.

#### Scenario: Order
- **WHEN** standalone tasks A (no deadline), B (due tomorrow) and C (overdue) are open
- **THEN** Home lists C, B, A

#### Scenario: Project tasks not repeated
- **WHEN** a project's open task is not assigned elsewhere
- **THEN** it does not appear in Home's Tasks section

#### Scenario: Task of a goal
- **WHEN** the open task "Book physio" is assigned to the goal "Get fit"
- **THEN** Home lists it with "Get fit"

### Requirement: New task from Home
Home SHALL have a second floating button on the left that opens a sheet to create a task with title, optional deadline and optional assignment (project or goal). Saving with only a title SHALL create a standalone task.

#### Scenario: Two buttons
- **WHEN** Home is shown
- **THEN** a new-task button is shown bottom left and the quick-log button bottom right

#### Scenario: Assign to a goal
- **WHEN** the user creates the task "Book physio" assigned to the goal "Get fit"
- **THEN** the task belongs to "Get fit" and is listed in Home's Tasks section

### Requirement: Upcoming task deadlines
The "Upcoming deadlines" section SHALL list every open task (of an active project or outside projects) and every active project whose own deadline is overdue or at most the deadline lead time (see settings, default 7 days) after today. Items with their own card on Home SHALL be listed too, so nothing overdue is missed. Deadlines inherited from a goal SHALL NOT be listed. Without items, the section SHALL say that nothing is due in the next N days, N being the lead time.

#### Scenario: Within lead time
- **WHEN** today is 2026-10-05 and an open task of an active project is due 2026-10-12
- **THEN** the task is listed under upcoming deadlines

#### Scenario: Beyond lead time
- **WHEN** today is 2026-10-05 and an open task of an active project is due 2026-10-13
- **THEN** the task is not listed under upcoming deadlines

#### Scenario: Inherited deadline not listed
- **WHEN** an active project has no own deadline and its goal ends tomorrow
- **THEN** the project is not listed under upcoming deadlines

#### Scenario: Task of a paused project
- **WHEN** an open task due tomorrow belongs to a paused project
- **THEN** the task is not listed

#### Scenario: Shorter lead time
- **WHEN** the lead time is 3 days, today is 2026-10-05 and a task is due 2026-10-09
- **THEN** the task is not listed and, without other items, the section says "Nothing due in the next 3 days"

#### Scenario: Project not repeated
- **WHEN** an active project's own deadline is tomorrow
- **THEN** it is listed under upcoming deadlines and its card also shows "Due tomorrow"

#### Scenario: Overdue task outside projects
- **WHEN** today is 2026-10-05 and an open task without a project was due 2026-10-01
- **THEN** it is listed under upcoming deadlines, marked as overdue

### Requirement: Shooting star
When the last habit due today is checked, so that all habits due today are done, a shooting star SHALL cross the today header once. It SHALL NOT appear when Home opens with all habits already done, and SHALL be skipped when the system asks to remove animations.

#### Scenario: Last habit checked
- **WHEN** 2 of 3 habits due today are checked and the user checks the third
- **THEN** a shooting star crosses the header once and is gone afterwards

#### Scenario: Already done on opening
- **WHEN** all habits due today were checked earlier and the user opens Home
- **THEN** no shooting star is shown

#### Scenario: Reduced motion
- **WHEN** the system setting to remove animations is on and the last habit is checked
- **THEN** no shooting star is shown
