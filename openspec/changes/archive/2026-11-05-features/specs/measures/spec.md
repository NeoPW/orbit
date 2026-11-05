# Spec Delta

## MODIFIED Requirements

### Requirement: Record progress on the goal page
Each measure on the goal page SHALL show its progress bar in the goal's color, its value and its controls in the row: − and + changing a numeric measure by its step, clicking the value to enter it directly (Enter saves, Escape cancels), a done switch for a boolean measure, and no controls for a habit measure. Changes SHALL be saved immediately and SHALL NOT be limited to start or target.

#### Scenario: Plus button
- **WHEN** the numeric measure "Run 100 km" (start 0, target 100) with current value 40 and step 5 is shown and the user clicks +
- **THEN** its current value is 45 and its progress bar shows 45 %

#### Scenario: Minus button
- **WHEN** the user clicks − on a numeric measure with current value 40 and step 1
- **THEN** its current value is 39

#### Scenario: Enter the value
- **WHEN** the user clicks the value, types 62.5 and presses Enter
- **THEN** its current value is 62.5

#### Scenario: Done switch
- **WHEN** the user switches on "Done" on the boolean measure "Get the certificate"
- **THEN** its progress is 1

#### Scenario: Habit measure read-only
- **WHEN** a habit measure is shown on the goal page
- **THEN** it shows its check-ins against the target and no − / + buttons or switch
