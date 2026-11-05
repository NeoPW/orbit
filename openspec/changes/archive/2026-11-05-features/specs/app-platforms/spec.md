# Spec Delta

## ADDED Requirements

### Requirement: Keeps running in the tray
Closing the desktop window SHALL hide it and keep Orbit running with an icon in the system tray, so reminders and the focus timer keep working. Clicking the tray icon or its "Open Orbit" entry SHALL show the window again; its "Quit" entry SHALL end the app. The browser build has no tray.

#### Scenario: Close the window
- **WHEN** the user closes the desktop window
- **THEN** the window disappears and the Orbit icon stays in the tray

#### Scenario: Open again
- **WHEN** the window is hidden and the user clicks the tray icon
- **THEN** the window is shown on the screen it was on, with the same page

#### Scenario: Quit
- **WHEN** the user chooses "Quit" in the tray menu
- **THEN** Orbit ends and the tray icon disappears
