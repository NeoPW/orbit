# Spec Delta

## MODIFIED Requirements

### Requirement: Settings screen
The app SHALL provide a Settings screen, reachable from the Settings entry of the navigation, with a "Reminders" section showing the reminders switch, the default reminder time, the review day and time and the deadline lead time with their current values, and a "Sync" section (see account and sync). The Space images entry SHALL be added when the space background exists.

#### Scenario: Open settings
- **WHEN** the user selects Settings in the navigation
- **THEN** the reminders switch, the default reminder time, the review day and time, the deadline lead time and the "Sync" section are shown

#### Scenario: From Home and Review
- **WHEN** the user selects Settings while on Home or on Review
- **THEN** the Settings screen opens, and going back returns to that destination

### Requirement: Deadline lead time
The user SHALL be able to set the deadline lead time as a whole number of days from 1 to 30. Other values SHALL NOT be saved and the field SHALL show an error. The lead time SHALL decide when deadline badges turn amber (see visual-design) and when deadline reminders start (see notifications).

#### Scenario: Valid lead time
- **WHEN** the user sets the lead time to 3 days
- **THEN** the lead time is saved and deadline badges turn amber from 3 days ahead

#### Scenario: Invalid lead time
- **WHEN** the user enters 0 or 31
- **THEN** the value is not saved and the field shows an error

## ADDED Requirements

### Requirement: Reminder settings in the browser
In the browser the Settings screen SHALL show, instead of the reminders switch, a note that reminders are shown by the desktop app. The default reminder time, the review day and time and the lead time SHALL still be shown and editable, and the lead time SHALL still apply to deadline badges.

#### Scenario: Settings in the browser
- **WHEN** the user opens Settings in Chrome
- **THEN** a note says that reminders are shown by the desktop app and the lead time can be changed

## REMOVED Requirements

### Requirement: Reminder settings on web
**Reason**: Reminders come from the desktop app now, not from Android.
**Migration**: Replaced by "Reminder settings in the browser".
