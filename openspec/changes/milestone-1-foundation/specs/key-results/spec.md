# Spec Delta

## Purpose

Lets the user attach measurable key results to an objective, and computes each KR's effective deadline and progress so the Plan tab can show how far along it is.

## ADDED Requirements

### Requirement: Create key result
The user SHALL be able to add a key result to an objective with a title, optional description, a measure type (`numeric`, `boolean` or `habit`) and an optional deadline. New KRs are added after the objective's existing KRs.

#### Scenario: Add KR to objective
- **WHEN** the user adds a KR "Run 100 km" to an objective
- **THEN** the KR is shown under that objective, after its existing KRs

#### Scenario: Missing title
- **WHEN** the user tries to save a KR without a title
- **THEN** the KR is not saved and the title field shows an error

### Requirement: Fields depend on measure type
The KR form SHALL show only the fields relevant to the selected measure type: for `numeric` a required start value, target value and current value plus an optional unit; for `boolean` an "achieved" switch; for `habit` an optional linked habit and a required positive target number of check-ins.

#### Scenario: Numeric fields
- **WHEN** the user selects measure type numeric
- **THEN** the form shows start value, target value, current value and unit

#### Scenario: Boolean fields
- **WHEN** the user selects measure type boolean
- **THEN** the form shows an achieved switch and no numeric fields

#### Scenario: Habit fields
- **WHEN** the user selects measure type habit
- **THEN** the form shows a habit picker and a target number of check-ins

#### Scenario: Missing numeric value
- **WHEN** the user tries to save a numeric KR without a target value
- **THEN** the KR is not saved and the target field shows an error

### Requirement: Edit and delete key result
The user SHALL be able to edit all fields of a KR, including its measure type, and to delete it after confirming. Projects and habits linked to a deleted KR SHALL keep existing without the KR link.

#### Scenario: Update current value
- **WHEN** the user changes a numeric KR's current value from 20 to 50
- **THEN** its progress bar in the Plan tab updates immediately

#### Scenario: Delete KR with linked project
- **WHEN** the user deletes a KR that has a linked active project, and confirms
- **THEN** the KR is gone and the project appears under "Projects without a KR"

### Requirement: Effective KR deadline
A KR's effective deadline SHALL be its own deadline if set, otherwise its objective's end date.

#### Scenario: KR with own deadline
- **WHEN** a KR has deadline 2026-11-15 and its objective ends 2026-12-31
- **THEN** the KR's effective deadline is 2026-11-15

#### Scenario: KR without own deadline
- **WHEN** a KR has no deadline and its objective ends 2026-12-31
- **THEN** the KR's effective deadline is 2026-12-31

### Requirement: Numeric KR progress
Progress of a numeric KR SHALL be `(current - start) / (target - start)`, clamped to the range 0–1. This SHALL work for decreasing targets. If target equals start, progress SHALL be 1 when current equals target and 0 otherwise.

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

### Requirement: Boolean KR progress
Progress of a boolean KR SHALL be 1 when it is achieved and 0 otherwise.

#### Scenario: Achieved
- **WHEN** a boolean KR is marked achieved
- **THEN** progress is 1

#### Scenario: Not achieved
- **WHEN** a boolean KR is not marked achieved
- **THEN** progress is 0

### Requirement: Habit KR progress not yet available
For habit KRs the app SHALL NOT show a progress value in this milestone; instead it SHALL show the note "Progress available from milestone 2".

#### Scenario: Habit KR in Plan tab
- **WHEN** an active objective has a habit KR
- **THEN** the KR shows the note instead of a progress bar
