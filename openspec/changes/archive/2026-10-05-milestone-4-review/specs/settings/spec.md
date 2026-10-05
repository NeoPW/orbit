# Spec Delta

## ADDED Requirements

### Requirement: Review day and time
The user SHALL be able to choose the weekday (Monday to Sunday) and the time of day of the weekly review reminder. The defaults SHALL be Sunday and 18:00. The time SHALL be shown as `HH:mm`.

#### Scenario: Defaults
- **WHEN** the user opens Settings on a new installation
- **THEN** the review day is Sunday and the review time is 18:00

#### Scenario: Change review day
- **WHEN** the user chooses Saturday and 10:00
- **THEN** Settings shows Saturday and 10:00 and the review reminders move to Saturdays at 10:00

## MODIFIED Requirements

### Requirement: Settings screen
The app SHALL provide a Settings screen, reachable from the Plan tab menu, showing the reminders switch, the default reminder time, the review day and time, and the deadline lead time with their current values.

#### Scenario: Open settings
- **WHEN** the user opens Settings from the Plan tab menu
- **THEN** the reminders switch, the default reminder time, the review day and time and the deadline lead time are shown
