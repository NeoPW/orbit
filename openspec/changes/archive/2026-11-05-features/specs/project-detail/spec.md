# Spec Delta

## ADDED Requirements

### Requirement: Next steps and open tasks in detail
The project detail SHALL list the project's open tasks once, with its next steps marked and listed first, each group ordered as in tasks ("Open task order"). It SHALL offer adding a task, and the task rows SHALL work as defined in tasks ("Task rows"). Without open tasks the section SHALL show an empty state with "Add task".

#### Scenario: Next steps first
- **WHEN** the project has the open tasks "Book venue" (next step), "Send invites" and "Write intro" (next step)
- **THEN** the detail lists "Book venue" and "Write intro" first, marked as next steps, then "Send invites"

#### Scenario: Not shown twice
- **WHEN** a task is a next step of the project
- **THEN** it is listed once in the detail

#### Scenario: Open a task
- **WHEN** the user clicks the open task "Book venue"
- **THEN** its task page opens

## REMOVED Requirements

### Requirement: Next step and open tasks in detail
**Reason**: A project can have several next steps (SPEC §5 Next steps).
**Migration**: Replaced by "Next steps and open tasks in detail".
