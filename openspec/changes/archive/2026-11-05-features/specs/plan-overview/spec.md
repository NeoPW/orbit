# Spec Delta

## ADDED Requirements

### Requirement: Plan layout
The Plan screen SHALL be one page with the sections Goals, Projects without a goal, Backlog, Habits, Areas and Archive, limited to a readable width. Clicking a goal, project or task SHALL open its page (see app-shell, "Detail page addresses"), never its edit form; going back SHALL return to Plan.

#### Scenario: Open a project page
- **WHEN** the user clicks a project in the Backlog
- **THEN** the project's page opens, and going back shows Plan again

#### Scenario: Wide window
- **WHEN** Plan is shown in a 1600 pixel wide window
- **THEN** its content is limited to a readable width and no text runs across the full window

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
- **THEN** it is listed under that goal and clicking it opens its task page

#### Scenario: Overdue goal in the list
- **WHEN** an active goal's end date has passed
- **THEN** it is listed with a red "Overdue" badge

## REMOVED Requirements

### Requirement: Entry points for creating and editing
**Reason**: There is no More sheet and no settings button in Plan; Settings is in the sidebar and former key result addresses are gone (see app-shell).
**Migration**: Replaced by "Create from Plan" and "Plan layout".

### Requirement: Usable at phone and desktop width
**Reason**: Plan is designed for desktop widths and opens details as pages instead of a second pane.
**Migration**: Replaced by "Plan layout".

### Requirement: More sheet
**Reason**: Habits, Areas and Archive are sections of Plan.
**Migration**: See "Plan layout".

### Requirement: Goals section
**Reason**: Goals have no planets, and their measures are shown directly instead of collapsed behind a count.
**Migration**: Replaced by "Goals in Plan".
