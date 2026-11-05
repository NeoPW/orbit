# Spec Delta

## ADDED Requirements

### Requirement: Detail page addresses
Every goal, project and task SHALL have its own page at `/goals/<id>`, `/projects/<id>` and `/tasks/<id>`. The guided review, a past review and last week's summary SHALL have the paths `/review/flow`, `/review/history/<id>` and `/review/last-week`. While a detail page is shown, the sidebar SHALL mark the destination it belongs to: Plan for goals, projects and tasks, Review for the review pages.

#### Scenario: Reload a project page
- **WHEN** the page of the project "Thesis" is open and the user reloads
- **THEN** the page of "Thesis" is shown again

#### Scenario: Sidebar on a task page
- **WHEN** the user opens a task page from Home
- **THEN** the sidebar marks Plan as selected

#### Scenario: Back to the list
- **WHEN** the user opens a goal page from Plan and goes back
- **THEN** Plan is shown

### Requirement: Item not found
A detail page whose goal, project, task or review does not exist or was deleted SHALL say that the item was not found and offer a way to its destination, instead of showing an empty page.

#### Scenario: Deleted task
- **WHEN** the address of a deleted task is opened
- **THEN** the page says "Task not found" and offers to go to Plan
