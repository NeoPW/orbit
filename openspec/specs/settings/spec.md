# settings Specification

## Purpose

Lets the user adjust how the app reminds and warns them: whether reminders are on, the default reminder time and the deadline lead time. Settings are stored on the device only.

## Requirements

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
The user SHALL be able to set the deadline lead time as a whole number of days from 1 to 30. Other values SHALL NOT be saved and the field SHALL show an error. The lead time SHALL decide when deadline badges turn amber (see visual-design) and when deadline reminders start (see notifications).

#### Scenario: Valid lead time
- **WHEN** the user sets the lead time to 3 days
- **THEN** the lead time is saved and deadline badges turn amber from 3 days ahead

#### Scenario: Invalid lead time
- **WHEN** the user enters 0 or 31
- **THEN** the value is not saved and the field shows an error

### Requirement: Settings stored locally
Settings SHALL be stored on the device, SHALL survive an app restart or page reload, and SHALL NOT be part of synced data.

#### Scenario: Restart
- **WHEN** the user sets the lead time to 3 days and restarts the app
- **THEN** the lead time is still 3 days

### Requirement: Reminder settings in the browser
In the browser the Settings screen SHALL show, instead of the reminders switch, a note that reminders are shown by the desktop app. The default reminder time, the review day and time and the lead time SHALL still be shown and editable, and the lead time SHALL still apply to deadline badges.

#### Scenario: Settings in the browser
- **WHEN** the user opens Settings in Chrome
- **THEN** a note says that reminders are shown by the desktop app and the lead time can be changed

### Requirement: Review day and time
The user SHALL be able to choose the weekday (Monday to Sunday) and the time of day of the weekly review reminder. The defaults SHALL be Sunday and 18:00. The time SHALL be shown as `HH:mm`.

#### Scenario: Defaults
- **WHEN** the user opens Settings on a new installation
- **THEN** the review day is Sunday and the review time is 18:00

#### Scenario: Change review day
- **WHEN** the user chooses Saturday and 10:00
- **THEN** Settings shows Saturday and 10:00 and the review reminders move to Saturdays at 10:00

### Requirement: Space images
Settings SHALL link to a Space images screen listing every bundled background photo with its title and credit, and the license note (CC BY 4.0). The user SHALL be able to pin a photo, which is then shown on every day, or choose "A new image every day" (the default), which also shows today's photo. The choice SHALL be stored on the device only.

#### Scenario: Credits shown
- **WHEN** the user opens Space images
- **THEN** each photo is shown with its title and full credit, and the CC BY 4.0 note is shown

#### Scenario: Pin a photo
- **WHEN** the user taps "Pillars of Creation"
- **THEN** it is marked as chosen and every screen shows it as background, also on the following days

#### Scenario: Back to daily
- **WHEN** the user chooses "A new image every day"
- **THEN** no photo is pinned and the background follows the date again

### Requirement: Colour theme setting
The Appearance section SHALL show the five themes (see visual-design, "Colour themes") as swatches with their names, mark the current one, and apply a chosen theme at once. The choice SHALL be stored on the device only, SHALL survive a restart and SHALL NOT be part of synced data.

#### Scenario: Choose a theme
- **WHEN** the user chooses Plum in Settings
- **THEN** Plum is marked as chosen and the whole app is shown in Plum

#### Scenario: Not synced
- **WHEN** the user chooses Plum on the desktop
- **THEN** the browser on another device keeps its own theme after syncing

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
