# Spec Delta

## MODIFIED Requirements

### Requirement: Log entry display
Each listed log entry SHALL show its date as `dd-mm-yyyy` and local time as `HH:mm`, its duration if set (for example "45 min" or "1 h 30 min"), its note, and its source (manual, habit, task, timer or workout) as an icon with its name as tooltip.

#### Scenario: Duration format
- **WHEN** a log entry has a duration of 90 minutes
- **THEN** it shows "1 h 30 min"

#### Scenario: Workout source
- **WHEN** a workout log entry is listed
- **THEN** it shows the workout icon with the tooltip "Workout"

### Requirement: Delete log entry
The user SHALL be able to delete a log entry after confirming. Deleting an entry created by a habit check SHALL also remove that habit check. A workout entry SHALL NOT offer delete in the list; it is removed by deleting its session on the phone.

#### Scenario: Delete manual entry
- **WHEN** the user deletes a manual log entry and confirms
- **THEN** the entry is no longer listed

#### Scenario: Delete habit entry
- **WHEN** the user deletes the log entry of today's check of habit "Run" and confirms
- **THEN** "Run" is shown unchecked on Home

#### Scenario: Workout entry
- **WHEN** a workout log entry is listed on a project page
- **THEN** it has no delete button
