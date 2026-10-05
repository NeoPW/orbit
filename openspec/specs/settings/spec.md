# settings Specification

## Purpose

Lets the user adjust how the app reminds and warns them: whether reminders are on, the default reminder time and the deadline lead time. Settings are stored on the device only.

## Requirements

### Requirement: Settings screen
The app SHALL provide a Settings screen, reachable from the Plan tab menu, showing the reminders switch, the default reminder time, the review day and time, and the deadline lead time with their current values.

#### Scenario: Open settings
- **WHEN** the user opens Settings from the Plan tab menu
- **THEN** the reminders switch, the default reminder time, the review day and time and the deadline lead time are shown

### Requirement: Default values
Before the user changes anything, reminders SHALL be on, the default reminder time SHALL be 08:00 and the deadline lead time SHALL be 7 days.

#### Scenario: Fresh install
- **WHEN** the user opens Settings on a new installation
- **THEN** reminders are on, the default reminder time is 08:00 and the lead time is 7 days

### Requirement: Default reminder time
The user SHALL be able to choose the default reminder time with a time picker. It SHALL be shown as `HH:mm`.

#### Scenario: Change default time
- **WHEN** the user picks 07:15 as default reminder time
- **THEN** Settings shows 07:15 and habit reminders without own time use 07:15

### Requirement: Deadline lead time
The user SHALL be able to set the deadline lead time as a whole number of days from 1 to 30. Other values SHALL NOT be saved and the field SHALL show an error.

#### Scenario: Valid lead time
- **WHEN** the user sets the lead time to 3 days
- **THEN** the lead time is saved and Home lists deadlines up to 3 days ahead

#### Scenario: Invalid lead time
- **WHEN** the user enters 0 or 31
- **THEN** the value is not saved and the field shows an error

### Requirement: Settings stored locally
Settings SHALL be stored on the device, SHALL survive an app restart or page reload, and SHALL NOT be part of synced data.

#### Scenario: Restart
- **WHEN** the user sets the lead time to 3 days and restarts the app
- **THEN** the lead time is still 3 days

### Requirement: Reminder settings on web
In the browser the Settings screen SHALL show that reminders are only available on Android instead of the reminders switch; the default reminder time SHALL still be shown and editable, and the lead time SHALL still apply to Home.

#### Scenario: Settings in Chrome
- **WHEN** the user opens Settings in Chrome
- **THEN** a note says that reminders are only available on Android and the lead time can be changed

### Requirement: Review day and time
The user SHALL be able to choose the weekday (Monday to Sunday) and the time of day of the weekly review reminder. The defaults SHALL be Sunday and 18:00. The time SHALL be shown as `HH:mm`.

#### Scenario: Defaults
- **WHEN** the user opens Settings on a new installation
- **THEN** the review day is Sunday and the review time is 18:00

#### Scenario: Change review day
- **WHEN** the user chooses Saturday and 10:00
- **THEN** Settings shows Saturday and 10:00 and the review reminders move to Saturdays at 10:00
