# Spec Delta

## MODIFIED Requirements

### Requirement: End of a focus session
When a running focus session's worked time reaches its time limit (see work-timer, "Time limit"), the desktop app SHALL show a notification with what the session runs for and the limit, whatever the reminders switch, and the app SHALL play a short sound, also in the browser. The timer SHALL keep running. A paused session SHALL NOT reach its limit; a limit set at or below the worked time SHALL give no notification.

#### Scenario: 25 minutes over
- **WHEN** a session for "Thesis" with a 25-minute limit reaches 25 minutes worked
- **THEN** a notification "Thesis: 25 minutes done" is shown, a sound plays and the timer goes on into overtime

#### Scenario: Limit after a pause
- **WHEN** a session with a 30-minute limit logged 20 minutes, was paused and is resumed at 11:00
- **THEN** the notification and sound come at 11:10

#### Scenario: Open-ended session
- **WHEN** a session without a time limit runs for 2 hours
- **THEN** no notification or sound comes

#### Scenario: Limit already passed
- **WHEN** the user sets a 15-minute limit on a session with 20 minutes worked
- **THEN** no notification or sound comes and the timer shows 5 minutes overtime
