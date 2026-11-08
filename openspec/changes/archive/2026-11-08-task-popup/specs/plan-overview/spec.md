## MODIFIED Requirements

### Requirement: Plan layout
The Plan screen SHALL be one page with the sections Goals, Projects without a goal, Backlog, Habits, Areas and Archive, limited to a readable width. Clicking a goal or project SHALL open its page (see app-shell, "Detail page addresses") and clicking a task SHALL open it in the task popup (see tasks, "Task popup"), never an edit form; going back from a page SHALL return to Plan.

#### Scenario: Open a project page
- **WHEN** the user clicks a project in the Backlog
- **THEN** the project's page opens, and going back shows Plan again

#### Scenario: Wide window
- **WHEN** Plan is shown in a 1600 pixel wide window
- **THEN** its content is limited to a readable width and no text runs across the full window

### Requirement: Goals in Plan
The Goals section SHALL list every goal with status `active` in sort order. Each goal SHALL show its color, title, progress bar with percentage, date range and deadline badge (see goals), its measures with their progress bars, the `active` projects serving it and the open tasks assigned to it. Clicking a goal SHALL open its page. Without active goals the section SHALL show an empty state with "New goal".

#### Scenario: Goal with measures and projects
- **WHEN** an active goal has two measures and one active project serving it
- **THEN** the goal is shown with its date range, both measures with their progress and the project

#### Scenario: Non-active goals hidden
- **WHEN** a goal has status completed or archived
- **THEN** it is not shown in the Goals section

#### Scenario: Backlog project hidden
- **WHEN** a project serving an active goal has status backlog or paused
- **THEN** it is not shown under the goal

#### Scenario: Goal without measures
- **WHEN** an active goal has no measures
- **THEN** it shows no percentage and no progress bar

#### Scenario: No active goals
- **WHEN** there is no active goal
- **THEN** the section shows an empty state with "New goal"

#### Scenario: Task under a goal
- **WHEN** the open task "Book physio" is assigned to the active goal "Get fit"
- **THEN** it is listed under that goal and clicking it opens its task popup

#### Scenario: Overdue goal in the list
- **WHEN** an active goal's end date has passed
- **THEN** it is listed with a red "Overdue" badge
