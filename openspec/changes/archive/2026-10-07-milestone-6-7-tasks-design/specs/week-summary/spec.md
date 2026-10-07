# Spec Delta

## MODIFIED Requirements

### Requirement: Completed tasks
The summary SHALL list the tasks completed in the week (by their local completion date) with what they were assigned to (project, KR or objective, if any), most recent first. Tapping a task SHALL open its task page.

#### Scenario: Task completed in the week
- **WHEN** the task "Book venue" of "Wedding" was completed on Tuesday of the week
- **THEN** it is listed with "Wedding"

#### Scenario: Open a completed task
- **WHEN** the user taps a completed task in the summary
- **THEN** its task page opens
