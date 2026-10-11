# Spec Delta

## MODIFIED Requirements

### Requirement: Stop a timer
Stopping a timer SHALL create a log entry with source `timer`, the timer's start time as its time, the elapsed whole minutes as its duration (at least 1), and the timer's project, or its task together with the task's project or goal. Stopping SHALL end the timer and confirm the entry.

#### Scenario: Stop after 45 minutes
- **WHEN** a timer for "Thesis" started at 09:00 is stopped at 09:45
- **THEN** a log entry for "Thesis" at 09:00 with 45 minutes and source timer exists, and no timer runs

#### Scenario: Very short timer
- **WHEN** a timer is stopped after 20 seconds
- **THEN** the entry has a duration of 1 minute

#### Scenario: Timer for a task
- **WHEN** a timer for the task "Book physio", assigned to the goal "Get fit", is stopped
- **THEN** the entry belongs to the task and the goal and is listed on the task page
