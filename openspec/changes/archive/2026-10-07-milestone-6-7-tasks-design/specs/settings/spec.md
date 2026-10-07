# Spec Delta

## MODIFIED Requirements

### Requirement: Settings screen
The app SHALL provide a Settings screen, reachable from a settings button in the top bar of Plan, Home and Review, showing the reminders switch, the default reminder time, the review day and time, the deadline lead time with their current values, and an "Account & sync" section (see account and sync).

#### Scenario: Open settings
- **WHEN** the user opens Settings from the Plan tab
- **THEN** the reminders switch, the default reminder time, the review day and time, the deadline lead time and the "Account & sync" section are shown

#### Scenario: From Home and Review
- **WHEN** the user taps the settings button on Home or on Review
- **THEN** the Settings screen opens, and going back returns to that tab
