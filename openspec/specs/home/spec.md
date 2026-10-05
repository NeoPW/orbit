# home Specification

## Purpose

Defines the Home tab, the daily view of the app: the habits due today, upcoming deadlines, the active projects in order of score with their next steps, and the entry point for logging work.

## Requirements

### Requirement: Home sections
The Home tab SHALL show, from top to bottom, the sections "Habits due today", "Upcoming deadlines" and "Active projects". A section without items SHALL show a short empty text instead of being hidden.

#### Scenario: Section order
- **WHEN** there are due habits, upcoming deadlines and active projects
- **THEN** Home shows habits first, then deadlines, then projects

#### Scenario: Empty section
- **WHEN** no habit is due today
- **THEN** the "Habits due today" section shows an empty text and the other sections are still shown

### Requirement: Habits due today on Home
The "Habits due today" section SHALL list every active habit that is due today (see habits) or already checked today, each with a checkbox showing whether it is checked today, its title, and the title of its linked project, or of its KR when it has no project. Toggling the checkbox SHALL check or uncheck the habit for today.

#### Scenario: Habit labeled by project
- **WHEN** an active daily habit "Stretch" is linked to project "Marathon"
- **THEN** Home lists "Stretch" labeled "Marathon" with an unchecked checkbox

#### Scenario: Checked habit stays listed
- **WHEN** a habit with 3 times per week has 2 earlier check-ins this week and the user checks it today
- **THEN** it stays listed on Home, shown as checked

#### Scenario: Check from Home
- **WHEN** the user taps the checkbox of an unchecked habit
- **THEN** the habit is shown as checked and a log entry for it exists

### Requirement: Upcoming deadlines content
The "Upcoming deadlines" section SHALL list items whose own deadline is overdue or at most the deadline lead time (see settings, default 7 days) after today: open tasks of active projects (due date), active projects (own deadline), and KRs of active objectives with progress below 1 (own deadline). Deadlines inherited from a KR or objective SHALL NOT be listed. Without items, the section SHALL say that nothing is due in the next N days, N being the lead time.

#### Scenario: Within lead time
- **WHEN** today is 2026-10-05 and an open task of an active project is due 2026-10-12
- **THEN** the task is listed under upcoming deadlines

#### Scenario: Beyond lead time
- **WHEN** today is 2026-10-05 and an active project's own deadline is 2026-10-13
- **THEN** the project is not listed under upcoming deadlines

#### Scenario: Inherited deadline not listed
- **WHEN** an active project has no own deadline and its KR's deadline is tomorrow
- **THEN** only the KR is listed, not the project

#### Scenario: Task of a paused project
- **WHEN** an open task due tomorrow belongs to a paused project
- **THEN** the task is not listed

#### Scenario: Reached KR
- **WHEN** a KR of an active objective has its own deadline tomorrow and progress 1
- **THEN** the KR is not listed

#### Scenario: Shorter lead time
- **WHEN** the lead time is 3 days, today is 2026-10-05 and a task is due 2026-10-09
- **THEN** the task is not listed and, without other items, the section says "Nothing due in the next 3 days"

### Requirement: Upcoming deadlines display
Upcoming deadlines SHALL be sorted by date (earliest first), then title. Each item SHALL show its title, what kind of item it is (task, project or KR), its date and, for tasks, the project title. Overdue items SHALL be marked as overdue. Tapping a task or project SHALL open the project detail; tapping a KR SHALL open the KR's edit form.

#### Scenario: Overdue marked
- **WHEN** today is 2026-10-05 and a task is due 2026-10-03
- **THEN** the task is listed first and marked as overdue

#### Scenario: Open task's project
- **WHEN** the user taps an upcoming task
- **THEN** the detail of the task's project opens

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
Each project card SHALL show the title, the area, a deadline badge and the next step. The badge SHALL read "Overdue", "Due today", "Due tomorrow", "Due in N days" up to 30 days, or "Due dd-mm-yyyy" beyond that, based on the effective deadline. Projects without an effective deadline SHALL show no badge. A project without a next step SHALL show "No next step".

#### Scenario: Badge in days
- **WHEN** today is 2026-10-05 and a project's effective deadline is 2026-10-08
- **THEN** its card shows "Due in 3 days"

#### Scenario: Badge far away
- **WHEN** today is 2026-10-05 and a project's effective deadline is 2026-12-31
- **THEN** its card shows "Due 31-12-2026"

#### Scenario: No next step
- **WHEN** an active project has no next step
- **THEN** its card shows "No next step"

### Requirement: Act on a project card
Tapping a card's next step SHALL open the next-step prompt for completing it (see tasks). Tapping the card elsewhere SHALL open the project detail.

#### Scenario: Complete next step from Home
- **WHEN** the user taps the next step "Draft outline" and chooses to skip a new next step
- **THEN** the task is done and the card shows "No next step"

#### Scenario: Open detail
- **WHEN** the user taps a project card outside the next step
- **THEN** the project detail opens

### Requirement: Quick log entry point
The Home tab SHALL have a floating action button that opens quick log (see work-log).

#### Scenario: Open quick log
- **WHEN** the user taps the floating action button on Home
- **THEN** the quick log opens

### Requirement: Today follows the calendar
Home SHALL use the device's local date for "today". When the date changes while the app is open, or when the app returns to the foreground on a later date, Home SHALL recompute due habits, upcoming deadlines and urgencies for the new date.

#### Scenario: New day
- **WHEN** a daily habit was checked yesterday and the app is brought back to the foreground today
- **THEN** the habit is listed unchecked

### Requirement: Home updates live
Home SHALL update immediately after any change to habits, habit checks, tasks, projects, key results or objectives, without a manual refresh.

#### Scenario: Project activated elsewhere
- **WHEN** the user activates a backlog project in the Plan tab and switches to Home
- **THEN** the project is listed under active projects
