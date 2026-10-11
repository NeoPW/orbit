# Spec Delta

## ADDED Requirements

### Requirement: Goals in the summary
The summary SHALL start with the goals: each with its progress, the change in percentage points since the most recent earlier completed review that stored snapshots for its measures, its measures with their progress and change, and the number of entries and total duration of work on the goal in that week (see goals, "Work on a goal"). Without such an earlier review, no change SHALL be shown.

#### Scenario: Change since previous review
- **WHEN** "Get fit" is at 55 % and the previous completed review stored its measures at an average of 40 %
- **THEN** the summary shows "Get fit" at 55 % with +15

#### Scenario: No earlier review
- **WHEN** no completed review stored snapshots for a goal's measures
- **THEN** the goal shows its progress without a change

#### Scenario: Work on the goal
- **WHEN** 3 entries with 2 hours in total were logged on projects serving "Get fit" in the week
- **THEN** "Get fit" shows 3 entries and 2 h

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

## MODIFIED Requirements

### Requirement: Work per project
The summary SHALL list, for each project with log entries in the week, the number of entries and their total duration, grouped under the goal the project serves (goals in order, then projects without a goal). Within a group projects SHALL be ordered by total duration (highest first), then number of entries. Entries without a project SHALL be grouped as "No project". Entries without duration SHALL count as entries but add no time.

#### Scenario: Count and duration
- **WHEN** the week has three entries for "Thesis" of 30, 45 and no minutes
- **THEN** "Thesis" shows 3 entries and 1 h 15 min

#### Scenario: Outside the week
- **WHEN** an entry for "Thesis" was logged the Sunday before the week
- **THEN** it is not counted

#### Scenario: Grouped by goal
- **WHEN** "Thesis" serves the goal "Graduate" and "Garden" serves no goal
- **THEN** "Thesis" is listed under "Graduate" and "Garden" under projects without a goal

### Requirement: Completed tasks
The summary SHALL list the tasks completed in the week (by their local completion date) with what they were assigned to (project or goal, if any), most recent first. Tapping a task SHALL open its task page.

#### Scenario: Task completed in the week
- **WHEN** the task "Book venue" of "Wedding" was completed on Tuesday of the week
- **THEN** it is listed with "Wedding"

#### Scenario: Open a completed task
- **WHEN** the user taps a completed task in the summary
- **THEN** its task page opens

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

## REMOVED Requirements

### Requirement: KR progress and change
**Reason**: Key results are replaced by measures of goals; the summary shows goals.
**Migration**: See "Goals in the summary" and "Goal progress of a week" above. KR snapshots become measure snapshots with the same IDs.
