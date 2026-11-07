## MODIFIED Requirements

### Requirement: Settings screen
The app SHALL provide a Settings screen, reachable from the Settings entry of the navigation, with these sections:
- **Appearance:** the colour themes.
- **Reminders:** the reminders switch, the default reminder time, the review day and time and the deadline lead time, with their current values.
- **Review:** the weekly hour target.
- **Sync** (see account and sync).

The Space images entry SHALL be added when the space background exists.

#### Scenario: Open settings
- **WHEN** the user selects Settings in the navigation
- **THEN** the colour themes, the reminders switch, the default reminder time, the review day and time, the deadline lead time, the weekly hour target and the "Sync" section are shown

#### Scenario: From Home and Review
- **WHEN** the user selects Settings while on Home or on Review
- **THEN** the Settings screen opens, and going back returns to that destination

## ADDED Requirements

### Requirement: Weekly hour target
The user SHALL be able to set a weekly hour target as a whole number of hours from 1 to 168, or leave it empty for no target. It SHALL be empty by default and stored locally like the other settings. The week summary uses it (see week-summary, "Time worked in the week").

#### Scenario: Set a target
- **WHEN** the user enters 20 as the weekly hour target
- **THEN** the target is saved and the week summary shows the total against 20 h

#### Scenario: Clear the target
- **WHEN** the user empties the weekly hour target
- **THEN** no target is set and the week summary shows the total alone

#### Scenario: Invalid value
- **WHEN** the user enters 0 or 200
- **THEN** the value is not saved and the previous target stays
