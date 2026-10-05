# plan-overview Specification

## Purpose

Defines the Plan tab: the structured overview of active objectives, their key results and the active projects behind them, plus the backlog and the archive, and the entry points for creating and editing plan items.

## Requirements

### Requirement: Objectives section
The Plan tab SHALL list every objective with status `active`, one after another in sort order. Each objective SHALL show its title and date range, followed by its key results in sort order, each with its progress (see key-results), and under each KR the `active` projects linked to it.

#### Scenario: Objective with KRs and projects
- **WHEN** an active objective has two KRs and one active project linked to the first KR
- **THEN** the objective is shown with its date range, both KRs with progress, and the project under the first KR

#### Scenario: Non-active objectives hidden
- **WHEN** an objective has status completed or archived
- **THEN** it is not shown in the objectives section

#### Scenario: Backlog project under KR hidden
- **WHEN** a project linked to a KR has status backlog or paused
- **THEN** it is not shown under the KR

#### Scenario: Objective without KRs
- **WHEN** an active objective has no KRs
- **THEN** it shows a hint and an action to add a key result

#### Scenario: No active objectives
- **WHEN** there is no active objective
- **THEN** the section shows an empty state with an action to create an objective

### Requirement: Project entries
Each project entry in the Plan tab SHALL show its title, area, importance and effective deadline (or that it has none). Within a section or KR, projects SHALL be ordered by importance (highest first), then effective deadline (earliest first, none last), then title.

#### Scenario: Project ordering
- **WHEN** a KR has active projects A (importance 3, deadline 2026-11-01), B (importance 5, no deadline) and C (importance 3, no deadline)
- **THEN** they are listed in the order B, A, C

### Requirement: Projects without a KR
Active projects that are not linked to a KR SHALL be listed in a separate section below the objectives. Active projects whose KR belongs to an objective that is not active SHALL also be listed there, showing the KR's title, so that no active project is hidden.

#### Scenario: Active project without KR
- **WHEN** an active project has no KR
- **THEN** it is listed under "Projects without a KR"

#### Scenario: KR of a completed objective
- **WHEN** an active project is linked to a KR whose objective has status completed
- **THEN** it is listed under "Projects without a KR" together with the KR's title

#### Scenario: Backlog project without KR
- **WHEN** a backlog project has no KR
- **THEN** it is not listed under "Projects without a KR"

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
- **WHEN** the user activates a backlog project linked to a KR of an active objective
- **THEN** the project disappears from the Backlog and appears under its KR without reloading

### Requirement: Archive
The Plan tab SHALL provide access to an Archive listing objectives with status `completed` or `archived` and projects with status `completed`, most recently updated first. Opening an archived item SHALL open its edit form, so its status can be changed back.

#### Scenario: Archive content
- **WHEN** the user opens the Archive
- **THEN** completed and archived objectives and completed projects are listed, and no active, backlog or paused items

#### Scenario: Restore project
- **WHEN** the user opens a completed project from the Archive and sets its status to active
- **THEN** the project leaves the Archive and appears in the Plan tab

### Requirement: Live updates
All Plan tab views SHALL update immediately after any create, edit, status change or delete, without a manual refresh or reload.

#### Scenario: Status change reflected
- **WHEN** the user changes a project from active to backlog in the project form and returns to the Plan tab
- **THEN** the project is shown in the Backlog and no longer in its previous section

### Requirement: Entry points for creating and editing
From the Plan tab the user SHALL be able to create an objective, a project and a habit, add a key result to an objective, open the Areas, Habits and Archive screens, and open the edit form of any shown objective, KR or project by tapping it.

#### Scenario: Create from Plan tab
- **WHEN** the user uses the Plan tab's create action
- **THEN** they can choose to create an objective, a project or a habit

#### Scenario: Edit by tapping
- **WHEN** the user taps a KR in the objectives section
- **THEN** the KR's edit form opens

### Requirement: Usable at phone and desktop width
The Plan tab and all its forms SHALL be usable at phone width and at desktop browser width; on wide screens content SHALL be limited to a readable maximum width instead of stretching across the window.

#### Scenario: Desktop browser
- **WHEN** the Plan tab is shown in a 1600 pixel wide browser window
- **THEN** the content is centered with a limited width and no text runs across the full window
