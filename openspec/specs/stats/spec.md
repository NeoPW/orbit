# stats Specification

## Purpose

Shows how work, review scores, habits and focus on goals develop over calendar periods: a month, a quarter, a year or all time, with headline figures and trends.

## Requirements

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

### Requirement: Periods
The user SHALL be able to choose the period kind: month, quarter (January–March, April–June, July–September, October–December), year or all time. ‹ and › SHALL step to the previous or next period of the same kind; › SHALL be disabled on the current period. The default SHALL be the current month. Switching the kind SHALL show the period of that kind that contains the start of the shown period, or the current one when it is the current period.

#### Scenario: Step back
- **WHEN** November 2026 is shown and the user presses ‹
- **THEN** October 2026 is shown

#### Scenario: No future periods
- **WHEN** the current quarter is shown
- **THEN** › is disabled

#### Scenario: Switch kind
- **WHEN** October 2026 is shown and the user chooses quarter
- **THEN** Q4 2026 is shown

### Requirement: Period labels and address
A period SHALL be labelled "November 2026", "Q4 2026", "2026" or "All time", and kept in the address as `/stats?period=2026-11`, `2026-Q4`, `2026` or `all`. Reloading SHALL show the same period. An invalid or future period in the address SHALL show the current month.

#### Scenario: Reload
- **WHEN** Q3 2026 is shown and the user reloads
- **THEN** Q3 2026 is shown again

#### Scenario: Invalid address
- **WHEN** `/stats?period=2026-13` is opened
- **THEN** the current month is shown

### Requirement: All time
"All time" SHALL run from the earliest date with a log entry, a habit check or a completed review up to today. Without any of them, it SHALL show the empty state.

#### Scenario: Start of all time
- **WHEN** the first log entry is on 2026-03-14 and nothing is earlier
- **THEN** "All time" covers 2026-03-14 to today

### Requirement: Weeks of a period
Figures kept per week (review scores and habit adherence) SHALL count for the period that contains the week's Thursday. Time SHALL be counted by the local date of each log entry.

#### Scenario: Week across two months
- **WHEN** the week from Monday 2026-09-28 to Sunday 2026-10-04 has a completed review with score 8
- **THEN** that score counts for October 2026 (Thursday 2026-10-01) and not for September 2026

#### Scenario: Time across two months
- **WHEN** 2 h were logged on 2026-09-30 and 3 h on 2026-10-01
- **THEN** September 2026 counts the 2 h and October 2026 the 3 h

### Requirement: Time figures
The headline SHALL show the time worked in the period, the sum of the durations of its log entries, and the daily average: the time worked divided by the days of the period, up to and including today for the current period.

#### Scenario: Daily average of the current month
- **WHEN** today is 2026-11-08 and 40 h were logged in November 2026
- **THEN** the time worked reads 40 h and the daily average 5 h

#### Scenario: Daily average of a past month
- **WHEN** 62 h were logged in October 2026
- **THEN** the daily average reads 2 h

### Requirement: Average review score
The headline SHALL show the average score of the completed reviews of the period's weeks, with one decimal, and how many weeks were reviewed out of the period's weeks. Without a completed review it SHALL show no score.

#### Scenario: Average
- **WHEN** October 2026 has five weeks, of which four have completed reviews with scores 6, 7, 8 and 8
- **THEN** the score reads 7.3 with "4 of 5 weeks reviewed"

#### Scenario: No review
- **WHEN** no week of the period has a completed review
- **THEN** the score shows no value

### Requirement: Habit adherence over a period
The headline SHALL show the habit adherence of the period: the check-ins kept and expected in each of its weeks (see week-summary, "Habit adherence" and "Summary figures"), summed over the weeks, with the share as a whole percentage. Without any expected check-in it SHALL show no share.

#### Scenario: Two weeks
- **WHEN** a period has two weeks with 9 of 10 and 6 of 10 check-ins kept
- **THEN** habit adherence reads 15 / 20 with 75 %

### Requirement: Share on goals over a period
The headline SHALL show the share of the period's time that counts as work on any goal (see goals, "Work on a goal"), as a whole percentage, with its duration. Without any time it SHALL show no share.

#### Scenario: Share on goals
- **WHEN** 40 h were logged in the period, 30 h of them on projects serving goals
- **THEN** the share on goals reads 75 % with 30 h

### Requirement: Comparison with the previous period
The daily average, the average score, the habit adherence and the share on goals SHALL each show the change from the previous period of the same kind: the daily average as a whole percentage ("+12 %"), the score as a difference with one decimal ("+0.8"), the two shares in percentage points ("+5 pp"). No change SHALL be shown for "All time" or where either period has no value.

#### Scenario: Better than last month
- **WHEN** November 2026 has a daily average of 5 h and October 2026 one of 4 h
- **THEN** the daily average shows "+25 %" against October

#### Scenario: No previous value
- **WHEN** the previous quarter has no completed review
- **THEN** the average score shows no change

### Requirement: Trends
The tab SHALL show four small charts: hours worked, average review score, habit adherence and share on goals. A month or quarter SHALL have one point per week of the period, a year or all time one per month. A week's point SHALL show that whole week. The current week or month SHALL be marked "so far"; later weeks or months of the current period, and points without a value, SHALL have no point.

#### Scenario: Quarter
- **WHEN** Q3 2026 is shown
- **THEN** each chart has one point for each of the 13 weeks whose Thursday falls in July to September

#### Scenario: Year
- **WHEN** 2026 is shown in November 2026
- **THEN** each chart has points for January to November, November marked "so far", and none for December

#### Scenario: Week without a review
- **WHEN** a week of the shown month has no completed review
- **THEN** the score chart has no point for that week, and its line is broken there

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
