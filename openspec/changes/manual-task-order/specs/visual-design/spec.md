# Spec Delta

## MODIFIED Requirements

### Requirement: Structure instead of text lines
Metadata SHALL be shown as chips, icons and badges rather than sentences: status as a colored chip, deadlines as a badge colored by urgency (amber when due within the lead time, red when overdue), area as a colored chip. Values that are not set SHALL be left out instead of being written out (no "No area", "No deadline", "No goal").

#### Scenario: Project without area and deadline
- **WHEN** a project has no area and no deadline
- **THEN** its card shows neither an area chip nor a deadline badge and no placeholder text

#### Scenario: Importance
- **WHEN** a project or task is shown anywhere in the app
- **THEN** it shows no importance dots and no importance text

#### Scenario: Overdue badge
- **WHEN** an item's deadline has passed
- **THEN** its deadline badge is red and reads "Overdue"
