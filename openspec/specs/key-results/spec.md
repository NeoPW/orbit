# key-results Specification

## Purpose

Lets the user attach measurable key results to an objective, and computes each KR's effective deadline and progress so the Plan tab can show how far along it is.

## Requirements

### Requirement: Create key result
The user SHALL be able to add a key result to an objective with a title, optional description, a measure type (`numeric`, `boolean` or `habit`) and an optional deadline. New KRs are added after the objective's existing KRs.

#### Scenario: Add KR to objective
- **WHEN** the user adds a KR "Run 100 km" to an objective
- **THEN** the KR is shown under that objective, after its existing KRs

#### Scenario: Missing title
- **WHEN** the user tries to save a KR without a title
- **THEN** the KR is not saved and the title field shows an error

### Requirement: Fields depend on measure type
The KR form SHALL show only the fields relevant to the selected measure type: for `numeric` a required start value, target value and current value, an optional unit and a step (default 1); for `boolean` an "achieved" switch; for `habit` an optional linked habit and a required positive target number of check-ins.

#### Scenario: Numeric fields
- **WHEN** the user selects measure type numeric
- **THEN** the form shows start value, target value, current value, unit and step

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

### Requirement: Habit KR progress
Progress of a habit KR SHALL be the number of check-ins of its linked habit on or after its objective's start date, divided by the KR's target number of check-ins, clamped to 0–1. A habit KR without a linked habit SHALL have progress 0 and show "No habit linked". The KR SHALL show the count as "N / target check-ins" next to its progress ring with the percentage.

#### Scenario: Halfway
- **WHEN** a habit KR has target 20 and its habit has 10 check-ins since the objective's start date
- **THEN** progress is 0.5 and the KR shows "10 / 20 check-ins" with a ring reading "50%"

#### Scenario: Check-ins before start ignored
- **WHEN** the objective starts 2026-10-01 and the habit was checked on 2026-09-30 and 2026-10-02
- **THEN** only the check on 2026-10-02 counts

#### Scenario: Beyond target
- **WHEN** a habit KR has target 5 and its habit has 7 check-ins since the start date
- **THEN** progress is 1

#### Scenario: No linked habit
- **WHEN** a habit KR has no linked habit
- **THEN** progress is 0 and the KR shows "No habit linked"

#### Scenario: Updates after check
- **WHEN** the user checks the linked habit on Home
- **THEN** the KR's progress in the Plan tab increases without a reload

### Requirement: Key result page
Every KR SHALL have a page with its own URL showing a header with its title, a progress ring, its current and target value (or done state, or check-ins) and a deadline badge for its effective deadline, its description, the progress controls, the active projects and open tasks linked to it, the habits linked to it, and the log entries recorded on it, newest first. The page SHALL offer Edit and Delete. Tapping a linked item SHALL open its page.

#### Scenario: Open from Plan
- **WHEN** the user taps the KR "Run 100 km" in the Plan tab on a phone
- **THEN** the KR page opens with its progress ring, "40 / 100 km" and its deadline badge, not the edit form

#### Scenario: Linked items
- **WHEN** the active project "Marathon plan" and the open task "Book physio" are linked to the KR
- **THEN** both are listed on the KR page and tapping "Marathon plan" opens its project detail

#### Scenario: Missing KR
- **WHEN** the page of a deleted KR is opened
- **THEN** it says the key result was not found

### Requirement: Progress controls
The KR page SHALL let the user record progress without opening the edit form. For a numeric KR it SHALL offer − and + buttons that lower or raise the current value by the KR's step, and a way to enter the current value directly. For a boolean KR it SHALL offer a done switch. A habit KR SHALL show its check-ins without controls. Changes SHALL be saved immediately and SHALL NOT be limited to the start or target value.

#### Scenario: Plus button
- **WHEN** the numeric KR "Run 100 km" with current value 40 and step 5 is shown and the user taps +
- **THEN** its current value is 45 and its progress ring shows 45%

#### Scenario: Minus button
- **WHEN** the user taps − on a numeric KR with current value 40 and step 1
- **THEN** its current value is 39

#### Scenario: Enter the value
- **WHEN** the user enters 62.5 as the current value
- **THEN** its current value is 62.5

#### Scenario: Boolean done switch
- **WHEN** the user switches on "Done" on the boolean KR "Publish thesis"
- **THEN** its progress is 1

#### Scenario: Habit KR read-only
- **WHEN** a habit KR's page is shown
- **THEN** it shows its check-ins against the target and no − / + buttons or switch

### Requirement: Step size
A numeric KR SHALL have a step, a positive number defaulting to 1, set in the KR form and used by the − / + buttons.

#### Scenario: Default step
- **WHEN** the user creates a numeric KR without changing the step
- **THEN** its step is 1

#### Scenario: Invalid step
- **WHEN** the user enters 0 as the step and saves
- **THEN** the KR is not saved and the step field shows an error
