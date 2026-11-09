# Spec Delta

## MODIFIED Requirements

### Requirement: Home on the phone
Home on the phone SHALL be one column with, from top to bottom, the date with the quick-add button, the focus panel, "Today's note", "Habits due today", "To do" and "Done today". The Today timeline and the active projects SHALL NOT be on Home on the phone (the timeline has its own screen).

#### Scenario: Home order
- **WHEN** Home is shown on the phone
- **THEN** the focus panel is above "Today's note", which is above "Habits due today", which is above "To do", and the active projects are not shown

#### Scenario: Complete a task
- **WHEN** the user taps the checkbox of a task in To do
- **THEN** the task is completed and appears in "Done today", as on the desktop
