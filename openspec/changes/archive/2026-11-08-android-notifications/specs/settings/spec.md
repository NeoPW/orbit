## ADDED Requirements

### Requirement: Reminder settings on Android
In the Android app the Reminders section of Settings SHALL show the reminders switch, the default reminder time and the deadline lead time, stored on the phone like the other settings (see "Settings stored locally"). It SHALL NOT show the note that reminders are shown by the desktop app, nor the review day and time. When the notification permission is denied, the section SHALL say that notifications are blocked for Orbit in the Android settings.

#### Scenario: Settings on the phone
- **WHEN** the user opens Settings in the Android app
- **THEN** the reminders switch, the default reminder time and the lead time are shown, and no note about the desktop app

#### Scenario: Switch off on one device
- **WHEN** reminders are switched off on the phone and on on the desktop
- **THEN** only the desktop shows habit and deadline reminders
