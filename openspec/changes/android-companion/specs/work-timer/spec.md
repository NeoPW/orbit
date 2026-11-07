# Spec Delta

## ADDED Requirements

### Requirement: Focus on the phone
The phone SHALL offer the same focus panel, start actions, running session and stop dialog as the desktop (see "Start a focus session", "Stop a timer" and "Focus panel on Home"). A running session SHALL keep its start time while the app is in the background, the screen is off or the app was closed, and show the correct elapsed time when the app is opened again. Starting a session on the phone SHALL replace a session running on another device after they sync, as there is one timer for all devices.

#### Scenario: Start on the phone
- **WHEN** the user types a task in the focus panel on the phone and starts
- **THEN** a timer for the task runs and focus mode opens full screen

#### Scenario: Screen off
- **WHEN** a session started at 09:00 runs while the phone's screen is off and the app is opened again at 09:40
- **THEN** the timer shows 40 minutes elapsed

#### Scenario: Stop on the phone
- **WHEN** the user stops the session and answers "Drafted chapter 2"
- **THEN** a log entry with that note and the elapsed minutes exists and "Work logged" is shown

#### Scenario: Started on the phone, seen on the desktop
- **WHEN** a session is started on the phone and both devices sync
- **THEN** the desktop shows the same running session with the same start time
