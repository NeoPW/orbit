## MODIFIED Requirements

### Requirement: Installable Android app
A build for Android SHALL produce an installable app (an APK) named "Orbit" that shows the Orbit icon in the launcher, opens full screen and starts with the same app as the desktop and browser builds. A release build SHALL be signed with the developer's own key when one is configured, and SHALL NOT allow unencrypted (http) network traffic.

#### Scenario: Install and start
- **WHEN** the debug APK is installed on an Android phone and Orbit is started from the launcher
- **THEN** the app opens full screen showing the Home screen, and the launcher entry shows the name "Orbit" with the Orbit icon

#### Scenario: Signed release APK
- **WHEN** a key is configured and the release build is run
- **THEN** the resulting APK is signed with that key and installs on a phone, and Orbit starts as in the debug build

#### Scenario: Release without a key
- **WHEN** no key is configured and the release build is run
- **THEN** the build still completes and produces an unsigned APK

#### Scenario: No http in release
- **WHEN** the release APK tries to reach a server over http
- **THEN** Android blocks the connection; https servers work
