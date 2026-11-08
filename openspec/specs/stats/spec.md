# stats Specification

## Purpose

Shows how work, review scores, habits and focus on goals develop over calendar periods: a month, a quarter, a year or all time, with headline figures and trends.

## Requirements

### Requirement: Stats tab
The Stats tab SHALL show, for the chosen period: a header with the title and the period picker, the headline figures and the trends. It SHALL update after every change to the data, like the week summary. Without any logged work, habit check or completed review in the period it SHALL say that there is nothing to show for the period yet.

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
