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
The summary SHALL list the tasks completed in the week (by their local completion date) with their project, most recent first.

#### Scenario: Task completed in the week
- **WHEN** the task "Book venue" of "Wedding" was completed on Tuesday of the week
- **THEN** it is listed with "Wedding"

### Requirement: KR progress and change
The summary SHALL list the KRs of active objectives with their current progress and, when an earlier completed review stored a snapshot for the KR, the change in percentage points since the most recent such snapshot.

#### Scenario: Change since previous review
- **WHEN** a KR is at 55 % and the previous completed review stored 40 % for it
- **THEN** it shows 55 % and +15

#### Scenario: No earlier snapshot
- **WHEN** no completed review stored a snapshot for a KR
- **THEN** it shows its current progress without a change

### Requirement: Summary updates live
The summary SHALL update immediately after changes to log entries, habit checks, tasks or key results.

#### Scenario: Value changed in the review
- **WHEN** the user changes a KR value in the key results step
- **THEN** the summary shows the new progress without a reload
