## MODIFIED Requirements

### Requirement: Stats tab
The Stats tab SHALL show, for the chosen period: a header with the title and the period picker, the headline figures, the trends, the work calendar, the weekday-and-hour heatmap and the habits panel. It SHALL update after every change to the data, like the week summary. Without any logged work, habit check or completed review in the period it SHALL say that there is nothing to show for the period yet.

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

### Requirement: Work calendar
The work calendar SHALL show a full year as a grid of days, one column per week from Monday to Sunday with the months labelled: the calendar year of the shown period, or the 53 weeks up to the current week for "All time". Each day SHALL be shaded in four steps by the time worked that day, as a share of the busiest day of the grid (up to 25 %, 50 %, 75 %, above); days without work SHALL be empty and days after today blank. Days inside the shown period SHALL be emphasised and the others dimmed. A day's tooltip SHALL give its date and the time worked.

#### Scenario: Busiest day
- **WHEN** the busiest day of the year had 8 h and another day 5 h
- **THEN** the 5 h day has the third step (above 50 %) and the 8 h day the fourth

#### Scenario: Period in the year
- **WHEN** October 2026 is shown
- **THEN** the grid covers 2026, with the days of October emphasised

#### Scenario: All time
- **WHEN** "All time" is shown
- **THEN** the grid covers the 53 weeks up to the current week

#### Scenario: Tooltip
- **WHEN** the user hovers a day with 2 h 30 min of work on 2026-10-05
- **THEN** the tooltip reads "05-10-2026 · 2 h 30 min"

### Requirement: Work heatmap
The heatmap SHALL show when work happens in the shown period as a grid of weekdays (rows) by hours of the day (columns), shaded by the total time worked in that weekday and hour over the period. A log entry's time SHALL be spread over the hours between its start and end (see day-timeline, "Work blocks"). Entries without a duration SHALL add nothing. A cell's tooltip SHALL give the weekday, the hour and the time.

#### Scenario: Spread over hours
- **WHEN** a focus session ran from 09:40 to 10:20 on a Monday of the period
- **THEN** the Monday 09:00 cell gets 20 min and the Monday 10:00 cell 20 min

#### Scenario: No duration
- **WHEN** a task was completed without logged time
- **THEN** no cell changes

#### Scenario: Weekdays add up
- **WHEN** two Mondays of the period each have 1 h of work between 14:00 and 15:00
- **THEN** the Monday 14:00 cell shows 2 h

### Requirement: Habits panel
The habits panel SHALL list every active habit with its current and best streak (see habits, "Habit streak"), the check-ins kept out of those expected in the shown period's weeks (see week-summary, "Habit adherence") with the share as a whole percentage, and the time logged on the habit in the period. Habits SHALL be ordered by current streak, longest first, then by title. Without an active habit the panel SHALL say so. Streaks do not depend on the shown period.

#### Scenario: Row
- **WHEN** the habit "Read" has a current streak of 12 days, a best of 30 days, 20 of 25 check-ins kept in the period and 6 h logged
- **THEN** its row shows 12 days, best 30 days, 20 / 25 · 80 % and 6 h

#### Scenario: Order
- **WHEN** "Run" has a streak of 3 days and "Read" one of 12 days
- **THEN** "Read" is listed first

#### Scenario: No habits
- **WHEN** no habit is active
- **THEN** the panel says there are no active habits

### Requirement: Habit calendar
Choosing a habit in the habits panel SHALL show its calendar below the row, and choosing it again SHALL hide it. The calendar shows the days of the shown period (the 53 weeks up to the current week for "All time"), each as checked, missed or neutral. A day SHALL be missed when a `daily` or `weekdays` habit was due, was not checked and is before today; days before the habit was created, days not due, today while unchecked and days after today SHALL be neutral. For a `times_per_week` habit only checked days SHALL be marked.

#### Scenario: Missed day
- **WHEN** a weekdays habit for Monday and Friday was checked on Monday 2026-11-02 but not on Friday 11-06, and today is 11-08
- **THEN** in the calendar Monday is checked, Friday is missed and the days between are neutral

#### Scenario: Before creation
- **WHEN** a habit was created on 2026-10-20 and October 2026 is shown
- **THEN** the days before 20-10-2026 are neutral

#### Scenario: Weekly habit
- **WHEN** a habit with 3 per week was checked on three days of a week
- **THEN** those three days are checked and the other days are neutral

#### Scenario: Toggle
- **WHEN** the user chooses a habit and then chooses it again
- **THEN** its calendar is shown and then hidden
