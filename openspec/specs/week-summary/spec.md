# week-summary Specification

## Purpose

Summarizes a Monday–Sunday week from the recorded data: the work logged per project, how well habits were kept, the tasks completed, and how the goals progressed.

## Requirements

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
The summary SHALL list the tasks completed in the week (by their local completion date) with what they were assigned to (project or goal, if any), most recent first. Tapping a task SHALL open it in the task popup (see tasks, "Task popup").

#### Scenario: Task completed in the week
- **WHEN** the task "Book venue" of "Wedding" was completed on Tuesday of the week
- **THEN** it is listed with "Wedding"

#### Scenario: Open a completed task
- **WHEN** the user taps a completed task in the summary
- **THEN** its task popup opens

### Requirement: Summary updates live
The summary SHALL update immediately after changes to log entries, habit checks, tasks, projects, goals or measures.

#### Scenario: Value changed in the review
- **WHEN** the user changes a measure's value in the goals step
- **THEN** the summary shows the new progress without a reload

### Requirement: Summary of any week
A summary SHALL be available for any Monday–Sunday week (the current week, last week, the review week and the week of any past review) and SHALL be computed from the stored log entries, habit checks, completed tasks and completed projects of that week. Habit adherence SHALL use the habits' current schedules and active state.

#### Scenario: Past week
- **WHEN** the summary of a week three weeks ago is shown
- **THEN** it lists the work logged, the habit check-ins, the tasks completed and the projects finished in that week

#### Scenario: Current week so far
- **WHEN** today is Wednesday and the summary of the current week is shown
- **THEN** it counts work, check-ins and completed tasks from Monday until now

### Requirement: Goal progress of a week
For a week whose review is completed, the goals and their progress SHALL come from the measure snapshots stored with that review (the goals of those measures, their progress being the average of the snapshots). For any other week, the summary SHALL show the active goals with their current progress.

#### Scenario: Reviewed week
- **WHEN** the review of a past week stored 40 % for a measure that is at 70 % today
- **THEN** that week's summary shows 40 % for the measure

#### Scenario: Current week
- **WHEN** the summary of the current week is shown
- **THEN** it shows the active goals with their current progress

### Requirement: Finished projects
The summary SHALL list the projects completed in the week (by the local date of their completion time) with the goal they serve, most recent first. Tapping a project SHALL open its detail.

#### Scenario: Project finished in the week
- **WHEN** the project "Garden" was completed on Tuesday of the week
- **THEN** it is listed under finished projects

#### Scenario: Reopened project
- **WHEN** a project completed on Tuesday was set back to active on Wednesday
- **THEN** it is not listed

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

### Requirement: Time by area, goal and project
The summary SHALL show the week's time grouped by area, by goal or by project, chosen with a switch (Area first and selected by default). Each item SHALL be shown with its colour, its total duration and a bar proportional to the largest item, ordered by duration (highest first). Time that belongs to no item of the chosen grouping SHALL be shown last as "Other".
- An entry SHALL belong to a project directly, through its task, or through its habit.
- An entry SHALL belong to an area through its project.
- An entry SHALL belong to a goal as described in goals, "Work on a goal".

Tapping a goal or a project SHALL open it.

#### Scenario: By area
- **WHEN** 3 h were logged on projects in the area "Work", 1 h on a project without an area, and 30 min on a task without a project
- **THEN** with Area selected, "Work" shows 3 h and "Other" shows 1 h 30 min, in that order

#### Scenario: By project through a task
- **WHEN** an entry of 45 min is linked to a task of the project "Thesis"
- **THEN** with Project selected, the 45 min count for "Thesis"

#### Scenario: Habit time
- **WHEN** a focus session of 20 min ran on a habit that belongs to the project "Fitness"
- **THEN** the 20 min count for "Fitness" and for that project's area and goal

#### Scenario: Open a project
- **WHEN** the user taps "Thesis" with Project selected
- **THEN** the project page of "Thesis" opens

### Requirement: Recent weeks
The summary SHALL show the total time worked in each of the 8 weeks ending with the summarized week, as bars labelled with the total and the week's dates. The summarized week SHALL be highlighted, and the current week SHALL be marked "so far".

The summary SHALL also show a line of the 4-week average: for each week, the average of that week and the 3 weeks before it. The current week SHALL get no point on this line.

As a headline, the summary SHALL show the 4-week average of the summarized week, or of the 4 weeks before it when the summarized week is the current week.

#### Scenario: Eight weeks
- **WHEN** the summary of the week of 2026-11-02 is shown
- **THEN** bars for the weeks from 2026-09-14 to 2026-11-02 are shown, the last one highlighted

#### Scenario: Current week headline
- **WHEN** the current week is shown and the 4 weeks before it had 40 h, 32 h, 50 h and 30 h
- **THEN** the headline 4-week average is 38 h per week, and the current week's bar is marked "so far"

#### Scenario: Weeks without work
- **WHEN** nothing was logged in one of the 8 weeks
- **THEN** that week is shown with 0 and counts as 0 in the averages

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
