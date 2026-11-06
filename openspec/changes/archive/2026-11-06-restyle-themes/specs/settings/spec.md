# Spec Delta

## MODIFIED Requirements

### Requirement: Settings screen
The app SHALL provide a Settings screen, reachable from the Settings entry of the navigation, with an "Appearance" section showing the colour themes, a "Reminders" section showing the reminders switch, the default reminder time, the review day and time and the deadline lead time with their current values, and a "Sync" section (see account and sync). The Space images entry SHALL be added when the space background exists.

#### Scenario: Open settings
- **WHEN** the user selects Settings in the navigation
- **THEN** the colour themes, the reminders switch, the default reminder time, the review day and time, the deadline lead time and the "Sync" section are shown

#### Scenario: From Home and Review
- **WHEN** the user selects Settings while on Home or on Review
- **THEN** the Settings screen opens, and going back returns to that destination

## ADDED Requirements

### Requirement: Colour theme setting
The Appearance section SHALL show the five themes (see visual-design, "Colour themes") as swatches with their names, mark the current one, and apply a chosen theme at once. The choice SHALL be stored on the device only, SHALL survive a restart and SHALL NOT be part of synced data.

#### Scenario: Choose a theme
- **WHEN** the user chooses Plum in Settings
- **THEN** Plum is marked as chosen and the whole app is shown in Plum

#### Scenario: Not synced
- **WHEN** the user chooses Plum on the desktop
- **THEN** the browser on another device keeps its own theme after syncing
