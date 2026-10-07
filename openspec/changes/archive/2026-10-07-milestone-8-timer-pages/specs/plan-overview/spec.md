# Spec Delta

## ADDED Requirements

### Requirement: More sheet
The Plan tab's top bar SHALL have a More button that opens a sheet with one large tile each for Habits, Areas and Archive, with an icon and a label. Tapping a tile SHALL close the sheet and open that screen.

#### Scenario: Open Areas
- **WHEN** the user taps More in the Plan tab and then the Areas tile
- **THEN** the Areas screen opens

## MODIFIED Requirements

### Requirement: Objectives section
The Plan tab SHALL list every objective with status `active`, one after another in sort order. Each objective SHALL show its title, date range and deadline badge (see objectives), the open tasks assigned to the objective, and its key results in sort order, each with its progress (see key-results), and under each KR the `active` projects and the open tasks assigned to it. Tapping an objective or KR SHALL open its page.

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

#### Scenario: Overdue objective in the list
- **WHEN** an active objective's end date has passed
- **THEN** it is listed with a red "Overdue" badge

### Requirement: Archive
The Plan tab SHALL provide access to an Archive listing objectives with status `completed` or `archived` and projects with status `completed`, most recently updated first. Opening an archived item SHALL open its page, where its status can be changed back.

#### Scenario: Archive content
- **WHEN** the user opens the Archive
- **THEN** completed and archived objectives and completed projects are listed, and no active, backlog or paused items

#### Scenario: Restore project
- **WHEN** the user opens a completed project from the Archive and sets its status to active in its status chip
- **THEN** the project leaves the Archive and appears in the Plan tab

### Requirement: Entry points for creating and editing
From the Plan tab the user SHALL be able to create an objective, a project, a task and a habit, add a key result to an objective, open Habits, Areas and Archive from the More sheet and Settings from the settings button. Tapping an objective, KR, project or task SHALL open its page, never its edit form; each page SHALL offer Edit. Creating and editing SHALL happen in a sheet (see visual-design), not on a separate page.

#### Scenario: Create from Plan tab
- **WHEN** the user uses the Plan tab's create action
- **THEN** they can choose to create an objective, a project, a task or a habit, and the chosen form opens in a sheet over the Plan tab

#### Scenario: Edit by tapping
- **WHEN** the user taps a KR in the objectives section and then Edit on its page
- **THEN** the KR's edit form opens in a sheet

#### Scenario: Open project detail
- **WHEN** the user taps a project in the Overview or the Backlog
- **THEN** the project's detail opens

#### Scenario: Open settings
- **WHEN** the user taps the settings button in the Plan tab's top bar
- **THEN** the Settings screen opens

#### Scenario: Old form URL
- **WHEN** the app is opened at the former edit URL of a KR
- **THEN** the KR's page is shown

### Requirement: Usable at phone and desktop width
The Plan tab and all its forms SHALL be usable at phone width and at desktop browser width; on wide screens content SHALL be limited to a readable maximum width instead of stretching across the window, and at 1000 pixels or more the selected objective, KR, project or task SHALL be shown next to the list (see visual-design).

#### Scenario: Desktop browser
- **WHEN** the Plan tab is shown in a 1600 pixel wide browser window
- **THEN** the content is limited to readable widths and no text runs across the full window

#### Scenario: KR in the detail pane
- **WHEN** the window is 1400 pixels wide and the user taps a KR in the Plan tab
- **THEN** the KR page is shown to the right of the list
