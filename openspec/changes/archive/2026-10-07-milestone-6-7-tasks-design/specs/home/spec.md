# Spec Delta

## ADDED Requirements

### Requirement: Today header
Home SHALL start with a header showing today's date and today's progress: habits checked of habits due today as an orbit ring, and the number of open tasks due today or overdue.

#### Scenario: Progress
- **WHEN** 1 of 3 habits due today is checked and 2 tasks are due today
- **THEN** the header shows a ring with "1/3" and "2 tasks due"

### Requirement: Tasks on Home
Below the active projects, Home SHALL list the open tasks that are not part of a project (standalone or assigned to a KR or objective), ordered by deadline (overdue first, none last), then by creation. Each task SHALL show a checkbox, its title, what it is assigned to and its deadline badge. Ticking the checkbox SHALL complete it (with Undo); tapping elsewhere SHALL open its task page.

#### Scenario: Order
- **WHEN** standalone tasks A (no deadline), B (due tomorrow) and C (overdue) are open
- **THEN** Home lists C, B, A

#### Scenario: Project tasks not repeated
- **WHEN** a project's open task is not assigned elsewhere
- **THEN** it does not appear in Home's Tasks section

### Requirement: New task from Home
Home SHALL have a second floating button on the left that opens a sheet to create a task with title, optional deadline and optional assignment (project, KR or objective). Saving with only a title SHALL create a standalone task.

#### Scenario: Two buttons
- **WHEN** Home is shown
- **THEN** a new-task button is shown bottom left and the quick-log button bottom right

## MODIFIED Requirements

### Requirement: Home sections
The Home tab SHALL show, from top to bottom, the today header and the sections "Habits due today", "Upcoming deadlines", "Active projects" and "Tasks". A section without items SHALL show a short empty state instead of being hidden.

#### Scenario: Section order
- **WHEN** there are due habits, upcoming deadlines, active projects and open tasks outside projects
- **THEN** Home shows habits first, then deadlines, then projects, then tasks

#### Scenario: Empty section
- **WHEN** no habit is due today
- **THEN** the "Habits due today" section shows an empty state and the other sections are still shown

### Requirement: Habits due today on Home
The "Habits due today" section SHALL show every active habit that is due today (see habits) or already checked today as a chip with its title, labeled with the title of its linked project, or of its KR when it has no project, and visibly marked when checked today. Tapping a chip SHALL check or uncheck the habit for today.

#### Scenario: Habit labeled by project
- **WHEN** an active daily habit "Stretch" is linked to project "Marathon"
- **THEN** Home shows an unchecked chip "Stretch" labeled "Marathon"

#### Scenario: Checked habit stays listed
- **WHEN** a habit with 3 times per week has 2 earlier check-ins this week and the user checks it today
- **THEN** it stays on Home, shown as checked

#### Scenario: Check from Home
- **WHEN** the user taps the chip of an unchecked habit
- **THEN** the habit is shown as checked and a log entry for it exists

### Requirement: Upcoming deadlines content
The "Upcoming deadlines" section SHALL list items whose own deadline is overdue or at most the deadline lead time (see settings, default 7 days) after today and that have no card of their own on Home: open tasks of active projects (due date) and KRs of active objectives with progress below 1 (own deadline). Active projects and tasks outside projects SHALL NOT be listed here; their deadline is shown as a badge on their own card. Deadlines inherited from a KR or objective SHALL NOT be listed. Without items, the section SHALL say that nothing is due in the next N days, N being the lead time.

#### Scenario: Within lead time
- **WHEN** today is 2026-10-05 and an open task of an active project is due 2026-10-12
- **THEN** the task is listed under upcoming deadlines

#### Scenario: Beyond lead time
- **WHEN** today is 2026-10-05 and an open task of an active project is due 2026-10-13
- **THEN** the task is not listed under upcoming deadlines

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

#### Scenario: Project not repeated
- **WHEN** an active project's own deadline is tomorrow
- **THEN** it is not listed under upcoming deadlines and its card shows "Due tomorrow"

### Requirement: Project card
Each project card SHALL show the title, the area as a colored chip (when set), a deadline badge and the next step as a checkbox row. The badge SHALL read "Overdue", "Due today", "Due tomorrow", "Due in N days" up to 30 days, or "Due dd-mm-yyyy" beyond that, based on the effective deadline. Projects without an effective deadline SHALL show no badge. A project without a next step SHALL show "No next step".

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
