# Spec Delta

## MODIFIED Requirements

### Requirement: Quick add task
The phone SHALL offer a quick-add button on Home that opens the new task form (title, optional due date and assignment) as a full-screen sheet; saving a task with only a title SHALL be possible, and the keyboard's Enter key SHALL save it. The project suggestions after `#` in the title (see tasks, "Project suggestions in the new task title") SHALL be shown above the on-screen keyboard and be picked with a tap.

#### Scenario: Add by title
- **WHEN** the user taps the quick-add button, types "Call the bank" and presses Enter
- **THEN** the standalone task "Call the bank" is created and appears in To do

#### Scenario: Project by tap
- **WHEN** the user types "Update CV # port" in the quick-add title, taps the suggestion "Portfolio site" and presses Enter
- **THEN** the task "Update CV" is created in "Portfolio site"
