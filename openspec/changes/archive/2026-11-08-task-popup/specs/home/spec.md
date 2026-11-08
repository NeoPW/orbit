## ADDED Requirements

### Requirement: Open tasks on Home
Clicking a task in To do, in Done today or among the next steps of a project card on Home SHALL open it in the task popup (see tasks, "Task popup"). Home SHALL stay selected behind it.

#### Scenario: Open from To do
- **WHEN** the user clicks "Rerun benchmarks" in To do
- **THEN** the popup of "Rerun benchmarks" opens over Home and the Home tab stays selected

#### Scenario: From a project card
- **WHEN** the user clicks the next step "Case study copy" in the card of "Portfolio site"
- **THEN** the popup of "Case study copy" opens

#### Scenario: Complete moves it to Done today
- **WHEN** the user completes a task in its popup on Home
- **THEN** the task moves from To do to Done today behind the popup
