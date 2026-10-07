# week-summary Specification

## Purpose

Summarizes a Monday–Sunday week from the recorded data: the work logged per project, how well habits were kept, the tasks completed, and how the key results moved since the previous review.

## Requirements

### Requirement: Work per project
The summary SHALL list, for each project with log entries in the week, the number of entries and their total duration, ordered by total duration (highest first), then number of entries. Entries without a project SHALL be grouped as "No project". Entries without duration SHALL count as entries but add no time.

#### Scenario: Count and duration
- **WHEN** the week has three entries for "Thesis" of 30, 45 and no minutes
- **THEN** "Thesis" shows 3 entries and 1 h 15 min

#### Scenario: Outside the week
- **WHEN** an entry for "Thesis" was logged the Sunday before the week
- **THEN** it is not counted

### Requirement: Habit adherence
The summary SHALL list every active habit with the number of check-ins in the week and the number expected: for `daily` one per day, for `weekdays` one per selected weekday, for `times_per_week` the weekly target. Days before the habit was created SHALL NOT be expected.

#### Scenario: Weekdays habit
- **WHEN** a habit for Monday, Wednesday and Friday was checked on Monday and Friday
- **THEN** it shows 2 of 3

#### Scenario: Created mid-week
- **WHEN** a daily habit was created on Thursday of the week and checked every day since
- **THEN** it shows 4 of 4

#### Scenario: Times per week
- **WHEN** a habit with 3 times per week was checked 4 times
- **THEN** it shows 4 of 3

### Requirement: Completed tasks
The summary SHALL list the tasks completed in the week (by their local completion date) with what they were assigned to (project, KR or objective, if any), most recent first. Tapping a task SHALL open its task page.

#### Scenario: Task completed in the week
- **WHEN** the task "Book venue" of "Wedding" was completed on Tuesday of the week
- **THEN** it is listed with "Wedding"

#### Scenario: Open a completed task
- **WHEN** the user taps a completed task in the summary
- **THEN** its task page opens

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

### Requirement: Summary updates live
The summary SHALL update immediately after changes to log entries, habit checks, tasks or key results.

#### Scenario: Value changed in the review
- **WHEN** the user changes a KR value in the key results step
- **THEN** the summary shows the new progress without a reload

### Requirement: Summary of any week
A summary SHALL be available for any Monday–Sunday week (the current week, last week, the review week and the week of any past review) and SHALL be computed from the stored log entries, habit checks and completed tasks of that week. Habit adherence SHALL use the habits' current schedules and active state.

#### Scenario: Past week
- **WHEN** the summary of a week three weeks ago is shown
- **THEN** it lists the work logged, the habit check-ins and the tasks completed in that week

#### Scenario: Current week so far
- **WHEN** today is Wednesday and the summary of the current week is shown
- **THEN** it counts work, check-ins and completed tasks from Monday until now
