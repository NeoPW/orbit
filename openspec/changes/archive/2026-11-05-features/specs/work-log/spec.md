# Spec Delta

## MODIFIED Requirements

### Requirement: Recently used projects first
Log work SHALL list the active projects and then the open tasks outside projects; within each group, items with log entries SHALL come first, ordered by their most recent entry (newest first), followed by the rest ordered by title.

#### Scenario: Recent first
- **WHEN** project B was logged yesterday, project A last week and project C never
- **THEN** Log work lists B, A, C

### Requirement: Log entry display
Each listed log entry SHALL show its date as `dd-mm-yyyy` and local time as `HH:mm`, its duration if set (for example "45 min" or "1 h 30 min"), its note, and its source (manual, habit, task or timer) as an icon with its name as tooltip.

#### Scenario: Duration format
- **WHEN** a log entry has a duration of 90 minutes
- **THEN** it shows "1 h 30 min"

## ADDED Requirements

### Requirement: Log work
Home's "Log work" SHALL open a sheet with optional fields for a duration in minutes and a note, followed by the active projects and the open tasks outside projects. Clicking one SHALL save a log entry for it with the current time, the entered duration and note, and source `manual` (for a task also its goal, if assigned), close the sheet and show "Work logged".

#### Scenario: Two clicks
- **WHEN** the user clicks "Log work" on Home and then the project "Thesis"
- **THEN** a manual log entry for "Thesis" with the current time and no duration exists

#### Scenario: With duration and note
- **WHEN** the user enters 45 minutes and the note "Chapter 2" and clicks "Thesis"
- **THEN** the entry for "Thesis" has a duration of 45 minutes and the note "Chapter 2"

#### Scenario: Nothing to log on
- **WHEN** there is no active project and no open task outside projects
- **THEN** the sheet shows an empty state and creates nothing

#### Scenario: Log on a task
- **WHEN** the user clicks the standalone task "Tax return" in Log work
- **THEN** a manual entry for that task exists and is listed on its task page

## REMOVED Requirements

### Requirement: Quick log
**Reason**: Starting a timer moved to the focus panel (see work-timer); recording work without a timer is "Log work".
**Migration**: Replaced by "Log work".
