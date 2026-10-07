# Spec Delta

## MODIFIED Requirements

### Requirement: Objectives section
The Plan tab SHALL list every objective with status `active`, one after another in sort order. Each objective SHALL show its title and date range, the open tasks assigned to the objective, and its key results in sort order, each with its progress (see key-results), and under each KR the `active` projects and the open tasks assigned to it.

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

#### Scenario: Tasks under a KR
- **WHEN** the open task "Book physio" is assigned to the KR "Run 100 km" of an active objective
- **THEN** it is listed under that KR and tapping it opens its task page

### Requirement: Entry points for creating and editing
From the Plan tab the user SHALL be able to create an objective, a project, a task and a habit, add a key result to an objective, open the Areas, Habits and Archive screens from the menu and Settings from the settings button, and open the edit form of any shown objective or KR by tapping it. Tapping a project in the Overview or the Backlog SHALL open its project detail (see project-detail).

#### Scenario: Create from Plan tab
- **WHEN** the user uses the Plan tab's create action
- **THEN** they can choose to create an objective, a project, a task or a habit

#### Scenario: Edit by tapping
- **WHEN** the user taps a KR in the objectives section
- **THEN** the KR's edit form opens

#### Scenario: Open project detail
- **WHEN** the user taps a project in the Overview or the Backlog
- **THEN** the project's detail opens

#### Scenario: Open settings
- **WHEN** the user taps the settings button in the Plan tab's top bar
- **THEN** the Settings screen opens

### Requirement: Usable at phone and desktop width
The Plan tab and all its forms SHALL be usable at phone width and at desktop browser width; on wide screens content SHALL be limited to a readable maximum width instead of stretching across the window, and at 1000 pixels or more the selected project or task SHALL be shown next to the list (see visual-design).

#### Scenario: Desktop browser
- **WHEN** the Plan tab is shown in a 1600 pixel wide browser window
- **THEN** the content is limited to readable widths and no text runs across the full window
