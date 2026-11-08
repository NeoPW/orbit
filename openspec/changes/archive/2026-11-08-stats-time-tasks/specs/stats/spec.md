## MODIFIED Requirements

### Requirement: Stats tab
The Stats tab SHALL show, for the chosen period: a header with the title and the period picker, the headline figures, the trends, the work calendar, the weekday-and-hour heatmap, the time by area, goal or project, the projects panel, the tasks panel and the habits panel. It SHALL update after every change to the data, like the week summary. Without any logged work, habit check or completed review in the period it SHALL say that there is nothing to show for the period yet.

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
