# Spec Delta

## MODIFIED Requirements

### Requirement: Create a task from Home
Home's "New task" SHALL open a sheet to create a task with a title, an optional deadline and an optional assignment (an active project or an active goal). A project can also be named in the title with `#` (see tasks, "Project suggestions in the new task title"). Typing a title and pressing Enter SHALL create a standalone task.

#### Scenario: Title and Enter
- **WHEN** the user clicks "New task", types "Tax return" and presses Enter
- **THEN** an open standalone task "Tax return" exists and is listed in To do

#### Scenario: Assign to a goal
- **WHEN** the user creates the task "Book physio" assigned to the goal "Get fit"
- **THEN** the task belongs to "Get fit" and is listed in To do

#### Scenario: Project in the title
- **WHEN** the user clicks "New task", types "Rerun benchmarks # Chapter 4" and presses Enter
- **THEN** the task "Rerun benchmarks" exists in "Chapter 4: Evaluation"
