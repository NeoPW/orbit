# work-log Specification

## Purpose

Records the work done on projects as log entries (manually, from habits and from completed tasks), makes logging possible in two taps from Home, and lets the user see and remove a project's entries.

## Requirements

### Requirement: Log work
Home's "Log work" SHALL open a sheet with optional fields for a start time (`HH:mm`, today), a duration in minutes and a note, followed by the active projects and the open tasks outside projects. Clicking one SHALL save a log entry for it with the entered duration and note and source `manual` (for a task also its goal, if assigned), close the sheet and show "Work logged". Without a start time the entry's time SHALL be the current time (the work ended now). With a start time the entry's time SHALL be the start plus the duration (the work ended then), or the start itself when there is no duration. A start time later than the current time SHALL be rejected with an error and nothing saved.

#### Scenario: Two clicks
- **WHEN** the user clicks "Log work" on Home and then the project "Thesis"
- **THEN** a manual log entry for "Thesis" with the current time and no duration exists

#### Scenario: With duration and note
- **WHEN** the user enters 45 minutes and the note "Chapter 2" and clicks "Thesis"
- **THEN** the entry for "Thesis" has a duration of 45 minutes and the note "Chapter 2"

#### Scenario: No start time
- **WHEN** it is 15:00, the user enters 45 minutes without a start time and clicks "Thesis"
- **THEN** the entry's time is 15:00 and the timeline shows it from 14:15 to 15:00

#### Scenario: Start time
- **WHEN** it is 15:00, the user enters a start time of 13:00 and 90 minutes and clicks "Thesis"
- **THEN** the entry's time is 14:30 and the timeline shows it from 13:00 to 14:30

#### Scenario: Start without duration
- **WHEN** the user enters a start time of 13:00 without a duration and clicks "Thesis"
- **THEN** the entry's time is 13:00 and it is shown as a dot at 13:00

#### Scenario: Start in the future
- **WHEN** it is 15:00 and the user enters a start time of 16:00 and clicks "Thesis"
- **THEN** an error is shown and no entry is created

#### Scenario: Nothing to log on
- **WHEN** there is no active project and no open task outside projects
- **THEN** the sheet shows an empty state and creates nothing

#### Scenario: Log on a task
- **WHEN** the user clicks the standalone task "Tax return" in Log work
- **THEN** a manual entry for that task exists and is listed on its task page

### Requirement: Recently used projects first
Log work SHALL list the active projects and then the open tasks outside projects; within each group, items with log entries SHALL come first, ordered by their most recent entry (newest first), followed by the rest ordered by title.

#### Scenario: Recent first
- **WHEN** project B was logged yesterday, project A last week and project C never
- **THEN** Log work lists B, A, C

### Requirement: Duration validation
A duration SHALL be empty or a whole number of minutes from 1 to 1440. With an invalid duration, no entry SHALL be saved and the field SHALL show an error.

#### Scenario: Invalid duration
- **WHEN** the user enters 0 as duration and taps a project
- **THEN** no entry is saved and the duration field shows an error

### Requirement: Log work from project detail
The project detail's "Log work" action SHALL open a form with the project already chosen, optional duration and note, and a save button. Saving SHALL create a manual log entry for the project with the current time.

#### Scenario: Log from detail
- **WHEN** the user uses "Log work" in a project's detail, enters 30 minutes and saves
- **THEN** a manual 30-minute entry for that project is listed first in its log

### Requirement: Log entry display
Each listed log entry SHALL show its date as `dd-mm-yyyy` and local time as `HH:mm`, its duration if set (for example "45 min" or "1 h 30 min"), its note, and its source (manual, habit, task or timer) as an icon with its name as tooltip.

#### Scenario: Duration format
- **WHEN** a log entry has a duration of 90 minutes
- **THEN** it shows "1 h 30 min"

### Requirement: Delete log entry
The user SHALL be able to delete a log entry after confirming. Deleting an entry created by a habit check SHALL also remove that habit check.

#### Scenario: Delete manual entry
- **WHEN** the user deletes a manual log entry and confirms
- **THEN** the entry is no longer listed

#### Scenario: Delete habit entry
- **WHEN** the user deletes the log entry of today's check of habit "Run" and confirms
- **THEN** "Run" is shown unchecked on Home
