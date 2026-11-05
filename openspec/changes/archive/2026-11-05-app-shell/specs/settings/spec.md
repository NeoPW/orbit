# Spec Delta

## MODIFIED Requirements

### Requirement: Settings screen
The app SHALL provide a Settings screen, reachable from the Settings entry of the navigation, showing the reminders switch, the default reminder time, the review day and time, the deadline lead time with their current values, an entry to Space images, and a "Sync" section (see account and sync).

#### Scenario: Open settings
- **WHEN** the user selects Settings in the navigation
- **THEN** the reminders switch, the default reminder time, the review day and time, the deadline lead time, the Space images entry and the "Sync" section are shown

#### Scenario: From Home and Review
- **WHEN** the user selects Settings while on Home or on Review
- **THEN** the Settings screen opens, and going back returns to that destination
