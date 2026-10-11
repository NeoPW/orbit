# Spec Delta

## Purpose

Lets the user track a goal's progress with several measures (a number with a target, a yes/no, or a habit's check-ins), record progress right on the goal page, and computes each measure's progress.

## ADDED Requirements

### Requirement: Add measure
On the goal page the user SHALL be able to add a measure with a title, an optional description and a type (`numeric`, `boolean` or `habit`). The form SHALL open in a sheet. New measures SHALL be added after the goal's existing measures.

#### Scenario: Add measure to goal
- **WHEN** the user adds a measure "Run 100 km" on the page of "Get fit"
- **THEN** the measure is listed on the goal page after its existing measures

#### Scenario: Missing title
- **WHEN** the user tries to save a measure without a title
- **THEN** the measure is not saved and the title field shows an error

### Requirement: Fields depend on measure type
The measure form SHALL show only the fields relevant to the selected type: for `numeric` a required start value, target value and current value, an optional unit and a step (default 1); for `boolean` an "achieved" switch; for `habit` an optional linked habit and a required positive target number of check-ins.

#### Scenario: Numeric fields
- **WHEN** the user selects the type number
- **THEN** the form shows start value, target value, current value, unit and step

#### Scenario: Boolean fields
- **WHEN** the user selects the type yes/no
- **THEN** the form shows an achieved switch and no numeric fields

#### Scenario: Habit fields
- **WHEN** the user selects the type habit
- **THEN** the form shows a habit picker and a target number of check-ins

#### Scenario: Missing numeric value
- **WHEN** the user tries to save a numeric measure without a target value
- **THEN** the measure is not saved and the target field shows an error

### Requirement: Edit and delete measure
Tapping a measure's title on the goal page SHALL open its edit form, where every field including the type can be changed and the measure can be deleted after confirming. A measure SHALL have no page of its own.

#### Scenario: Edit from the goal page
- **WHEN** the user taps the title "Run 100 km" on the goal page and changes the target to 120
- **THEN** the measure's target is 120 and its progress updates

#### Scenario: Delete
- **WHEN** the user deletes a measure and confirms
- **THEN** it is no longer listed and the goal's progress is computed without it

### Requirement: Numeric measure progress
Progress of a numeric measure SHALL be `(current - start) / (target - start)`, clamped to the range 0–1. This SHALL work for decreasing targets. If target equals start, progress SHALL be 1 when current equals target and 0 otherwise.

#### Scenario: Halfway
- **WHEN** start is 0, target is 100 and current is 50
- **THEN** progress is 0.5

#### Scenario: Decreasing target
- **WHEN** start is 80, target is 70 and current is 75
- **THEN** progress is 0.5

#### Scenario: Beyond target
- **WHEN** start is 0, target is 100 and current is 130
- **THEN** progress is 1

#### Scenario: Below start
- **WHEN** start is 10, target is 20 and current is 5
- **THEN** progress is 0

#### Scenario: Target equals start, reached
- **WHEN** start is 5, target is 5 and current is 5
- **THEN** progress is 1

#### Scenario: Target equals start, not reached
- **WHEN** start is 5, target is 5 and current is 6
- **THEN** progress is 0

### Requirement: Boolean measure progress
Progress of a boolean measure SHALL be 1 when it is achieved and 0 otherwise.

#### Scenario: Achieved
- **WHEN** a boolean measure is marked achieved
- **THEN** progress is 1

#### Scenario: Not achieved
- **WHEN** a boolean measure is not marked achieved
- **THEN** progress is 0

### Requirement: Habit measure progress
Progress of a habit measure SHALL be the check-ins of its linked habit on or after its goal's start date, divided by its target number of check-ins, clamped to 0–1. Without a linked habit progress SHALL be 0 with "No habit linked". The measure SHALL show "N / target check-ins".

#### Scenario: Halfway
- **WHEN** a habit measure has target 20 and its habit has 10 check-ins since the goal's start date
- **THEN** progress is 0.5 and the measure shows "10 / 20 check-ins"

#### Scenario: Check-ins before start ignored
- **WHEN** the goal starts 2026-10-01 and the habit was checked on 2026-09-30 and 2026-10-02
- **THEN** only the check on 2026-10-02 counts

#### Scenario: No linked habit
- **WHEN** a habit measure has no linked habit
- **THEN** progress is 0 and the measure shows "No habit linked"

#### Scenario: Updates after check
- **WHEN** the user checks the linked habit on Home
- **THEN** the measure's progress on the goal page increases without a reload

### Requirement: Record progress on the goal page
Each measure on the goal page SHALL show its progress ring in the goal's color, its value and its controls: − and + changing a numeric measure by its step, tapping the value to enter it directly, a done switch for a boolean measure, and no controls for a habit measure. Changes SHALL be saved immediately and SHALL NOT be limited to start or target.

#### Scenario: Plus button
- **WHEN** the numeric measure "Run 100 km" with current value 40 and step 5 is shown and the user taps +
- **THEN** its current value is 45 and its progress ring shows 45%

#### Scenario: Minus button
- **WHEN** the user taps − on a numeric measure with current value 40 and step 1
- **THEN** its current value is 39

#### Scenario: Enter the value
- **WHEN** the user taps the value and enters 62.5
- **THEN** its current value is 62.5

#### Scenario: Done switch
- **WHEN** the user switches on "Done" on the boolean measure "Get the certificate"
- **THEN** its progress is 1

#### Scenario: Habit measure read-only
- **WHEN** a habit measure is shown on the goal page
- **THEN** it shows its check-ins against the target and no − / + buttons or switch

### Requirement: Step size
A numeric measure SHALL have a step, a positive number defaulting to 1, set in the measure form and used by the − / + buttons.

#### Scenario: Default step
- **WHEN** the user creates a numeric measure without changing the step
- **THEN** its step is 1

#### Scenario: Invalid step
- **WHEN** the user enters 0 as the step and saves
- **THEN** the measure is not saved and the step field shows an error
