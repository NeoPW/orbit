# Spec Delta

## MODIFIED Requirements

### Requirement: Reminder time stored
The user SHALL be able to set or clear a reminder time of day for a habit. The habit's reminders are shown at this time (see notifications); without a reminder time the default reminder time from Settings is used.

#### Scenario: Set reminder time
- **WHEN** the user sets a reminder time of 07:30 and saves
- **THEN** the habit shows the reminder time 07:30

#### Scenario: Clear reminder time
- **WHEN** the user clears a habit's reminder time and saves
- **THEN** the habit shows no reminder time and its reminders use the default reminder time
