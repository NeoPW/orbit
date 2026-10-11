# Spec Delta

## MODIFIED Requirements

### Requirement: Open project detail
Tapping a project on Home, in the Plan tab's Overview, on a goal page or in the Backlog SHALL open its project detail. The detail SHALL have its own URL so a browser reload reopens it.

#### Scenario: From Plan Overview
- **WHEN** the user taps a project under a goal in the Plan tab
- **THEN** that project's detail opens

#### Scenario: Reload in browser
- **WHEN** a project detail is open in the browser and the page is reloaded
- **THEN** the same project detail is shown

### Requirement: Project information
The project detail SHALL start with a header showing the title, a status chip, the area chip, the importance as dots and the deadline badge (marked when the effective deadline is inherited from the goal), followed by the description and the goal it serves in the goal's color. Tapping the goal SHALL open its page. Values that are not set SHALL be left out. An edit action in the top bar SHALL open the project's edit form.

#### Scenario: Inherited deadline
- **WHEN** a project without own deadline serves a goal ending 2026-12-31
- **THEN** the detail shows a deadline badge for 31-12-2026 marked as inherited from the goal

#### Scenario: Open the goal
- **WHEN** the user taps the goal "Get job" on the detail of "Create app"
- **THEN** the goal page of "Get job" opens

#### Scenario: Edit
- **WHEN** the user uses the edit action and changes the importance to 5
- **THEN** the detail shows five of five importance dots after saving
