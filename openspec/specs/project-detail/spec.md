# project-detail Specification

## Purpose

Gives each project a detail screen to get back into it quickly: its fields and effective deadline, the next step and open tasks, its habits and logged work, and actions to change its status.

## Requirements

### Requirement: Open project detail
Tapping a project on Home, in the Plan tab's Overview or in the Backlog SHALL open its project detail. The detail SHALL have its own URL so a browser reload reopens it.

#### Scenario: From Plan Overview
- **WHEN** the user taps a project under a KR in the Plan tab
- **THEN** that project's detail opens

#### Scenario: Reload in browser
- **WHEN** a project detail is open in the browser and the page is reloaded
- **THEN** the same project detail is shown

### Requirement: Project information
The project detail SHALL start with a header showing the title, a status chip, the area chip, the importance as dots and the deadline badge (marked when the effective deadline is inherited from the KR), followed by the description and the linked KR. Values that are not set SHALL be left out. An edit action in the top bar SHALL open the project's edit form.

#### Scenario: Inherited deadline
- **WHEN** a project without own deadline is linked to a KR due 2026-11-15
- **THEN** the detail shows a deadline badge for 15-11-2026 marked as inherited from the key result

#### Scenario: Edit
- **WHEN** the user uses the edit action and changes the importance to 5
- **THEN** the detail shows five of five importance dots after saving

### Requirement: Next step and open tasks in detail
The project detail SHALL show the project's open tasks with the next step marked in that list and placed first (or a hint "No next step" with an action to set one), and SHALL provide the task actions defined in tasks. Tapping a task SHALL open its task page. The next step SHALL NOT be shown twice.

#### Scenario: Next step shown
- **WHEN** a project's next step is the task "Write intro"
- **THEN** the detail lists "Write intro" first in the open tasks, marked as next step, and nowhere else

#### Scenario: Open a task
- **WHEN** the user taps the open task "Book venue"
- **THEN** its task page opens

### Requirement: Habits in detail
The project detail SHALL list the habits linked to the project with their schedule summary and whether they are inactive, or "No habits". Tapping a habit SHALL open its edit form.

#### Scenario: Linked habit
- **WHEN** a habit "Run" with schedule "Mon, Wed, Fri" is linked to the project
- **THEN** the detail lists "Run" with "Mon, Wed, Fri"

### Requirement: Log entries in detail
The project detail SHALL list the project's log entries, most recent first (see work-log), or "Nothing logged yet", and SHALL offer a "Log work" action.

#### Scenario: Newest first
- **WHEN** a project has log entries from Monday and Wednesday
- **THEN** Wednesday's entry is listed first

### Requirement: Status actions
Tapping the status chip SHALL offer the statuses Active, Paused, Backlog and Completed, except the current one. Choosing one SHALL set the corresponding status (`active`, `paused`, `backlog`, `completed`) immediately.

#### Scenario: Pause
- **WHEN** the user pauses an active project from its detail
- **THEN** the project's status is paused, it leaves Home and appears in the Backlog

#### Scenario: Complete
- **WHEN** the user completes a project from its detail
- **THEN** the project's status is completed and it appears in the Archive

#### Scenario: Current status not offered
- **WHEN** the project is active
- **THEN** the status chip offers Paused, Backlog and Completed, but not Active

### Requirement: Missing project
When the project of a detail does not exist or was deleted, the detail SHALL show "Project not found" instead of its content.

#### Scenario: Deleted from edit form
- **WHEN** the user deletes the project from its edit form opened from the detail
- **THEN** the edit form closes and the detail shows "Project not found"

### Requirement: Detail updates live
The project detail SHALL update immediately after any change to the project, its tasks, its habits or its log entries.

#### Scenario: Task added
- **WHEN** the user adds a task in the detail
- **THEN** the task appears in the open tasks without a reload
