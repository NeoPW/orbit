## MODIFIED Requirements

### Requirement: Stats tab
The Stats tab SHALL show, for the chosen period: a header with the title and the period picker, the headline figures, the trends, the work calendar, the weekday-and-hour heatmap, the time by area, goal or project, the projects panel, the goals panel, the tasks panel and the habits panel. It SHALL update after every change to the data, like the week summary. Without any logged work, habit check or completed review in the period it SHALL say that there is nothing to show for the period yet.

#### Scenario: Open Stats
- **WHEN** the user selects Stats on 2026-11-08
- **THEN** the header shows "November 2026" and the figures and trends of that month are shown

#### Scenario: Empty period
- **WHEN** the shown period has no log entries, habit checks or completed reviews
- **THEN** the tab says there is nothing to show for this period yet

#### Scenario: Live update
- **WHEN** the user logs 1 h of work while Stats shows the current month
- **THEN** the time worked of the month grows by 1 h without reloading

## ADDED Requirements

### Requirement: Goals panel
The goals panel SHALL list the active goals that had started by the end of the shown period, each with its title and colour, its progress at the end of the period as a whole percentage, and its change in the period in percentage points (the progress at the end of the period minus the progress at the end of the day before it). A change of zero SHALL NOT be shown. A goal without measures SHALL be listed as having no measures, without progress. Opening a goal SHALL open its page. Without such a goal the panel SHALL say so.

#### Scenario: Change in the period
- **WHEN** a goal was at 40 % on 2026-09-30 and is at 55 % on 2026-10-31
- **THEN** October 2026 shows its progress as 55 % with "+15 pp"

#### Scenario: No change
- **WHEN** a goal's progress was 40 % at the start and at the end of the period
- **THEN** it shows 40 % and no change

#### Scenario: Goal without measures
- **WHEN** an active goal has no measures
- **THEN** it is listed as having no measures

#### Scenario: Not started yet
- **WHEN** a goal starts on 2026-12-01 and October 2026 is shown
- **THEN** it is not listed

#### Scenario: No goals
- **WHEN** no goal is active
- **THEN** the panel says there are no active goals

### Requirement: Goal progress over time
Each goal in the panel SHALL show a small chart of its progress, one point per week for a month or quarter and one per month for a year or all time, each point being the progress at the end of that week or month (the end of the period for the last one). Progress at a past date SHALL be computed from the measures' values and the habit check-ins at that moment (see measures, "Value history"). Before value changes were recorded, a measure SHALL count at the value it had at its first recorded change.

#### Scenario: Points of a quarter
- **WHEN** Q3 2026 is shown
- **THEN** each goal's chart has 13 points

#### Scenario: Progress at a past date
- **WHEN** a numeric measure with target 10 was set to 4 on Monday and to 7 on Thursday of the same week
- **THEN** the progress at the end of that week counts 7 and the progress at the end of the Wednesday counts 4

#### Scenario: Habit measure
- **WHEN** a habit measure with target 30 had 12 check-ins up to the end of September and 15 up to the end of October
- **THEN** its progress is 40 % at the end of September and 50 % at the end of October

### Requirement: Projected finish
Each goal with progress below 100 % SHALL show the date it would reach 100 % if its recent pace continued, and how that compares with its deadline (its end date). The pace SHALL be the progress gained in the 28 days up to the end of the shown period (up to today for the current period), or since the goal's start date when that is shorter; the projected date is the end of the period plus the remaining progress divided by the pace, rounded up to whole days. With a pace window under 7 days the goal SHALL show that it is too early to tell; without progress gained it SHALL show that there was no progress lately; at 100 % it SHALL show "Complete". With a deadline the comparison SHALL read "N days before the deadline", "on the deadline" or "N days after the deadline", the last marked as behind.

#### Scenario: Ahead of the deadline
- **WHEN** a goal is at 40 % today (2026-11-08), was at 20 % 28 days ago and ends on 2027-03-31
- **THEN** it shows a projected finish of 31-01-2027, 59 days before the deadline

#### Scenario: Behind the deadline
- **WHEN** the same goal ends on 2027-01-01
- **THEN** it shows 31-01-2027, 30 days after the deadline, marked as behind

#### Scenario: No deadline
- **WHEN** a goal has no end date
- **THEN** it shows the projected date without a comparison

#### Scenario: Too early
- **WHEN** a goal started 5 days ago
- **THEN** it shows that it is too early to tell

#### Scenario: No progress
- **WHEN** a goal's progress did not grow in the last 28 days
- **THEN** it shows that there was no progress lately and no date

#### Scenario: Complete
- **WHEN** a goal's progress is 100 %
- **THEN** it shows "Complete" and no projection
