# Spec Delta

## ADDED Requirements

### Requirement: Goals section
The Plan tab SHALL list every goal with status `active`, one after another in sort order. Each goal SHALL show its planet, title, progress, date range and deadline badge (see goals), a measures line ("3 measures") that expands to its measures in order with their progress bars and an "Add measure" action, the `active` projects serving it and the open tasks assigned to it. Tapping a goal SHALL open its page.

#### Scenario: Goal with measures and projects
- **WHEN** an active goal has two measures and one active project serving it
- **THEN** the goal is shown with its date range, "2 measures" and the project, and expanding "2 measures" shows both measures with progress

#### Scenario: Non-active goals hidden
- **WHEN** a goal has status completed or archived
- **THEN** it is not shown in the goals section

#### Scenario: Backlog project hidden
- **WHEN** a project serving an active goal has status backlog or paused
- **THEN** it is not shown under the goal

#### Scenario: Goal without measures
- **WHEN** an active goal has no measures
- **THEN** it shows no percentage and offers to add a measure

#### Scenario: Measures collapsed by default
- **WHEN** the Plan tab opens
- **THEN** each goal's measures are collapsed to their count and expand when the line is tapped

#### Scenario: Add a measure from the Plan tab
- **WHEN** the user expands the measures of "Get fit" and taps "Add measure"
- **THEN** the measure form for "Get fit" opens

#### Scenario: No active goals
- **WHEN** there is no active goal
- **THEN** the section shows an empty state with an action to create a goal

#### Scenario: Task under a goal
- **WHEN** the open task "Book physio" is assigned to the active goal "Get fit"
- **THEN** it is listed under that goal and tapping it opens its task page

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

## MODIFIED Requirements

### Requirement: Project entries
Each project entry in the Plan tab SHALL show its title, area, importance and effective deadline (or that it has none). Within a section or goal, projects SHALL be ordered by importance (highest first), then effective deadline (earliest first, none last), then title.

#### Scenario: Project ordering
- **WHEN** a goal has active projects A (importance 3, deadline 2026-11-01), B (importance 5, no deadline) and C (importance 3, no deadline)
- **THEN** they are listed in the order B, A, C

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

### Requirement: Entry points for creating and editing
From the Plan tab the user SHALL be able to create a goal, a project, a task and a habit, add a measure on a goal's page, open Habits, Areas and Archive from the More sheet and Settings from the settings button. Tapping a goal, project or task SHALL open its page, never its edit form; each page SHALL offer Edit. Creating and editing SHALL happen in a sheet (see visual-design), not on a separate page.

#### Scenario: Create from Plan tab
- **WHEN** the user uses the Plan tab's create action
- **THEN** they can choose to create a goal, a project, a task or a habit, and the chosen form opens in a sheet over the Plan tab

#### Scenario: Edit by tapping
- **WHEN** the user taps a goal in the goals section and then Edit on its page
- **THEN** the goal's edit form opens in a sheet

#### Scenario: Open project detail
- **WHEN** the user taps a project in the Overview or the Backlog
- **THEN** the project's detail opens

#### Scenario: Open settings
- **WHEN** the user taps the settings button in the Plan tab's top bar
- **THEN** the Settings screen opens

#### Scenario: Measure in the goals list
- **WHEN** the user taps a measure in the goals section
- **THEN** the page of its goal opens

#### Scenario: Old form URL
- **WHEN** the app is opened at the former edit URL of a key result
- **THEN** the page of the goal its measure belongs to is shown

### Requirement: Usable at phone and desktop width
The Plan tab and all its forms SHALL be usable at phone width and at desktop browser width; on wide screens content SHALL be limited to a readable maximum width instead of stretching across the window, and at 1000 pixels or more the selected goal, project or task SHALL be shown next to the list (see visual-design).

#### Scenario: Desktop browser
- **WHEN** the Plan tab is shown in a 1600 pixel wide browser window
- **THEN** the content is limited to readable widths and no text runs across the full window

#### Scenario: Goal in the detail pane
- **WHEN** the window is 1400 pixels wide and the user taps a goal in the Plan tab
- **THEN** the goal page is shown to the right of the list

#### Scenario: KR in the detail pane
- **WHEN** the window is 1400 pixels wide and the user taps a measure in the Plan tab
- **THEN** the page of its goal is shown to the right of the list

## REMOVED Requirements

### Requirement: Objectives section
**Reason**: Objectives are renamed to goals and key results are replaced by measures.
**Migration**: See "Goals section" above.

### Requirement: Projects without a KR
**Reason**: Projects serve a goal instead of a key result.
**Migration**: See "Projects without a goal" above.
