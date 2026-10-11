# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Settings screen
The app SHALL provide a Settings screen, reachable from a settings button in the top bar of Plan, Home and Review, showing the reminders switch, the default reminder time, the review day and time, the deadline lead time with their current values, an entry to Space images, and an "Account & sync" section (see account and sync).

#### Scenario: Open settings
- **WHEN** the user opens Settings from the Plan tab
- **THEN** the reminders switch, the default reminder time, the review day and time, the deadline lead time, the Space images entry and the "Account & sync" section are shown

#### Scenario: From Home and Review
- **WHEN** the user taps the settings button on Home or on Review
- **THEN** the Settings screen opens, and going back returns to that tab
