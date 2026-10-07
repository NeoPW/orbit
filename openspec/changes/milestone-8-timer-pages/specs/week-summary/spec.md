# Spec Delta

## ADDED Requirements

### Requirement: Summary of any week
A summary SHALL be available for any Monday–Sunday week (the current week, last week, the review week and the week of any past review) and SHALL be computed from the stored log entries, habit checks and completed tasks of that week. Habit adherence SHALL use the habits' current schedules and active state.

#### Scenario: Past week
- **WHEN** the summary of a week three weeks ago is shown
- **THEN** it lists the work logged, the habit check-ins and the tasks completed in that week

#### Scenario: Current week so far
- **WHEN** today is Wednesday and the summary of the current week is shown
- **THEN** it counts work, check-ins and completed tasks from Monday until now

## MODIFIED Requirements

### Requirement: KR progress and change
The summary SHALL list KRs with their progress and, when an earlier completed review stored a snapshot for the KR, the change in percentage points since the most recent such snapshot. For a week whose review is completed, the KRs and their progress SHALL be the snapshots stored with that review; for any other week, the KRs of active objectives with their current progress.

#### Scenario: Change since previous review
- **WHEN** a KR is at 55 % and the previous completed review stored 40 % for it
- **THEN** it shows 55 % and +15

#### Scenario: No earlier snapshot
- **WHEN** no completed review stored a snapshot for a KR
- **THEN** it shows its current progress without a change

#### Scenario: Reviewed week
- **WHEN** the review of a past week stored 40 % for a KR that is at 70 % today
- **THEN** that week's summary shows 40 % for the KR
