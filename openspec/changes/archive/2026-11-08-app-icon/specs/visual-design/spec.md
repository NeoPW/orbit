## MODIFIED Requirements

### Requirement: App icon and loading screen
The app icon SHALL be two crossed, tapered rings woven over and under each other, in the app's indigo and off-white, on a dark rounded tile in the colours of the app's ground. It SHALL be used as the desktop app icon, the web icon, the Android launcher icon (round, legacy and adaptive) and the brand mark in the sidebar. The Android status-bar notification icon SHALL be a single-colour version of the crossed rings. While the app loads, the desktop window and the browser page SHALL show the app's dark ground with the icon instead of a white screen.

#### Scenario: Desktop start
- **WHEN** the desktop app is started
- **THEN** the window is dark with the icon until the app is drawn, not white

#### Scenario: Web loading
- **WHEN** the web app is loading
- **THEN** the page shows the app's dark ground and the icon until the app is drawn

#### Scenario: Sidebar brand
- **WHEN** the sidebar is shown
- **THEN** its brand mark is the new icon next to the name "Orbit"

#### Scenario: Android launcher
- **WHEN** the Android app is installed
- **THEN** the launcher shows the crossed rings on the dark ground, inside the adaptive icon's safe zone
