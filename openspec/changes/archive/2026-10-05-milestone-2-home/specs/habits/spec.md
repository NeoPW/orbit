# Spec Delta

## ADDED Requirements

### Requirement: Habit due today
An active habit SHALL be due on a date when: for `daily`, always; for `weekdays`, the date's weekday is one of its weekdays; for `times_per_week`, it has fewer check-ins than `times_per_week` in that date's week, where weeks start on Monday. Inactive habits SHALL never be due.

#### Scenario: Daily
- **WHEN** an active habit has schedule daily
- **THEN** it is due every day

#### Scenario: Weekday not selected
- **WHEN** a habit has weekdays Monday, Wednesday and Friday and today is Tuesday
- **THEN** it is not due today

#### Scenario: Times per week reached
- **WHEN** a habit has 3 times per week and was checked on Monday, Tuesday and Wednesday
- **THEN** it is not due on Thursday of that week

#### Scenario: New week
- **WHEN** a habit has 3 times per week and was checked 3 times last week
- **THEN** it is due on Monday of the following week

#### Scenario: Inactive habit
- **WHEN** a daily habit is inactive
- **THEN** it is not due

### Requirement: Check habit
Checking a habit for today SHALL create a habit check for the habit and today's local date, and a log entry with source `habit`, the habit's linked project and KR (if any), the current time, no duration and the habit's title as note. A habit SHALL have at most one check per date.

#### Scenario: Check habit
- **WHEN** the user checks the habit "Run" linked to project "Marathon"
- **THEN** a check for today exists and a log entry "Run" from source habit is listed for "Marathon"

#### Scenario: No duplicate check
- **WHEN** a habit is already checked today and a check is requested again
- **THEN** there is still exactly one check and one log entry for today

### Requirement: Uncheck habit
Unchecking a habit for today SHALL remove today's habit check and the log entry created with it.

#### Scenario: Uncheck
- **WHEN** the user unchecks a habit that was checked today
- **THEN** the check and its log entry are gone
