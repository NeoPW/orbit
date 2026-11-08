# plan-overview Specification

## Purpose

Defines the Plan tab: the structured overview of active goals, their measures and the active projects behind them, plus the backlog and the archive, and the entry points for creating and editing plan items.

## Requirements

### Requirement: Project entries
Each project entry in the Plan tab SHALL show its title, area, importance and effective deadline (or that it has none). Within a section or goal, projects SHALL be ordered by importance (highest first), then effective deadline (earliest first, none last), then title.

#### Scenario: Project ordering
- **WHEN** a goal has active projects A (importance 3, deadline 2026-11-01), B (importance 5, no deadline) and C (importance 3, no deadline)
- **THEN** they are listed in the order B, A, C

### Requirement: Backlog
The Plan tab SHALL provide a Backlog view listing all projects with status `backlog` or `paused`, each marked with its status. The backlog SHALL be filterable by area, including an option for projects without an area; the default shows all areas.

#### Scenario: Backlog content
- **WHEN** projects exist with statuses active, backlog, paused and completed
- **THEN** the Backlog lists exactly the backlog and paused projects

#### Scenario: Filter by area
- **WHEN** the user filters the Backlog by area "Uni"
- **THEN** only backlog and paused projects in "Uni" are listed

#### Scenario: Filter without area
- **WHEN** the user filters the Backlog by "No area"
- **THEN** only backlog and paused projects without an area are listed

### Requirement: Activate from backlog
Each Backlog entry SHALL offer an action to activate the project, which sets its status to `active`.

#### Scenario: Activate project
- **WHEN** the user activates a backlog project serving an active goal
- **THEN** the project disappears from the Backlog and appears under its goal without reloading

### Requirement: Archive
The Plan tab SHALL provide access to an Archive listing goals with status `completed` or `archived` and projects with status `completed`, most recently updated first. Opening an archived item SHALL open its page, where its status can be changed back.

#### Scenario: Archive content
- **WHEN** the user opens the Archive
- **THEN** completed and archived goals and completed projects are listed, and no active, backlog or paused items

#### Scenario: Restore project
- **WHEN** the user opens a completed project from the Archive and sets its status to active in its status chip
- **THEN** the project leaves the Archive and appears in the Plan tab

### Requirement: Live updates
All Plan tab views SHALL update immediately after any create, edit, status change or delete, without a manual refresh or reload.

#### Scenario: Status change reflected
- **WHEN** the user changes a project from active to backlog in the project form and returns to the Plan tab
- **THEN** the project is shown in the Backlog and no longer in its previous section

### Requirement: Create from Plan
Plan's header SHALL offer "New" with a menu to create a goal, a project, a task or a habit; the chosen form SHALL open in a sheet over Plan. Each page SHALL offer Edit, which opens its form in a sheet. Measures SHALL be added on the goal page.

#### Scenario: Create from Plan
- **WHEN** the user chooses "New" → "Project" in Plan
- **THEN** the project form opens in a sheet over Plan

#### Scenario: Edit from the page
- **WHEN** the user clicks a goal in Plan and then Edit on its page
- **THEN** the goal's edit form opens in a sheet

#### Scenario: Measure in the goals list
- **WHEN** the user clicks a measure in the Goals section
- **THEN** the page of its goal opens

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

### Requirement: Projects without a goal
Active projects that serve no goal SHALL be listed in a separate section below the goals. Active projects whose goal is not active SHALL also be listed there, showing the goal's title, so that no active project is hidden.

#### Scenario: Active project without goal
- **WHEN** an active project serves no goal
- **THEN** it is listed under "Projects without a goal"

#### Scenario: Goal completed
- **WHEN** an active project serves a goal with status completed
- **THEN** it is listed under "Projects without a goal" together with the goal's title

#### Scenario: Backlog project without goal
- **WHEN** a backlog project serves no goal
- **THEN** it is not listed under "Projects without a goal"
