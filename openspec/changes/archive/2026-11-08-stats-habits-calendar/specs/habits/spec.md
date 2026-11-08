## ADDED Requirements

### Requirement: Habit streak
A habit SHALL have a current and a best streak. For `daily` and `weekdays` habits a streak counts consecutive due days that were checked, in days: days on which the habit is not due are skipped, check-ins on such days are ignored, and days before the habit was created are not counted. For `times_per_week` habits a streak counts consecutive weeks (Monday to Sunday) with at least `times_per_week` check-ins on different days, in weeks; weeks before the week of creation are not counted. The best streak SHALL be the longest streak ever reached, the current one included.

#### Scenario: Today still open
- **WHEN** a daily habit was checked on 2026-11-04, 05, 06 and 07 and it is 2026-11-08 and not yet checked
- **THEN** its current streak is 4 days

#### Scenario: Missed day
- **WHEN** a daily habit was checked on 2026-11-04, 05 and 07 and not on 06, and today is 2026-11-08
- **THEN** its current streak is 1 day and its best streak 2 days

#### Scenario: Days not due are skipped
- **WHEN** a habit for Monday, Wednesday and Friday was checked on Monday 2026-11-02, Wednesday 11-04 and Friday 11-06 and today is Sunday 11-08
- **THEN** its current streak is 3 days

#### Scenario: Check on a day not due
- **WHEN** that habit was also checked on Saturday 2026-11-07
- **THEN** its current streak is still 3 days

#### Scenario: Weekly target
- **WHEN** a habit with 2 per week reached 2 check-ins in the weeks of 2026-10-19 and 2026-10-26, has 1 in the week of 2026-11-02 and today is Wednesday 2026-11-04
- **THEN** its current streak is 2 weeks, and 3 weeks after its second check-in of the week

#### Scenario: Best longer than current
- **WHEN** a daily habit was checked for 10 days in a row, missed a day and has been checked for 3 days since
- **THEN** its current streak is 3 days and its best streak 10 days

#### Scenario: New habit
- **WHEN** a daily habit was created today and is not checked yet
- **THEN** its current and best streak are 0
