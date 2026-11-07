# Spec Delta

## ADDED Requirements

### Requirement: Total time worked
The total time worked SHALL be shown as the sum of the durations of an item's log entries, in the duration format (see "Log entry display"), or "No time logged" without any: on a task's page for the entries of that task, on a project's page for all entries of the project including those of its tasks and habits, and at the right end of each habit's row in Plan's Habits section for the entries of that habit. It SHALL update live when entries are added or deleted.

#### Scenario: Task total
- **WHEN** the task "Rerun benchmarks" has a 45-minute timer entry and a 30-minute Log work entry
- **THEN** its page shows "1 h 15 min" as time worked

#### Scenario: Project total includes tasks and habits
- **WHEN** the project "Thesis" has a 60-minute entry of its own, a 30-minute entry of its task "Draft intro" and a 20-minute entry of its habit "Read papers"
- **THEN** its page shows "1 h 50 min" as time worked

#### Scenario: Habit total in Plan
- **WHEN** the habit "Run 5 km" has two 40-minute focus sessions and checks without duration
- **THEN** its row in Plan's Habits section shows "1 h 20 min" at its right end

#### Scenario: Nothing logged
- **WHEN** a task has no entries with a duration
- **THEN** its page shows "No time logged"

#### Scenario: Deleted entry
- **WHEN** the 45-minute entry of "Rerun benchmarks" is deleted
- **THEN** its page shows "30 min"
