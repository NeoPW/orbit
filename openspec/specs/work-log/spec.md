# work-log Specification

## Purpose

Records the work done on projects as log entries (manually, from habits and from completed tasks), makes logging possible in two taps from Home, and lets the user see and remove a project's entries.

## Requirements

### Requirement: Quick log
Quick log SHALL show optional fields for a duration in minutes and a note, followed by the list of active projects. Tapping a project SHALL save a log entry for it with the current time, the entered duration and note, and source `manual`, then close quick log and confirm the entry.

#### Scenario: Two taps
- **WHEN** the user taps the quick-log button on Home and then the project "Thesis"
- **THEN** a manual log entry for "Thesis" with the current time and no duration exists

#### Scenario: With duration and note
- **WHEN** the user enters 45 minutes and the note "Chapter 2" and taps "Thesis"
- **THEN** the entry for "Thesis" has a duration of 45 minutes and the note "Chapter 2"

#### Scenario: No active projects
- **WHEN** there is no active project
- **THEN** quick log shows a text that there are no active projects and creates nothing

### Requirement: Recently used projects first
Quick log SHALL list projects that have log entries first, ordered by their most recent entry (newest first), followed by the remaining active projects ordered by title.

#### Scenario: Recent first
- **WHEN** project B was logged yesterday, project A last week and project C never
- **THEN** quick log lists B, A, C

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
Each listed log entry SHALL show its date as `dd-mm-yyyy` and local time as `HH:mm`, its duration if set (for example "45 min" or "1 h 30 min"), its note, and its source (manual, habit or task).

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
