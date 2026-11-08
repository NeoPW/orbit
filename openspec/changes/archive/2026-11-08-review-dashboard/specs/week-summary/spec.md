## ADDED Requirements

### Requirement: Dashboard layout
The summary SHALL be laid out as a dashboard: the summary figures across the full width, then panels in a 12-column grid when the content area is at least 1100 pixels wide:
- goals (7 columns) next to the plan for the week (5), where the summary has a plan
- time by area, goal or project (5) next to the recent weeks (7)
- days across the full width
- habits, done this week (the completed tasks and the finished projects) and the history in three equal columns, where the summary has a history; without it, habits and done this week in two equal columns

Panels side by side in a row SHALL have the same height, whatever their content. Each panel SHALL be headed with its name. Below 1100 pixels the panels SHALL stack in one column in the same order. The same layout SHALL be used on the Review tab, on a past review's page and in step 1 of the guided review.

#### Scenario: Wide window
- **WHEN** the Review tab is shown in a window whose content area is 1300 pixels wide
- **THEN** the goals panel and the plan panel are side by side, the days span the full width, and habits, done this week and the history share the next row

#### Scenario: Same height in a row
- **WHEN** the goals panel holds three goals and the plan panel only a hint
- **THEN** both panels end at the same height

#### Scenario: Narrow window
- **WHEN** the content area is 900 pixels wide
- **THEN** the panels are stacked in one column: figures, goals, plan, time by area, recent weeks, days, habits, done this week, history

#### Scenario: Fits a maximised window
- **WHEN** the Review tab is shown in a 1440 × 900 window with the example data
- **THEN** the header, the figures and the first two rows of panels are visible without scrolling

### Requirement: Summary figures
The summary SHALL start with five figures:
- **Time worked:** the sum of the durations of the week's log entries. With a weekly hour target (see settings), the target and the share reached as a whole percentage are shown below it.
- **Daily average:** the total divided by the days of the week up to and including today for the current week, or by 7 for a past week.
- **On goals:** the share of the total that counts as work on any goal (see goals, "Work on a goal"), as a whole percentage, with its duration.
- **Habits:** the check-ins of all active habits counted up to what each expects (see "Habit adherence"), out of all expected, with the share as a whole percentage.
- **Done:** the number of tasks completed and of projects finished in the week.

Entries without a duration SHALL add no time. Without any time in the week, the time figures SHALL show zero and "On goals" SHALL show no share. Without any expected check-in, "Habits" SHALL show no share.

#### Scenario: Total with target
- **WHEN** 15 h 44 min were logged in the week and the weekly hour target is 20 h
- **THEN** "Time worked" reads 15 h 44 min with "of 20 h · 79 %"

#### Scenario: Daily average of the current week
- **WHEN** today is Tuesday and 15 h 44 min were logged since Monday
- **THEN** the daily average is 7 h 52 min

#### Scenario: Habits kept
- **WHEN** a daily habit was checked 6 of 7 days and a 3-times-per-week habit 4 times
- **THEN** "Habits" reads 9 / 10 with 90 %

#### Scenario: Done
- **WHEN** 6 tasks were completed and 1 project was finished in the week
- **THEN** "Done" reads 6 tasks with 1 project finished

## MODIFIED Requirements

### Requirement: Work by day
The summary SHALL show the work of each day of the week, Monday to Sunday, as seven timelines side by side on one shared hour axis (see day-timeline), each headed with its weekday, date and the hours worked that day. Days after today in the current week SHALL be shown empty.

#### Scenario: A week of work
- **WHEN** work was logged on Monday and Wednesday of the week
- **THEN** the seven day columns are shown, with blocks in the Monday and Wednesday columns only, and the hours in their headings

#### Scenario: Past review
- **WHEN** the review of a past week is opened
- **THEN** its summary shows the work of each of that week's days

#### Scenario: Colours match the projects
- **WHEN** a block belongs to the project "Portfolio site"
- **THEN** it has the same colour as that project everywhere else

### Requirement: Goals and their change in the week
After the figures, the summary SHALL show the goals. Each goal SHALL show:
- its progress
- the measures whose value changed during the week, with their progress and value
- the number of entries and the total duration of work on the goal in that week (see goals, "Work on a goal")
- the change of its progress during the week, in percentage points

The change SHALL compare the progress at the start of the week with the progress at its end (now, for the current week). Both SHALL be computed from the measures' values at those moments (see measures, "Value history") and, for habit measures, from the check-ins up to those moments. A change of zero SHALL NOT be shown.

A measure whose value changed during the week SHALL show its value at the start and at the end of the week:
- **Numeric:** "7 → 9 / 10 km" and the difference ("+2").
- **Yes/no:** "Achieved" when it was achieved during the week.
- **Habit:** "12 → 15 / 30 check-ins".

A measure whose value did not change SHALL NOT be listed in the summary (the goal page shows all measures).

The progress bars of a goal and of a measure SHALL show the progress gained during the week as a distinct, lighter segment at the end of the filled part. A bar without a gain SHALL look as before.

#### Scenario: Numeric measure raised during the week
- **WHEN** a measure with target 10 was at 7 on Monday at 00:00 and was set to 9 on Thursday
- **THEN** it shows "7 → 9 / 10" with "+2", and its goal shows the change in progress (for a goal with only this measure, starting from 0: +20)

#### Scenario: Gain in the bar
- **WHEN** a goal went from 40 % to 55 % during the week
- **THEN** its bar is filled to 55 % with the last 15 % in a lighter shade

#### Scenario: Unchanged measure
- **WHEN** a measure's value did not change during the week
- **THEN** it is not listed under its goal in the summary

#### Scenario: Yes/no achieved
- **WHEN** a yes/no measure was switched to achieved on Wednesday of the week
- **THEN** it shows "Achieved" as its change in the week

#### Scenario: Habit check-ins
- **WHEN** a habit measure with target 30 had 12 check-ins before the week and 3 during it
- **THEN** it shows "12 → 15 / 30 check-ins"

#### Scenario: Change before the history existed
- **WHEN** a measure's value was changed before value changes were recorded
- **THEN** no change is shown for it in that week

#### Scenario: Work on the goal
- **WHEN** 3 entries with 2 hours in total were logged on projects serving "Get fit" in the week
- **THEN** "Get fit" shows 3 entries and 2 h

## REMOVED Requirements

### Requirement: Time worked in the week
**Reason**: Its three figures are now part of "Summary figures", which shows five figures in one row.
**Migration**: None; the same figures appear in "Summary figures".
