# Spec Delta

## MODIFIED Requirements

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
