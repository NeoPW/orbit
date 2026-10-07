# Spec Delta

## MODIFIED Requirements

### Requirement: Quick log
Quick log SHALL show a switch between "Log" and "Start timer", optional fields for a duration in minutes and a note (in "Log" only), followed by the active projects and the open tasks that are not part of a project. In "Log", tapping one SHALL save a log entry for it with the current time, the entered duration and note, and source `manual` (for a task also its KR, if assigned), then close quick log and confirm the entry. In "Start timer", tapping one SHALL start a timer for it (see work-timer) and close quick log.

#### Scenario: Two taps
- **WHEN** the user taps the quick-log button on Home and then the project "Thesis"
- **THEN** a manual log entry for "Thesis" with the current time and no duration exists

#### Scenario: With duration and note
- **WHEN** the user enters 45 minutes and the note "Chapter 2" and taps "Thesis"
- **THEN** the entry for "Thesis" has a duration of 45 minutes and the note "Chapter 2"

#### Scenario: No active projects
- **WHEN** there is no active project and no open task outside projects
- **THEN** quick log shows a text that there is nothing to log on and creates nothing

#### Scenario: Log on a task
- **WHEN** the user taps the standalone task "Tax return" in quick log
- **THEN** a manual entry for that task exists and is listed on its task page

#### Scenario: Start timer mode
- **WHEN** the user switches quick log to "Start timer" and taps "Thesis"
- **THEN** no log entry is created, a timer for "Thesis" runs, and the duration and note fields are hidden

#### Scenario: Log is the default
- **WHEN** the user opens quick log
- **THEN** it is in "Log" mode
