# stats Specification

## Purpose

Shows how work, review scores, habits and focus on goals develop over calendar periods: a month, a quarter, a year or all time, with headline figures and trends.

## Requirements

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

### Requirement: Periods
The user SHALL be able to choose the period kind: month, quarter (January–March, April–June, July–September, October–December), year or all time. ‹ and › SHALL step to the previous or next period of the same kind; › SHALL be disabled on the current period and ‹ on the period that contains the first-use date. The default SHALL be the current month. Switching the kind SHALL show the period of that kind that contains the start of the shown period, or the current one when it is the current period.

#### Scenario: Step back
- **WHEN** November 2026 is shown and the user presses ‹
- **THEN** October 2026 is shown

#### Scenario: No future periods
- **WHEN** the current quarter is shown
- **THEN** › is disabled

#### Scenario: Nothing before first use
- **WHEN** the first-use date is 2026-09-10 and September 2026 is shown
- **THEN** ‹ is disabled

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
The first-use date SHALL be the earliest date with a log entry, a habit check or a completed review. "All time" SHALL run from the first-use date up to today. Without any of them, it SHALL show the empty state.

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

### Requirement: Periods start at first use
Every period SHALL be cut at the first-use date (see "All time"): its days, time, tasks, goals and habits count from that date on, its weeks start with the week that contains that date, and its trends have no point for a week or month that ends before it. The comparison SHALL show no change when the previous period ends before the first-use date. Without a first-use date nothing SHALL be cut.

#### Scenario: Daily average from first use
- **WHEN** the first-use date is 2026-11-03, today is 2026-11-08 and 30 h were logged in November 2026
- **THEN** the daily average of November 2026 reads 5 h

#### Scenario: Weeks reviewed from first use
- **WHEN** the first-use date is Friday 2026-10-16 and the weeks of 2026-10-12, 2026-10-19 and 2026-10-26 have completed reviews
- **THEN** October 2026 shows "3 of 3 weeks reviewed"

#### Scenario: No trend points before first use
- **WHEN** the first-use date is 2026-09-10 and 2026 is shown
- **THEN** the trends have points from September on and none for January to August

#### Scenario: No comparison with a period before first use
- **WHEN** the first-use date is 2026-11-03 and November 2026 is shown
- **THEN** no change from October 2026 is shown

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

### Requirement: Time by area, goal and project over a period
The Stats tab SHALL show the time worked in the shown period grouped by area, by goal or by project, with the same switch, items, colours, bars, ordering, "Other" and links as the week summary (see week-summary, "Time by area, goal and project"). Time SHALL be counted by the local date of each entry, like the time figures.

#### Scenario: By project over a quarter
- **WHEN** 3 h were logged on "Thesis" in July, 2 h in August and 4 h in September 2026
- **THEN** Q3 2026 shows "Thesis" with 9 h

#### Scenario: Month boundary
- **WHEN** 2 h were logged on "Thesis" on 2026-09-30 and 3 h on 2026-10-01
- **THEN** September 2026 shows 2 h for "Thesis" and October 2026 shows 3 h

#### Scenario: Other
- **WHEN** 1 h of the period's work belongs to no goal
- **THEN** grouped by goal, "Other" shows 1 h

### Requirement: Projects panel
The projects panel SHALL list the projects with time in the shown period, ordered by that time, highest first. Each row SHALL show the project's colour and title, its time in the period, its time in total (all time, whatever the period), and for a completed project the days from its creation to its completion. Opening a row SHALL open the project. Without any project time in the period the panel SHALL say so.

#### Scenario: Long project
- **WHEN** "Thesis" has 40 h in total, of which 2 h in October 2026
- **THEN** its row in October 2026 shows 2 h in the period and 40 h in total

#### Scenario: Finished project
- **WHEN** "Website" was created on 2026-06-01 and completed on 2026-07-16
- **THEN** its row shows that it finished after 45 days

#### Scenario: Order
- **WHEN** "Thesis" has 2 h and "Website" 5 h in the period
- **THEN** "Website" is listed first

#### Scenario: No project time
- **WHEN** the period has work only on tasks outside any project
- **THEN** the panel says there is no project time in this period

### Requirement: Tasks panel
The tasks panel SHALL show three figures for the shown period and a chart. **Completed** SHALL be the number of tasks completed in the period, by the local date of completion. **Created** SHALL be the number of tasks created in the period that are not deleted. **Median time to done** SHALL be the median time from creation to completion of the tasks completed in the period, shown in whole days, or in hours when under a day; without a completed task it SHALL show no value. The chart SHALL show the tasks completed in each week of the period (a month or quarter) or each month (a year or all time), with the current week or month marked "so far".

#### Scenario: Completed and created
- **WHEN** 6 tasks were completed and 9 created in October 2026
- **THEN** the panel shows Completed 6 and Created 9

#### Scenario: Median
- **WHEN** the tasks completed in the period took 1, 3 and 9 days
- **THEN** the median time to done is 3 days

#### Scenario: Even count
- **WHEN** the tasks completed in the period took 2 and 4 days
- **THEN** the median time to done is 3 days

#### Scenario: Under a day
- **WHEN** the only task completed in the period was created 5 hours before it was completed
- **THEN** the median time to done reads 5 h

#### Scenario: No completed task
- **WHEN** no task was completed in the period
- **THEN** Completed reads 0 and the median time to done shows no value

#### Scenario: Chart of a quarter
- **WHEN** Q3 2026 is shown
- **THEN** the chart has one point for each of its 13 weeks, with the number of tasks completed in that week

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
